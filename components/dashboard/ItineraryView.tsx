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
  X,
  Send,
  Compass,
  Navigation,
  ChevronDown,
  Pin,
  UserPlus,
  Pencil,
  Trash2,
  ChevronRight,
  ShieldCheck,
  Lock,
  Anchor,
  Info,
  Check
} from "lucide-react";
import Link from "next/link";
import { UserTier, getTierPermissions } from "@/lib/access";

export interface ItineraryItem {
  id: string;
  title: string;
  location: string;
  meetingPoint?: string;
  duration?: string;
  description?: string;
  whatToBring?: string[];
  attendees?: string[];
  notes?: string;
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
    title: "Early Morning Surf & Breakfast Bowls",
    location: "Cloud 9 Boardwalk, Siargao",
    meetingPoint: "Main entrance steps beside the surfboard racks",
    duration: "2 hrs",
    description:
      "Catch gentle morning waves with local surf instructors, then grab fresh smoothie bowls and coffee right next to the boardwalk.",
    whatToBring: ["Swimwear", "Reef-safe sunscreen", "Towel", "Small cash for board rental"],
    attendees: ["Suki", "Nara", "Liam", "Mia"],
    notes: "Beginner-friendly boards available to rent on site (£5/hr).",
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
    title: "Group Lunch & Local Seafood Tasting",
    location: "General Luna Coastal Market",
    meetingPoint: "Covered seating area by Stall #4",
    duration: "1.5 hrs",
    description:
      "Meet the group for a relaxed seaside lunch featuring fresh Filipino kinilaw (citrus-cured fish), grilled squid, and tropical fruit shakes.",
    whatToBring: ["Cash (PHP)", "Reusable water bottle"],
    attendees: ["Nara", "Suki", "Liam", "Kevin", "Mia"],
    notes: "Vegetarian grilled eggplant & mango salad options available.",
    hub: "Siargao",
    time: "12:30 PM",
    category: "food",
    suggestedBy: "Nara",
    votes: 16,
    isDone: false,
    splitCost: "£9 / person",
    coords: { x: 64, y: 58, lat: "9.7892° N", lng: "126.1558° E" },
  },
  {
    id: "3",
    title: "Sunset Palm River Swing & Photos",
    location: "Maasin River, Siargao",
    meetingPoint: "Red bridge scooter parking area",
    duration: "2 hrs",
    description:
      "Ride scooters north to the iconic bent coconut palm over the emerald river. Swim, try the rope swing, and take golden-hour group photos.",
    whatToBring: ["Dry bag", "Water shoes or sandals", "Camera / phone strap"],
    attendees: ["Liam", "Suki", "Nara"],
    notes: "Shared tricycle option available if you prefer not to ride a scooter.",
    hub: "Siargao",
    time: "04:00 PM",
    category: "photos",
    suggestedBy: "Liam",
    votes: 15,
    isDone: false,
    splitCost: "£7 / person",
    coords: { x: 35, y: 44, lat: "9.8390° N", lng: "126.0945° E" },
  },
  {
    id: "4",
    title: "Beach Bonfire & Shared Group Dinner",
    location: "Malinao Beach",
    meetingPoint: "Palm grove firepit near the quiet end of the bay",
    duration: "2.5 hrs",
    description:
      "Wind down by the sea with a traditional Filipino boodle-fight dinner served on banana leaves, acoustic guitar, and easy conversation.",
    whatToBring: ["Light jumper / wrap", "Mosquito repellent"],
    attendees: ["Kevin", "Suki", "Nara", "Liam", "Mia"],
    notes: "Cost includes shared main dishes, rice, and fresh coconut drinks.",
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

const TOMORROW_TRIP = {
  title: "Sugba Lagoon & Kawhagan Sandbar Boat Trip",
  dateLabel: "Tomorrow · 07:30 AM – 04:30 PM",
  departure: "Del Carmen Pier, Siargao",
  costPerPerson: "£24 / person",
  costIncludes: "Private outrigger boat, environmental lagoon fee, snorkel gear, and fresh lunch",
  safetyNote: "Licensed Coast Guard-registered boat with life vests and live GPS check-in.",
  schedule: [
    { time: "07:30 AM", label: "Meet at Del Carmen Pier & board private boat" },
    { time: "08:15 AM", label: "Sugba Lagoon — swimming, paddleboarding & wooden diving deck" },
    { time: "11:30 AM", label: "Kawhagan Sandbar — turquoise shallow water & group beach lunch" },
    { time: "02:30 PM", label: "Pamomoan Beach — calm coral reef snorkelling" },
    { time: "04:30 PM", label: "Return to Del Carmen Pier & shared van back to General Luna" },
  ],
  whatToPack: ["Swimwear & quick-dry towel", "Dry bag for phone", "Reef-safe sunscreen", "1.5L drinking water", "Small PHP cash"],
  crewNames: ["Elena", "Suki", "Liam", "Nara", "Marco", "Mia"],
};

const STORAGE_KEY = "travelkin-itinerary-v3";
const VOTES_STORAGE_KEY = "travelkin-itinerary-votes-v1";

export function ItineraryView({ tier = "verified" }: { tier?: UserTier }) {
  const perms = getTierPermissions(tier);

  const [items, setItems] = useState<ItineraryItem[]>(SAMPLE_ITEMS);
  const [votedIds, setVotedIds] = useState<string[]>([]);
  const [selectedStopId, setSelectedStopId] = useState<string>("2");
  const [detailStopId, setDetailStopId] = useState<string | null>(null);
  const [isEditingDetail, setIsEditingDetail] = useState<boolean>(false);
  const [editDraft, setEditDraft] = useState<ItineraryItem | null>(null);

  const [showRouteMap, setShowRouteMap] = useState<boolean>(true);
  const [isDayExpanded, setIsDayExpanded] = useState<boolean>(true);
  const [pinnedIds, setPinnedIds] = useState<string[]>(["2"]);
  const [inviteCopied, setInviteCopied] = useState<boolean>(false);

  const [tomorrowVoteStatus, setTomorrowVoteStatus] = useState<"none" | "voted" | "dismissed">("none");
  const [tomorrowVotes, setTomorrowVotes] = useState<number>(19);
  const [showTomorrowModal, setShowTomorrowModal] = useState<boolean>(false);

  const [isAdding, setIsAdding] = useState(false);
  const [tierNotice, setTierNotice] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    title: "",
    location: "",
    meetingPoint: "",
    time: "",
    duration: "1.5 hrs",
    splitCost: "£10 / person",
    description: "",
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
      const savedVotes = localStorage.getItem(VOTES_STORAGE_KEY);
      if (savedVotes) {
        const parsedVotes = JSON.parse(savedVotes);
        if (Array.isArray(parsedVotes)) {
          setVotedIds(parsedVotes);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const showNotice = (msg: string) => {
    setTierNotice(msg);
    setTimeout(() => setTierNotice(null), 3500);
  };

  const persistItems = (updated: ItineraryItem[]) => {
    setItems(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  };

  const persistVotedIds = (updatedVotes: string[]) => {
    setVotedIds(updatedVotes);
    try {
      localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(updatedVotes));
    } catch {
      // Ignore storage errors
    }
  };

  const toggleVote = (id: string) => {
    if (!perms.canUpvote) {
      showNotice("Sign in for free to vote on group trip ideas.");
      return;
    }
    const alreadyVoted = votedIds.includes(id);
    const nextVotedIds = alreadyVoted
      ? votedIds.filter((vId) => vId !== id)
      : [...votedIds, id];

    persistVotedIds(nextVotedIds);
    persistItems(
      items.map((item) =>
        item.id === id
          ? { ...item, votes: Math.max(0, item.votes + (alreadyVoted ? -1 : 1)) }
          : item
      )
    );
  };

  const toggleDone = (id: string) => {
    if (!perms.canEditItinerary) {
      showNotice(
        tier === "guest"
          ? "Sign up and verify your ID to update shared group plans."
          : "Verify your ID to mark or edit shared group stops."
      );
      return;
    }
    persistItems(
      items.map((item) =>
        item.id === id ? { ...item, isDone: !item.isDone } : item
      )
    );
  };

  const openStopDetail = (item: ItineraryItem, startInEdit = false) => {
    setSelectedStopId(item.id);
    setDetailStopId(item.id);
    if (startInEdit && perms.canEditItinerary) {
      setEditDraft({ ...item });
      setIsEditingDetail(true);
    } else {
      setEditDraft(null);
      setIsEditingDetail(false);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDraft || !perms.canEditItinerary) return;
    const updated = items.map((item) => (item.id === editDraft.id ? editDraft : item));
    persistItems(updated);
    setIsEditingDetail(false);
    setEditDraft(null);
  };

  const handleDeleteStop = (id: string) => {
    if (!perms.canEditItinerary) return;
    const updated = items.filter((item) => item.id !== id);
    persistItems(updated);
    setDetailStopId(null);
    setIsEditingDetail(false);
    if (selectedStopId === id && updated.length > 0) {
      setSelectedStopId(updated[0].id);
    }
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!perms.canEditItinerary) {
      showNotice("Only Verified Kins can add new stops to shared group plans.");
      return;
    }
    if (!newItem.title || !newItem.location || !newItem.time) return;

    const activity: ItineraryItem = {
      id: Math.random().toString(36).slice(2, 9),
      title: newItem.title,
      location: newItem.location,
      meetingPoint: newItem.meetingPoint || newItem.location,
      duration: newItem.duration || "1.5 hrs",
      splitCost: newItem.splitCost || "£10 / person",
      description:
        newItem.description ||
        "Group stop added to today's Siargao plan. Tap Edit to add meeting notes or packing tips.",
      whatToBring: ["Water", "Small cash"],
      attendees: ["Mia"],
      time: newItem.time,
      category: newItem.category,
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
    persistVotedIds([...votedIds, activity.id]);
    setSelectedStopId(activity.id);
    setIsAdding(false);
    setNewItem({
      title: "",
      location: "",
      meetingPoint: "",
      time: "",
      duration: "1.5 hrs",
      splitCost: "£10 / person",
      description: "",
      category: "activity",
    });
  };

  const getIcon = (cat: string) => {
    switch (cat) {
      case "food":
        return <Utensils className="w-4 h-4" strokeWidth={1.75} />;
      case "activity":
        return <Clock className="w-4 h-4" strokeWidth={1.75} />;
      case "nature":
        return <Palmtree className="w-4 h-4" strokeWidth={1.75} />;
      case "photos":
        return <Camera className="w-4 h-4" strokeWidth={1.75} />;
      default:
        return <MapPin className="w-4 h-4" strokeWidth={1.75} />;
    }
  };

  const completedCount = items.filter((i) => i.isDone).length;
  const completionPercentage = Math.round((completedCount / items.length) * 100) || 0;
  const activeStop = items.find((i) => i.id === selectedStopId) || items[0];
  const detailStop = items.find((i) => i.id === detailStopId) || null;
  const detailStopIndex = detailStop ? items.findIndex((i) => i.id === detailStop.id) : -1;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 relative">
      {/* Subtle Tier Notice Toast */}
      <AnimatePresence>
        {tierNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[70] px-5 py-3 bg-slate text-white rounded-xl shadow-xl text-xs sm:text-sm font-semibold flex items-center gap-3 border border-white/10"
          >
            <Lock className="w-4 h-4 text-sunset shrink-0" />
            <span>{tierNotice}</span>
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
            <Calendar className="w-3.5 h-3.5" strokeWidth={1.75} />
            Shared Day Plan
          </div>
          <h2 className="text-3xl md:text-4xl text-slate font-bold">Today in Siargao</h2>
          <p className="text-slate/65 font-medium text-sm sm:text-base">
            Click any stop to view full details, meeting points, or edit the plan with your group.
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
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate border border-slate/15 rounded-full hover:bg-slate/5 transition-all text-xs font-bold"
          >
            <UserPlus className="w-4 h-4 text-slate/70" strokeWidth={1.75} />
            <span>{inviteCopied ? "Link Copied" : "Share Plan"}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowRouteMap((v) => !v)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate border border-slate/15 rounded-full hover:bg-slate/5 transition-all text-xs font-bold"
          >
            <Compass className="w-4 h-4 text-slate/70" strokeWidth={1.75} />
            <span>{showRouteMap ? "Hide Map" : "Show Map"}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (!perms.canEditItinerary) {
                showNotice(
                  tier === "guest"
                    ? "Sign up and verify your ID to add stops to shared group plans."
                    : "Verify your ID to add or edit shared group stops."
                );
                return;
              }
              setIsAdding(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-sunset text-white rounded-full shadow-sm hover:bg-sunset-dark transition-all active:scale-95 text-xs font-bold"
          >
            {perms.canEditItinerary ? (
              <Plus className="w-4 h-4" strokeWidth={2} />
            ) : (
              <Lock className="w-3.5 h-3.5" strokeWidth={2} />
            )}
            <span>Add Stop</span>
          </button>
        </div>
      </div>

      {/* Add Activity Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-slate/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate/10"
            >
              <div className="p-7 space-y-5 max-h-[88vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate">Add a Stop</h3>
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    aria-label="Close modal"
                    className="p-2 hover:bg-slate/5 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-slate/70" />
                  </button>
                </div>

                <form onSubmit={handleAddActivity} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate/65 ml-1">
                      Stop Name
                    </label>
                    <input
                      autoFocus
                      required
                      placeholder="e.g. Sunset Swim at Pacifico Beach"
                      className="w-full px-4 py-3 bg-[#F9F8F6] rounded-xl border border-slate/10 focus:border-slate/30 focus:bg-white transition-all outline-none text-slate text-sm font-medium"
                      value={newItem.title}
                      onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate/65 ml-1">
                        Place
                      </label>
                      <input
                        required
                        placeholder="Area or beach name"
                        className="w-full px-4 py-3 bg-[#F9F8F6] rounded-xl border border-slate/10 focus:border-slate/30 focus:bg-white transition-all outline-none text-slate text-sm font-medium"
                        value={newItem.location}
                        onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate/65 ml-1">
                        Time
                      </label>
                      <input
                        required
                        placeholder="05:30 PM"
                        className="w-full px-4 py-3 bg-[#F9F8F6] rounded-xl border border-slate/10 focus:border-slate/30 focus:bg-white transition-all outline-none text-slate text-sm font-medium"
                        value={newItem.time}
                        onChange={(e) => setNewItem({ ...newItem, time: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate/65 ml-1">
                        Est. Cost
                      </label>
                      <input
                        placeholder="£10 / person"
                        className="w-full px-4 py-3 bg-[#F9F8F6] rounded-xl border border-slate/10 focus:border-slate/30 focus:bg-white transition-all outline-none text-slate text-sm font-medium"
                        value={newItem.splitCost}
                        onChange={(e) => setNewItem({ ...newItem, splitCost: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate/65 ml-1">
                        Duration
                      </label>
                      <input
                        placeholder="1.5 hrs"
                        className="w-full px-4 py-3 bg-[#F9F8F6] rounded-xl border border-slate/10 focus:border-slate/30 focus:bg-white transition-all outline-none text-slate text-sm font-medium"
                        value={newItem.duration}
                        onChange={(e) => setNewItem({ ...newItem, duration: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate/65 ml-1">
                      Details &amp; Meeting Notes
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Where should everyone meet and what should they bring?"
                      className="w-full px-4 py-3 bg-[#F9F8F6] rounded-xl border border-slate/10 focus:border-slate/30 focus:bg-white transition-all outline-none text-slate text-sm font-medium resize-none"
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate/65 ml-1">
                      Category
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(["activity", "food", "nature", "photos"] as const).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setNewItem({ ...newItem, category: cat })}
                          className={`py-2.5 rounded-xl text-xs font-bold capitalize border transition-all ${
                            newItem.category === cat
                              ? "bg-slate text-white border-slate"
                              : "bg-[#F9F8F6] text-slate/70 border-slate/10 hover:border-slate/25"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 flex items-center justify-center gap-2 px-6 py-3.5 bg-sunset text-white rounded-xl font-bold hover:bg-sunset-dark transition-all text-sm"
                  >
                    <Send className="w-4 h-4" />
                    Add to Today&apos;s Plan
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stop Details & Edit Modal */}
      <AnimatePresence>
        {detailStop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setDetailStopId(null);
                setIsEditingDetail(false);
                setEditDraft(null);
              }}
              className="absolute inset-0 bg-slate/45 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate/10 overflow-hidden max-h-[88vh] flex flex-col"
            >
              {/* Modal Top Bar */}
              <div className="px-7 py-5 border-b border-slate/10 flex items-center justify-between gap-4 bg-[#F9F8F6]">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-slate text-white text-xs font-bold flex items-center justify-center">
                    {detailStopIndex + 1}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate/70">
                    Stop #{detailStopIndex + 1} · {detailStop.category}
                  </span>
                  {detailStop.isDone && (
                    <span className="px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs font-bold">
                      Done
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {!isEditingDetail && perms.canEditItinerary && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditDraft({ ...detailStop });
                        setIsEditingDetail(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-slate/15 text-xs font-bold text-slate hover:bg-slate/5 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setDetailStopId(null);
                      setIsEditingDetail(false);
                      setEditDraft(null);
                    }}
                    aria-label="Close stop details"
                    className="p-2 hover:bg-slate/10 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-slate/70" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-7 overflow-y-auto space-y-6">
                {isEditingDetail && editDraft ? (
                  <form onSubmit={handleSaveEdit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate/65">Stop Name</label>
                      <input
                        required
                        value={editDraft.title}
                        onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
                        className="w-full px-4 py-3 bg-[#F9F8F6] border border-slate/15 rounded-xl text-sm font-medium text-slate focus:bg-white outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate/65">Location</label>
                        <input
                          required
                          value={editDraft.location}
                          onChange={(e) => setEditDraft({ ...editDraft, location: e.target.value })}
                          className="w-full px-4 py-3 bg-[#F9F8F6] border border-slate/15 rounded-xl text-sm font-medium text-slate focus:bg-white outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate/65">Meeting Point</label>
                        <input
                          value={editDraft.meetingPoint || ""}
                          onChange={(e) => setEditDraft({ ...editDraft, meetingPoint: e.target.value })}
                          className="w-full px-4 py-3 bg-[#F9F8F6] border border-slate/15 rounded-xl text-sm font-medium text-slate focus:bg-white outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate/65">Time</label>
                        <input
                          required
                          value={editDraft.time}
                          onChange={(e) => setEditDraft({ ...editDraft, time: e.target.value })}
                          className="w-full px-3.5 py-3 bg-[#F9F8F6] border border-slate/15 rounded-xl text-sm font-medium text-slate focus:bg-white outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate/65">Duration</label>
                        <input
                          value={editDraft.duration || ""}
                          onChange={(e) => setEditDraft({ ...editDraft, duration: e.target.value })}
                          className="w-full px-3.5 py-3 bg-[#F9F8F6] border border-slate/15 rounded-xl text-sm font-medium text-slate focus:bg-white outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate/65">Est. Cost</label>
                        <input
                          value={editDraft.splitCost || ""}
                          onChange={(e) => setEditDraft({ ...editDraft, splitCost: e.target.value })}
                          className="w-full px-3.5 py-3 bg-[#F9F8F6] border border-slate/15 rounded-xl text-sm font-medium text-slate focus:bg-white outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate/65">Description</label>
                      <textarea
                        rows={3}
                        value={editDraft.description || ""}
                        onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
                        className="w-full px-4 py-3 bg-[#F9F8F6] border border-slate/15 rounded-xl text-sm font-medium text-slate focus:bg-white outline-none resize-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate/65">Group Notes</label>
                      <input
                        value={editDraft.notes || ""}
                        onChange={(e) => setEditDraft({ ...editDraft, notes: e.target.value })}
                        className="w-full px-4 py-3 bg-[#F9F8F6] border border-slate/15 rounded-xl text-sm font-medium text-slate focus:bg-white outline-none"
                      />
                    </div>

                    <div className="pt-4 border-t border-slate/10 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => handleDeleteStop(editDraft.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Stop
                      </button>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingDetail(false);
                            setEditDraft(null);
                          }}
                          className="px-4 py-2.5 rounded-xl border border-slate/15 text-xs font-bold text-slate/75 hover:bg-slate/5"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2.5 rounded-xl bg-sunset text-white text-xs font-bold hover:bg-sunset-dark transition-colors"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <>
                    <div>
                      <h3 className="text-2xl font-bold text-slate mb-2">{detailStop.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate/70">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-slate/60" />
                          {detailStop.time}{detailStop.duration ? ` · ${detailStop.duration}` : ""}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-slate/60" />
                          {detailStop.location}
                        </span>
                        {detailStop.splitCost && (
                          <span className="px-2.5 py-0.5 rounded-full bg-slate/5 border border-slate/10 text-slate font-bold">
                            {detailStop.splitCost}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-slate/80 leading-relaxed font-medium">
                      {detailStop.description || "Shared group stop along today's island route."}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-[#F9F8F6] border border-slate/10 space-y-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate/55">Meeting Point</p>
                        <p className="text-sm font-semibold text-slate">
                          {detailStop.meetingPoint || detailStop.location}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#F9F8F6] border border-slate/10 space-y-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate/55">Map Coordinates</p>
                        <p className="text-sm font-semibold text-slate tabular-nums">
                          {detailStop.coords.lat} · {detailStop.coords.lng}
                        </p>
                      </div>
                    </div>

                    {detailStop.whatToBring && detailStop.whatToBring.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate/60">What to Bring</p>
                        <div className="flex flex-wrap gap-2">
                          {detailStop.whatToBring.map((gear) => (
                            <span
                              key={gear}
                              className="px-3 py-1.5 rounded-lg bg-slate/5 text-slate/80 text-xs font-semibold border border-slate/10"
                            >
                              {gear}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {detailStop.attendees && detailStop.attendees.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate/60">
                          Going ({detailStop.attendees.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {detailStop.attendees.map((person) => (
                            <span
                              key={person}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate/15 text-xs font-semibold text-slate"
                            >
                              <span className="w-5 h-5 rounded-full bg-slate/10 text-slate text-xs font-bold flex items-center justify-center">
                                {person[0]}
                              </span>
                              {person}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {detailStop.notes && (
                      <div className="p-4 rounded-xl bg-white border border-slate/10 flex items-start gap-3">
                        <Info className="w-4 h-4 text-slate/60 shrink-0 mt-0.5" />
                        <p className="text-xs text-slate/75 font-medium leading-relaxed">{detailStop.notes}</p>
                      </div>
                    )}

                    {!perms.canEditItinerary && (
                      <div className="p-4 rounded-xl bg-[#F9F8F6] border border-slate/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 text-xs font-medium text-slate/75">
                          <Lock className="w-4 h-4 text-slate/60 shrink-0" />
                          <span>
                            {tier === "guest"
                              ? "Sign up and verify your ID to edit shared group stops."
                              : "Verify your ID to edit or add stops on shared group plans."}
                          </span>
                        </div>
                        <Link
                          href={tier === "guest" ? "/onboarding" : "/verify"}
                          className="px-4 py-2 rounded-lg bg-sunset text-white text-xs font-bold hover:bg-sunset-dark transition-colors shrink-0 text-center"
                        >
                          {tier === "guest" ? "Join Free" : "Verify ID"}
                        </Link>
                      </div>
                    )}

                    <div className="pt-4 border-t border-slate/10 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs font-medium text-slate/65">
                        Suggested by <strong className="text-slate">{detailStop.suggestedBy}</strong>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleVote(detailStop.id)}
                          aria-pressed={votedIds.includes(detailStop.id)}
                          title={
                            votedIds.includes(detailStop.id)
                              ? "Click to remove your vote"
                              : "Vote for this stop"
                          }
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors border ${
                            votedIds.includes(detailStop.id)
                              ? "bg-sunset/10 text-sunset border-sunset/25 hover:bg-sunset/15"
                              : "bg-slate/5 hover:bg-slate/10 text-slate border-transparent"
                          }`}
                        >
                          <ThumbsUp
                            className={`w-3.5 h-3.5 ${
                              votedIds.includes(detailStop.id) ? "fill-current" : ""
                            }`}
                          />
                          {votedIds.includes(detailStop.id) ? "Voted" : "Vote"} ({detailStop.votes})
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleDone(detailStop.id)}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                            detailStop.isDone
                              ? "bg-green-600 text-white"
                              : "bg-white border border-slate/15 text-slate hover:bg-slate/5"
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {detailStop.isDone ? "Completed" : "Mark Done"}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tomorrow's Boat Trip Details Modal */}
      <AnimatePresence>
        {showTomorrowModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTomorrowModal(false)}
              className="absolute inset-0 bg-slate/45 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate/10 overflow-hidden max-h-[88vh] flex flex-col"
            >
              <div className="px-7 py-5 border-b border-slate/10 bg-[#F9F8F6] flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <Anchor className="w-4 h-4 text-slate" strokeWidth={1.75} />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate/75">
                    Tomorrow&apos;s Group Boat Trip · {tomorrowVotes} Going
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTomorrowModal(false)}
                  aria-label="Close trip details"
                  className="p-2 hover:bg-slate/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate/70" />
                </button>
              </div>

              <div className="p-7 overflow-y-auto space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate mb-1.5">{TOMORROW_TRIP.title}</h3>
                  <p className="text-sm font-medium text-slate/65">
                    {TOMORROW_TRIP.dateLabel} · Departs {TOMORROW_TRIP.departure}
                  </p>
                </div>

                {/* Cost & Safety Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#F9F8F6] border border-slate/10 space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate/55">Shared Cost</p>
                    <p className="text-lg font-extrabold text-slate">{TOMORROW_TRIP.costPerPerson}</p>
                    <p className="text-xs text-slate/65 font-medium">{TOMORROW_TRIP.costIncludes}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F9F8F6] border border-slate/10 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-green-700">
                      <ShieldCheck className="w-4 h-4" />
                      Safety Checked
                    </div>
                    <p className="text-xs text-slate/75 font-medium leading-relaxed pt-1">
                      {TOMORROW_TRIP.safetyNote}
                    </p>
                  </div>
                </div>

                {/* Full Schedule */}
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate/60">Day Timetable</p>
                  <div className="space-y-2.5">
                    {TOMORROW_TRIP.schedule.map((step) => (
                      <div
                        key={step.time}
                        className="flex items-start gap-4 p-3.5 rounded-xl bg-white border border-slate/10"
                      >
                        <span className="text-xs font-bold text-slate tabular-nums whitespace-nowrap pt-0.5 min-w-[68px]">
                          {step.time}
                        </span>
                        <span className="text-sm font-medium text-slate/80">{step.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* What to Pack */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate/60">What to Pack</p>
                  <div className="flex flex-wrap gap-2">
                    {TOMORROW_TRIP.whatToPack.map((item) => (
                      <span
                        key={item}
                        className="px-3 py-1.5 rounded-lg bg-slate/5 border border-slate/10 text-xs font-semibold text-slate/80"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Who's Going */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate/60">
                    Travellers Joining ({tomorrowVotes})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TOMORROW_TRIP.crewNames.map((name) => (
                      <span
                        key={name}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate/15 text-xs font-semibold text-slate"
                      >
                        <span className="w-5 h-5 rounded-full bg-slate/10 text-slate text-xs font-bold flex items-center justify-center">
                          {name[0]}
                        </span>
                        {name}
                      </span>
                    ))}
                    <span className="px-3 py-1 rounded-full bg-slate/5 text-xs font-semibold text-slate/65">
                      +{tomorrowVotes - TOMORROW_TRIP.crewNames.length} more
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-slate/10 flex flex-wrap items-center justify-between gap-3">
                  {!perms.canJoinTripSplits ? (
                    <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#F9F8F6] border border-slate/10">
                      <span className="text-xs font-medium text-slate/75 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-slate/60 shrink-0" />
                        {tier === "guest"
                          ? "Sign up and verify your ID to reserve a seat on shared boat trips."
                          : "Verify your ID to book a seat on shared boat trips."}
                      </span>
                      <Link
                        href={tier === "guest" ? "/onboarding" : "/verify"}
                        className="px-5 py-2.5 rounded-xl bg-sunset text-white text-xs font-bold hover:bg-sunset-dark transition-colors text-center shrink-0"
                      >
                        {tier === "guest" ? "Join Free" : "Verify ID"}
                      </Link>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setTomorrowVoteStatus("dismissed");
                          setShowTomorrowModal(false);
                        }}
                        className="px-5 py-3 rounded-xl border border-slate/15 text-slate/75 hover:bg-slate/5 text-xs font-bold"
                      >
                        Skip Tomorrow
                      </button>
                      <button
                        type="button"
                        disabled={tomorrowVoteStatus === "voted"}
                        onClick={() => {
                          setTomorrowVoteStatus("voted");
                          setTomorrowVotes((v) => v + 1);
                        }}
                        className={`px-7 py-3 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 ${
                          tomorrowVoteStatus === "voted"
                            ? "bg-green-600 text-white"
                            : "bg-sunset text-white hover:bg-sunset-dark"
                        }`}
                      >
                        {tomorrowVoteStatus === "voted" ? (
                          <>
                            <Check className="w-4 h-4" />
                            Spot Reserved
                          </>
                        ) : (
                          "Vote & Reserve Boat Spot"
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Progress Stats (Clean Monochrome Icons) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: "Distance & Est. Cost", val: "24 km · £41 / person", icon: Clock },
          { label: "Group Size", val: "8 Verified Travellers", icon: Users },
          { label: "Day Progress", val: `${completionPercentage}% Done`, icon: CheckCircle2 },
        ].map((stat, i) => (
          <div
            key={i}
            className="p-5 bg-white border border-slate/10 rounded-2xl shadow-sm flex items-center gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-slate/5 flex items-center justify-center shrink-0">
              <stat.icon
                strokeWidth={1.75}
                className={`w-5 h-5 ${
                  stat.label === "Day Progress" && completionPercentage === 100
                    ? "text-green-600"
                    : "text-slate/75"
                }`}
              />
            </div>
            <div>
              <p className="text-xs font-bold text-slate/60 uppercase tracking-wider">{stat.label}</p>
              <p className="text-lg font-bold text-slate tabular-nums">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Split-Pane Itinerary + Light-Theme Sticky Route Map */}
      <div className={showRouteMap ? "grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" : "space-y-5"}>
        {/* Left Column: Day Accordion + Stop Cards */}
        <div className={showRouteMap ? "lg:col-span-7 space-y-5" : "space-y-5"}>
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
                <p className="text-sm font-bold text-slate">Siargao Island Day Plan</p>
                <p className="text-xs text-slate/60 font-medium">
                  {items.length} stops · 24 km · {pinnedIds.length} pinned
                </p>
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-slate/70 transition-transform duration-200 ${
                isDayExpanded ? "rotate-180" : ""
              }`}
            />
          </button>

          {isDayExpanded && (
            <div className="relative space-y-4">
              {/* Subtle vertical rail */}
              <div className="absolute left-5 top-6 bottom-6 w-px bg-slate/15 hidden sm:block" />

              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => openStopDetail(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openStopDetail(item);
                    }
                  }}
                  className="relative sm:pl-14 cursor-pointer focus:outline-none"
                >
                  {/* Stop Number Node on Left Rail */}
                  <div
                    className={`hidden sm:flex absolute left-1 top-6 z-10 w-8 h-8 rounded-full items-center justify-center text-xs font-bold border-2 border-white shadow-sm transition-colors ${
                      item.isDone
                        ? "bg-green-600 text-white"
                        : selectedStopId === item.id
                        ? "bg-sunset text-white ring-4 ring-sunset/15"
                        : "bg-slate text-white"
                    }`}
                  >
                    {index + 1}
                  </div>

                  {/* Stop Card */}
                  <div className={item.isDone ? "opacity-75" : ""}>
                    <div
                      className={`group relative p-6 bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all ${
                        selectedStopId === item.id
                          ? "border-slate/35 ring-1 ring-slate/10"
                          : "border-slate/10 hover:border-slate/25"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-slate/5 text-slate/75">
                            {getIcon(item.category)}
                          </div>
                          <p className="text-xs font-bold text-slate/75 tabular-nums">{item.time}</p>
                          {item.splitCost && (
                            <span className="px-2.5 py-0.5 rounded-full bg-slate/5 border border-slate/10 text-slate/75 text-xs font-bold">
                              {item.splitCost}
                            </span>
                          )}
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-slate/5 text-slate/70 text-xs font-bold capitalize">
                          Stop #{index + 1} · {item.category}
                        </span>
                      </div>

                      <div className="mb-4">
                        <h3 className="text-lg font-sans tracking-tight font-bold text-slate mb-1 group-hover:text-sunset transition-colors">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-1.5 text-slate/65">
                          <MapPin className="w-3.5 h-3.5 text-slate/50 flex-shrink-0" />
                          <p className="text-sm font-medium">{item.location}</p>
                        </div>
                      </div>

                      <div className="pt-3.5 border-t border-slate/10 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate/10 flex items-center justify-center text-xs font-bold text-slate uppercase">
                            {item.suggestedBy[0]}
                          </div>
                          <p className="text-xs font-medium text-slate/65">
                            By <span className="text-slate font-bold">{item.suggestedBy}</span>
                          </p>
                          <span className="text-slate/25">·</span>
                          <span className="text-xs font-semibold text-slate/70 group-hover:text-sunset inline-flex items-center gap-0.5 transition-colors">
                            View{perms.canEditItinerary ? " & Edit" : " Details"}
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
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
                            title={pinnedIds.includes(item.id) ? "Unpin stop" : "Pin stop"}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              pinnedIds.includes(item.id)
                                ? "bg-sunset/10 text-sunset"
                                : "text-slate/60 hover:text-slate hover:bg-slate/5"
                            }`}
                          >
                            <Pin className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleVote(item.id);
                            }}
                            aria-pressed={votedIds.includes(item.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                              votedIds.includes(item.id)
                                ? "text-sunset bg-sunset/10 hover:bg-sunset/15"
                                : "text-slate/75 hover:text-slate bg-slate/5 hover:bg-slate/10"
                            }`}
                            title={
                              votedIds.includes(item.id)
                                ? "Voted — click to unvote"
                                : "Vote for this stop"
                            }
                          >
                            <ThumbsUp
                              className={`w-3.5 h-3.5 ${
                                votedIds.includes(item.id) ? "fill-current" : ""
                              }`}
                            />
                            <span className="text-xs font-bold tabular-nums">{item.votes}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDone(item.id);
                            }}
                            title={item.isDone ? "Mark as upcoming" : "Mark as done"}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              item.isDone ? "text-green-600 bg-green-50" : "text-slate/55 hover:text-green-600 hover:bg-slate/5"
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
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

        {/* Right Column: Light-Theme Sticky Route Map Card */}
        {showRouteMap && (
          <aside className="lg:col-span-5 lg:sticky lg:top-28 self-start bg-white text-slate rounded-2xl p-5 shadow-sm border border-slate/10 space-y-4">
            <div className="relative h-64 rounded-xl bg-gradient-to-br from-[#F3F6F8] via-[#EDF2F5] to-[#F8F6F2] border border-slate/10 overflow-hidden p-4">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="kinRouteGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1E2D35" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#E0712A" stopOpacity="0.85" />
                  </linearGradient>
                </defs>
                {/* Soft map contour curve */}
                <path
                  d="M 10,80 Q 30,25 55,45 T 90,20"
                  fill="none"
                  stroke="rgba(30,45,53,0.06)"
                  strokeWidth="9"
                />
                <polyline
                  fill="none"
                  stroke="url(#kinRouteGradLight)"
                  strokeWidth="1.5"
                  strokeDasharray="2.5 1.5"
                  points={items.map((item) => `${item.coords.x},${item.coords.y}`).join(" ")}
                />
              </svg>

              <div className="relative z-10 flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 rounded-full bg-white/95 text-xs font-bold text-slate border border-slate/10 shadow-sm whitespace-nowrap flex-shrink-0">
                  Route Map · {items.length} Stops
                </span>
                <span className="text-xs font-semibold text-slate/65 truncate">
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
                    aria-label={`Select stop ${idx + 1}: ${item.title}`}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 transition-all ${
                      isSelected ? "scale-110" : "opacity-85 hover:opacity-100"
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-md border-2 border-white transition-colors ${
                        item.isDone
                          ? "bg-green-600 text-white"
                          : isSelected
                          ? "bg-sunset text-white ring-4 ring-sunset/20"
                          : "bg-slate text-white"
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </button>
                );
              })}
            </div>

            {activeStop && (
              <div className="space-y-3 bg-[#F9F8F6] rounded-xl p-5 border border-slate/10">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate/60">
                    Selected Stop
                  </span>
                  <span className="text-xs font-medium text-slate/55 tabular-nums">
                    {activeStop.coords.lat} · {activeStop.coords.lng}
                  </span>
                </div>
                <h3 className="text-base font-sans font-bold text-slate leading-snug">
                  {activeStop.title}
                </h3>
                <p className="text-xs font-medium text-slate/70 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-slate/55 flex-shrink-0" />
                  {activeStop.location} · {activeStop.time}
                </p>
                <div className="pt-3 border-t border-slate/10 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openStopDetail(activeStop)}
                    className="px-3.5 py-2 rounded-lg bg-white border border-slate/15 text-slate text-xs font-bold hover:bg-slate/5 transition-colors inline-flex items-center gap-1"
                  >
                    {perms.canEditItinerary ? "Open & Edit" : "View Details"}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleVote(activeStop.id)}
                    aria-pressed={votedIds.includes(activeStop.id)}
                    title={
                      votedIds.includes(activeStop.id)
                        ? "Click to remove your vote"
                        : "Vote for this stop"
                    }
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                      votedIds.includes(activeStop.id)
                        ? "bg-sunset/10 text-sunset border-sunset/25 hover:bg-sunset/15"
                        : "bg-sunset text-white border-transparent hover:bg-sunset-dark"
                    }`}
                  >
                    <ThumbsUp
                      className={`w-3.5 h-3.5 ${
                        votedIds.includes(activeStop.id) ? "fill-current" : ""
                      }`}
                    />
                    {votedIds.includes(activeStop.id) ? "Voted" : "Vote"} ({activeStop.votes})
                  </button>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Tomorrow's Group Boat Trip Banner (Now Fully Openable for More Info) */}
      {tomorrowVoteStatus !== "dismissed" && (
        <div
          onClick={() => setShowTomorrowModal(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setShowTomorrowModal(true);
            }
          }}
          className="p-8 md:p-10 bg-white rounded-2xl border border-slate/10 shadow-sm hover:border-slate/25 hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-8 cursor-pointer group"
        >
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 text-slate/65 font-bold text-xs uppercase tracking-wider">
              <Anchor className="w-3.5 h-3.5 text-sunset" />
              Tomorrow&apos;s Boat Trip · {tomorrowVotes} Travellers Going
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-slate group-hover:text-sunset transition-colors">
              Ready for tomorrow&apos;s Sugba Lagoon &amp; Kawhagan Sandbar Boat Trip?
            </h3>
            <p className="text-sm text-slate/65 leading-relaxed max-w-xl font-medium">
              Private boat leaving Del Carmen Pier at 07:30 AM (£24 / person including lunch &amp; lagoon fee). Click anywhere on this card to view the full timetable, safety details, and packing list.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTomorrowModal(true);
                }}
                className="px-5 py-3 bg-slate text-white rounded-xl text-xs font-bold hover:bg-slate/90 transition-all inline-flex items-center gap-1.5"
              >
                View Full Details
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={tomorrowVoteStatus === "voted"}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!perms.canJoinTripSplits) {
                    showNotice(
                      tier === "guest"
                        ? "Sign up and verify your ID to reserve a boat seat."
                        : "Verify your ID to join shared boat trips."
                    );
                    return;
                  }
                  setTomorrowVoteStatus("voted");
                  setTomorrowVotes((v) => v + 1);
                }}
                className={`px-6 py-3 rounded-xl text-xs font-bold transition-all ${
                  tomorrowVoteStatus === "voted"
                    ? "bg-green-600 text-white"
                    : "bg-sunset text-white hover:bg-sunset-dark"
                }`}
              >
                {tomorrowVoteStatus === "voted" ? "Spot Reserved" : "Vote & Join"}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setTomorrowVoteStatus("dismissed");
                }}
                className="px-5 py-3 bg-[#F9F8F6] text-slate/75 border border-slate/10 rounded-xl text-xs font-bold hover:bg-slate/5 transition-all"
              >
                Skip Tomorrow
              </button>
            </div>
          </div>

          <div className="w-full md:w-52 p-6 bg-[#F9F8F6] rounded-2xl border border-slate/10 flex flex-col items-center justify-center text-center gap-2 shrink-0">
            <span className="text-3xl font-extrabold text-slate tabular-nums">{tomorrowVotes}</span>
            <span className="text-xs font-bold text-slate/65 uppercase tracking-wider">Travellers Going</span>
            <span className="text-xs font-semibold text-sunset inline-flex items-center gap-1 mt-1">
              Open Timetable <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
