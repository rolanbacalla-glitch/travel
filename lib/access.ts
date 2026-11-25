export type UserTier = "guest" | "member" | "verified";

export interface TierPermissions {
  tier: UserTier;
  label: string;
  shortLabel: string;
  canBookmark: boolean;
  canUpvote: boolean;
  canMessage: boolean;
  canPostUpdate: boolean;
  canEditProfile: boolean;
  // Verified Kin-only capabilities
  canEditItinerary: boolean;
  canJoinTripSplits: boolean;
  canShareExactLocation: boolean;
  canTriggerSOS: boolean;
  canUploadMemories: boolean;
}

export function getTierPermissions(tier: UserTier): TierPermissions {
  if (tier === "verified") {
    return {
      tier: "verified",
      label: "Verified Kin",
      shortLabel: "Verified Kin",
      canBookmark: true,
      canUpvote: true,
      canMessage: true,
      canPostUpdate: true,
      canEditProfile: true,
      canEditItinerary: true,
      canJoinTripSplits: true,
      canShareExactLocation: true,
      canTriggerSOS: true,
      canUploadMemories: true,
    };
  }

  if (tier === "member") {
    return {
      tier: "member",
      label: "Standard Member",
      shortLabel: "Member",
      canBookmark: true,
      canUpvote: true,
      canMessage: true,
      canPostUpdate: true,
      canEditProfile: true,
      canEditItinerary: false,
      canJoinTripSplits: false,
      canShareExactLocation: false,
      canTriggerSOS: false,
      canUploadMemories: false,
    };
  }

  return {
    tier: "guest",
    label: "Guest Preview",
    shortLabel: "Guest",
    canBookmark: false,
    canUpvote: false,
    canMessage: false,
    canPostUpdate: false,
    canEditProfile: false,
    canEditItinerary: false,
    canJoinTripSplits: false,
    canShareExactLocation: false,
    canTriggerSOS: false,
    canUploadMemories: false,
  };
}
