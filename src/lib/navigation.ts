import { router } from 'expo-router';

/** Closes the current screen, or goes home if it was opened directly (e.g. from a web link). */
export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
