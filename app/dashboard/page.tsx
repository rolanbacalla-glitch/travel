"use client";

import React, { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  Users,
  ShieldCheck,
  MessageSquare,
  Bell,
  SlidersHorizontal,
  LogOut,
  LogIn,
  UserPlus,
  Search,
  Calendar,
  Camera,
  Zap,
  Compass,
  User,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMessagesStore } from "@/lib/stores/useMessages";
import { useProfileStore } from "@/lib/stores/useProfile";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { UserTier, getTierPermissions } from "@/lib/access";

// Components
import { TravelCrewHub } from "@/components/dashboard/TravelCrewHub";
import { SafetyDashboard } from "@/components/safety/SafetyDashboard";
import { ItineraryView } from "@/components/dashboard/ItineraryView";
import { MemoriesView } from "@/components/dashboard/MemoriesView";
import { CommunityFeed } from "@/components/dashboard/CommunityFeed";
import MessagesView from "@/components/messages/MessagesView";
import { ProfileSettings } from "@/components/dashboard/ProfileSettings";
import { KINS } from "@/lib/data/kins";

type DashboardView = "explore" | "plans" | "messages" | "safety" | "memories" | "profile";
type ExploreSubTab = "crew" | "pulse";

export default function DashboardPage() {
  const { user } = useAuthContext();
  const isGuestAccount = !user;

  // For guests exploring the portfolio/demo, allow switching between Guest, Member, and Verified Kin
  const [previewTier, setPreviewTier] = useState<UserTier>("guest");
  const [activeTab, setActiveTab] = useState<DashboardView>("explore");
  const [exploreSubTab, setExploreSubTab] = useState<ExploreSubTab>("crew");
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const profile = useProfileStore();
  const [isAdmin, setIsAdmin] = useState(false);

  const store = useMessagesStore();

  const effectiveTier: UserTier = isGuestAccount
    ? previewTier
    : profile.isVerified
    ? "verified"
    : "member";

  const tierInfo = getTierPermissions(effectiveTier);

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

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        const providerPhoto = authUser.providerData?.find((p) => p?.photoURL)?.photoURL;
        const providerName = authUser.providerData?.find((p) => p?.displayName)?.displayName;
        useProfileStore.getState().updateProfile({
          name: authUser.displayName || providerName || authUser.email?.split("@")[0] || "Traveller",
          avatar: authUser.photoURL || providerPhoto || `https://api.dicebear.com/7.x/notionists/png?seed=${authUser.uid}`,
          username: authUser.email?.split("@")[0] || "wanderer",
        });

        if (authUser.email === "rolan.bacalla@gmail.com") {
          setIsAdmin(true);
        } else if (db && db.doc) {
          try {
            const userDoc = await getDoc(doc(db, "users", authUser.uid));
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
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate/10 flex-col p-6 space-y-8 fixed h-screen overflow-y-auto">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-slate tracking-tight">
            Travel <span className="text-sunset">Kin</span>
          </Link>
          <span className="px-2 py-0.5 rounded-full bg-slate/5 text-xs font-bold uppercase tracking-wider text-slate/65">
            SEA
          </span>
        </div>

        <nav className="flex-1 space-y-1.5" aria-label="Primary navigation">
          <SidebarItem
            active={activeTab === "explore"}
            onClick={() => handleTabChange("explore", exploreSubTab)}
            icon={Compass}
            label="Explore"
          />
          <SidebarItem
            active={activeTab === "plans"}
            onClick={() => handleTabChange("plans")}
            icon={Calendar}
            label="Day Plan"
          />
          <SidebarItem
            active={activeTab === "messages"}
            onClick={() => handleTabChange("messages")}
            icon={MessageSquare}
            label="Messages"
            badge={totalUnread > 0 ? String(totalUnread) : undefined}
          />
          <SidebarItem
            active={activeTab === "safety"}
            onClick={() => handleTabChange("safety")}
            icon={ShieldCheck}
            label="Safety"
          />
        </nav>

        <div className="pt-6 border-t border-slate/10 space-y-1.5">
          {isAdmin && (
            <Link
              href="/admin/destinations"
              className="w-full px-4 py-3 rounded-xl flex items-center gap-3 font-bold text-slate hover:bg-slate/5 transition-all"
            >
              <SlidersHorizontal className="w-5 h-5 text-slate/70" strokeWidth={1.75} />
              <span className="text-sm tracking-tight">Admin Portal</span>
            </Link>
          )}
          <SidebarItem
            active={activeTab === "memories"}
            onClick={() => handleTabChange("memories")}
            icon={Camera}
            label="Trip Photos"
          />
          <SidebarItem
            active={activeTab === "profile"}
            onClick={() => handleTabChange("profile")}
            icon={SlidersHorizontal}
            label="Settings"
          />

          {isGuestAccount ? (
            <div className="pt-3 space-y-2">
              <Link
                href="/onboarding"
                className="w-full px-4 py-3 rounded-xl bg-sunset text-white flex items-center justify-center gap-2 text-sm font-bold shadow-sm hover:bg-sunset-dark transition-all"
              >
                <UserPlus className="w-4 h-4" strokeWidth={2} />
                <span>Join Free</span>
              </Link>
              <Link
                href="/login"
                className="w-full px-4 py-2.5 rounded-xl border border-slate/15 text-slate flex items-center justify-center gap-2 text-sm font-semibold hover:bg-slate/5 transition-all"
              >
                <LogIn className="w-4 h-4" strokeWidth={1.75} />
                <span>Sign In</span>
              </Link>
            </div>
          ) : (
            <SidebarItem
              icon={LogOut}
              label="Log Out"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleSignOut}
            />
          )}
        </div>
      </aside>

      {/* Sidebar Spacer */}
      <div className="hidden md:block w-64 flex-shrink-0" />

      {/* ── Main Content Area ── */}
      <main className="flex-1 min-h-screen">
        {/* Guest Preview & Access Tier Bar (Light, Clean, Interactive for Demo) */}
        {isGuestAccount ? (
          <div className="bg-white text-slate px-6 md:px-10 py-3 border-b border-slate/10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate/75">
                <span className="font-bold text-slate">Preview Access Level:</span>
                <div className="inline-flex items-center p-0.5 bg-slate/5 border border-slate/10 rounded-lg">
                  {(
                    [
                      { id: "guest", label: "Guest" },
                      { id: "member", label: "Standard Member" },
                      { id: "verified", label: "Verified Kin" },
                    ] as const
                  ).map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setPreviewTier(role.id)}
                      className={cn(
                        "px-3 py-1 rounded-md text-xs font-bold transition-all",
                        previewTier === role.id
                          ? "bg-slate text-white shadow-sm"
                          : "text-slate/70 hover:text-slate"
                      )}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
                <span className="hidden xl:inline text-slate/60">
                  {previewTier === "guest" && "Browse freely. Sign up to message or vote."}
                  {previewTier === "member" && "Can chat & vote. Verify ID for boat splits, editing & SOS."}
                  {previewTier === "verified" && "Full Verified Kin access unlocked."}
                </span>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded-lg border border-slate/15 text-xs font-semibold text-slate hover:bg-slate/5 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/onboarding"
                  className="px-4 py-1.5 rounded-lg bg-sunset text-white text-xs font-bold hover:bg-sunset-dark transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Join Free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          effectiveTier === "member" && (
            <div className="bg-amber-50 text-amber-950 px-6 md:px-10 py-2.5 border-b border-amber-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    <strong>Standard Member:</strong> Verify your ID to unlock group plan editing, shared boat splits, exact meet-up pins, and emergency SOS alerts.
                  </span>
                </div>
                <Link
                  href="/verify"
                  className="px-3.5 py-1.5 rounded-lg bg-sunset text-white text-xs font-bold hover:bg-sunset-dark transition-colors shrink-0 w-fit"
                >
                  Verify ID Now
                </Link>
              </div>
            </div>
          )
        )}

        {/* Header */}
        <header className="px-6 md:px-10 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/95 backdrop-blur-md border-b border-slate/10 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl md:text-2xl font-sans tracking-tight text-slate font-extrabold">
                  {effectiveTier === "guest" ? "Explore Travel Kin" : `Welcome back, ${profile.name.split(" ")[0]}`}
                </h1>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border",
                    effectiveTier === "verified"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : effectiveTier === "member"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-slate/5 text-slate/70 border-slate/10"
                  )}
                >
                  {effectiveTier === "verified" && <ShieldCheck className="w-3.5 h-3.5" />}
                  {tierInfo.label}
                </span>
              </div>
              <p className="text-slate/65 text-xs font-medium">
                12 ID-verified travellers nearby · Siargao &amp; El Nido
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="hidden lg:flex items-center divide-x divide-slate/10 bg-[#F8F9FA] border border-slate/10 rounded-full px-2 py-1 text-xs font-semibold text-slate">
              <span className="px-3 py-1">Siargao</span>
              <span className="px-3 py-1 text-slate/65">Today</span>
              <span className="px-3 py-1 text-slate font-bold tabular-nums">8 Travellers</span>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate/60" />
              <input
                placeholder="Search travellers or places..."
                className="py-2 pl-10 pr-4 w-52 md:w-60 bg-[#F8F9FA] border border-slate/10 rounded-full text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate/15 transition-all"
              />
            </div>

            <button
              aria-label="Notifications"
              className="p-2.5 bg-white border border-slate/10 rounded-full hover:bg-slate/5 transition-all"
            >
              <Bell className="w-4 h-4 text-slate/70" />
            </button>

            <div className="relative">
              <button
                onClick={() => setIsAccountMenuOpen((prev) => !prev)}
                aria-label="Account menu"
                aria-expanded={isAccountMenuOpen}
                className={cn(
                  "w-10 h-10 relative rounded-xl overflow-hidden border transition-all flex-shrink-0",
                  activeTab === "profile" || activeTab === "memories" || isAccountMenuOpen
                    ? "border-sunset ring-2 ring-sunset/20"
                    : "border-slate/15 hover:border-slate/30"
                )}
              >
                <Image
                  src={profile.avatar}
                  alt="Profile"
                  fill
                  sizes="40px"
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
                    <div className="px-3 py-2 border-b border-slate/10 mb-1">
                      <p className="text-sm font-bold text-slate truncate">
                        {effectiveTier === "guest" ? "Guest Explorer" : profile.name}
                      </p>
                      <p className="text-xs text-slate/65 truncate">
                        {tierInfo.label}
                      </p>
                    </div>
                    <button
                      onClick={() => handleTabChange("memories")}
                      className={cn(
                        "w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-sm font-semibold transition-colors",
                        activeTab === "memories" ? "bg-slate/5 text-slate" : "text-slate/70 hover:bg-slate/5 hover:text-slate"
                      )}
                    >
                      <Camera className="w-4 h-4" strokeWidth={1.75} />
                      Trip Photos
                    </button>
                    <button
                      onClick={() => handleTabChange("profile")}
                      className={cn(
                        "w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-sm font-semibold transition-colors",
                        activeTab === "profile" ? "bg-slate/5 text-slate" : "text-slate/70 hover:bg-slate/5 hover:text-slate"
                      )}
                    >
                      <User className="w-4 h-4" strokeWidth={1.75} />
                      Profile &amp; Settings
                    </button>
                    <div className="h-px bg-slate/10 my-1" />
                    {isGuestAccount ? (
                      <div className="space-y-1">
                        <Link
                          href="/onboarding"
                          className="w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-sm font-bold text-sunset hover:bg-sunset/10 transition-colors"
                        >
                          <UserPlus className="w-4 h-4" strokeWidth={1.75} />
                          Join Free
                        </Link>
                        <Link
                          href="/login"
                          className="w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-sm font-semibold text-slate hover:bg-slate/5 transition-colors"
                        >
                          <LogIn className="w-4 h-4" strokeWidth={1.75} />
                          Sign In
                        </Link>
                      </div>
                    ) : (
                      <button
                        onClick={handleSignOut}
                        className="w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" strokeWidth={1.75} />
                        Log Out
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="p-6 md:p-10">
          <AnimatePresence mode="wait">
            {activeTab === "explore" && (
              <motion.div
                key="explore"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* Sub-navigation */}
                <div className="inline-flex items-center p-1 bg-white border border-slate/10 rounded-xl shadow-sm">
                  <button
                    type="button"
                    onClick={() => handleTabChange("explore", "crew")}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all",
                      exploreSubTab === "crew"
                        ? "bg-slate text-white"
                        : "text-slate/65 hover:text-slate"
                    )}
                  >
                    <Users className="w-4 h-4" strokeWidth={1.75} />
                    Travellers
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange("explore", "pulse")}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all",
                      exploreSubTab === "pulse"
                        ? "bg-slate text-white"
                        : "text-slate/65 hover:text-slate"
                    )}
                  >
                    <Zap className="w-4 h-4" strokeWidth={1.75} />
                    Group Board
                  </button>
                </div>

                {exploreSubTab === "crew" ? (
                  <TravelCrewHub kins={KINS} onChat={goToChat} tier={effectiveTier} />
                ) : (
                  <CommunityFeed tier={effectiveTier} />
                )}
              </motion.div>
            )}

            {activeTab === "plans" && (
              <motion.div
                key="plans"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ItineraryView tier={effectiveTier} />
              </motion.div>
            )}

            {activeTab === "safety" && (
              <motion.div
                key="safety"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <SafetyDashboard tier={effectiveTier} />
              </motion.div>
            )}

            {activeTab === "messages" && (
              <motion.div
                key="messages"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessagesView onVerify={() => handleTabChange("safety")} tier={effectiveTier} />
              </motion.div>
            )}

            {activeTab === "memories" && (
              <motion.div
                key="memories"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MemoriesView tier={effectiveTier} />
              </motion.div>
            )}

            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ProfileSettings tier={effectiveTier} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ── Mobile Navigation ── */}
      <nav aria-label="Mobile navigation" className="md:hidden sticky bottom-0 left-0 right-0 h-20 bg-white border-t border-slate/10 flex items-center justify-around px-4 z-30">
        <MobileNavItem active={activeTab === "explore"} onClick={() => handleTabChange("explore", exploreSubTab)} icon={Compass} label="Explore" />
        <MobileNavItem active={activeTab === "plans"} onClick={() => handleTabChange("plans")} icon={Calendar} label="Day Plan" />
        <MobileNavItem active={activeTab === "messages"} onClick={() => handleTabChange("messages")} icon={MessageSquare} label="Messages" badge={totalUnread} />
        <MobileNavItem active={activeTab === "safety"} onClick={() => handleTabChange("safety")} icon={ShieldCheck} label="Safety" />
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
      type="button"
      onClick={onClick}
      className={cn(
        "w-full px-4 py-3 rounded-xl flex items-center justify-between gap-3 font-bold transition-all group",
        active ? "bg-slate text-white shadow-sm" : "text-slate/70 hover:bg-slate/5 hover:text-slate",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className={cn("w-5 h-5", active ? "text-white" : "text-slate/65 group-hover:text-slate")} strokeWidth={1.75} />
        <span className="text-sm tracking-tight">{label}</span>
      </div>
      {badge && (
        <span className={cn(
          "px-2 py-0.5 text-xs rounded-md font-bold tabular-nums",
          active ? "bg-white/20 text-white" : "bg-slate/10 text-slate"
        )}>
          {badge}
        </span>
      )}
    </button>
  );
}

function MobileNavItem({ icon: Icon, label, active, onClick, badge }: {
  icon: React.ElementType; label: string; active?: boolean; onClick?: () => void; badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 p-2 rounded-xl transition-all relative",
        active ? "text-sunset" : "text-slate/65"
      )}
    >
      <div className="relative">
        <Icon className="w-5 h-5" strokeWidth={1.75} />
        {badge && (
          <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-sunset text-white text-xs font-bold tabular-nums flex items-center justify-center">
            {badge}
          </span>
        )}
      </div>
      <span className="text-xs font-bold">{label}</span>
    </button>
  );
}
