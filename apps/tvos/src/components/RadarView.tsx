import React, {useState} from 'react';
import {Image, LayoutChangeEvent, StyleSheet, Text, View} from 'react-native';

import {approximateLocationFromAircraft, type LatLon, type TrackedAircraft} from '@adsb/shared';

import {nmToPixels, pickZoom, project, TILE_SIZE} from '../mercator';
import {theme} from '../theme';

interface RadarViewProps {
  aircraft: TrackedAircraft[];
  receiver?: LatLon;
  selectedHex?: string;
}

const RING_STEPS_NM = [10, 20, 30, 40, 50];

export function RadarView({aircraft, receiver, selectedHex}: RadarViewProps) {
  const [size, setSize] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    const {width, height} = event.nativeEvent.layout;
    setSize(Math.max(0, Math.min(width, height)));
  };

  const plotted = aircraft.filter((plane) => plane.position && typeof plane.distanceNm === 'number');
  const maxDistance = plotted.reduce((max, plane) => Math.max(max, plane.distanceNm ?? 0), 0);
  const maxRange = Math.max(20, Math.ceil(maxDistance / 10) * 10);

  // The map centers on the receiver, falling back to the aircraft cluster.
  const center = receiver ?? approximateLocationFromAircraft(aircraft);
  const ready = size > 0 && center !== undefined;

  let content: React.ReactNode = null;

  if (ready && center) {
    const half = size / 2;
    const zoom = pickZoom(center.lat, half, maxRange);
    const centerWorld = project(center.lat, center.lon, zoom);
    const originX = centerWorld.x - half;
    const originY = centerWorld.y - half;

    const toScreen = (lat: number, lon: number) => {
      const w = project(lat, lon, zoom);
      return {x: w.x - originX, y: w.y - originY};
    };

    // Build the grid of OSM tiles covering the square.
    const tiles: React.ReactNode[] = [];
    const txMin = Math.floor(originX / TILE_SIZE);
    const txMax = Math.floor((originX + size) / TILE_SIZE);
    const tyMin = Math.floor(originY / TILE_SIZE);
    const tyMax = Math.floor((originY + size) / TILE_SIZE);
    const maxIndex = Math.pow(2, zoom) - 1;

    for (let tx = txMin; tx <= txMax; tx++) {
      for (let ty = tyMin; ty <= tyMax; ty++) {
        if (ty < 0 || ty > maxIndex) {
          continue;
        }
        const wrappedX = ((tx % (maxIndex + 1)) + (maxIndex + 1)) % (maxIndex + 1);
        tiles.push(
          <Image
            key={`${tx}-${ty}`}
            source={{uri: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${ty}.png`}}
            style={{
              position: 'absolute',
              width: TILE_SIZE,
              height: TILE_SIZE,
              left: tx * TILE_SIZE - originX,
              top: ty * TILE_SIZE - originY,
              opacity: 0.85,
            }}
          />,
        );
      }
    }

    const receiverScreen = receiver ? toScreen(receiver.lat, receiver.lon) : {x: half, y: half};

    content = (
      <View style={[styles.plot, {width: size, height: size}]}>
        {tiles}

        {/* Range rings, scaled to the map projection so they read as real distance. */}
        {RING_STEPS_NM.map((nm) => {
          const r = nmToPixels(nm, center.lat, zoom);
          if (r > half) {
            return null;
          }
          const d = r * 2;
          return (
            <View
              key={nm}
              style={[
                styles.ring,
                {
                  width: d,
                  height: d,
                  borderRadius: r,
                  left: receiverScreen.x - r,
                  top: receiverScreen.y - r,
                },
              ]}
            />
          );
        })}

        <View style={[styles.receiver, {left: receiverScreen.x - 7, top: receiverScreen.y - 7}]} />

        {plotted.map((plane) => {
          const p = toScreen(plane.position!.lat, plane.position!.lon);
          if (p.x < -20 || p.x > size + 20 || p.y < -20 || p.y > size + 20) {
            return null;
          }
          const selected = plane.hex === selectedHex;
          const color = selected
            ? theme.color.focusBorder
            : plane.stale
            ? theme.color.stale
            : theme.color.accent;
          const dot = selected ? 16 : 11;

          return (
            <View key={plane.hex}>
              <View
                style={[
                  styles.blip,
                  {
                    width: dot,
                    height: dot,
                    borderRadius: dot / 2,
                    backgroundColor: color,
                    left: p.x - dot / 2,
                    top: p.y - dot / 2,
                  },
                ]}
              />
              {selected && (
                <Text style={[styles.blipLabel, {left: p.x + 10, top: p.y - 12}]} numberOfLines={1}>
                  {plane.callsign || plane.hex}
                </Text>
              )}
            </View>
          );
        })}

        <Text style={styles.attribution}>© OpenStreetMap</Text>
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Map</Text>
        <Text style={styles.range}>{maxRange} nm range</Text>
      </View>
      <View style={styles.plotArea} onLayout={onLayout}>
        {content}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: theme.color.panel,
    borderColor: theme.color.panelBorder,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: theme.space.md,
    marginRight: theme.space.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.space.sm,
  },
  heading: {
    color: theme.color.textMuted,
    fontSize: theme.font.small,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  range: {
    color: theme.color.textMuted,
    fontSize: theme.font.small,
  },
  plotArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plot: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: theme.radius,
    backgroundColor: '#0a1526',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(226, 236, 250, 0.35)',
  },
  receiver: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.color.receiver,
    borderWidth: 2,
    borderColor: '#0a1526',
  },
  blip: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#0a1526',
  },
  blipLabel: {
    position: 'absolute',
    color: theme.color.text,
    fontSize: theme.font.small,
    fontWeight: '600',
    textShadowColor: '#000',
    textShadowRadius: 4,
  },
  attribution: {
    position: 'absolute',
    right: 6,
    bottom: 4,
    color: theme.color.textMuted,
    fontSize: 14,
  },
});
