"""
AgriSight Edge AI — MobileNetV3-Small Training + ONNX Export
=============================================================
Trains a binary crop/non-crop classifier using MobileNetV3-Small
(pretrained on ImageNet) fine-tuned on the AgriSight dataset.

Optimizes against non-crop false positives (non-crop classified as crop).

Run:
    cd edge-ai && python training/train.py

Output:
    edge-ai/models/agrisight-edge-crop-v1.onnx   ← browser model
    edge-ai/models/agrisight-edge-crop-v1.pt      ← PyTorch checkpoint
    edge-ai/models/training_log.json             ← metrics per epoch
    edge-ai/evaluation/confusion_matrix.png      ← from evaluate.py
"""

import os
import sys
import json
import time
import shutil
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, models, transforms
from torchvision.models import MobileNet_V3_Small_Weights
import numpy as np

# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR    = Path(__file__).resolve().parent
ROOT_DIR      = SCRIPT_DIR.parent
PROCESSED_DIR = ROOT_DIR / "datasets" / "processed"
MODELS_DIR    = ROOT_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_NAME    = "agrisight-edge-crop-v1"
PT_PATH       = MODELS_DIR / f"{MODEL_NAME}.pt"
ONNX_PATH     = MODELS_DIR / f"{MODEL_NAME}.onnx"
LOG_PATH      = MODELS_DIR / "training_log.json"

# Frontend destination for the model
FRONTEND_MODEL_DIR = ROOT_DIR.parent / "frontend" / "public" / "models"

# ── Hyperparameters ────────────────────────────────────────────────────────────
NUM_EPOCHS      = 25
BATCH_SIZE      = 16
LEARNING_RATE   = 1e-4
LR_STEP_SIZE    = 8
LR_GAMMA        = 0.3
WEIGHT_DECAY    = 1e-4
DROPOUT_P       = 0.3
IMAGE_SIZE      = 224

# Class mapping: crop=0, non-crop=1
# (sorted alphabetically by torchvision ImageFolder: crop < non-crop)
CLASS_NAMES     = ["crop", "non-crop"]
CROP_IDX        = 0
NONCROP_IDX     = 1

# Weight for non-crop class in loss — penalise missing non-crop more heavily
# to minimise non-crop images passing as crop (false positives)
# crop=0 → weight 1.0,  non-crop=1 → weight 1.5
CLASS_WEIGHTS   = torch.tensor([1.0, 1.5])

RANDOM_SEED     = 42

# ── Reproducibility ────────────────────────────────────────────────────────────
torch.manual_seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)


def get_device() -> torch.device:
    if torch.cuda.is_available():
        print(f"  Device: CUDA ({torch.cuda.get_device_name(0)})")
        return torch.device("cuda")
    print("  Device: CPU (CUDA not available)")
    return torch.device("cpu")


# ── Data Transforms ────────────────────────────────────────────────────────────
# ImageNet normalization (used by pretrained MobileNetV3)
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]

train_transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomVerticalFlip(p=0.2),
    transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2, hue=0.05),
    transforms.RandomRotation(15),
    transforms.RandomGrayscale(p=0.05),
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])

val_transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])


def build_model(num_classes: int = 2, dropout: float = DROPOUT_P) -> nn.Module:
    """MobileNetV3-Small with custom binary head."""
    model = models.mobilenet_v3_small(weights=MobileNet_V3_Small_Weights.IMAGENET1K_V1)
    
    # Replace classifier head
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Sequential(
        nn.Dropout(p=dropout),
        nn.Linear(in_features, num_classes),
    )
    return model


def compute_class_weights(dataset: datasets.ImageFolder) -> torch.Tensor:
    """Compute balanced class weights from the training set."""
    counts = [0] * len(CLASS_NAMES)
    for _, label in dataset.samples:
        counts[label] += 1
    total = sum(counts)
    weights = [total / (len(counts) * c) for c in counts]
    print(f"  Class counts: {dict(zip(CLASS_NAMES, counts))}")
    print(f"  Computed weights: {dict(zip(CLASS_NAMES, [f'{w:.3f}' for w in weights]))}")
    # Combine with manual non-crop penalty
    weights[NONCROP_IDX] *= 1.5
    return torch.tensor(weights, dtype=torch.float32)


def train_epoch(model, loader, optimizer, criterion, device) -> tuple[float, float]:
    model.train()
    total_loss, correct, total = 0.0, 0, 0
    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        total_loss += loss.item() * images.size(0)
        _, preds = outputs.max(1)
        correct += preds.eq(labels).sum().item()
        total += images.size(0)
    return total_loss / total, correct / total


def eval_epoch(model, loader, criterion, device) -> tuple[float, float]:
    model.eval()
    total_loss, correct, total = 0.0, 0, 0
    with torch.no_grad():
        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)
            total_loss += loss.item() * images.size(0)
            _, preds = outputs.max(1)
            correct += preds.eq(labels).sum().item()
            total += images.size(0)
    return total_loss / total, correct / total


def export_onnx(model: nn.Module, device: torch.device) -> None:
    """Export to ONNX with static input shape for browser inference."""
    model.eval()
    dummy = torch.randn(1, 3, IMAGE_SIZE, IMAGE_SIZE).to(device)
    
    torch.onnx.export(
        model,
        dummy,
        str(ONNX_PATH),
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={"input": {0: "batch_size"}, "output": {0: "batch_size"}},
        opset_version=17,
        do_constant_folding=True,
    )
    
    size_mb = ONNX_PATH.stat().st_size / (1024 * 1024)
    print(f"\n  ✔ ONNX exported → {ONNX_PATH}")
    print(f"    Model size: {size_mb:.2f} MB")


