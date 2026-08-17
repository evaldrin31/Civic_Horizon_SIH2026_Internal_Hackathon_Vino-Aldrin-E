"use client";

import { Evidence, SourceType, VerificationStatus, AttributeValue } from "@/lib/api/types";
import { VerificationBadge } from "./verification-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatRelativeTime } from "@/lib/utils";
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
  Shield,
  HelpCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Info
} from "lucide-react";
import { ReactNode } from "react";

interface EvidenceCardProps {
  evidence: Evidence;
  showAttribute?: boolean;
  showConflict?: boolean;
}

interface EvidenceListProps {
  evidence: Evidence[];
  groupByStatus?: boolean;
  showConflicts?: boolean;
}

interface ConflictDisplayProps {
  evidence: Evidence[];
}

interface FreshnessIndicatorProps {
  observedAt?: string;
  collectedAt: string;
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

// Helper: Check if evidence has conflicting claims about the same attribute
export function hasConflictingEvidence(evidence: Evidence[]): boolean {
  if (evidence.length < 2) return false;
  
  // Group by attribute
  const byAttribute = evidence.reduce((acc, e) => {
    const attrId = e.attribute?.attribute_id || e.attribute_id;
    if (!acc[attrId]) {
      acc[attrId] = [];
    }
    acc[attrId].push(e);
    return acc;
  }, {} as Record<string, Evidence[]>);
  
  // Check for conflicts within each attribute
  return Object.values(byAttribute).some((attrEvidence) => {
    if (attrEvidence.length < 2) return false;
    
    // Get the claimed values
    const values = attrEvidence
      .map(e => e.attribute?.value)
      .filter((v): v is AttributeValue => v !== undefined);
    
    // Check if different values exist (excluding unknown)
    const nonUnknownValues = values.filter(v => v !== 'unknown');
    const uniqueValues = Array.from(new Set(nonUnknownValues));
    
    return uniqueValues.length > 1;
  });
}

// Helper: Get conflicts for a specific attribute
export function getAttributeConflicts(evidence: Evidence[]): Map<string, Evidence[]> {
  const conflicts = new Map<string, Evidence[]>();
  
  // Group by attribute
  const byAttribute = evidence.reduce((acc, e) => {
    const attrId = e.attribute?.attribute_id || e.attribute_id;
    if (!acc[attrId]) {
      acc[attrId] = [];
    }
    acc[attrId].push(e);
    return acc;
  }, {} as Record<string, Evidence[]>);
  
  // Find attributes with conflicts
  Object.entries(byAttribute).forEach(([attrId, attrEvidence]) => {
    if (attrEvidence.length < 2) return;
    
    const values = attrEvidence
      .map(e => e.attribute?.value)
      .filter((v): v is AttributeValue => v !== undefined);
    
    const nonUnknownValues = values.filter(v => v !== 'unknown');
    const uniqueValues = Array.from(new Set(nonUnknownValues));
    
    if (uniqueValues.length > 1) {
      conflicts.set(attrId, attrEvidence);
    }
  });
  
  return conflicts;
}

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

export function ConfidenceIndicator({ confidence }: { confidence: number | null | undefined }) {
  // Handle undefined/null confidence
  if (confidence === null || confidence === undefined) {
    return (
      <div className="flex items-center gap-2" title="Confidence not available">
        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gray-300" style={{ width: '0%' }} />
        </div>
        <span className="text-xs text-muted-foreground">N/A</span>
      </div>
    );
  }

  // Normalize confidence to 0-1 range
  const normalizedConfidence = Math.max(0, Math.min(1, confidence));
  
  let colorClass = "bg-red-500";
  let label = "Low confidence";
  
  if (normalizedConfidence >= 0.9) {
    colorClass = "bg-green-500";
    label = "High confidence";
  } else if (normalizedConfidence >= 0.7) {
    colorClass = "bg-blue-500";
    label = "Good confidence";
  } else if (normalizedConfidence >= 0.5) {
    colorClass = "bg-amber-500";
    label = "Moderate confidence";
  }

  return (
    <div className="flex items-center gap-2" title={`${label}: ${Math.round(normalizedConfidence * 100)}%`}>
      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClass} transition-all`}
          style={{ width: `${normalizedConfidence * 100}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{Math.round(normalizedConfidence * 100)}%</span>
    </div>
  );
}

