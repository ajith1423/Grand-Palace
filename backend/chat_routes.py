import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Depends
from typing import Dict, List, Any
import uuid
import datetime
from bson import ObjectId

from chat_models import ChatSessionCreate, ChatMessageCreate, ChatSession, ChatMessage
from models import AdminRole

router = APIRouter(prefix="/api/chat", tags=["chat"])
logger = logging.getLogger(__name__)

def get_db():
    import server
    return server.db

# In-memory session manager
class ConnectionManager:
    def __init__(self):
        # Format: {"session_id": [websocket1, websocket2]}
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Track master admin connections
        self.admin_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket, session_id: str = None):
        await websocket.accept()
        if session_id:
            if session_id not in self.active_connections:
                self.active_connections[session_id] = []
            self.active_connections[session_id].append(websocket)
        else:
            self.admin_connections.append(websocket)

    def disconnect(self, websocket: WebSocket, session_id: str = None):
        if session_id:
            if session_id in self.active_connections:
                self.active_connections[session_id].remove(websocket)
                if not self.active_connections[session_id]:
                    del self.active_connections[session_id]
        else:
            if websocket in self.admin_connections:
                self.admin_connections.remove(websocket)

    async def broadcast_to_session(self, message: dict, session_id: str):
        # Send to specific session's users
        if session_id in self.active_connections:
            for connection in self.active_connections[session_id]:
                await connection.send_json(message)
        
        # Also always broadcast all valid messages to all connected admins
        for admin in self.admin_connections:
            await admin.send_json({"type": "session_message", "session_id": session_id, "data": message})
            
    async def notify_admins(self, message: dict):
        for admin in self.admin_connections:
            await admin.send_json(message)

manager = ConnectionManager()


@router.post("/sessions", response_model=ChatSession)
async def create_chat_session(session: ChatSessionCreate):
    """Creates a new chat session from the storefront"""
    existing_session = await get_db().chat_sessions.find_one({"customer_email": session.customer_email, "status": "active"})
    
    if existing_session:
        existing_session['_id'] = str(existing_session['_id'])
        existing_session['id'] = existing_session.pop('_id')
        return existing_session
        
    doc = {
        "customer_name": session.customer_name,
        "customer_email": session.customer_email,
        "status": "active",
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "unread_admin": 0,
        "last_message": "New Chat Started",
        "messages": []
    }
    
    result = await get_db().chat_sessions.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    
    # Notify admins about new session
    await manager.notify_admins({"type": "new_session", "data": doc})
    
    return doc

@router.get("/sessions")
async def get_active_sessions():
    """Gets all active sessions for Admin View"""
    cursor = get_db().chat_sessions.find({"status": "active"}).sort("updated_at", -1)
    sessions = await cursor.to_list(length=100)
    for s in sessions:
        s["id"] = str(s["_id"])
        s.pop("_id")
    return sessions

@router.get("/sessions/{session_id}")
async def get_session_details(session_id: str):
    """Gets all messages for a specific session"""
    session = await get_db().chat_sessions.find_one({"_id": ObjectId(session_id)})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session["id"] = str(session["_id"])
    session.pop("_id")
    
    # Mark as read if admin is fetching
    if session["unread_admin"] > 0:
        await get_db().chat_sessions.update_one({"_id": ObjectId(session_id)}, {"$set": {"unread_admin": 0}})
        
    return session

@router.websocket("/ws/{client_id}/{session_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str, session_id: str):
    """Websocket connection for storefront clients"""
    await manager.connect(websocket, session_id)
    try:
        while True:
            data = await websocket.receive_text()
            
            # Save to Database
            msg_doc = {
                "id": str(uuid.uuid4()),
                "session_id": session_id,
                "content": data,
                "is_admin": False,
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
            
            await get_db().chat_sessions.update_one(
                {"_id": ObjectId(session_id)},
                {
                    "$push": {"messages": msg_doc},
                    "$set": {
                        "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                        "last_message": data
                    },
                    "$inc": {"unread_admin": 1}
                }
            )
            
            # Broadcast to session and admins
            await manager.broadcast_to_session(msg_doc, session_id)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)

@router.websocket("/ws/admin/{client_id}")
async def admin_websocket_endpoint(websocket: WebSocket, client_id: str):
    """Websocket connection for Admin Panel"""
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "admin_reply":
                session_id = data.get("session_id")
                content = data.get("content")
                
                # Save to Database
                msg_doc = {
                    "id": str(uuid.uuid4()),
                    "session_id": session_id,
                    "content": content,
                    "is_admin": True,
                    "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
                }
                
                await get_db().chat_sessions.update_one(
                    {"_id": ObjectId(session_id)},
                    {
                        "$push": {"messages": msg_doc},
                        "$set": {
                            "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                            "last_message": f"Admin: {content[:20]}..."
                        }
                    }
                )
                
                # Broadcast back to session so customer sees it instantly
                await manager.broadcast_to_session(msg_doc, session_id)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
