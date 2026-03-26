import { Construction } from "lucide-react";

export function ComingSoon({ feature }: { feature: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-12 h-12 rounded-sm bg-primary-50 border border-border flex items-center justify-center mb-4">
        <Construction size={22} className="text-primary-400" />
      </div>
      <h2 className="text-sm font-semibold text-text-primary mb-1">{feature}</h2>
      <p className="text-xs text-text-secondary max-w-xs">
        This feature is coming in Phase 2. The foundation and navigation are in place.
      </p>
    </div>
  );
}
