import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DemoVenue } from '@/lib/demo-data';
import { Badge } from '@/components/ui/badge';
import { Info, HelpCircle, CheckCircle2, AlertTriangle, ShieldCheck, Camera } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { Venue } from '@/lib/api/types';

interface ScoreVisualizerProps {
  venue: Venue | DemoVenue; // Accept DemoVenue
}

export function ScoreVisualizer({ venue }: ScoreVisualizerProps) {
  if (!('accessibilityScore' in venue)) return null;

  const v = venue as DemoVenue;
  const score = v.accessibilityScore;
  const evidenceCount = v.evidenceCount || 0;
  
  // Calculate category scores based on booleans
  const mobilityScore = Math.round(
    ([v.wheelchairAccessible, v.stepFreeEntrance, v.accessibleRestroom, v.elevatorAvailable, v.accessibleParking]
      .filter(Boolean).length / 5) * 100
  );
  
  const sensoryScore = Math.round(
    ([v.tactilePath, v.brailleSignage, v.audioAssistance, v.signLanguageSupport, v.lowSensoryArea, v.quietZone]
      .filter(Boolean).length / 6) * 100
  );
  
  const safetyScore = Math.round(
    ([v.emergencyAssistance, v.staffAssistance, v.accessibleRestroom]
      .filter(Boolean).length / 3) * 100
  );

  const getScoreColor = (val: number) => {
    if (val >= 80) return "bg-emerald-500";
    if (val >= 50) return "bg-amber-500";
    return "bg-rose-500";
  };

  const getScoreText = (val: number) => {
    if (val >= 80) return "text-emerald-700";
    if (val >= 50) return "text-amber-700";
    return "text-rose-700";
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="bg-slate-50/50 border-b pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Accessibility Score Breakdown
            </CardTitle>
            <CardDescription className="mt-1 max-w-md">
              Scores are calculated algorithmically based on the density of verified spatial features and community evidence.
            </CardDescription>
          </div>
          <div className="flex flex-col items-end">
            <span className={`text-4xl font-black ${getScoreText(score)}`}>{score}</span>
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Overall Score</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        
        {/* Core Dimensions */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-slate-700">Mobility & Navigation</span>
              <span className="font-bold">{mobilityScore}/100</span>
            </div>
            <Progress value={mobilityScore} className={`h-2`} indicatorClassName={getScoreColor(mobilityScore)} />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-slate-700">Sensory & Communication</span>
              <span className="font-bold">{sensoryScore}/100</span>
            </div>
            <Progress value={sensoryScore} className={`h-2`} indicatorClassName={getScoreColor(sensoryScore)} />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-slate-700">Safety & Assistance</span>
              <span className="font-bold">{safetyScore}/100</span>
            </div>
            <Progress value={safetyScore} className={`h-2`} indicatorClassName={getScoreColor(safetyScore)} />
          </div>
        </div>

        <div className="h-px bg-slate-100 my-4"></div>
        
        {/* Evidence Confidence */}
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-500" />
            Data Confidence Metrics
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Camera className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Visual Proofs</div>
                <div className="text-sm font-bold">{evidenceCount} Photos</div>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Verification Status</div>
                <div className="text-sm font-bold capitalize">{v.verificationStatus.replace('_', ' ')}</div>
              </div>
            </div>
          </div>
          
          {v.verificationStatus === 'unverified' && (
            <div className="mt-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-lg flex gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p>This venue relies heavily on self-reported data. The confidence score is low and requires on-ground verification.</p>
            </div>
          )}
        </div>
        
      </CardContent>
    </Card>
  );
}

