import React from "react";
import type { Tier } from "../utils/pricing";
import { canAccess } from "../utils/pricing";
import UpgradePrompt from "./UpgradePrompt";

interface FeatureGateProps {
  featureId: string;
  tier: Tier;
  children: React.ReactNode;
  onUpgrade: () => void;
}

export default function FeatureGate({
  featureId,
  tier,
  children,
  onUpgrade,
}: FeatureGateProps) {
  if (canAccess(featureId, tier)) {
    return <>{children}</>;
  }
  return <UpgradePrompt featureId={featureId} onUpgrade={onUpgrade} />;
}
