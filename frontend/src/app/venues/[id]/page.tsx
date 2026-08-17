"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { Venue, AccessibilityAttribute, Evidence, VenueAccessibilityDetail } from "@/lib/api/types";
import { venuesApi, accessibilityApi, evidenceApi } from "@/lib/api/client";
import { AccessibilityAttributeList } from "@/components/accessibility-attributes";
import { LocationBasedAttributes, VerificationSummary } from "@/components/location-based-attributes";
import { EvidenceList } from "@/components/evidence";
import { VerificationLegend } from "@/components/verification-badge";
import { DataSourceIndicator, DataSourceAlert } from "@/components/data-source-indicator";
import { ReportForm } from "@/components/report-form";
import { MapView } from "@/components/map-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCategory, formatDate } from "@/lib/utils";
import { 
  Building2, 
  MapPin, 
  Globe, 
  Phone, 
  Mail, 
  ArrowLeft,
  Accessibility,
  AlertTriangle,
  FileText,
  ShieldCheck,
  ExternalLink,
  Clock,
  CheckCircle2
} from "lucide-react";

// DEMO DATA - Clearly marked
const DEMO_VENUE: Venue = {
  venue_id: "demo-venue-1",
  name: "City General Hospital - Demo",
  category: "hospital",
  address: "123 Healthcare Avenue",
  city: "Mumbai",
  state: "Maharashtra",
  country: "India",
  postal_code: "400001",
  latitude: 19.0760,
  longitude: 72.8777,
  official_url: undefined,
  contact_phone: undefined,
  contact_email: undefined,
  created_at: "2024-01-15T10:30:00Z",
  updated_at: "2024-01-15T10:30:00Z",
};

const DEMO_ATTRIBUTES: AccessibilityAttribute[] = [
  {
    attribute_id: "demo-attr-1",
    venue_id: "demo-venue-1",
    location_id: null,
    category: "mobility",
    attribute_name: "ramp",
    value: "yes",
    value_type: "boolean",
    notes: "Accessible ramp at main entrance with handrails on both sides. Slope approximately 1:12. - DEMO DATA",
    last_observed_at: "2024-01-15T00:00:00Z",
    location: {
      location_id: "demo-loc-1",
      venue_id: "demo-venue-1",
      name: "Main Entrance",
      location_type: "entrance",
      description: "Primary hospital entrance facing Healthcare Avenue",
    },
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  },
  {
    attribute_id: "demo-attr-2",
    venue_id: "demo-venue-1",
    location_id: null,
    category: "mobility",
    attribute_name: "elevator",
    value: "yes",
    value_type: "boolean",
    notes: "Elevator access to all floors. Located near main reception. - DEMO DATA",
    last_observed_at: "2024-01-15T00:00:00Z",
    location: null,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  },
  {
    attribute_id: "demo-attr-3",
    venue_id: "demo-venue-1",
    location_id: null,
    category: "mobility",
    attribute_name: "accessible_toilet",
    value: "yes",
    value_type: "boolean",
    notes: "Accessible toilet available on ground floor near reception area. - DEMO DATA",
    last_observed_at: "2024-01-15T00:00:00Z",
    location: {
      location_id: "demo-loc-2",
      venue_id: "demo-venue-1",
      name: "Ground Floor",
      location_type: "floor",
      description: "Main floor with reception",
    },
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  },
  {
    attribute_id: "demo-attr-4",
    venue_id: "demo-venue-1",
    location_id: null,
    category: "visual",
    attribute_name: "braille_signage",
    value: "unknown",
    value_type: "boolean",
    notes: "Information not yet collected - DEMO DATA",
    last_observed_at: undefined,
    location: undefined,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  },
];

const DEMO_EVIDENCE: Evidence[] = [
  {
    evidence_id: "demo-evidence-1",
    attribute_id: "demo-attr-1",
    source_id: undefined,
    evidence_text: "Hospital website lists accessible entrance with ramp - DEMO EVIDENCE",
    evidence_media_url: undefined,
    observed_at: "2024-01-15T00:00:00Z",
    collected_at: "2024-01-15T10:30:00Z",
    collector: "demo_collector",
    verification_status: "reported",
    confidence: 0.7,
    notes: "DEMO DATA - NOT VERIFIED: Based on hospital website claims, not yet independently verified.",
    source: {
      source_id: "demo-source-1",
      source_type: "official_venue",
      source_name: "Hospital Website",
      source_url: "https://example.com",
      trust_level: 6,
      created_at: "2024-01-15T10:30:00Z",
    },
    attribute: DEMO_ATTRIBUTES[0],
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  },
];

