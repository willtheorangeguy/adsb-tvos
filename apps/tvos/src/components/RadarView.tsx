import React, {useState} from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {
  approximateLocationFromAircraft,
  type LatLon,
  type TrackedAircraft,
} from '@adsb/shared';
import {nmToPixels, project, TILE_SIZE} from '../mercator';
import {TVButton} from './TVButton';
interface Props {
  aircraft: TrackedAircraft[];
  receiver?: LatLon;
  selectedHex?: string;
  range: number;
  map: boolean;
  trails: boolean;
  onSelect: (hex: string) => void;
  follow?: boolean;
}
export function RadarView({
  aircraft,
  receiver,
  selectedHex,
  range,
  map,
  trails,
  onSelect,
  follow,
}: Props) {
  const [size, setSize] = useState({width: 0, height: 0});
  const selected = aircraft.find(p => p.hex === selectedHex);
  const center =
    (follow ? selected?.position : undefined) ??
    receiver ??
    approximateLocationFromAircraft(aircraft);
  const {width, height} = size;
  const zoom = center
    ? Math.max(
        2,
        Math.min(
          16,
          Math.log2(
            (156543.03392804097 *
              Math.cos((center.lat * Math.PI) / 180) *
              Math.max(1, Math.min(width, height) / 2 - 25)) /
              (range * 1852),
          ),
        ),
      )
    : 7;
  const tileZoom = Math.floor(zoom);
  const tileSize = TILE_SIZE * Math.pow(2, zoom - tileZoom);
  const world = center ? project(center.lat, center.lon, zoom) : {x: 0, y: 0};
  const origin = {x: world.x - width / 2, y: world.y - height / 2};
  const screen = (p: LatLon) => {
    const point = project(p.lat, p.lon, zoom);
    const worldWidth = Math.pow(2, zoom) * TILE_SIZE;
    return {
      x:
        ((((point.x - world.x + worldWidth / 2) % worldWidth) + worldWidth) %
          worldWidth) -
        worldWidth / 2 +
        width / 2,
      y: point.y - origin.y,
    };
  };
  const station = receiver ? screen(receiver) : {x: width / 2, y: height / 2};
  const tiles = [];
  const labels: {x: number; y: number}[] = [];
  if (map && center && width > 0) {
    for (
      let x = Math.floor(origin.x / tileSize);
      x <= Math.floor((origin.x + width) / tileSize);
      x++
    ) {
      for (
        let y = Math.floor(origin.y / tileSize);
        y <= Math.floor((origin.y + height) / tileSize);
        y++
      ) {
        const count = Math.pow(2, tileZoom);
        if (y < 0 || y >= count) continue;
        tiles.push(
          <Image
            key={`${zoom}-${x}-${y}`}
            source={{
              uri: `https://tile.openstreetmap.org/${tileZoom}/${
                ((x % count) + count) % count
              }/${y}.png`,
            }}
            style={{
              position: 'absolute',
              left: x * tileSize - origin.x,
              top: y * tileSize - origin.y,
              width: tileSize + 0.5,
              height: tileSize + 0.5,
              opacity: 0.35,
            }}
          />,
        );
      }
    }
  }
  return (
    <View style={s.root} onLayout={e => setSize(e.nativeEvent.layout)}>
      {tiles}
      {!map &&
        Array.from({length: 18}, (_, i) => (
          <View
            key={`grid-${i}`}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: 1,
              left: i * 100,
              backgroundColor: '#12202b',
            }}
          />
        ))}
      {center &&
        [range / 3, (range * 2) / 3, range].map(nm => {
          const r = nmToPixels(nm, center.lat, zoom);
          return (
            <View
              key={nm}
              pointerEvents="none"
              style={[
                s.ring,
                {
                  width: r * 2,
                  height: r * 2,
                  borderRadius: r,
                  left: station.x - r,
                  top: station.y - r,
                },
              ]}>
              <Text style={s.ringText}>{Math.round(nm)} nm</Text>
            </View>
          );
        })}
      {receiver && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: station.x - 8,
            top: station.y - 8,
          }}>
          <View style={s.station} />
          <Text style={s.stationLabel}>MY RECEIVER</Text>
        </View>
      )}
      {center &&
        aircraft
          .filter(p => p.position)
          .map(p => {
            const point = screen(p.position!);
            if (
              point.x < 10 ||
              point.x > width - 55 ||
              point.y < 35 ||
              point.y > height - 55
            )
              return null;
            const isSelected = p.hex === selectedHex;
            const showLabel =
              isSelected ||
              !labels.some(
                l =>
                  Math.abs(l.x - point.x) < 100 && Math.abs(l.y - point.y) < 35,
              );
            if (showLabel) labels.push(point);
            const color = p.stale
              ? '#637082'
              : isSelected
              ? '#21e99e'
              : '#ffbb44';
            return (
              <React.Fragment key={p.hex}>
                {trails &&
                  p.trail.slice(-60).map((t, i, arr) => {
                    const a = screen(t);
                    const next = arr[i + 1];
                    if (!next) return null;
                    const b = screen(next);
                    const length = Math.hypot(b.x - a.x, b.y - a.y);
                    return (
                      <View
                        key={t.timestampMs}
                        pointerEvents="none"
                        style={{
                          position: 'absolute',
                          left: (a.x + b.x) / 2 - length / 2,
                          top: (a.y + b.y) / 2,
                          width: length,
                          height: isSelected ? 2 : 1,
                          backgroundColor: color,
                          opacity: ((i + 1) / arr.length) * 0.6,
                          transform: [
                            {
                              rotate: `${
                                (Math.atan2(b.y - a.y, b.x - a.x) * 180) /
                                Math.PI
                              }deg`,
                            },
                          ],
                        }}
                      />
                    );
                  })}
                <TVButton
                  label={`Select ${p.callsign || p.hex}`}
                  onPress={() => onSelect(p.hex)}
                  style={[
                    s.planeButton,
                    {left: point.x - 25, top: point.y - 25},
                    isSelected && s.selected,
                  ]}>
                  <Text
                    style={{
                      color,
                      fontSize: 39,
                      lineHeight: 46,
                      textAlign: 'center',
                      transform: [{rotate: `${(p.trackDeg ?? 0) - 90}deg`}],
                    }}>
                    ✈
                  </Text>
                </TVButton>
                {showLabel && (
                  <Text
                    style={[
                      s.planeLabel,
                      {left: point.x + 30, top: point.y - 10, color},
                    ]}>
                    {p.callsign || p.registration || p.hex}
                    {isSelected
                      ? `\n${Math.round((p.altitudeFt ?? 0) / 100) * 100} ft`
                      : ''}
                  </Text>
                )}
              </React.Fragment>
            );
          })}
      <View pointerEvents="none" style={s.corner}>
        <Text style={s.north}>↑ N</Text>
        <Text style={s.muted}>
          {follow ? 'Following aircraft' : 'North up'}
        </Text>
      </View>
      <View pointerEvents="none" style={s.legend}>
        <Text style={s.muted}>
          <Text style={{color: '#ffbb44'}}>●</Text> Local receiver{' '}
          <Text style={{color: '#21e99e'}}>●</Text> Selected{' '}
          <Text style={{color: '#637082'}}>●</Text> Stale
        </Text>
      </View>
      {map && <Text style={s.attribution}>© OpenStreetMap contributors</Text>}
      {!center && (
        <View style={s.empty}>
          <Text style={s.north}>Your sky will appear here</Text>
          <Text style={s.muted}>
            Connect a receiver or explore the demo in Settings.
          </Text>
        </View>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#09111c',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#202d39',
  },
  ring: {position: 'absolute', borderWidth: 1, borderColor: '#1b5446'},
  ringText: {
    color: '#60857a',
    fontSize: 15,
    alignSelf: 'center',
    backgroundColor: '#09151d',
    paddingHorizontal: 8,
    marginTop: -10,
  },
  station: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#d7fff0',
    borderColor: '#20c88f',
    borderWidth: 4,
  },
  stationLabel: {
    color: '#a7c7ba',
    fontSize: 13,
    letterSpacing: 2,
    marginLeft: -45,
    marginTop: 10,
  },
  planeButton: {
    position: 'absolute',
    width: 52,
    height: 52,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  selected: {borderColor: '#21e99e', backgroundColor: '#12382c'},
  planeLabel: {
    position: 'absolute',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    textShadowColor: '#000',
    textShadowRadius: 3,
  },
  corner: {position: 'absolute', top: 25, left: 25},
  north: {fontSize: 24, color: '#e9f2ee', fontWeight: '600'},
  muted: {fontSize: 16, color: '#8a9caa', marginTop: 5},
  legend: {position: 'absolute', left: 25, bottom: 24},
  attribution: {
    position: 'absolute',
    bottom: 6,
    right: 12,
    color: '#84909b',
    fontSize: 12,
  },
  empty: {flex: 1, alignItems: 'center', justifyContent: 'center'},
});
