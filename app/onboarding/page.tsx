"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  User,
  MapPin,
  Heart,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertTriangle,
  Coffee,
  Zap,
  Backpack,
  Sparkles,
  Leaf,
  Laptop,
  ArrowRight
} from "lucide-react";
import { TH, VN, ID, PH } from "country-flag-icons/react/3x2";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useProfileStore } from "@/lib/stores/useProfile";

/* ─────────────────────────────────────────────────────────── */
/* Steps Definitions                                           */
/* ─────────────────────────────────────────────────────────── */

const steps = [
  {
    id: "identity",
    title: "About You",
    icon: User,
    desc: "Add your name and a short intro (optional)"
  },
  {
    id: "style",
    title: "Travel Style",
    icon: MapPin,
    desc: "How you like to travel"
  },
  {
    id: "vibes",
    title: "Your Interests",
    icon: Heart,
    desc: "What you enjoy most on a trip"
  },
  {
    id: "safety",
    title: "ID Check",
    icon: ShieldCheck,
    desc: "Verify your ID to unlock all features"
  },
];

/* ─────────────────────────────────────────────────────────── */
/* Component                                                     */
/* ─────────────────────────────────────────────────────────── */

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    bio: "",
    styles: [] as string[],
    vibes: [] as string[],
    destinations: [] as string[],
  });

  useEffect(() => {
    const current = useProfileStore.getState();
    setFormData({
      name: current.name || "",
      username: current.username || "",
      bio: current.bio || "",
      styles: current.styles || [],
      vibes: current.vibes || [],
      destinations: current.destinations || ["Philippines"],
    });
  }, []);

  const persistOnboardingData = () => {
    const current = useProfileStore.getState();
    useProfileStore.getState().updateProfile({
      name: formData.name.trim() || current.name,
      username: formData.username.trim() || current.username,
      bio: formData.bio.trim() || current.bio,
      styles: formData.styles.length > 0 ? formData.styles : current.styles,
      vibes: formData.vibes.length > 0 ? formData.vibes : current.vibes,
      destinations: formData.destinations.length > 0 ? formData.destinations : current.destinations,
    });
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleItem = (field: "styles" | "vibes" | "destinations", item: string) => {
    setFormData(prev => {
      const current = prev[field] as string[];
      const next = current.includes(item)
        ? current.filter(i => i !== item)
        : [...current, item];
      return { ...prev, [field]: next };
    });
  };

  const nextStep = () => {
    persistOnboardingData();
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsDone(true);
    }
  };

  const skipStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      router.push("/dashboard");
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  if (isDone) return <OnboardingSuccess />;

  return (
    <div className="min-h-screen bg-background text-slate flex flex-col relative overflow-hidden">
      {/* ── Background Decoration ── */}
      <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <Image
          src="https://images.unsplash.com/photo-1544526226-d4568090ffb8?auto=format&fit=crop&q=80&w=1920"
          alt="Southeast Asia Background"
          fill
          priority
          className="object-cover opacity-[0.12] scale-110 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/60 to-background" />
      </div>

      {/* ── Navigation ── */}
      <nav className="relative z-10 p-6 md:p-8 flex items-center justify-between gap-4">
        <Link href="/" className="text-2xl font-bold text-slate">
          Travel <span className="text-sunset">Kin</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 bg-white/80 backdrop-blur-md rounded-full border border-slate/10 text-xs font-bold tracking-wider text-slate/75 uppercase">
            Step {currentStep + 1} of {steps.length}
          </span>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white hover:bg-slate/5 rounded-full border border-slate/15 text-xs font-bold text-slate transition-colors"
          >
            <span>Skip &amp; Explore</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-20 mt-4">
        <div className="bg-white/90 backdrop-blur-xl border border-slate/10 w-full max-w-2xl rounded-2xl p-8 md:p-12 shadow-xl">
          {/* ── Progress Bar ── */}
          <div className="h-1.5 w-full bg-slate/10 rounded-full mb-10 overflow-hidden">
            <motion.div
              className="h-full bg-sunset rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="text-center md:text-left">
                <div className="inline-flex p-3 rounded-xl bg-slate/5 border border-slate/10 text-slate mb-5">
                  {React.createElement(steps[currentStep].icon, { className: "w-5 h-5", strokeWidth: 1.75 })}
                </div>
                <h1 className="text-3xl md:text-5xl font-bold text-slate mb-2 tracking-tight">
                  {steps[currentStep].title}
                </h1>
                <p className="text-slate/65 text-base md:text-lg font-medium">{steps[currentStep].desc}</p>
              </div>

              {/* Form Content */}
              <div className="space-y-6">
                {currentStep === 0 && <IdentityForm data={formData} update={updateField} />}
                {currentStep === 1 && <StyleForm selected={formData.styles} toggle={(v) => toggleItem("styles", v)} />}
                {currentStep === 2 && (
                  <VibeForm
                    selectedVibes={formData.vibes}
                    toggleVibe={(v) => toggleItem("vibes", v)}
                    selectedDest={formData.destinations}
                    toggleDest={(v) => toggleItem("destinations", v)}
                  />
                )}
                {currentStep === 3 && <SafetyForm onPersist={persistOnboardingData} />}
              </div>

              {/* Navigation Actions */}
              <div className="pt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate/10 mt-8">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className={cn(
                    "flex items-center gap-1.5 text-slate/70 font-bold tracking-wider uppercase text-xs hover:text-slate transition-colors duration-200",
                    currentStep === 0 && "opacity-0 pointer-events-none"
                  )}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={skipStep}
                    className="px-5 py-3.5 text-slate/70 hover:text-slate hover:bg-slate/5 rounded-full font-semibold text-sm transition-colors"
                  >
                    {currentStep === steps.length - 1 ? "Skip to Dashboard" : "Skip Step"}
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-8 py-3.5 bg-sunset text-white font-bold rounded-full shadow-md shadow-sunset/20 hover:bg-sunset-dark transition-all duration-200 flex items-center gap-2 active:scale-95 group text-sm"
                  >
                    {currentStep === steps.length - 1 ? "Finish Setup" : "Next Step"}
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="mt-6 text-xs text-slate/65 font-medium text-center">
          Just looking around?{" "}
          <Link href="/dashboard" className="text-slate font-bold underline hover:text-sunset transition-colors">
            Preview the dashboard without signing up
          </Link>
        </p>
      </div>
    </div>
  );
}

