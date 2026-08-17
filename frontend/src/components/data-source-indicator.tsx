/**
 * Data Source Indicator
 * 
 * Shows users whether they're viewing:
 * - Real API data
 * - Demo/synthetic data
 * - API errors
 * - Loading state
 * - Empty results
 */

"use client";

import { DataSource } from "@/lib/hooks/use-data";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  AlertTriangle,
  Loader2,
  Search,
  WifiOff,
  CheckCircle2,
} from "lucide-react";

interface DataSourceIndicatorProps {
  source: DataSource;
  className?: string;
}

export function DataSourceIndicator({ source, className }: DataSourceIndicatorProps) {
  const configs: Record<DataSource, {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ReactNode;
    description: string;
  }> = {
    api: {
      label: "Live Data",
      variant: "default",
      icon: <CheckCircle2 className="h-3 w-3" />,
      description: "Real-time data from the accessibility database",
    },
    demo: {
      label: "Demo Data",
      variant: "secondary",
      icon: <Database className="h-3 w-3" />,
      description: "Synthetic data for development and testing",
    },
    error: {
      label: "Error",
      variant: "destructive",
      icon: <WifiOff className="h-3 w-3" />,
      description: "Failed to load data from the server",
    },
    loading: {
      label: "Loading...",
      variant: "outline",
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
      description: "Fetching data from the server",
    },
    empty: {
      label: "No Results",
      variant: "outline",
      icon: <Search className="h-3 w-3" />,
      description: "No venues match your search criteria",
    },
  };

  const config = configs[source];

  return (
    <Badge
      variant={config.variant}
      className={`inline-flex items-center gap-1.5 ${className}`}
      title={config.description}
    >
      {config.icon}
      <span>{config.label}</span>
    </Badge>
  );
}

/**
 * Data source alert banner for errors
 */
interface DataSourceAlertProps {
  source: DataSource;
  error?: string | null;
  onRetry?: () => void;
}

export function DataSourceAlert({ source, error, onRetry }: DataSourceAlertProps) {
  if (source === "api") return null;
  if (source === "loading") return null;

  if (source === "error") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-red-800">Failed to load data</h4>
            <p className="text-sm text-red-600 mt-1">
              {error || "Could not connect to the accessibility database."}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-2 text-sm font-medium text-red-700 hover:text-red-800 underline"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (source === "demo") {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
        <div className="flex items-start gap-2">
          <Database className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            Showing demo data. Connect to the backend API for real accessibility information.
          </p>
        </div>
      </div>
    );
  }

  if (source === "empty") {
    return (
      <div className="bg-muted rounded-lg p-8 text-center">
        <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <h3 className="font-medium text-lg">No venues found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your search criteria or filters
        </p>
      </div>
    );
  }

  return null;
}
