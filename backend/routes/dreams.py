import json
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from backend.auth import get_current_user_id
from backend.database import get_db
from backend.models import DreamCreate, DreamUpdate
from backend.utils import row_to_dict

router = APIRouter(prefix="/api/dreams", tags=["dreams"])


@router.get("")
def list_dreams(
    user_id: int = Depends(get_current_user_id),
    search: Optional[str] = Query(None),
    mood: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    limit: int = Query(50),
    offset: int = Query(0),
):
    conn = get_db()
    query = "SELECT * FROM dreams WHERE user_id = ?"
    params = [user_id]

    if search:
        query += " AND (title LIKE ? OR body LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])
    if mood:
        query += " AND mood = ?"
        params.append(mood)
    if tag:
        query += " AND tags LIKE ?"
        params.append(f'%"{tag}"%')

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [row_to_dict(r) for r in rows]


@router.get("/{dream_id}")
def get_dream(dream_id: int, user_id: int = Depends(get_current_user_id)):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM dreams WHERE id = ? AND user_id = ?", (dream_id, user_id)
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Dream not found")
    return row_to_dict(row)


@router.post("", status_code=201)
def create_dream(dream: DreamCreate, user_id: int = Depends(get_current_user_id)):
    conn = get_db()
    now = datetime.now(timezone.utc).isoformat()
    dream_date = dream.dream_date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    cursor = conn.execute(
        """INSERT INTO dreams (user_id, title, body, mood, lucidity, sleep_quality, tags, dream_date, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            user_id,
            dream.title,
            dream.body,
            dream.mood,
            dream.lucidity,
            dream.sleep_quality,
            json.dumps(dream.tags or []),
            dream_date,
            now,
            now,
        ),
    )
    conn.commit()
    new_id = cursor.lastrowid
    row = conn.execute("SELECT * FROM dreams WHERE id = ?", (new_id,)).fetchone()
    conn.close()
    return row_to_dict(row)


@router.put("/{dream_id}")
def update_dream(
    dream_id: int, dream: DreamUpdate, user_id: int = Depends(get_current_user_id)
):
    conn = get_db()
    existing = conn.execute(
        "SELECT * FROM dreams WHERE id = ? AND user_id = ?", (dream_id, user_id)
    ).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Dream not found")

    fields = []
    params = []
    for field, value in dream.model_dump(exclude_none=True).items():
        if field == "tags":
            value = json.dumps(value)
        fields.append(f"{field} = ?")
        params.append(value)

    if not fields:
        conn.close()
        return row_to_dict(existing)

    fields.append("updated_at = ?")
    params.append(datetime.now(timezone.utc).isoformat())
    params.append(dream_id)
    params.append(user_id)

    conn.execute(
        f"UPDATE dreams SET {', '.join(fields)} WHERE id = ? AND user_id = ?", params
    )
    conn.commit()
    row = conn.execute("SELECT * FROM dreams WHERE id = ?", (dream_id,)).fetchone()
    conn.close()
    return row_to_dict(row)


@router.delete("/{dream_id}", status_code=204)
def delete_dream(dream_id: int, user_id: int = Depends(get_current_user_id)):
    conn = get_db()
    existing = conn.execute(
        "SELECT * FROM dreams WHERE id = ? AND user_id = ?", (dream_id, user_id)
    ).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Dream not found")
    conn.execute("DELETE FROM dreams WHERE id = ? AND user_id = ?", (dream_id, user_id))
    conn.commit()
    conn.close()
