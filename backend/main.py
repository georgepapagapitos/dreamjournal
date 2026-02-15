from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.database import init_db
from backend.routes import auth, dreams, stats

# Initialize FastAPI app
app = FastAPI(title="Dream Journal API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
init_db()

# Include routers
app.include_router(auth.router)
app.include_router(dreams.router)
app.include_router(stats.router)

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