export function FreshnessIndicator({ observedAt, collectedAt }: FreshnessIndicatorProps) {
  // Use observed_at if available, otherwise collected_at
  const timestamp = observedAt || collectedAt;
  
  if (!timestamp) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <HelpCircle className="h-3 w-3" />
        Date unknown
      </span>
    );
  }

  const date = new Date(timestamp);
  const now = new Date();
  const daysSince = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  
  let icon: ReactNode = <Clock className="h-3 w-3" />;
  let label = "";
  let colorClass = "text-muted-foreground";
  
  if (daysSince < 30) {
    icon = <CheckCircle2 className="h-3 w-3" />;
    label = "Recent";
    colorClass = "text-green-600";
  } else if (daysSince < 90) {
    icon = <Clock className="h-3 w-3" />;
    label = `${Math.floor(daysSince / 30)} months ago`;
    colorClass = "text-amber-600";
  } else if (daysSince < 365) {
    icon = <AlertCircle className="h-3 w-3" />;
    label = `${Math.floor(daysSince / 30)} months ago`;
    colorClass = "text-orange-600";
  } else {
    icon = <AlertTriangle className="h-3 w-3" />;
    label = `Over a year ago`;
    colorClass = "text-red-600";
  }

  return (
    <span className={`flex items-center gap-1 text-xs ${colorClass}`} title={`Observed: ${formatDate(timestamp)}`}>
      {icon}
      {label}
    </span>
  );
}

export function ConflictWarning({ evidence }: { evidence: Evidence[] }) {
  if (!hasConflictingEvidence(evidence)) {
    return null;
  }

  const conflicts = getAttributeConflicts(evidence);
  const conflictCount = conflicts.size;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-amber-900">
            Conflicting Reports
          </h4>
          <p className="text-sm text-amber-800 mt-1">
            {conflictCount} {conflictCount === 1 ? 'attribute has' : 'attributes have'} conflicting evidence from different sources. 
            Review the evidence below to understand the differences.
          </p>
        </div>
      </div>
    </div>
  );
}

