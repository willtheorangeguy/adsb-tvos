import {Platform, TVEventControl} from 'react-native';
export function captureMenuButton(capture: boolean): void {
  if (!Platform.isTV) return;
  if (capture) TVEventControl.enableTVMenuKey();
  else TVEventControl.disableTVMenuKey();
}
