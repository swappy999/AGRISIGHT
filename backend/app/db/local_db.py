import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional, Dict, Any
from app.core.logging import logger

DB_PATH = Path(__file__).resolve().parent.parent.parent / "agrisight_local.db"


def _get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_local_db():
    """Ensure local SQLite fallback tables exist."""
    try:
        conn = _get_connection()
        cur = conn.cursor()

        # Fields table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS fields (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                location_name TEXT DEFAULT '',
                latitude REAL DEFAULT 22.57,
                longitude REAL DEFAULT 88.36,
                area_acres REAL DEFAULT 1.0,
                soil_type TEXT DEFAULT 'Alluvial',
                irrigation_type TEXT DEFAULT 'Drip',
                notes TEXT DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)

        # Interventions table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS interventions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                action_type TEXT DEFAULT 'Inspection',
                action_title TEXT NOT NULL,
                crop_id TEXT DEFAULT '',
                field_id TEXT DEFAULT '',
                notes TEXT DEFAULT '',
                performed_at TEXT DEFAULT '',
                created_at TEXT NOT NULL
            )
        """)

        # Analyses table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS analyses (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                image_url TEXT NOT NULL,
                disease TEXT DEFAULT 'Healthy Plant',
                severity TEXT DEFAULT 'Low',
                result_json TEXT NOT NULL,
                crop_id TEXT DEFAULT '',
                field_id TEXT DEFAULT '',
                created_at TEXT NOT NULL
            )
        """)

        # Crops table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS crops (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                variety TEXT DEFAULT '',
                planting_date TEXT DEFAULT '',
                growth_stage TEXT DEFAULT 'Vegetative',
                field_name TEXT DEFAULT '',
                field_id TEXT DEFAULT '',
                notes TEXT DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)

        conn.commit()
        conn.close()
        logger.info(f"Local SQLite fallback DB initialized at {DB_PATH}")
    except Exception as e:
        logger.error(f"Failed to initialize local SQLite DB: {e}")


# Initialize on import
init_local_db()


