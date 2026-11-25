"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  MessageSquare,
  Heart,
  Share2,
  MapPin,
  Zap,
  Navigation,
  Clock,
  Sparkles,
  Send,
  X,
  Plus,
  Users,
  CheckCircle2,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { UserTier, getTierPermissions } from "@/lib/access";

interface FeedItem {
  id: string;
  type: "ping" | "drop" | "intel";
  user: {
    name: string;
    image: string;
    vibe: string;
  };
  content: string;
  location: string;
  timestamp: string;
  likes: number;
  replies: number;
  tags: string[];
  coordinates?: string;
  splitCost?: string;
  seatsFilled?: number;
  seatsTotal?: number;
  expiresIn?: string;
  joinedByMe?: boolean;
}

const SAMPLE_FEED: FeedItem[] = [
  {
    id: "1",
    type: "drop",
    user: {
      name: "Elena",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&h=256&auto=format&fit=crop",
      vibe: "Lagoons",
    },
    content:
      "Booked a private boat for Sugba Lagoon and Kawhagan Sandbar at 07:30 AM tomorrow. Looking for 2 more verified travellers to share the boat cost.",
    location: "Del Carmen Pier, Siargao",
    timestamp: "14m ago",
    likes: 28,
    replies: 9,
    tags: ["BoatShare", "SugbaLagoon"],
    splitCost: "£19 / person",
    seatsFilled: 4,
    seatsTotal: 6,
    expiresIn: "Closes in 2h",
    joinedByMe: false,
  },
  {
    id: "2",
    type: "ping",
    user: {
      name: "Leo",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&h=256&auto=format&fit=crop",
      vibe: "Remote Work",
    },
    content:
      "Found a quiet café with fast Wi-Fi and backup power along Tourism Road in General Luna. Great iced coffee if anyone wants to work together today.",
    location: "General Luna, Siargao",
    timestamp: "32m ago",
    likes: 34,
    replies: 7,
    tags: ["FastWifi", "Cafe"],
  },
  {
    id: "3",
    type: "drop",
    user: {
      name: "Suki",
      image:
        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=256&h=256&auto=format&fit=crop",
      vibe: "Surf",
    },
    content:
      "Sharing an airport van from Sayak Airport to General Luna at 04:30 PM today, followed by sunset dinner near Catangnan Bridge. 2 seats free.",
    location: "Sayak Airport → General Luna",
    timestamp: "48m ago",
    likes: 19,
    replies: 6,
    tags: ["AirportVan", "Dinner"],
    splitCost: "£6 / person",
    seatsFilled: 3,
    seatsTotal: 5,
    expiresIn: "Closes in 1h",
    joinedByMe: false,
  },
  {
    id: "4",
    type: "intel",
    user: {
      name: "Marco",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&h=256&auto=format&fit=crop",
      vibe: "Local Guide",
    },
    content:
      "Local tip: Arrive at Magpupungko Rock Pools 45 minutes before low tide (01:15 PM today). Bring water shoes and 150 PHP cash for the entrance fee.",
    location: "Pilar, Siargao",
    timestamp: "1h ago",
    likes: 51,
    replies: 11,
    tags: ["LocalTip", "RockPools"],
  },
];

type FilterType = "All" | "Shared Trips" | "Hangouts" | "Local Tips";

const FEED_STORAGE_KEY = "travelkin-community-feed-v3";

