"use client";

import { AccessibilityAttribute, AttributeValue, AttributeCategory } from "@/lib/api/types";
import { VerificationBadge } from "./verification-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatAttributeName, formatCategory, formatRelativeTime } from "@/lib/utils";
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  AlertCircle,
  MapPin,
  Accessibility,
  Eye,
  Ear,
  Info
} from "lucide-react";

interface AccessibilityAttributeListProps {
  attributes: AccessibilityAttribute[];
  groupByCategory?: boolean;
}

interface SingleAttributeProps {
  attribute: AccessibilityAttribute;
  showLocation?: boolean;
}

const valueIcons: Record<AttributeValue, React.ReactNode> = {
  yes: <CheckCircle2 className="h-4 w-4 text-green-600" />,
  no: <XCircle className="h-4 w-4 text-red-500" />,
  unknown: <HelpCircle className="h-4 w-4 text-gray-400" />,
  partial: <AlertCircle className="h-4 w-4 text-amber-500" />,
};

const valueLabels: Record<AttributeValue, string> = {
  yes: "Available",
  no: "Not Available",
  unknown: "Unknown",
  partial: "Partial",
};

const valueClasses: Record<AttributeValue, string> = {
  yes: "bg-green-50 text-green-700 border-green-200",
  no: "bg-red-50 text-red-700 border-red-200",
  unknown: "bg-gray-50 text-gray-600 border-gray-200",
  partial: "bg-amber-50 text-amber-700 border-amber-200",
};

const categoryIcons: Record<AttributeCategory, React.ReactNode> = {
  mobility: <Accessibility className="h-4 w-4" />,
  visual: <Eye className="h-4 w-4" />,
  hearing: <Ear className="h-4 w-4" />,
  general: <Info className="h-4 w-4" />,
};

export function AttributeValueBadge({ value }: { value: AttributeValue }) {
  return (
    <Badge 
      variant="outline" 
      className={`inline-flex items-center gap-1 ${valueClasses[value]}`}
    >
      {valueIcons[value]}
      <span>{valueLabels[value]}</span>
    </Badge>
  );
}

export function SingleAttribute({ attribute, showLocation = true }: SingleAttributeProps) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-border last:border-0">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {formatAttributeName(attribute.attribute_name)}
          </span>
          <AttributeValueBadge value={attribute.value} />
        </div>
        
        {attribute.notes && (
          <p className="text-sm text-muted-foreground mt-1">
            {attribute.notes}
          </p>
        )}
        
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          {showLocation && attribute.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {attribute.location.name}
            </span>
          )}
          {attribute.last_observed_at && (
            <span>
              Last observed: {formatRelativeTime(attribute.last_observed_at)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function AccessibilityAttributeList({ 
  attributes, 
  groupByCategory = true 
}: AccessibilityAttributeListProps) {
  if (!attributes || attributes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No accessibility information available</p>
      </div>
    );
  }

  if (!groupByCategory) {
    return (
      <div className="space-y-0">
        {attributes.map((attr) => (
          <SingleAttribute key={attr.attribute_id} attribute={attr} />
        ))}
      </div>
    );
  }

  // Group by category
  const grouped = attributes.reduce((acc, attr) => {
    if (!acc[attr.category]) {
      acc[attr.category] = [];
    }
    acc[attr.category].push(attr);
    return acc;
  }, {} as Record<AttributeCategory, AccessibilityAttribute[]>);

  const categoryOrder: AttributeCategory[] = ['mobility', 'visual', 'hearing', 'general'];

  return (
    <div className="space-y-6">
      {categoryOrder.map((category) => {
        const categoryAttrs = grouped[category];
        if (!categoryAttrs || categoryAttrs.length === 0) return null;

        return (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {categoryIcons[category]}
                {formatCategory(category)}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {categoryAttrs.map((attr) => (
                <SingleAttribute key={attr.attribute_id} attribute={attr} />
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Summary view for venue cards
export function AccessibilitySummaryCompact({ 
  attributes 
}: { 
  attributes: AccessibilityAttribute[] 
}) {
  if (!attributes || attributes.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <HelpCircle className="h-4 w-4" />
        <span>No accessibility data</span>
      </div>
    );
  }

  const yesCount = attributes.filter(a => a.value === 'yes').length;
  const noCount = attributes.filter(a => a.value === 'no').length;
  const unknownCount = attributes.filter(a => a.value === 'unknown').length;

  return (
    <div className="flex flex-wrap gap-2">
      {yesCount > 0 && (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {yesCount} available
        </Badge>
      )}
      {noCount > 0 && (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          {noCount} unavailable
        </Badge>
      )}
      {unknownCount > 0 && (
        <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
          <HelpCircle className="h-3 w-3 mr-1" />
          {unknownCount} unknown
        </Badge>
      )}
    </div>
  );
}
