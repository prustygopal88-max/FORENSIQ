from fastapi import APIRouter, HTTPException, status
from datetime import datetime, timezone
from app.models.schemas import LoginRequest, RegisterRequest
from app.database.db import get_connection, hash_password, verify_password, record_forensic_event
from app.config import DEFAULT_MACHINE

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register")
def register_user(req: RegisterRequest):
    conn = get_connection()
    cursor = conn.cursor()

    username = req.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="Username cannot be empty")

    cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
    if cursor.fetchone():
        # Update existing user's password for convenience in live demo
        pwd_hash, salt = hash_password(req.password)
        cursor.execute("UPDATE users SET password_hash = ?, salt = ?, role = ? WHERE username = ?", 
                       (pwd_hash, salt, req.role or "investigator", username))
        conn.commit()
        conn.close()
        return {"success": True, "message": f"Demo account '{username}' password updated successfully"}

    pwd_hash, salt = hash_password(req.password)
    now_str = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
    INSERT INTO users (username, password_hash, salt, role, created_at)
    VALUES (?, ?, ?, ?, ?)
    """, (username, pwd_hash, salt, req.role or "investigator", now_str))
    conn.commit()
    conn.close()

    return {"success": True, "message": f"Demo account '{username}' created successfully"}

@router.post("/login")
def login_user(req: LoginRequest):
    username = req.username.strip()
    password = req.password
    machine = req.machine or DEFAULT_MACHINE

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user_row = cursor.fetchone()
    conn.close()

    is_authenticated = False
    role = "investigator"

    if user_row:
        stored_hash = user_row["password_hash"]
        salt = user_row["salt"]
        role = user_row["role"]
        if verify_password(password, stored_hash, salt):
            is_authenticated = True

    if not is_authenticated:
        # AUTOMATICALLY GENERATE REAL FORENSIC EVENT IN DATABASE
        event = record_forensic_event(
            event_type="authentication",
            action="FAILED_LOGIN",
            status="FAILED",
            user=username or "UNKNOWN",
            machine=machine,
            source="Application Login",
            metadata={
                "failure_reason": "Invalid credentials",
                "client_ip": "127.0.0.1",
                "auth_method": "Password",
                "live_demo": True
            },
            dataset_label="Live Authentication"
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "message": "Authentication failed: invalid credentials",
                "forensic_event": event
            }
        )

    # AUTOMATICALLY GENERATE SUCCESS FORENSIC EVENT IN DATABASE
    event = record_forensic_event(
        event_type="authentication",
        action="SUCCESSFUL_LOGIN",
        status="SUCCESS",
        user=username,
        machine=machine,
        source="Application Login",
        metadata={
            "client_ip": "127.0.0.1",
            "auth_method": "Password",
            "session_token": f"token-{int(datetime.now().timestamp())}",
            "live_demo": True
        },
        dataset_label="Live Authentication"
    )

    return {
        "success": True,
        "message": "Authentication successful",
        "user": username,
        "role": role,
        "forensic_event": event
    }

@router.get("/users")
def list_demo_users():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, role, created_at FROM users ORDER BY id ASC")
    users = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return {"users": users}
