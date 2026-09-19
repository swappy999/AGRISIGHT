import time
import redis
from app.core.config import settings
from app.core.logging import logger

class APIRateLimiter:
    def __init__(self):
        self.redis_client = None
        self.enabled = False
        try:
            if settings.REDIS_URL and "localhost" not in settings.REDIS_URL:
                self.redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
                self.redis_client.ping()
                self.enabled = True
                logger.info("Redis initialized for rate limiting.")
            else:
                logger.warning("Local/Invalid REDIS_URL. Rate limiting disabled.")
        except Exception as e:
            logger.warning(f"Failed to connect to Redis. Rate limiting disabled. Error: {str(e)}")

    def check_limit(self, user_id: str, endpoint: str, limit: int = 20, window: int = 60) -> bool:
        """
        Returns True if allowed, False if limit exceeded.
        """
        if not self.enabled or not self.redis_client:
            return True

        key = f"rate_limit:{user_id}:{endpoint}"
        current_time = time.time()
        
        pipe = self.redis_client.pipeline()
        # Clean up old entries
        pipe.zremrangebyscore(key, 0, current_time - window)
        pipe.zcard(key)
        pipe.zadd(key, {str(current_time): current_time})
        pipe.expire(key, window)
        
        results = pipe.execute()
        req_count = results[1]
        
        if req_count >= limit:
            return False
        return True

rate_limiter = APIRateLimiter()
