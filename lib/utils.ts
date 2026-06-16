import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface RankInfo {
  name: string;
  color: string;
  nextRank?: string;
  pointsToNext?: number;
}

export function getMaritimeRank(points: number = 0): RankInfo {
  if (points <= 50) {
    return { name: 'Deckhand', color: '#7d8590', nextRank: 'First Mate', pointsToNext: 51 - points };
  }
  if (points <= 500) {
    return { name: 'First Mate', color: '#58a6ff', nextRank: 'Captain', pointsToNext: 501 - points };
  }
  if (points <= 2000) {
    return { name: 'Captain', color: '#d4a843', nextRank: 'Admiral', pointsToNext: 2001 - points };
  }
  return { name: 'Admiral', color: '#f78166' };
}
