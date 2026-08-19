"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { AlertTriangle, CheckCircle2, Loader2, Send } from "lucide-react";

interface ReportFormProps {
  venueId: string;
  attributeId?: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

type ReportType = "incorrect" | "outdated" | "missing" | "changed";

interface ReportTypeOption {
  value: ReportType;
  label: string;
  description: string;
}

const reportTypes: ReportTypeOption[] = [
  {
    value: "incorrect",
    label: "Incorrect Information",
    description: "The accessibility information shown is wrong or inaccurate",
  },
  {
    value: "outdated",
    label: "Outdated Information",
    description: "This information was correct but may be old or no longer accurate",
  },
  {
    value: "missing",
    label: "Missing Information",
    description: "There's accessibility information that should be listed but isn't",
  },
  {
    value: "changed",
    label: "Venue Changed",
    description: "The venue conditions have changed (renovations, closure, etc.)",
  },
];

export function ReportForm({ venueId: _venueId, attributeId: _attributeId, trigger, onSuccess }: ReportFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<{
    reportType: ReportType | "";
    description: string;
    contactEmail: string;
  }>({
    reportType: "",
    description: "",
    contactEmail: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.reportType) {
      setError("Please select a report type");
      return;
    }

    if (!formData.description.trim()) {
      setError("Please describe the issue");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // This would be replaced with actual API call
      // await api.reports.create({
      //   venueId,
      //   attributeId,
      //   reportType: formData.reportType,
      //   description: formData.description,
      //   contactEmail: formData.contactEmail || undefined,
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        setFormData({ reportType: "", description: "", contactEmail: "" });
        onSuccess?.();
      }, 2000);
    } catch {
      setError("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = reportTypes.find(t => t.value === formData.reportType);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Report Issue
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        {isSuccess ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Report Submitted</h3>
            <p className="text-muted-foreground">
              Thank you for helping improve accessibility information. Our team will review your report.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Report an Issue</DialogTitle>
              <DialogDescription>
                Help us keep accessibility information accurate and up-to-date.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Report Type */}
              <div className="space-y-2">
                <label htmlFor="reportType" className="text-sm font-medium">
                  What type of issue? <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.reportType}
                  onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, reportType: value as ReportType }))
                  }
                >
                  <SelectTrigger id="reportType">
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedType && (
                  <p className="text-xs text-muted-foreground">
                    {selectedType.description}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description <span className="text-red-500">*</span>
                </label>
                <Textarea
                  id="description"
                  placeholder="Please describe the issue in detail..."
                  value={formData.description}
                  onChange={(e) => 
                    setFormData(prev => ({ ...prev, description: e.target.value }))
                  }
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Include specific details about what is incorrect or missing.
                </p>
              </div>

              {/* Contact Email (Optional) */}
              <div className="space-y-2">
                <label htmlFor="contactEmail" className="text-sm font-medium">
                  Contact Email <span className="text-muted-foreground">(optional)</span>
                </label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.contactEmail}
                  onChange={(e) => 
                    setFormData(prev => ({ ...prev, contactEmail: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  We may contact you for additional information if needed.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Report
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Simple inline report button for cards
export function ReportButton({ 
  venueId, 
  attributeId,
  size = "sm" 
}: { 
  venueId: string;
  attributeId?: string;
  size?: "sm" | "default";
}) {
  return (
    <ReportForm 
      venueId={venueId} 
      attributeId={attributeId}
      trigger={
        <Button variant="ghost" size={size} className="text-muted-foreground hover:text-foreground">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Report
        </Button>
      }
    />
  );
}
