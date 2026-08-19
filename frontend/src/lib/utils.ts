import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCategory(c: string) {
  return c.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

export function formatAttributeName(n: string) { return n.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); }
export function formatDate(d: string) { return new Date(d).toLocaleDateString(); }

export function formatRelativeTime(d: string) {
  const date = new Date(d);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "just now";
  
  const diffInHours = Math.floor(diffInSeconds / 3600);
  if (diffInHours < 24) {
    if (diffInHours === 1) return "1 hour ago";
    return `${diffInHours} hours ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  return `${diffInDays} days ago`;
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return Math.round(distanceKm * 1000) + 'm';
  }
  return distanceKm.toFixed(1) + 'km';
}


export function getLevenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
      }
    }
  }
  return matrix[b.length][a.length];
}

export function fuzzyMatch(str: string, query: string): boolean {
  if (!str || !query) return false;
  str = str.toLowerCase();
  query = query.toLowerCase();
  if (str.includes(query)) return true;
  
  // Allow 1 typo for every 4 characters
  const maxTypos = Math.floor(query.length / 4) + 1;
  const words = str.split(/[^a-z0-9]/).filter(Boolean);
  
  return words.some(word => {
    if (Math.abs(word.length - query.length) > maxTypos) return false;
    return getLevenshteinDistance(word, query) <= maxTypos;
  });
}
