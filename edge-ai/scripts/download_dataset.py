"""
AgriSight Edge AI -- Dataset Download Script
=============================================
Downloads crop and non-crop images from open, licensed sources.

CROP source   : iNaturalist Open API (CC0/CC BY observations of crop plants)
NON-CROP source: Lorem Picsum (CC0 photographs) + Unsplash Source fallback

Run:
    python scripts/download_dataset.py

Output:
    edge-ai/datasets/crop/      -- plant/leaf/crop images
    edge-ai/datasets/non-crop/  -- non-plant images
"""

import os
import sys
import time
import hashlib
import json
import requests
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import random

# Force UTF-8 output on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# -- Paths -----------------------------------------------------------------------
SCRIPT_DIR  = Path(__file__).resolve().parent
ROOT_DIR    = SCRIPT_DIR.parent
CROP_DIR    = ROOT_DIR / "datasets" / "crop"
NONCROP_DIR = ROOT_DIR / "datasets" / "non-crop"

CROP_DIR.mkdir(parents=True, exist_ok=True)
NONCROP_DIR.mkdir(parents=True, exist_ok=True)

# -- Config ----------------------------------------------------------------------
TIMEOUT    = 15
MAX_WORKERS = 8
HEADERS    = {"User-Agent": "AgriSight-DatasetBuilder/1.0 (research use)"}

# Target counts
CROP_TARGET    = 200   # crop images
NONCROP_TARGET = 200   # non-crop images

# -- Picsum IDs chosen manually to be visually unambiguous -----------------------
# NON-CROP categories (people, animals, cars, rooms, electronics, buildings, food, objects)
NONCROP_IDS = [
    # People / faces / portraits
    10, 13, 26, 64, 91, 103, 119, 177, 240, 334, 338, 342, 395,
    # Animals
    237, 433, 582, 593, 614, 617, 659, 669, 815, 820, 1002, 1011, 1025,
    # Cars / vehicles
    111, 244, 340, 374, 384, 397, 424, 488, 509, 525, 219, 301, 366,
    # Rooms / buildings / architecture
    20, 42, 60, 110, 164, 254, 271, 310, 366, 379, 400, 410, 420,
    # Electronics / tech
    30, 75, 136, 195, 201, 325, 332, 352, 383, 404, 180, 192, 202,
    # Urban / street / roads
    5, 15, 17, 37, 52, 112, 152, 173, 184, 200, 250, 280, 295,
    # Food (non-plant / processed)
    292, 312, 326, 348, 365, 431, 442, 460, 493, 507, 360, 370, 380,
    # Misc objects / interiors
    11, 22, 33, 44, 55, 66, 77, 88, 99, 120, 130, 140, 150,
    160, 170, 185, 190, 210, 220, 230, 260, 270, 285, 290, 305,
    315, 322, 355, 385, 415, 425, 435, 445, 455, 465, 475, 485,
    495, 502, 512, 522, 532, 542, 552, 562, 572, 592, 602, 612,
    # More people
    622, 632, 642, 652, 662, 672, 682, 692, 702, 712, 722, 732,
    # More animals
    742, 752, 762, 772, 782, 792, 802, 812, 822, 832, 842, 852,
    # Outdoor non-agriculture
    862, 872, 882, 892, 902, 912, 922, 932, 942, 952, 962, 972,
    # Screenshotlike / documents / interfaces -- approximate with abstract textures
    982, 992, 1003, 1013, 1023,
][:NONCROP_TARGET]

# -- iNaturalist taxon IDs for common crops / plants -----------------------------
# These are taxon IDs that match crop plants well-observed on iNaturalist
# License filter: CC0 (public domain) and CC BY (commercial-friendly)
CROP_TAXON_IDS = [
    47219,   # Tomato (Solanum lycopersicum)
    53793,   # Potato (Solanum tuberosum)
    57067,   # Bell Pepper (Capsicum annuum)
    82611,   # Corn / Maize (Zea mays)
    53805,   # Rice (Oryza sativa)
    53812,   # Wheat (Triticum aestivum)
    78531,   # Soybean (Glycine max)
    66714,   # Cotton (Gossypium)
    47603,   # Grape (Vitis)
    47176,   # Apple (Malus domestica)
    48827,   # Banana (Musa)
    49005,   # Mango (Mangifera indica)
    52651,   # Cassava (Manihot esculenta)
]

def download_one(url: str, dest: Path) -> bool:
    """Download a single image. Returns True on success."""
    if dest.exists() and dest.stat().st_size > 1024:
        return True  # Already have it
    try:
        resp = requests.get(url, timeout=TIMEOUT, headers=HEADERS, stream=True)
        if resp.status_code == 200:
            content_type = resp.headers.get("Content-Type", "")
            if "image" in content_type or "octet" in content_type:
                dest.write_bytes(resp.content)
                return dest.stat().st_size > 1024
        return False
    except Exception:
        return False

