"use client";

import { Header, Footer } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { VerificationLegend } from "@/components/verification-badge";
import { 
  Accessibility, 
  Info, 
  ShieldCheck, 
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main id="main-content" className="flex-1">
        {/* Header */}
        <section className="bg-muted/30 border-b">
          <div className="container py-8">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">About the Platform</h1>
            </div>
            <p className="text-muted-foreground">
              Understanding how we collect, verify, and present accessibility information.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="container py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Accessibility className="h-5 w-5" />
                    What is Accessibility Intelligence?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    The Accessibility Intelligence Platform is a civic technology project 
                    developed for the Smart India Hackathon 2026. Our goal is to provide 
                    <strong> evidence-backed, specific accessibility information</strong> for 
                    venues across India.
                  </p>
                  <p>
                    Unlike generic accessibility ratings, we focus on:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Specific attributes</strong> — Not just "accessible", but "step-free entrance at East Entrance"</li>
                    <li><strong>Exact locations</strong> — Which entrance, which floor, which area</li>
                    <li><strong>Evidence & provenance</strong> — Where the information came from</li>
                    <li><strong>Verification status</strong> — How reliable is this claim</li>
                    <li><strong>Freshness</strong> — When was this information last confirmed</li>
                  </ul>
                </CardContent>
              </Card>

              {/* How It Works */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    How Information is Verified
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    We use a multi-tier verification system to ensure information quality:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-green-700 font-bold text-sm">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Official Sources</h4>
                        <p className="text-xs text-muted-foreground">
                          Government databases, venue websites, institutional records
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-green-700 font-bold text-sm">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Professional Audits</h4>
                        <p className="text-xs text-muted-foreground">
                          Accessibility consultants and certified auditors
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-green-700 font-bold text-sm">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Direct Observation</h4>
                        <p className="text-xs text-muted-foreground">
                          Photos, measurements, and on-site verification
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-green-700 font-bold text-sm">4</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Community Reports</h4>
                        <p className="text-xs text-muted-foreground">
                          User submissions with moderation and verification
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Quality */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Understanding the Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    We believe in transparency. Here's what you should know:
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-1 shrink-0" />
                      <span className="text-sm">
                        <strong>"Unknown" is a valid answer</strong> — We don't assume lack of 
                        information means something is unavailable.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-1 shrink-0" />
                      <span className="text-sm">
                        <strong>Evidence is shown</strong> — You can see where information came from.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-1 shrink-0" />
                      <span className="text-sm">
                        <strong>Conflicts are preserved</strong> — If sources disagree, we show both.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-amber-600 mt-1 shrink-0" />
                      <span className="text-sm">
                        <strong>Information ages</strong> — Venues change. Check the "last observed" date.
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Verification Levels</CardTitle>
                  <CardDescription>
                    How to interpret verification badges
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <VerificationLegend />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Project Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full" />
                    <span>Development Phase</span>
                  </div>
                  <p>
                    Currently using demo data while research team collects real accessibility 
                    information from government databases, venue surveys, and community reports.
                  </p>
                  <p className="text-xs">
                    Target: SIH 2026 — Problem Statement #30
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Data Sources
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                      <span>Government databases (DEPwD, Sugamya Bharat)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                      <span>Venue documentation and websites</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                      <span>Professional accessibility audits</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                      <span>Community verification</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                      <span>OpenStreetMap and open data</span>
                    </li>
                  </ul>
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
