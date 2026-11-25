"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Plus,
  UserPlus,
  Heart,
  MapPin,
  Share2,
  X,
  Clock,
  Sparkles,
  Image as ImageIcon,
  Lock,
  Upload,
  ShieldCheck,
  Check,
  Trash2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMessagesStore } from "@/lib/stores/useMessages";
import { UserTier, getTierPermissions } from "@/lib/access";

interface Memory {
  id: string;
  url: string;
  location: string;
  caption: string;
  taggedKins: string[];
  vibe: string;
  likes: number;
  date: string;
  isUserUpload?: boolean;
  exifStripped?: boolean;
}

interface PendingPhoto {
  id: string;
  dataUrl: string;
  fileName: string;
  caption: string;
  included: boolean;
  sizeKb: number;
}

const STORAGE_KEY = "travelkin-uploaded-memories-v1";
const MAX_BATCH_PHOTOS = 6;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_IMAGE_DIMENSION = 1200;

const QUICK_LOCATIONS = [
  "Cloud 9 Boardwalk, Siargao",
  "Big Lagoon, El Nido",
  "Kawasan Falls, Cebu",
  "Kayangan Lake, Coron",
];

const VIBE_OPTIONS = ["Surf", "Boat Trip", "Food", "Sunset", "Waterfalls", "Crew"];
const CREW_OPTIONS = ["Suki", "Liam", "Nara", "Kevin", "Mia"];

const SAMPLE_MEMORIES: Memory[] = [
  {
    id: "1",
    url: "https://images.pexels.com/photos/3533659/pexels-photo-3533659.jpeg?auto=compress&cs=tinysrgb&w=800",
    location: "Cloud 9 Boardwalk, Siargao",
    caption: "Early morning waves and fresh coconut coffee with the group.",
    taggedKins: ["Suki", "Liam"],
    vibe: "Surf",
    likes: 34,
    date: "14 October 2026",
  },
  {
    id: "2",
    url: "https://images.pexels.com/photos/13874296/pexels-photo-13874296.jpeg?auto=compress&cs=tinysrgb&w=800",
    location: "Big Lagoon, El Nido",
    caption: "Took the 6:00 AM boat together and had the whole lagoon to ourselves.",
    taggedKins: ["Nara", "Liam"],
    vibe: "Boat Trip",
    likes: 52,
    date: "18 October 2026",
  },
  {
    id: "3",
    url: "https://images.pexels.com/photos/17263722/pexels-photo-17263722.jpeg?auto=compress&cs=tinysrgb&w=800",
    location: "Kawasan Falls, Cebu",
    caption: "Waterfall swim followed by grilled seafood on Panagsama Beach.",
    taggedKins: ["Nara", "Kevin"],
    vibe: "Waterfalls",
    likes: 29,
    date: "22 October 2026",
  },
  {
    id: "4",
    url: "https://images.pexels.com/photos/13518466/pexels-photo-13518466.jpeg?auto=compress&cs=tinysrgb&w=800",
    location: "Kayangan Lake, Coron",
    caption: "Swimming in crystal-clear water surrounded by limestone cliffs.",
    taggedKins: ["Suki", "Kevin"],
    vibe: "Swimming",
    likes: 64,
    date: "27 October 2026",
  },
];

/**
 * Re-encodes an image file via an offscreen canvas.
 * This automatically strips all EXIF metadata (including GPS coordinates)
 * and resizes oversized phone photos so uploads stay fast and lightweight.
 */
function stripExifAndResize(file: File): Promise<{ dataUrl: string; sizeKb: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();

    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          const ratio = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("Could not prepare image for upload."));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        const sizeKb = Math.max(1, Math.round((dataUrl.length * 3) / 4 / 1024));
        URL.revokeObjectURL(objectUrl);
        resolve({ dataUrl, sizeKb });
      } catch {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Could not process this image file."));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(
        new Error(
          `"${file.name}" could not be read. Please use a JPG, PNG, or WebP photo.`
        )
      );
    };

    img.src = objectUrl;
  });
}