/* ── Sub-forms ── */

function IdentityForm({
  data,
  update
}: {
  data: any;
  update: (field: string, val: any) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="space-y-2 font-sans">
        <label className="text-xs uppercase font-bold tracking-wider text-slate/70 ml-1">Full Name</label>
        <input
          value={data.name || ""}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Ex: Mia Reyes"
          className="w-full p-4 bg-[#F9F8F6] border border-slate/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-sunset/25 focus:bg-white transition-all font-medium text-slate placeholder:text-slate/50"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs uppercase font-bold tracking-wider text-slate/70 ml-1">Username</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate/60 font-bold">@</span>
          <input
            value={data.username || ""}
            onChange={(e) => update("username", e.target.value)}
            placeholder="wanderer_mia"
            className="w-full p-4 pl-9 bg-[#F9F8F6] border border-slate/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-sunset/25 focus:bg-white transition-all font-medium text-slate placeholder:text-slate/50"
          />
        </div>
      </div>
      <div className="md:col-span-2 space-y-2">
        <label className="text-xs uppercase font-bold tracking-wider text-slate/70 ml-1">Short Bio</label>
        <textarea
          value={data.bio || ""}
          onChange={(e) => update("bio", e.target.value)}
          placeholder="Say hello and share what kind of trips you enjoy"
          rows={3}
          className="w-full p-4 bg-[#F9F8F6] border border-slate/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-sunset/25 focus:bg-white transition-all font-medium text-slate placeholder:text-slate/50 resize-none"
        />
      </div>
    </div>
  );
}

