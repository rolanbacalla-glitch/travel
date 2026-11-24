"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  Clock,
  Plus,
  Users,
  CheckCircle2,
  Utensils,
  Camera,
  Palmtree,
  ThumbsUp,
  Heart,
  X,
  Send,
  Compass,
  Navigation,
  ChevronDown,
  Pin,
  UserPlus
} from "lucide-react";

export interface ItineraryItem {
  id: string;
  title: string;
  location: string;
  hub: "Siargao" | "El Nido";
  time: string;
  category: "food" | "activity" | "nature" | "photos";
  suggestedBy: string;
  votes: number;
  isDone: boolean;
  splitCost?: string;
  coords: { x: number; y: number; lat: string; lng: string };
}

const SAMPLE_ITEMS: ItineraryItem[] = [
  {
    id: "1",
    title: "Dawn Patrol Surf & Shaka Bowls",
    location: "Cloud 9 Boardwalk, Siargao",
    hub: "Siargao",
    time: "06:30 AM",
    category: "activity",
    suggestedBy: "Suki",
    votes: 6,
    isDone: true,
    splitCost: "£11 / person",
    coords: { x: 76, y: 28, lat: "9.8142° N", lng: "126.1652° E" },
  },
  {
    id: "2",
    title: "Kin Handshake Lunch & Kinilaw Tasting",
    location: "General Luna Coastal Market",
    hub: "Siargao",
    time: "12:30 PM",
    category: "food",
    suggestedBy: "Nara",
    votes: 9,
    isDone: false,
    splitCost: "£9 / person",
    coords: { x: 64, y: 58, lat: "9.7892° N", lng: "126.1558° E" },
  },
  {
    id: "3",
    title: "Golden-Hour Palm Rope Swing & Drone Shoot",
    location: "Maasin River, Siargao",
    hub: "Siargao",
    time: "04:00 PM",
    category: "photos",
    suggestedBy: "Liam",
    votes: 14,
    isDone: false,
    splitCost: "£7 / person",
    coords: { x: 35, y: 44, lat: "9.8390° N", lng: "126.0945° E" },
  },
  {
    id: "4",
    title: "Acoustic Bonfire & Boodle Fight Dinner",
    location: "Malinao Beach Sanctuary",
    hub: "Siargao",
    time: "07:45 PM",
    category: "nature",
    suggestedBy: "Kevin",
    votes: 11,
    isDone: false,
    splitCost: "£14 / person",
    coords: { x: 48, y: 74, lat: "9.7765° N", lng: "126.1310° E" },
  },
];

const STORAGE_KEY = "travelkin-itinerary-v2";

