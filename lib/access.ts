export type UserTier = "guest" | "member" | "verified";

export interface TierPermissions {
  tier: UserTier;
  label: string;
  shortLabel: string;
  verificationLevel: "none" | "email_phone" | "id_liveness";
  canViewTrustPassport: boolean;
  canBookmark: boolean;
  canUpvote: boolean;
  canPostUpdate: boolean;
  canEditProfile: boolean;
  // Verified Kin-only safety capabilities (UK Online Safety Act & Verified-Only Contact Policy)
  canMessage: boolean;
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
      verificationLevel: "id_liveness",
      canViewTrustPassport: true,
      canBookmark: true,
      canUpvote: true,
      canPostUpdate: true,
      canEditProfile: true,
      canMessage: true,
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
      verificationLevel: "email_phone",
      canViewTrustPassport: true,
      canBookmark: true,
      canUpvote: true,
      canPostUpdate: true,
      canEditProfile: true,
      // Safety-first policy: direct messaging and trip joins require ID + Liveness check
      canMessage: false,
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
    verificationLevel: "none",
    canViewTrustPassport: true,
    canBookmark: false,
    canUpvote: false,
    canPostUpdate: false,
    canEditProfile: false,
    canMessage: false,
    canEditItinerary: false,
    canJoinTripSplits: false,
    canShareExactLocation: false,
    canTriggerSOS: false,
    canUploadMemories: false,
  };
}
