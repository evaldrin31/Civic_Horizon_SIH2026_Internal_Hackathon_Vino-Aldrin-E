'use client';

import React, { useMemo } from 'react';

export interface AccessibilityScoreProps {
  score: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export interface AccessibilityScoreBarProps {
  score: number;
  className?: string;
}

export interface AccessibilityBadgeProps {
  score: number;
  className?: string;
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Moderate';
  if (score >= 20) return 'Limited';
  return 'Insufficient Data';
}

export function getScoreColor(score: number) {
  if (score >= 80) {
    return {
      text: 'text-green-700',
      bg: 'bg-green-100',
      border: 'border-green-200',
      fill: 'bg-green-500',
    };
  }
  if (score >= 60) {
    return {
      text: 'text-blue-700',
      bg: 'bg-blue-100',
      border: 'border-blue-200',
      fill: 'bg-blue-500',
    };
  }
  if (score >= 40) {
    return {
      text: 'text-amber-700',
      bg: 'bg-amber-100',
      border: 'border-amber-200',
      fill: 'bg-amber-500',
    };
  }
  if (score >= 20) {
    return {
      text: 'text-orange-700',
      bg: 'bg-orange-100',
      border: 'border-orange-200',
      fill: 'bg-orange-500',
    };
  }
  return {
    text: 'text-red-700',
    bg: 'bg-red-100',
    border: 'border-red-200',
    fill: 'bg-red-500',
  };
}

export function AccessibilityScore({
  score,
  size = 'md',
  showLabel = true,
  className = '',
}: AccessibilityScoreProps) {
  const label = useMemo(() => getScoreLabel(score), [score]);
  const colors = useMemo(() => getScoreColor(score), [score]);

  const sizeClasses = {
    sm: 'w-12 h-12 text-lg',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-20 h-20 text-3xl',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <div
        className={`rounded-full flex flex-col items-center justify-center border-4 ${colors.bg} ${colors.border} ${colors.text} ${sizeClasses[size]}`}
      >
        <span className="font-bold leading-none">{score}</span>
      </div>
      {showLabel && (
        <span className={`text-sm font-semibold ${colors.text}`}>{label}</span>
      )}
    </div>
  );
}

export function AccessibilityScoreBar({
  score,
  className = '',
}: AccessibilityScoreBarProps) {
  const colors = useMemo(() => getScoreColor(score), [score]);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors.fill} transition-all duration-500 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-sm font-bold ${colors.text} min-w-[3ch] text-right`}>
        {score}
      </span>
    </div>
  );
}

export function AccessibilityBadge({
  score,
  className = '',
}: AccessibilityBadgeProps) {
  const label = useMemo(() => getScoreLabel(score), [score]);
  const colors = useMemo(() => getScoreColor(score), [score]);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors.bg} ${colors.border} ${colors.text} ${className}`}
    >
      <span>{score}</span>
      <span className="opacity-75">•</span>
      <span>{label}</span>
    </span>
  );
}
