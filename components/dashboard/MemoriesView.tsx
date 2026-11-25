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
  RefreshCw,
  Calendar,
  Globe,
  Users,
  Tag,
  Pencil,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMessagesStore } from "@/lib/stores/useMessages";
import {
  useMemoriesStore,
  TripMemory,
  HubId,
  PhotoVisibility,
  TAG_HUBS,
  TAG_EVENTS,
  TAG_KINS,
  TAG_VIBES,
  getHubLabel,
  getEventLabel,
  getKinName,
} from "@/lib/stores/useMemories";
import { UserTier, getTierPermissions } from "@/lib/access";

interface PendingPhoto {
  id: string;
  dataUrl: string;
  fileName: string;
  caption: string;
  location: string;
  hubId: HubId;
  eventId: string | null;
  taggedKinIds: string[];
  vibe: string;
  visibility: PhotoVisibility;
  included: boolean;
  sizeKb: number;
}

const MAX_BATCH_PHOTOS = 6;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_IMAGE_DIMENSION = 1200;

/**
 * Re-encodes an image file via an offscreen canvas.
 * Automatically strips all EXIF metadata (including GPS coordinates)
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
  const messagesStore = useMessagesStore();
  const {
    memories,
    likedIds,
    addMemories,
    removeMemory,
    updateMemoryTags,
    untagKinFromMemory,
    toggleLike,
  } = useMemoriesStore();
  const perms = getTierPermissions(tier);

  // Gallery filter state
  const [filterHub, setFilterHub] = useState<HubId | "all">("all");
  const [filterKin, setFilterKin] = useState<string>("all");
  const [filterEvent, setFilterEvent] = useState<string>("all");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isReelOpen, setIsReelOpen] = useState(false);
  const [reelIndex, setReelIndex] = useState(0);
  const [notice, setNotice] = useState<{ text: string; isAction?: boolean } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Upload workflow state
  const [uploadStep, setUploadStep] = useState<"select" | "camera" | "details">("select");
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [activePendingIndex, setActivePendingIndex] = useState(0);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [hasConsent, setHasConsent] = useState(false);

  // Live device camera state
  const [cameraFacingMode, setCameraFacingMode] = useState<"environment" | "user">("environment");
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedSnapshot, setCapturedSnapshot] = useState<{ dataUrl: string; sizeKb: number } | null>(null);

  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const allMemories = useMemo<TripMemory[]>(() => {
    const chatMemories: TripMemory[] = messagesStore.archivedMemories.map((m) => {
      const matchedKin = TAG_KINS.find(
        (k) => k.shortName.toLowerCase() === m.kinName.toLowerCase()
      );
      return {
        id: m.id,
        url: "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?q=80&w=800&auto=format&fit=crop",
        location: m.location,
        caption: `Saved chat with ${m.kinName}: ${m.preview}`,
        hubId: matchedKin?.hubId || "siargao",
        eventId: null,
        taggedKinIds: matchedKin ? [matchedKin.id] : ["me"],
        vibe: m.vibe,
        visibility: "crew_only",
        likes: 8,
        date: new Date(m.date).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      };
    });
    return [...memories, ...chatMemories];
  }, [memories, messagesStore.archivedMemories]);

  const filteredMemories = useMemo(() => {
    return allMemories.filter((m) => {
      const matchesHub = filterHub === "all" || m.hubId === filterHub;
      const matchesKin = filterKin === "all" || m.taggedKinIds.includes(filterKin);
      const matchesEvent = filterEvent === "all" || m.eventId === filterEvent;
      return matchesHub && matchesKin && matchesEvent;
    });
  }, [allMemories, filterHub, filterKin, filterEvent]);

  const hasActiveFilters = filterHub !== "all" || filterKin !== "all" || filterEvent !== "all";

  useEffect(() => {
    if (!isReelOpen || filteredMemories.length === 0) return;
    const timer = setInterval(() => {
      setReelIndex((prev) => (prev + 1) % filteredMemories.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [isReelOpen, filteredMemories.length]);

  const selectedMemory = allMemories.find((m) => m.id === selectedId);
  const activeReelMemory = filteredMemories[reelIndex] || filteredMemories[0] || allMemories[0];

  const showToast = (text: string, isAction = false) => {
    setNotice({ text, isAction });
    setTimeout(() => setNotice(null), 3500);
  };

  const stopCameraStream = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const startCameraStream = async (facing: "environment" | "user") => {
    stopCameraStream();
    setCameraError(null);
    setCapturedSnapshot(null);

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setCameraError(
        "Live camera access is not supported in this browser. Please choose a photo from your device instead."
      );
      return;
    }

    setIsStartingCamera(true);
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      const errorName = err instanceof Error ? err.name : "";
      if (errorName === "NotAllowedError" || errorName === "PermissionDeniedError") {
        setCameraError(
          "Camera permission was blocked. Allow camera access in your browser address bar, then tap Try Again."
        );
      } else if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") {
        setCameraError(
          "No camera was detected on this device. Connect a webcam or choose a photo from your device."
        );
      } else {
        setCameraError(
          "Could not start your camera right now. Make sure no other app is using it, or choose a photo from your device."
        );
      }
    } finally {
      setIsStartingCamera(false);
    }
  };

  useEffect(() => {
    if (isUploadModalOpen && uploadStep === "camera" && !capturedSnapshot) {
      startCameraStream(cameraFacingMode);
    } else if (uploadStep !== "camera" || !isUploadModalOpen) {
      stopCameraStream();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUploadModalOpen, uploadStep, cameraFacingMode]);

  const createDefaultPendingPhoto = (
    id: string,
    dataUrl: string,
    fileName: string,
    sizeKb: number
  ): PendingPhoto => {
    const defaultEvent = TAG_EVENTS[0];
    return {
      id,
      dataUrl,
      fileName,
      caption: "",
      location: defaultEvent.defaultLocation,
      hubId: defaultEvent.hubId,
      eventId: defaultEvent.id,
      taggedKinIds: [...defaultEvent.defaultKins],
      vibe: defaultEvent.defaultVibe,
      visibility: "hub_public",
      included: true,
      sizeKb,
    };
  };

  const handleOpenCamera = () => {
    setUploadError(null);
    if (pendingPhotos.length >= MAX_BATCH_PHOTOS) {
      setUploadError(`You can upload up to ${MAX_BATCH_PHOTOS} photos at a time.`);
      return;
    }
    setCapturedSnapshot(null);
    setCameraError(null);
    setUploadStep("camera");
  };

  const handleCaptureFrame = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;

    let width = video.videoWidth;
    let height = video.videoHeight;
    if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
      const ratio = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (cameraFacingMode === "user") {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.84);
    const sizeKb = Math.max(1, Math.round((dataUrl.length * 3) / 4 / 1024));
    stopCameraStream();
    setCapturedSnapshot({ dataUrl, sizeKb });
  };

  const handleUseSnapshot = () => {
    if (!capturedSnapshot) return;
    const newPhoto = createDefaultPendingPhoto(
      `cam-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      capturedSnapshot.dataUrl,
      `camera-photo-${pendingPhotos.length + 1}.jpg`,
      capturedSnapshot.sizeKb
    );

    setPendingPhotos((prev) => {
      const merged = [...prev, newPhoto];
      setActivePendingIndex(merged.length - 1);
      return merged;
    });
    setCapturedSnapshot(null);
    setUploadStep("details");
  };

  const handleRetakeSnapshot = () => {
    setCapturedSnapshot(null);
    startCameraStream(cameraFacingMode);
  };

  const resetUploadModal = () => {
    stopCameraStream();
    setIsUploadModalOpen(false);
    setUploadStep("select");
    setPendingPhotos([]);
    setActivePendingIndex(0);
    setUploadError(null);
    setCameraError(null);
    setCapturedSnapshot(null);
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
        processed.push(
          createDefaultPendingPhoto(
            `up-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            dataUrl,
            file.name,
            sizeKb
          )
        );
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

    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    handleFilesSelected(e.dataTransfer.files);
  };

  const updateActivePending = (updater: (photo: PendingPhoto) => PendingPhoto) => {
    setPendingPhotos((prev) =>
      prev.map((p, idx) => (idx === activePendingIndex ? updater(p) : p))
    );
  };

  const handleSelectEventForActive = (eventId: string) => {
    if (!eventId) {
      updateActivePending((p) => ({ ...p, eventId: null }));
      return;
    }
    const matched = TAG_EVENTS.find((ev) => ev.id === eventId);
    if (!matched) return;
    updateActivePending((p) => ({
      ...p,
      eventId: matched.id,
      hubId: matched.hubId,
      location: matched.defaultLocation,
      vibe: matched.defaultVibe,
      taggedKinIds: [...matched.defaultKins],
    }));
  };

  const applyActiveTagsToAll = () => {
    if (!activePending) return;
    setPendingPhotos((prev) =>
      prev.map((p) => ({
        ...p,
        hubId: activePending.hubId,
        eventId: activePending.eventId,
        location: activePending.location,
        taggedKinIds: [...activePending.taggedKinIds],
        vibe: activePending.vibe,
        visibility: activePending.visibility,
      }))
    );
    showToast("Applied these tags to all selected photos.");
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

    const newMemories: TripMemory[] = includedPendingPhotos.map((photo) => {
      const cleanLocation = photo.location.trim() || getHubLabel(photo.hubId);
      return {
        id: photo.id,
        url: photo.dataUrl,
        location: cleanLocation,
        caption: photo.caption.trim() || `Shared trip moment at ${cleanLocation}.`,
        hubId: photo.hubId,
        eventId: photo.eventId,
        taggedKinIds: photo.taggedKinIds.length > 0 ? photo.taggedKinIds : ["me"],
        vibe: photo.vibe,
        visibility: photo.visibility,
        likes: 0,
        date: todayLabel,
        isUserUpload: true,
        exifStripped: true,
      };
    });

    addMemories(newMemories);
    resetUploadModal();
    showToast(
      newMemories.length === 1
        ? "1 photo published and routed to its tagged areas."
        : `${newMemories.length} photos published and routed to their tagged areas.`
    );
  };

  const handleDeleteUpload = (id: string) => {
    removeMemory(id);
    setSelectedId(null);
    setIsEditingTags(false);
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
    <div className="max-w-6xl mx-auto space-y-8 pb-24 relative">
      {/* Hidden native input for Camera Roll / Device Files */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        multiple
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
            Tag photos by event, island hub, and Travel Kins so they appear automatically in the right places.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={filteredMemories.length === 0}
            onClick={() => {
              setReelIndex(0);
              setIsReelOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-3 bg-white text-slate border border-slate/15 rounded-xl font-bold text-xs hover:bg-slate/5 transition-all disabled:opacity-50"
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

      {/* Cross-Area Tag Filter Bar (By Island Hub, Event / Stop, & Travel Kin) */}
      <div className="p-4 sm:p-5 bg-white border border-slate/10 rounded-2xl shadow-sm space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Island Hub Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate/50 mr-1 inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Hub
            </span>
            <button
              type="button"
              onClick={() => setFilterHub("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                filterHub === "all"
                  ? "bg-slate text-white border-slate"
                  : "bg-[#F9F8F6] text-slate/70 border-slate/10 hover:text-slate"
              }`}
            >
              All Islands
            </button>
            {TAG_HUBS.map((hub) => (
              <button
                key={hub.id}
                type="button"
                onClick={() => setFilterHub(hub.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                  filterHub === hub.id
                    ? "bg-slate text-white border-slate"
                    : "bg-[#F9F8F6] text-slate/70 border-slate/10 hover:text-slate"
                }`}
              >
                {hub.label}
              </button>
            ))}
          </div>

          {/* Event / Itinerary Stop Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate/55 shrink-0" />
            <select
              aria-label="Filter by event or stop"
              value={filterEvent}
              onChange={(e) => setFilterEvent(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#F9F8F6] border border-slate/15 text-xs font-bold text-slate outline-none focus:bg-white max-w-[260px]"
            >
              <option value="all">All Events &amp; Stops</option>
              {TAG_EVENTS.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* People / Travel Kins Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate/10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate/50 mr-1 inline-flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> People
            </span>
            <button
              type="button"
              onClick={() => setFilterKin("all")}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                filterKin === "all"
                  ? "bg-slate text-white border-slate"
                  : "bg-white text-slate/70 border-slate/15 hover:text-slate"
              }`}
            >
              Everyone
            </button>
            {TAG_KINS.map((kin) => (
              <button
                key={kin.id}
                type="button"
                onClick={() => setFilterKin(kin.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                  filterKin === kin.id
                    ? "bg-slate text-white border-slate"
                    : "bg-white text-slate/70 border-slate/15 hover:text-slate"
                }`}
              >
                {kin.shortName}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold text-slate/60">
            <span>
              Showing <strong className="text-slate">{filteredMemories.length}</strong>{" "}
              {filteredMemories.length === 1 ? "photo" : "photos"}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setFilterHub("all");
                  setFilterKin("all");
                  setFilterEvent("all");
                }}
                className="text-sunset font-bold hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
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
                {filteredMemories.map((m, idx) => (
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
                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-bold">
                    <MapPin className="w-3 h-3" /> {activeReelMemory.location}
                  </span>
                  {getEventLabel(activeReelMemory.eventId) && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold">
                      <Calendar className="w-3 h-3" /> {getEventLabel(activeReelMemory.eventId)}
                    </span>
                  )}
                </div>
                <p className="text-lg leading-snug font-medium">&ldquo;{activeReelMemory.caption}&rdquo;</p>
                <div className="flex items-center justify-between pt-2 border-t border-white/15 text-xs text-white/75">
                  <span>{activeReelMemory.date}</span>
                  <span>
                    With {activeReelMemory.taggedKinIds.map(getKinName).join(", ")}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Device / Camera Upload & Structured Tagging Modal */}
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
                  {uploadStep !== "select" && (
                    <button
                      type="button"
                      onClick={() => {
                        stopCameraStream();
                        setCapturedSnapshot(null);
                        setCameraError(null);
                        setUploadStep(
                          uploadStep === "camera" && pendingPhotos.length > 0
                            ? "details"
                            : "select"
                        );
                      }}
                      aria-label="Back"
                      className="p-1.5 hover:bg-slate/10 rounded-lg transition-colors text-slate/70"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  )}
                  <div>
                    <h3 className="text-base font-bold text-slate">
                      {uploadStep === "select"
                        ? "Upload Trip Photos"
                        : uploadStep === "camera"
                        ? "Take a Photo"
                        : "Tag & Review Photos"}
                    </h3>
                    <p className="text-xs font-medium text-slate/60">
                      {uploadStep === "select"
                        ? "Step 1 of 2 · Pick photos from your device or open your camera"
                        : uploadStep === "camera"
                        ? "Live device camera · No GPS coordinates are saved"
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
                          onClick={handleOpenCamera}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate/15 text-slate text-xs font-bold hover:bg-slate/5 transition-all disabled:opacity-60"
                        >
                          <Camera className="w-4 h-4 text-slate/70" />
                          Take a Photo
                        </button>
                      </div>
                    </div>

                    {pendingPhotos.length > 0 && (
                      <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate/10">
                        <span className="text-xs font-semibold text-slate">
                          {pendingPhotos.length} photo{pendingPhotos.length === 1 ? "" : "s"} ready to tag
                        </span>
                        <button
                          type="button"
                          onClick={() => setUploadStep("details")}
                          className="px-4 py-2 rounded-lg bg-slate text-white text-xs font-bold hover:bg-slate/90 transition-colors"
                        >
                          Continue to Tagging
                        </button>
                      </div>
                    )}

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
                ) : uploadStep === "camera" ? (
                  <div className="space-y-4">
                    <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-slate border border-slate/15 flex items-center justify-center">
                      {cameraError ? (
                        <div className="p-6 text-center space-y-4 max-w-sm">
                          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto">
                            <Camera className="w-6 h-6 text-white/80" />
                          </div>
                          <p className="text-sm font-semibold text-white leading-relaxed">
                            {cameraError}
                          </p>
                          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                            <button
                              type="button"
                              onClick={() => startCameraStream(cameraFacingMode)}
                              className="px-4 py-2.5 rounded-xl bg-sunset text-white text-xs font-bold hover:bg-sunset-dark transition-colors"
                            >
                              Try Again
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                stopCameraStream();
                                setUploadStep("select");
                                galleryInputRef.current?.click();
                              }}
                              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
                            >
                              Choose from Device
                            </button>
                          </div>
                        </div>
                      ) : capturedSnapshot ? (
                        <>
                          <Image
                            src={capturedSnapshot.dataUrl}
                            alt="Captured trip photo preview"
                            fill
                            referrerPolicy="no-referrer"
                            className="object-cover"
                          />
                          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/55 backdrop-blur-sm text-white text-xs font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                            Snapshot ready · {capturedSnapshot.sizeKb} KB
                          </span>
                        </>
                      ) : (
                        <>
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover ${
                              cameraFacingMode === "user" ? "-scale-x-100" : ""
                            }`}
                          />
                          {isStartingCamera && (
                            <div className="absolute inset-0 bg-slate/80 flex items-center justify-center">
                              <p className="text-xs font-semibold text-white/85">
                                Opening device camera...
                              </p>
                            </div>
                          )}
                          {!isStartingCamera && (
                            <button
                              type="button"
                              onClick={() =>
                                setCameraFacingMode((prev) =>
                                  prev === "environment" ? "user" : "environment"
                                )
                              }
                              aria-label="Switch camera"
                              title="Switch front / rear camera"
                              className="absolute top-3 right-3 p-2.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {!cameraError && (
                      <div className="flex items-center justify-between gap-3 pt-1">
                        {capturedSnapshot ? (
                          <>
                            <button
                              type="button"
                              onClick={handleRetakeSnapshot}
                              className="px-5 py-3 rounded-xl border border-slate/15 text-xs font-bold text-slate hover:bg-slate/5 transition-colors"
                            >
                              Retake
                            </button>
                            <button
                              type="button"
                              onClick={handleUseSnapshot}
                              className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-sunset text-white text-xs font-bold hover:bg-sunset-dark transition-all inline-flex items-center justify-center gap-2"
                            >
                              <Check className="w-4 h-4" />
                              Use This Photo
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                stopCameraStream();
                                setUploadStep(pendingPhotos.length > 0 ? "details" : "select");
                              }}
                              className="px-4 py-3 rounded-xl border border-slate/15 text-xs font-bold text-slate/75 hover:bg-slate/5 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={isStartingCamera}
                              onClick={handleCaptureFrame}
                              className="flex-1 sm:flex-none px-7 py-3 rounded-xl bg-sunset text-white text-xs font-bold hover:bg-sunset-dark transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              <Camera className="w-4 h-4" />
                              Capture Photo
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handlePublishPhotos} className="space-y-5">
                    {activePending && (
                      <div className="space-y-3">
                        <div className="relative h-52 rounded-xl overflow-hidden bg-slate/5 border border-slate/10">
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
                            <>
                              <button
                                type="button"
                                onClick={() => galleryInputRef.current?.click()}
                                className="w-16 h-16 rounded-xl border-2 border-dashed border-slate/20 hover:border-slate/40 bg-[#F9F8F6] flex flex-col items-center justify-center text-slate/65 hover:text-slate transition-colors shrink-0"
                              >
                                <Plus className="w-4 h-4" />
                                <span className="text-[10px] font-bold mt-0.5">Files</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleOpenCamera}
                                className="w-16 h-16 rounded-xl border-2 border-dashed border-slate/20 hover:border-slate/40 bg-[#F9F8F6] flex flex-col items-center justify-center text-slate/65 hover:text-slate transition-colors shrink-0"
                              >
                                <Camera className="w-4 h-4" />
                                <span className="text-[10px] font-bold mt-0.5">Camera</span>
                              </button>
                            </>
                          )}
                        </div>

                        {pendingPhotos.length > 1 && (
                          <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#F9F8F6] border border-slate/10 text-xs">
                            <span className="font-semibold text-slate/70">
                              Editing tags for Photo {activePendingIndex + 1} of {pendingPhotos.length}
                            </span>
                            <button
                              type="button"
                              onClick={applyActiveTagsToAll}
                              className="font-bold text-sunset hover:underline"
                            >
                              Apply tags to all {pendingPhotos.length}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Structured Event / Itinerary Stop Tag (Auto-Suggests Hub, Location & Crew) */}
                    {activePending && (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate/65 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            Link to Event or Itinerary Stop
                          </label>
                          <select
                            value={activePending.eventId || ""}
                            onChange={(e) => handleSelectEventForActive(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-[#F9F8F6] border border-slate/15 rounded-xl text-sm font-medium text-slate focus:bg-white outline-none"
                          >
                            <option value="">General trip moment (no specific stop)</option>
                            {TAG_EVENTS.map((ev) => (
                              <option key={ev.id} value={ev.id}>
                                {ev.label} ({getHubLabel(ev.hubId)})
                              </option>
                            ))}
                          </select>
                          <p className="text-[11px] font-medium text-slate/55">
                            Photos linked to a stop appear automatically inside that stop&apos;s Itinerary details.
                          </p>
                        </div>

                        {/* Island Hub + General Location */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate/65">
                              Island Hub
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {TAG_HUBS.map((hub) => (
                                <button
                                  key={hub.id}
                                  type="button"
                                  onClick={() =>
                                    updateActivePending((p) => ({ ...p, hubId: hub.id }))
                                  }
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                    activePending.hubId === hub.id
                                      ? "bg-slate text-white border-slate"
                                      : "bg-[#F9F8F6] text-slate/70 border-slate/10 hover:border-slate/25"
                                  }`}
                                >
                                  {hub.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate/65">
                              Location Label
                            </label>
                            <input
                              type="text"
                              required
                              value={activePending.location}
                              onChange={(e) =>
                                updateActivePending((p) => ({
                                  ...p,
                                  location: e.target.value,
                                }))
                              }
                              placeholder="e.g. Cloud 9 Boardwalk, Siargao"
                              className="w-full px-3.5 py-2.5 bg-[#F9F8F6] border border-slate/15 rounded-xl text-sm font-medium text-slate focus:bg-white outline-none"
                            />
                          </div>
                        </div>

                        {/* Caption */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate/65">
                            Caption
                          </label>
                          <input
                            type="text"
                            value={activePending.caption}
                            onChange={(e) =>
                              updateActivePending((p) => ({ ...p, caption: e.target.value }))
                            }
                            placeholder="Add a short story or moment from this photo..."
                            className="w-full px-4 py-2.5 bg-[#F9F8F6] border border-slate/15 rounded-xl text-sm font-medium text-slate focus:bg-white outline-none"
                          />
                        </div>

                        {/* Tag Travel Kins + Vibe */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate/65">
                              Tag Travel Kins (People)
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {TAG_KINS.map((kin) => {
                                const active = activePending.taggedKinIds.includes(kin.id);
                                return (
                                  <button
                                    key={kin.id}
                                    type="button"
                                    onClick={() =>
                                      updateActivePending((p) => ({
                                        ...p,
                                        taggedKinIds: active
                                          ? p.taggedKinIds.filter((id) => id !== kin.id)
                                          : [...p.taggedKinIds, kin.id],
                                      }))
                                    }
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                                      active
                                        ? "bg-slate text-white border-slate"
                                        : "bg-white text-slate/70 border-slate/15 hover:bg-slate/5"
                                    }`}
                                  >
                                    {active && <Check className="w-3 h-3" />}
                                    {kin.shortName}
                                  </button>
                                );
                              })}
                            </div>
                            <p className="text-[11px] font-medium text-slate/55">
                              Appears on each tagged Kin&apos;s card. Anyone can untag themselves.
                            </p>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate/65">
                              Trip Vibe
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {TAG_VIBES.map((vibe) => (
                                <button
                                  key={vibe}
                                  type="button"
                                  onClick={() =>
                                    updateActivePending((p) => ({ ...p, vibe }))
                                  }
                                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                                    activePending.vibe === vibe
                                      ? "bg-slate text-white border-slate"
                                      : "bg-[#F9F8F6] text-slate/70 border-slate/10 hover:border-slate/25"
                                  }`}
                                >
                                  {vibe}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Visibility Scope */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate/65">
                            Where Should This Photo Show?
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <button
                              type="button"
                              onClick={() =>
                                updateActivePending((p) => ({
                                  ...p,
                                  visibility: "hub_public",
                                }))
                              }
                              className={`p-3 rounded-xl border text-left transition-all ${
                                activePending.visibility === "hub_public"
                                  ? "border-slate bg-slate/5"
                                  : "border-slate/15 bg-white hover:bg-[#F9F8F6]"
                              }`}
                            >
                              <div className="flex items-center gap-2 text-xs font-bold text-slate">
                                <Globe className="w-3.5 h-3.5" />
                                Island Hub &amp; Trip Group
                              </div>
                              <p className="text-[11px] text-slate/60 font-medium mt-1">
                                Shows in Trip Photos, Itinerary stop, tagged Kins, and the {getHubLabel(activePending.hubId)} Hub directory.
                              </p>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateActivePending((p) => ({
                                  ...p,
                                  visibility: "crew_only",
                                }))
                              }
                              className={`p-3 rounded-xl border text-left transition-all ${
                                activePending.visibility === "crew_only"
                                  ? "border-slate bg-slate/5"
                                  : "border-slate/15 bg-white hover:bg-[#F9F8F6]"
                              }`}
                            >
                              <div className="flex items-center gap-2 text-xs font-bold text-slate">
                                <Users className="w-3.5 h-3.5" />
                                Trip Group Only
                              </div>
                              <p className="text-[11px] text-slate/60 font-medium mt-1">
                                Private to your trip album, linked Itinerary stop, and tagged Kins (hidden from Island Hubs).
                              </p>
                            </button>
                          </div>
                        </div>
                      </>
                    )}

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
                        Everyone visible in {includedPendingPhotos.length === 1 ? "this photo" : "these photos"} is okay with sharing {includedPendingPhotos.length === 1 ? "it" : "them"} with these tags.
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
      {filteredMemories.length === 0 ? (
        <div className="p-12 bg-white border border-slate/10 rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate/5 flex items-center justify-center mx-auto text-slate/60">
            <Tag className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate">No photos match these tags yet</h3>
          <p className="text-xs font-medium text-slate/65 max-w-sm mx-auto">
            Try clearing your filters or upload a photo and tag it with this hub, event, or Travel Kin.
          </p>
          <div className="flex items-center justify-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setFilterHub("all");
                setFilterKin("all");
                setFilterEvent("all");
              }}
              className="px-4 py-2.5 rounded-xl border border-slate/15 text-xs font-bold text-slate hover:bg-slate/5"
            >
              Show All Photos
            </button>
            <button
              type="button"
              onClick={handleOpenUpload}
              className="px-4 py-2.5 rounded-xl bg-sunset text-white text-xs font-bold hover:bg-sunset-dark"
            >
              Upload Photos
            </button>
          </div>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {filteredMemories.map((memory) => {
            const isLiked = Boolean(likedIds[memory.id]);
            const displayLikes = memory.likes + (isLiked ? 1 : 0);
            const eventLabel = getEventLabel(memory.eventId);

            return (
              <div
                key={memory.id}
                onClick={() => {
                  setSelectedId(memory.id);
                  setIsEditingTags(false);
                }}
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-5 left-5 right-5 space-y-2.5">
                        {eventLabel && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-bold text-white">
                            <Calendar className="w-3 h-3" />
                            {eventLabel}
                          </span>
                        )}
                        <p className="text-white text-sm leading-snug font-medium">
                          &ldquo;{memory.caption}&rdquo;
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {memory.taggedKinIds.map((kinId) => (
                            <span
                              key={kinId}
                              className="px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold text-white"
                            >
                              {getKinName(kinId)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/45 backdrop-blur-md rounded-full flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-white" />
                      <span className="text-xs font-semibold text-white">
                        {getHubLabel(memory.hubId)}
                      </span>
                    </div>

                    <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/45 backdrop-blur-md rounded-full flex items-center gap-1.5">
                      <Heart className={`w-3 h-3 text-white ${isLiked ? "fill-white" : ""}`} />
                      <span className="text-xs font-bold text-white tabular-nums">{displayLikes}</span>
                    </div>
                  </div>

                  {/* Clean Structured Tag Strip Below Photo */}
                  <div className="px-4 py-3 bg-white flex flex-wrap items-center justify-between gap-2 border-t border-slate/5">
                    <span className="text-xs font-semibold text-slate/75 truncate max-w-[65%]">
                      {eventLabel || memory.location}
                    </span>
                    <span className="text-[11px] font-bold text-slate/55 inline-flex items-center gap-1">
                      {memory.visibility === "hub_public" ? (
                        <>
                          <Globe className="w-3 h-3" /> Hub
                        </>
                      ) : (
                        <>
                          <Users className="w-3 h-3" /> Group
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Expanded Photo Modal with Interactive Tags & Inline Re-Tagging */}
      <AnimatePresence>
        {selectedId && selectedMemory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          >
            <div
              className="absolute inset-0 bg-slate/65 backdrop-blur-md"
              onClick={() => {
                setSelectedId(null);
                setIsEditingTags(false);
              }}
            />
            <div className="relative w-full max-w-5xl h-[82vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
              <div className="flex-1 relative bg-black flex items-center justify-center min-h-[260px]">
                <Image
                  src={selectedMemory.url}
                  alt={selectedMemory.caption}
                  fill
                  referrerPolicy="no-referrer"
                  className="object-contain"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(null);
                    setIsEditingTags(false);
                  }}
                  aria-label="Close photo"
                  className="absolute top-5 left-5 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all z-10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="w-full md:w-[390px] p-6 sm:p-7 flex flex-col justify-between bg-[#F9F8F6] overflow-y-auto">
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate/60">
                        {selectedMemory.location}
                      </p>
                      <h3 className="text-xl font-bold text-slate mt-1">Trip Photo</h3>
                    </div>
                    {perms.canUploadMemories && (
                      <button
                        type="button"
                        onClick={() => setIsEditingTags((v) => !v)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors shrink-0 ${
                          isEditingTags
                            ? "bg-slate text-white border-slate"
                            : "bg-white text-slate border-slate/15 hover:bg-slate/5"
                        }`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        {isEditingTags ? "Done" : "Edit Tags"}
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-slate/80 leading-relaxed font-medium">
                    &ldquo;{selectedMemory.caption}&rdquo;
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate/65">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> {selectedMemory.date}
                    </span>
                    {selectedMemory.exifStripped && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-[11px] font-semibold">
                        <ShieldCheck className="w-3 h-3" />
                        GPS removed
                      </span>
                    )}
                  </div>

                  {isEditingTags ? (
                    <div className="space-y-4 pt-4 border-t border-slate/10">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate/60">
                          Linked Event / Stop
                        </label>
                        <select
                          value={selectedMemory.eventId || ""}
                          onChange={(e) => {
                            const evId = e.target.value || null;
                            const ev = TAG_EVENTS.find((x) => x.id === evId);
                            updateMemoryTags(selectedMemory.id, {
                              eventId: evId,
                              ...(ev ? { hubId: ev.hubId } : {}),
                            });
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate/15 rounded-xl text-xs font-semibold text-slate outline-none"
                        >
                          <option value="">No specific stop</option>
                          {TAG_EVENTS.map((ev) => (
                            <option key={ev.id} value={ev.id}>
                              {ev.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate/60">
                          Island Hub
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {TAG_HUBS.map((hub) => (
                            <button
                              key={hub.id}
                              type="button"
                              onClick={() =>
                                updateMemoryTags(selectedMemory.id, { hubId: hub.id })
                              }
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                                selectedMemory.hubId === hub.id
                                  ? "bg-slate text-white border-slate"
                                  : "bg-white text-slate/70 border-slate/15"
                              }`}
                            >
                              {hub.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate/60">
                          People Tagged
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {TAG_KINS.map((kin) => {
                            const active = selectedMemory.taggedKinIds.includes(kin.id);
                            return (
                              <button
                                key={kin.id}
                                type="button"
                                onClick={() =>
                                  updateMemoryTags(selectedMemory.id, {
                                    taggedKinIds: active
                                      ? selectedMemory.taggedKinIds.filter((k) => k !== kin.id)
                                      : [...selectedMemory.taggedKinIds, kin.id],
                                  })
                                }
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                                  active
                                    ? "bg-slate text-white border-slate"
                                    : "bg-white text-slate/70 border-slate/15"
                                }`}
                              >
                                {active && <Check className="w-3 h-3" />}
                                {kin.shortName}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate/60">
                          Visibility
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateMemoryTags(selectedMemory.id, { visibility: "hub_public" })
                            }
                            className={`flex-1 py-2 rounded-lg text-xs font-bold border ${
                              selectedMemory.visibility === "hub_public"
                                ? "bg-slate text-white border-slate"
                                : "bg-white text-slate/70 border-slate/15"
                            }`}
                          >
                            Hub &amp; Group
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateMemoryTags(selectedMemory.id, { visibility: "crew_only" })
                            }
                            className={`flex-1 py-2 rounded-lg text-xs font-bold border ${
                              selectedMemory.visibility === "crew_only"
                                ? "bg-slate text-white border-slate"
                                : "bg-white text-slate/70 border-slate/15"
                            }`}
                          >
                            Group Only
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Structured Routing Tags (Clickable to Filter) */}
                      <div className="space-y-2.5 pt-4 border-t border-slate/10">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate/60">
                          Appears In
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setFilterHub(selectedMemory.hubId);
                              setSelectedId(null);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate/15 rounded-full text-xs font-semibold text-slate hover:border-slate/35 transition-colors"
                          >
                            <MapPin className="w-3 h-3 text-slate/60" />
                            {getHubLabel(selectedMemory.hubId)} Hub
                          </button>
                          {selectedMemory.eventId && getEventLabel(selectedMemory.eventId) && (
                            <button
                              type="button"
                              onClick={() => {
                                setFilterEvent(selectedMemory.eventId!);
                                setSelectedId(null);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate/15 rounded-full text-xs font-semibold text-slate hover:border-slate/35 transition-colors"
                            >
                              <Calendar className="w-3 h-3 text-slate/60" />
                              {getEventLabel(selectedMemory.eventId)}
                            </button>
                          )}
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate/5 rounded-full text-xs font-semibold text-slate/75">
                            {selectedMemory.visibility === "hub_public" ? (
                              <>
                                <Globe className="w-3 h-3" /> Visible in Island Hub
                              </>
                            ) : (
                              <>
                                <Users className="w-3 h-3" /> Trip Group Only
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* People in Photo (With One-Click Untag Option) */}
                      <div className="space-y-2 pt-3 border-t border-slate/10">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate/60">
                          People Tagged ({selectedMemory.taggedKinIds.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedMemory.taggedKinIds.map((kinId) => (
                            <span
                              key={kinId}
                              className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-white border border-slate/15 rounded-full text-xs font-semibold text-slate"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setFilterKin(kinId);
                                  setSelectedId(null);
                                }}
                                className="inline-flex items-center gap-1.5 hover:text-sunset transition-colors"
                              >
                                <UserPlus className="w-3 h-3 text-slate/60" />
                                {getKinName(kinId)}
                              </button>
                              {perms.canUploadMemories && (
                                <button
                                  type="button"
                                  onClick={() => untagKinFromMemory(selectedMemory.id, kinId)}
                                  title={`Untag ${getKinName(kinId)}`}
                                  aria-label={`Untag ${getKinName(kinId)}`}
                                  className="p-0.5 rounded-full text-slate/45 hover:text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </span>
                          ))}
                          {selectedMemory.taggedKinIds.length === 0 && (
                            <span className="text-xs font-medium text-slate/55">
                              No people tagged yet.
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-2.5 pt-6">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => toggleLike(selectedMemory.id)}
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
