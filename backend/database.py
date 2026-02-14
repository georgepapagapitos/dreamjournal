import sqlite3
import os
from pathlib import Path

DB_PATH = os.getenv("DB_PATH", "/data/dreams.db")


def get_db():
    """Get database connection with Row factory"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize database tables and indexes"""
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
