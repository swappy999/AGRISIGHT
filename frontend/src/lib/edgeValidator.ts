/**
 * AgriSight Edge AI — Browser Validator Service
 * ================================================
 * Singleton that loads the ONNX crop/non-crop model once per session,
 * caches it in memory, and runs local inference on captured images.
 *
 * Zero network calls. Runs entirely in the browser via ONNX Runtime Web.
 *
 * Decision:
 *   CROP      → confidence ≥ threshold and predicted class = crop
 *   NON_CROP  → confidence ≥ threshold and predicted class = non-crop
 *   UNCERTAIN → max confidence < threshold (blurry / ambiguous image)
 */

import * as ort from "onnxruntime-web";

// ── Types ──────────────────────────────────────────────────────────────────────

export type EdgeDecision = "CROP" | "NON_CROP" | "UNCERTAIN";

export interface EdgeValidationResult {
  decision: EdgeDecision;
  confidence: number;     // 0–1, probability of the winning class
  modelVersion: string;   // "agrisight-edge-crop-v1"
  inferenceMs: number;    // Time to run inference (not including load)
}

// ── Constants ──────────────────────────────────────────────────────────────────

const MODEL_VERSION    = "agrisight-edge-crop-v1";
const MODEL_PATH       = "/models/agrisight-edge-crop-v1.onnx";
const IMAGE_SIZE       = 224;
const CONF_THRESHOLD   = 0.75;   // Min confidence to make a firm decision

// Class indices (matches training: alphabetical = crop=0, non-crop=1)
const CROP_IDX    = 0;
const NONCROP_IDX = 1;

// ImageNet normalization (matches training transforms)
const IMAGENET_MEAN = [0.485, 0.456, 0.406];
const IMAGENET_STD  = [0.229, 0.224, 0.225];

// ── Session cache ──────────────────────────────────────────────────────────────

let _session: ort.InferenceSession | null = null;
let _loadPromise: Promise<ort.InferenceSession> | null = null;

// ── Internal helpers ────────────────────────────────────────────────────────────

/**
 * Preprocess an image element into a float32 tensor [1, 3, 224, 224]
 * normalized with ImageNet mean/std — must match training transforms.
 */
function preprocessImage(source: HTMLImageElement | HTMLCanvasElement | ImageBitmap): Float32Array {
  const canvas = document.createElement("canvas");
  canvas.width  = IMAGE_SIZE;
  canvas.height = IMAGE_SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(source as CanvasImageSource, 0, 0, IMAGE_SIZE, IMAGE_SIZE);

  const imageData = ctx.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE);
  const { data } = imageData;                              // RGBA, 0–255

  const tensor = new Float32Array(3 * IMAGE_SIZE * IMAGE_SIZE);
  const pixelCount = IMAGE_SIZE * IMAGE_SIZE;

  for (let i = 0; i < pixelCount; i++) {
    const r = data[i * 4]     / 255.0;
    const g = data[i * 4 + 1] / 255.0;
    const b = data[i * 4 + 2] / 255.0;

    // CHW layout: [R plane, G plane, B plane]
    tensor[i]                    = (r - IMAGENET_MEAN[0]) / IMAGENET_STD[0];
    tensor[i + pixelCount]       = (g - IMAGENET_MEAN[1]) / IMAGENET_STD[1];
    tensor[i + 2 * pixelCount]   = (b - IMAGENET_MEAN[2]) / IMAGENET_STD[2];
  }

  return tensor;
}

/** Numerically stable softmax. */
function softmax(logits: Float32Array | number[]): number[] {
  const arr = Array.from(logits);
  const max = Math.max(...arr);
  const exps = arr.map((x) => Math.exp(x - max));
  const sum  = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

/** Convert file to HTMLImageElement for canvas drawing. */
function fileToImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img  = new Image();
    img.onload  = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to decode image")); };
    img.src = url;
  });
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Load the ONNX model. Idempotent — safe to call multiple times.
 * Second and subsequent calls return the cached session immediately.
 * Throws if the model cannot be fetched or initialized.
 */
export async function loadEdgeModel(): Promise<void> {
  if (_session) return;          // Already loaded
  if (_loadPromise) {
    await _loadPromise;          // Load already in progress
    return;
  }

  // Configure ONNX Runtime Web — use WASM backend (works everywhere)
  // Point to CDN for WASM runtime files (required for static export builds)
  const ORT_VERSION = "1.20.1";
  ort.env.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;
  ort.env.wasm.numThreads     = 1;     // Single thread: no SharedArrayBuffer needed
  ort.env.wasm.simd           = true;  // Enable SIMD if available
  ort.env.wasm.proxy          = false;

  _loadPromise = ort.InferenceSession.create(MODEL_PATH, {
    executionProviders: ["wasm"],
    graphOptimizationLevel: "all",
  });

  try {
    _session = await _loadPromise;
    console.info(`[EdgeAI] Model loaded: ${MODEL_VERSION}`);
  } catch (err) {
    _loadPromise = null;
    _session     = null;
    throw new Error(`Edge AI model failed to load: ${(err as Error).message}`);
  }
}

/**
 * Returns true if the model is already loaded in memory.
 */
export function isEdgeModelLoaded(): boolean {
  return _session !== null;
}

/**
 * Run edge validation on an image File.
 * Will auto-load the model if not already loaded.
 *
 * @throws if the model cannot be loaded or inference fails
 */
export async function validateImage(file: File): Promise<EdgeValidationResult> {
  // Ensure model is loaded
  await loadEdgeModel();
  if (!_session) throw new Error("Edge AI session unavailable.");

  // Decode image
  const imgEl = await fileToImageElement(file);

  // Preprocess
  const tensorData = preprocessImage(imgEl);
  const inputTensor = new ort.Tensor("float32", tensorData, [1, 3, IMAGE_SIZE, IMAGE_SIZE]);

  // Run inference
  const inputName = _session.inputNames[0];
  const t0        = performance.now();
  const outputs   = await _session.run({ [inputName]: inputTensor });
  const inferenceMs = performance.now() - t0;

  // Parse output
  const outputName = _session.outputNames[0];
  const logits     = outputs[outputName].data as Float32Array;
  const probs      = softmax(logits);

  const cropProb    = probs[CROP_IDX];
  const nonCropProb = probs[NONCROP_IDX];
  const maxConf     = Math.max(cropProb, nonCropProb);

  console.info(`[EdgeAI] crop=${cropProb.toFixed(3)} non-crop=${nonCropProb.toFixed(3)} (${inferenceMs.toFixed(1)}ms)`);

  // Apply confidence threshold
  let decision: EdgeDecision;
  let confidence: number;

  if (maxConf < CONF_THRESHOLD) {
    decision   = "UNCERTAIN";
    confidence = maxConf;
  } else if (nonCropProb > cropProb) {
    decision   = "NON_CROP";
    confidence = nonCropProb;
  } else {
    decision   = "CROP";
    confidence = cropProb;
  }

  return {
    decision,
    confidence,
    modelVersion: MODEL_VERSION,
    inferenceMs: Math.round(inferenceMs),
  };
}

/**
 * Reset the cached session (for testing / error recovery).
 * Forces the next call to loadEdgeModel() to re-fetch and re-initialize.
 */
export function resetEdgeModel(): void {
  _session     = null;
  _loadPromise = null;
  console.info("[EdgeAI] Session cache cleared.");
}