export function ItineraryView() {
  const [items, setItems] = useState<ItineraryItem[]>(SAMPLE_ITEMS);
  const [selectedStopId, setSelectedStopId] = useState<string>("2");
  const [showRouteMap, setShowRouteMap] = useState<boolean>(true);
  const [isDayExpanded, setIsDayExpanded] = useState<boolean>(true);
  const [pinnedIds, setPinnedIds] = useState<string[]>(["2"]);
  const [inviteCopied, setInviteCopied] = useState<boolean>(false);
  const [tomorrowVoteStatus, setTomorrowVoteStatus] = useState<"none" | "voted" | "dismissed">("none");
  const [tomorrowVotes, setTomorrowVotes] = useState<number>(19);
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({
    title: "",
    location: "",
    time: "",
    category: "activity" as "food" | "activity" | "nature" | "photos",
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
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

  const persistItems = (updated: ItineraryItem[]) => {
    setItems(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  };

  const toggleVote = (id: string) => {
    persistItems(
      items.map((item) =>
        item.id === id ? { ...item, votes: item.votes + 1 } : item
      )
    );
  };

  const toggleDone = (id: string) => {
    persistItems(
      items.map((item) =>
        item.id === id ? { ...item, isDone: !item.isDone } : item
      )
    );
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title || !newItem.location || !newItem.time) return;

    const activity: ItineraryItem = {
      id: Math.random().toString(36).slice(2, 9),
      ...newItem,
      hub: "Siargao",
      suggestedBy: "Mia",
      votes: 1,
      isDone: false,
      coords: {
        x: 25 + ((items.length * 17) % 55),
        y: 25 + ((items.length * 23) % 50),
        lat: "9.8015° N",
        lng: "126.1420° E",
      },
    };

    const updated = [...items, activity];
    persistItems(updated);
    setSelectedStopId(activity.id);
    setIsAdding(false);
    setNewItem({ title: "", location: "", time: "", category: "activity" });
  };

  const getIcon = (cat: string) => {
    switch (cat) {
      case "food":
        return <Utensils className="w-5 h-5" />;
      case "activity":
        return <Clock className="w-5 h-5" />;
      case "nature":
        return <Palmtree className="w-5 h-5" />;
      case "photos":
        return <Camera className="w-5 h-5" />;
      default:
        return <MapPin className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "food":
        return "bg-sunset/10 text-sunset";
      case "activity":
        return "bg-ocean/10 text-ocean";
      case "nature":
        return "bg-terra/10 text-terra";
      case "photos":
        return "bg-slate/10 text-slate";
      default:
        return "bg-slate/10 text-slate";
    }
  };

  const completedCount = items.filter((i) => i.isDone).length;
  const completionPercentage = Math.round((completedCount / items.length) * 100) || 0;
  const activeStop = items.find((i) => i.id === selectedStopId) || items[0];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-ocean font-bold tracking-widest text-xs uppercase bg-ocean/5 rounded-full px-4 py-1.5 w-fit border border-ocean/10 shadow-sm">
            <Calendar className="w-3.5 h-3.5" />
            Shared Day Plan
          </div>
          <h2 className="text-3xl md:text-4xl font-serif text-slate font-bold">Today in Siargao</h2>
          <p className="text-slate/60 font-medium">
            Coordinate route stops, upvote crew suggestions, and synchronise your island loop.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href).catch(() => {});
              }
              setInviteCopied(true);
              setTimeout(() => setInviteCopied(false), 2000);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate border border-slate/10 rounded-full shadow-sm hover:bg-slate/5 transition-all text-xs font-bold"
          >
            <UserPlus className="w-4 h-4 text-sunset" />
            <span>{inviteCopied ? "Invite Link Copied" : "Invite Crew"}</span>
          </button>
          <button
            onClick={() => setShowRouteMap((v) => !v)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate border border-slate/10 rounded-full shadow-sm hover:bg-slate/5 transition-all text-xs font-bold"
          >
            <Compass className="w-4 h-4 text-ocean" />
            <span>{showRouteMap ? "Hide Map" : "Show Map"}</span>
          </button>
          <button
            onClick={() => setIsAdding(true)}
            title="Suggest an activity for the crew"
            className="flex items-center gap-2 px-5 py-2.5 bg-slate text-white rounded-full shadow-md hover:bg-slate/90 transition-all active:scale-95 group text-xs font-bold"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            <span>Suggest Activity</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-slate/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-serif font-bold text-slate">Suggest Activity</h3>
                  <button
                    onClick={() => setIsAdding(false)}
                    className="p-2 hover:bg-slate/5 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-slate/40" />
                  </button>
                </div>

                <form onSubmit={handleAddActivity} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate/40 ml-1">
                      Activity Name
                    </label>
                    <input
                      autoFocus
                      placeholder="e.g. Secret Sunset Spot at Pacifico"
                      className="w-full px-6 py-4 bg-slate/5 rounded-2xl border border-transparent focus:border-ocean/20 focus:bg-white transition-all outline-none text-slate font-medium"
                      value={newItem.title}
                      onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate/40 ml-1">
                        Location
                      </label>
                      <input
                        placeholder="Where on the island?"
                        className="w-full px-6 py-4 bg-slate/5 rounded-2xl border border-transparent focus:border-ocean/20 focus:bg-white transition-all outline-none text-slate font-medium"
                        value={newItem.location}
                        onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate/40 ml-1">
                        Time
                      </label>
                      <input
                        placeholder="05:30 PM"
                        className="w-full px-6 py-4 bg-slate/5 rounded-2xl border border-transparent focus:border-ocean/20 focus:bg-white transition-all outline-none text-slate font-medium"
                        value={newItem.time}
                        onChange={(e) => setNewItem({ ...newItem, time: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate/40 ml-1">
                      Category
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(["activity", "food", "nature", "photos"] as const).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setNewItem({ ...newItem, category: cat })}
                          className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                            newItem.category === cat
                              ? "bg-ocean text-white border-ocean shadow-lg shadow-ocean/20"
                              : "bg-slate/5 text-slate/40 border-transparent hover:border-slate/10"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-4 flex items-center justify-center gap-2 px-8 py-4 bg-slate text-white rounded-2xl font-bold hover:bg-ocean transition-all shadow-xl shadow-slate/10"
                  >
                    <Send className="w-5 h-5" />
                    Submit to Crew
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Loop & Split Kitty", val: "24 km · £41/pp est.", icon: Clock },
          { label: "Crew Attending", val: "8 Verified Kins", icon: Users },
          { label: "Completion", val: `${completionPercentage}%`, icon: CheckCircle2 },
        ].map((stat, i) => (
          <div
            key={i}
            className="p-6 bg-white/60 backdrop-blur-xl border border-slate/5 rounded-3xl shadow-sm flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate/5 flex items-center justify-center">
              <stat.icon
                className={`w-6 h-6 ${
                  stat.label === "Completion" && completionPercentage === 100
                    ? "text-green-500"
                    : "text-slate/60"
                }`}
              />
            </div>
            <div>
              <p className="text-xs font-bold text-slate/60 uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-bold text-slate">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Split-Pane Itinerary + Sticky Route Map */}
      <div className={showRouteMap ? "grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" : "space-y-6"}>
        {/* Left Column: Mindtrip-Style Collapsible Day Accordion + Single-Rail Vertical Timeline */}
        <div className={showRouteMap ? "lg:col-span-7 space-y-5" : "space-y-5"}>
          {/* Collapsible Day Header */}
          <button
            type="button"
            onClick={() => setIsDayExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 bg-white border border-slate/10 rounded-2xl shadow-sm hover:border-slate/20 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-slate text-white text-xs font-bold">
                Day 1
              </span>
              <div>
                <p className="text-sm font-bold text-slate">Siargao Island Loop</p>
                <p className="text-xs text-slate/60 font-medium">
                  {items.length} stops · 24 km · {pinnedIds.length} pinned
                </p>
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-slate/50 transition-transform duration-200 ${
                isDayExpanded ? "rotate-180" : ""
              }`}
            />
          </button>

          {isDayExpanded && (
            <div className="relative space-y-5">
              {/* Subtle left vertical guide rail */}
              <div className="absolute left-5 top-6 bottom-6 w-px bg-gradient-to-b from-ocean/30 via-sunset/30 to-transparent hidden sm:block" />

          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedStopId(item.id)}
              className="relative sm:pl-14 cursor-pointer"
            >
              {/* Stop Number Node on Left Rail */}
              <div
                className={`hidden sm:flex absolute left-1 top-6 z-10 w-8 h-8 rounded-full items-center justify-center text-xs font-black border-2 border-white shadow-md transition-colors ${
                  item.isDone
                    ? "bg-green-500 text-white"
                    : selectedStopId === item.id
                    ? "bg-sunset text-white ring-4 ring-sunset/20"
                    : "bg-slate text-white"
                }`}
              >
                {index + 1}
              </div>

              {/* Compact, Scannable Stop Card */}
              <div className={item.isDone ? "opacity-60 grayscale" : ""}>
                <div
                  className={`group relative p-6 bg-white border rounded-3xl shadow-sm hover:shadow-md transition-all overflow-hidden ${
                    selectedStopId === item.id ? "border-ocean/50 ring-2 ring-ocean/10" : "border-slate/10"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${getCategoryColor(item.category)}`}>
                        {getIcon(item.category)}
                      </div>
                      <p className="text-xs font-bold text-slate/70">{item.time}</p>
                      {item.splitCost && (
                        <span className="px-2.5 py-0.5 rounded-full bg-ocean/10 text-ocean text-[10px] font-black uppercase tracking-wider">
                          {item.splitCost}
                        </span>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getCategoryColor(
                        item.category
                      )}`}
                    >
                      Stop #{index + 1} · {item.category}
                    </span>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg md:text-xl font-sans tracking-tight font-bold text-slate mb-1 group-hover:text-ocean transition-colors">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-slate/60">
                      <MapPin className="w-3.5 h-3.5 text-sunset flex-shrink-0" />
                      <p className="text-sm font-medium">{item.location}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate/5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-sunset flex items-center justify-center text-[10px] font-bold text-white uppercase">
                        {item.suggestedBy[0]}
                      </div>
                      <p className="text-xs font-semibold text-slate/60">
                        Suggested by <span className="text-slate font-bold">{item.suggestedBy}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPinnedIds((prev) =>
                            prev.includes(item.id)
                              ? prev.filter((id) => id !== item.id)
                              : [...prev, item.id]
                          );
                        }}
                        title={pinnedIds.includes(item.id) ? "Unpin stop" : "Pin stop to itinerary"}
                        className={`p-1.5 rounded-xl transition-all cursor-pointer active:scale-90 ${
                          pinnedIds.includes(item.id)
                            ? "bg-sunset/10 text-sunset"
                            : "text-slate/30 hover:text-sunset hover:bg-slate/5"
                        }`}
                      >
                        <Pin className="w-4 h-4" />
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVote(item.id);
                        }}
                        className="flex items-center gap-1.5 text-slate/70 hover:text-ocean bg-slate/5 px-3 py-1.5 rounded-xl transition-all cursor-pointer group"
                        title="Upvote this activity"
                      >
                        <ThumbsUp className="w-4 h-4 group-hover:fill-ocean/20 transition-all" />
                        <span className="text-xs font-bold">{item.votes}</span>
                      </motion.button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDone(item.id);
                        }}
                        title={item.isDone ? "Mark as active" : "Mark as completed"}
                        className={`p-1.5 transition-all cursor-pointer active:scale-90 ${
                          item.isDone ? "text-green-600" : "text-slate/30 hover:text-green-600"
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
            </div>
          )}
        </div>

        {/* Right Column: Sticky Interactive Route Map & Active Waypoint */}
        {showRouteMap && (
          <aside className="lg:col-span-5 lg:sticky lg:top-28 self-start bg-slate text-white rounded-3xl p-5 shadow-xl border border-slate/10 space-y-5">
            <div className="relative h-64 rounded-2xl bg-gradient-to-br from-[#0F293A] via-[#133B52] to-[#1E293B] border border-white/10 overflow-hidden p-4">
              <svg className="absolute inset-0 w-full h-full opacity-80" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="kinRouteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0077B6" />
                    <stop offset="100%" stopColor="#FF8C42" />
                  </linearGradient>
                </defs>
                <path
                  d="M 10,80 Q 30,25 55,45 T 90,20"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="8"
                />
                <polyline
                  fill="none"
                  stroke="url(#kinRouteGrad)"
                  strokeWidth="1.4"
                  strokeDasharray="2.5 1.5"
                  points={items.map((item) => `${item.coords.x},${item.coords.y}`).join(" ")}
                />
              </svg>

              <div className="relative z-10 flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-sunset border border-white/10 whitespace-nowrap flex-shrink-0">
                  Live Route · {items.length} Stops
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 truncate">
                  General Luna → Malinao
                </span>
              </div>

              {items.map((item, idx) => {
                const isSelected = item.id === activeStop?.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedStopId(item.id)}
                    style={{ left: `${item.coords.x}%`, top: `${item.coords.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5 transition-all ${
                      isSelected ? "scale-110" : "opacity-80 hover:opacity-100"
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-lg border-2 border-white transition-colors ${
                        item.isDone
                          ? "bg-green-500 text-white"
                          : isSelected
                          ? "bg-sunset text-white ring-4 ring-sunset/30"
                          : "bg-ocean text-white"
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </button>
                );
              })}
            </div>

            {activeStop && (
              <div className="space-y-3 bg-white/5 rounded-2xl p-5 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sunset">
                    Selected Waypoint
                  </span>
                  <span className="text-[10px] font-bold text-white/60">
                    {activeStop.coords.lat} · {activeStop.coords.lng}
                  </span>
                </div>
                <h3 className="text-lg font-sans font-bold text-white leading-snug">
                  {activeStop.title}
                </h3>
                <p className="text-xs font-semibold text-white/75 flex items-center gap-2">
                  <Navigation className="w-3.5 h-3.5 text-ocean flex-shrink-0" />
                  {activeStop.location} · {activeStop.time}
                </p>
                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-white/65">
                    By <strong className="text-white">{activeStop.suggestedBy}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleVote(activeStop.id)}
                    className="px-4 py-2 rounded-xl bg-sunset text-white text-[10px] font-black uppercase tracking-wider hover:bg-sunset/90 transition-all"
                  >
                    Upvote ({activeStop.votes})
                  </button>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Suggested for Tomorrow Section */}
      {tomorrowVoteStatus !== "dismissed" && (
        <div className="pt-12 px-8 py-12 bg-sunset/5 rounded-[50px] border border-sunset/10 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 text-sunset font-black text-xs uppercase tracking-[0.2em]">
              <div className="w-4 h-0.5 bg-sunset" />
              Upvoting Now · {tomorrowVotes} Crew Votes
            </div>
            <h3 className="text-3xl font-serif font-bold text-slate">
              Ready for tomorrow&apos;s Sugba Lagoon &amp; Kawhagan Sandbar Loop?
            </h3>
            <p className="text-slate/60 leading-relaxed max-w-md">
              The crew is voting on a private outrigger charter departing Del Carmen at 07:30 AM. Cast your vote to reserve your spot on the boat.
            </p>
            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                disabled={tomorrowVoteStatus === "voted"}
                onClick={() => {
                  setTomorrowVoteStatus("voted");
                  setTomorrowVotes((v) => v + 1);
                }}
                className={`px-8 py-4 rounded-2xl font-bold shadow-xl transition-all ${
                  tomorrowVoteStatus === "voted"
                    ? "bg-green-600 text-white shadow-green-600/20"
                    : "bg-sunset text-white shadow-sunset/20 hover:scale-105 active:scale-95"
                }`}
              >
                {tomorrowVoteStatus === "voted" ? "Vote Confirmed · Spot Held" : "Cast Vote"}
              </button>
              <button
                type="button"
                onClick={() => setTomorrowVoteStatus("dismissed")}
                className="px-8 py-4 bg-white text-slate border border-slate/5 rounded-2xl font-bold shadow-sm hover:bg-slate/5 transition-all"
              >
                Skip Tomorrow
              </button>
            </div>
          </div>
          <div className="relative w-full md:w-64 h-64 bg-white/40 rounded-3xl overflow-hidden border border-slate/5">
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
              <Heart className="w-12 h-12 text-sunset animate-bounce" />
              <span className="text-[10px] font-black text-sunset uppercase tracking-widest">
                {tomorrowVotes} Kins In
              </span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-sunset/20 to-transparent" />
          </div>
        </div>
      )}
    </div>
  );
}
