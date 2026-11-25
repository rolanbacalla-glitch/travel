"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  MapPin,
  Star,
  Waves,
  Compass,
  Navigation,
  ShieldCheck,
  Heart,
  Calendar,
  ArrowRight,
  Lock,
  Camera,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Kin } from "@/lib/data/kins";
import { VibeConsensus } from "@/components/dashboard/VibeConsensus";
import { UserTier, getTierPermissions } from "@/lib/access";
import {
  useMemoriesStore,
  getEventLabel,
  getHubLabel,
} from "@/lib/stores/useMemories";

const HUBS = [
  { id: "all", label: "All Islands" },
  { id: "siargao", label: "Siargao" },
  { id: "el-nido", label: "El Nido" },
  { id: "cebu", label: "Cebu & Moalboal" },
  { id: "coron", label: "Coron" },
] as const;

const MORE_HUBS_DIRECTORY = [
  { id: "siargao", name: "Siargao Island", country: "Philippines", activeCount: 38, highlight: "Surf & lagoons" },
  { id: "el-nido", name: "El Nido, Palawan", country: "Philippines", activeCount: 29, highlight: "Island boat trips" },
  { id: "cebu", name: "Moalboal, Cebu", country: "Philippines", activeCount: 24, highlight: "Reef diving & waterfalls" },
  { id: "coron", name: "Coron, Palawan", country: "Philippines", activeCount: 19, highlight: "Clear lakes & coral" },
];

type AvailabilityFilter = "all" | "online" | "away_offline";

