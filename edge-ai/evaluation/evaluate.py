"""
AgriSight Edge AI — Model Evaluation
======================================
Evaluates the trained ONNX model on the held-out test set.
Reports Accuracy, Precision, Recall, F1, Confusion Matrix,
False Positive Rate and False Negative Rate.

Run:
    cd edge-ai && python evaluation/evaluate.py

Output:
    edge-ai/evaluation/confusion_matrix.png
    edge-ai/evaluation/evaluation_report.txt
"""

import os
import sys
import time
import json
from pathlib import Path

import numpy as np
from PIL import Image
import onnxruntime as ort
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR  = Path(__file__).resolve().parent
ROOT_DIR    = SCRIPT_DIR.parent
ONNX_PATH   = ROOT_DIR / "models" / "agrisight-edge-crop-v1.onnx"
TEST_DIR    = ROOT_DIR / "datasets" / "processed" / "test"
EVAL_DIR    = SCRIPT_DIR
EVAL_DIR.mkdir(parents=True, exist_ok=True)

CM_PATH     = EVAL_DIR / "confusion_matrix.png"
REPORT_PATH = EVAL_DIR / "evaluation_report.txt"

# Preprocessing constants (must match training)
IMAGE_SIZE    = 224
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD  = np.array([0.229, 0.224, 0.225], dtype=np.float32)

# Class mapping (alphabetical, same as ImageFolder in training)
CLASS_NAMES   = ["crop", "non-crop"]
CROP_IDX      = 0
NONCROP_IDX   = 1

CONFIDENCE_THRESHOLD = 0.75   # Must match edgeValidator.ts


def preprocess_image(path: Path) -> np.ndarray:
    """Load, resize, normalize image to ONNX input tensor [1, 3, 224, 224]."""
    with Image.open(path) as img:
        img = img.convert("RGB").resize((IMAGE_SIZE, IMAGE_SIZE), Image.BILINEAR)
        arr = np.array(img, dtype=np.float32) / 255.0
        arr = (arr - IMAGENET_MEAN) / IMAGENET_STD
        arr = arr.transpose(2, 0, 1)           # HWC → CHW
        arr = np.expand_dims(arr, axis=0)       # [1, 3, 224, 224]
        return arr.astype(np.float32)


def softmax(x: np.ndarray) -> np.ndarray:
    e = np.exp(x - np.max(x, axis=-1, keepdims=True))
    return e / e.sum(axis=-1, keepdims=True)


def decide(probs: np.ndarray) -> tuple[str, float]:
    """Apply confidence threshold and return (decision, confidence)."""
    crop_prob    = float(probs[CROP_IDX])
    noncrop_prob = float(probs[NONCROP_IDX])
    max_conf = max(crop_prob, noncrop_prob)
    
    if max_conf < CONFIDENCE_THRESHOLD:
        return "UNCERTAIN", max_conf
    
    if noncrop_prob > crop_prob:
        return "NON_CROP", noncrop_prob
    return "CROP", crop_prob


def load_test_samples() -> list[tuple[Path, int]]:
    samples = []
    for cls_idx, cls_name in enumerate(CLASS_NAMES):
        cls_dir = TEST_DIR / cls_name
        if not cls_dir.exists():
            continue
        for path in cls_dir.iterdir():
            if path.suffix.lower() in {".jpg", ".jpeg", ".png"}:
                samples.append((path, cls_idx))
    return samples


