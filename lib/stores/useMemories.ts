import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type HubId = "siargao" | "el-nido" | "cebu" | "coron";
export type PhotoVisibility = "crew_only" | "hub_public";

export interface TagHubOption {
  id: HubId;
  label: string;
}

export interface TagEventOption {
  id: string;
  label: string;
  hubId: HubId;
  defaultLocation: string;
  defaultKins: string[];
  defaultVibe: string;
}

export interface TagKinOption {
  id: string;
  name: string;
  shortName: string;
  hubId: HubId;
}

export interface TripMemory {
  id: string;
  url: string;
  location: string;
  caption: string;
  hubId: HubId;
  eventId: string | null;
  taggedKinIds: string[];
  vibe: string;
  visibility: PhotoVisibility;
  likes: number;
  date: string;
  isUserUpload?: boolean;
  exifStripped?: boolean;
}

export const TAG_HUBS: TagHubOption[] = [
  { id: "siargao", label: "Siargao" },
  { id: "el-nido", label: "El Nido" },
  { id: "cebu", label: "Cebu & Moalboal" },
  { id: "coron", label: "Coron" },
];

export const TAG_EVENTS: TagEventOption[] = [
  {
    id: "stop-1",
    label: "Early Morning Surf & Breakfast Bowls",
    hubId: "siargao",
    defaultLocation: "Cloud 9 Boardwalk, Siargao",
    defaultKins: ["1", "2", "me"],
    defaultVibe: "Surf",
  },
  {
    id: "stop-2",
    label: "Group Lunch & Local Seafood Tasting",
    hubId: "siargao",
    defaultLocation: "General Luna Coastal Market",
    defaultKins: ["3", "1", "2", "4", "me"],
    defaultVibe: "Food",
  },
  {
    id: "stop-3",
    label: "Sunset Palm River Swing & Photos",
    hubId: "siargao",
    defaultLocation: "Maasin River, Siargao",
    defaultKins: ["2", "1", "3"],
    defaultVibe: "Sunset",
  },
  {
    id: "stop-4",
    label: "Beach Bonfire & Shared Group Dinner",
    hubId: "siargao",
    defaultLocation: "Malinao Beach, Siargao",
    defaultKins: ["4", "1", "3", "2", "me"],
    defaultVibe: "Crew",
  },
  {
    id: "tomorrow-boat",
    label: "Sugba Lagoon & Kawhagan Boat Trip",
    hubId: "siargao",
    defaultLocation: "Sugba Lagoon, Siargao",
    defaultKins: ["1", "2", "3", "me"],
    defaultVibe: "Boat Trip",
  },
  {
    id: "el-nido-lagoon",
    label: "Big Lagoon Sunrise Boat Trip",
    hubId: "el-nido",
    defaultLocation: "Big Lagoon, El Nido",
    defaultKins: ["3", "2"],
    defaultVibe: "Boat Trip",
  },
  {
    id: "kawasan-falls",
    label: "Kawasan Falls Swim & Beach Grill",
    hubId: "cebu",
    defaultLocation: "Kawasan Falls, Cebu",
    defaultKins: ["3", "4"],
    defaultVibe: "Waterfalls",
  },
  {
    id: "kayangan-lake",
    label: "Kayangan Lake Swim & Snorkel",
    hubId: "coron",
    defaultLocation: "Kayangan Lake, Coron",
    defaultKins: ["1", "4"],
    defaultVibe: "Swimming",
  },
];

export const TAG_KINS: TagKinOption[] = [
  { id: "1", name: "Suki", shortName: "Suki", hubId: "siargao" },
  { id: "2", name: "Liam", shortName: "Liam", hubId: "el-nido" },
  { id: "3", name: "Nara", shortName: "Nara", hubId: "cebu" },
  { id: "4", name: "Kevin", shortName: "Kevin", hubId: "coron" },
  { id: "me", name: "Mia (You)", shortName: "Mia", hubId: "siargao" },
];

export const TAG_VIBES = [
  "Surf",
  "Boat Trip",
  "Food",
  "Sunset",
  "Waterfalls",
  "Swimming",
  "Crew",
];

export function getHubLabel(hubId: HubId): string {
  return TAG_HUBS.find((h) => h.id === hubId)?.label || hubId;
}

