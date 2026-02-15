import json
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from backend.auth import get_current_user_id
from backend.database import get_db
from backend.utils import row_to_dict

router = APIRouter(prefix="/api", tags=["stats"])


@router.get("/stats")
def get_stats(user_id: int = Depends(get_current_user_id)):
    conn = get_db()
    total = conn.execute(
        "SELECT COUNT(*) as c FROM dreams WHERE user_id = ?", (user_id,)
    ).fetchone()["c"]
    moods = conn.execute(
        "SELECT mood, COUNT(*) as c FROM dreams WHERE user_id = ? AND mood IS NOT NULL GROUP BY mood",
        (user_id,),
    ).fetchall()
    avg_lucidity = conn.execute(
        "SELECT AVG(lucidity) as a FROM dreams WHERE user_id = ? AND lucidity IS NOT NULL",
        (user_id,),
    ).fetchone()["a"]
    conn.close()
    return {
        "total": total,
        "moods": {r["mood"]: r["c"] for r in moods},
        "avg_lucidity": round(avg_lucidity, 1) if avg_lucidity else None,
    }


@router.get("/stats/detailed")
def get_detailed_stats(user_id: int = Depends(get_current_user_id)):
    """Get detailed statistics for dashboard"""
    conn = get_db()

    # Basic counts
    total = conn.execute(
        "SELECT COUNT(*) as c FROM dreams WHERE user_id = ?", (user_id,)
    ).fetchone()["c"]

    # Dreams by month (last 12 months)
    dreams_by_month = conn.execute(
        """
        SELECT 
            strftime('%Y-%m', dream_date) as month,
            COUNT(*) as count,
            AVG(lucidity) as avg_lucidity
        FROM dreams 
        WHERE user_id = ? 
            AND dream_date >= date('now', '-12 months')
        GROUP BY month
        ORDER BY month
        """,
        (user_id,),
    ).fetchall()

    # Dreams by day of week
    dreams_by_dow = conn.execute(
        """
        SELECT 
            CASE CAST(strftime('%w', dream_date) AS INTEGER)
                WHEN 0 THEN 'Sunday'
                WHEN 1 THEN 'Monday'
                WHEN 2 THEN 'Tuesday'
                WHEN 3 THEN 'Wednesday'
                WHEN 4 THEN 'Thursday'
                WHEN 5 THEN 'Friday'
                WHEN 6 THEN 'Saturday'
            END as day_name,
            COUNT(*) as count
        FROM dreams 
        WHERE user_id = ?
        GROUP BY strftime('%w', dream_date)
        ORDER BY strftime('%w', dream_date)
        """,
        (user_id,),
    ).fetchall()

    # Mood distribution
    mood_dist = conn.execute(
        """
        SELECT mood, COUNT(*) as count
        FROM dreams 
        WHERE user_id = ? AND mood IS NOT NULL
        GROUP BY mood
        ORDER BY count DESC
        """,
        (user_id,),
    ).fetchall()

    # Top tags
    all_tags = conn.execute(
        "SELECT tags FROM dreams WHERE user_id = ?", (user_id,)
    ).fetchall()
    tag_counts = {}
    for row in all_tags:
        tags = json.loads(row["tags"] or "[]")
        for tag in tags:
            tag_counts[tag] = tag_counts.get(tag, 0) + 1
    top_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:10]

    # Lucidity over time
    lucidity_trend = conn.execute(
        """
        SELECT 
            strftime('%Y-%m', dream_date) as month,
            AVG(lucidity) as avg_lucidity
        FROM dreams 
        WHERE user_id = ? 
            AND lucidity IS NOT NULL
            AND dream_date >= date('now', '-12 months')
        GROUP BY month
        ORDER BY month
        """,
        (user_id,),
    ).fetchall()

    # Current streak
    recent_dreams = conn.execute(
        """
        SELECT dream_date 
        FROM dreams 
        WHERE user_id = ?
        ORDER BY dream_date DESC
        LIMIT 100
        """,
        (user_id,),
    ).fetchall()

    streak = 0
    if recent_dreams:
        dates = [datetime.fromisoformat(r["dream_date"]) for r in recent_dreams]
        dates.sort(reverse=True)

        current_date = datetime.now().date()
        for i, dream_date in enumerate(dates):
            expected_date = current_date - timedelta(days=i)
            if dream_date.date() == expected_date or (
                i == 0 and dream_date.date() == current_date - timedelta(days=1)
            ):
                streak += 1
            else:
                break

    conn.close()

    return {
        "total_dreams": total,
        "dreams_by_month": [
            {
                "month": r["month"],
                "count": r["count"],
                "avg_lucidity": r["avg_lucidity"],
            }
            for r in dreams_by_month
        ],
        "dreams_by_day": [
            {"day": r["day_name"], "count": r["count"]} for r in dreams_by_dow
        ],
        "mood_distribution": [
            {"mood": r["mood"], "count": r["count"]} for r in mood_dist
        ],
        "top_tags": [{"tag": tag, "count": count} for tag, count in top_tags],
        "lucidity_trend": [
            {
                "month": r["month"],
                "avg_lucidity": round(r["avg_lucidity"], 1) if r["avg_lucidity"] else 0,
            }
            for r in lucidity_trend
        ],
        "current_streak": streak,
    }