def run_evaluation():
    print("AgriSight Edge AI — Evaluation")
    print("=" * 50)
    
    if not ONNX_PATH.exists():
        print(f"✗ ONNX model not found: {ONNX_PATH}")
        print("  Run: python training/train.py first")
        sys.exit(1)
    
    if not TEST_DIR.exists():
        print(f"✗ Test set not found: {TEST_DIR}")
        print("  Run: python training/preprocess.py first")
        sys.exit(1)
    
    # Load model
    print(f"\n  Loading ONNX model: {ONNX_PATH.name}")
    sess_opts = ort.SessionOptions()
    sess_opts.inter_op_num_threads = 2
    sess_opts.intra_op_num_threads = 2
    session = ort.InferenceSession(str(ONNX_PATH), sess_opts=sess_opts)
    input_name = session.get_inputs()[0].name
    print(f"  Input name: {input_name}")
    
    # Load test samples
    samples = load_test_samples()
    print(f"  Test samples: {len(samples)}")
    
    if not samples:
        print("✗ No test samples found.")
        sys.exit(1)
    
    # Run inference
    y_true, y_pred_full, y_pred_thresh = [], [], []
    inference_times = []
    uncertain_count = 0
    
    for path, true_label in samples:
        try:
            tensor = preprocess_image(path)
            t0 = time.perf_counter()
            outputs = session.run(None, {input_name: tensor})
            elapsed_ms = (time.perf_counter() - t0) * 1000
            inference_times.append(elapsed_ms)
            
            logits = outputs[0][0]
            probs  = softmax(np.array([logits]))
            
            # Full prediction (no threshold)
            pred_full = int(np.argmax(probs[0]))
            
            # Threshold-aware prediction
            decision, _ = decide(probs[0])
            if decision == "UNCERTAIN":
                uncertain_count += 1
                pred_thresh = true_label  # Exclude from metric? Count as correct for now
            else:
                pred_thresh = NONCROP_IDX if decision == "NON_CROP" else CROP_IDX
            
            y_true.append(true_label)
            y_pred_full.append(pred_full)
            y_pred_thresh.append(pred_thresh)
        
        except Exception as e:
            print(f"  ✗ Error on {path.name}: {e}")
            continue
    
    y_true       = np.array(y_true)
    y_pred_full  = np.array(y_pred_full)
    y_pred_thresh = np.array(y_pred_thresh)
    
    # ── Metrics (using full predictions) ──────────────────────────
    acc  = accuracy_score(y_true, y_pred_full)
    prec = precision_score(y_true, y_pred_full, pos_label=CROP_IDX, zero_division=0)
    rec  = recall_score(y_true, y_pred_full, pos_label=CROP_IDX, zero_division=0)
    f1   = f1_score(y_true, y_pred_full, pos_label=CROP_IDX, zero_division=0)
    cm   = confusion_matrix(y_true, y_pred_full, labels=[CROP_IDX, NONCROP_IDX])
    
    # TP, FP, FN, TN (crop=positive)
    tn, fp, fn, tp = cm.ravel()
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0   # Non-crop → classified as crop
    fnr = fn / (fn + tp) if (fn + tp) > 0 else 0   # Crop → classified as non-crop
    
    avg_inf_ms = np.mean(inference_times)
    p95_inf_ms = np.percentile(inference_times, 95)
    
    # ── Report ────────────────────────────────────────────────────
    report_lines = [
        "AgriSight Edge AI — Evaluation Report",
        "=" * 50,
        f"",
        f"Model         : agrisight-edge-crop-v1",
        f"Architecture  : MobileNetV3-Small",
        f"Test samples  : {len(y_true)}",
        f"Uncertain     : {uncertain_count} ({uncertain_count / len(y_true) * 100:.1f}%)",
        f"",
        f"── Classification Metrics ──",
        f"Accuracy      : {acc:.4f} ({acc:.1%})",
        f"Precision     : {prec:.4f}",
        f"Recall        : {rec:.4f}",
        f"F1 Score      : {f1:.4f}",
        f"",
        f"── Error Rates (KEY METRIC) ──",
        f"Non-crop FPR  : {fpr:.4f} ({fpr:.1%})  ← NON-CROP classified as CROP",
        f"Crop FNR      : {fnr:.4f} ({fnr:.1%})  ← CROP classified as NON-CROP",
        f"",
        f"── Confusion Matrix ──",
        f"                 Predicted CROP  Predicted NON-CROP",
        f"Actual CROP      {tp:>14d}  {fn:>18d}",
        f"Actual NON-CROP  {fp:>14d}  {tn:>18d}",
        f"",
        f"── Inference Performance ──",
        f"Avg inference : {avg_inf_ms:.1f} ms",
        f"P95 inference : {p95_inf_ms:.1f} ms",
        f"",
        f"── Classification Report ──",
        classification_report(y_true, y_pred_full, target_names=CLASS_NAMES, zero_division=0),
    ]
    
    report = "\n".join(report_lines)
    print(f"\n{report}")
    REPORT_PATH.write_text(report, encoding="utf-8")
    print(f"\n✔ Report saved → {REPORT_PATH}")
    
    # ── Confusion matrix plot ──────────────────────────────────────
    fig, ax = plt.subplots(figsize=(6, 5))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=["CROP", "NON-CROP"],
        yticklabels=["CROP", "NON-CROP"],
        ax=ax,
    )
    ax.set_xlabel("Predicted", fontsize=12)
    ax.set_ylabel("Actual", fontsize=12)
    ax.set_title(f"Confusion Matrix — agrisight-edge-crop-v1\nAccuracy: {acc:.2%} | FPR: {fpr:.2%}", fontsize=11)
    plt.tight_layout()
    plt.savefig(str(CM_PATH), dpi=150, bbox_inches="tight")
    print(f"✔ Confusion matrix → {CM_PATH}")
    
    return {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1": round(f1, 4),
        "fpr": round(fpr, 4),
        "fnr": round(fnr, 4),
        "avg_inference_ms": round(avg_inf_ms, 2),
    }


if __name__ == "__main__":
    run_evaluation()
