import React from 'react';
import {TVFocusGuideView, type ViewProps} from 'react-native';

// A full-width focus guide lets the remote enter centered content even when
// the navigation button above is outside the controls' horizontal bounds.
export function FocusRegion(props: ViewProps): React.JSX.Element {
  return <TVFocusGuideView autoFocus {...props} />;
}
