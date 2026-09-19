from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
from app.core.config import settings
from app.core.logging import logger
from app.utils.exceptions import global_exception_handler, AppBaseException
from app.api.routes import auth, analysis, notifications, crops, assistant, fields, interventions, risk, intelligence, officer, expert
from app.api.routes.analysis import ensure_bucket_exists
from app.db.supabase import get_supabase

def get_application() -> FastAPI:
    app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_origin_regex=r".*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register custom exception handler
    app.add_exception_handler(Exception, global_exception_handler)
    app.add_exception_handler(AppBaseException, global_exception_handler)

    # Include routes
    app.include_router(auth.router, prefix="/auth", tags=["auth"])
    app.include_router(analysis.router, tags=["analysis"])
    app.include_router(crops.router, tags=["crops"])
    app.include_router(fields.router, tags=["fields"])
    app.include_router(interventions.router, tags=["interventions"])
    app.include_router(risk.router, tags=["risk"])
    app.include_router(intelligence.router)
    app.include_router(officer.router)
    app.include_router(expert.router)
    app.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
    app.include_router(assistant.router, tags=["assistant"])

    # Serve uploaded scan photos locally
    uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

    @app.get("/ping")
    @app.get("/health")
    async def health_check():
        return {"status": "success", "data": "pong", "error": None}

    @app.on_event("startup")
    async def startup_event():
        logger.info("Running startup tasks...")
        try:
            sb = get_supabase()
            await ensure_bucket_exists(sb)
        except Exception as e:
            logger.warning(f"Startup bucket check skipped (network unavailable?): {e}")

    logger.info("FastAPI backend initialized successfully")
    return app

app = get_application()