export function MemoriesView({ tier = "verified" }: { tier?: UserTier }) {
  const store = useMessagesStore();
  const perms = getTierPermissions(tier);

  const [uploadedMemories, setUploadedMemories] = useState<Memory[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isReelOpen, setIsReelOpen] = useState(false);
  const [reelIndex, setReelIndex] = useState(0);
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState<{ text: string; isAction?: boolean } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Upload workflow state
  const [uploadStep, setUploadStep] = useState<"select" | "details">("select");
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [activePendingIndex, setActivePendingIndex] = useState(0);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [tripLocation, setTripLocation] = useState(QUICK_LOCATIONS[0]);
  const [selectedVibe, setSelectedVibe] = useState(VIBE_OPTIONS[0]);
  const [taggedKins, setTaggedKins] = useState<string[]>(["Suki"]);
  const [hasConsent, setHasConsent] = useState(false);

  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Load previously uploaded photos from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setUploadedMemories(parsed);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const persistUploads = (next: Memory[]) => {
    setUploadedMemories(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // If storage is full, keep in memory for the current session
    }
  };

  const allMemories = useMemo(() => {
    const chatMemories: Memory[] = store.archivedMemories.map((m) => ({
      id: m.id,
      url: "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?q=80&w=800&auto=format&fit=crop",
      location: m.location,
      caption: `Saved chat with ${m.kinName}: ${m.preview}`,
      taggedKins: [m.kinName],
      vibe: m.vibe,
      likes: 8,
      date: new Date(m.date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    }));
    return [...uploadedMemories, ...chatMemories, ...SAMPLE_MEMORIES];
  }, [uploadedMemories, store.archivedMemories]);

  useEffect(() => {
    if (!isReelOpen) return;
    const timer = setInterval(() => {
      setReelIndex((prev) => (prev + 1) % allMemories.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [isReelOpen, allMemories.length]);

  const selectedMemory = allMemories.find((m) => m.id === selectedId);
  const activeReelMemory = allMemories[reelIndex] || allMemories[0];

  const showToast = (text: string, isAction = false) => {
    setNotice({ text, isAction });
    setTimeout(() => setNotice(null), 3500);
  };

  const resetUploadModal = () => {
    setIsUploadModalOpen(false);
    setUploadStep("select");
    setPendingPhotos([]);
    setActivePendingIndex(0);
    setUploadError(null);
    setIsDraggingOver(false);
    setIsProcessingFiles(false);
    setHasConsent(false);
  };

  const handleOpenUpload = () => {
    if (!perms.canUploadMemories) {
      showToast(
        tier === "guest"
          ? "Sign up and verify your ID to upload and share trip photos."
          : "Verify your ID to upload photos to shared trip albums.",
        true
      );
      return;
    }
    setUploadError(null);
    setIsUploadModalOpen(true);
  };

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setUploadError(null);
    const incoming = Array.from(fileList);
    const remainingSlots = MAX_BATCH_PHOTOS - pendingPhotos.length;

    if (remainingSlots <= 0) {
      setUploadError(`You can upload up to ${MAX_BATCH_PHOTOS} photos at a time.`);
      return;
    }

    const toProcess = incoming.slice(0, remainingSlots);
    const skippedCount = incoming.length - toProcess.length;
    const errors: string[] = [];
    const processed: PendingPhoto[] = [];

    setIsProcessingFiles(true);

    for (const file of toProcess) {
      if (!file.type.startsWith("image/")) {
        errors.push(`"${file.name}" is not an image file.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`"${file.name}" is over the 10 MB limit.`);
        continue;
      }
      try {
        const { dataUrl, sizeKb } = await stripExifAndResize(file);
        processed.push({
          id: `up-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          dataUrl,
          fileName: file.name,
          caption: "",
          included: true,
          sizeKb,
        });
      } catch (err) {
        errors.push(err instanceof Error ? err.message : `Could not process "${file.name}".`);
      }
    }

    setIsProcessingFiles(false);

    if (skippedCount > 0) {
      errors.push(`Only the first ${MAX_BATCH_PHOTOS} photos were added to this batch.`);
    }
    if (errors.length > 0) {
      setUploadError(errors[0]);
    }

    if (processed.length > 0) {
      setPendingPhotos((prev) => {
        const merged = [...prev, ...processed];
        if (prev.length === 0) {
          setActivePendingIndex(0);
        }
        return merged;
      });
      setUploadStep("details");
    }

    // Clear native input values so re-selecting the same file works cleanly
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    handleFilesSelected(e.dataTransfer.files);
  };

  const togglePendingIncluded = (id: string) => {
    setPendingPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, included: !p.included } : p))
    );
  };

  const removePendingPhoto = (id: string) => {
    setPendingPhotos((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (next.length === 0) {
        setUploadStep("select");
        setActivePendingIndex(0);
      } else if (activePendingIndex >= next.length) {
        setActivePendingIndex(next.length - 1);
      }
      return next;
    });
  };

  const updateActiveCaption = (caption: string) => {
    setPendingPhotos((prev) =>
      prev.map((p, idx) => (idx === activePendingIndex ? { ...p, caption } : p))
    );
  };

  const toggleTagKin = (kin: string) => {
    setTaggedKins((prev) =>
      prev.includes(kin) ? prev.filter((k) => k !== kin) : [...prev, kin]
    );
  };

  const includedPendingPhotos = pendingPhotos.filter((p) => p.included);
  const activePending = pendingPhotos[activePendingIndex] || pendingPhotos[0];

  const handlePublishPhotos = (e: React.FormEvent) => {
    e.preventDefault();
    if (includedPendingPhotos.length === 0) {
      setUploadError("Select at least one photo to share.");
      return;
    }
    if (!hasConsent) {
      setUploadError("Please confirm everyone in the photos is okay with sharing.");
      return;
    }

    const todayLabel = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const cleanLocation = tripLocation.trim() || "Siargao Island";

    const newMemories: Memory[] = includedPendingPhotos.map((photo) => ({
      id: photo.id,
      url: photo.dataUrl,
      location: cleanLocation,
      caption:
        photo.caption.trim() ||
        `Shared trip moment from ${cleanLocation}.`,
      taggedKins: taggedKins.length > 0 ? taggedKins : ["Mia"],
      vibe: selectedVibe,
      likes: 0,
      date: todayLabel,
      isUserUpload: true,
      exifStripped: true,
    }));

    persistUploads([...newMemories, ...uploadedMemories]);
    resetUploadModal();
    showToast(
      newMemories.length === 1
        ? "1 photo shared to the trip album (GPS data stripped)."
        : `${newMemories.length} photos shared to the trip album (GPS data stripped).`
    );
  };

  const handleDeleteUpload = (id: string) => {
    const next = uploadedMemories.filter((m) => m.id !== id);
    persistUploads(next);
    setSelectedId(null);
    showToast("Photo removed from the trip album.");
  };

  const handleSharePhoto = (id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-24 relative">
      {/* Hidden native inputs for Camera Roll / Files & Direct Camera Snap */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        multiple
        className="hidden"
        onChange={(e) => handleFilesSelected(e.target.files)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFilesSelected(e.target.files)}
      />

      {/* Toast Notice */}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[140] px-5 py-3 bg-slate text-white rounded-xl shadow-xl text-xs sm:text-sm font-semibold flex items-center gap-3 border border-white/10"
          >
            {notice.isAction ? (
              <Lock className="w-4 h-4 text-sunset shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-green-400 shrink-0" />
            )}
            <span>{notice.text}</span>
            {notice.isAction && (
              <Link
                href={tier === "guest" ? "/onboarding" : "/verify"}
                className="px-3 py-1 rounded-lg bg-sunset text-white text-xs font-bold hover:bg-sunset-dark transition-colors shrink-0"
              >
                {tier === "guest" ? "Join Free" : "Verify ID"}
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-slate/70 font-bold tracking-wider text-xs uppercase bg-white rounded-full px-3.5 py-1 border border-slate/10">
            <Camera className="w-3.5 h-3.5" strokeWidth={1.75} />
            Shared Album
          </div>
          <h2 className="text-3xl text-slate font-bold">Trip Photos</h2>
          <p className="text-slate/65 text-sm font-medium">
            Upload selected photos from your phone or camera. GPS metadata is stripped automatically.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setReelIndex(0);
              setIsReelOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-3 bg-white text-slate border border-slate/15 rounded-xl font-bold text-xs hover:bg-slate/5 transition-all"
          >
            <Sparkles className="w-4 h-4 text-slate/70" />
            Play Slideshow
          </button>
          <button
            type="button"
            onClick={handleOpenUpload}
            className="flex items-center gap-2 px-5 py-3 bg-sunset text-white rounded-xl font-bold text-xs shadow-sm hover:bg-sunset-dark transition-all active:scale-95"
          >
            {perms.canUploadMemories ? (
              <Plus className="w-4 h-4" strokeWidth={2} />
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}
            Upload Photos
          </button>
        </div>
      </div>

      {/* Slideshow Modal */}
      <AnimatePresence>
        {isReelOpen && activeReelMemory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-slate/80 backdrop-blur-xl" onClick={() => setIsReelOpen(false)} />
            <motion.div
              initial={{ scale: 0.94, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 16 }}
              className="relative w-full max-w-md aspect-[9/16] max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20 bg-black"
            >
              <div className="absolute top-5 left-5 right-5 z-30 flex gap-1.5">
                {allMemories.map((m, idx) => (
                  <div key={m.id} className="flex-1 h-1 bg-white/25 rounded-full overflow-hidden">
                    <div className={`h-full bg-white transition-all duration-500 ${idx <= reelIndex ? "w-full" : "w-0"}`} />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsReelOpen(false)}
                aria-label="Close slideshow"
                className="absolute top-9 right-5 z-30 p-2.5 bg-black/45 text-white rounded-full hover:bg-black/65 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <Image
                src={activeReelMemory.url}
                alt={activeReelMemory.caption}
                fill
                referrerPolicy="no-referrer"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30" />

              <div className="absolute bottom-7 left-7 right-7 z-20 space-y-3 text-white">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-bold">
                  <MapPin className="w-3 h-3" /> {activeReelMemory.location}
                </span>
                <p className="text-lg leading-snug font-medium">&ldquo;{activeReelMemory.caption}&rdquo;</p>
                <div className="flex items-center justify-between pt-2 border-t border-white/15 text-xs text-white/75">
                  <span>{activeReelMemory.date}</span>
                  <span>With {activeReelMemory.taggedKins.join(", ")}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Device / Camera Roll Upload & Selection Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6"
          >
            <div
              className="absolute inset-0 bg-slate/45 backdrop-blur-sm"
              onClick={resetUploadModal}
            />
            <motion.div
              initial={{ scale: 0.96, y: 14 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 14 }}
              className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate/10 overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Top Bar */}
              <div className="px-6 py-4 border-b border-slate/10 bg-[#F9F8F6] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {uploadStep === "details" && (
                    <button
                      type="button"
                      onClick={() => setUploadStep("select")}
                      aria-label="Back to photo picker"
                      className="p-1.5 hover:bg-slate/10 rounded-lg transition-colors text-slate/70"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  )}
                  <div>
                    <h3 className="text-base font-bold text-slate">
                      {uploadStep === "select" ? "Upload Trip Photos" : "Review & Add Details"}
                    </h3>
                    <p className="text-xs font-medium text-slate/60">
                      {uploadStep === "select"
                        ? "Step 1 of 2 · Pick photos from your camera roll or device"
                        : `Step 2 of 2 · ${includedPendingPhotos.length} of ${pendingPhotos.length} selected to share`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetUploadModal}
                  aria-label="Close upload modal"
                  className="p-2 hover:bg-slate/10 rounded-full transition-colors text-slate/70"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5">
                {uploadError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {uploadStep === "select" ? (
                  <div className="space-y-5">
                    {/* Drag & Drop / File Picker Area */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingOver(true);
                      }}
                      onDragLeave={() => setIsDraggingOver(false)}
                      onDrop={handleDrop}
                      className={`p-8 rounded-2xl border-2 border-dashed text-center transition-all space-y-4 ${
                        isDraggingOver
                          ? "border-sunset bg-sunset/5"
                          : "border-slate/20 bg-[#F9F8F6] hover:border-slate/35"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate/10 flex items-center justify-center mx-auto shadow-sm">
                        <Upload className="w-5 h-5 text-slate/80" strokeWidth={1.75} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate">
                          {isProcessingFiles
                            ? "Preparing your photos & removing GPS data..."
                            : "Drop photos here, or pick from your device"}
                        </p>
                        <p className="text-xs font-medium text-slate/60">
                          JPG, PNG, or WebP · Up to 10 MB each · Max {MAX_BATCH_PHOTOS} photos per upload
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
                        <button
                          type="button"
                          disabled={isProcessingFiles}
                          onClick={() => galleryInputRef.current?.click()}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-sunset text-white text-xs font-bold hover:bg-sunset-dark transition-all disabled:opacity-60"
                        >
                          <ImageIcon className="w-4 h-4" />
                          Choose from Camera Roll / Files
                        </button>
                        <button
                          type="button"
                          disabled={isProcessingFiles}
                          onClick={() => cameraInputRef.current?.click()}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate/15 text-slate text-xs font-bold hover:bg-slate/5 transition-all disabled:opacity-60"
                        >
                          <Camera className="w-4 h-4 text-slate/70" />
                          Take a Photo
                        </button>
                      </div>
                    </div>

                    {/* Already picked count shortcut if returning to step 1 */}
                    {pendingPhotos.length > 0 && (
                      <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate/10">
                        <span className="text-xs font-semibold text-slate">
                          {pendingPhotos.length} photo{pendingPhotos.length === 1 ? "" : "s"} ready to review
                        </span>
                        <button
                          type="button"
                          onClick={() => setUploadStep("details")}
                          className="px-4 py-2 rounded-lg bg-slate text-white text-xs font-bold hover:bg-slate/90 transition-colors"
                        >
                          Continue to Details
                        </button>
                      </div>
                    )}

                    {/* Privacy & Safety Info Strip */}
                    <div className="p-4 rounded-xl bg-white border border-slate/10 flex items-start gap-3">
                      <ShieldCheck className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5 text-xs">
                        <p className="font-bold text-slate">Privacy-first uploads</p>
                        <p className="text-slate/65 font-medium leading-relaxed">
                          Only the exact photos you choose are shared — never your full library. Embedded EXIF GPS coordinates are stripped automatically before posting.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handlePublishPhotos} className="space-y-5">
                    {/* Active Photo Preview + Selection Controls */}
                    {activePending && (
                      <div className="space-y-3">
                        <div className="relative h-56 rounded-xl overflow-hidden bg-slate/5 border border-slate/10">
                          <Image
                            src={activePending.dataUrl}
                            alt={activePending.fileName}
                            fill
                            referrerPolicy="no-referrer"
                            className={`object-cover transition-opacity ${
                              activePending.included ? "opacity-100" : "opacity-40 grayscale"
                            }`}
                          />
                          <div className="absolute top-3 left-3 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-sm text-white text-xs font-semibold">
                              <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                              GPS Removed · {activePending.sizeKb} KB
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => togglePendingIncluded(activePending.id)}
                            className={`absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm transition-colors ${
                              activePending.included
                                ? "bg-green-600 text-white"
                                : "bg-white text-slate border border-slate/15"
                            }`}
                          >
                            {activePending.included ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Selected
                              </>
                            ) : (
                              "Excluded · Tap to Include"
                            )}
                          </button>
                        </div>

                        {/* Filmstrip Selector */}
                        <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                          {pendingPhotos.map((photo, idx) => (
                            <div key={photo.id} className="relative shrink-0">
                              <button
                                type="button"
                                onClick={() => setActivePendingIndex(idx)}
                                className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all block ${
                                  idx === activePendingIndex
                                    ? "border-sunset ring-2 ring-sunset/20"
                                    : "border-slate/15 opacity-80 hover:opacity-100"
                                }`}
                              >
                                <Image
                                  src={photo.dataUrl}
                                  alt={photo.fileName}
                                  fill
                                  referrerPolicy="no-referrer"
                                  className={`object-cover ${
                                    photo.included ? "" : "opacity-40 grayscale"
                                  }`}
                                />
                                {photo.included && (
                                  <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-600 text-white flex items-center justify-center">
                                    <Check className="w-2.5 h-2.5" strokeWidth={3} />
                                  </span>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => removePendingPhoto(photo.id)}
                                aria-label={`Remove ${photo.fileName}`}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}

                          {pendingPhotos.length < MAX_BATCH_PHOTOS && (
                            <button
                              type="button"
                              onClick={() => galleryInputRef.current?.click()}
                              className="w-16 h-16 rounded-xl border-2 border-dashed border-slate/20 hover:border-slate/40 bg-[#F9F8F6] flex flex-col items-center justify-center text-slate/65 hover:text-slate transition-colors shrink-0"
                            >
                              <Plus className="w-4 h-4" />
                              <span className="text-[10px] font-bold mt-0.5">Add</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Per-Photo Caption */}
                    {activePending && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate/65">
                          Caption {pendingPhotos.length > 1 ? `(Photo ${activePendingIndex + 1} of ${pendingPhotos.length})` : ""}
                        </label>
                        <input
                          type="text"
                          value={activePending.caption}
                          onChange={(e) => updateActiveCaption(e.target.value)}
                          placeholder="Add a short story or moment from this photo..."
                          className="w-full px-4 py-2.5 bg-[#F9F8F6] border border-slate/15 rounded-xl text-sm font-medium text-slate focus:bg-white outline-none"
                        />
                      </div>
                    )}

                    {/* General Location (Safe Public Label) */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate/65">
                        General Location
                      </label>
                      <input
                        type="text"
                        required
                        value={tripLocation}
                        onChange={(e) => setTripLocation(e.target.value)}
                        placeholder="e.g. Cloud 9 Boardwalk, Siargao"
                        className="w-full px-4 py-2.5 bg-[#F9F8F6] border border-slate/15 rounded-xl text-sm font-medium text-slate focus:bg-white outline-none"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_LOCATIONS.map((loc) => (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => setTripLocation(loc)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                              tripLocation === loc
                                ? "bg-slate text-white border-slate"
                                : "bg-white text-slate/70 border-slate/15 hover:bg-slate/5"
                            }`}
                          >
                            {loc.split(",")[0]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Activity Tag & Tag Kins */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate/65">
                          Trip Vibe
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {VIBE_OPTIONS.map((vibe) => (
                            <button
                              key={vibe}
                              type="button"
                              onClick={() => setSelectedVibe(vibe)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                                selectedVibe === vibe
                                  ? "bg-slate text-white border-slate"
                                  : "bg-[#F9F8F6] text-slate/70 border-slate/10 hover:border-slate/25"
                              }`}
                            >
                              {vibe}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate/65">
                          Tag Travel Kins
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {CREW_OPTIONS.map((kin) => {
                            const active = taggedKins.includes(kin);
                            return (
                              <button
                                key={kin}
                                type="button"
                                onClick={() => toggleTagKin(kin)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                                  active
                                    ? "bg-slate text-white border-slate"
                                    : "bg-white text-slate/70 border-slate/15 hover:bg-slate/5"
                                }`}
                              >
                                {active && <Check className="w-3 h-3" />}
                                {kin}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Consent Confirmation */}
                    <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F9F8F6] border border-slate/10 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasConsent}
                        onChange={(e) => {
                          setHasConsent(e.target.checked);
                          if (e.target.checked) setUploadError(null);
                        }}
                        className="mt-0.5 w-4 h-4 rounded accent-[#E0712A] shrink-0"
                      />
                      <span className="text-xs font-medium text-slate/80 leading-relaxed">
                        Everyone visible in {includedPendingPhotos.length === 1 ? "this photo" : "these photos"} is okay with sharing {includedPendingPhotos.length === 1 ? "it" : "them"} in the group trip album.
                      </span>
                    </label>

                    {/* Submit Footer */}
                    <div className="pt-2 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={resetUploadModal}
                        className="px-4 py-3 rounded-xl border border-slate/15 text-xs font-bold text-slate/75 hover:bg-slate/5 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={includedPendingPhotos.length === 0 || !hasConsent}
                        className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-sunset text-white text-xs font-bold hover:bg-sunset-dark transition-all disabled:opacity-45 disabled:cursor-not-allowed"
                      >
                        Share {includedPendingPhotos.length}{" "}
                        {includedPendingPhotos.length === 1 ? "Photo" : "Photos"} to Album
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Grid */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
        {allMemories.map((memory) => {
          const isLiked = Boolean(likedIds[memory.id]);
          const displayLikes = memory.likes + (isLiked ? 1 : 0);

          return (
            <div
              key={memory.id}
              onClick={() => setSelectedId(memory.id)}
              className="break-inside-avoid cursor-pointer group"
            >
              <div className="relative rounded-2xl overflow-hidden bg-white border border-slate/10 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="relative aspect-[3/4]">
                  <Image
                    src={memory.url}
                    alt={memory.caption}
                    fill
                    referrerPolicy="no-referrer"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-6 left-6 right-6 space-y-2.5">
                      <p className="text-white text-sm leading-snug font-medium">&ldquo;{memory.caption}&rdquo;</p>
                      <div className="flex flex-wrap gap-1.5">
                        {memory.taggedKins.map((kin) => (
                          <span key={kin} className="px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold text-white">
                            {kin}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/45 backdrop-blur-md rounded-full flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-white" />
                    <span className="text-xs font-semibold text-white">{memory.location}</span>
                  </div>

                  <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/45 backdrop-blur-md rounded-full flex items-center gap-1.5">
                    <Heart className={`w-3 h-3 text-white ${isLiked ? "fill-white" : ""}`} />
                    <span className="text-xs font-bold text-white tabular-nums">{displayLikes}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Photo Modal */}
      <AnimatePresence>
        {selectedId && selectedMemory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-slate/65 backdrop-blur-md" onClick={() => setSelectedId(null)} />
            <div className="relative w-full max-w-5xl h-[78vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
              <div className="flex-1 relative bg-black flex items-center justify-center">
                <Image
                  src={selectedMemory.url}
                  alt={selectedMemory.caption}
                  fill
                  referrerPolicy="no-referrer"
                  className="object-contain"
                />
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  aria-label="Close photo"
                  className="absolute top-5 left-5 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all z-10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="w-full md:w-[360px] p-8 flex flex-col justify-between bg-[#F9F8F6] overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate/60">{selectedMemory.location}</p>
                    <h3 className="text-xl font-bold text-slate mt-1">Trip Photo</h3>
                  </div>
                  <p className="text-sm text-slate/80 leading-relaxed font-medium">&ldquo;{selectedMemory.caption}&rdquo;</p>
                  <div className="flex items-center gap-2 text-slate/60 text-xs font-semibold">
                    <Clock className="w-4 h-4" /> {selectedMemory.date}
                  </div>
                  {selectedMemory.exifStripped && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      EXIF GPS data removed
                    </div>
                  )}
                  <div className="space-y-2 pt-4 border-t border-slate/10">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate/60">People in Photo</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedMemory.taggedKins.map((kin) => (
                        <span key={kin} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate/10 rounded-full text-xs font-semibold text-slate">
                          <UserPlus className="w-3 h-3 text-slate/60" />
                          {kin}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 pt-6">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        setLikedIds((prev) => ({
                          ...prev,
                          [selectedMemory.id]: !prev[selectedMemory.id],
                        }))
                      }
                      aria-pressed={Boolean(likedIds[selectedMemory.id])}
                      className={`flex-1 py-3.5 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all ${
                        likedIds[selectedMemory.id]
                          ? "bg-sunset/10 text-sunset border border-sunset/25 hover:bg-sunset/15"
                          : "bg-sunset text-white hover:bg-sunset-dark"
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          likedIds[selectedMemory.id] ? "fill-current" : ""
                        }`}
                      />
                      {likedIds[selectedMemory.id] ? "Liked" : "Like Photo"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSharePhoto(selectedMemory.id)}
                      aria-label="Share photo"
                      title="Copy album link"
                      className="px-3.5 py-3.5 bg-white border border-slate/15 text-slate rounded-xl hover:bg-slate/5 transition-all inline-flex items-center gap-1.5 text-xs font-bold"
                    >
                      {copiedId === selectedMemory.id ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {selectedMemory.isUserUpload && (
                    <button
                      type="button"
                      onClick={() => handleDeleteUpload(selectedMemory.id)}
                      className="w-full py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors inline-flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove My Photo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
