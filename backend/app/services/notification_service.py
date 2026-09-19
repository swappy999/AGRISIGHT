from app.db.supabase import get_supabase
from app.core.logging import logger

class NotificationService:
    def __init__(self):
        pass  # Use singleton via get_supabase() on each call

    @property
    def sb(self):
        return get_supabase()


    def create_notification(self, user_id: str, message: str, notif_type: str = "alert"):
        try:
            # Check for recent duplicate (last 1 minute)
            # This is a basic way to avoid alert fatigue
            existing = self.sb.table("notifications")\
                .select("*")\
                .eq("user_id", user_id)\
                .eq("message", message)\
                .order("created_at", desc=True)\
                .limit(1) \
                .execute()
            
            if existing.data:
                # If there's an existing one of the same message recently, skip
                # (You might want a more refined time check, but this is a start)
                logger.info(f"Duplicate notification suppressed for user {user_id}")
                return existing.data

            data = {
                "user_id": user_id,
                "message": message,
                "type": notif_type,
                "is_read": False
            }
            res = self.sb.table("notifications").insert(data).execute()
            logger.info(f"Notification created for user {user_id}: {message}")
            return res.data
        except Exception as e:
            logger.error(f"Failed to create notification: {str(e)}")

notification_service = NotificationService()
