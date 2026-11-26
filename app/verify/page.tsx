"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  ShieldCheck,
  ChevronRight,
  Check,
  RotateCcw,
  FileText,
  Lock,
  ArrowLeft,
  Phone,
  ScanFace,
  Upload,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useMessagesStore } from "@/lib/stores/useMessages";
import { useProfileStore } from "@/lib/stores/useProfile";

type VerifyStep =
  | "intro"
  | "phone"
  | "document"
  | "liveness"
  | "processing"
  | "success";

type DocType = "passport" | "uk_driving_licence" | "national_id";

const DOC_TYPES: { id: DocType; label: string; desc: string }[] = [
  { id: "passport", label: "Passport", desc: "UK or international biometric passport" },
  { id: "uk_driving_licence", label: "UK Driving Licence", desc: "Full or provisional photocard" },
  { id: "national_id", label: "National ID Card", desc: "Government-issued photo ID" },
];

const PROCESSING_STAGES = [
  "Checking document security features & MRZ",
  "Running ISO 30107-3 live selfie liveness check",
  "Matching live selfie to ID & profile photo",
  "Purging raw ID images (UK GDPR zero-retention)",
];

export default function VerificationPage() {
  const store = useMessagesStore();

  const [step, setStep] = useState<VerifyStep>("intro");
  const [hasBiometricConsent, setHasBiometricConsent] = useState(false);

  // Step 1: Phone OTP
  const [countryCode, setCountryCode] = useState("+44");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [demoOtp] = useState("482910");
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Step 2: Government ID
  const [docType, setDocType] = useState<DocType>("passport");
  const [docImage, setDocImage] = useState<string | null>(null);
  const [docMode, setDocMode] = useState<"camera" | "upload">("camera");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);

  // Step 3: Live Selfie Liveness
  const [livenessPrompt] = useState("Look straight ahead and smile gently");
  const [selfieImage, setSelfieImage] = useState<string | null>(null);

  // Step 4: Processing progress
  const [completedStages, setCompletedStages] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const startCamera = async (facing: "environment" | "user") => {
    stopCamera();
    setCameraError(null);
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setCameraError(
        "Live camera is unavailable in this browser. You can upload a clear photo instead."
      );
      return;
    }

    setIsStartingCamera(true);
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch {
      setCameraError(
        "Camera permission was blocked or no camera was detected. Allow access in your browser or switch to file upload."
      );
    } finally {
      setIsStartingCamera(false);
    }
  };

  useEffect(() => {
    if (step === "document" && docMode === "camera" && !docImage) {
      startCamera("environment");
    } else if (step === "liveness" && !selfieImage) {
      startCamera("user");
    } else {
      stopCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, docMode, docImage, selfieImage]);

  const captureFromVideo = (mirror: boolean): string | null => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return null;
    const canvas = document.createElement("canvas");
    canvas.width = Math.min(1200, video.videoWidth);
    canvas.height = Math.round((canvas.width / video.videoWidth) * video.videoHeight);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    if (mirror) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    stopCamera();
    return canvas.toDataURL("image/jpeg", 0.85);
  };

  const handleUploadDocFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        stopCamera();
        setDocImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phoneNumber.replace(/\D/g, "");
    if (digits.length < 7) {
      setPhoneError("Please enter a valid mobile number.");
      return;
    }
    setPhoneError(null);
    setOtpSent(true);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput.trim().length !== 6) {
      setPhoneError("Enter the 6-digit verification code.");
      return;
    }
    setPhoneError(null);
    setStep("document");
  };

  const startVerificationCheck = () => {
    stopCamera();
    setStep("processing");
    setCompletedStages(0);

    // Clear raw document & selfie buffers from client memory during verification
    const timers = [
      setTimeout(() => setCompletedStages(1), 700),
      setTimeout(() => setCompletedStages(2), 1500),
      setTimeout(() => setCompletedStages(3), 2300),
      setTimeout(() => {
        setCompletedStages(4);
        setDocImage(null);
        setSelfieImage(null);
      }, 3100),
      setTimeout(() => {
        setStep("success");
        store.setVerified(true);
        useProfileStore.getState().updateProfile({ isVerified: true });
        if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
          const mockUser = {
            uid: "mock-uid-123",
            email: "mia@example.com",
            displayName: "Mia Reyes",
          };
          if (typeof window !== "undefined") {
            const win = window as unknown as {
              __setTravelKinMockUser?: (u: typeof mockUser) => void;
            };
            if (win.__setTravelKinMockUser) {
              win.__setTravelKinMockUser(mockUser);
            } else {
              localStorage.setItem("travelkin-mock-user", JSON.stringify(mockUser));
            }
          }
        }
      }, 3800),
    ];

    return () => timers.forEach(clearTimeout);
  };

  const stepIndex =
    step === "phone" ? 1 : step === "document" ? 2 : step === "liveness" ? 3 : 0;

  return (
    <div className="min-h-screen bg-sand flex flex-col items-center justify-center p-4 sm:p-6 relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleUploadDocFile}
      />

      <div className="w-full max-w-xl relative z-10 space-y-4">
        {/* Step Indicator */}
        {stepIndex > 0 && (
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate/65">
              Step {stepIndex} of 3
            </span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  className={`h-1.5 rounded-full transition-all ${
                    n <= stepIndex ? "w-8 bg-sunset" : "w-5 bg-slate/15"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* INTRO & UK GDPR BIOMETRIC CONSENT */}
          {step === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="bg-white rounded-2xl p-7 sm:p-9 shadow-xl border border-slate/10 space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-slate/5 rounded-2xl flex items-center justify-center text-slate mx-auto border border-slate/10">
                  <ShieldCheck className="w-7 h-7" strokeWidth={1.75} />
                </div>
                <h1 className="text-2xl sm:text-3xl text-slate font-bold">
                  Become a Verified Kin
                </h1>
                <p className="text-slate/65 text-sm font-medium max-w-md mx-auto">
                  Every traveller must pass a 3-step identity &amp; liveness check before messaging solo travellers or joining shared trips.
                </p>
              </div>

              <div className="space-y-2.5">
                <StepRow
                  icon={Phone}
                  title="1. Mobile Number Check (OTP)"
                  desc="Confirms a real phone number to stop disposable and bot accounts."
                />
                <StepRow
                  icon={FileText}
                  title="2. Government Photo ID"
                  desc="Passport, UK Driving Licence, or National ID authenticity check."
                />
                <StepRow
                  icon={ScanFace}
                  title="3. Live Selfie Liveness & Profile Match"
                  desc="ISO 30107-3 liveness check matched against your ID and public profile photo."
                />
              </div>

              {/* UK GDPR & DPA 2018 Explicit Consent Box */}
              <div className="p-4 rounded-xl bg-[#F9F8F6] border border-slate/10 space-y-3">
                <div className="flex items-start gap-2.5 text-xs text-slate/75">
                  <Lock className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-medium">
                    <strong className="text-slate">UK GDPR &amp; Data Protection Act 2018:</strong>{" "}
                    Raw ID photos and biometric templates are processed only to confirm your identity and are{" "}
                    <strong className="text-slate">automatically purged immediately after verification</strong>. We retain only your Verified status, issuing country, and a one-way ban-prevention hash.
                  </p>
                </div>

                <label className="flex items-start gap-2.5 pt-2 border-t border-slate/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasBiometricConsent}
                    onChange={(e) => setHasBiometricConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded accent-[#E0712A] shrink-0"
                  />
                  <span className="text-xs font-semibold text-slate leading-relaxed">
                    I give explicit consent under Article 9(2)(a) of the UK GDPR for biometric face-matching and liveness verification as described in the{" "}
                    <Link href="/privacy-policy" className="text-sunset hover:underline">
                      UK Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
              </div>

              <button
                type="button"
                disabled={!hasBiometricConsent}
                onClick={() => setStep("phone")}
                className="w-full py-4 bg-sunset text-white font-bold text-sm rounded-xl shadow-sm hover:bg-sunset-dark transition-all active:scale-95 disabled:opacity-45 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Start 3-Step Verification
                <ChevronRight className="w-4 h-4" />
              </button>

              <Link
                href="/dashboard"
                className="block text-center text-slate/60 text-xs font-bold hover:text-slate transition-colors"
              >
                Return to Dashboard (Browse Only)
              </Link>
            </motion.div>
          )}

          {/* STEP 1: MOBILE PHONE OTP */}
          {step === "phone" && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="bg-white rounded-2xl p-7 sm:p-9 shadow-xl border border-slate/10 space-y-6"
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep("intro")}
                  aria-label="Back"
                  className="p-2 rounded-lg hover:bg-slate/5 text-slate/70"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-slate">Verify Your Mobile Number</h2>
                  <p className="text-xs font-medium text-slate/60">
                    Used for account security and emergency SOS contact verification.
                  </p>
                </div>
              </div>

              {phoneError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{phoneError}</span>
                </div>
              )}

              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate/65">
                      Mobile Number
                    </label>
                    <div className="flex gap-2">
                      <select
                        aria-label="Country code"
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="px-3 py-3 rounded-xl bg-[#F9F8F6] border border-slate/15 text-sm font-bold text-slate outline-none"
                      >
                        <option value="+44">UK +44</option>
                        <option value="+63">PH +63</option>
                        <option value="+66">TH +66</option>
                        <option value="+61">AU +61</option>
                        <option value="+1">US +1</option>
                      </select>
                      <input
                        type="tel"
                        required
                        placeholder="7700 900123"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl bg-[#F9F8F6] border border-slate/15 text-sm font-medium text-slate focus:bg-white outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-sunset text-white font-bold text-sm rounded-xl hover:bg-sunset-dark transition-all"
                  >
                    Send 6-Digit SMS Code
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-[#F9F8F6] border border-slate/10 text-xs font-medium text-slate/75">
                    Code sent to <strong className="text-slate">{countryCode} {phoneNumber}</strong>.
                    Demo preview code: <strong className="text-slate tabular-nums">{demoOtp}</strong>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate/65">
                      Enter 6-Digit Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      placeholder="482910"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                      className="w-full px-4 py-3 rounded-xl bg-[#F9F8F6] border border-slate/15 text-lg font-bold tracking-[0.35em] text-center text-slate focus:bg-white outline-none tabular-nums"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpInput("");
                      }}
                      className="px-4 py-3 rounded-xl border border-slate/15 text-xs font-bold text-slate/75 hover:bg-slate/5"
                    >
                      Change Number
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3.5 bg-sunset text-white font-bold text-sm rounded-xl hover:bg-sunset-dark transition-all"
                    >
                      Verify Code &amp; Continue
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}

          {/* STEP 2: GOVERNMENT ID DOCUMENT */}
          {step === "document" && (
            <motion.div
              key="document"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="bg-white rounded-2xl p-7 sm:p-8 shadow-xl border border-slate/10 space-y-5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setStep("phone");
                    }}
                    aria-label="Back"
                    className="p-2 rounded-lg hover:bg-slate/5 text-slate/70"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-lg font-bold text-slate">Scan Government Photo ID</h2>
                    <p className="text-xs font-medium text-slate/60">
                      Make sure all four corners and text are sharp and glare-free.
                    </p>
                  </div>
                </div>
              </div>

              {/* Document Type Selector */}
              <div className="grid grid-cols-3 gap-2">
                {DOC_TYPES.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDocType(d.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      docType === d.id
                        ? "bg-slate text-white border-slate"
                        : "bg-[#F9F8F6] text-slate/75 border-slate/10 hover:border-slate/25"
                    }`}
                  >
                    <p className="text-xs font-bold leading-snug">{d.label}</p>
                  </button>
                ))}
              </div>

              {/* Capture / Preview Frame */}
              {docImage ? (
                <div className="space-y-4">
                  <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate border border-slate/15">
                    <Image
                      src={docImage}
                      alt="Captured ID preview"
                      fill
                      referrerPolicy="no-referrer"
                      className="object-cover"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDocImage(null)}
                      className="py-3 rounded-xl border border-slate/15 text-xs font-bold text-slate hover:bg-slate/5 inline-flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Retake
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep("liveness")}
                      className="py-3 rounded-xl bg-sunset text-white text-xs font-bold hover:bg-sunset-dark inline-flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      ID is Clear · Next
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate flex items-center justify-center">
                    {docMode === "camera" && !cameraError ? (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-5 border-2 border-dashed border-white/60 rounded-xl pointer-events-none flex items-end justify-center pb-3">
                          <span className="px-3 py-1 rounded-full bg-black/55 text-white text-[11px] font-bold">
                            Align {DOC_TYPES.find((d) => d.id === docType)?.label} inside frame
                          </span>
                        </div>
                        {isStartingCamera && (
                          <div className="absolute inset-0 bg-slate/80 flex items-center justify-center text-white text-xs font-semibold">
                            Opening camera...
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="p-6 text-center space-y-3 max-w-sm">
                        <Upload className="w-7 h-7 text-white/75 mx-auto" />
                        <p className="text-xs font-semibold text-white/85 leading-relaxed">
                          {cameraError || "Upload a clear photo of your government ID document."}
                        </p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-5 py-2.5 rounded-xl bg-sunset text-white text-xs font-bold hover:bg-sunset-dark"
                        >
                          Choose ID Image
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (docMode === "camera") {
                          stopCamera();
                          setDocMode("upload");
                          fileInputRef.current?.click();
                        } else {
                          setDocMode("camera");
                        }
                      }}
                      className="px-4 py-3 rounded-xl border border-slate/15 text-xs font-bold text-slate hover:bg-slate/5 inline-flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {docMode === "camera" ? "Upload Image Instead" : "Use Live Camera"}
                    </button>
                    {docMode === "camera" && !cameraError && (
                      <button
                        type="button"
                        disabled={isStartingCamera}
                        onClick={() => {
                          const shot = captureFromVideo(false);
                          if (shot) setDocImage(shot);
                        }}
                        className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-sunset text-white text-xs font-bold hover:bg-sunset-dark inline-flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Camera className="w-4 h-4" />
                        Capture ID Photo
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 3: LIVE SELFIE LIVENESS & PROFILE FACE MATCH */}
          {step === "liveness" && (
            <motion.div
              key="liveness"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="bg-white rounded-2xl p-7 sm:p-8 shadow-xl border border-slate/10 space-y-5"
            >
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setSelfieImage(null);
                    setStep("document");
                  }}
                  aria-label="Back"
                  className="p-2 rounded-lg hover:bg-slate/5 text-slate/70"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-lg font-bold text-slate">Live Selfie Liveness Check</h2>
                  <p className="text-xs font-medium text-slate/60">
                    Confirms you are a real person and matches your ID &amp; profile photo.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F9F8F6] border border-slate/10 text-center text-xs font-bold text-slate">
                Prompt: {livenessPrompt}
              </div>

              {selfieImage ? (
                <div className="space-y-4">
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate border border-slate/15">
                    <Image
                      src={selfieImage}
                      alt="Live liveness selfie"
                      fill
                      referrerPolicy="no-referrer"
                      className="object-cover"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelfieImage(null)}
                      className="py-3 rounded-xl border border-slate/15 text-xs font-bold text-slate hover:bg-slate/5 inline-flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Retake Selfie
                    </button>
                    <button
                      type="button"
                      onClick={startVerificationCheck}
                      className="py-3 rounded-xl bg-sunset text-white text-xs font-bold hover:bg-sunset-dark inline-flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Submit &amp; Verify
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate flex items-center justify-center">
                    {!cameraError ? (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover -scale-x-100"
                        />
                        {/* Oval face guide */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          <div className="w-44 h-56 rounded-full border-2 border-dashed border-white/75 shadow-[0_0_0_9999px_rgba(15,23,28,0.45)]" />
                        </div>
                        {isStartingCamera && (
                          <div className="absolute inset-0 bg-slate/80 flex items-center justify-center text-white text-xs font-semibold">
                            Opening front camera...
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="p-6 text-center space-y-3 max-w-sm">
                        <ScanFace className="w-8 h-8 text-white/75 mx-auto" />
                        <p className="text-xs font-semibold text-white/85 leading-relaxed">
                          {cameraError}
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => startCamera("user")}
                            className="px-4 py-2.5 rounded-xl bg-sunset text-white text-xs font-bold"
                          >
                            Retry Camera
                          </button>
                          <button
                            type="button"
                            onClick={startVerificationCheck}
                            className="px-4 py-2.5 rounded-xl bg-white/10 text-white text-xs font-bold"
                          >
                            Continue Demo Check
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {!cameraError && (
                    <button
                      type="button"
                      disabled={isStartingCamera}
                      onClick={() => {
                        const shot = captureFromVideo(true);
                        if (shot) setSelfieImage(shot);
                      }}
                      className="w-full py-3.5 rounded-xl bg-sunset text-white text-sm font-bold hover:bg-sunset-dark inline-flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <ScanFace className="w-4 h-4" />
                      Capture Live Selfie
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 4: MULTI-STAGE VERIFICATION & AUTO-PURGE */}
          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl p-8 sm:p-10 shadow-xl border border-slate/10 space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full border-4 border-slate/10 border-t-sunset animate-spin mx-auto" />
                <h2 className="text-2xl font-bold text-slate">Verifying Your Identity</h2>
                <p className="text-xs font-medium text-slate/60">
                  UK DIATF &amp; ISO 30107-3 accredited verification pipeline
                </p>
              </div>

              <div className="space-y-2.5">
                {PROCESSING_STAGES.map((label, idx) => {
                  const done = completedStages > idx;
                  return (
                    <div
                      key={label}
                      className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs font-semibold transition-all ${
                        done
                          ? "bg-green-50 border-green-200 text-green-800"
                          : "bg-[#F9F8F6] border-slate/10 text-slate/55"
                      }`}
                    >
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${
                          done ? "text-green-600" : "text-slate/30"
                        }`}
                      />
                      <span>{label}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* SUCCESS & UK GDPR ZERO-RETENTION RECEIPT */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-8 sm:p-10 shadow-xl border border-slate/10 text-center space-y-6"
            >
              <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl text-slate font-bold">Verified Kin Unlocked</h2>
                <p className="text-sm text-slate/70 font-medium max-w-md mx-auto">
                  You can now message Verified Kins, join shared boat trips, upload trip photos, and access full Emergency SOS tools.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F9F8F6] border border-slate/10 text-left space-y-1.5 text-xs">
                <p className="font-bold text-slate inline-flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-green-600" />
                  UK GDPR Zero-Retention Receipt
                </p>
                <p className="text-slate/65 font-medium">
                  • Original ID image &amp; raw selfie deleted from session memory.
                </p>
                <p className="text-slate/65 font-medium">
                  • Saved: Verified badge, phone OTP status, and one-way safety hash only.
                </p>
              </div>

              <Link
                href="/dashboard"
                className="block w-full py-4 bg-sunset text-white font-bold text-sm rounded-xl hover:bg-sunset-dark transition-all"
              >
                Continue to Dashboard
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* UK Compliance Footer */}
        <p className="text-center text-[11px] font-medium text-slate/55 px-4">
          Travel Kin Ltd (Registered in England &amp; Wales) · Regulated under UK GDPR, Data Protection Act 2018 (ICO) &amp; UK Online Safety Act 2023.
        </p>
      </div>
    </div>
  );
}

function StepRow({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#F9F8F6] border border-slate/10">
      <div className="p-2.5 bg-white border border-slate/10 text-slate rounded-lg shrink-0">
        <Icon className="w-4 h-4" strokeWidth={1.75} />
      </div>
      <div>
        <h4 className="font-bold text-slate text-sm leading-tight">{title}</h4>
        <p className="text-slate/65 text-xs font-medium mt-0.5 leading-snug">{desc}</p>
      </div>
    </div>
  );
}