class LocalDB:
    # ── Fields ─────────────────────────────────────────────────────────────
    @staticmethod
    def list_fields(user_id: str) -> List[Dict[str, Any]]:
        conn = _get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM fields WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return rows

    @staticmethod
    def get_field(field_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        conn = _get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM fields WHERE id = ? AND user_id = ?", (field_id, user_id))
        row = cur.fetchone()
        conn.close()
        return dict(row) if row else None

    @staticmethod
    def create_field(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        conn = _get_connection()
        cur = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()
        field_id = str(uuid.uuid4())

        record = {
            "id": field_id,
            "user_id": user_id,
            "name": (data.get("name") or "New Field").strip(),
            "location_name": (data.get("location_name") or "").strip(),
            "latitude": float(data.get("latitude") or 22.57),
            "longitude": float(data.get("longitude") or 88.36),
            "area_acres": max(0.1, float(data.get("area_acres") or 1.0)),
            "soil_type": (data.get("soil_type") or "Alluvial").strip(),
            "irrigation_type": (data.get("irrigation_type") or "Drip").strip(),
            "notes": (data.get("notes") or "").strip(),
            "created_at": now,
            "updated_at": now,
        }

        cur.execute("""
            INSERT INTO fields (id, user_id, name, location_name, latitude, longitude, area_acres, soil_type, irrigation_type, notes, created_at, updated_at)
            VALUES (:id, :user_id, :name, :location_name, :latitude, :longitude, :area_acres, :soil_type, :irrigation_type, :notes, :created_at, :updated_at)
        """, record)
        conn.commit()
        conn.close()
        return record

    @staticmethod
    def update_field(field_id: str, user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        conn = _get_connection()
        cur = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()
        updates["updated_at"] = now

        set_clause = ", ".join([f"{k} = :{k}" for k in updates.keys()])
        updates["field_id"] = field_id
        updates["user_id"] = user_id

        cur.execute(f"UPDATE fields SET {set_clause} WHERE id = :field_id AND user_id = :user_id", updates)
        conn.commit()

        cur.execute("SELECT * FROM fields WHERE id = ? AND user_id = ?", (field_id, user_id))
        row = cur.fetchone()
        conn.close()
        return dict(row) if row else None

    @staticmethod
    def delete_field(field_id: str, user_id: str) -> bool:
        conn = _get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM fields WHERE id = ? AND user_id = ?", (field_id, user_id))
        deleted = cur.rowcount > 0
        conn.commit()
        conn.close()
        return deleted

    # ── Interventions ───────────────────────────────────────────────────────
    @staticmethod
    def list_interventions(user_id: str, crop_id: Optional[str] = None, field_id: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = _get_connection()
        cur = conn.cursor()
        query = "SELECT * FROM interventions WHERE user_id = ?"
        params = [user_id]
        if crop_id:
            query += " AND crop_id = ?"
            params.append(crop_id)
        if field_id:
            query += " AND field_id = ?"
            params.append(field_id)
        query += " ORDER BY created_at DESC"

        cur.execute(query, params)
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return rows

    @staticmethod
    def create_intervention(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        conn = _get_connection()
        cur = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()
        item_id = str(uuid.uuid4())

        record = {
            "id": item_id,
            "user_id": user_id,
            "action_type": data.get("action_type") or "Inspection",
            "action_title": data.get("action_title") or "Field Action",
            "crop_id": data.get("crop_id") or "",
            "field_id": data.get("field_id") or "",
            "notes": data.get("notes") or "",
            "performed_at": data.get("performed_at") or now[:10],
            "created_at": now,
        }

        cur.execute("""
            INSERT INTO interventions (id, user_id, action_type, action_title, crop_id, field_id, notes, performed_at, created_at)
            VALUES (:id, :user_id, :action_type, :action_title, :crop_id, :field_id, :notes, :performed_at, :created_at)
        """, record)
        conn.commit()
        conn.close()
        return record

    # ── Analyses ────────────────────────────────────────────────────────────
    @staticmethod
    def list_analyses(user_id: str) -> List[Dict[str, Any]]:
        import json
        conn = _get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM analyses WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
        rows = []
        for r in cur.fetchall():
            item = dict(r)
            try:
                item["result_json"] = json.loads(item["result_json"])
            except Exception:
                pass
            rows.append(item)
        conn.close()
        return rows

    @staticmethod
    def get_analysis(analysis_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        import json
        conn = _get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM analyses WHERE id = ?", (analysis_id,))
        row = cur.fetchone()
        conn.close()
        if not row:
            return None
        item = dict(row)
        try:
            item["result_json"] = json.loads(item["result_json"])
        except Exception:
            pass
        return item

    @staticmethod
    def create_analysis(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        import json
        conn = _get_connection()
        cur = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()
        record_id = data.get("id") or str(uuid.uuid4())

        result_raw = data.get("result_json")
        result_str = json.dumps(result_raw) if isinstance(result_raw, (dict, list)) else str(result_raw or "{}")

        record = {
            "id": record_id,
            "user_id": user_id,
            "image_url": data.get("image_url") or "",
            "disease": data.get("disease") or "Healthy Plant",
            "severity": data.get("severity") or "Low",
            "result_json": result_str,
            "crop_id": data.get("crop_id") or "",
            "field_id": data.get("field_id") or "",
            "created_at": now,
        }

        cur.execute("""
            INSERT OR REPLACE INTO analyses (id, user_id, image_url, disease, severity, result_json, crop_id, field_id, created_at)
            VALUES (:id, :user_id, :image_url, :disease, :severity, :result_json, :crop_id, :field_id, :created_at)
        """, record)
        conn.commit()
        conn.close()
        record["result_json"] = result_raw
        return record

    # ── Crops ───────────────────────────────────────────────────────────────
    @staticmethod
    def list_crops(user_id: str) -> List[Dict[str, Any]]:
        conn = _get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM crops WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
        rows = [dict(r) for r in cur.fetchall()]

        # If user has no crops yet, seed a few realistic default crops
        if not rows:
            now = datetime.now(timezone.utc).isoformat()
            default_crops = [
                {
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "name": "Wheat (गेहूं)",
                    "variety": "Sharbati Gold",
                    "planting_date": "2026-01-15",
                    "growth_stage": "Tillering",
                    "field_name": "North Field",
                    "field_id": "",
                    "notes": "Optimal irrigation, monitoring tillering stage.",
                    "created_at": now,
                    "updated_at": now,
                },
                {
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "name": "Rice (ধান)",
                    "variety": "Swarna Masuri",
                    "planting_date": "2026-02-01",
                    "growth_stage": "Vegetative",
                    "field_name": "East Terraces",
                    "field_id": "",
                    "notes": "Healthy canopy, water level maintained at 5cm.",
                    "created_at": now,
                    "updated_at": now,
                },
                {
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "name": "Tomato (टमाटर)",
                    "variety": "Pusa Ruby",
                    "planting_date": "2026-02-20",
                    "growth_stage": "Flowering",
                    "field_name": "Polyhouse Block B",
                    "field_id": "",
                    "notes": "Staking completed, preventive neem oil spray applied.",
                    "created_at": now,
                    "updated_at": now,
                },
            ]
            for c in default_crops:
                cur.execute("""
                    INSERT INTO crops (id, user_id, name, variety, planting_date, growth_stage, field_name, field_id, notes, created_at, updated_at)
                    VALUES (:id, :user_id, :name, :variety, :planting_date, :growth_stage, :field_name, :field_id, :notes, :created_at, :updated_at)
                """, c)
            conn.commit()
            rows = default_crops

        conn.close()
        return rows

    @staticmethod
    def get_crop(crop_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        conn = _get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM crops WHERE id = ? AND user_id = ?", (crop_id, user_id))
        row = cur.fetchone()
        conn.close()
        return dict(row) if row else None

    @staticmethod
    def create_crop(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        conn = _get_connection()
        cur = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()
        crop_id = data.get("id") or str(uuid.uuid4())
        record = {
            "id": crop_id,
            "user_id": user_id,
            "name": data.get("name") or "Unnamed Crop",
            "variety": data.get("variety") or "",
            "planting_date": data.get("planting_date") or "",
            "growth_stage": data.get("growth_stage") or "Vegetative",
            "field_name": data.get("field_name") or "",
            "field_id": data.get("field_id") or "",
            "notes": data.get("notes") or "",
            "created_at": now,
            "updated_at": now,
        }
        cur.execute("""
            INSERT INTO crops (id, user_id, name, variety, planting_date, growth_stage, field_name, field_id, notes, created_at, updated_at)
            VALUES (:id, :user_id, :name, :variety, :planting_date, :growth_stage, :field_name, :field_id, :notes, :created_at, :updated_at)
        """, record)
        conn.commit()
        conn.close()
        return record

    @staticmethod
    def update_crop(crop_id: str, user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        conn = _get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM crops WHERE id = ? AND user_id = ?", (crop_id, user_id))
        row = cur.fetchone()
        if not row:
            conn.close()
            return None

        current = dict(row)
        current.update(updates)
        current["updated_at"] = datetime.now(timezone.utc).isoformat()

        cur.execute("""
            UPDATE crops SET
                name = :name,
                variety = :variety,
                planting_date = :planting_date,
                growth_stage = :growth_stage,
                field_name = :field_name,
                field_id = :field_id,
                notes = :notes,
                updated_at = :updated_at
            WHERE id = :id AND user_id = :user_id
        """, current)
        conn.commit()
        conn.close()
        return current

    @staticmethod
    def delete_crop(crop_id: str, user_id: str) -> bool:
        conn = _get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM crops WHERE id = ? AND user_id = ?", (crop_id, user_id))
        deleted = cur.rowcount > 0
        conn.commit()
        conn.close()
        return deleted


local_db = LocalDB()
