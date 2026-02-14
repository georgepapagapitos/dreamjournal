from pydantic import BaseModel, EmailStr
from typing import Optional, List


# Auth models
class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class UsernameChange(BaseModel):
    username: str


# Dream models
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
