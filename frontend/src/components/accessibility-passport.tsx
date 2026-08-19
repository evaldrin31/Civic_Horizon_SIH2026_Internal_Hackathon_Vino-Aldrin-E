import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Venue, AccessibilityAttribute } from '@/lib/api/types';
import { DemoVenue } from '@/lib/demo-data';
import { Footprints, Eye, Ear, Brain, HeartHandshake, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

interface AccessibilityPassportProps {
  venue: Venue | DemoVenue; // Accept both Venue and DemoVenue
  attributes: AccessibilityAttribute[];
}

export function AccessibilityPassport({ venue, attributes }: AccessibilityPassportProps) {
  // Determine if we are using the Demo venue with explicit booleans
  const isDemo = 'wheelchairAccessible' in venue;
  const v = venue as DemoVenue;

  // Helper to resolve status
  const getStatus = (keys: boolean[]) => {
    if (!isDemo) return 'unknown';
    const trues = keys.filter(k => k).length;
    if (trues === keys.length) return 'supported';
    if (trues > 0) return 'partial';
    return 'unsupported';
  };

  const dimensions = [
    {
      id: 'mobility',
      label: 'Mobility',
      icon: <Footprints className="h-5 w-5 text-blue-600" />,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      status: getStatus([v.wheelchairAccessible, v.stepFreeEntrance, v.accessibleRestroom, v.elevatorAvailable]),
      features: [
        { name: 'Wheelchair Accessible', val: v.wheelchairAccessible },
        { name: 'Step-Free Entrance', val: v.stepFreeEntrance },
        { name: 'Accessible Restrooms', val: v.accessibleRestroom },
        { name: 'Elevators / Ramps', val: v.elevatorAvailable || v.rampAvailable },
        { name: 'Accessible Parking', val: v.accessibleParking },
      ]
    },
    {
      id: 'vision',
      label: 'Vision',
      icon: <Eye className="h-5 w-5 text-emerald-600" />,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      status: getStatus([v.tactilePath, v.brailleSignage, v.audioAssistance]),
      features: [
        { name: 'Tactile Paths', val: v.tactilePath },
        { name: 'Braille Signage', val: v.brailleSignage },
        { name: 'Audio Assistance', val: v.audioAssistance },
      ]
    },
    {
      id: 'hearing',
      label: 'Hearing',
      icon: <Ear className="h-5 w-5 text-purple-600" />,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      status: getStatus([v.signLanguageSupport]),
      features: [
        { name: 'Sign Language Support', val: v.signLanguageSupport },
        { name: 'Visual Alerts', val: v.clearSignage },
      ]
    },
    {
      id: 'sensory',
      label: 'Sensory / Cognitive',
      icon: <Brain className="h-5 w-5 text-amber-600" />,
      color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      status: getStatus([v.lowSensoryArea, v.quietZone, v.clearSignage]),
      features: [
        { name: 'Low Sensory Areas', val: v.lowSensoryArea },
        { name: 'Quiet Zones', val: v.quietZone },
        { name: 'Clear, Simple Signage', val: v.clearSignage },
      ]
    },
    {
      id: 'assistance',
      label: 'Assistance / Safety',
      icon: <HeartHandshake className="h-5 w-5 text-rose-600" />,
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      status: getStatus([v.emergencyAssistance, v.staffAssistance, v.accessibleRestroom]),
      features: [
        { name: 'Emergency Assistance', val: v.emergencyAssistance },
        { name: 'Trained Staff Assistance', val: v.staffAssistance },
        { name: 'Accessible Reception', val: v.accessibleRestroom },
      ]
    }
  ];

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'supported': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'partial': return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'unsupported': return <span className="text-slate-300 font-bold text-lg">-</span>;
      default: return <HelpCircle className="h-5 w-5 text-slate-300" />;
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" /> Accessibility Passport
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Dimension</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Key Features</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dimensions.map((dim) => (
                <tr key={dim.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 font-medium text-slate-900">
                      <div className={`p-2 rounded-lg border ${dim.color}`}>
                        {dim.icon}
                      </div>
                      {dim.label}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <StatusIcon status={dim.status} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {dim.features.map((f, i) => f.val ? (
                        <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200">
                          {f.name}
                        </Badge>
                      ) : null)}
                      {dim.features.filter(f => f.val).length === 0 && (
                        <span className="text-slate-400 italic text-xs">No specific features recorded</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
