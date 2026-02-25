from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class ChatMessageCreate(BaseModel):
    content: str
    is_admin: bool = False

class ChatMessage(BaseModel):
    id: str
    session_id: str
    content: str
    is_admin: bool
    timestamp: str

class ChatSessionCreate(BaseModel):
    customer_name: str
    customer_email: EmailStr

class ChatSession(BaseModel):
    id: str
    customer_name: str
    customer_email: str
    status: str = "active" # active, closed
    created_at: str
    updated_at: str
    last_message: Optional[str] = None
    unread_admin: int = 0
    messages: List[ChatMessage] = []
