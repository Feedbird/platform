/* lib/scheduling/getSuggestedSlots.ts */
import { Post } from "@/lib/store/use-feedbird-store";
import { Platform } from "@/lib/social/platforms/platform-types";

const BEST_TIMES: Record<Platform, Record<number, number[]>> = {
  instagram: {
    0: [10, 15], // Sunday
    1: [9, 13],  // Monday
    2: [9, 13],  // Tuesday
    3: [9, 13],  // Wednesday
    4: [9, 13],  // Thursday
    5: [9, 13],  // Friday
    6: [10, 14], // Saturday
  },
  tiktok: {
    0: [12, 20],
    1: [9, 14],
    2: [9, 14],
    3: [9, 14],
    4: [9, 14],
    5: [9, 14],
    6: [12, 20],
  },
  google: {
    0: [12, 20],
    1: [9, 14],
    2: [9, 14],
    3: [9, 14],
    4: [9, 14],
    5: [9, 14],
    6: [12, 20],
  },
  linkedin: {
    0: [],
    1: [9],
    2: [9],
    3: [9],
    4: [9],
    5: [9],
    6: [],
  },
  facebook: {
    0: [11, 16],
    1: [9, 14],
    2: [9, 14],
    3: [9, 14],
    4: [9, 14],
    5: [9, 14],
    6: [11, 16],
  },
  youtube: {
    0: [12],
    1: [12],
    2: [12],
    3: [12],
    4: [12],
    5: [12],
    6: [12],
  },
  pinterest: {
    0: [10, 20],
    1: [8, 12],
    2: [8, 12],
    3: [8, 12],
    4: [8, 12],
    5: [8, 12],
    6: [10, 20],
  },
};

export interface Slot {
  date: Date;
  reason: string;
  score: number;   // (optional) a numeric way to rank times
}

/**
 * Return up to `maxSlots` candidate slots from the next 30 days.
 * We do a union of the best hours from each platform, skip "taken" hours,
 * and apply a simple scoring heuristic to rank them.
 */
export function getSuggestedSlots(
  post: Post,
  allPosts: Post[],
  maxSlots: number = 10
): Slot[] {
  const now = new Date();
  const takenSlots = new Set(
    allPosts
      .filter(p => p.status === "Scheduled" && p.id !== post.id && p.publish_date)
      .map(p => toKey(p.publish_date as Date))
  );

  const DAYS_LOOKAHEAD = 30;
  const results: Slot[] = [];

  for (let d = 0; d < DAYS_LOOKAHEAD; d++) {
    const day = new Date(now);
    day.setDate(now.getDate() + d);

    // Gather best hours (union) for each platform
    const hoursSet = new Set<number>();
    for (const platform of post.platforms) {
      const bestHours = BEST_TIMES[platform]?.[day.getDay()] ?? [];
      bestHours.forEach(h => hoursSet.add(h));
    }

    // Sort ascending so we pick earliest in the day first
    const candidateHours = Array.from(hoursSet).sort((a, b) => a - b);

    for (const h of candidateHours) {
      const slotDate = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
        h
      );
      if (slotDate <= now) continue;

      const key = toKey(slotDate);
      if (takenSlots.has(key)) continue;

      // Basic scoring: midweek is better + closeness to 1 PM
      const dayScore = [2, 3, 4].includes(slotDate.getDay()) ? 10 : 5; 
      const closenessTo13 = 5 - Math.abs(h - 13); 
      const score = dayScore + closenessTo13;

      results.push({
        date: slotDate,
        reason: `Potential best-time for ${post.platforms.join(", ")}`,
        score,
      });

      // Stop if we already have enough slots
      if (results.length >= maxSlots) break;
    }

    if (results.length >= maxSlots) break;
  }

  // Sort by highest score, then earliest date
  results.sort((a, b) => {
    if (b.score === a.score) return a.date.getTime() - b.date.getTime();
    return b.score - a.score;
  });

  return results.slice(0, maxSlots);
}

function toKey(date: Date): string {
  // Rounds to hour precision
  return date instanceof Date ? date.toISOString().slice(0, 13) : "";
}