def copy_model_to_frontend() -> None:
    """Copy the ONNX model to the Next.js public directory."""
    FRONTEND_MODEL_DIR.mkdir(parents=True, exist_ok=True)
    dest = FRONTEND_MODEL_DIR / f"{MODEL_NAME}.onnx"
    shutil.copy2(ONNX_PATH, dest)
    print(f"  ✔ Copied model to frontend → {dest}")


def main():
    print("AgriSight Edge AI — Training: MobileNetV3-Small (Crop/Non-Crop)")
    print("=" * 65)
    
    device = get_device()
    
    # ── Load datasets ──────────────────────────────────────────────
    train_dir = PROCESSED_DIR / "train"
    val_dir   = PROCESSED_DIR / "val"
    
    if not train_dir.exists():
        print(f"\n✗ Processed dataset not found: {train_dir}")
        print("  Run: python training/preprocess.py first")
        sys.exit(1)
    
    train_dataset = datasets.ImageFolder(str(train_dir), transform=train_transform)
    val_dataset   = datasets.ImageFolder(str(val_dir),   transform=val_transform)
    
    print(f"\n  Train samples : {len(train_dataset)}")
    print(f"  Val samples   : {len(val_dataset)}")
    print(f"  Class map     : {train_dataset.class_to_idx}")
    
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True,
                               num_workers=0, pin_memory=device.type == "cuda")
    val_loader   = DataLoader(val_dataset,   batch_size=BATCH_SIZE, shuffle=False,
                               num_workers=0, pin_memory=device.type == "cuda")
    
    # ── Model ─────────────────────────────────────────────────────
    model = build_model(num_classes=2).to(device)
    
    total_params = sum(p.numel() for p in model.parameters())
    trainable    = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"\n  Total params    : {total_params:,}")
    print(f"  Trainable params: {trainable:,}")
    
    # ── Loss with class weights ────────────────────────────────────
    weights = compute_class_weights(train_dataset).to(device)
    criterion = nn.CrossEntropyLoss(weight=weights)
    
    # ── Optimizer + Scheduler ──────────────────────────────────────
    optimizer = optim.AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=LR_STEP_SIZE, gamma=LR_GAMMA)
    
    # ── Training loop ──────────────────────────────────────────────
    print(f"\n  Epochs: {NUM_EPOCHS} | Batch: {BATCH_SIZE} | LR: {LEARNING_RATE}")
    print("─" * 65)
    print(f"  {'Epoch':>6} | {'Train Loss':>10} | {'Train Acc':>9} | {'Val Loss':>8} | {'Val Acc':>7} | {'LR':>8}")
    print("─" * 65)
    
    best_val_acc = 0.0
    log = []
    
    for epoch in range(1, NUM_EPOCHS + 1):
        t_start = time.time()
        
        train_loss, train_acc = train_epoch(model, train_loader, optimizer, criterion, device)
        val_loss,   val_acc   = eval_epoch(model, val_loader, criterion, device)
        scheduler.step()
        
        current_lr = scheduler.get_last_lr()[0]
        elapsed = time.time() - t_start
        
        print(f"  {epoch:>6} | {train_loss:>10.4f} | {train_acc:>8.1%} | {val_loss:>8.4f} | {val_acc:>6.1%} | {current_lr:>8.2e}  ({elapsed:.1f}s)")
        
        log.append({
            "epoch": epoch,
            "train_loss": round(train_loss, 6),
            "train_acc":  round(train_acc, 6),
            "val_loss":   round(val_loss, 6),
            "val_acc":    round(val_acc, 6),
            "lr":         current_lr,
        })
        
        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save({
                "epoch":      epoch,
                "model_state": model.state_dict(),
                "val_acc":    val_acc,
                "class_to_idx": train_dataset.class_to_idx,
                "model_version": MODEL_NAME,
            }, str(PT_PATH))
            print(f"           ↑ New best val acc: {val_acc:.1%} — checkpoint saved")
    
    print("─" * 65)
    print(f"\n  ✔ Training complete. Best val accuracy: {best_val_acc:.2%}")
    
    # Save training log
    LOG_PATH.write_text(json.dumps(log, indent=2))
    print(f"  ✔ Training log → {LOG_PATH}")
    
    # ── Load best checkpoint and export ───────────────────────────
    print("\n── Exporting best model to ONNX ──")
    checkpoint = torch.load(str(PT_PATH), map_location=device)
    model.load_state_dict(checkpoint["model_state"])
    
    export_onnx(model, device)
    copy_model_to_frontend()
    
    print(f"""
━━━ Training Summary ━━━
  Model          : {MODEL_NAME}
  Architecture   : MobileNetV3-Small (ImageNet pretrained)
  Best Val Acc   : {best_val_acc:.2%}
  PT checkpoint  : {PT_PATH}
  ONNX model     : {ONNX_PATH}
  Frontend model : {FRONTEND_MODEL_DIR / f'{MODEL_NAME}.onnx'}

Next step:
  python evaluation/evaluate.py
""")


if __name__ == "__main__":
    main()
