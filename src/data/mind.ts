export const EMOTIONS = [
  { id: 'happy', label: 'Happy', emoji: '😊' },
  { id: 'calm', label: 'Calm', emoji: '😌' },
  { id: 'grateful', label: 'Grateful', emoji: '🙏' },
  { id: 'motivated', label: 'Motivated', emoji: '💪' },
  { id: 'hopeful', label: 'Hopeful', emoji: '🌱' },
  { id: 'proud', label: 'Proud', emoji: '🏅' },
  { id: 'tired', label: 'Tired', emoji: '🥱' },
  { id: 'anxious', label: 'Anxious', emoji: '😟' },
  { id: 'stressed', label: 'Stressed', emoji: '😣' },
  { id: 'sad', label: 'Sad', emoji: '😢' },
  { id: 'angry', label: 'Angry', emoji: '😠' },
  { id: 'lonely', label: 'Lonely', emoji: '🫥' },
  { id: 'overwhelmed', label: 'Overwhelmed', emoji: '🌊' },
] as const;

export function emotionLabel(id: string): string {
  const e = EMOTIONS.find((x) => x.id === id);
  return e ? `${e.emoji} ${e.label}` : id;
}

/** 1–5 scales recorded with every mind entry. `low`/`high` describe the ends of the slider. */
export const MIND_SCALES = [
  { key: 'stress', label: 'Stress', low: 'Relaxed', high: 'Very stressed', color: 'move' },
  { key: 'energy', label: 'Energy', low: 'Drained', high: 'Energised', color: 'warm' },
  { key: 'sleep', label: 'Sleep last night', low: 'Poor', high: 'Great', color: 'calm' },
] as const;

export const JOURNAL_PROMPTS = [
  "What's taking up most of your headspace right now?",
  'What helped you today, even a little?',
  'What would you tell a friend who felt the way you do?',
  'What is one small thing you can do for yourself tomorrow?',
  'When did you feel most like yourself today?',
];

/** Low-mood / high-stress threshold at which the app gently points to support resources. */
export const SUPPORT_THRESHOLD = { mood: 2, stress: 4 };

export const SUPPORT_URL = 'https://findahelpline.com';
