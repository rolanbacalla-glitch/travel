"use client";

import React, { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  Users,
  Shield,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  Search,
  Calendar,
  Camera,
  Zap,
  Compass,
  User
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMessagesStore } from "@/lib/stores/useMessages";
import { useProfileStore } from "@/lib/stores/useProfile";

// Components
import { TravelCrewHub } from "@/components/dashboard/TravelCrewHub";
import { SafetyDashboard } from "@/components/safety/SafetyDashboard";
import { ItineraryView } from "@/components/dashboard/ItineraryView";
import { MemoriesView } from "@/components/dashboard/MemoriesView";
import { CommunityFeed } from "@/components/dashboard/CommunityFeed";
import MessagesView from "@/components/messages/MessagesView";
import { ProfileSettings } from "@/components/dashboard/ProfileSettings";
import { KINS, Kin } from "@/lib/data/kins";

/* ─────────────────────────────────────────────────────────── */
/* Types                                                         */
/* ─────────────────────────────────────────────────────────── */

// KINS imported from @/lib/data/kins

/* ─────────────────────────────────────────────────────────── */
/* Page                                                         */
/* ─────────────────────────────────────────────────────────── */

type DashboardView = "explore" | "plans" | "messages" | "safety" | "memories" | "profile";
type ExploreSubTab = "crew" | "pulse";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<DashboardView>("explore");
  const [exploreSubTab, setExploreSubTab] = useState<ExploreSubTab>("crew");
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const profile = useProfileStore();
  // Stores the conversation id to open when jumping from a Kin card → Messages
  const [openConvId, setOpenConvId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const store = useMessagesStore();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "hub" || tab === "explore") {
        setActiveTab("explore");
        setExploreSubTab("crew");
      } else if (tab === "pulse") {
        setActiveTab("explore");
        setExploreSubTab("pulse");
      } else if (tab === "itinerary" || tab === "plans") {
        setActiveTab("plans");
      } else if (tab === "messages" || tab === "safety" || tab === "memories" || tab === "profile") {
        setActiveTab(tab);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const providerPhoto = user.providerData?.find((p) => p?.photoURL)?.photoURL;
        const providerName = user.providerData?.find((p) => p?.displayName)?.displayName;
        useProfileStore.getState().updateProfile({
          name: user.displayName || providerName || user.email?.split("@")[0] || "Traveller",
          avatar: user.photoURL || providerPhoto || `https://api.dicebear.com/7.x/notionists/png?seed=${user.uid}`,
          username: user.email?.split("@")[0] || "wanderer",
        });

        // Check Admin Status
        if (user.email === "rolan.bacalla@gmail.com") {
          setIsAdmin(true);
        } else if (db && db.doc) {
          try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists() && userDoc.data()?.role === "admin") {
              setIsAdmin(true);
            }
          } catch (e) {
            console.error("Failed to check admin status", e);
          }
        }
      } else {
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleTabChange = (tab: DashboardView, subTab?: ExploreSubTab) => {
    setActiveTab(tab);
    setIsAccountMenuOpen(false);
    if (subTab) {
      setExploreSubTab(subTab);
    }
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab === "explore" && subTab === "pulse" ? "pulse" : tab);
      window.history.replaceState({}, "", url.toString());
    }
  };

  const goToChat = (kinId: string) => {
    store.setActiveId(kinId);
    handleTabChange("messages");
  };

  const handleSignOut = async () => {
    try {
      if (auth && typeof auth.signOut === "function") {
        await auth.signOut();
      } else if (auth) {
        const { signOut } = await import("firebase/auth");
        await signOut(auth);
      }
      if (typeof window !== "undefined") {
        if ((window as any).__setTravelKinMockUser) {
          (window as any).__setTravelKinMockUser(null);
        } else {
          localStorage.removeItem("travelkin-mock-user");
        }
        window.location.href = "/";
      }
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  };

  const totalUnread = 3;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row">

      {/* ── Desktop Sidebar (Mindtrip-inspired slim rail) ── */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate/10 flex-col p-6 space-y-8 fixed h-screen overflow-y-auto">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-serif font-bold text-slate tracking-tight">
            Travel <span className="text-sunset">Kin</span>
          </Link>
          <span className="px-2 py-0.5 rounded-full bg-slate/5 text-[10px] font-bold uppercase tracking-wider text-slate/60">
            SEA
          </span>
        </div>

        <nav className="flex-1 space-y-2" aria-label="Primary navigation">
          <SidebarItem
            active={activeTab === "explore"}
            onClick={() => handleTabChange("explore", exploreSubTab)}
            icon={Compass}
            label="Explore"
            badge={exploreSubTab === "pulse" ? "Live" : undefined}
          />
          <SidebarItem
            active={activeTab === "plans"}
            onClick={() => handleTabChange("plans")}
            icon={Calendar}
            label="Plans"
            badge="Vote!"
          />
          <SidebarItem
            active={activeTab === "messages"}
            onClick={() => { setOpenConvId(null); handleTabChange("messages"); }}
            icon={MessageSquare}
            label="Chat"
            badge={totalUnread > 0 ? String(totalUnread) : undefined}
          />
          <SidebarItem
            active={activeTab === "safety"}
            onClick={() => handleTabChange("safety")}
            icon={Shield}
            label="Safety"
          />
        </nav>

        <div className="pt-8 border-t border-slate/5 space-y-2">
          {isAdmin && (
            <Link
              href="/admin/destinations"
              className="w-full px-6 py-4 rounded-2xl flex items-center gap-4 font-bold text-sunset hover:bg-sunset/10 transition-all group"
            >
              <Settings className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm tracking-tight">Admin Portal</span>
            </Link>
          )}
          <SidebarItem
            active={activeTab === "memories"}
            onClick={() => handleTabChange("memories")}
            icon={Camera}
            label="Memory Vault"
            className={cn(activeTab === "memories" ? "bg-ocean text-white shadow-ocean/20" : "hover:text-ocean")}
          />
          <SidebarItem
            active={activeTab === "profile"}
            onClick={() => handleTabChange("profile")}
            icon={Settings}
            label="Settings"
          />
          <SidebarItem
            icon={LogOut}
            label="Log Out"
            className="text-red-400 hover:bg-red-50 hover:text-red-500"
            onClick={handleSignOut}
          />
        </div>
      </aside>

      {/* Sidebar Spacer for Fixed Aside */}
      <div className="hidden md:block w-64 flex-shrink-0" />

      {/* ── Main Content Area ── */}
      <main className="flex-1 min-h-screen">
        {/* Compact Mindtrip / Airbnb-inspired Header */}
        <header className="px-6 md:px-10 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/90 backdrop-blur-xl border-b border-slate/10 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-sans tracking-tight text-slate font-extrabold">
                Welcome back, {profile.name.split(" ")[0]}
              </h1>
              <p className="text-slate/60 text-xs font-medium">
                12 verified Kins nearby · Chiang Mai &amp; Siargao
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Segmented Pill Context Bar (Mindtrip / Airbnb pattern) */}
            <div className="hidden xl:flex items-center divide-x divide-slate/10 bg-[#F8F9FA] border border-slate/10 rounded-full px-2 py-1 text-xs font-semibold text-slate shadow-sm">
              <span className="px-3 py-1">Siargao</span>
              <span className="px-3 py-1 text-slate/70">Today</span>
              <span className="px-3 py-1 text-ocean font-bold">8 Kins</span>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate/50" />
              <input
                placeholder="Search travellers or spots..."
                className="py-2.5 pl-10 pr-4 w-52 md:w-64 bg-[#F8F9FA] border border-slate/10 rounded-full text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-ocean/20 transition-all"
              />
            </div>
            <button
              aria-label="Notifications"
              className="p-2.5 bg-white border border-slate/10 rounded-full shadow-sm hover:bg-slate/5 transition-all"
            >
              <Bell className="w-4 h-4 text-slate/60" />
            </button>
            <div className="relative">
              <button
                onClick={() => setIsAccountMenuOpen((prev) => !prev)}
                aria-label="Account menu"
                aria-expanded={isAccountMenuOpen}
                className={cn(
                  "w-12 h-12 relative rounded-2xl overflow-hidden border transition-all active:scale-95 shadow-sm flex-shrink-0",
                  activeTab === "profile" || activeTab === "memories" || isAccountMenuOpen
                    ? "border-sunset ring-2 ring-sunset/20"
                    : "border-slate/5 hover:border-slate/20"
                )}
              >
                <Image
                  src={profile.avatar}
                  alt="Profile"
                  fill
                  sizes="48px"
                  referrerPolicy="no-referrer"
                  unoptimized
                  className="object-cover"
                />
              </button>

              <AnimatePresence>
                {isAccountMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate/10 p-2 z-40"
                  >
                    <div className="px-3 py-2 border-b border-slate/5 mb-1">
                      <p className="text-sm font-bold text-slate truncate">{profile.name}</p>
                      <p className="text-xs text-slate/50 truncate">@{profile.username}</p>
                    </div>
                    <button
                      onClick={() => handleTabChange("memories")}
                      className={cn(
                        "w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-sm font-semibold transition-colors",
                        activeTab === "memories" ? "bg-ocean/10 text-ocean" : "text-slate/70 hover:bg-slate/5 hover:text-slate"
                      )}
                    >
                      <Camera className="w-4 h-4" />
                      Memory Vault
                    </button>
                    <button
                      onClick={() => handleTabChange("profile")}
                      className={cn(
                        "w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-sm font-semibold transition-colors",
                        activeTab === "profile" ? "bg-sunset/10 text-sunset" : "text-slate/70 hover:bg-slate/5 hover:text-slate"
                      )}
                    >
                      <User className="w-4 h-4" />
                      Profile &amp; Settings
                    </button>
                    <div className="h-px bg-slate/5 my-1" />
                    <button
                      onClick={handleSignOut}
                      className="w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="p-6 md:p-12">
          <AnimatePresence mode="wait">
            {activeTab === "explore" && (
              <motion.div
                key="explore"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.25 }}
                className="space-y-8"
              >
                {/* Sub-navigation for Explore: Crew Hub vs Pulse Feed */}
                <div className="inline-flex items-center p-1.5 bg-white border border-slate/10 rounded-2xl shadow-sm">
                  <button
                    onClick={() => handleTabChange("explore", "crew")}
                    className={cn(
                      "px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all",
                      exploreSubTab === "crew"
                        ? "bg-slate text-white shadow-md"
                        : "text-slate/60 hover:text-slate"
                    )}
                  >
                    <Users className="w-4 h-4" />
                    Crew Hub
                  </button>
                  <button
                    onClick={() => handleTabChange("explore", "pulse")}
                    className={cn(
                      "px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all",
                      exploreSubTab === "pulse"
                        ? "bg-slate text-white shadow-md"
                        : "text-slate/60 hover:text-slate"
                    )}
                  >
                    <Zap className="w-4 h-4" />
                    Pulse Feed
                    <span className="px-1.5 py-0.5 bg-sunset text-white text-[10px] rounded-md font-black">Live</span>
                  </button>
                </div>

                {exploreSubTab === "crew" ? (
                  <TravelCrewHub kins={KINS} onChat={goToChat} />
                ) : (
                  <CommunityFeed />
                )}
              </motion.div>
            )}

            {activeTab === "plans" && (
              <motion.div
                key="plans"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <ItineraryView />
              </motion.div>
            )}

            {activeTab === "safety" && (
              <motion.div
                key="safety"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <SafetyDashboard />
              </motion.div>
            )}

            {activeTab === "messages" && (
              <motion.div
                key="messages"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <MessagesView onVerify={() => handleTabChange("safety")} />
              </motion.div>
            )}

            {activeTab === "memories" && (
              <motion.div
                key="memories"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <MemoriesView />
              </motion.div>
            )}

            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <ProfileSettings />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ── Mobile Navigation (4 Core Tabs) ── */}
      <nav aria-label="Mobile navigation" className="md:hidden sticky bottom-0 left-0 right-0 h-20 bg-white border-t border-slate/5 flex items-center justify-around px-4 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <MobileNavItem active={activeTab === "explore"} onClick={() => handleTabChange("explore", exploreSubTab)} icon={Compass} label="Explore" />
        <MobileNavItem active={activeTab === "plans"} onClick={() => handleTabChange("plans")} icon={Calendar} label="Plans" />
        <MobileNavItem active={activeTab === "messages"} onClick={() => { setOpenConvId(null); handleTabChange("messages"); }} icon={MessageSquare} label="Chat" badge={totalUnread} />
        <MobileNavItem active={activeTab === "safety"} onClick={() => handleTabChange("safety")} icon={Shield} label="Safety" />
      </nav>
    </div>
  );
}

/* ── UI COMPONENTS ── */

function SidebarItem({ icon: Icon, label, active, onClick, className, badge }: {
  icon: React.ElementType; label: string; active?: boolean;
  onClick?: () => void; className?: string; badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full px-6 py-4 rounded-2xl flex items-center justify-between gap-4 font-bold transition-all group",
        active ? "bg-slate text-white shadow-xl shadow-slate/20" : "text-slate/60 hover:bg-slate/5 hover:text-slate",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <Icon className={cn("w-5 h-5", active ? "text-sunset" : "group-hover:text-sunset transition-colors")} />
        <span className="text-sm tracking-tight">{label}</span>
      </div>
      {badge && (
        <span className="px-2 py-0.5 bg-sunset text-white text-[10px] rounded-lg font-black">{badge}</span>
      )}
    </button>
  );
}

function MobileNavItem({ icon: Icon, label, active, onClick, badge }: {
  icon: React.ElementType; label: string; active?: boolean; onClick?: () => void; badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all relative",
        active ? "text-sunset" : "text-slate/50"
      )}
    >
      <div className="relative">
        <Icon className="w-6 h-6" />
        {badge && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-sunset text-white text-[9px] font-black flex items-center justify-center">
            {badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}
