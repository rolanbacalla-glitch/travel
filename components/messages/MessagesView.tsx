"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  Send,
  ShieldCheck,
  Lock,
  AlertTriangle,
  History,
  Navigation
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMessagesStore, Message } from "@/lib/stores/useMessages";
import { KINS, Kin } from "@/lib/data/kins";
import Link from "next/link";
import { UserTier, getTierPermissions } from "@/lib/access";

const RadarMiniMap = dynamic(() => import("./RadarMiniMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate/5 animate-pulse flex items-center justify-center text-slate/60 text-xs font-semibold">
      Loading map...
    </div>
  ),
});

function HandshakeCard({
  kinName,
  status,
  onAccept,
  onDecline,
}: {
  kinName: string;
  status: "pending" | "accepted" | "declined";
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="w-full max-w-sm bg-white rounded-2xl border border-slate/10 shadow-sm p-5 space-y-3.5">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "p-2.5 rounded-xl",
            status === "accepted" ? "bg-green-50 text-green-600" : "bg-slate/5 text-slate"
          )}
        >
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate">Safe Meet-Up Request</h4>
          <p className="text-xs text-slate/60 font-medium">Share exact location for 2 hours</p>
        </div>
      </div>

      <p className="text-xs text-slate/70 leading-relaxed font-medium">
        {status === "pending"
          ? `${kinName} wants to share exact map locations for 2 hours so you can meet up easily.`
          : status === "accepted"
          ? "Exact location sharing is active for 2 hours."
          : "Request declined."}
      </p>

      {status === "pending" && (
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onAccept}
            className="flex-1 py-2.5 bg-sunset text-white rounded-xl text-xs font-bold hover:bg-sunset-dark transition-all cursor-pointer"
          >
            Accept (2h Share)
          </button>
          <button
            type="button"
            onClick={onDecline}
            className="px-4 py-2.5 bg-slate/5 text-slate/70 rounded-xl text-xs font-bold hover:bg-slate/10 transition-all cursor-pointer"
          >
            Decline
          </button>
        </div>
      )}
    </div>
  );
}

