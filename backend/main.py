from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import sqlite3
import json
import os
from datetime import datetime
from pathlib import Path
from backend.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user_id,
)

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

    # Create users table
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        )
    """
    )

    # Create dreams table with user_id
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS dreams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT,
            body TEXT NOT NULL,
            mood TEXT,
            lucidity INTEGER,
            sleep_quality INTEGER,
            tags TEXT DEFAULT '[]',
            dream_date TEXT,
            is_public INTEGER DEFAULT 0,
            share_token TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """
    )

    # Create indexes
    conn.execute("CREATE INDEX IF NOT EXISTS idx_dreams_user_id ON dreams(user_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)")

    conn.commit()
    conn.close()


init_db()


# ============================================================================
# Models
# ============================================================================


class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


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
    if "tags" in d:
        d["tags"] = json.loads(d.get("tags") or "[]")
    return d


# ============================================================================
# Auth Endpoints
# ============================================================================


@app.post("/api/auth/register")
def register(user: UserRegister):
    conn = get_db()

    # Check if email exists
    existing = conn.execute(
        "SELECT id FROM users WHERE email = ?", (user.email,)
    ).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check if username exists
    existing = conn.execute(
        "SELECT id FROM users WHERE username = ?", (user.username,)
    ).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Username already taken")

    # Validate username (alphanumeric, 3-20 chars)
    if (
        not user.username.replace("_", "").replace("-", "").isalnum()
        or len(user.username) < 3
        or len(user.username) > 20
    ):
        conn.close()
        raise HTTPException(
            status_code=400,
            detail="Username must be 3-20 characters, alphanumeric with _ or -",
        )

    # Validate password (min 8 chars)
    if len(user.password) < 8:
        conn.close()
        raise HTTPException(
            status_code=400, detail="Password must be at least 8 characters"
        )

    # Create user
    password_hash = get_password_hash(user.password)
    now = datetime.utcnow().isoformat()

    cursor = conn.execute(
        "INSERT INTO users (email, username, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        (user.email, user.username, password_hash, now, now),
    )
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()

    # Create token
    access_token = create_access_token(data={"user_id": user_id})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": user.email,
            "username": user.username,
        },
    }


@app.post("/api/auth/login")
def login(credentials: UserLogin):
    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE email = ?", (credentials.email,)
    ).fetchone()
    conn.close()

    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    access_token = create_access_token(data={"user_id": user["id"]})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "username": user["username"],
        },
    }


@app.get("/api/auth/me")
def get_current_user(user_id: int = Depends(get_current_user_id)):
    conn = get_db()
    user = conn.execute(
        "SELECT id, email, username, created_at FROM users WHERE id = ?", (user_id,)
    ).fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return row_to_dict(user)


# ============================================================================
# Dream Endpoints (Protected)
# ============================================================================


@app.get("/api/dreams")
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


@app.get("/api/dreams/{dream_id}")
def get_dream(dream_id: int, user_id: int = Depends(get_current_user_id)):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM dreams WHERE id = ? AND user_id = ?", (dream_id, user_id)
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Dream not found")
    return row_to_dict(row)


@app.post("/api/dreams", status_code=201)
def create_dream(dream: DreamCreate, user_id: int = Depends(get_current_user_id)):
    conn = get_db()
    now = datetime.utcnow().isoformat()
    dream_date = dream.dream_date or datetime.utcnow().strftime("%Y-%m-%d")
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


@app.put("/api/dreams/{dream_id}")
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
    params.append(datetime.utcnow().isoformat())
    params.append(dream_id)
    params.append(user_id)

    conn.execute(
        f"UPDATE dreams SET {', '.join(fields)} WHERE id = ? AND user_id = ?", params
    )
    conn.commit()
    row = conn.execute("SELECT * FROM dreams WHERE id = ?", (dream_id,)).fetchone()
    conn.close()
    return row_to_dict(row)


@app.delete("/api/dreams/{dream_id}", status_code=204)
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


@app.get("/api/tags")
def list_tags(user_id: int = Depends(get_current_user_id)):
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


@app.get("/api/stats")
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


@app.get("/api/backup")
def backup_dreams(user_id: int = Depends(get_current_user_id)):
    """Export all dreams as JSON"""
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM dreams WHERE user_id = ? ORDER BY created_at DESC", (user_id,)
    ).fetchall()
    conn.close()
    dreams = [row_to_dict(r) for r in rows]

    backup = {
        "export_date": datetime.utcnow().isoformat(),
        "version": "1.0",
        "total_dreams": len(dreams),
        "dreams": dreams,
    }

    return JSONResponse(
        content=backup,
        headers={
            "Content-Disposition": f"attachment; filename=dream-journal-backup-{datetime.utcnow().strftime('%Y%m%d')}.json"
        },
    )


# Serve React frontend
frontend_path = Path("/app/frontend/dist")
if frontend_path.exists():
    app.mount(
        "/assets", StaticFiles(directory=str(frontend_path / "assets")), name="assets"
    )

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        index = frontend_path / "index.html"
        return FileResponse(str(index))
