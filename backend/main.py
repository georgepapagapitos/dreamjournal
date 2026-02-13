from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List
import sqlite3
import json
import os
from datetime import datetime
from pathlib import Path

app = FastAPI(title="Dream Journal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.getenv("DB_PATH", "/data/dreams.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS dreams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            body TEXT NOT NULL,
            mood TEXT,
            lucidity INTEGER,
            sleep_quality INTEGER,
            tags TEXT DEFAULT '[]',
            dream_date TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        )
    """)
    conn.commit()
    conn.close()

init_db()


class DreamCreate(BaseModel):
    title: Optional[str] = None
    body: str
    mood: Optional[str] = None
    lucidity: Optional[int] = None
    sleep_quality: Optional[int] = None
    tags: Optional[List[str]] = []
    dream_date: Optional[str] = None


class DreamUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    mood: Optional[str] = None
    lucidity: Optional[int] = None
    sleep_quality: Optional[int] = None
    tags: Optional[List[str]] = None
    dream_date: Optional[str] = None


def row_to_dict(row):
    d = dict(row)
    d["tags"] = json.loads(d.get("tags") or "[]")
    return d


@app.get("/api/dreams")
def list_dreams(
    search: Optional[str] = Query(None),
    mood: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    limit: int = Query(50),
    offset: int = Query(0),
):
    conn = get_db()
    query = "SELECT * FROM dreams WHERE 1=1"
    params = []

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


@app.get("/api/dreams/{dream_id}")
def get_dream(dream_id: int):
    conn = get_db()
    row = conn.execute("SELECT * FROM dreams WHERE id = ?", (dream_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Dream not found")
    return row_to_dict(row)


@app.post("/api/dreams", status_code=201)
def create_dream(dream: DreamCreate):
    conn = get_db()
    now = datetime.utcnow().isoformat()
    dream_date = dream.dream_date or datetime.utcnow().strftime("%Y-%m-%d")
    cursor = conn.execute(
        """INSERT INTO dreams (title, body, mood, lucidity, sleep_quality, tags, dream_date, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
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


@app.put("/api/dreams/{dream_id}")
def update_dream(dream_id: int, dream: DreamUpdate):
    conn = get_db()
    existing = conn.execute("SELECT * FROM dreams WHERE id = ?", (dream_id,)).fetchone()
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
    params.append(datetime.utcnow().isoformat())
    params.append(dream_id)

    conn.execute(f"UPDATE dreams SET {', '.join(fields)} WHERE id = ?", params)
    conn.commit()
    row = conn.execute("SELECT * FROM dreams WHERE id = ?", (dream_id,)).fetchone()
    conn.close()
    return row_to_dict(row)


@app.delete("/api/dreams/{dream_id}", status_code=204)
def delete_dream(dream_id: int):
    conn = get_db()
    existing = conn.execute("SELECT * FROM dreams WHERE id = ?", (dream_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Dream not found")
    conn.execute("DELETE FROM dreams WHERE id = ?", (dream_id,))
    conn.commit()
    conn.close()


@app.get("/api/tags")
def list_tags():
    conn = get_db()
    rows = conn.execute("SELECT tags FROM dreams").fetchall()
    conn.close()
    all_tags = set()
    for row in rows:
        tags = json.loads(row["tags"] or "[]")
        all_tags.update(tags)
    return sorted(list(all_tags))


@app.get("/api/stats")
def get_stats():
    conn = get_db()
    total = conn.execute("SELECT COUNT(*) as c FROM dreams").fetchone()["c"]
    moods = conn.execute(
        "SELECT mood, COUNT(*) as c FROM dreams WHERE mood IS NOT NULL GROUP BY mood"
    ).fetchall()
    avg_lucidity = conn.execute(
        "SELECT AVG(lucidity) as a FROM dreams WHERE lucidity IS NOT NULL"
    ).fetchone()["a"]
    conn.close()
    return {
        "total": total,
        "moods": {r["mood"]: r["c"] for r in moods},
        "avg_lucidity": round(avg_lucidity, 1) if avg_lucidity else None,
    }


# Serve React frontend
frontend_path = Path("/app/frontend/dist")
if frontend_path.exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_path / "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        index = frontend_path / "index.html"
        return FileResponse(str(index))
