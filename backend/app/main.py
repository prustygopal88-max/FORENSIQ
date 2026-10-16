from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

import os
from app.database.db import init_db
from app.database.seed_data import seed_database
from app.agent.host_agent import host_agent
from app.api import auth, investigate, events, simulate, cases, dashboard, agent, simulate_email

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and seed baseline forensic events
    init_db()
    seed_database()
    # Start Windows host monitoring agent automatically in background unless disabled
    if os.environ.get("DISABLE_HOST_AGENT", "").lower() not in ("1", "true", "yes"):
        try:
            host_agent.start()
        except Exception as e:
            print(f"Warning starting host agent in lifespan: {e}")
    yield
    # Clean up host agent on server shutdown
    try:
        host_agent.stop()
    except Exception:
        pass

app = FastAPI(
    title="FORENSIQ API",
    description="NLP-Based Digital Forensic Investigation & Temporal Query System",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth.router, prefix="/api")
app.include_router(investigate.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(simulate.router, prefix="/api")
app.include_router(simulate_email.router, prefix="/api")
app.include_router(cases.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(agent.router, prefix="/api")

@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")

@app.get("/api/health")
def health_check():
    agent_status = host_agent.get_status()
    return {
        "status": "online",
        "product": "FORENSIQ",
        "engine": "NLP-Based Digital Forensic Investigation System",
        "database": "SQLite (Active)",
        "host_agent": {
            "active": agent_status["is_running"],
            "monitored_drives": agent_status["monitored_drives"]
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
