export type MeditationCategory = 'breathing' | 'calm' | 'focus' | 'sleep';

/** A guided step shown during the session, starting `at` seconds in. */
export type GuideStep = { at: number; text: string };

export type Meditation = {
  id: string;
  title: string;
  description: string;
  category: MeditationCategory;
  minutes: number;
  /** Inhale / hold / exhale / hold seconds for the breathing animation. */
  breath: [number, number, number, number];
  steps: GuideStep[];
};

export const MEDITATIONS: Meditation[] = [
  {
    id: 'box-breathing',
    title: 'Box Breathing',
    description: 'A steady 4-4-4-4 rhythm to settle your nervous system.',
    category: 'breathing',
    minutes: 3,
    breath: [4, 4, 4, 4],
    steps: [
      { at: 0, text: 'Sit comfortably and let your shoulders drop.' },
      { at: 15, text: 'Follow the circle: breathe in as it grows, out as it shrinks.' },
      { at: 60, text: 'If your mind wanders, gently return to counting.' },
      { at: 120, text: 'Notice how your body feels a little slower, a little softer.' },
      { at: 165, text: 'Take one last full breath, and let it go.' },
    ],
  },
  {
    id: 'morning-reset',
    title: 'Morning Reset',
    description: 'Set a calm, clear intention for the day ahead.',
    category: 'focus',
    minutes: 5,
    breath: [4, 2, 6, 0],
    steps: [
      { at: 0, text: 'Welcome. Close your eyes or soften your gaze.' },
      { at: 20, text: 'Breathe in through the nose, and slowly out through the mouth.' },
      { at: 70, text: 'Scan from head to toe. Where are you holding tension?' },
      { at: 140, text: 'Choose one word for today — calm, kind, strong, curious.' },
      { at: 210, text: 'Repeat your word silently with each exhale.' },
      { at: 270, text: 'When you are ready, open your eyes and carry it with you.' },
    ],
  },
  {
    id: 'stress-release',
    title: 'Stress Release',
    description: 'Longer exhales to switch off the stress response.',
    category: 'calm',
    minutes: 5,
    breath: [4, 0, 8, 0],
    steps: [
      { at: 0, text: 'Place a hand on your belly and feel it rise and fall.' },
      { at: 30, text: 'Let each exhale be twice as long as the inhale.' },
      { at: 90, text: 'Imagine tension leaving your body with every breath out.' },
      { at: 180, text: 'Unclench your jaw. Relax your hands.' },
      { at: 260, text: 'You did something kind for yourself today.' },
    ],
  },
  {
    id: 'mindful-eating',
    title: 'Mindful Eating',
    description: 'A short pause before a meal to tune into real hunger.',
    category: 'focus',
    minutes: 2,
    breath: [4, 0, 4, 0],
    steps: [
      { at: 0, text: 'Before you eat, take three slow breaths.' },
      { at: 25, text: 'On a scale of 1 to 10, how hungry are you really?' },
      { at: 55, text: 'Notice the colours, smells and textures of your food.' },
      { at: 90, text: 'Plan to eat slowly, and check in again halfway through.' },
    ],
  },
  {
    id: 'body-scan',
    title: 'Body Scan',
    description: 'Release tension from head to toe, one area at a time.',
    category: 'calm',
    minutes: 10,
    breath: [5, 0, 5, 0],
    steps: [
      { at: 0, text: 'Lie down or sit back. Let the surface hold your weight.' },
      { at: 45, text: 'Bring attention to your forehead, eyes and jaw. Soften them.' },
      { at: 130, text: 'Move to your neck and shoulders. Let them melt downward.' },
      { at: 220, text: 'Notice your arms, hands and fingertips.' },
      { at: 310, text: 'Feel your chest and belly move with your breath.' },
      { at: 400, text: 'Release your hips, legs and feet.' },
      { at: 500, text: 'Sense your whole body at once, breathing and at ease.' },
      { at: 570, text: 'Slowly wiggle your fingers and toes when you are ready.' },
    ],
  },
  {
    id: 'sleep-wind-down',
    title: 'Sleep Wind-Down',
    description: 'The 4-7-8 breath to help you drift off.',
    category: 'sleep',
    minutes: 8,
    breath: [4, 7, 8, 0],
    steps: [
      { at: 0, text: 'Get comfortable in bed and dim the lights.' },
      { at: 30, text: 'Inhale for 4, hold for 7, exhale slowly for 8.' },
      { at: 150, text: 'Let thoughts about today float past like clouds.' },
      { at: 300, text: 'Each breath makes your body heavier and warmer.' },
      { at: 420, text: 'There is nothing left to do. Just rest.' },
    ],
  },
];

export function getMeditation(id: string): Meditation | undefined {
  return MEDITATIONS.find((m) => m.id === id);
}

export const CATEGORY_LABELS: Record<MeditationCategory, string> = {
  breathing: 'Breathing',
  calm: 'Calm',
  focus: 'Focus',
  sleep: 'Sleep',
};
