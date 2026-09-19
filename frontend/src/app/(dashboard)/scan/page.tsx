"use client";

import { useState, useCallback, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Capacitor } from "@capacitor/core";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { useTranslation, LANGUAGE_CONFIG } from "@/context/LanguageContext";
import { api, logAndroidScan } from "@/lib/apiClient";
import { useSpeechInput } from "@/hooks/useSpeechInput";
import { useCapacitorBackButton } from "@/hooks/useCapacitorBackButton";
import { loadEdgeModel, validateImage as edgeValidateImage, resetEdgeModel, type EdgeValidationResult } from "@/lib/edgeValidator";

const VoiceVisualizer = dynamic(
  () => import("@/components/VoiceVisualizer").then((mod) => mod.VoiceVisualizer),
  { ssr: false }
);

type ScanStep = "idle" | "camera" | "preview" | "analyzing" | "edge-rejected" | "error";

// ── Edge Validation State ──────────────────────────────────────────────────────
type EdgeValidationStatus =
  | { status: "idle" }
  | { status: "loading" }                               // Loading ONNX model
  | { status: "validating" }                            // Running inference
  | { status: "NON_CROP"; confidence: number }          // Rejected — no cloud call
  | { status: "UNCERTAIN" }                             // Low confidence — retake
  | { status: "model_error"; message: string };         // Model unavailable

type ErrorCategory =
  | "CAMERA_ERROR"
  | "IMAGE_CAPTURE_ERROR"
  | "IMAGE_VALIDATION_ERROR"
  | "IMAGE_UPLOAD_ERROR"
  | "AI_ERROR"
  | "AI_TIMEOUT"
  | "DATABASE_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

interface ErrorState {
  category: ErrorCategory;
  title: string;
  message: string;
  reasons?: string[];
  rawError?: string;
}

interface ImageQualityMetrics {
  width: number;
  height: number;
  brightness: number;
  contrast: number;
  isDark: boolean;
  isFlat: boolean;
}

