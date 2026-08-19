"use client";

import { VerificationStatus } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  HelpCircle, 
  Clock, 
  ShieldCheck, 
  AlertTriangle,
  XCircle 
} from "lucide-react";

interface VerificationBadgeProps {
  status: VerificationStatus;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const statusConfig: Record<VerificationStatus, {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: React.ReactNode;
  description: string;
  color: string;
}> = {
  unverified: {
    label: "Unverified",
    variant: "outline",
    icon: <HelpCircle className="h-3 w-3" />,
    description: "Initial state - no verification performed",
    color: "text-gray-500 border-gray-300",
  },
  reported: {
    label: "Reported",
    variant: "secondary",
    icon: <AlertCircle className="h-3 w-3" />,
    description: "Claim made, not independently verified",
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  corroborated: {
    label: "Corroborated",
    variant: "default",
    icon: <Clock className="h-3 w-3" />,
    description: "Multiple sources agree",
    color: "text-indigo-600 bg-indigo-50 border-indigo-200",
  },
  verified: {
    label: "Verified",
    variant: "default",
    icon: <ShieldCheck className="h-3 w-3" />,
    description: "Confirmed by authoritative source",
    color: "text-green-700 bg-green-50 border-green-200",
  },
  conflicting: {
    label: "Conflicting",
    variant: "destructive",
    icon: <AlertTriangle className="h-3 w-3" />,
    description: "Different sources disagree",
    color: "text-amber-700 bg-amber-50 border-amber-200",
  },
  outdated: {
    label: "Outdated",
    variant: "outline",
    icon: <XCircle className="h-3 w-3" />,
    description: "Previously verified but may no longer be accurate",
    color: "text-red-600 border-red-300",
  },
};

export function VerificationBadge({ 
  status, 
  showLabel = true,
  size = "md" 
}: VerificationBadgeProps) {
  const config = statusConfig[status];
  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0",
    md: "text-xs px-2 py-0.5",
    lg: "text-sm px-3 py-1",
  };

  return (
    <Badge 
      variant={config.variant}
      className={`inline-flex items-center gap-1 font-medium ${sizeClasses[size]} ${config.color}`}
      title={config.description}
    >
      {config.icon}
      {showLabel && <span>{config.label}</span>}
    </Badge>
  );
}

export function VerificationIcon({ status }: { status: VerificationStatus }) {
  return statusConfig[status].icon;
}

export function VerificationLabel({ status }: { status: VerificationStatus }) {
  return <span>{statusConfig[status].label}</span>;
}

export function VerificationDescription({ status }: { status: VerificationStatus }) {
  return <span className="text-sm text-muted-foreground">{statusConfig[status].description}</span>;
}

// For displaying verification states in a legend or explanation
export function VerificationLegend() {
  return (
    <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
      <h4 className="font-medium text-sm">Verification Levels</h4>
      <div className="space-y-2">
        {(Object.keys(statusConfig) as VerificationStatus[]).map((status) => (
          <div key={status} className="flex items-center gap-2">
            <VerificationBadge status={status} size="sm" />
            <span className="text-xs text-muted-foreground">
              {statusConfig[status].description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