function StyleForm({
  selected,
  toggle
}: {
  selected: string[];
  toggle: (val: string) => void;
}) {
  const styles = [
    { id: "slow", label: "Slow Traveller", icon: Coffee },
    { id: "fast", label: "Active Explorer", icon: Zap },
    { id: "budget", label: "Budget Friendly", icon: Backpack },
    { id: "luxury", label: "Comfort & Stays", icon: Sparkles },
    { id: "eco", label: "Nature Lover", icon: Leaf },
    { id: "remote", label: "Remote Worker", icon: Laptop },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {styles.map(s => {
        const Icon = s.icon;
        const isSelected = selected.includes(s.id);
        return (
          <button
            type="button"
            key={s.id}
            onClick={() => toggle(s.id)}
            className={cn(
              "relative p-6 bg-white border rounded-2xl transition-all text-center group active:scale-[0.98] flex flex-col items-center justify-center",
              isSelected
                ? "border-sunset bg-sunset/[0.04] ring-1 ring-sunset/25 shadow-sm"
                : "border-slate/10 hover:border-slate/25 hover:bg-[#F9F8F6]"
            )}
          >
            {isSelected && (
              <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-sunset text-white flex items-center justify-center">
                <Check className="w-3 h-3" strokeWidth={2.5} />
              </span>
            )}
            <div className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-colors",
              isSelected
                ? "bg-sunset text-white"
                : "bg-slate/5 text-slate/75 group-hover:bg-slate/10 group-hover:text-slate"
            )}>
              <Icon className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <span className={cn(
              "text-xs font-bold tracking-wide uppercase transition-colors",
              isSelected ? "text-slate" : "text-slate/75 group-hover:text-slate"
            )}>{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function VibeForm({
  selectedVibes,
  toggleVibe,
  selectedDest,
  toggleDest
}: {
  selectedVibes: string[];
  toggleVibe: (val: string) => void;
  selectedDest: string[];
  toggleDest: (val: string) => void;
}) {
  const vibes = [
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

  const countries = [
    { name: "Thailand", Flag: TH },
    { name: "Vietnam", Flag: VN },
    { name: "Indonesia", Flag: ID },
    { name: "Philippines", Flag: PH }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2.5">
        {vibes.map(v => (
          <button
            type="button"
            key={v}
            onClick={() => toggleVibe(v)}
            className={cn(
              "px-4 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all border",
              selectedVibes.includes(v)
                ? "bg-slate text-white border-slate shadow-sm"
                : "bg-white text-slate/70 border-slate/10 hover:border-slate/25 hover:text-slate"
            )}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <label className="text-xs uppercase font-bold tracking-wider text-slate/70 ml-1">
          Countries You Want to Visit
        </label>
        <div className="grid grid-cols-2 gap-3.5">
          {countries.map(({ name, Flag }) => {
            const isSelected = selectedDest.includes(name);
            return (
              <button
                type="button"
                key={name}
                onClick={() => toggleDest(name)}
                className={cn(
                  "p-4 bg-white border rounded-2xl flex items-center gap-3.5 transition-all font-bold group relative",
                  isSelected
                    ? "bg-sunset/[0.04] border-sunset text-slate shadow-sm ring-1 ring-sunset/20"
                    : "border-slate/10 text-slate/75 hover:bg-[#F9F8F6] hover:border-slate/25"
                )}
              >
                <div className="w-10 h-7 rounded-md overflow-hidden border border-slate/10 shadow-sm shrink-0 bg-white">
                  <Flag title={name} className="w-full h-full object-cover" />
                </div>
                <span className="text-sm font-bold text-slate">{name}</span>
                {isSelected && (
                  <span className="absolute right-3.5 w-5 h-5 rounded-full bg-sunset text-white flex items-center justify-center">
                    <Check className="w-3 h-3" strokeWidth={2.5} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SafetyForm({ onPersist }: { onPersist: () => void }) {
  return (
    <div className="space-y-6">
      <div className="p-8 bg-[#F9F8F6] border border-slate/10 rounded-2xl flex flex-col md:flex-row gap-6 relative overflow-hidden">
        <div className="p-3.5 h-fit w-fit bg-slate text-white rounded-xl shrink-0">
          <ShieldCheck className="w-6 h-6" strokeWidth={1.75} />
        </div>

        <div className="flex-1">
          <h4 className="text-xl text-slate font-bold mb-2 tracking-tight">Verify Your ID to Unlock Full Access</h4>
          <p className="text-slate/65 text-sm font-medium leading-relaxed max-w-md mb-6">
            Verified Kins can join shared boat trips, edit group plans, share exact meet-up locations, and use live emergency SOS alerts.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/verify"
              onClick={onPersist}
              className="px-7 py-3.5 bg-sunset text-white font-bold rounded-full shadow-md shadow-sunset/20 hover:bg-sunset-dark transition-all flex items-center justify-center gap-2 text-sm"
            >
              Verify with ID
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard"
              onClick={onPersist}
              className="px-7 py-3.5 bg-white text-slate font-semibold rounded-full border border-slate/15 hover:bg-slate/5 transition-all text-center flex items-center justify-center text-sm"
            >
              Skip for Now
            </Link>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3.5 p-5 bg-white border border-slate/10 rounded-xl text-slate/75 text-xs font-medium leading-relaxed">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
        <p>Your ID details are checked securely and are never shown to other travellers.</p>
      </div>
    </div>
  );
}

function OnboardingSuccess() {
  return (
    <div className="min-h-screen bg-background text-slate flex flex-col items-center justify-center relative overflow-hidden px-6">
      <div className="relative z-10 text-center max-w-lg">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 14, stiffness: 120 }}
          className="w-20 h-20 bg-sunset rounded-full flex items-center justify-center shadow-lg shadow-sunset/30 mx-auto mb-8"
        >
          <Check className="w-10 h-10 text-white" strokeWidth={2.5} />
        </motion.div>
        <h2 className="text-4xl md:text-6xl font-bold text-slate mb-4 leading-tight tracking-tight">
          You&apos;re All <span className="text-sunset">Set!</span>
        </h2>
        <p className="text-slate/65 text-lg mb-10 font-medium">
          Your profile is ready. Start browsing travellers, shared day plans, and local safety tools.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-10 py-4 bg-sunset text-white font-bold rounded-full shadow-lg shadow-sunset/20 hover:bg-sunset-dark transition-all text-base"
        >
          Open Dashboard
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