export function EvidenceCard({ evidence, showAttribute = false, showConflict = false }: EvidenceCardProps) {
  const source = evidence.source;
  
  // Check if this evidence is part of a conflict
  const isConflicting = showConflict && evidence.verification_status === 'conflicting';
  
  return (
    <Card className={`border-l-4 ${isConflicting ? 'border-l-amber-500' : 'border-l-primary'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {showAttribute && evidence.attribute && (
              <CardDescription className="mb-1 flex items-center gap-2">
                <span className="font-medium">{evidence.attribute.attribute_name}</span>
                {evidence.attribute.value && (
                  <Badge variant="outline" className="text-xs">
                    {evidence.attribute.value === 'yes' && <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />}
                    {evidence.attribute.value === 'no' && <XCircle className="h-3 w-3 mr-1 text-red-500" />}
                    {evidence.attribute.value === 'partial' && <AlertCircle className="h-3 w-3 mr-1 text-amber-500" />}
                    {evidence.attribute.value === 'unknown' && <HelpCircle className="h-3 w-3 mr-1 text-gray-400" />}
                    {evidence.attribute.value}
                  </Badge>
                )}
              </CardDescription>
            )}
            <CardTitle className="text-base">
              {evidence.evidence_text || (
                <span className="text-muted-foreground italic">No description available</span>
              )}
            </CardTitle>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <VerificationBadge status={evidence.verification_status} size="sm" />
            {isConflicting && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Conflict
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Source Information */}
        {source ? (
          <div className="flex flex-wrap items-center gap-2">
            <SourceTypeBadge sourceType={source.source_type} />
            {source.source_name ? (
              <span className="text-sm text-muted-foreground">{source.source_name}</span>
            ) : (
              <span className="text-sm text-muted-foreground italic">Source name unavailable</span>
            )}
            {source.source_url && (
              <a 
                href={source.source_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                View source →
              </a>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground italic">
            Source information not available
          </div>
        )}
        
        {/* Evidence Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {evidence.observed_at ? (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Eye className="h-3 w-3" />
              <span>Observed: {formatDate(evidence.observed_at)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Eye className="h-3 w-3" />
              <span className="italic">Observation date unknown</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Recorded: {formatRelativeTime(evidence.collected_at)}</span>
          </div>
          {evidence.collector ? (
            <div className="flex items-center gap-1 text-muted-foreground">
              <User className="h-3 w-3" />
              <span>By: {evidence.collector}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="italic">Collector unknown</span>
            </div>
          )}
        </div>
        
        {/* Confidence and Freshness */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Confidence:</span>
            <ConfidenceIndicator confidence={evidence.confidence} />
          </div>
          <FreshnessIndicator 
            observedAt={evidence.observed_at} 
            collectedAt={evidence.collected_at} 
          />
        </div>
        
        {/* Notes */}
        {evidence.notes && (
          <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
            <Info className="h-3 w-3 inline mr-1" />
            {evidence.notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function EvidenceList({ evidence, groupByStatus = false, showConflicts = false }: EvidenceListProps) {
  // Check for conflicts
  const hasConflicts = hasConflictingEvidence(evidence);
  const conflicts = hasConflicts ? getAttributeConflicts(evidence) : new Map();
  
  if (!evidence || evidence.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No evidence recorded</p>
        <p className="text-sm mt-1">This accessibility claim has not been backed by evidence yet.</p>
      </div>
    );
  }

  // Show conflict warning if conflicts exist
  const conflictWarning = hasConflicts && showConflicts ? (
    <ConflictWarning evidence={evidence} />
  ) : null;

  if (!groupByStatus) {
    return (
      <div className="space-y-4">
        {conflictWarning}
        {evidence.map((e) => (
          <EvidenceCard 
            key={e.evidence_id} 
            evidence={e} 
            showConflict={conflicts.has(e.attribute?.attribute_id || e.attribute_id)}
          />
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
      {conflictWarning}
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
                <EvidenceCard 
                  key={e.evidence_id} 
                  evidence={e}
                  showConflict={conflicts.has(e.attribute?.attribute_id || e.attribute_id)}
                />
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
  const conflictingCount = evidence.filter(e => e.verification_status === 'conflicting').length;
  
  // Calculate average confidence only for evidence that has confidence
  const confidences = evidence
    .map(e => e.confidence)
    .filter((c): c is number => c !== null && c !== undefined);
  const avgConfidence = confidences.length > 0 
    ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length 
    : null;

  return (
    <div className="flex flex-wrap items-center gap-2">
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
      {conflictingCount > 0 && (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {conflictingCount} conflicting
        </Badge>
      )}
      {avgConfidence !== null && <ConfidenceIndicator confidence={avgConfidence} />}
    </div>
  );
}

// Detailed conflict view for a specific attribute
export function AttributeConflictDetail({ 
  attributeName, 
  conflictingEvidence 
}: { 
  attributeName: string;
  conflictingEvidence: Evidence[];
}) {
  return (
    <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-4">
      <h4 className="font-medium text-amber-900 mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        Conflicting Evidence: {attributeName}
      </h4>
      <div className="space-y-3">
        {conflictingEvidence.map((e) => (
          <div key={e.evidence_id} className="bg-white rounded p-3 border border-amber-100">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="text-xs">
                Claims: {e.attribute?.value || 'unknown'}
              </Badge>
              <VerificationBadge status={e.verification_status} size="sm" />
            </div>
            <p className="text-sm text-muted-foreground">{e.evidence_text || 'No description'}</p>
            {e.source && (
              <p className="text-xs text-muted-foreground mt-2">
                Source: {e.source.source_name || sourceTypeLabels[e.source.source_type]}
              </p>
            )}
            <div className="text-xs text-muted-foreground mt-1">
              <FreshnessIndicator observedAt={e.observed_at} collectedAt={e.collected_at} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
