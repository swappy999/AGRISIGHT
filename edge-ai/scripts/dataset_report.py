"""
AgriSight Edge AI — Dataset Report
====================================
Prints a summary of the current dataset state.

Run:
    cd edge-ai && python scripts/dataset_report.py
"""

from pathlib import Path

ROOT_DIR    = Path(__file__).resolve().parent.parent
DATASETS    = ROOT_DIR / "datasets"
PROCESSED   = DATASETS / "processed"

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".JPG", ".JPEG", ".PNG"}

def count_images(directory: Path) -> int:
    if not directory.exists():
        return 0
    return sum(1 for p in directory.rglob("*") if p.suffix in IMAGE_EXTS)

def main():
    print("AgriSight Edge AI — Dataset Report")
    print("=" * 50)

    crop_raw    = count_images(DATASETS / "crop")
    noncrop_raw = count_images(DATASETS / "non-crop")
    print(f"\nRAW DATASETS")
    print(f"  Crop    : {crop_raw}")
    print(f"  Non-crop: {noncrop_raw}")
    print(f"  Total   : {crop_raw + noncrop_raw}")

    if PROCESSED.exists():
        print(f"\nPROCESSED SPLITS")
        for split in ["train", "val", "test"]:
            crop_n    = count_images(PROCESSED / split / "crop")
            noncrop_n = count_images(PROCESSED / split / "non-crop")
            print(f"  {split:5} : crop={crop_n:4d}  non-crop={noncrop_n:4d}  total={crop_n + noncrop_n:4d}")
    else:
        print("\n  (Processed splits not yet created — run preprocess.py)")

    models_dir = ROOT_DIR / "models"
    onnx_path = models_dir / "agrisight-edge-crop-v1.onnx"
    print(f"\nMODEL")
    if onnx_path.exists():
        print(f"  ONNX model : {onnx_path.stat().st_size / 1024 / 1024:.2f} MB ✔")
    else:
        print(f"  ONNX model : Not yet trained")

    frontend_model = ROOT_DIR.parent / "frontend" / "public" / "models" / "agrisight-edge-crop-v1.onnx"
    if frontend_model.exists():
        print(f"  In frontend: {frontend_model.stat().st_size / 1024 / 1024:.2f} MB ✔")
    else:
        print(f"  In frontend: Not yet copied")

if __name__ == "__main__":
    main()
