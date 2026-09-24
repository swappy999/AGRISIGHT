from fastapi import APIRouter, Query, Response, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.tts_service import tts_service
from app.core.logging import logger

router = APIRouter()


class TTSRequest(BaseModel):
    text: str
    language: str = "en"
    lang: Optional[str] = None


@router.get("/tts")
async def get_tts_audio(
    text: str = Query(..., description="Text to synthesize to speech"),
    lang: str = Query("en", description="Target language code: 'bn', 'hi', or 'en'"),
    language: Optional[str] = Query(None, description="Alternative language parameter")
):
    target_lang = language or lang or "en"
    clean_text = text.strip()
    if not clean_text:
        raise HTTPException(status_code=400, detail="Empty text parameter")

    try:
        audio_bytes = tts_service.synthesize(clean_text, target_lang)
        if not audio_bytes:
            raise HTTPException(status_code=502, detail="Failed to synthesize audio for given text")

        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "Content-Type": "audio/mpeg",
                "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
                "Accept-Ranges": "bytes",
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"TTS endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tts")
async def post_tts_audio(payload: TTSRequest):
    target_lang = payload.language or payload.lang or "en"
    clean_text = payload.text.strip()
    if not clean_text:
        raise HTTPException(status_code=400, detail="Empty text in payload")

    try:
        audio_bytes = tts_service.synthesize(clean_text, target_lang)
        if not audio_bytes:
            raise HTTPException(status_code=502, detail="Failed to synthesize audio for given text")

        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "Content-Type": "audio/mpeg",
                "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
                "Accept-Ranges": "bytes",
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"TTS POST endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