export default function VenueDetailPage() {
  const params = useParams();
  const venueId = params.id as string;
  
  const [venue, setVenue] = useState<Venue | null>(null);
  const [attributes, setAttributes] = useState<AccessibilityAttribute[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<"api" | "demo" | "error">("demo");

  useEffect(() => {
    const loadVenueData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Use the optimized detail endpoint
        const detailData = await venuesApi.getDetail(venueId);

        setVenue(detailData.venue);
        setAttributes(detailData.attributes);
        setEvidence(detailData.evidence);
        setDataSource("api");
      } catch (err) {
        console.log("API unavailable, checking for demo data");
        // Only use demo data in development mode
        if (process.env.NODE_ENV === 'development' && venueId.startsWith("demo-")) {
          setVenue(DEMO_VENUE);
          setAttributes(DEMO_ATTRIBUTES);
          setEvidence(DEMO_EVIDENCE);
          setDataSource("demo");
        } else {
          setError("Failed to load venue data. The accessibility database may be unavailable.");
          setDataSource("error");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadVenueData();
  }, [venueId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 container py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Venue Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The venue you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Search
            </Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  // Calculate stats
  const yesCount = attributes.filter(a => a.value === 'yes').length;
  const noCount = attributes.filter(a => a.value === 'no').length;
  const unknownCount = attributes.filter(a => a.value === 'unknown').length;
  const verifiedEvidence = evidence.filter(e => e.verification_status === 'verified').length;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main id="main-content" className="flex-1">
        {/* Data Source Banner */}
        <div className={`border-b ${dataSource === 'demo' ? 'bg-amber-50 border-amber-200' : dataSource === 'api' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="container py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DataSourceIndicator source={dataSource} />
                {dataSource === 'demo' && (
                  <span className="text-amber-800 text-sm">
                    Synthetic data for development. Real data coming from research.
                  </span>
                )}
                {dataSource === 'api' && (
                  <span className="text-green-800 text-sm">
                    Live data from accessibility database
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Venue Header */}
        <section className="bg-muted/30 border-b">
          <div className="container py-8">
            <Button variant="ghost" size="sm" className="mb-4" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Search
              </Link>
            </Button>
            
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">
                    <Building2 className="h-3 w-3 mr-1" />
                    {formatCategory(venue.category)}
                  </Badge>
                  {verifiedEvidence > 0 && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      {verifiedEvidence} Verified
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold tracking-tight">{venue.name}</h1>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {venue.address}, {venue.city}, {venue.state}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <ReportForm 
                  venueId={venue.venue_id}
                  trigger={
                    <Button variant="outline">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Report Issue
                    </Button>
                  }
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="flex flex-wrap gap-4 mt-6 text-sm">
              {venue.official_url && (
                <a 
                  href={venue.official_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  Official Website
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {venue.contact_phone && (
                <a 
                  href={`tel:${venue.contact_phone}`}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  <Phone className="h-4 w-4" />
                  {venue.contact_phone}
                </a>
              )}
              {venue.contact_email && (
                <a 
                  href={`mailto:${venue.contact_email}`}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  <Mail className="h-4 w-4" />
                  {venue.contact_email}
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Accessibility Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Summary Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Accessibility className="h-5 w-5" />
                    Accessibility Overview
                  </CardTitle>
                  <CardDescription>
                    Summary of accessibility features with evidence
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-700">{yesCount}</div>
                      <div className="text-sm text-green-600">Available</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-700">{noCount}</div>
                      <div className="text-sm text-red-600">Not Available</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-700">{unknownCount}</div>
                      <div className="text-sm text-gray-600">Unknown</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-700">{evidence.length}</div>
                      <div className="text-sm text-blue-600">Evidence</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Attributes - Location Based */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Detailed Accessibility</h2>
                  <VerificationSummary attributes={attributes} />
                </div>
                <LocationBasedAttributes attributes={attributes} showEvidenceCount={true} />
              </div>

              {/* Evidence Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Evidence & Verification
                  </h2>
                </div>
                <EvidenceList evidence={evidence} groupByStatus={true} />
              </div>
            </div>

            {/* Right Column - Map & Info */}
            <div className="space-y-6">
              {/* Map */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <MapView 
                    venues={[venue]} 
                    height="250px"
                    selectedVenueId={venue.venue_id}
                  />
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p>{venue.address}</p>
                    <p>{venue.city}, {venue.state} {venue.postal_code}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Verification Legend */}
              <VerificationLegend />

              {/* Last Updated */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Data Freshness
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p className="mb-2">
                    Last updated: {formatDate(venue.updated_at)}
                  </p>
                  <p className="text-xs">
                    Some information may be outdated. Please verify before visiting.
                  </p>
                  <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                    <Link href="#" onClick={(e) => { e.preventDefault(); alert('Update feature coming soon'); }}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Confirm Information
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
