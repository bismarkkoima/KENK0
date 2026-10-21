import type { DaySummary, Goals } from '@/db/queries';
import type { Profile } from '@/lib/profile';
import { favouriteSlot, TIME_SLOT_LABELS, type LifetimeStats } from '@/lib/stats';

/** Short, original encouragements shown one per day. */
export const QUOTES = [
  'Your body is not a before picture. It is the one carrying you through today.',
  'Progress is personal. The only pace that matters is the one you can keep.',
  'Small steps still move you forward.',
  'Rest is part of the training, not a break from it.',
  'You don’t have to feel motivated to begin. Beginning is what brings the motivation.',
  'Strong looks different on everybody.',
  'Some days the win is simply showing up. Today can be one of those days.',
  'Be patient with the person you are becoming.',
  'Ten minutes is not nothing. Ten minutes is a start.',
  'Consistency beats intensity, every single time.',
  'Move because you love your body, not because you’re punishing it.',
  'The hardest part was deciding to start — and you already did.',
  'Breathe in what you need. Breathe out what you don’t.',
  'Your only competition is who you were yesterday.',
  'A slow walk still counts as moving forward.',
  'Feelings are information, not instructions.',
  'Health is a long game. Play it kindly.',
  'Every rep, every step, every glass of water is a vote for who you want to be.',
  'You are allowed to grow at your own speed.',
  'Energy follows attention. Give some to yourself today.',
  'Done is better than perfect.',
  'The best workout is the one you’ll actually do.',
  'Your future self is cheering for what you do today.',
  'Gentle is still strong.',
];

export function quoteOfTheDay(date = new Date()): string {
  const dayNumber = Math.floor(date.getTime() / 86_400_000);
  return QUOTES[dayNumber % QUOTES.length];
}

export type HopeStat = { text: string; source?: string };

/**
 * Evidence-based facts. Each states the finding plainly and cites where it comes from — Kenko
 * never invents statistics about other people.
 */
export const FACTS: HopeStat[] = [
  {
    text: 'Forming a habit took anywhere from 18 to 254 days in one study — 66 on average. Everyone’s timeline is different, so go at yours.',
    source: 'Lally et al., European Journal of Social Psychology (2010)',
  },
  {
    text: 'People who exercised reported about 43% fewer days of poor mental health a month than people who didn’t.',
    source: 'Chekroud et al., The Lancet Psychiatry (2018)',
  },
  {
    text: 'Every bit of movement counts. The WHO recommends 150–300 minutes of moderate activity a week — and says any amount is better than none.',
    source: 'World Health Organization guidelines (2020)',
  },
  {
    text: 'Middle-aged adults walking at least 7,000 steps a day had a 50–70% lower risk of early death than those walking fewer.',
    source: 'Paluch et al., JAMA Network Open (2021)',
  },
  {
    text: 'Simply putting a feeling into words can calm the brain’s alarm system. Naming it helps you handle it.',
    source: 'Lieberman et al., Psychological Science (2007)',
  },
];

/**
 * Encouraging statistics about *this* person, built from their own history on the phone.
 * Ordered roughly from most to least personal.
 */
export function personalHopeStats(
  stats: LifetimeStats,
  goals: Goals,
  profile: Profile | null,
): HopeStat[] {
  const out: HopeStat[] = [];
  const days = stats.days;
  const lastWeek = days.slice(-7);
  const prevWeek = days.slice(-14, -7);
  const minutes = (xs: DaySummary[]) => xs.reduce((s, d) => s + d.exerciseMinutes, 0);

  const slot = favouriteSlot(stats);
  if (slot && slot.share >= 0.25) {
    out.push({
      text: `${Math.round(slot.share * 100)}% of your workouts happen on ${slot.weekday} ${TIME_SLOT_LABELS[slot.slot]}s. That’s your power slot — protect it.`,
    });
  }

  const thisWeek = minutes(lastWeek);
  const before = minutes(prevWeek);
  if (before > 0 && thisWeek > before) {
    out.push({
      text: `You’ve moved ${Math.round(((thisWeek - before) / before) * 100)}% more this week than last. That’s what progress looks like.`,
    });
  }

  if (stats.currentStreak >= 2) {
    out.push({
      text:
        stats.currentStreak >= stats.longestStreak
          ? `${stats.currentStreak} days in a row — your longest streak ever. You’re in new territory.`
          : `${stats.currentStreak} days in a row. Your record is ${stats.longestStreak} — you’ve done it before.`,
    });
  }

  const month = days.slice(-30);
  const activeDays = month.filter((d) => d.workouts > 0 || d.meditationMinutes > 0).length;
  if (month.length >= 7 && activeDays > 0) {
    out.push({
      text: `You were active on ${Math.round((activeDays / month.length) * 100)}% of the last ${month.length} days.`,
    });
  }

  if (stats.exerciseMinutes >= 60) {
    out.push({
      text: `You’ve exercised for ${(stats.exerciseMinutes / 60).toFixed(1)} hours with Kenko. Every one of them counted.`,
    });
  }

  if (stats.firstDay) {
    const dayCount = days.length;
    out.push({
      text: `Day ${dayCount} of building your habit. Habits took 18 to 254 days to form in research — your pace is the right pace.`,
      source: 'Lally et al. (2010)',
    });
  }

  if (thisWeek >= 150) {
    out.push({
      text: `${Math.round(thisWeek)} active minutes this week — you’ve met the WHO’s weekly recommendation.`,
      source: 'World Health Organization (2020)',
    });
  } else if (thisWeek > 0) {
    out.push({
      text: `${Math.round(thisWeek)} of the WHO’s recommended 150 weekly minutes done. ${Math.round(150 - thisWeek)} to go — any activity counts.`,
      source: 'World Health Organization (2020)',
    });
  }

  if (profile?.fitnessLevel === 'beginner' && stats.workouts <= 5) {
    out.push({
      text: `Your plan starts at ${goals.exerciseMinutes} minutes a day on purpose. Small and steady builds the strongest habits.`,
    });
  }

  return out;
}

/** One personal stat (or, without enough history, a research fact) for today. */
export function hopeStatOfTheDay(personal: HopeStat[], offset = 0, date = new Date()) {
  const pool = [...personal, ...FACTS];
  const dayNumber = Math.floor(date.getTime() / 86_400_000);
  return pool[(dayNumber + offset) % pool.length];
}
