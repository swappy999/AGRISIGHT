from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
from app.core.config import settings
from app.core.logging import logger
from app.utils.exceptions import global_exception_handler, AppBaseException
from app.api.routes import auth, analysis, notifications, crops, assistant, fields, interventions, risk, intelligence, officer, expert, tts
from app.api.routes.analysis import ensure_bucket_exists
from app.db.supabase import get_supabase

def get_application() -> FastAPI:
    app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

    # Configure CORS: support environment domains + native mobile schemes
    raw_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()] if settings.CORS_ORIGINS else ["*"]
    if "*" not in raw_origins:
        for native_o in ["https://localhost", "capacitor://localhost", "http://localhost"]:
            if native_o not in raw_origins:
                raw_origins.append(native_o)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=raw_origins,
        allow_origin_regex=r".*" if "*" in raw_origins else None,
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
    app.include_router(tts.router, tags=["tts"])

    # Serve uploaded scan photos locally
    uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

    @app.get("/ping")
    @app.get("/health")
    async def health_check():
        return {"status": "ok", "service": "agrisight-api", "version": settings.VERSION}

    @app.get("/app-version")
    async def get_app_version():
        return {
            "latestVersion": "1.2.0",
            "latestVersionCode": 3,
            "minSupportedVersionCode": 1,
            "releaseNotes": "Enhanced crop vs non-crop discrimination, Gemini Cloud & Local AI unified integration.",
            "downloadUrl": "https://agrisight-kn5u.onrender.com/download/app-debug.apk"
        }

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

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", settings.PORT))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
