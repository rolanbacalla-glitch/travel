"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Users,
  Plus,
  Clock,
  AlertTriangle,
  Zap,
  UserCheck,
  Settings,
  X,
  FileText,
  Lock,
  Download,
  Phone,
  ChevronsRight,
  Eye,
  Radio
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { useMessagesStore } from "@/lib/stores/useMessages";
import { UserTier, getTierPermissions } from "@/lib/access";

const InteractiveMap = dynamic(() => import("@/components/map/InteractiveMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[460px] bg-slate/5 animate-pulse rounded-2xl flex items-center justify-center text-slate/60 text-sm font-semibold">
      Loading local safety map...
    </div>
  ),
});

export function SafetyDashboard({ tier = "verified" }: { tier?: UserTier }) {
  const store = useMessagesStore();
  const perms = getTierPermissions(tier);

  // Slide-to-SOS state
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [sliderPercent, setSliderPercent] = useState<number>(0);
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);

  // 3-Second Auto-Send Countdown modal state
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [isPracticeMode, setIsPracticeMode] = useState<boolean>(false);
  const [practiceCompleted, setPracticeCompleted] = useState<boolean>(false);

  // Level 1: "I Feel Unsafe" Quiet Watch state
  const [quietWatchActive, setQuietWatchActive] = useState<boolean>(false);
  const [quietWatchStartedAt, setQuietWatchStartedAt] = useState<string | null>(null);

  // Settings & Check-in state
  const [showSettings, setShowSettings] = useState(false);
  const [checkedInAt, setCheckedInAt] = useState<string | null>(null);
  const [autoSosEnabled, setAutoSosEnabled] = useState<boolean>(true);
  const [pulseFrequency, setPulseFrequency] = useState<"12h" | "24h" | "48h">("12h");
  const [tierNotice, setTierNotice] = useState<string | null>(null);

  const isSOSActive = Object.values(store.sessions).some((s) => s.isSOSActive);

  // 3-Second Auto-Send Countdown Timer
  useEffect(() => {
    if (countdownSeconds === null) return;
    if (countdownSeconds <= 0) {
      if (isPracticeMode) {
        setPracticeCompleted(true);
        setCountdownSeconds(null);
        setSliderPercent(0);
        setTimeout(() => setPracticeCompleted(false), 5000);
      } else {
        store.triggerSOS(true);
        setQuietWatchActive(false);
        setCountdownSeconds(null);
        setSliderPercent(0);
      }
      return;
    }

    const timer = setTimeout(() => {
      setCountdownSeconds((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdownSeconds, isPracticeMode, store]);

  const showLockedMsg = (msg: string) => {
    setTierNotice(msg);
    setTimeout(() => setTierNotice(null), 3800);
  };

  const triggerCountdownFlow = (practice = false) => {
    if (!practice && !perms.canTriggerSOS) {
      showLockedMsg(
        tier === "guest"
          ? "Sign up and verify your ID to send live emergency SOS alerts (or try Practice Mode below)."
          : "Verify your ID to send live emergency SOS alerts (or try Practice Mode below)."
      );
      setSliderPercent(0);
      return;
    }
    setIsPracticeMode(practice);
    setPracticeCompleted(false);
    setCountdownSeconds(3);
  };

  const handleSendImmediately = () => {
    if (isPracticeMode) {
      setPracticeCompleted(true);
      setCountdownSeconds(null);
      setSliderPercent(0);
      setTimeout(() => setPracticeCompleted(false), 5000);
    } else {
      store.triggerSOS(true);
      setQuietWatchActive(false);
      setCountdownSeconds(null);
      setSliderPercent(0);
    }
  };

  const handleCancelCountdown = () => {
    setCountdownSeconds(null);
    setSliderPercent(0);
  };

  // Pointer drag handlers for Slide-to-SOS
  const updateSliderFromClientX = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const thumbSize = 52;
    const maxTravel = Math.max(1, rect.width - thumbSize - 8);
    const raw = clientX - rect.left - thumbSize / 2 - 4;
    const clamped = Math.max(0, Math.min(maxTravel, raw));
    const pct = Math.round((clamped / maxTravel) * 100);
    setSliderPercent(pct);

    if (pct >= 84) {
      setIsDraggingSlider(false);
      setSliderPercent(100);
      triggerCountdownFlow(isPracticeMode);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isSOSActive || countdownSeconds !== null) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingSlider(true);
    updateSliderFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSlider) return;
    updateSliderFromClientX(e.clientX);
  };

  const handlePointerUp = () => {
    if (!isDraggingSlider) return;
    setIsDraggingSlider(false);
    if (sliderPercent < 84) {
      setSliderPercent(0);
    }
  };

  const handleToggleQuietWatch = () => {
    if (!quietWatchActive && !perms.canTriggerSOS && !isPracticeMode) {
      showLockedMsg(
        tier === "guest"
          ? "Sign up and verify your ID to share your live location silently with emergency contacts."
          : "Verify your ID to activate live silent location sharing."
      );
      return;
    }
    if (quietWatchActive) {
      setQuietWatchActive(false);
      setQuietWatchStartedAt(null);
    } else {
      setQuietWatchActive(true);
      setQuietWatchStartedAt(
        new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
      );
    }
  };

  return (
    <>
      <AnimatePresence>
        {/* Tier Notice Toast */}
        {tierNotice && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] px-5 py-3 bg-slate text-white rounded-xl shadow-xl text-xs sm:text-sm font-semibold flex items-center gap-3 border border-white/10 max-w-xl"
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

        {/* 3-Second Auto-Send Countdown Modal */}
        {countdownSeconds !== null && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="sos-countdown-title"
              className="relative w-full max-w-md bg-white rounded-3xl p-8 text-center shadow-2xl border border-slate/10 space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-bold uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5" />
                {isPracticeMode ? "Practice Test · No Real Alert" : "Sending Emergency SOS"}
              </div>

              <div className="mx-auto w-28 h-28 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl shadow-red-600/30">
                <span className="text-6xl font-extrabold tabular-nums">{countdownSeconds}</span>
              </div>

              <div className="space-y-2">
                <h3 id="sos-countdown-title" className="text-2xl font-bold text-slate">
                  {isPracticeMode
                    ? `Practice alert in ${countdownSeconds}s`
                    : `Sending SOS in ${countdownSeconds}s`}
                </h3>
                <p className="text-sm text-slate/65 font-medium leading-relaxed">
                  {isPracticeMode
                    ? "This shows how the countdown automatically sends your location even if you drop your phone."
                    : "Your live GPS location will be sent automatically to your emergency contacts and local help unless you cancel."}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancelCountdown}
                  className="w-full py-4 rounded-xl bg-slate text-white font-bold text-base hover:bg-slate/90 transition-colors"
                >
                  Cancel (Pressed by Mistake)
                </button>
                <button
                  type="button"
                  onClick={handleSendImmediately}
                  className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors"
                >
                  {isPracticeMode ? "Finish Practice Now" : "Send SOS Right Now"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Settings Drawer */}
        {showSettings && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="fixed inset-0 bg-slate/25 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.35 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl border-l border-slate/10 overflow-y-auto"
            >
              <div className="p-7 space-y-8 pb-20">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate">Safety Settings</h2>
                    <p className="text-xs font-medium text-slate/65">Choose who we contact in an emergency</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    aria-label="Close safety settings"
                    className="p-2.5 bg-slate/5 rounded-full hover:bg-slate/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-slate" />
                  </button>
                </div>

                <div className="space-y-6">
                  <section className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate/65">
                      <Users className="w-4 h-4" />
                      <h3>Emergency Contacts</h3>
                    </div>
                    <div className="p-5 border border-slate/10 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate">Auto-Alert Contacts</p>
                          <p className="text-xs font-medium text-slate/65">Message your contacts if SOS is used</p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={autoSosEnabled}
                          aria-label="Toggle Auto-Alert Contacts"
                          onClick={() => setAutoSosEnabled((v) => !v)}
                          className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${
                            autoSosEnabled ? "bg-green-600" : "bg-slate/20"
                          }`}
                        >
                          <div
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                              autoSosEnabled ? "right-1" : "left-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate/65">
                      <Clock className="w-4 h-4" />
                      <h3>Check-in Reminder</h3>
                    </div>
                    <div className="p-5 border border-slate/10 rounded-2xl space-y-3">
                      <p className="text-xs font-medium text-slate/65">How often to remind you to check in as safe</p>
                      <div className="grid grid-cols-3 gap-2">
                        {(["12h", "24h", "48h"] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setPulseFrequency(t)}
                            className={`py-2 rounded-xl text-xs font-bold transition-colors ${
                              pulseFrequency === t
                                ? "bg-slate text-white"
                                : "bg-slate/5 text-slate hover:bg-slate/10"
                            }`}
                          >
                            Every {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate/65">
                      <Lock className="w-4 h-4" />
                      <h3>Permissions</h3>
                    </div>
                    <div className="space-y-2">
                      <PermissionRow title="Location" desc="While using the app" active />
                      <PermissionRow title="Safety Alerts" desc="Important alerts only" active />
                    </div>
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate/65">
                      <Download className="w-4 h-4" />
                      <h3>Saved Offline</h3>
                    </div>
                    <div className="p-4 bg-[#F9F8F6] border border-slate/10 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-slate/70" />
                        <div>
                          <p className="text-xs font-bold text-slate">Medical Info</p>
                          <p className="text-xs text-slate/65">Saved on your device</p>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Active Live SOS Floating Banner */}
        {isSOSActive && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg px-6"
          >
            <div className="bg-red-600 text-white p-5 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border-2 border-white/25">
              <div className="flex items-center gap-3.5">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider">Emergency SOS Active</h4>
                  <p className="text-xs text-white/85">Live location sent to emergency contacts &amp; local help</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => store.triggerSOS(false)}
                className="px-4 py-2 bg-white text-red-600 rounded-xl text-xs font-bold shrink-0"
              >
                End SOS
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-slate font-bold tracking-wider text-xs uppercase bg-white rounded-full px-3.5 py-1 border border-slate/10">
              <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
              Safety Centre
            </div>
            <h2 className="text-3xl text-slate font-bold">Safety Tools</h2>
            <p className="text-slate/65 text-sm font-medium">
              Two-level emergency alerts, silent live location sharing, and local help numbers.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="px-3.5 py-2.5 bg-white border border-slate/10 rounded-xl hidden sm:flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-600" />
              <span className="text-xs font-bold text-slate">GPS Ready</span>
            </div>
            <div className="px-3.5 py-2.5 bg-white border border-slate/10 rounded-xl hidden sm:flex items-center gap-2">
              <Zap className="w-4 h-4 text-slate/65" />
              <span className="text-xs font-bold text-slate tabular-nums">88% Battery</span>
            </div>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              aria-label="Open safety settings"
              className="p-2.5 bg-white border border-slate/10 rounded-xl hover:bg-slate/5 transition-colors cursor-pointer"
            >
              <Settings className="w-5 h-5 text-slate/75" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Status Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-white border border-slate/10 rounded-2xl shadow-sm flex items-center gap-3.5">
            <div className="p-2.5 bg-slate/5 rounded-xl text-slate/75">
              <UserCheck className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate/60">Account Status</p>
              <p className="text-sm font-bold text-slate">
                {perms.canTriggerSOS ? (
                  <span className="text-green-700">ID Verified · Full Protection</span>
                ) : (
                  <span className="text-amber-700">ID Check Needed for Live SOS</span>
                )}
              </p>
            </div>
          </div>
          <div className="p-5 bg-white border border-slate/10 rounded-2xl shadow-sm flex items-center gap-3.5">
            <div className="p-2.5 bg-slate/5 rounded-xl text-slate/75">
              <Users className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate/60">Emergency Contacts</p>
              <p className="text-sm font-bold text-slate">
                3 Saved · {autoSosEnabled ? "Auto-Alert On" : "Manual"}
              </p>
            </div>
          </div>
          <div className="p-5 bg-white border border-slate/10 rounded-2xl shadow-sm flex items-center gap-3.5">
            <div className="p-2.5 bg-slate/5 rounded-xl text-slate/75">
              <MapPin className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate/60">Current Area</p>
              <p className="text-sm font-bold text-slate">
                General Luna · <span className="text-green-700">Low Risk</span>
              </p>
            </div>
          </div>
        </div>

        {/* Practice Mode Confirmation Banner */}
        <AnimatePresence>
          {practiceCompleted && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-between gap-3 text-green-900"
            >
              <div className="flex items-center gap-2.5 text-sm font-semibold">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                <span>Practice test complete! No real alert was sent. Everything works as expected.</span>
              </div>
              <button
                type="button"
                onClick={() => setPracticeCompleted(false)}
                className="text-xs font-bold underline shrink-0"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quiet Watch Active Banner (Level 1 Amber) */}
        <AnimatePresence>
          {quietWatchActive && !isSOSActive && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-5 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-950">
                    Quiet Safety Watch Active (since {quietWatchStartedAt})
                  </p>
                  <p className="text-xs text-amber-900/80 font-medium mt-0.5">
                    Your live GPS location is quietly shared with your 3 emergency contacts. No emergency siren or 911 call has been made.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleToggleQuietWatch}
                  className="px-4 py-2.5 rounded-xl bg-white border border-amber-300 text-amber-950 text-xs font-bold hover:bg-amber-100 transition-colors"
                >
                  I&apos;m Safe Now
                </button>
                <button
                  type="button"
                  onClick={() => triggerCountdownFlow(false)}
                  className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
                >
                  Upgrade to SOS
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary Emergency Controls (Combined Slide + 3s Countdown + Two-Level "I Feel Unsafe") */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 relative p-7 md:p-9 bg-slate text-white rounded-2xl shadow-lg overflow-hidden border border-red-500/25 flex flex-col justify-between space-y-6">
            {/* Top Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/25 border border-red-500/40 text-red-200 text-xs font-bold uppercase tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {isPracticeMode ? "Practice Mode On" : "Emergency Only"}
                </div>
                <h3 className="text-2xl md:text-3xl font-bold leading-tight">Emergency SOS</h3>
                <p className="text-white/80 text-sm font-medium max-w-lg leading-relaxed">
                  Slide to start a 3-second countdown that sends your live location to emergency contacts, local help, and nearby verified travellers.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsPracticeMode((v) => !v)}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors shrink-0",
                  isPracticeMode
                    ? "bg-white text-slate border-white"
                    : "bg-white/10 text-white/85 border-white/15 hover:bg-white/15"
                )}
              >
                {isPracticeMode ? "Exit Practice Mode" : "Try Practice Mode"}
              </button>
            </div>

            {/* Level 2 (Red): Slide-to-SOS Track + Single-Tap 3s Countdown Fallback */}
            <div className="space-y-3.5">
              {isSOSActive ? (
                <div className="p-4 rounded-2xl bg-red-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Radio className="w-5 h-5 animate-pulse shrink-0" />
                    <span className="text-sm font-bold">Emergency SOS is broadcasting your live location</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => store.triggerSOS(false)}
                    className="px-4 py-2 rounded-xl bg-white text-red-600 text-xs font-bold shrink-0"
                  >
                    End SOS
                  </button>
                </div>
              ) : (
                <>
                  {/* Interactive Slide Track */}
                  <div
                    ref={trackRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    role="slider"
                    aria-label="Slide right to send Emergency SOS"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={sliderPercent}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        triggerCountdownFlow(isPracticeMode);
                      }
                    }}
                    className="relative h-16 w-full rounded-2xl bg-white/10 border border-red-500/40 overflow-hidden select-none touch-none cursor-grab active:cursor-grabbing"
                  >
                    {/* Red Fill Behind Thumb */}
                    <div
                      className="absolute inset-y-0 left-0 bg-red-600/80 transition-[width] duration-75"
                      style={{ width: `calc(${sliderPercent}% + ${sliderPercent > 0 ? "28px" : "0px"})` }}
                    />

                    {/* Track Label */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-16">
                      <span className="text-sm font-bold tracking-wide text-white/95 uppercase">
                        {isPracticeMode ? "Slide to Test SOS →" : "Slide to Send SOS →"}
                      </span>
                    </div>

                    {/* Draggable Red Thumb */}
                    <div
                      className="absolute top-1.5 bottom-1.5 w-[52px] rounded-xl bg-red-600 shadow-lg flex items-center justify-center text-white transition-[left] duration-75"
                      style={{
                        left: `calc(6px + (100% - 64px) * ${sliderPercent / 100})`,
                      }}
                    >
                      <ChevronsRight className="w-6 h-6" strokeWidth={2.5} />
                    </div>
                  </div>

                  {/* Single-Tap Accessible Fallback for Shaky/Wet Hands */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => triggerCountdownFlow(isPracticeMode)}
                      className="inline-flex items-center gap-2 text-xs font-bold text-red-200 hover:text-white underline underline-offset-4 transition-colors"
                    >
                      {!perms.canTriggerSOS && !isPracticeMode && <Lock className="w-3.5 h-3.5" />}
                      <span>Shaky or wet hands? Tap here for 3-second auto-send countdown</span>
                    </button>
                    <span className="text-xs text-white/60 font-medium">
                      Sends automatically after 3s unless cancelled
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Level 1 (Amber): "I Feel Unsafe" Quiet Location Sharing */}
            <div className="pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 shrink-0 mt-0.5">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Not a full emergency, but feel uneasy?</p>
                  <p className="text-xs text-white/70 font-medium">
                    Quietly share your live GPS with your emergency contacts without calling 911.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleQuietWatch}
                className={cn(
                  "px-5 py-3 rounded-xl text-xs font-bold transition-colors shrink-0 inline-flex items-center justify-center gap-2",
                  quietWatchActive
                    ? "bg-amber-400 text-slate"
                    : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/35"
                )}
              >
                {!perms.canTriggerSOS && !isPracticeMode && <Lock className="w-3.5 h-3.5" />}
                <span>{quietWatchActive ? "Quiet Watch On" : "I Feel Unsafe (Quiet Share)"}</span>
              </button>
            </div>
          </div>

          {/* Safe Check-In Card */}
          <div className="p-7 bg-white border border-slate/10 rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="p-2.5 bg-green-50 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowSettings(true)}
                  className="text-xs font-bold text-slate/70 bg-slate/5 hover:bg-slate/10 px-3 py-1.5 rounded-full transition-colors"
                >
                  {checkedInAt ? `Checked in · ${checkedInAt}` : `Every ${pulseFrequency}`}
                </button>
              </div>
              <h3 className="text-xl font-bold text-slate">Safe Check-In</h3>
              <p className="text-slate/65 text-sm leading-relaxed font-medium">
                Send a quick &ldquo;I&apos;m safe&rdquo; update to your family every {pulseFrequency} with one tap.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!perms.canTriggerSOS && !isPracticeMode) {
                  showLockedMsg("Verify your ID to send live check-ins to your family.");
                  return;
                }
                setCheckedInAt(
                  new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
                );
              }}
              className={`mt-6 py-3.5 border rounded-xl font-bold text-xs transition-all inline-flex items-center justify-center gap-2 ${
                checkedInAt
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-[#F9F8F6] text-slate border-slate/15 hover:bg-slate hover:text-white hover:border-slate"
              }`}
            >
              {!perms.canTriggerSOS && !isPracticeMode && <Lock className="w-3.5 h-3.5" />}
              {checkedInAt ? "Safe Update Sent" : "Check In as Safe"}
            </button>
          </div>
        </div>

        {/* Live Map & Contacts */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate/65">Local Safety Map</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-600" />
                <span className="text-xs font-semibold text-slate/70">General Luna, Siargao</span>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate/10 shadow-sm relative z-0">
              <InteractiveMap />
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-5 bg-white border border-slate/10 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate/65">Emergency Contacts</h3>
                <button type="button" onClick={() => setShowSettings(true)} aria-label="Manage contacts">
                  <Plus className="w-4 h-4 text-slate/70 hover:text-slate" />
                </button>
              </div>
              <div className="space-y-3.5">
                <CircleMember
                  name="David (Dad)"
                  role="Family"
                  image="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&h=300&auto=format&fit=crop&crop=faces&facepad=2"
                />
                <CircleMember
                  name="Sarah Miller"
                  role="Travel Friend"
                  image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&h=300&auto=format&fit=crop&crop=faces&facepad=2"
                />
                <CircleMember
                  name="Hotel Front Desk"
                  role="Local Stay"
                  image="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&h=300&auto=format&fit=crop&crop=faces&facepad=2"
                />
              </div>
            </div>

            <div className="p-5 bg-white border border-slate/10 rounded-2xl shadow-sm space-y-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-50 rounded-lg">
                  <Phone className="w-4 h-4 text-red-600" />
                </div>
                <h4 className="text-sm font-bold text-slate">Local Emergency</h4>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3.5 bg-[#F9F8F6] rounded-xl text-center">
                  <span className="text-xs font-semibold text-slate/65 block">Emergency</span>
                  <span className="text-xl font-extrabold tabular-nums text-red-600">911</span>
                </div>
                <div className="p-3.5 bg-[#F9F8F6] rounded-xl text-center">
                  <span className="text-xs font-semibold text-slate/65 block">Coast Guard</span>
                  <span className="text-xl font-extrabold tabular-nums text-slate">8527</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function CircleMember({ name, role, image }: { name: string; role: string; image: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-slate/5 overflow-hidden shrink-0">
        <Image src={image} alt={name} width={40} height={40} className="object-cover w-full h-full" />
      </div>
      <div>
        <p className="text-xs font-bold text-slate">{name}</p>
        <p className="text-xs font-medium text-slate/60">{role}</p>
      </div>
    </div>
  );
}

function PermissionRow({ title, desc, active }: { title: string; desc: string; active?: boolean }) {
  return (
    <div className="flex items-center justify-between p-4 border border-slate/10 rounded-xl">
      <div>
        <p className="text-sm font-bold text-slate">{title}</p>
        <p className="text-xs font-medium text-slate/65">{desc}</p>
      </div>
      <div className={cn("w-10 h-6 rounded-full relative", active ? "bg-green-600" : "bg-slate/20")}>
        <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm", active ? "right-1" : "left-1")} />
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