function ChatThread({
  conv,
  tier,
}: {
  conv: Kin;
  tier: UserTier;
}) {
  const store = useMessagesStore();
  const perms = getTierPermissions(tier);

  const session = store.sessions[conv.id] || {
    trustStatus: "BLURRED",
    handshakeExpiry: null,
    isSOSActive: false,
    proximityLevel: 1,
    messages: [],
  };

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [verifyPrompt, setVerifyPrompt] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages]);

  const handleRequestHandshake = () => {
    if (!perms.canShareExactLocation) {
      setVerifyPrompt(true);
      return;
    }
    setVerifyPrompt(false);
    store.addMessage(conv.id, {
      fromMe: true,
      text: "Requested 2-hour exact location share",
      type: "handshake_request",
      handshakeStatus: "pending",
    });
  };

  const handleAcceptHandshake = () => {
    if (!perms.canShareExactLocation) {
      setVerifyPrompt(true);
      return;
    }
    setVerifyPrompt(false);
    store.updateTrustStatus(conv.id, "PRECISE", 2);
    store.addMessage(conv.id, {
      fromMe: true,
      text: "Exact location sharing accepted for 2 hours.",
    });
  };

  const handleSend = async () => {
    if (!perms.canMessage || !input.trim() || isTyping) return;

    const userText = input.trim();
    store.addMessage(conv.id, { fromMe: true, text: userText });
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userText,
          kinName: conv.name,
          kinVibe: conv.vibe,
          location: conv.location,
          history: session.messages,
        }),
      });

      if (!response.ok) throw new Error("Connection failed");
      const data = await response.json();

      if (data.text) {
        store.addMessage(conv.id, { fromMe: false, text: data.text });
      } else {
        throw new Error("No reply");
      }
    } catch {
      store.addMessage(conv.id, {
        fromMe: false,
        text: "Sorry, my signal dropped for a moment. Send that again in a second!",
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F9F8F6]">
      {/* Map Area */}
      <div className="h-[34%] w-full relative overflow-hidden flex-shrink-0 border-b border-slate/10">
        <RadarMiniMap
          kinLat={conv.lat}
          kinLng={conv.lng}
          trustStatus={session.trustStatus}
          isSOSActive={session.isSOSActive}
        />

        <div className="absolute top-4 left-4 right-4 z-[600] pointer-events-none">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 p-2.5 bg-white/95 backdrop-blur-md border border-slate/10 rounded-xl shadow-sm pointer-events-auto">
              <div className="relative w-8 h-8 rounded-full overflow-hidden">
                <Image src={conv.image} alt={conv.name} fill className="object-cover" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate">{conv.name}</h4>
                <div className="flex items-center gap-1">
                  <Lock
                    className={cn(
                      "w-3 h-3",
                      session.trustStatus === "BLURRED" ? "text-slate/60" : "text-green-600"
                    )}
                  />
                  <span className="text-xs font-medium text-slate/65">
                    {session.trustStatus === "BLURRED" ? "Approximate Area" : "Exact Location"}
                  </span>
                </div>
              </div>
            </div>

            {session.trustStatus === "BLURRED" && (
              <button
                type="button"
                onClick={handleRequestHandshake}
                className="px-3.5 py-2.5 bg-white hover:bg-slate hover:text-white text-slate border border-slate/15 rounded-xl shadow-sm pointer-events-auto transition-all flex items-center gap-2 text-xs font-bold"
              >
                {perms.canShareExactLocation ? (
                  <ShieldCheck className="w-4 h-4" />
                ) : (
                  <Lock className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">Share Exact Location</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info Bar */}
      <div className="px-5 py-3 border-b border-slate/10 bg-white flex-shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate/70">
            <Navigation className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">About 800m away</span>
          </div>
          <div
            className={cn(
              "px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5",
              conv.verified
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-slate/5 text-slate/65 border-slate/10"
            )}
          >
            {conv.verified ? "ID Verified" : "Not Verified"}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => store.archiveChat(conv.id, conv.name, conv.location, conv.vibe)}
            className="flex items-center gap-1.5 text-slate/65 hover:text-slate transition-all cursor-pointer text-xs font-semibold"
          >
            <History className="w-4 h-4" />
            <span className="hidden md:inline">Save to Photos</span>
          </button>
          <div className="w-px h-4 bg-slate/10" />
          <button
            type="button"
            className="text-red-600/70 hover:text-red-600 transition-all cursor-pointer"
            title="Report user"
            aria-label="Report user"
          >
            <AlertTriangle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4 flex flex-col items-center">
        <div className="px-4 py-1.5 bg-slate/5 rounded-full text-xs font-semibold text-slate/65">
          Private chat · Your exact location stays hidden until you choose to share it
        </div>

        {verifyPrompt && (
          <div className="w-full max-w-md p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-amber-900">Verified Kin Feature</p>
              <p className="text-xs text-amber-900/80 font-medium">
                {tier === "guest"
                  ? "Sign up and verify your ID to share exact 2-hour meet-up locations."
                  : "Verify your ID to unlock exact 2-hour meet-up locations."}
              </p>
            </div>
            <Link
              href={tier === "guest" ? "/onboarding" : "/verify"}
              className="px-4 py-2 bg-sunset text-white rounded-xl text-xs font-bold shrink-0 hover:bg-sunset-dark transition-colors"
            >
              {tier === "guest" ? "Join Free" : "Verify ID"}
            </Link>
          </div>
        )}

        {session.messages.map((msg: Message) => (
          <div key={msg.id} className={cn("w-full flex", msg.fromMe ? "justify-end" : "justify-start")}>
            {msg.type === "handshake_request" ? (
              <HandshakeCard
                kinName={conv.name}
                status={msg.handshakeStatus || "pending"}
                onAccept={handleAcceptHandshake}
                onDecline={() => {}}
              />
            ) : (
              <div
                className={cn(
                  "max-w-[82%] px-5 py-3.5 text-sm leading-relaxed",
                  msg.fromMe
                    ? "bg-slate text-white rounded-2xl rounded-br-sm"
                    : "bg-white text-slate rounded-2xl rounded-bl-sm border border-slate/10"
                )}
              >
                {msg.text}
                <div
                  className={cn(
                    "text-xs mt-1 font-medium opacity-65",
                    msg.fromMe ? "text-right" : "text-left"
                  )}
                >
                  {msg.time}
                </div>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="w-full flex justify-start">
            <div className="bg-white px-5 py-3.5 rounded-2xl border border-slate/10 flex items-center gap-1.5">
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0 }} className="w-1.5 h-1.5 bg-slate/50 rounded-full" />
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }} className="w-1.5 h-1.5 bg-slate/50 rounded-full" />
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }} className="w-1.5 h-1.5 bg-slate/50 rounded-full" />
            </div>
          </div>
        )}
        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate/10">
        {!perms.canMessage ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#F9F8F6] border border-slate/10">
            <span className="text-xs font-semibold text-slate/75 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate/60 shrink-0" />
              Create a free account to send messages to {conv.name}.
            </span>
            <Link
              href="/onboarding"
              className="px-4 py-2 rounded-lg bg-sunset text-white text-xs font-bold hover:bg-sunset-dark transition-colors text-center shrink-0"
            >
              Join Free
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={`Write a message to ${conv.name}...`}
              className="flex-1 h-12 px-4 bg-[#F9F8F6] border border-slate/10 rounded-xl text-sm text-slate placeholder:text-slate/55 focus:outline-none focus:bg-white focus:border-slate/25 transition-all font-medium"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-12 h-12 bg-sunset text-white rounded-xl flex items-center justify-center hover:bg-sunset-dark transition-all disabled:opacity-40 cursor-pointer"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesView({
  onVerify,
  tier = "verified",
}: {
  onVerify?: () => void;
  tier?: UserTier;
}) {
  const store = useMessagesStore();
  const perms = getTierPermissions(tier);

  useEffect(() => {
    if (Object.keys(store.sessions).length === 0) {
      store.addMessage("1", { fromMe: false, text: "Hey! Saw your profile — are you surfing at Cloud 9 tomorrow morning?" });
      store.addMessage("1", { fromMe: true, text: "Yes! Meeting at the boardwalk at 6am, then getting fresh seafood lunch in General Luna." });
      store.addMessage("1", { fromMe: false, text: "Count me in! There is a great local spot right by the pier." });

      store.addMessage("2", { fromMe: true, text: "Hey Liam! Are you joining the early boat to Big Lagoon in El Nido?" });
      store.addMessage("2", { fromMe: false, text: "Yes! Leaving Corong-Corong at 6:30am beats the crowds." });
    }
  }, [store]);

  const activeConv = KINS.find((c) => c.id === store.activeId) || KINS[0];

  return (
    <div className="flex h-[calc(100vh-160px)] bg-white rounded-2xl border border-slate/10 shadow-sm overflow-hidden">
      {/* Sidebar List */}
      <div
        className={cn(
          "w-full md:w-80 border-r border-slate/10 flex flex-col bg-[#F9F8F6]/50",
          activeConv ? "hidden md:flex" : "flex"
        )}
      >
        <div className="p-6 border-b border-slate/10">
          <h2 className="text-2xl font-bold text-slate">Messages</h2>
          <p className="text-xs font-medium text-slate/60 mt-0.5 mb-5">Your active chats</p>
          <input
            placeholder="Search people..."
            className="w-full px-4 py-2.5 bg-white border border-slate/10 rounded-xl text-xs font-medium text-slate focus:outline-none focus:border-slate/25"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {KINS.map((c) => {
            const session = store.sessions[c.id];
            const lastMsg = session?.messages[session.messages.length - 1];
            const isSelected = activeConv?.id === c.id;

            return (
              <button
                type="button"
                key={c.id}
                onClick={() => store.setActiveId(c.id)}
                className={cn(
                  "w-full p-3.5 text-left rounded-xl transition-all flex items-center gap-3.5 cursor-pointer",
                  isSelected ? "bg-slate text-white" : "hover:bg-white"
                )}
              >
                <div className="relative w-11 h-11 rounded-full overflow-hidden flex-shrink-0">
                  <Image src={c.image} alt={c.name} fill className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-sm leading-none truncate">{c.name}</h4>
                    {lastMsg && (
                      <span className={cn("text-xs opacity-60 shrink-0", isSelected ? "text-white" : "text-slate")}>
                        {lastMsg.time}
                      </span>
                    )}
                  </div>
                  <p className={cn("text-xs mt-1 truncate", isSelected ? "text-white/75" : "text-slate/60")}>
                    {c.location}
                  </p>
                  {lastMsg && (
                    <p className={cn("text-xs mt-1 truncate opacity-80", isSelected ? "text-white" : "text-slate")}>
                      {lastMsg.text}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {!perms.canShareExactLocation && (
          <div className="p-4 border-t border-slate/10">
            <button
              type="button"
              onClick={onVerify}
              className="w-full text-left p-4 bg-white border border-slate/15 rounded-xl hover:bg-slate/5 transition-all cursor-pointer space-y-1"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-slate">
                <ShieldCheck className="w-4 h-4 text-sunset" />
                <span>Unlock Exact Meet-Up Pins</span>
              </div>
              <p className="text-xs text-slate/65 font-medium">
                Verify your ID to share exact map locations for 2 hours.
              </p>
            </button>
          </div>
        )}
      </div>

      {/* Chat Thread */}
      <div className="flex-1 flex flex-col">
        {activeConv && <ChatThread conv={activeConv} tier={tier} />}
      </div>
    </div>
  );
}