export function getEventLabel(eventId: string | null): string | null {
  if (!eventId) return null;
  return TAG_EVENTS.find((e) => e.id === eventId)?.label || null;
}

export function getKinName(kinId: string): string {
  return TAG_KINS.find((k) => k.id === kinId)?.shortName || kinId;
}

export const SEED_MEMORIES: TripMemory[] = [
  {
    id: "seed-1",
    url: "https://images.pexels.com/photos/3533659/pexels-photo-3533659.jpeg?auto=compress&cs=tinysrgb&w=800",
    location: "Cloud 9 Boardwalk, Siargao",
    caption: "Early morning waves and fresh coconut coffee with the group.",
    hubId: "siargao",
    eventId: "stop-1",
    taggedKinIds: ["1", "2", "me"],
    vibe: "Surf",
    visibility: "hub_public",
    likes: 34,
    date: "14 October 2026",
  },
  {
    id: "seed-2",
    url: "https://images.pexels.com/photos/13874296/pexels-photo-13874296.jpeg?auto=compress&cs=tinysrgb&w=800",
    location: "Big Lagoon, El Nido",
    caption: "Took the 6:00 AM boat together and had the whole lagoon to ourselves.",
    hubId: "el-nido",
    eventId: "el-nido-lagoon",
    taggedKinIds: ["3", "2"],
    vibe: "Boat Trip",
    visibility: "hub_public",
    likes: 52,
    date: "18 October 2026",
  },
  {
    id: "seed-3",
    url: "https://images.pexels.com/photos/17263722/pexels-photo-17263722.jpeg?auto=compress&cs=tinysrgb&w=800",
    location: "Kawasan Falls, Cebu",
    caption: "Waterfall swim followed by grilled seafood on Panagsama Beach.",
    hubId: "cebu",
    eventId: "kawasan-falls",
    taggedKinIds: ["3", "4"],
    vibe: "Waterfalls",
    visibility: "hub_public",
    likes: 29,
    date: "22 October 2026",
  },
  {
    id: "seed-4",
    url: "https://images.pexels.com/photos/13518466/pexels-photo-13518466.jpeg?auto=compress&cs=tinysrgb&w=800",
    location: "Kayangan Lake, Coron",
    caption: "Swimming in crystal-clear water surrounded by limestone cliffs.",
    hubId: "coron",
    eventId: "kayangan-lake",
    taggedKinIds: ["1", "4"],
    vibe: "Swimming",
    visibility: "hub_public",
    likes: 64,
    date: "27 October 2026",
  },
];

interface MemoriesState {
  memories: TripMemory[];
  likedIds: Record<string, boolean>;

  addMemories: (newItems: TripMemory[]) => void;
  removeMemory: (id: string) => void;
  updateMemoryTags: (
    id: string,
    updates: Partial<
      Pick<
        TripMemory,
        "hubId" | "eventId" | "taggedKinIds" | "vibe" | "visibility" | "caption" | "location"
      >
    >
  ) => void;
  untagKinFromMemory: (memoryId: string, kinId: string) => void;
  toggleLike: (memoryId: string) => void;
}

export const useMemoriesStore = create<MemoriesState>()(
  persist(
    (set) => ({
      memories: SEED_MEMORIES,
      likedIds: {},

      addMemories: (newItems) =>
        set((state) => ({
          memories: [...newItems, ...state.memories],
        })),

      removeMemory: (id) =>
        set((state) => ({
          memories: state.memories.filter((m) => m.id !== id),
        })),

      updateMemoryTags: (id, updates) =>
        set((state) => ({
          memories: state.memories.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),

      untagKinFromMemory: (memoryId, kinId) =>
        set((state) => ({
          memories: state.memories.map((m) =>
            m.id === memoryId
              ? { ...m, taggedKinIds: m.taggedKinIds.filter((k) => k !== kinId) }
              : m
          ),
        })),

      toggleLike: (memoryId) =>
        set((state) => ({
          likedIds: {
            ...state.likedIds,
            [memoryId]: !state.likedIds[memoryId],
          },
        })),
    }),
    {
      name: "travelkin-memories-store-v1",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
