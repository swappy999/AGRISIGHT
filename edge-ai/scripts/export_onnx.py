"""
AgriSight Edge AI -- ONNX Export Script
=========================================
Loads the best PyTorch checkpoint and exports it to ONNX opset 11
(widely compatible with onnxruntime-web), then copies to frontend/public/models/.

Run:
    cd edge-ai && python scripts/export_onnx.py
"""
import sys
import shutil
import torch
import torch.nn as nn
from pathlib import Path
from torchvision import models

# Force UTF-8
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT      = Path(__file__).resolve().parent.parent
PT_PATH   = ROOT / "models" / "agrisight-edge-crop-v1.pt"
ONNX_PATH = ROOT / "models" / "agrisight-edge-crop-v1.onnx"
FRONTEND  = ROOT.parent / "frontend" / "public" / "models"
FRONTEND.mkdir(parents=True, exist_ok=True)

IMAGE_SIZE = 224

def build_model() -> nn.Module:
    model = models.mobilenet_v3_small(weights=None)
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, 2),
    )
    return model

def main():
    print("AgriSight Edge AI -- ONNX Export")
    print("=" * 50)

    if not PT_PATH.exists():
        print(f"ERROR: Checkpoint not found: {PT_PATH}")
        print("  Run training/train.py first.")
        sys.exit(1)

    # Load checkpoint
    ckpt = torch.load(str(PT_PATH), map_location="cpu", weights_only=True)
    epoch    = ckpt.get("epoch", "?")
    val_acc  = ckpt.get("val_acc", 0.0)
    print(f"  Checkpoint: epoch={epoch}, val_acc={val_acc:.4f} ({val_acc*100:.2f}%)")

    # Build model + load weights
    model = build_model()
    model.load_state_dict(ckpt["model_state"])
    model.eval()
    print(f"  Model architecture: MobileNetV3-Small")
    print(f"  Params: {sum(p.numel() for p in model.parameters()):,}")

    # Export to ONNX opset 11 (best onnxruntime-web compatibility)
    dummy = torch.randn(1, 3, IMAGE_SIZE, IMAGE_SIZE)

    print(f"\n  Exporting to ONNX (opset 11)...")
    torch.onnx.export(
        model,
        dummy,
        str(ONNX_PATH),
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={"input": {0: "batch"}, "output": {0: "batch"}},
        opset_version=11,
        do_constant_folding=True,
        export_params=True,
    )

    size_mb = ONNX_PATH.stat().st_size / 1024 / 1024
    print(f"  ONNX saved: {ONNX_PATH}")
    print(f"  Model size: {size_mb:.2f} MB")

    # Copy to frontend
    dest = FRONTEND / "agrisight-edge-crop-v1.onnx"
    shutil.copy2(ONNX_PATH, dest)
    print(f"\n  Copied to frontend: {dest}")
    print("\nDone. Run: python evaluation/evaluate.py")

if __name__ == "__main__":
    main()
