import React from 'react';
import {requireNativeComponent, type ViewProps} from 'react-native';

const NativePhoto = requireNativeComponent<
  ViewProps & {src: string; onLoadError?: () => void}
>('AircraftPhoto');
export function PhotoThumbnail({
  url,
  onError,
}: {
  url: string;
  link: string;
  credit: string;
  onError: () => void;
}): React.JSX.Element {
  return (
    <NativePhoto
      src={url}
      onLoadError={onError}
      style={{height: 190, marginTop: 24, borderRadius: 14, overflow: 'hidden'}}
    />
  );
}
