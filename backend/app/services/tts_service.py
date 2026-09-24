import re
import urllib.parse
from collections import OrderedDict
from typing import List, Optional
import httpx
from app.core.logging import logger

# In-memory LRU cache: maps cache_key -> bytes
_TTS_CACHE: OrderedDict[str, bytes] = OrderedDict()
_MAX_CACHE_ENTRIES = 150


def clean_text_for_tts(text: str) -> str:
    """
    Strips markdown formatting, HTML tags, code blocks, URLs, and noisy emojis
    for clear, natural speech synthesis in Bengali, Hindi, or English.
    """
    if not text:
        return ""

    # Replace markdown links [label](url) with label
    s = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
    # Remove code blocks and inline code
    s = re.sub(r'```[\s\S]*?```', '', s)
    s = re.sub(r'`([^`]+)`', r'\1', s)
    # Remove markdown headers (# Title)
    s = re.sub(r'^#+\s+', '', s, flags=re.MULTILINE)
    # Remove bullets and list numbers
    s = re.sub(r'^\s*[-*•▪]\s+', '', s, flags=re.MULTILINE)
    s = re.sub(r'^\s*\d+\.\s+', '', s, flags=re.MULTILINE)
    # Remove formatting symbols like *, _, |
    s = re.sub(r'\*{1,3}', '', s)
    s = re.sub(r'_+', ' ', s)
    s = re.sub(r'\|+', ' ', s)
    # Remove emoji ranges
    s = re.sub(r'[\U00010000-\U0010ffff]', '', s)
    # Collapse multiple whitespaces and trim
    s = re.sub(r'[ \t]+', ' ', s)
    s = re.sub(r'\n+', '\n', s).strip()
    return s


def chunk_text_for_tts(text: str, max_chars: int = 140) -> List[str]:
    """
    Splits text into natural sentence/clause chunks under max_chars
    to respect Google TTS query length limits without cutting words.
    Supports Bengali Dari (।), Hindi Purna Viram (।), periods, question marks, and commas.
    """
    if not text:
        return []

    # Delimiters: Bengali/Devanagari danda, period, exclamation, question mark, newline
    delimiters = r'([।\.\?!;\n]+)'
    raw_segments = re.split(delimiters, text)

    combined_segments: List[str] = []
    i = 0
    while i < len(raw_segments):
        seg = raw_segments[i]
        punct = raw_segments[i + 1] if i + 1 < len(raw_segments) else ""
        full = (seg + punct).strip()
        if full:
            combined_segments.append(full)
        i += 2

    # Group small segments into chunks up to max_chars
    chunks: List[str] = []
    current_chunk = ""

    for seg in combined_segments:
        if len(current_chunk) + len(seg) + 1 <= max_chars:
            current_chunk = f"{current_chunk} {seg}".strip() if current_chunk else seg
        else:
            if current_chunk:
                chunks.append(current_chunk)
            if len(seg) <= max_chars:
                current_chunk = seg
            else:
                # If a single sentence exceeds max_chars, split by commas or words
                comma_parts = seg.split(",")
                sub_chunk = ""
                for cp in comma_parts:
                    part_with_comma = (cp + ",").strip()
                    if len(sub_chunk) + len(part_with_comma) + 1 <= max_chars:
                        sub_chunk = f"{sub_chunk} {part_with_comma}".strip() if sub_chunk else part_with_comma
                    else:
                        if sub_chunk:
                            chunks.append(sub_chunk.rstrip(","))
                        sub_chunk = part_with_comma
                if sub_chunk:
                    chunks.append(sub_chunk.rstrip(","))
                current_chunk = ""

    if current_chunk:
        chunks.append(current_chunk)

    return chunks or [text[:max_chars]]


class TTSService:
    """
    High-fidelity Text-to-Speech audio synthesizer supporting:
    - Bengali ('bn', 'bn-IN')
    - Hindi ('hi', 'hi-IN')
    - English ('en', 'en-IN')
    Produces standard audio/mpeg MP3 byte streams compatible with HTML5 Audio and mobile Capacitor.
    """

    def __init__(self):
        self.headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.9,hi;q=0.8,bn;q=0.7",
        }

    def _map_language(self, lang: str) -> str:
        l = (lang or "").lower().strip()
        if l.startswith("bn") or "bengali" in l or "bangla" in l:
            return "bn"
        if l.startswith("hi") or "hindi" in l:
            return "hi"
        return "en-IN"

    def synthesize(self, text: str, language: str = "en") -> bytes:
        clean = clean_text_for_tts(text)
        if not clean:
            return b""

        lang_code = self._map_language(language)
        cache_key = f"{lang_code}:{clean[:160]}:{len(clean)}"

        if cache_key in _TTS_CACHE:
            # Move to end for LRU
            _TTS_CACHE.move_to_end(cache_key)
            return _TTS_CACHE[cache_key]

        chunks = chunk_text_for_tts(clean, max_chars=130)
        logger.info(f"Synthesizing TTS audio: lang={lang_code}, chunks={len(chunks)}, text_length={len(clean)}")

        audio_buffer = bytearray()

        try:
            with httpx.Client(timeout=10.0, headers=self.headers, follow_redirects=True) as client:
                for chunk in chunks:
                    params = {
                        "ie": "UTF-8",
                        "tl": lang_code,
                        "client": "tw-ob",
                        "q": chunk,
                    }
                    resp = client.get("https://translate.google.com/translate_tts", params=params)
                    if resp.status_code == 200 and resp.content:
                        audio_buffer.extend(resp.content)
                    else:
                        logger.warning(f"TTS chunk fetch returned status {resp.status_code} for chunk: {chunk[:30]}")

            audio_bytes = bytes(audio_buffer)

            # Store in LRU cache
            if audio_bytes:
                if len(_TTS_CACHE) >= _MAX_CACHE_ENTRIES:
                    _TTS_CACHE.popitem(last=False)
                _TTS_CACHE[cache_key] = audio_bytes

            return audio_bytes

        except Exception as e:
            logger.error(f"TTS synthesis failure for lang {lang_code}: {e}")
            return bytes(audio_buffer)


tts_service = TTSService()