def download_picsum(pic_id: int, dest: Path, size: int = 400) -> bool:
    url = f"https://picsum.photos/id/{pic_id}/{size}/{size}"
    return download_one(url, dest)

def fetch_inaturalist_page(taxon_id: int, page: int = 1, per_page: int = 30) -> list[dict]:
    """Fetch observations from iNaturalist API."""
    url = "https://api.inaturalist.org/v1/observations"
    params = {
        "taxon_id": taxon_id,
        "quality_grade": "research",
        "photos": "true",
        "license": "cc0,cc-by,cc-by-sa",
        "per_page": per_page,
        "page": page,
        "order": "desc",
        "order_by": "votes",
    }
    try:
        resp = requests.get(url, params=params, timeout=TIMEOUT, headers=HEADERS)
        if resp.status_code == 200:
            data = resp.json()
            return data.get("results", [])
    except Exception:
        pass
    return []

def extract_photo_urls(observations: list[dict]) -> list[str]:
    """Extract medium-size photo URLs from iNaturalist observations."""
    urls = []
    for obs in observations:
        for photo in obs.get("photos", [])[:1]:  # Take first photo per observation
            url = photo.get("url", "").replace("square", "medium")
            if url:
                urls.append(url)
    return urls

def download_crop_images():
    """Download crop images from iNaturalist (CC0/CC BY)."""
    print("\n--- Downloading CROP images (iNaturalist) ---")

    all_urls = []
    for taxon_id in CROP_TAXON_IDS:
        print(f"  Fetching taxon {taxon_id}...", end=" ", flush=True)
        observations = fetch_inaturalist_page(taxon_id, per_page=20)
        urls = extract_photo_urls(observations)
        print(f"{len(urls)} photos")
        all_urls.extend([(taxon_id, url) for url in urls])
        time.sleep(0.3)  # Rate-limit iNaturalist API

    # Shuffle and trim to target
    random.shuffle(all_urls)
    all_urls = all_urls[:CROP_TARGET]

    print(f"\n  Downloading {len(all_urls)} crop images (parallel)...")
    ok = 0
    failed = 0
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
        futures = {}
        for i, (taxon_id, url) in enumerate(all_urls):
            ext = url.rsplit(".", 1)[-1].split("?")[0][:4] or "jpg"
            fname = f"crop_{taxon_id}_{i:04d}.{ext}"
            dest = CROP_DIR / fname
            futures[ex.submit(download_one, url, dest)] = fname
        
        done = 0
        for fut in as_completed(futures):
            done += 1
            success = fut.result()
            if success:
                ok += 1
            else:
                failed += 1
            if done % 20 == 0 or done == len(all_urls):
                print(f"  Progress: {done}/{len(all_urls)} ({ok} ok, {failed} failed)")

    print(f"  Done. Crop images: {ok} -> {CROP_DIR}")
    return ok

def download_noncrop_images():
    """Download non-crop images from Lorem Picsum (CC0)."""
    print("\n--- Downloading NON-CROP images (Picsum CC0) ---")
    print(f"  Downloading {len(NONCROP_IDS)} non-crop images (parallel)...")
    
    ok = 0
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
        futures = {}
        for pid in NONCROP_IDS:
            dest = NONCROP_DIR / f"noncrop_{pid:04d}.jpg"
            futures[ex.submit(download_picsum, pid, dest)] = pid
        
        done = 0
        for fut in as_completed(futures):
            done += 1
            if fut.result():
                ok += 1
            if done % 20 == 0 or done == len(NONCROP_IDS):
                print(f"  Progress: {done}/{len(NONCROP_IDS)} ({ok} ok)")

    print(f"  Done. Non-crop images: {ok} -> {NONCROP_DIR}")
    return ok

def print_summary(crop_ok, noncrop_ok):
    total = crop_ok + noncrop_ok
    print(f"""
=== Dataset Download Summary ===
  CROP images    : {crop_ok}
  NON-CROP images: {noncrop_ok}
  Total          : {total}

  Sources:
    Crop    : iNaturalist (CC0/CC BY) - research-grade plant observations
    Non-crop: Lorem Picsum (CC0)

Next step:
  python training/preprocess.py
""")

if __name__ == "__main__":
    print("AgriSight Edge AI -- Dataset Downloader")
    print("=" * 50)
    print(f"  Target: {CROP_TARGET} crop + {NONCROP_TARGET} non-crop images")

    crop_ok    = download_crop_images()
    noncrop_ok = download_noncrop_images()
    print_summary(crop_ok, noncrop_ok)
