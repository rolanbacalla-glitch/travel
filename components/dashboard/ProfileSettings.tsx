"use client";

import React, { useState, useEffect } from "react";
import {
  Camera,
  Check,
  Save,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Coffee,
  Zap,
  Backpack,
  Leaf,
  Laptop,
  Lock
} from "lucide-react";
import { TH, VN, ID, PH } from "country-flag-icons/react/3x2";
import { useProfileStore } from "@/lib/stores/useProfile";
import { useMessagesStore } from "@/lib/stores/useMessages";
import { logFirebaseEvent } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { UserTier, getTierPermissions } from "@/lib/access";

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=100&w=1600",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=100&w=1600",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=100&w=1600",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=100&w=1600",
];

const STYLES_LIST = [
  { id: "slow", label: "Slow Traveller", icon: Coffee },
  { id: "fast", label: "Active Explorer", icon: Zap },
  { id: "budget", label: "Budget Friendly", icon: Backpack },
  { id: "luxury", label: "Comfort & Stays", icon: Sparkles },
  { id: "eco", label: "Nature Lover", icon: Leaf },
  { id: "remote", label: "Remote Worker", icon: Laptop },
];

const VIBES_LIST = [
  "Quiet & Relaxed",
  "Social & Outgoing",
  "Night Owl",
  "Early Riser",
  "Food Lover",
  "History & Culture",
  "Adventure Sports",
  "Wellness & Yoga",
  "Photography",
  "Local Markets"
];

const DESTINATIONS_LIST = [
  { name: "Thailand", Flag: TH },
  { name: "Vietnam", Flag: VN },
  { name: "Indonesia", Flag: ID },
  { name: "Philippines", Flag: PH }
];

