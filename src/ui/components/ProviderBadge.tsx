import type { ProviderMode } from "../../schemas/provider";
import { providerLabels } from "../labels";

type ProviderBadgeProps = {
  label: string;
  provider: ProviderMode;
  fallbackUsed?: boolean;
};

export function ProviderBadge({ label, provider, fallbackUsed }: ProviderBadgeProps) {
  return (
    <span className={fallbackUsed ? "provider-badge warning" : "provider-badge"}>
      {label}: {providerLabels[provider]}
      {fallbackUsed ? " / Demo Modeに切替" : ""}
    </span>
  );
}