export function TravelCrewHub({
  kins,
  onChat,
  tier = "verified",
}: {
  kins: Kin[];
  onChat: (id: string) => void;
  tier?: UserTier;
}) {
  const perms = getTierPermissions(tier);
  const { memories, untagKinFromMemory } = useMemoriesStore();

  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(true);
  const [selectedHub, setSelectedHub] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>("all");
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const [showHubDirectory, setShowHubDirectory] = useState<boolean>(false);
  const [activePhotosKin, setActivePhotosKin] = useState<Kin | null>(null);
  const [guestPrompt, setGuestPrompt] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const hubParam = params.get("hub");
      if (hubParam) {
        const matched = HUBS.some((h) => h.id === hubParam);
        setSelectedHub(matched ? hubParam : "all");
        setHasScanned(true);
      }
    }
  }, []);

  const startScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setHasScanned(true);
    }, 900);
  };

  const activeHubLabel =
    HUBS.find((h) => h.id === selectedHub)?.label || "All Islands";

  const onlineCount = kins.filter((k) => k.status === "online").length;
  const offlineOrAwayCount = kins.filter((k) => k.status !== "online").length;

  const filteredKins = kins.filter((k) => {
    const matchesHub = selectedHub === "all" || k.hubId === selectedHub;
    const matchesVerified = !verifiedOnly || k.verified;
    const matchesAvailability =
      availabilityFilter === "all"
        ? true
        : availabilityFilter === "online"
        ? k.status === "online"
        : k.status !== "online";
    return matchesHub && matchesVerified && matchesAvailability;
  });

  const handleLike = (id: string) => {
    if (!perms.canBookmark) {
      setGuestPrompt("Create a free account to save favourite travellers.");
      setTimeout(() => setGuestPrompt(null), 3500);
      return;
    }
    setLikedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenChat = (kin: Kin) => {
    if (!perms.canMessage) {
      setGuestPrompt(`Sign in for free to message ${kin.name} and plan a trip together.`);
      setTimeout(() => setGuestPrompt(null), 3500);
      return;
    }
    onChat(kin.id);
  };

  return (
    <div className="space-y-10 relative">
      {/* Inline Tier Notice */}
      <AnimatePresence>
        {guestPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[70] px-5 py-3 bg-slate text-white rounded-xl shadow-xl text-xs sm:text-sm font-semibold flex items-center gap-3 border border-white/10"
          >
            <Lock className="w-4 h-4 text-sunset shrink-0" />
            <span>{guestPrompt}</span>
            <Link
              href="/onboarding"
              className="px-3 py-1 rounded-lg bg-sunset text-white text-xs font-bold hover:bg-sunset-dark transition-colors shrink-0"
            >
              Join Free
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!hasScanned && !isScanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-24 bg-white border border-slate/10 rounded-2xl shadow-sm space-y-6"
          >
            <div className="w-20 h-20 rounded-2xl bg-slate/5 flex items-center justify-center text-slate">
              <Compass className="w-9 h-9" strokeWidth={1.75} />
            </div>
            <div className="text-center space-y-2 max-w-sm">
              <h2 className="text-2xl text-slate font-bold">Find Travellers Near You</h2>
              <p className="text-slate/65 text-sm font-medium">
                See solo travellers nearby who are visiting the same islands on your dates.
              </p>
            </div>
            <button
              type="button"
              onClick={startScan}
              className="px-8 py-4 bg-sunset text-white rounded-full font-bold text-sm shadow-md shadow-sunset/20 hover:bg-sunset-dark transition-all flex items-center gap-2.5"
            >
              <Navigation className="w-4 h-4" />
              Find Travellers Nearby
            </button>
          </motion.div>
        )}

        {isScanning && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-24 space-y-6 bg-white border border-slate/10 rounded-2xl"
          >
            <div className="w-16 h-16 rounded-full border-4 border-slate/10 border-t-sunset animate-spin" />
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate">Looking for travellers nearby...</h3>
              <p className="text-xs font-medium text-slate/60">Checking active island groups</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {hasScanned && !isScanning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          {/* Clean Monochrome Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                label: "Travellers Nearby",
                val: `${filteredKins.length * 14 + 16}`,
                icon: Users,
              },
              {
                label: "Trusted Boat Guides",
                val: "6",
                icon: Star,
              },
              {
                label: "Top Activity Today",
                val: "Surf & Lagoons",
                icon: Waves,
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-5 bg-white border border-slate/10 rounded-2xl shadow-sm"
              >
                <div className="p-3 rounded-xl bg-slate/5 text-slate/75 shrink-0">
                  <stat.icon className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate/60">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-extrabold tracking-tight tabular-nums text-slate">
                    {stat.val}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Section Title + Controls */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate/60">
                Nearby Travellers
              </p>
              <h2 className="text-3xl text-slate font-bold">
                Travellers in {activeHubLabel}
              </h2>
              <p className="text-slate/65 text-sm font-medium">
                Filter by island, ID check, or who is available online right now.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setVerifiedOnly((v) => !v)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs border transition-all ${
                  verifiedOnly
                    ? "bg-slate text-white border-slate"
                    : "bg-white text-slate border-slate/15 hover:bg-slate/5"
                }`}
              >
                <ShieldCheck className="w-4 h-4" strokeWidth={1.75} />
                <span>{verifiedOnly ? "ID Verified Only" : "Show ID Verified"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedHub("all");
                  setAvailabilityFilter("all");
                  setVerifiedOnly(false);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate/75 border border-slate/15 rounded-xl font-bold text-xs hover:text-slate hover:bg-slate/5 transition-all"
              >
                <Search className="w-3.5 h-3.5" />
                Reset Filters
              </button>
            </div>
          </div>

          {/* Filter Row: Island Hubs + Online Availability Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate/10">
            {/* Island Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {HUBS.map((hub) => (
                <button
                  key={hub.id}
                  type="button"
                  onClick={() => setSelectedHub(hub.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                    selectedHub === hub.id
                      ? "bg-slate text-white border-slate"
                      : "bg-white text-slate/70 border-slate/15 hover:text-slate"
                  }`}
                >
                  {hub.label}
                </button>
              ))}
            </div>

            {/* Online Availability Filter */}
            <div className="inline-flex items-center p-1 bg-white border border-slate/15 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setAvailabilityFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  availabilityFilter === "all"
                    ? "bg-slate text-white"
                    : "text-slate/70 hover:text-slate"
                }`}
              >
                All ({kins.length})
              </button>
              <button
                type="button"
                onClick={() => setAvailabilityFilter("online")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
                  availabilityFilter === "online"
                    ? "bg-slate text-white"
                    : "text-slate/70 hover:text-slate"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Available ({onlineCount})
              </button>
              <button
                type="button"
                onClick={() => setAvailabilityFilter("away_offline")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
                  availabilityFilter === "away_offline"
                    ? "bg-slate text-white"
                    : "text-slate/70 hover:text-slate"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-slate/40" />
                Not Online ({offlineOrAwayCount})
              </button>
            </div>
          </div>

          {/* Grid of Travellers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredKins.map((kin) => {
              const statusLabel =
                kin.status === "online"
                  ? "Available"
                  : kin.status === "away"
                  ? "Away"
                  : "Offline";

              return (
                <div key={kin.id} className="flex flex-col gap-3">
                  <div className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate/5 shadow-md hover:shadow-xl transition-all duration-300">
                    <Image
                      src={kin.image}
                      alt={kin.name}
                      fill
                      priority
                      quality={95}
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                    {/* Top Row: Travel Interest + Availability Status Pill */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 bg-black/45 backdrop-blur-md rounded-full text-xs font-semibold text-white border border-white/15 truncate">
                        {kin.vibe}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black/55 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/15 shrink-0">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            kin.status === "online"
                              ? "bg-green-400"
                              : kin.status === "away"
                              ? "bg-amber-400"
                              : "bg-white/40"
                          }`}
                        />
                        {statusLabel}
                      </span>
                    </div>

                    {/* Bottom Content */}
                    <div className="absolute inset-x-0 bottom-0 p-5 space-y-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xl font-bold text-white leading-none">
                            {kin.name}
                          </h3>
                          {kin.verified ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 text-slate text-xs font-bold">
                              <ShieldCheck className="w-3 h-3 text-green-600" />
                              ID Verified
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-white/75">
                              Not Verified
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-white/80 text-xs font-medium">
                          <MapPin className="w-3.5 h-3.5 text-white/70 flex-shrink-0" />
                          {kin.location}
                        </div>
                        {kin.tripDates && (
                          <div className="inline-flex items-center gap-1.5 text-white/90 text-xs font-medium bg-white/15 px-2.5 py-0.5 rounded-md backdrop-blur-sm">
                            <Calendar className="w-3 h-3" />
                            <span>{kin.tripDates.label}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenChat(kin)}
                          className="flex-1 py-2.5 bg-white text-slate text-xs font-bold rounded-xl hover:bg-sunset hover:text-white transition-colors inline-flex items-center justify-center gap-1.5"
                        >
                          {!perms.canMessage && <Lock className="w-3.5 h-3.5" />}
                          Message
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLike(kin.id)}
                          aria-label={`Save ${kin.name}`}
                          className={`p-2.5 backdrop-blur-md rounded-xl border transition-all ${
                            likedIds[kin.id]
                              ? "bg-sunset text-white border-sunset"
                              : "bg-white/15 text-white border-white/20 hover:bg-white/25"
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${likedIds[kin.id] ? "fill-current" : ""}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Peer Reviews & Tags */}
                  {kin.vibeStats && <VibeConsensus stats={kin.vibeStats} />}

                  {/* Tagged Photos Routed to This Travel Kin */}
                  {(() => {
                    const kinPhotos = memories.filter((m) =>
                      m.taggedKinIds.includes(kin.id)
                    );
                    return (
                      <button
                        type="button"
                        onClick={() => setActivePhotosKin(kin)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate/10 hover:border-slate/25 transition-all flex items-center justify-between gap-2 text-left"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Camera className="w-3.5 h-3.5 text-slate/60 shrink-0" />
                          <span className="text-xs font-bold text-slate truncate">
                            Tagged Photos ({kinPhotos.length})
                          </span>
                        </div>
                        {kinPhotos.length > 0 ? (
                          <div className="flex -space-x-1.5 shrink-0">
                            {kinPhotos.slice(0, 3).map((photo) => (
                              <span
                                key={photo.id}
                                className="relative w-6 h-6 rounded-md overflow-hidden border border-white shadow-sm block"
                              >
                                <Image
                                  src={photo.url}
                                  alt={photo.caption}
                                  fill
                                  referrerPolicy="no-referrer"
                                  className="object-cover"
                                />
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate/45">None yet</span>
                        )}
                      </button>
                    );
                  })()}
                </div>
              );
            })}

            {/* Working "Looking for more?" Card */}
            <div className="aspect-[3/4] border border-dashed border-slate/20 bg-white rounded-2xl flex flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate/5 flex items-center justify-center text-slate/70">
                <Users className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-slate">Looking for more travellers?</h4>
                <p className="text-xs font-medium text-slate/65 leading-relaxed">
                  Browse other islands or share your travel dates so nearby groups can find you.
                </p>
              </div>
              <div className="flex flex-col w-full gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowHubDirectory((v) => !v)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate text-white text-xs font-bold hover:bg-slate/90 transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  {showHubDirectory ? "Hide Island Directory" : "Browse Island Hubs"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <Link
                  href="/destinations"
                  className="w-full py-2.5 px-4 rounded-xl border border-slate/15 text-slate text-xs font-bold hover:bg-slate/5 transition-colors text-center"
                >
                  See All Destinations
                </Link>
              </div>
            </div>
          </div>

          {/* Expandable "More Island Hubs" Section with Real Working Links */}
          <AnimatePresence>
            {showHubDirectory && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className="p-7 bg-white border border-slate/10 rounded-2xl shadow-sm space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate/10 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate">Active Island Hubs This Week</h3>
                    <p className="text-xs text-slate/65 font-medium">
                      Jump into an island guide or switch your dashboard view to see who is there.
                    </p>
                  </div>
                  <Link
                    href="/destinations"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-sunset hover:underline"
                  >
                    Explore All 16 Hubs
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {MORE_HUBS_DIRECTORY.map((hub) => {
                    const hubPhotos = memories.filter(
                      (m) => m.hubId === hub.id && m.visibility === "hub_public"
                    );
                    return (
                      <div
                        key={hub.id}
                        className="p-4 rounded-xl bg-[#F9F8F6] border border-slate/10 flex flex-col justify-between gap-3.5"
                      >
                        <div className="space-y-2.5">
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-sm font-bold text-slate">{hub.name}</span>
                              <span className="text-xs font-bold text-slate/60 tabular-nums">{hub.activeCount} active</span>
                            </div>
                            <p className="text-xs text-slate/65 font-medium">{hub.highlight}</p>
                          </div>

                          {/* Public Hub-Tagged Photos Automatically Routed Here */}
                          {hubPhotos.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[11px] font-bold text-slate/55 inline-flex items-center gap-1">
                                <Camera className="w-3 h-3" />
                                {hubPhotos.length} Hub {hubPhotos.length === 1 ? "Photo" : "Photos"}
                              </p>
                              <div className="grid grid-cols-3 gap-1.5">
                                {hubPhotos.slice(0, 3).map((photo) => (
                                  <div
                                    key={photo.id}
                                    className="relative aspect-square rounded-lg overflow-hidden bg-slate/10 border border-slate/10"
                                  >
                                    <Image
                                      src={photo.url}
                                      alt={photo.caption}
                                      fill
                                      referrerPolicy="no-referrer"
                                      className="object-cover"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedHub(hub.id);
                              setAvailabilityFilter("all");
                            }}
                            className="flex-1 py-2 rounded-lg bg-white border border-slate/15 text-xs font-bold text-slate hover:bg-slate/5 transition-colors"
                          >
                            Filter Here
                          </button>
                          <Link
                            href={`/destinations/${hub.id}`}
                            className="flex-1 py-2 rounded-lg bg-slate text-white text-xs font-bold hover:bg-slate/90 transition-colors text-center"
                          >
                            Open Guide
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Tagged Photos Modal for a Specific Travel Kin */}
      <AnimatePresence>
        {activePhotosKin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6"
          >
            <div
              className="absolute inset-0 bg-slate/45 backdrop-blur-sm"
              onClick={() => setActivePhotosKin(null)}
            />
            <motion.div
              initial={{ scale: 0.96, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 12 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate/10 overflow-hidden max-h-[85vh] flex flex-col"
            >
              <div className="px-6 py-4 border-b border-slate/10 bg-[#F9F8F6] flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate">
                    Tagged Photos with {activePhotosKin.name}
                  </h3>
                  <p className="text-xs font-medium text-slate/60">
                    Photos tagged with {activePhotosKin.name} appear here automatically.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePhotosKin(null)}
                  aria-label="Close tagged photos"
                  className="p-2 hover:bg-slate/10 rounded-full transition-colors text-slate/70"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                {(() => {
                  const kinPhotos = memories.filter((m) =>
                    m.taggedKinIds.includes(activePhotosKin.id)
                  );
                  if (kinPhotos.length === 0) {
                    return (
                      <div className="py-10 text-center space-y-2">
                        <Camera className="w-8 h-8 text-slate/35 mx-auto" />
                        <p className="text-sm font-bold text-slate">
                          No photos tagged with {activePhotosKin.name} yet
                        </p>
                        <p className="text-xs font-medium text-slate/60">
                          Upload a photo in Trip Photos and tag {activePhotosKin.name} to see it here.
                        </p>
                      </div>
                    );
                  }
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {kinPhotos.map((photo) => {
                        const evLabel = getEventLabel(photo.eventId);
                        return (
                          <div
                            key={photo.id}
                            className="rounded-xl overflow-hidden border border-slate/10 bg-[#F9F8F6] flex flex-col"
                          >
                            <div className="relative aspect-[4/3] bg-slate/10">
                              <Image
                                src={photo.url}
                                alt={photo.caption}
                                fill
                                referrerPolicy="no-referrer"
                                className="object-cover"
                              />
                              <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-sm text-white text-[11px] font-semibold">
                                {getHubLabel(photo.hubId)}
                              </span>
                            </div>
                            <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                              <div className="space-y-1">
                                {evLabel && (
                                  <p className="text-[11px] font-bold text-slate/60 inline-flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {evLabel}
                                  </p>
                                )}
                                <p className="text-xs font-semibold text-slate leading-relaxed">
                                  &ldquo;{photo.caption}&rdquo;
                                </p>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t border-slate/10">
                                <span className="text-[11px] font-medium text-slate/55">
                                  {photo.date}
                                </span>
                                {perms.canUploadMemories && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      untagKinFromMemory(photo.id, activePhotosKin.id)
                                    }
                                    className="text-[11px] font-bold text-slate/60 hover:text-red-600 transition-colors"
                                  >
                                    Remove Tag
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
