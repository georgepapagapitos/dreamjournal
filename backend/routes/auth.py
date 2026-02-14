from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from backend.database import get_db
from backend.models import UserRegister, UserLogin, PasswordChange, UsernameChange
from backend.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user_id,
)
from ..utils import row_to_dict

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register")
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


@router.post("/login")
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


@router.get("/me")
def get_current_user(user_id: int = Depends(get_current_user_id)):
    conn = get_db()
    user = conn.execute(
        "SELECT id, email, username, created_at FROM users WHERE id = ?", (user_id,)
    ).fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return row_to_dict(user)


@router.put("/change-password")
def change_password(data: PasswordChange, user_id: int = Depends(get_current_user_id)):
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

    if not user or not verify_password(data.current_password, user["password_hash"]):
        conn.close()
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    if len(data.new_password) < 8:
        conn.close()
        raise HTTPException(
            status_code=400, detail="New password must be at least 8 characters"
        )

    new_hash = get_password_hash(data.new_password)
    now = datetime.utcnow().isoformat()

    conn.execute(
        "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
        (new_hash, now, user_id),
    )
    conn.commit()
    conn.close()

    return {"success": True, "message": "Password changed successfully"}


@router.put("/change-username")
def change_username(data: UsernameChange, user_id: int = Depends(get_current_user_id)):
    conn = get_db()

    # Validate username
    if (
        not data.username.replace("_", "").replace("-", "").isalnum()
        or len(data.username) < 3
        or len(data.username) > 20
    ):
        conn.close()
        raise HTTPException(
            status_code=400,
            detail="Username must be 3-20 characters, alphanumeric with _ or - only",
        )

    # Check if username is taken
    existing = conn.execute(
        "SELECT id FROM users WHERE username = ? AND id != ?", (data.username, user_id)
    ).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Username already taken")

    now = datetime.utcnow().isoformat()
    conn.execute(
        "UPDATE users SET username = ?, updated_at = ? WHERE id = ?",
        (data.username, now, user_id),
    )
    conn.commit()

    # Get updated user
    user = conn.execute(
        "SELECT id, email, username, created_at FROM users WHERE id = ?", (user_id,)
    ).fetchone()
    conn.close()

    return row_to_dict(user)


@router.delete("/delete-account")
def delete_account(user_id: int = Depends(get_current_user_id)):
    conn = get_db()

    # Delete all user's dreams first (cascade should handle this, but being explicit)
    conn.execute("DELETE FROM dreams WHERE user_id = ?", (user_id,))

    # Delete user
    conn.execute("DELETE FROM users WHERE id = ?", (user_id,))

    conn.commit()
    conn.close()

    return {"success": True, "message": "Account deleted successfully"}
