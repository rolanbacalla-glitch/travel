"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Plus,
  UserPlus,
  Heart,
  MapPin,
  Share2,
  X,
  Cloud,
  Clock,
  Sparkles,
  Image as ImageIcon,
  HardDrive,
  Link2,
  Lock
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
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
}

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

export function MemoriesView({ tier = "verified" }: { tier?: UserTier }) {
  const store = useMessagesStore();
  const perms = getTierPermissions(tier);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isReelOpen, setIsReelOpen] = useState(false);
  const [reelIndex, setReelIndex] = useState(0);
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState<string | null>(null);

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
    return [...chatMemories, ...SAMPLE_MEMORIES];
  }, [store.archivedMemories]);

  useEffect(() => {
    if (!isReelOpen) return;
    const timer = setInterval(() => {
      setReelIndex((prev) => (prev + 1) % allMemories.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [isReelOpen, allMemories.length]);

  const selectedMemory = allMemories.find((m) => m.id === selectedId);
  const activeReelMemory = allMemories[reelIndex] || allMemories[0];

  const handleOpenImport = () => {
    if (!perms.canUploadMemories) {
      setNotice(
        tier === "guest"
          ? "Sign up and verify your ID to upload and share trip photos."
          : "Verify your ID to upload photos to shared trip albums."
      );
      setTimeout(() => setNotice(null), 3500);
      return;
    }
    setIsImportModalOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-24 relative">
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[70] px-5 py-3 bg-slate text-white rounded-xl shadow-xl text-xs sm:text-sm font-semibold flex items-center gap-3 border border-white/10"
          >
            <Lock className="w-4 h-4 text-sunset shrink-0" />
            <span>{notice}</span>
            <Link
              href={tier === "guest" ? "/onboarding" : "/verify"}
              className="px-3 py-1 rounded-lg bg-sunset text-white text-xs font-bold hover:bg-sunset-dark transition-colors shrink-0"
            >
              {tier === "guest" ? "Join Free" : "Verify ID"}
            </Link>
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
            Save and share favourite photos from every group trip.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setReelIndex(0);
              setIsReelOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-3 bg-sunset text-white rounded-xl font-bold text-xs shadow-sm hover:bg-sunset-dark transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Play Slideshow
          </button>
          <button
            type="button"
            onClick={handleOpenImport}
            className="flex items-center gap-2 px-5 py-3 bg-white text-slate border border-slate/15 rounded-xl font-bold text-xs hover:bg-slate/5 transition-all"
          >
            {perms.canUploadMemories ? <Cloud className="w-4 h-4 text-slate/70" /> : <Lock className="w-3.5 h-3.5 text-slate/60" />}
            Sync Cloud
          </button>
          <button
            type="button"
            onClick={handleOpenImport}
            className="flex items-center gap-2 px-5 py-3 bg-slate text-white rounded-xl font-bold text-xs hover:bg-slate/90 transition-all"
          >
            {perms.canUploadMemories ? <Plus className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
            Upload Photo
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

              <Image src={activeReelMemory.url} alt={activeReelMemory.caption} fill className="object-cover" />
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

      {/* Import Modal */}
      <AnimatePresence>
        {isImportModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-slate/45 backdrop-blur-sm" onClick={() => setIsImportModalOpen(false)} />
            <motion.div
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 12 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6 border border-slate/10"
            >
              <div className="space-y-1 text-center">
                <h3 className="text-xl font-bold text-slate">Import Photos</h3>
                <p className="text-xs font-medium text-slate/65">Choose where to bring in your trip photos from.</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <ImportSource icon={ImageIcon} label="Google Photos" status="Connected" />
                <ImportSource icon={HardDrive} label="Amazon Photos" status="Ready" />
                <ImportSource icon={Link2} label="Instagram Link" status="Ready" />
                <ImportSource icon={Cloud} label="iCloud Photos" status="Ready" />
              </div>

              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="w-full py-3.5 bg-[#F9F8F6] text-slate/75 font-bold text-xs rounded-xl hover:text-slate transition-all"
              >
                Close
              </button>
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
                    <Heart className="w-3 h-3 text-white fill-white" />
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
                <Image src={selectedMemory.url} alt={selectedMemory.caption} fill className="object-contain" />
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  aria-label="Close photo"
                  className="absolute top-5 left-5 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all z-10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="w-full md:w-[360px] p-8 flex flex-col justify-between bg-[#F9F8F6]">
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate/60">{selectedMemory.location}</p>
                    <h3 className="text-xl font-bold text-slate mt-1">Trip Photo</h3>
                  </div>
                  <p className="text-sm text-slate/80 leading-relaxed font-medium">&ldquo;{selectedMemory.caption}&rdquo;</p>
                  <div className="flex items-center gap-2 text-slate/60 text-xs font-semibold">
                    <Clock className="w-4 h-4" /> {selectedMemory.date}
                  </div>
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

                <div className="flex items-center gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setLikedIds((prev) => ({ ...prev, [selectedMemory.id]: !prev[selectedMemory.id] }))}
                    className="flex-1 py-3.5 bg-sunset text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-sunset-dark transition-all"
                  >
                    <Heart className="w-4 h-4 fill-white" />
                    {likedIds[selectedMemory.id] ? "Liked" : "Like Photo"}
                  </button>
                  <button
                    type="button"
                    aria-label="Share photo"
                    className="p-3.5 bg-white border border-slate/15 text-slate rounded-xl hover:bg-slate/5 transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ImportSource({
  icon: Icon,
  label,
  status,
}: {
  icon: React.ElementType;
  label: string;
  status: "Connected" | "Ready";
}) {
  return (
    <button
      type="button"
      className="w-full flex items-center justify-between p-4 bg-[#F9F8F6] hover:bg-white border border-slate/10 rounded-xl transition-all"
    >
      <div className="flex items-center gap-3.5">
        <div className="p-2.5 bg-white rounded-lg border border-slate/10">
          <Icon className="w-5 h-5 text-slate" strokeWidth={1.75} />
        </div>
        <div className="text-left">
          <p className="text-sm font-bold text-slate">{label}</p>
          <p className="text-xs font-medium text-slate/60">Sync Photos</p>
        </div>
      </div>
      <span
        className={cn(
          "px-3 py-1 rounded-full text-xs font-bold border",
          status === "Connected"
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-white text-slate/65 border-slate/10"
        )}
      >
        {status}
      </span>
    </button>
  );
}