@router.get("/backup")
def backup_dreams(user_id: int = Depends(get_current_user_id)):
    """Export all dreams as JSON"""
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM dreams WHERE user_id = ? ORDER BY created_at DESC", (user_id,)
    ).fetchall()
    conn.close()
    dreams = [row_to_dict(r) for r in rows]

    backup = {
        "export_date": datetime.now(timezone.utc).isoformat(),
        "version": "1.0",
        "total_dreams": len(dreams),
        "dreams": dreams,
    }

    return JSONResponse(
        content=backup,
        headers={
            "Content-Disposition": f"attachment; filename=dream-journal-backup-{datetime.now(timezone.utc).strftime('%Y%m%d')}.json"
        },
    )


@router.post("/import")
async def import_dreams(
    user_id: int = Depends(get_current_user_id), file: UploadFile = File(...)
):
    """Import dreams from JSON backup"""
    try:
        # Read and parse JSON
        content = await file.read()
        data = json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file")

    # Validate backup format (outside the try block so HTTPException isn't caught)
    if not isinstance(data, dict) or "dreams" not in data:
        raise HTTPException(status_code=400, detail="Invalid backup file format")

    dreams_data = data["dreams"]
    if not isinstance(dreams_data, list):
        raise HTTPException(status_code=400, detail="Invalid backup file format")

    try:
        conn = get_db()
        imported = 0
        skipped = 0
        errors = 0

        for dream in dreams_data:
            try:
                # Check if dream already exists (by created_at timestamp)
                existing = conn.execute(
                    "SELECT id FROM dreams WHERE user_id = ? AND created_at = ?",
                    (user_id, dream.get("created_at")),
                ).fetchone()

                if existing:
                    skipped += 1
                    continue

                # Import the dream
                conn.execute(
                    """INSERT INTO dreams (user_id, title, body, mood, lucidity, sleep_quality, tags, dream_date, created_at, updated_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        user_id,
                        dream.get("title"),
                        dream.get("body", ""),
                        dream.get("mood"),
                        dream.get("lucidity"),
                        dream.get("sleep_quality"),
                        (
                            dream.get("tags")
                            if isinstance(dream.get("tags"), str)
                            else json.dumps(dream.get("tags", []))
                        ),
                        dream.get("dream_date"),
                        dream.get("created_at", datetime.now(timezone.utc).isoformat()),
                        dream.get("updated_at", datetime.now(timezone.utc).isoformat()),
                    ),
                )
                imported += 1
            except Exception as e:
                print(f"Error importing dream: {e}")
                errors += 1
                continue

        conn.commit()
        conn.close()

        return {
            "success": True,
            "imported": imported,
            "skipped": skipped,
            "errors": errors,
            "total": len(dreams_data),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")


@router.get("/tags")
def list_tags(user_id: int = Depends(get_current_user_id)):
    """Get all unique tags - kept at /api/tags for backward compatibility"""
    conn = get_db()
    rows = conn.execute(
        "SELECT tags FROM dreams WHERE user_id = ?", (user_id,)
    ).fetchall()
    conn.close()
    all_tags = set()
    for row in rows:
        tags = json.loads(row["tags"] or "[]")
        all_tags.update(tags)
    return sorted(list(all_tags))
