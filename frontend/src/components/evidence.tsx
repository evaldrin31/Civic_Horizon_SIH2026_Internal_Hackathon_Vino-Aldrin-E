"use client";

import { Evidence, SourceType, VerificationStatus } from "@/lib/api/types";
import { VerificationBadge } from "./verification-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatRelativeTime, formatCategory } from "@/lib/utils";
import { 
  FileText, 
  Camera, 
  User, 
  Calendar, 
  Building2, 
  Scale, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Shield
} from "lucide-react";

interface EvidenceCardProps {
  evidence: Evidence;
  showAttribute?: boolean;
}

interface EvidenceListProps {
  evidence: Evidence[];
  groupByStatus?: boolean;
}

const sourceTypeIcons: Record<SourceType, React.ReactNode> = {
  government: <Shield className="h-4 w-4" />,
  professional_audit: <CheckCircle2 className="h-4 w-4" />,
  official_venue: <Building2 className="h-4 w-4" />,
  direct_observation: <Camera className="h-4 w-4" />,
  institutional_dataset: <FileText className="h-4 w-4" />,
  community_observation: <User className="h-4 w-4" />,
  public_review: <FileText className="h-4 w-4" />,
  ai_inference: <AlertCircle className="h-4 w-4" />,
};

const sourceTypeLabels: Record<SourceType, string> = {
  government: "Government/Regulatory",
  professional_audit: "Professional Audit",
  official_venue: "Official Venue Source",
  direct_observation: "Direct Observation",
  institutional_dataset: "Institutional Dataset",
  community_observation: "Community Observation",
  public_review: "Public Review",
  ai_inference: "AI Inference",
};

// Source hierarchy ranking (higher = more trusted)
const sourceHierarchy: Record<SourceType, number> = {
  government: 8,
  professional_audit: 7,
  official_venue: 6,
  direct_observation: 5,
  institutional_dataset: 4,
  community_observation: 3,
  public_review: 2,
  ai_inference: 1,
};

export function SourceTypeBadge({ sourceType }: { sourceType: SourceType }) {
  const trustLevel = sourceHierarchy[sourceType];
  let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
  
  if (trustLevel >= 6) variant = "default";
  else if (trustLevel >= 4) variant = "secondary";
  else if (trustLevel >= 2) variant = "outline";
  else variant = "destructive";

  return (
    <Badge variant={variant} className="inline-flex items-center gap-1">
      {sourceTypeIcons[sourceType]}
      <span className="text-xs">{sourceTypeLabels[sourceType]}</span>
    </Badge>
  );
}

export function ConfidenceIndicator({ confidence }: { confidence: number }) {
  let colorClass = "bg-red-500";
  let label = "Low confidence";
  
  if (confidence >= 0.9) {
    colorClass = "bg-green-500";
    label = "High confidence";
  } else if (confidence >= 0.7) {
    colorClass = "bg-blue-500";
    label = "Good confidence";
  } else if (confidence >= 0.5) {
    colorClass = "bg-amber-500";
    label = "Moderate confidence";
  }

  return (
    <div className="flex items-center gap-2" title={`${label}: ${Math.round(confidence * 100)}%`}>
      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClass} transition-all`}
          style={{ width: `${confidence * 100}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{Math.round(confidence * 100)}%</span>
    </div>
  );
}

export function EvidenceCard({ evidence, showAttribute = false }: EvidenceCardProps) {
  const source = evidence.source;
  
  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            {showAttribute && evidence.attribute && (
              <CardDescription className="mb-1">
                About: {evidence.attribute.attribute_name}
              </CardDescription>
            )}
            <CardTitle className="text-base">
              {evidence.evidence_text || "Evidence recorded"}
            </CardTitle>
          </div>
          <VerificationBadge status={evidence.verification_status} size="sm" />
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Source Information */}
        {source && (
          <div className="flex items-center gap-2">
            <SourceTypeBadge sourceType={source.source_type} />
            {source.source_name && (
              <span className="text-sm text-muted-foreground">{source.source_name}</span>
            )}
          </div>
        )}
        
        {/* Evidence Details */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          {evidence.observed_at && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Observed: {formatDate(evidence.observed_at)}</span>
            </div>
          )}
          {evidence.collected_at && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Recorded: {formatRelativeTime(evidence.collected_at)}</span>
            </div>
          )}
          {evidence.collector && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <User className="h-3 w-3" />
              <span>By: {evidence.collector}</span>
            </div>
          )}
        </div>
        
        {/* Confidence */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-sm text-muted-foreground">Confidence:</span>
          <ConfidenceIndicator confidence={evidence.confidence} />
        </div>
        
        {/* Notes */}
        {evidence.notes && (
          <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
            {evidence.notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function EvidenceList({ evidence, groupByStatus = false }: EvidenceListProps) {
  if (!evidence || evidence.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No evidence recorded</p>
        <p className="text-sm mt-1">This accessibility claim has not been backed by evidence yet.</p>
      </div>
    );
  }

  if (!groupByStatus) {
    return (
      <div className="space-y-4">
        {evidence.map((e) => (
          <EvidenceCard key={e.evidence_id} evidence={e} />
        ))}
      </div>
    );
  }

  // Group by verification status
  const grouped = evidence.reduce((acc, e) => {
    if (!acc[e.verification_status]) {
      acc[e.verification_status] = [];
    }
    acc[e.verification_status].push(e);
    return acc;
  }, {} as Record<VerificationStatus, Evidence[]>);

  const statusOrder: VerificationStatus[] = ['verified', 'corroborated', 'reported', 'unverified', 'conflicting', 'outdated'];

  return (
    <div className="space-y-6">
      {statusOrder.map((status) => {
        const statusEvidence = grouped[status];
        if (!statusEvidence || statusEvidence.length === 0) return null;

        return (
          <div key={status}>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <VerificationBadge status={status} size="sm" />
              <span className="text-muted-foreground">({statusEvidence.length})</span>
            </h4>
            <div className="space-y-4">
              {statusEvidence.map((e) => (
                <EvidenceCard key={e.evidence_id} evidence={e} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Compact version for lists
export function EvidenceSummary({ 
  evidence, 
  showCount = true 
}: { 
  evidence: Evidence[];
  showCount?: boolean;
}) {
  if (!evidence || evidence.length === 0) {
    return (
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <AlertCircle className="h-3 w-3" />
        <span>No evidence</span>
      </div>
    );
  }

  const verifiedCount = evidence.filter(e => e.verification_status === 'verified').length;
  const avgConfidence = evidence.reduce((sum, e) => sum + e.confidence, 0) / evidence.length;

  return (
    <div className="flex items-center gap-2">
      {showCount && (
        <Badge variant="outline" className="text-xs">
          <FileText className="h-3 w-3 mr-1" />
          {evidence.length} evidence
        </Badge>
      )}
      {verifiedCount > 0 && (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {verifiedCount} verified
        </Badge>
      )}
      <ConfidenceIndicator confidence={avgConfidence} />
    </div>
  );
}