export function CommunityFeed({ tier = "verified" }: { tier?: UserTier }) {
  const perms = getTierPermissions(tier);

  const [items, setItems] = useState<FeedItem[]>(SAMPLE_FEED);
  const [isPosting, setIsPosting] = useState(false);
  const [postType, setPostType] = useState<"ping" | "drop" | "intel">("ping");
  const [newPostContent, setNewPostContent] = useState("");
  const [newSplitCost, setNewSplitCost] = useState("£15 / person");
  const [newMaxSeats, setNewMaxSeats] = useState(4);
  const [filter, setFilter] = useState<FilterType>("All");
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(FEED_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const persistFeed = (updated: FeedItem[]) => {
    setItems(updated);
    try {
      localStorage.setItem(FEED_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  };

  const filteredItems = useMemo(() => {
    if (filter === "All") return items;
    return items.filter((item) => {
      if (filter === "Hangouts") return item.type === "ping";
      if (filter === "Shared Trips") return item.type === "drop";
      if (filter === "Local Tips") return item.type === "intel";
      return true;
    });
  }, [items, filter]);

  const handleCastPulse = () => {
    if (!perms.canPostUpdate) {
      showNotice("Sign in for free to post on the group board.");
      return;
    }
    if (postType === "drop" && !perms.canJoinTripSplits) {
      showNotice("Verify your ID to host paid shared boat or van trips.");
      return;
    }
    if (!newPostContent.trim()) return;

    const newPost: FeedItem = {
      id: Date.now().toString(),
      type: postType,
      user: {
        name: "Mia",
        image:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&h=256&auto=format&fit=crop",
        vibe: "Traveller",
      },
      content: newPostContent,
      location: "General Luna, Siargao",
      timestamp: "Just now",
      likes: 1,
      replies: 0,
      tags: postType === "drop" ? ["SharedTrip"] : ["LocalUpdate"],
      ...(postType === "drop"
        ? {
            splitCost: newSplitCost || "£15 / person",
            seatsFilled: 1,
            seatsTotal: newMaxSeats || 4,
            expiresIn: "Closes in 3h",
            joinedByMe: true,
          }
        : {}),
    };

    persistFeed([newPost, ...items]);
    setNewPostContent("");
    setIsPosting(false);
  };

  const handleToggleJoinDrop = (id: string) => {
    if (!perms.canJoinTripSplits) {
      showNotice(
        tier === "guest"
          ? "Sign up and verify your ID to join shared boat and van trips."
          : "Verify your ID to reserve seats on shared cost-split trips."
      );
      return;
    }
    const updated = items.map((item) => {
      if (item.id !== id || item.type !== "drop") return item;
      const currentlyJoined = Boolean(item.joinedByMe);
      const filled = item.seatsFilled ?? 1;
      const total = item.seatsTotal ?? 6;
      if (!currentlyJoined && filled >= total) return item;
      return {
        ...item,
        joinedByMe: !currentlyJoined,
        seatsFilled: currentlyJoined ? Math.max(1, filled - 1) : filled + 1,
      };
    });
    persistFeed(updated);
  };

  const handleToggleLike = (id: string) => {
    if (!perms.canUpvote) {
      showNotice("Sign in for free to like posts.");
      return;
    }
    const alreadyLiked = Boolean(likedIds[id]);
    setLikedIds((prev) => ({ ...prev, [id]: !alreadyLiked }));
    persistFeed(
      items.map((item) =>
        item.id === id
          ? { ...item, likes: alreadyLiked ? Math.max(0, item.likes - 1) : item.likes + 1 }
          : item
      )
    );
  };

  const getTypeMeta = (type: string) => {
    switch (type) {
      case "ping":
        return { label: "Hangout", icon: <Zap className="w-3.5 h-3.5" strokeWidth={1.75} /> };
      case "drop":
        return { label: "Shared Trip", icon: <MapPin className="w-3.5 h-3.5" strokeWidth={1.75} /> };
      case "intel":
        return { label: "Local Tip", icon: <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} /> };
      default:
        return { label: "Post", icon: <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.75} /> };
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-24 relative">
      {/* Inline Notice */}
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <h2 className="text-3xl text-slate font-bold">Group Board</h2>
          <p className="text-slate/65 text-sm font-medium">
            Join shared boat rides, airport vans, and read helpful tips from travellers nearby.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!perms.canPostUpdate) {
              showNotice("Sign in for free to write a post on the group board.");
              return;
            }
            setIsPosting(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-sunset text-white rounded-full font-bold text-xs shadow-sm hover:bg-sunset-dark transition-all shrink-0 w-fit"
        >
          {perms.canPostUpdate ? <Plus className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
          New Post
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white rounded-xl w-fit border border-slate/10">
        {(["All", "Shared Trips", "Hangouts", "Local Tips"] as FilterType[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all",
              filter === tab
                ? "bg-slate text-white"
                : "text-slate/65 hover:text-slate hover:bg-slate/5"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Feed List */}
      <div className="space-y-5">
        {filteredItems.map((item) => {
          const meta = getTypeMeta(item.type);
          return (
            <div
              key={item.id}
              className="relative bg-white border border-slate/10 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-slate/10 shrink-0">
                    <Image
                      src={item.user.image}
                      alt={item.user.name}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate">{item.user.name}</h3>
                      <span className="px-2 py-0.5 bg-slate/5 text-slate/70 rounded-md text-xs font-semibold">
                        {item.user.vibe}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate/60 mt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {item.location}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {item.timestamp}
                      </span>
                      {item.expiresIn && <span className="font-semibold text-slate/75">· {item.expiresIn}</span>}
                    </div>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate/5 text-slate/75 border border-slate/10 text-xs font-bold shrink-0">
                  {meta.icon}
                  {meta.label}
                </span>
              </div>

              <p className="text-base text-slate/85 leading-relaxed font-medium">{item.content}</p>

              {/* Cost-Split Card */}
              {item.type === "drop" && (
                <div className="p-4 sm:p-5 bg-[#F9F8F6] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate/10">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate/10 flex items-center justify-center text-slate shrink-0">
                      <Navigation className="w-4 h-4" strokeWidth={1.75} />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate/10 text-slate text-xs font-bold">
                          {item.splitCost || "£15 / person"}
                        </span>
                        <span className="text-xs font-semibold text-slate/70 inline-flex items-center gap-1 tabular-nums">
                          <Users className="w-3.5 h-3.5" />
                          {item.seatsFilled ?? 3}/{item.seatsTotal ?? 6} seats filled
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate/65">{item.location}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleJoinDrop(item.id)}
                    className={cn(
                      "px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0",
                      item.joinedByMe
                        ? "bg-green-600 text-white"
                        : "bg-sunset text-white hover:bg-sunset-dark"
                    )}
                  >
                    {item.joinedByMe ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Seat Reserved
                      </>
                    ) : (
                      <>
                        {!perms.canJoinTripSplits && <Lock className="w-3.5 h-3.5" />}
                        Join &amp; Split Cost
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-semibold text-slate/65 bg-slate/5 px-2.5 py-1 rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="pt-4 border-t border-slate/10 flex items-center gap-6">
                <button
                  type="button"
                  onClick={() => handleToggleLike(item.id)}
                  className="flex items-center gap-1.5 text-slate/65 hover:text-slate transition-colors"
                >
                  <Heart
                    className={cn(
                      "w-4 h-4",
                      likedIds[item.id] ? "fill-sunset text-sunset" : ""
                    )}
                  />
                  <span className="text-xs font-bold tabular-nums">{item.likes}</span>
                </button>
                <span className="flex items-center gap-1.5 text-slate/65">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-xs font-bold tabular-nums">{item.replies}</span>
                </span>
                <button
                  type="button"
                  aria-label="Share post"
                  className="ml-auto p-1.5 text-slate/60 hover:text-slate rounded-lg hover:bg-slate/5 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {isPosting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPosting(false)}
              className="absolute inset-0 bg-slate/45 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate/10"
            >
              <div className="p-7 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate">Write a Post</h3>
                  <button
                    type="button"
                    onClick={() => setIsPosting(false)}
                    className="p-2 hover:bg-slate/5 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-slate/70" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 p-1 bg-slate/5 rounded-xl">
                  {(
                    [
                      { id: "ping", label: "Hangout" },
                      { id: "drop", label: "Shared Trip" },
                      { id: "intel", label: "Local Tip" },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPostType(t.id)}
                      className={cn(
                        "py-2.5 rounded-lg text-xs font-bold transition-all inline-flex items-center justify-center gap-1",
                        postType === t.id ? "bg-white text-slate shadow-sm" : "text-slate/65 hover:text-slate"
                      )}
                    >
                      {t.id === "drop" && !perms.canJoinTripSplits && <Lock className="w-3 h-3" />}
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <textarea
                    autoFocus
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder={
                      postType === "drop"
                        ? "e.g. Booking a boat to Daku & Guyam Islands at 9am — who wants to split the cost?"
                        : "Share a local tip or invite travellers to meet for coffee..."
                    }
                    className="w-full h-28 p-4 bg-[#F9F8F6] rounded-xl border border-slate/10 focus:border-slate/30 focus:bg-white transition-all outline-none text-slate font-medium resize-none text-sm"
                  />

                  {postType === "drop" && (
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate/65">Est. Cost per Person</label>
                        <input
                          value={newSplitCost}
                          onChange={(e) => setNewSplitCost(e.target.value)}
                          placeholder="£15 / person"
                          className="w-full px-3.5 py-2.5 bg-[#F9F8F6] border border-slate/10 rounded-xl text-xs font-bold text-slate outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate/65">Total Seats</label>
                        <input
                          type="number"
                          min={2}
                          max={12}
                          value={newMaxSeats}
                          onChange={(e) => setNewMaxSeats(Number(e.target.value) || 4)}
                          className="w-full px-3.5 py-2.5 bg-[#F9F8F6] border border-slate/10 rounded-xl text-xs font-bold text-slate outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleCastPulse}
                    disabled={!newPostContent.trim()}
                    className="w-full py-3.5 bg-sunset text-white rounded-xl font-bold text-sm hover:bg-sunset-dark transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    <Send className="w-4 h-4" />
                    Post Now
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
