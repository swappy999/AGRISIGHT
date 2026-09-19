"""
AgriSight Edge AI — Data Preprocessor
=======================================
Validates, resizes, deduplicates, and splits the raw dataset into
train / validation / test sets for model training.

Run:
    cd edge-ai && python training/preprocess.py

Output:
    edge-ai/datasets/processed/
        train/crop/
        train/non-crop/
        val/crop/
        val/non-crop/
        test/crop/
        test/non-crop/
    edge-ai/datasets/dataset_stats.txt
"""

import os
import sys
import shutil
import hashlib
import random
from pathlib import Path
from PIL import Image
import numpy as np
from tqdm import tqdm

# ── Config ────────────────────────────────────────────────────────────────────
SCRIPT_DIR   = Path(__file__).resolve().parent
ROOT_DIR     = SCRIPT_DIR.parent
RAW_CROP     = ROOT_DIR / "datasets" / "crop"
RAW_NONCROP  = ROOT_DIR / "datasets" / "non-crop"
PROCESSED    = ROOT_DIR / "datasets" / "processed"
STATS_FILE   = ROOT_DIR / "datasets" / "dataset_stats.txt"

TARGET_SIZE  = (224, 224)     # MobileNetV3 input size
TRAIN_RATIO  = 0.70
VAL_RATIO    = 0.15
TEST_RATIO   = 0.15
RANDOM_SEED  = 42

MIN_DIM      = 64             # Minimum dimension to accept image
MIN_SIZE_KB  = 2              # Minimum file size to accept

CLASSES = {
    "crop":     RAW_CROP,
    "non-crop": RAW_NONCROP,
}

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".JPG", ".JPEG", ".PNG"}


def file_hash(path: Path) -> str:
    """MD5 hash of file content for deduplication."""
    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def validate_image(path: Path) -> tuple[bool, str]:
    """Return (is_valid, reason). Rejects corrupted, too-small, or grayscale-only images."""
    try:
        if path.stat().st_size < MIN_SIZE_KB * 1024:
            return False, f"Too small ({path.stat().st_size} bytes)"
        
        with Image.open(path) as img:
            img.verify()
        
        # Re-open after verify (verify closes the file)
        with Image.open(path) as img:
            w, h = img.size
            if w < MIN_DIM or h < MIN_DIM:
                return False, f"Dimensions too small ({w}x{h})"
            # Accept RGB and RGBA (convert RGBA→RGB in processing)
            if img.mode not in ("RGB", "RGBA", "L", "P"):
                return False, f"Unsupported mode: {img.mode}"
        
        return True, "ok"
    except Exception as e:
        return False, str(e)


def load_and_resize(path: Path) -> Image.Image | None:
    """Load image, convert to RGB, resize to TARGET_SIZE."""
    try:
        with Image.open(path) as img:
            img = img.convert("RGB")
            img = img.resize(TARGET_SIZE, Image.BILINEAR)
            return img.copy()
    except Exception:
        return None


def process_class(class_name: str, raw_dir: Path, split_dirs: dict) -> dict:
    """Validate, deduplicate, resize and copy images for one class."""
    print(f"\n── Processing class: {class_name.upper()} ──")
    
    if not raw_dir.exists():
        print(f"  ✗ Directory not found: {raw_dir}")
        return {"total": 0, "accepted": 0, "rejected": 0, "duplicates": 0}
    
    all_files = [p for p in raw_dir.rglob("*") if p.suffix in IMAGE_EXTENSIONS]
    print(f"  Found {len(all_files)} raw files")
    
    valid_files = []
    rejected = 0
    
    for path in tqdm(all_files, desc=f"  Validating {class_name}"):
        ok, reason = validate_image(path)
        if ok:
            valid_files.append(path)
        else:
            rejected += 1
    
    print(f"  Accepted: {len(valid_files)} | Rejected: {rejected}")
    
    # Deduplication by file content hash
    seen_hashes = set()
    deduped = []
    for path in valid_files:
        h = file_hash(path)
        if h not in seen_hashes:
            seen_hashes.add(h)
            deduped.append(path)
    
    duplicates = len(valid_files) - len(deduped)
    print(f"  After dedup: {len(deduped)} (removed {duplicates} duplicates)")
    
    # Shuffle deterministically
    random.seed(RANDOM_SEED)
    random.shuffle(deduped)
    
    # Split
    n = len(deduped)
    n_train = int(n * TRAIN_RATIO)
    n_val   = int(n * VAL_RATIO)
    
    splits = {
        "train": deduped[:n_train],
        "val":   deduped[n_train:n_train + n_val],
        "test":  deduped[n_train + n_val:],
    }
    
    # Copy resized images to split directories
    for split_name, files in splits.items():
        out_dir = split_dirs[split_name] / class_name
        out_dir.mkdir(parents=True, exist_ok=True)
        
        for path in tqdm(files, desc=f"  Writing {split_name}/{class_name}"):
            img = load_and_resize(path)
            if img is not None:
                out_path = out_dir / f"{path.stem}.jpg"
                img.save(out_path, "JPEG", quality=90)
    
    print(f"  Split → train:{len(splits['train'])} | val:{len(splits['val'])} | test:{len(splits['test'])}")
    
    return {
        "total":      len(all_files),
        "accepted":   len(deduped),
        "rejected":   rejected,
        "duplicates": duplicates,
        "train":      len(splits["train"]),
        "val":        len(splits["val"]),
        "test":       len(splits["test"]),
    }


def write_stats(stats: dict):
    lines = [
        "AgriSight Edge AI — Dataset Statistics",
        "=" * 50,
        "",
    ]
    total_train = total_val = total_test = 0
    for cls, s in stats.items():
        lines += [
            f"Class: {cls.upper()}",
            f"  Raw total    : {s['total']}",
            f"  Accepted     : {s['accepted']}",
            f"  Rejected     : {s['rejected']}",
            f"  Duplicates   : {s['duplicates']}",
            f"  Train        : {s['train']}",
            f"  Validation   : {s['val']}",
            f"  Test         : {s['test']}",
            "",
        ]
        total_train += s.get("train", 0)
        total_val   += s.get("val", 0)
        total_test  += s.get("test", 0)
    
    total = total_train + total_val + total_test
    lines += [
        "TOTALS",
        f"  Train       : {total_train}",
        f"  Validation  : {total_val}",
        f"  Test        : {total_test}",
        f"  Grand total : {total}",
    ]
    
    content = "\n".join(lines)
    STATS_FILE.write_text(content)
    print(f"\n{content}")
    print(f"\n✔ Stats written to {STATS_FILE}")


if __name__ == "__main__":
    print("AgriSight Edge AI — Data Preprocessor")
    print("=" * 50)
    
    # Clean processed dir
    if PROCESSED.exists():
        shutil.rmtree(PROCESSED)
    
    split_dirs = {
        "train": PROCESSED / "train",
        "val":   PROCESSED / "val",
        "test":  PROCESSED / "test",
    }
    for d in split_dirs.values():
        d.mkdir(parents=True, exist_ok=True)
    
    all_stats = {}
    for class_name, raw_dir in CLASSES.items():
        all_stats[class_name] = process_class(class_name, raw_dir, split_dirs)
    
    write_stats(all_stats)
    print("\n✔ Preprocessing complete.")
    print(f"  Processed dataset → {PROCESSED}")
    print("\nNext step:")
    print("  python training/train.py")