function ScanContent() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [step, setStep] = useState<ScanStep>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [qualityMetrics, setQualityMetrics] = useState<ImageQualityMetrics | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analysisStage, setAnalysisStage] = useState(0);
  const [error, setError] = useState<ErrorState | null>(null);
  const [question, setQuestion] = useState("");
  const [showVoicePanel, setShowVoicePanel] = useState(false);

  // ── Edge AI validation state ────────────────────────────────────────────────
  const [edgeState, setEdgeState] = useState<EdgeValidationStatus>({ status: "idle" });
  const [lastEdgeResult, setLastEdgeResult] = useState<EdgeValidationResult | null>(null);

  // Live Camera Controls
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Crop & Field management integration
  const [crops, setCrops] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [selectedCropId, setSelectedCropId] = useState<string>("");
  const [selectedFieldId, setSelectedFieldId] = useState<string>("");
  const [loadingCrops, setLoadingCrops] = useState(false);

  // Handle hardware back button inside Scan screen
  useCapacitorBackButton(() => {
    if (step === "preview" || step === "camera" || step === "error") {
      stopLiveCamera();
      setStep("idle");
      setPreviewUrl(null);
      setSelectedFile(null);
      setError(null);
      return true;
    }
    if (step === "idle") {
      router.push("/dashboard");
      return true;
    }
    return false;
  });

  useEffect(() => {
    async function loadCropsAndFields() {
      try {
        setLoadingCrops(true);
        const [cropsData, fieldsData] = await Promise.all([
          api.getCrops().catch(() => []),
          api.getFields().catch(() => []),
        ]);
        if (Array.isArray(cropsData)) {
          setCrops(cropsData);
          const paramCropId = searchParams.get("crop_id");
          if (paramCropId && cropsData.some((c) => c.id === paramCropId)) {
            setSelectedCropId(paramCropId);
          }
        }
        if (Array.isArray(fieldsData)) {
          setFields(fieldsData);
          const paramFieldId = searchParams.get("field_id");
          if (paramFieldId && fieldsData.some((f) => f.id === paramFieldId)) {
            setSelectedFieldId(paramFieldId);
          }
        }
      } catch {
        // Fallback silently
      } finally {
        setLoadingCrops(false);
      }
    }
    loadCropsAndFields();
  }, [searchParams]);

  // Voice input hook
  const speech = useSpeechInput(language);

  // Dynamic analysis stages with localized text
  const analysisStages = [
    { icon: "image", label: t("stageCompressing") },
    { icon: "cloud_upload", label: t("stageUploading") },
    { icon: "psychology", label: t("stageAiAnalyzing") },
    { icon: "lightbulb", label: t("stageGeneratingInsights") },
  ];

  // ── Stop Camera Stream ──────────────────────────────────────────
  const stopLiveCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopLiveCamera();
    };
  }, [stopLiveCamera]);

  // ── Native Mobile & Browser Photo Capture ────────────────────────
  const triggerNativeCapture = async (source: CameraSource = CameraSource.Camera) => {
    stopLiveCamera();
    setCameraError(null);
    setError(null);

    try {
      if (Capacitor.isNativePlatform()) {
        logAndroidScan("Permission Check", {
          status: `Checking permissions for source: ${source}`,
        });

        const perms = await Camera.checkPermissions();
        if (perms.camera === "prompt" || perms.camera === "prompt-with-rationale") {
          const req = await Camera.requestPermissions();
          if (req.camera === "denied") {
            logAndroidScan("Permission Denied", {
              status: "Camera permission denied by user",
            });
            setError({
              category: "CAMERA_ERROR",
              title: language === "bn" ? "ক্যামেরা অনুমতি প্রয়োজন" : language === "hi" ? "कैमरा अनुमति आवश्यक है" : "Camera Permission Required",
              message: language === "bn" ? "ফসলের পাতা স্ক্যান করতে ক্যামেরা ব্যবহারের অনুমতি দিন।" : language === "hi" ? "फसल की पत्ती स्कैन करने के लिए कैमरा अनुमति दें।" : "Please allow camera access in Android settings to scan crops.",
              reasons: [
                language === "bn" ? "ডিভাইস সেটিংসে ক্যামেরা অনুমতি চালু করুন" : language === "hi" ? "डिवाइस सेटिंग में कैमरा अनुमति सक्षम करें" : "Enable camera permission in device settings",
                language === "bn" ? "অথবা গ্যালারি থেকে ছবি নির্বাচন করুন" : language === "hi" ? "या गैलरी से फोटो चुनें" : "Or select an existing image from gallery",
              ],
            });
            setStep("error");
            return;
          }
        } else if (perms.camera === "denied" && source === CameraSource.Camera) {
          logAndroidScan("Permission Permanently Denied", {
            status: "Camera permission is denied",
          });
          setError({
            category: "CAMERA_ERROR",
            title: language === "bn" ? "ক্যামেরা বন্ধ রয়েছে" : language === "hi" ? "कैमरा बंद है" : "Camera Access Disabled",
            message: language === "bn" ? "সেটিংসে ক্যামেরা অনুমতি চালু করুন অথবা গ্যালারি থেকে ছবি আপলোড করুন।" : language === "hi" ? "सेटिंग में कैमरा अनुमति सक्षम करें या गैलरी से फोटो अपलोड करें।" : "Please enable camera permissions in device settings, or select a photo from your gallery.",
            reasons: [
              language === "bn" ? "সেটিংস > অ্যাপস > এগ্রিসাইট > পারমিশন" : language === "hi" ? "सेटिंग्स > ऐप्स > एग्रीसाइट > अनुमतियाँ" : "Settings > Apps > AgriSight > Permissions",
              language === "bn" ? "গ্যালারি থেকে ফটো আপলোড করুন" : language === "hi" ? "गैलरी से फोटो अपलोड करें" : "Upload photo from gallery",
            ],
          });
          setStep("error");
          return;
        }

        logAndroidScan("Camera Invocation", {
          status: "Launching native Camera activity",
        });

        const photo = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: source,
          correctOrientation: true,
        });

        if (!photo || (!photo.dataUrl && !photo.webPath && !photo.base64String)) {
          throw new Error("No image data received from device camera.");
        }

        logAndroidScan("Photo Captured", {
          image: photo.path || "data_url",
          status: "Converting image data to standard file blob",
        });

        let file: File;
        if (photo.dataUrl) {
          const arr = photo.dataUrl.split(",");
          const mime = arr[0].match(/:(.*?);/)?.[1] || (photo.format === "png" ? "image/png" : "image/jpeg");
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const blob = new Blob([u8arr], { type: mime });
          file = new File([blob], `scan_${Date.now()}.${photo.format || "jpg"}`, { type: mime });
        } else if (photo.base64String) {
          const mime = photo.format === "png" ? "image/png" : "image/jpeg";
          const bstr = atob(photo.base64String);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const blob = new Blob([u8arr], { type: mime });
          file = new File([blob], `scan_${Date.now()}.${photo.format || "jpg"}`, { type: mime });
        } else {
          const response = await fetch(photo.webPath!);
          const blob = await response.blob();
          file = new File([blob], `scan_${Date.now()}.${photo.format || "jpg"}`, {
            type: `image/${photo.format === "png" ? "png" : "jpeg"}`,
          });
        }

        preparePreview(file);
        return;
      }

      // Web Desktop Fallback
      if (source === CameraSource.Camera) {
        await startLiveCamera();
      } else {
        fileInputRef.current?.click();
      }
    } catch (err: any) {
      console.warn("[NATIVE CAPTURE ERROR]", err);
      if (
        err.message?.includes("cancelled") ||
        err.message?.includes("canceled") ||
        err.message?.includes("User cancelled") ||
        err.message?.includes("User closed")
      ) {
        logAndroidScan("Capture Cancelled", {
          status: "User closed camera without taking a photo",
        });
        if (step === "camera") setStep("idle");
        return;
      }
      logAndroidScan("Capture Error", {
        status: "Failed to open camera",
        error: err.message,
      });
      setError({
        category: "CAMERA_ERROR",
        title: language === "bn" ? "ক্যামেরা ত্রুটি" : language === "hi" ? "कैमरा त्रुटि" : "Camera Error",
        message: err.message || "Failed to open camera or capture image.",
      });
      setStep("error");
    }
  };

  // ── Start Live Camera ────────────────────────────────────────────
  const startLiveCamera = async (targetFacing: "environment" | "user" = facingMode) => {
    stopLiveCamera();
    setCameraError(null);
    setStep("camera");

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Live camera streaming is not supported on this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn("[CAMERA WARNING] Live stream unavailable, falling back to native capture:", err);
      stopLiveCamera();
      // Fallback directly to native camera file input
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      } else {
        setError({
          category: "CAMERA_ERROR",
          title: t("cameraUnavailable"),
          message: t("cameraUnavailable"),
          reasons: [
            language === "bn" ? "ব্রাউজার ক্যামেরা অনুমতি যাচাই করুন" : language === "hi" ? "ब्राउज़र कैमरा अनुमति जांचें" : "Check camera browser permissions",
            language === "bn" ? "গ্যালারি থেকে ছবি আপলোড করুন" : language === "hi" ? "गैलरी से फोटो अपलोड करें" : "Upload photo from gallery",
          ],
        });
        setStep("error");
      }
    }
  };

  // ── Capture Frame from Live Video ────────────────────────────────
  const captureFrame = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn("[SCAN WARNING] Video frame not ready for capture");
      setError({
        category: "IMAGE_CAPTURE_ERROR",
        title: language === "bn" ? "ক্যামেরা ফ্রেম প্রস্তুত নয়" : language === "hi" ? "कैमरा फ्रेम तैयार नहीं" : "Camera Frame Not Ready",
        message: language === "bn" ? "ভিডিও ফ্রেম ক্যাপচার করা যাচ্ছে না। ক্যামেরা স্থির রাখুন এবং পুনরায় চেষ্টা করুন।" : language === "hi" ? "वीडियो फ्रेम कैप्चर नहीं हो पाया। कैमरा स्थिर रखें और पुनः प्रयास करें।" : "Unable to capture a clear video frame. Please hold steady and try again.",
      });
      setStep("error");
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not initialize 2D canvas context");

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size === 0) {
            console.warn("[SCAN WARNING] canvas.toBlob returned null or empty blob");
            setError({
              category: "IMAGE_CAPTURE_ERROR",
              title: language === "bn" ? "ফ্রেম ক্যাপচার ত্রুটি" : language === "hi" ? "फ्रेम कैप्चर त्रुटि" : "Frame Capture Error",
              message: language === "bn" ? "ক্যামেরা স্ট্রিম থেকে ছবি ডেটা ক্যাপচার করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।" : language === "hi" ? "कैमरा स्ट्रीम से छवि डेटा कैप्चर करने में विफल। कृपया पुनः प्रयास करें।" : "Failed to capture image data from camera stream. Please try again.",
            });
            setStep("error");
            return;
          }

          const file = new File([blob], `scan_${Date.now()}.jpg`, { type: "image/jpeg" });
          stopLiveCamera();
          preparePreview(file);
        },
        "image/jpeg",
        0.92
      );
    } catch (err: any) {
      console.warn("[SCAN WARNING] Capture frame failed:", err);
      stopLiveCamera();
      setError({
        category: "IMAGE_CAPTURE_ERROR",
        title: language === "bn" ? "ক্যাপচার ব্যর্থ" : language === "hi" ? "कैप्चर विफल" : "Capture Failed",
        message: err.message || (language === "bn" ? "ক্যামেরা ফ্রেম প্রক্রিয়া করতে ব্যর্থ হয়েছে।" : language === "hi" ? "कैमरा फ्रेम प्रोसेस करने में विफल।" : "Failed to process captured frame."),
      });
      setStep("error");
    }
  };

  // ── Drag & Drop ──────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      preparePreview(files[0]);
    }
  }, []);

  // ── Image Quality Inspection ─────────────────────────────────
  const inspectImageQuality = (file: File): Promise<ImageQualityMetrics> => {
    return new Promise((resolve) => {
      const img = document.createElement("img");
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        const width = img.naturalWidth || 100;
        const height = img.naturalHeight || 100;

        // Sample 50x50 downscaled canvas to calculate brightness & contrast
        const canvas = document.createElement("canvas");
        canvas.width = 50;
        canvas.height = 50;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          resolve({ width, height, brightness: 128, contrast: 50, isDark: false, isFlat: false });
          return;
        }

        ctx.drawImage(img, 0, 0, 50, 50);
        const imgData = ctx.getImageData(0, 0, 50, 50);
        const data = imgData.data;

        let totalBrightness = 0;
        const pixelCount = data.length / 4;
        const lumas: number[] = [];

        for (let i = 0; i < data.length; i += 4) {
          const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          lumas.push(luma);
          totalBrightness += luma;
        }

        const avgBrightness = totalBrightness / pixelCount;

        // Variance / Contrast
        let variance = 0;
        for (const luma of lumas) {
          variance += Math.pow(luma - avgBrightness, 2);
        }
        const stdDev = Math.sqrt(variance / pixelCount);

        URL.revokeObjectURL(objectUrl);

        resolve({
          width,
          height,
          brightness: Math.round(avgBrightness),
          contrast: Math.round(stdDev),
          isDark: avgBrightness < 18,
          isFlat: stdDev < 8,
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ width: 0, height: 0, brightness: 128, contrast: 50, isDark: false, isFlat: false });
      };

      img.src = objectUrl;
    });
  };

  // ── File Selection & Validation ──────────────────────────────
  const preparePreview = async (file: File) => {
    if (!file || file.size === 0) {
      setError({
        category: "IMAGE_VALIDATION_ERROR",
        title: t("errorNoFile"),
        message: "The selected image is empty or unreadable.",
      });
      setStep("error");
      return;
    }

    if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|heic|bmp)$/i.test(file.name)) {
      setError({
        category: "IMAGE_VALIDATION_ERROR",
        title: t("errorInvalidType"),
        message: t("errorInvalidType"),
      });
      setStep("error");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setError({
        category: "IMAGE_VALIDATION_ERROR",
        title: t("fileTooLarge"),
        message: t("fileTooLarge"),
      });
      setStep("error");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setSelectedFile(file);
    setError(null);
    setStep("preview");

    // Asynchronously calculate metrics in background
    inspectImageQuality(file).then((metrics) => {
      setQualityMetrics(metrics);
    }).catch(() => {});
  };


  // ── Analysis Pipeline Execution ──────────────────────────────
  const handleAnalyze = async () => {
    if (!selectedFile || step === "analyzing") return;

    // ── Reset all state for fresh scan ─────────────────────────
    setEdgeState({ status: "idle" });
    setLastEdgeResult(null);
    setError(null);
    setStep("analyzing");
    setAnalysisStage(0);

    let stageIndicator = "EDGE_VALIDATION";

    try {
      // ════════════════════════════════════════════════════════
      // STAGE -1: OPTIONAL LOCAL EDGE AI VALIDATION (no cloud call)
      // Determines CROP / NON_CROP / UNCERTAIN entirely in-browser.
      // SPRINT RULE (a2.md Section 1): ONLINE-ONLY. Edge AI must NEVER block execution.
      // If edge model fails to load, gracefully fall through to backend Gemini Vision.
      // ════════════════════════════════════════════════════════
      setEdgeState({ status: "loading" });

      let edgeResult: EdgeValidationResult | null = null;
      try {
        await loadEdgeModel();
        setEdgeState({ status: "validating" });
        edgeResult = await edgeValidateImage(selectedFile);
        setLastEdgeResult(edgeResult);

        console.info(`[EdgeAI] Decision: ${edgeResult.decision} (${(edgeResult.confidence * 100).toFixed(1)}%) in ${edgeResult.inferenceMs}ms`);
      } catch (edgeLoadErr: any) {
        // Model unavailable or not supported — online sprint fallback.
        console.warn("[EdgeAI] Edge model not available. Proceeding with cloud Gemini Vision analysis:", edgeLoadErr?.message || edgeLoadErr);
        setEdgeState({ status: "idle" });
      }

      // ── Branch on edge decision (only if edge model ran successfully) ──────
      if (edgeResult) {
        if (edgeResult.decision === "NON_CROP") {
          // REJECT — show non-crop UI, no cloud request
          setEdgeState({ status: "NON_CROP", confidence: edgeResult.confidence });
          setStep("edge-rejected");
          return;  // ← STOPS HERE. No Gemini call, no diagnosis, no DB record.
        }

        if (edgeResult.decision === "UNCERTAIN") {
          // UNCERTAIN — ask for clearer image, no cloud request
          setEdgeState({ status: "UNCERTAIN" });
          setStep("edge-rejected");
          return;  // ← STOPS HERE. No Gemini call.
        }
      }

      // CROP or edge bypassed — continue to existing cloud pipeline
      setEdgeState({ status: "idle" });

      // ════════════════════════════════════════════════════════
      // STAGE 0: Safe Client Compression
      // ════════════════════════════════════════════════════════
      stageIndicator = "COMPRESSION";
      setAnalysisStage(0);
      let fileToSend: File = selectedFile;
      try {
        if (selectedFile.size > 800 * 1024) {
          const imageCompression = (await import("browser-image-compression")).default;
          const compressed = await imageCompression(selectedFile, {
            maxSizeMB: 1.5,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            fileType: "image/jpeg",
          });
          fileToSend = new File([compressed], selectedFile.name.replace(/\.[^/.]+$/, ".jpg"), {
            type: "image/jpeg",
          });
        }
      } catch (compErr) {
        console.warn("[SCAN PREPROCESSING] Client compression skipped, sending original:", compErr);
        fileToSend = selectedFile;
      }

      // Stage 1: Geolocation (non-blocking)
      setAnalysisStage(1);
      stageIndicator = "GEOLOCATION_AND_UPLOAD";
      let lat: string | undefined;
      let lon: string | undefined;
      if (typeof navigator !== "undefined" && "geolocation" in navigator) {
        try {
          const geoPromise = new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 1200, maximumAge: 60000 });
          });
          const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("geo_timeout")), 1000));
          const pos = await Promise.race([geoPromise, timeoutPromise]) as GeolocationPosition;
          lat = pos.coords.latitude.toString();
          lon = pos.coords.longitude.toString();
        } catch {
          // Silently proceed without blocking
        }
      }

      // Stage 2: AI Diagnosis & Vision Analysis
      setAnalysisStage(2);
      stageIndicator = "AI_PATHOLOGY";
      const result = await api.uploadAnalysis(
        fileToSend,
        lat,
        lon,
        question.trim() || undefined,
        selectedCropId || undefined,
        selectedFieldId || undefined,
        language
      );

      // Stage 3: Structuring Prescription Insights
      setAnalysisStage(3);
      stageIndicator = "RESULT_PACKAGING";

      if (result && result.id) {
        try {
          sessionStorage.setItem(`agrisight_analysis_${result.id}`, JSON.stringify(result));
          if (previewUrl) {
            sessionStorage.setItem(`agrisight_image_${result.id}`, previewUrl);
          }
          if (fileToSend) {
            const reader = new FileReader();
            reader.onloadend = () => {
              try {
                if (typeof reader.result === "string") {
                  sessionStorage.setItem(`agrisight_image_${result.id}`, reader.result);
                }
              } catch {}
            };
            reader.readAsDataURL(fileToSend);
          }
        } catch {}
        await new Promise((r) => setTimeout(r, 200));
        router.push(`/analysis?id=${result.id}`);
      } else {
        throw new Error("Analysis completed but no record was created. Please try again.");
      }
    } catch (err: any) {
      const msg = err.message || "Unknown error";
      const isNetwork =
        msg.toLowerCase().includes("network") ||
        msg.toLowerCase().includes("connection") ||
        msg.toLowerCase().includes("reach") ||
        msg.toLowerCase().includes("fetch");
      const isTimeout = msg.toLowerCase().includes("timeout") || msg.toLowerCase().includes("timed out");

      let category: ErrorCategory = "AI_ERROR";
      if (isNetwork) category = "NETWORK_ERROR";
      else if (isTimeout) category = "AI_TIMEOUT";
      else if (msg.toLowerCase().includes("database") || msg.toLowerCase().includes("save")) category = "DATABASE_ERROR";
      else if (msg.toLowerCase().includes("image") || msg.toLowerCase().includes("decode")) category = "IMAGE_VALIDATION_ERROR";

      console.warn("[SCAN ERROR]", {
        stage: stageIndicator,
        category,
        message: msg,
        rawError: err?.message || String(err),
      });

      setError({
        category,
        title: isNetwork
          ? (language === "bn" ? "সার্ভারের সাথে সংযোগ বিচ্ছিন্ন" : language === "hi" ? "सर्वर से कनेक्शन विफल" : "Connection Error")
          : isTimeout
          ? (language === "bn" ? "সময়সীমা অতিক্রম করেছে" : language === "hi" ? "अनुरोध समय समाप्त" : "Request Timed Out")
          : t("errorOccurred"),
        message: isNetwork
          ? (language === "bn" ? "ইন্টারনেট সংযোগ পরীক্ষা করুন এবং পুনরায় চেষ্টা করুন।" : language === "hi" ? "कृपया अपना इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।" : "Connection lost while communicating with the analysis server.")
          : isTimeout
          ? (language === "bn" ? "AI সার্ভার থেকে উত্তর আসতে অতিরিক্ত সময় লাগছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।" : language === "hi" ? "AI सर्वर ने प्रतिक्रिया देने में बहुत अधिक समय लिया। कृपया पुनः प्रयास करें।" : "The AI analysis took too long to complete. Please try again.")
          : msg,
        reasons: isNetwork
          ? [
              language === "bn" ? "ওয়াইফাই বা মোবাইল ডাটা সক্রিয় রয়েছে কিনা দেখুন" : language === "hi" ? "वाईफाई या मोबाइल डेटा कनेक्शन जांचें" : "Verify WiFi or mobile data connection",
              language === "bn" ? "কিছুক্ষণ পর পুনরায় চেষ্টা করুন" : language === "hi" ? "कुछ पलों में पुनः प्रयास करें" : "Retry in a few moments",
            ]
          : [
              language === "bn" ? "পাতার আরও পরিষ্কার ও স্পষ্ট ছবি তুলুন" : language === "hi" ? "पत्ती की स्पष्ट फोटो लें" : "Take a clearer photo of the leaf",
              language === "bn" ? "পর্যাপ্ত প্রাকৃতিক আলোতে ছবি তুলুন" : language === "hi" ? "अच्छी रोशनी में फोटो खींचें" : "Ensure good natural lighting",
              language === "bn" ? "একটি আক্রান্ত পাতার উপর ক্যামেরা স্থির রাখুন" : language === "hi" ? "एक प्रभावित पत्ती पर फोकस रखें" : "Keep focus centered on a single leaf",
            ],
        rawError: msg,
      });
      setStep("error");
    }
  };

  const handleReset = () => {
    stopLiveCamera();
    setStep("idle");
    setPreviewUrl(null);
    setSelectedFile(null);
    setQualityMetrics(null);
    setError(null);
    setAnalysisStage(0);
    setQuestion("");
    setShowVoicePanel(false);
    // Reset edge validation state — prevents previous scan result leaking
    setEdgeState({ status: "idle" });
    setLastEdgeResult(null);
    speech.reset();
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Page Header ── */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-xl border-b border-outline-variant/20">
        <div className="max-w-2xl lg:max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="touch-target w-11 h-11 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-extrabold text-on-surface tracking-tight leading-none">
              {t("scanLeaf")}
            </h1>
            {step === "idle" && (
              <p className="text-xs text-on-surface-variant font-medium mt-0.5 leading-none">
                {t("uploadInstruction")}
              </p>
            )}
          </div>
          {step !== "idle" && step !== "analyzing" && (
            <button
              onClick={handleReset}
              className="text-xs font-bold text-primary hover:underline shrink-0"
              aria-label="Start over"
            >
              {t("reTake")}
            </button>
          )}
        </div>
      </div>

      {/* ── Main Content Container ── */}
      <div className="max-w-2xl lg:max-w-4xl mx-auto px-4 py-6 pb-32 space-y-6">

        {/* ══ STEP: IDLE — Scan invitation ══ */}
        {step === "idle" && (
          <>
            {/* Crop & Field Selection Widget */}
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-[1.75rem] p-5 shadow-sm space-y-4">
              {/* Crop Selector */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                    <h3 className="text-xs font-black text-on-surface uppercase tracking-widest">{t("selectCropOptional")}</h3>
                  </div>
                  <Link href="/crops/new" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">add</span>
                    {t("addCrop")}
                  </Link>
                </div>

                {loadingCrops ? (
                  <div className="h-8 bg-surface-container-high rounded-xl animate-pulse" />
                ) : crops.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setSelectedCropId("")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        !selectedCropId
                          ? "bg-primary text-on-primary shadow-sm"
                          : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-dim"
                      }`}
                    >
                      {t("noAssignedCrop")}
                    </button>
                    {crops.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCropId(c.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          selectedCropId === c.id
                            ? "bg-primary text-on-primary shadow-sm"
                            : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-dim"
                        }`}
                      >
                        <span>{c.name}</span>
                        {c.variety && <span className="opacity-75 text-[10px]">({c.variety})</span>}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Field Selector */}
              {fields.length > 0 && (
                <div className="space-y-2.5 pt-3 border-t border-outline-variant/15">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>grid_view</span>
                      <h3 className="text-xs font-black text-on-surface uppercase tracking-widest">{t("selectFieldOptional")}</h3>
                    </div>
                    <Link href="/fields" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">map</span>
                      {t("fields")}
                    </Link>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setSelectedFieldId("")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        !selectedFieldId
                          ? "bg-primary text-on-primary shadow-sm"
                          : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-dim"
                      }`}
                    >
                      {t("noAssignedField")}
                    </button>
                    {fields.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSelectedFieldId(f.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          selectedFieldId === f.id
                            ? "bg-primary text-on-primary shadow-sm"
                            : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-dim"
                        }`}
                      >
                        <span>{f.name}</span>
                        <span className="opacity-75 text-[10px]">({f.area_acres} ac)</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Hero scan card */}
            <div
              className={`relative overflow-hidden rounded-[2rem] border-2 transition-all duration-300 ${
                isDragging
                  ? "border-primary bg-primary-container/20 scale-[1.01] shadow-xl"
                  : "border-outline-variant/30 bg-surface-container-low hover:border-primary/40"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 2px 2px, var(--color-primary) 1px, transparent 0)",
                  backgroundSize: "32px 32px",
                }}
              />

              <div className="relative z-10 p-8 sm:p-12 flex flex-col items-center text-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center">
                      <span
                        className="material-symbols-outlined text-5xl text-primary"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        energy_savings_leaf
                      </span>
                    </div>
                  </div>
                  <span className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">eco</span>
                      {language === "bn" ? "রোগ নির্ণয়" : language === "hi" ? "रोग निदान" : "Disease Diagnosis"}
                    </span>
                    <span className="px-3 py-1 bg-amber-500/15 text-amber-800 border border-amber-500/30 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">pest_control</span>
                      {language === "bn" ? "কীটপতঙ্গ ও IPM" : language === "hi" ? "कीट एवं IPM" : "Pest & IPM Detection"}
                    </span>
                    <span className="px-3 py-1 bg-emerald-500/15 text-emerald-800 border border-emerald-500/30 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">science</span>
                      {language === "bn" ? "পুষ্টি ঘাটতি" : language === "hi" ? "पोषक तत्व जांच" : "Nutrient Screening"}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                    {t("scanLeaf")}
                  </h2>
                  <p className="text-on-surface-variant text-sm sm:text-base font-medium max-w-md mx-auto leading-relaxed">
                    {t("uploadInstruction")}
                  </p>
                </div>

                {isDragging ? (
                  <div className="w-full py-6 border-2 border-dashed border-primary rounded-2xl flex flex-col items-center gap-2 bg-primary/5">
                    <span className="material-symbols-outlined text-4xl text-primary">add_photo_alternate</span>
                    <p className="text-primary font-bold text-sm">{t("dragAndDrop")}</p>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm sm:max-w-md mx-auto">
                    {/* Take Photo CTA */}
                    <button
                      type="button"
                      onClick={() => triggerNativeCapture(CameraSource.Camera)}
                      className="flex-1 py-3.5 px-5 bg-primary text-on-primary font-bold rounded-2xl shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                      aria-label="Take Photo"
                    >
                      <span className="material-symbols-outlined text-lg">photo_camera</span>
                      {t("takePhoto")}
                    </button>

                    {/* Gallery / File Picker CTA */}
                    <button
                      type="button"
                      onClick={() => triggerNativeCapture(CameraSource.Photos)}
                      className="flex-1 py-3.5 px-5 bg-surface-container-highest text-on-surface font-bold rounded-2xl hover:bg-surface-dim active:scale-95 transition-all shadow-sm text-sm flex items-center justify-center gap-2"
                      aria-label="Choose Photo from Gallery"
                    >
                      <span className="material-symbols-outlined text-lg">photo_library</span>
                      {t("chooseFile")}
                    </button>

                    {/* Hidden browser file input fallback */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      aria-label={t("chooseFile")}
                      onChange={(e) => {
                        if (e.target.files?.[0]) preparePreview(e.target.files[0]);
                      }}
                    />
                  </div>
                )}

                {/* Hidden native camera capture fallback */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  aria-label="Native camera fallback"
                  onChange={(e) => {
                    if (e.target.files?.[0]) preparePreview(e.target.files[0]);
                  }}
                />

                {!isDragging && (
                  <p className="text-xs text-on-surface-variant/60 font-medium">
                    {t("dragAndDrop")}
                  </p>
                )}
              </div>
            </div>

            {/* ── Voice Question Panel ── */}
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-[1.5rem] p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>record_voice_over</span>
                  <h3 className="text-xs font-black text-on-surface uppercase tracking-widest">{t("voiceInputTitle")}</h3>
                  <span className="text-xs text-on-surface-variant font-medium normal-case tracking-normal">({t("optionalContext")})</span>
                </div>
                {!showVoicePanel && (
                  <button
                    type="button"
                    onClick={() => setShowVoicePanel(true)}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    aria-label="Expand voice question panel"
                  >
                    <span className="material-symbols-outlined text-base">expand_more</span>
                    {t("askButton")}
                  </button>
                )}
              </div>

              {!showVoicePanel && (
                <p className="text-sm text-on-surface-variant font-medium">
                  {t("speakNowPrompt")}
                </p>
              )}

              {showVoicePanel && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {speech.state === "listening" ? (
                        <button
                          type="button"
                          onClick={speech.stopListening}
                          aria-label={t("stopListening")}
                          className="relative w-11 h-11 rounded-full bg-error text-on-error flex items-center justify-center shadow-lg shadow-error/30 shrink-0 transition-all active:scale-90"
                        >
                          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>stop_circle</span>
                          <span className="absolute inset-0 rounded-full border-2 border-error animate-ping opacity-60" />
                        </button>
                      ) : speech.state === "requesting" ? (
                        <div className="w-11 h-11 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-xl text-primary animate-pulse">mic</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            speech.reset();
                            speech.startListening();
                          }}
                          aria-label={t("voiceInputTitle")}
                          disabled={!speech.isSupported}
                          className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md shadow-primary/25 shrink-0 hover:bg-primary/90 active:scale-90 transition-all disabled:opacity-40"
                        >
                          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
                        </button>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-black uppercase tracking-wider">
                            {LANGUAGE_CONFIG[language]?.speech}
                          </span>
                          <span className="text-xs font-extrabold text-on-surface truncate">
                            {LANGUAGE_CONFIG[language]?.nativeName}
                          </span>
                          <VoiceVisualizer state={speech.state} />
                        </div>
                        <p
                          className={`text-xs mt-0.5 truncate ${
                            speech.state === "listening"
                              ? "text-error font-bold animate-pulse"
                              : speech.state === "denied"
                              ? "text-error font-extrabold"
                              : speech.state === "network_error"
                              ? "text-amber-700 dark:text-amber-400 font-bold"
                              : "text-on-surface-variant font-medium"
                          }`}
                        >
                          {speech.state === "listening"
                            ? t("listeningInLanguage", { lang: LANGUAGE_CONFIG[language]?.nativeName })
                            : speech.state === "denied"
                            ? t("micPermissionDenied")
                            : speech.state === "network_error"
                            ? t("speechNetworkError")
                            : !speech.isSupported
                            ? t("voiceNotSupported")
                            : speech.state === "captured" && speech.transcript
                            ? speech.transcript
                            : t("speakNowPrompt")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {(speech.transcript || question) && (
                        <button
                          type="button"
                          onClick={() => {
                            speech.reset();
                            setQuestion("");
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                          title={t("clearVoiceInput")}
                        >
                          {t("clearVoiceInput")}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          speech.stopListening();
                          setShowVoicePanel(false);
                        }}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                        aria-label="Collapse voice panel"
                      >
                        <span className="material-symbols-outlined text-base">expand_less</span>
                      </button>
                    </div>
                  </div>

                  {/* Editable transcript / question field */}
                  <div className="relative">
                    <textarea
                      id="voice-question"
                      rows={2}
                      value={speech.state === "listening" ? speech.transcript : (speech.transcript || question)}
                      onChange={(e) => {
                        speech.setTranscript(e.target.value);
                        setQuestion(e.target.value);
                      }}
                      onBlur={(e) => setQuestion(e.target.value)}
                      placeholder={t("askQuestionPlaceholder")}
                      aria-label="Your question for the AI"
                      className="w-full bg-surface-container-high rounded-2xl px-4 py-3 text-sm font-semibold text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ══ STEP: CAMERA — Live Video Viewfinder ══ */}
        {step === "camera" && (
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-[2rem] overflow-hidden shadow-2xl space-y-4">
            <div className="relative aspect-[4/3] bg-black overflow-hidden flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Target Guidelines */}
              <div className="absolute inset-8 border-2 border-white/40 rounded-3xl pointer-events-none flex flex-col justify-between p-4">
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                </div>
                <div className="text-center">
                  <span className="bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full">
                    Center the leaf inside the frame
                  </span>
                </div>
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                </div>
              </div>

              {/* Top Controls */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const nextFacing = facingMode === "environment" ? "user" : "environment";
                    setFacingMode(nextFacing);
                    startLiveCamera(nextFacing);
                  }}
                  className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition-all shadow-lg"
                  aria-label={t("switchCamera")}
                >
                  <span className="material-symbols-outlined text-xl">flip_camera_ios</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition-all shadow-lg"
                  aria-label={t("closeCamera")}
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
            </div>

            {/* Bottom Shutter Bar */}
            <div className="p-6 flex items-center justify-center gap-6">
              <button
                type="button"
                onClick={() => {
                  stopLiveCamera();
                  if (cameraInputRef.current) cameraInputRef.current.click();
                }}
                className="w-12 h-12 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center hover:bg-surface-container-highest transition-all"
                aria-label="Use native camera file picker"
              >
                <span className="material-symbols-outlined text-xl">photo_library</span>
              </button>

              {/* Capture Shutter Button */}
              <button
                type="button"
                onClick={captureFrame}
                className="w-20 h-20 rounded-full border-4 border-primary bg-primary/20 flex items-center justify-center p-1 shadow-xl hover:scale-105 active:scale-95 transition-all"
                aria-label={t("snapPhoto")}
              >
                <div className="w-full h-full rounded-full bg-primary flex items-center justify-center text-on-primary">
                  <span className="material-symbols-outlined text-3xl">photo_camera</span>
                </div>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="w-12 h-12 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center hover:bg-surface-container-highest transition-all"
                aria-label="Cancel camera"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP: PREVIEW — Show image + confirm ══ */}
        {step === "preview" && previewUrl && (
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-[2rem] overflow-hidden shadow-sm space-y-4">
            <div className="relative aspect-[4/3] bg-surface-container-low overflow-hidden">
              <Image
                src={previewUrl}
                alt="Selected leaf preview"
                fill
                className="object-cover"
                sizes="(max-width: 672px) 100vw, 672px"
                priority
              />
              <div className="absolute top-3 left-3 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{t("smartInsight")}</span>
              </div>
              <button
                onClick={handleReset}
                aria-label="Remove and choose a different image"
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-surface-container-lowest/90 backdrop-blur-md flex items-center justify-center text-on-surface hover:bg-error-container hover:text-error transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Image Quality Warning Banner if photo is unusually dark or uniform */}
            {qualityMetrics && (qualityMetrics.isDark || qualityMetrics.isFlat) && (
              <div className="mx-5 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-xs">
                <span className="material-symbols-outlined text-amber-500 text-lg shrink-0">warning</span>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="font-bold text-amber-600 dark:text-amber-400">
                    {qualityMetrics.isDark ? t("qualityWarningDark") : t("qualityWarningBlur")}
                  </p>
                  <p className="text-on-surface-variant font-medium">
                    You can still analyze this image, or retake in brighter natural light.
                  </p>
                </div>
              </div>
            )}

            {/* ── Optional Edge AI Notice (Informational — never blocks online analysis) ── */}
            {edgeState.status === "model_error" && (
              <div id="edge-model-error-banner" className="mx-5 p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-lg shrink-0">cloud_done</span>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="font-bold text-on-surface text-sm">
                      {language === "bn" ? "অনলাইন ক্লাউড বিশ্লেষণ সক্রিয়" : language === "hi" ? "ऑनलाइन क्लाउड विश्लेषण सक्रिय" : "Online Gemini Cloud Analysis Active"}
                    </p>
                    <p className="text-xs text-on-surface-variant font-medium">
                      {language === "bn" ? "সরাসরি ক্লাউড AI মডেলের মাধ্যমে নিখুঁত রোগ ও ফসল বিশ্লেষণ সম্পন্ন হবে।" : language === "hi" ? "सीधे क्लाउड AI द्वारा सटीक रोग व फसल विश्लेषण किया जाएगा।" : "Your scan will be analyzed directly with Gemini Vision cloud intelligence."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span
                    className="material-symbols-outlined text-primary text-xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    image
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-on-surface text-sm truncate">
                    {selectedFile?.name || t("selectImage")}
                  </p>
                  <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                    {selectedFile ? `${(selectedFile.size / 1024).toFixed(0)} KB` : ""}
                    {qualityMetrics?.width ? ` · ${qualityMetrics.width} × ${qualityMetrics.height}px` : ""}
                  </p>
                </div>
              </div>

              {/* Assigned Crop selector in preview */}
              <div className="flex items-center justify-between p-3.5 bg-surface-container rounded-2xl border border-outline-variant/15 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-primary text-base shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                  <span className="font-bold text-on-surface truncate">
                    {selectedCropId && crops.find((c) => c.id === selectedCropId)
                      ? `${crops.find((c) => c.id === selectedCropId)?.name}`
                      : t("noAssignedCrop")}
                  </span>
                </div>
                {crops.length > 0 && (
                  <select
                    value={selectedCropId}
                    onChange={(e) => setSelectedCropId(e.target.value)}
                    className="bg-surface-container-highest text-on-surface text-xs font-bold px-2.5 py-1.5 rounded-xl border-0 outline-none cursor-pointer hover:bg-surface-dim transition-colors"
                    aria-label="Select linked crop"
                  >
                    <option value="">{t("noAssignedCrop")}</option>
                    {crops.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.variety ? `(${c.variety})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Assigned Field selector in preview */}
              {fields.length > 0 && (
                <div className="flex items-center justify-between p-3.5 bg-surface-container rounded-2xl border border-outline-variant/15 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-primary text-base shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>grid_view</span>
                    <span className="font-bold text-on-surface truncate">
                      {selectedFieldId && fields.find((f) => f.id === selectedFieldId)
                        ? `${fields.find((f) => f.id === selectedFieldId)?.name}`
                        : t("noAssignedField")}
                    </span>
                  </div>
                  <select
                    value={selectedFieldId}
                    onChange={(e) => setSelectedFieldId(e.target.value)}
                    className="bg-surface-container-highest text-on-surface text-xs font-bold px-2.5 py-1.5 rounded-xl border-0 outline-none cursor-pointer hover:bg-surface-dim transition-colors"
                    aria-label="Select linked field"
                  >
                    <option value="">{t("noAssignedField")}</option>
                    {fields.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.area_acres} ac)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Analyze CTA */}
              <button
                id="analyze-leaf-btn"
                onClick={handleAnalyze}
                className="w-full py-4 bg-primary text-on-primary font-extrabold rounded-2xl shadow-lg shadow-primary/25 flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all text-base"
                aria-label="Analyze this leaf image with AI"
              >
                <span
                  className="material-symbols-outlined text-xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  analytics
                </span>
                {t("startAnalysisButton")}
              </button>

              <button
                onClick={handleReset}
                className="w-full py-3 text-on-surface-variant font-bold rounded-2xl hover:bg-surface-container-highest transition-colors text-sm flex items-center justify-center gap-1.5"
                aria-label="Choose a different image"
              >
                <span className="material-symbols-outlined text-base">swap_horiz</span>
                {t("reTake")}
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP: ANALYZING — Loading stages ══ */}
        {step === "analyzing" && (
          <div className="flex flex-col items-center justify-center py-8 space-y-8">
            <div className="relative">
              {previewUrl && (
                <div className="w-32 h-32 rounded-[2rem] overflow-hidden shadow-xl border-4 border-surface-container-lowest">
                  <Image src={previewUrl} alt="Analyzing leaf" fill className="object-cover opacity-80" />
                </div>
              )}
              <div className="absolute inset-0 rounded-[2rem] overflow-hidden">
                <div
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80"
                  style={{
                    animation: "scanLine 2s ease-in-out infinite",
                  }}
                />
              </div>
              <div className="absolute -inset-2 rounded-[2.5rem] border-2 border-primary/30 animate-pulse" />
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-xl font-extrabold text-on-surface tracking-tight">
                {edgeState.status === "loading"
                  ? "Preparing scan AI..."
                  : edgeState.status === "validating"
                  ? "Validating crop image..."
                  : t("analyzingTitle")}
              </h2>
              <p className="text-sm text-on-surface-variant font-medium">
                {edgeState.status === "loading" || edgeState.status === "validating"
                  ? "Running local crop check — no internet needed"
                  : t("analyzingInstruction")}
              </p>
            </div>

            {/* Edge AI stage indicator */}
            {(edgeState.status === "loading" || edgeState.status === "validating") && (
              <div id="edge-validating-indicator" className="w-full max-w-xs">
                <div className="flex items-center gap-3 p-3.5 bg-primary/8 border border-primary/20 rounded-2xl">
                  <div className="w-8 h-8 rounded-full bg-primary/15 text-primary ring-2 ring-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-sm animate-spin" style={{ animationDuration: "1.5s" }}>refresh</span>
                  </div>
                  <span className="text-sm font-semibold text-primary">
                    {edgeState.status === "loading" ? "Loading edge AI model..." : "Running crop detection..."}
                  </span>
                  <span className="ml-auto flex gap-0.5">
                    {[0,1,2].map((j) => (
                      <span key={j} className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${j * 0.15}s` }} />
                    ))}
                  </span>
                </div>
              </div>
            )}

            {/* Standard cloud stages — only show after edge passed */}
            {edgeState.status === "idle" && (
              <div className="w-full max-w-xs space-y-3">
                {analysisStages.map((s, i) => {
                  const isDone = i < analysisStage;
                  const isCurrent = i === analysisStage;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 transition-all duration-500 ${
                        isDone ? "opacity-50" : isCurrent ? "opacity-100" : "opacity-20"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center transition-all duration-300 ${
                          isDone
                            ? "bg-primary text-on-primary"
                            : isCurrent
                            ? "bg-primary/15 text-primary ring-2 ring-primary"
                            : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        {isDone ? (
                          <span className="material-symbols-outlined text-sm">check</span>
                        ) : isCurrent ? (
                          <span className="material-symbols-outlined text-sm animate-spin" style={{ animationDuration: "1.5s" }}>
                            refresh
                          </span>
                        ) : (
                          <span className="material-symbols-outlined text-sm">{s.icon}</span>
                        )}
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          isCurrent ? "text-primary" : "text-on-surface-variant"
                        }`}
                      >
                        {s.label}
                      </span>
                      {isCurrent && (
                        <span className="ml-auto flex gap-0.5">
                          {[0, 1, 2].map((j) => (
                            <span
                              key={j}
                              className="w-1 h-1 rounded-full bg-primary animate-bounce"
                              style={{ animationDelay: `${j * 0.15}s` }}
                            />
                          ))}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ STEP: EDGE-REJECTED — NON_CROP or UNCERTAIN ══ */}
        {step === "edge-rejected" && (
          <div className="space-y-4">
            {/* NON_CROP rejection card */}
            {edgeState.status === "NON_CROP" && (
              <div
                id="edge-non-crop-rejection"
                className="bg-amber-500/10 border border-amber-500/30 rounded-[2rem] p-6 sm:p-8 flex flex-col items-center text-center gap-5"
              >
                <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-600 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                </div>
                {previewUrl && (
                  <div className="w-28 h-28 rounded-[1.25rem] overflow-hidden border-2 border-amber-500/30 shadow-md opacity-75">
                    <Image src={previewUrl} alt="Rejected image" fill className="object-cover" />
                  </div>
                )}
                <div className="space-y-2">
                  <h2 className="text-xl font-extrabold text-on-surface">
                    {language === "bn" ? "⚠️ অবৈধ ফসলের ছবি" : language === "hi" ? "⚠️ अमान्य फसल तस्वीर" : "⚠️ Invalid Crop Image"}
                  </h2>
                  <p className="text-sm text-on-surface-variant font-medium leading-relaxed max-w-xs">
                    {language === "bn"
                      ? "এই ছবিটি কোনো ফসল বা উদ্ভিদের নয়। সঠিক কৃষিভিত্তিক বিশ্লেষণের জন্য অনুগ্রহ করে পাতার পরিষ্কার ছবি দিন।"
                      : language === "hi"
                      ? "यह तस्वीर किसी फसल या पौधे की नहीं लगती है। सटीक कृषि विश्लेषण के लिए कृपया किसी पत्ती की साफ फोटो लें।"
                      : "This image does not appear to contain a crop or plant suitable for agricultural analysis."}
                  </p>
                  <p className="text-xs text-on-surface-variant/60 font-mono">
                    {language === "bn" ? "অকৃষি নিশ্চিততা" : language === "hi" ? "गैर-फसल विश्वास" : "Non-crop confidence"}: {(edgeState.confidence * 100).toFixed(1)}%
                    {lastEdgeResult && ` · ${lastEdgeResult.inferenceMs}ms · ${lastEdgeResult.modelVersion}`}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                  <button
                    id="edge-retake-btn"
                    type="button"
                    onClick={() => triggerNativeCapture(CameraSource.Camera)}
                    className="flex-1 py-3.5 px-5 bg-primary text-on-primary font-bold rounded-2xl shadow-md shadow-primary/25 hover:bg-primary/90 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                    aria-label="Retake photo of a crop"
                  >
                    <span className="material-symbols-outlined text-base">photo_camera</span>
                    {t("reTake")}
                  </button>
                  <button
                    id="edge-upload-another-btn"
                    type="button"
                    onClick={() => triggerNativeCapture(CameraSource.Photos)}
                    className="flex-1 py-3.5 px-5 bg-surface-container-highest text-on-surface font-bold rounded-2xl hover:bg-surface-dim active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                    aria-label="Upload another image"
                  >
                    <span className="material-symbols-outlined text-base">photo_library</span>
                    {language === "bn" ? "অন্য ছবি বেছে নিন" : language === "hi" ? "दूसरी फोटो चुनें" : "Upload Another"}
                  </button>
                </div>
              </div>
            )}

            {/* UNCERTAIN / low-confidence card */}
            {edgeState.status === "UNCERTAIN" && (
              <div
                id="edge-uncertain-card"
                className="bg-blue-500/10 border border-blue-500/30 rounded-[2rem] p-6 sm:p-8 flex flex-col items-center text-center gap-5"
              >
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-600 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
                </div>
                {previewUrl && (
                  <div className="w-28 h-28 rounded-[1.25rem] overflow-hidden border-2 border-blue-500/30 shadow-md opacity-60">
                    <Image src={previewUrl} alt="Unclear image" fill className="object-cover" />
                  </div>
                )}
                <div className="space-y-2">
                  <h2 className="text-xl font-extrabold text-on-surface">
                    {language === "bn" ? "📷 অস্পষ্ট ছবি" : language === "hi" ? "📷 अस्पष्ट फोटो" : "📷 Unclear Image"}
                  </h2>
                  <p className="text-sm text-on-surface-variant font-medium leading-relaxed max-w-xs">
                    {language === "bn"
                      ? "ছবিটি পর্যাপ্ত স্পষ্ট নয়। অনুগ্রহ করে ভালো আলোতে পাতার আরও কাছাকাছি এবং পরিষ্কার ছবি তুলুন।"
                      : language === "hi"
                      ? "फोटो पर्याप्त स्पष्ट नहीं है। कृपया अच्छी रोशनी में पत्ती की साफ फोटो लें।"
                      : "The image is too unclear to determine if it contains a crop. Please take a clearer, well-lit photo of the plant leaf."}
                  </p>
                </div>
                <button
                  id="edge-uncertain-retake-btn"
                  type="button"
                  onClick={() => triggerNativeCapture(CameraSource.Camera)}
                  className="w-full max-w-xs py-3.5 bg-primary text-on-primary font-bold rounded-2xl shadow-md shadow-primary/25 hover:bg-primary/90 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                  aria-label="Retake clearer photo"
                >
                  <span className="material-symbols-outlined text-base">photo_camera</span>
                  {t("reTake")}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══ STEP: ERROR ══ */}
        {step === "error" && error && (
          <div className="space-y-4">
            <div className="bg-error-container/30 border border-error/20 rounded-[2rem] p-6 sm:p-8 flex flex-col items-center text-center gap-5">
              <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center">
                <span className="material-symbols-outlined text-error text-3xl">
                  {error.category === "NETWORK_ERROR"
                    ? "wifi_off"
                    : error.category === "AI_TIMEOUT"
                    ? "schedule"
                    : error.category === "CAMERA_ERROR"
                    ? "videocam_off"
                    : "image_not_supported"}
                </span>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-extrabold text-on-surface">{error.title}</h2>
                <p className="text-sm text-on-surface-variant font-medium leading-relaxed max-w-xs">
                  {error.message}
                </p>
              </div>

              {error.reasons && error.reasons.length > 0 && (
                <div className="w-full bg-surface-container-lowest rounded-2xl p-4 text-left space-y-2">
                  {error.reasons.map((reason) => (
                    <div key={reason} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/40 shrink-0" />
                      <span className="text-sm text-on-surface-variant font-medium">{reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Retry without requiring retake */}
            {selectedFile ? (
              <button
                id="retry-analysis-btn"
                onClick={handleAnalyze}
                className="w-full py-4 bg-primary text-on-primary font-extrabold rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-95 transition-all"
                aria-label="Try analyzing again"
              >
                <span className="material-symbols-outlined text-xl">refresh</span>
                {t("retryAnalysis")}
              </button>
            ) : null}

            <button
              onClick={handleReset}
              className="w-full py-4 bg-surface-container-highest text-on-surface font-bold rounded-2xl hover:bg-surface-dim active:scale-95 transition-all flex items-center justify-center gap-2"
              aria-label="Choose a different image"
            >
              <span className="material-symbols-outlined text-lg">photo_camera</span>
              {t("reTake")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-primary animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
              energy_savings_leaf
            </span>
          </div>
          <p className="text-sm font-bold text-on-surface-variant">Loading scanner...</p>
        </div>
      }
    >
      <ScanContent />
    </Suspense>
  );
}