export function ProfileSettings({ tier = "verified" }: { tier?: UserTier }) {
  const profile = useProfileStore();
  const perms = getTierPermissions(tier);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [styles, setStyles] = useState<string[]>([]);
  const [vibes, setVibes] = useState<string[]>([]);
  const [destinations, setDestinations] = useState<string[]>([]);

  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!perms.canEditProfile) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setAvatar(reader.result);
          setShowAvatarSelector(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const isIdentityChanged = perms.canEditProfile && (name !== profile.name || avatar !== profile.avatar);

  useEffect(() => {
    setName(profile.name);
    setUsername(profile.username);
    setBio(profile.bio);
    setAvatar(profile.avatar);
    setStyles(profile.styles);
    setVibes(profile.vibes);
    setDestinations(profile.destinations);
  }, [profile]);

  const toggleStyle = (styleId: string) => {
    if (!perms.canEditProfile) return;
    setStyles(prev =>
      prev.includes(styleId)
        ? prev.filter(id => id !== styleId)
        : [...prev, styleId]
    );
  };

  const toggleVibe = (vibeName: string) => {
    if (!perms.canEditProfile) return;
    setVibes(prev =>
      prev.includes(vibeName)
        ? prev.filter(v => v !== vibeName)
        : [...prev, vibeName]
    );
  };

  const toggleDestination = (destName: string) => {
    if (!perms.canEditProfile) return;
    setDestinations(prev =>
      prev.includes(destName)
        ? prev.filter(d => d !== destName)
        : [...prev, destName]
    );
  };

  const handleSave = () => {
    if (!perms.canEditProfile) {
      setToastMessage("Create a free account to save your profile.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const identityModified = name !== profile.name || avatar !== profile.avatar;

    profile.updateProfile({
      name,
      username,
      bio,
      avatar,
      styles,
      vibes,
      destinations,
      isVerified: identityModified ? false : profile.isVerified
    });

    if (identityModified) {
      useMessagesStore.getState().setVerified(false);
    }

    logFirebaseEvent("profile_update_success", {
      styles_count: styles.length,
      vibes_count: vibes.length,
      destinations_count: destinations.length,
      verification_revoked: identityModified
    });

    setToastMessage(identityModified ? "Profile saved. Please check your ID again." : "Profile saved.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleReset = () => {
    if (!perms.canEditProfile) return;
    profile.resetProfile();
    logFirebaseEvent("profile_reset");
    setToastMessage("Profile reset to defaults.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const isVerifiedAccount = tier === "verified";

  return (
    <div className="space-y-10 max-w-4xl mx-auto pb-24 relative">
      {/* ── Toast Notification ── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 bg-slate text-white rounded-xl shadow-xl text-sm font-semibold flex items-center gap-3 border border-white/10"
          >
            <span className="w-2 h-2 rounded-full bg-green-400" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guest Read-Only Callout */}
      {tier === "guest" && (
        <div className="p-5 bg-white border border-slate/15 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-slate/5 text-slate shrink-0">
              <Lock className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate">Previewing Sample Profile</p>
              <p className="text-xs text-slate/65 font-medium mt-0.5">
                Sign up for free to create your own profile, choose countries, and verify your ID.
              </p>
            </div>
          </div>
          <Link
            href="/onboarding"
            className="px-5 py-2.5 bg-sunset text-white text-xs font-bold rounded-full hover:bg-sunset-dark transition-colors shrink-0 text-center"
          >
            Create Free Account
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate/60">Your Profile</p>
          <h2 className="text-3xl text-slate font-bold">Profile Settings</h2>
          <p className="text-sm text-slate/65 font-medium">
            Update your intro and travel preferences so nearby travellers can get to know you.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!perms.canEditProfile}
            onClick={handleReset}
            className="flex items-center gap-2 px-5 py-3 bg-white text-slate/70 hover:text-slate border border-slate/10 rounded-xl font-bold text-xs shadow-sm transition-all hover:bg-slate/5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" strokeWidth={1.75} />
            Reset
          </button>
          <button
            type="button"
            disabled={!perms.canEditProfile}
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-sunset text-white rounded-xl font-bold text-xs shadow-md shadow-sunset/20 hover:bg-sunset-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" strokeWidth={1.75} />
            Save Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Side: Avatar & Verification Status */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white border border-slate/10 rounded-2xl p-7 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-slate/10">
              <Image
                src={avatar || AVATAR_PRESETS[0]}
                alt="Avatar"
                fill
                sizes="128px"
                referrerPolicy="no-referrer"
                unoptimized
                className="object-cover"
              />
              {perms.canEditProfile && (
                <button
                  type="button"
                  onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                  className="absolute inset-0 bg-black/45 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Change profile photo"
                >
                  <Camera className="w-6 h-6" />
                </button>
              )}
            </div>

            <div className="mt-4 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <h3 className="text-lg font-bold text-slate">{tier === "guest" ? "Guest Explorer" : (name || "Mia Reyes")}</h3>
                {isVerifiedAccount && <ShieldCheck className="w-4 h-4 text-green-600" strokeWidth={2} />}
              </div>
              <p className="text-xs font-medium text-slate/60 mt-0.5">
                {tier === "guest" ? "Preview mode" : `@${username || "wanderer_mia"}`}
              </p>
            </div>

            {/* Avatar Preset Selector */}
            <AnimatePresence>
              {showAvatarSelector && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute inset-0 bg-white/95 backdrop-blur-sm p-6 flex flex-col justify-center items-center z-10"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-slate/65 mb-4">Choose Photo</p>
                  <div className="flex gap-2.5 justify-center mb-4">
                    {AVATAR_PRESETS.map((p, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => {
                          setAvatar(p);
                          setShowAvatarSelector(false);
                        }}
                        className={cn(
                          "relative w-11 h-11 rounded-full overflow-hidden border-2 transition-all",
                          avatar === p ? "border-sunset scale-105" : "border-slate/10 hover:border-slate/30"
                        )}
                      >
                        <Image src={p} alt="Preset Option" fill className="object-cover" />
                      </button>
                    ))}
                  </div>

                  <label className="mb-3 cursor-pointer">
                    <span className="px-4 py-2 border border-slate/15 rounded-xl text-xs font-bold text-slate hover:bg-slate/5 transition-all block">
                      Upload Photo
                    </span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowAvatarSelector(false)}
                    className="px-4 py-1.5 text-slate/65 text-xs font-semibold hover:text-slate"
                  >
                    Cancel
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Account Tier & Verification Card */}
          {isVerifiedAccount ? (
            <div className="bg-white border border-slate/10 rounded-2xl p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-50 text-green-700 rounded-xl">
                  <ShieldCheck className="w-5 h-5" strokeWidth={2} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate">Verified Kin</h4>
                  <p className="text-xs text-green-700 font-semibold">ID Confirmed · Full Access</p>
                </div>
              </div>
              <ul className="text-xs text-slate/70 space-y-1.5 pt-2 border-t border-slate/10 font-medium">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-600" /> Edit &amp; create shared group plans</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-600" /> Join &amp; split boat or van trips</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-600" /> Share exact 2-hour meet-up location</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-600" /> Live emergency SOS alerts</li>
              </ul>
            </div>
          ) : (
            <div className="bg-white border border-amber-500/30 rounded-2xl p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
                  <ShieldCheck className="w-5 h-5" strokeWidth={2} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate">
                    {tier === "guest" ? "Guest Access" : "Standard Member"}
                  </h4>
                  <p className="text-xs text-amber-700 font-semibold">ID Not Verified Yet</p>
                </div>
              </div>
              <p className="text-xs text-slate/65 leading-relaxed font-medium">
                Verify your ID to unlock group trip editing, shared boat splits, exact meet-up pins, and emergency SOS alerts.
              </p>
              <Link
                href={tier === "guest" ? "/onboarding" : "/verify"}
                className="block w-full py-2.5 bg-sunset hover:bg-sunset-dark text-white font-bold rounded-xl text-xs transition-all text-center"
              >
                {tier === "guest" ? "Sign Up & Verify ID" : "Verify My ID"}
              </Link>
            </div>
          )}
        </div>

        {/* Right Side: Settings Fields */}
        <div className="md:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white border border-slate/10 rounded-2xl p-7 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate border-b border-slate/10 pb-3.5">Basic Information</h3>

            <AnimatePresence>
              {isIdentityChanged && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl space-y-1 text-xs font-medium overflow-hidden"
                >
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" strokeWidth={2} />
                    <span>Name or Photo Changed</span>
                  </div>
                  <p className="text-amber-900/80 leading-relaxed">
                    If you change your name or profile photo, you will need to check your ID again to keep your Verified Kin badge.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs uppercase font-bold tracking-wider text-slate/65 ml-1">Full Name</label>
                <input
                  type="text"
                  disabled={!perms.canEditProfile}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3.5 bg-[#F9F8F6] border border-slate/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-sunset/20 transition-all font-medium text-slate text-sm disabled:opacity-60"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs uppercase font-bold tracking-wider text-slate/65 ml-1">Username</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate/60 font-bold text-sm">@</span>
                  <input
                    type="text"
                    disabled={!perms.canEditProfile}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-3.5 pl-8 bg-[#F9F8F6] border border-slate/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-sunset/20 transition-all font-medium text-slate text-sm disabled:opacity-60"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase font-bold tracking-wider text-slate/65 ml-1">Short Bio</label>
              <textarea
                rows={3}
                disabled={!perms.canEditProfile}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-3.5 bg-[#F9F8F6] border border-slate/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-sunset/20 transition-all font-medium text-slate text-sm resize-none disabled:opacity-60"
              />
            </div>
          </div>

          {/* Travel Style */}
          <div className="bg-white border border-slate/10 rounded-2xl p-7 shadow-sm space-y-5">
            <div className="border-b border-slate/10 pb-3.5 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate">Travel Style</h3>
              <span className="text-xs font-semibold text-slate/60">Choose all that fit</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {STYLES_LIST.map((style) => {
                const isActive = styles.includes(style.id);
                const StyleIcon = style.icon;
                return (
                  <button
                    type="button"
                    key={style.id}
                    disabled={!perms.canEditProfile}
                    onClick={() => toggleStyle(style.id)}
                    className={cn(
                      "p-4 border rounded-xl text-center transition-all group relative flex flex-col items-center disabled:opacity-60",
                      isActive
                        ? "border-sunset bg-sunset/[0.04] text-slate shadow-sm font-bold"
                        : "border-slate/10 hover:border-slate/25 text-slate/70 hover:text-slate hover:bg-[#F9F8F6]"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center mb-2.5 transition-colors",
                      isActive ? "bg-sunset text-white" : "bg-slate/5 text-slate/70 group-hover:text-slate"
                    )}>
                      <StyleIcon className="w-5 h-5" strokeWidth={1.75} />
                    </div>
                    <span className="text-xs font-bold leading-tight">{style.label}</span>
                    {isActive && (
                      <span className="absolute top-2.5 right-2.5 bg-sunset text-white p-0.5 rounded-full">
                        <Check className="w-3 h-3" strokeWidth={2.5} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interests */}
          <div className="bg-white border border-slate/10 rounded-2xl p-7 shadow-sm space-y-5">
            <div className="border-b border-slate/10 pb-3.5 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate">Your Interests</h3>
              <span className="text-xs font-semibold text-slate/60">Choose multiple</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {VIBES_LIST.map((vibe) => {
                const isActive = vibes.includes(vibe);
                return (
                  <button
                    type="button"
                    key={vibe}
                    disabled={!perms.canEditProfile}
                    onClick={() => toggleVibe(vibe)}
                    className={cn(
                      "px-4 py-2 rounded-full text-xs font-bold transition-all border disabled:opacity-60",
                      isActive
                        ? "bg-slate text-white border-slate"
                        : "bg-[#F9F8F6] text-slate/70 border-slate/10 hover:border-slate/25 hover:text-slate"
                    )}
                  >
                    {vibe}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Destinations with Real Country Flags */}
          <div className="bg-white border border-slate/10 rounded-2xl p-7 shadow-sm space-y-5">
            <div className="border-b border-slate/10 pb-3.5 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate">Countries You Want to Visit</h3>
              <span className="text-xs font-semibold text-slate/60">Choose multiple</span>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {DESTINATIONS_LIST.map(({ name: destName, Flag }) => {
                const isActive = destinations.includes(destName);
                return (
                  <button
                    type="button"
                    key={destName}
                    disabled={!perms.canEditProfile}
                    onClick={() => toggleDestination(destName)}
                    className={cn(
                      "p-4 border rounded-xl flex items-center gap-3.5 transition-all font-bold group relative disabled:opacity-60",
                      isActive
                        ? "bg-sunset/[0.04] border-sunset text-slate shadow-sm"
                        : "border-slate/10 text-slate/75 hover:text-slate hover:bg-[#F9F8F6]"
                    )}
                  >
                    <div className="w-10 h-7 rounded-md overflow-hidden border border-slate/10 shadow-sm shrink-0 bg-white">
                      <Flag title={destName} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm font-bold text-slate">{destName}</span>
                    {isActive && (
                      <span className="absolute right-3.5 bg-sunset text-white p-0.5 rounded-full">
                        <Check className="w-3 h-3" strokeWidth={2.5} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
