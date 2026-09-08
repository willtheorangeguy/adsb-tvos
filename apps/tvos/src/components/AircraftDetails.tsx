import React, {useState} from 'react';
import {Image, ScrollView, StyleSheet, Text, View} from 'react-native';
import {
  aircraftCategory,
  formatAltitude,
  formatDistance,
  formatSpeed,
  proximity,
  type LatLon,
  type TrackedAircraft,
} from '@adsb/shared';
import {TVButton} from './TVButton';
export function AircraftDetails({
  aircraft: p,
  receiver,
  tracked,
  onTrack,
  onSave,
  demo,
}: {
  aircraft?: TrackedAircraft;
  receiver?: LatLon;
  tracked?: boolean;
  onTrack: () => void;
  onSave: () => void;
  demo: boolean;
}): React.JSX.Element {
  const [failedPhoto, setFailedPhoto] = useState<string>();
  if (!p)
    return (
      <View style={s.panel}>
        <Text style={s.heading}>A closer look</Text>
        <Text style={s.muted}>
          Select an aircraft on the radar or in the nearby list.
        </Text>
      </View>
    );
  const approach = proximity(p, receiver);
  const phase = p.stale
    ? 'Signal lost'
    : (p.verticalRateFpm ?? 0) > 200
    ? 'Climbing'
    : (p.verticalRateFpm ?? 0) < -200
    ? 'Descending'
    : 'Level flight';
  return (
    <ScrollView
      style={s.panel}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}>
      <View style={s.row}>
        <Text style={s.eyebrow}>AIRCRAFT DETAILS</Text>
        <Text style={s.live}>{p.stale ? '○ STALE' : '● IN RANGE'}</Text>
      </View>
      {p.photoUrl &&
      /^https:\/\//.test(p.photoUrl) &&
      p.photoUrl !== failedPhoto ? (
        <>
          <Image
            source={{uri: p.photoUrl}}
            style={s.photo}
            resizeMode="cover"
            onError={() => setFailedPhoto(p.photoUrl)}
          />
          <Text style={s.credit}>
            {p.photoCredit || 'Photo supplied by receiver'}
          </Text>
        </>
      ) : (
        <View style={s.visual}>
          <View style={s.orbit} />
          <View
            style={[s.orbit, {width: 125, height: 125, left: 165, top: 10}]}
          />
          <Text style={s.airplane}>✈</Text>
          <Text style={s.visualType}>
            {p.aircraftType || aircraftCategory(p)}
          </Text>
          <Text style={s.visualCaption}>AIRCRAFT SILHOUETTE</Text>
        </View>
      )}
      <View style={s.row}>
        <Text style={s.callsign}>{p.callsign || p.hex}</Text>
        <Text style={s.registration}>{p.registration || p.hex}</Text>
      </View>
      <Text style={s.operator}>{p.operator || 'Operator not provided'}</Text>
      <View style={s.status}>
        <Text style={s.green}>↗ {phase}</Text>
        <Text style={s.green}>
          {formatDistance(p)} {approach?.direction}
        </Text>
      </View>
      <View style={s.route}>
        <View>
          <Text style={s.airport}>{p.origin || '—'}</Text>
          <Text style={s.muted}>Origin</Text>
        </View>
        <View style={s.routeMiddle}>
          <Text style={s.routePlane}>──────── ✈</Text>
          <Text style={s.routeNote}>
            {p.origin && p.destination
              ? demo
                ? 'Sample route'
                : 'Receiver route'
              : 'Route not broadcast'}
          </Text>
        </View>
        <View>
          <Text style={s.airport}>{p.destination || '—'}</Text>
          <Text style={s.muted}>Destination</Text>
        </View>
      </View>
      <View style={s.metrics}>
        <Metric label="ALTITUDE" value={formatAltitude(p)} />
        <Metric label="SPEED" value={formatSpeed(p)} />
        <Metric
          label="HEADING"
          value={p.trackDeg === undefined ? '—' : `${Math.round(p.trackDeg)}°`}
        />
      </View>
      <Text style={s.approach}>
        {approach?.minutes !== undefined
          ? `Closest approach ≈ ${approach.closestNm?.toFixed(
              1,
            )} nm in ${Math.max(1, Math.round(approach.minutes))} min`
          : approach
          ? `Look ${approach.direction} · ${Math.round(
              approach.bearing,
            )}° from your receiver`
          : 'Set receiver coordinates for direction and proximity'}
      </Text>
      <View style={s.actions}>
        <TVButton
          label={tracked ? '✓  Tracking aircraft' : '◎  Track aircraft'}
          onPress={onTrack}
          active={tracked}
          style={{flex: 1}}
        />
        <TVButton
          label="＋  Log sighting"
          onPress={onSave}
          primary
          style={{flex: 1}}
        />
      </View>
      <View style={s.extra}>
        <Text style={s.muted}>Type / category</Text>
        <Text style={s.value}>
          {p.aircraftType || '—'} / {aircraftCategory(p)}
        </Text>
      </View>
      <View style={s.extra}>
        <Text style={s.muted}>Vertical rate</Text>
        <Text style={s.value}>
          {p.verticalRateFpm === undefined
            ? '—'
            : `${Math.round(p.verticalRateFpm)} ft/min`}
        </Text>
      </View>
      <View style={s.extra}>
        <Text style={s.muted}>Squawk / ICAO</Text>
        <Text style={s.value}>
          {p.squawk || '—'} / {p.hex}
        </Text>
      </View>
      <View style={s.extra}>
        <Text style={s.muted}>Position</Text>
        <Text style={s.value}>
          {p.position
            ? `${p.position.lat.toFixed(3)}, ${p.position.lon.toFixed(3)}`
            : '—'}
        </Text>
      </View>
      <Text style={s.footnote}>
        {demo
          ? 'DEMO · Synthetic aircraft and sample routes'
          : 'From your receiver · Unavailable fields are not inferred'}
      </Text>
    </ScrollView>
  );
}
function Metric({label, value}: {label: string; value: string}) {
  return (
    <View style={{flex: 1}}>
      <Text style={s.metricValue}>{value}</Text>
      <Text style={s.metricLabel}>{label}</Text>
    </View>
  );
}
const s = StyleSheet.create({
  panel: {
    backgroundColor: '#101824',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#253142',
    flex: 1,
  },
  content: {padding: 28},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyebrow: {fontSize: 16, color: '#98a8ba', letterSpacing: 2},
  live: {fontSize: 14, color: '#24de9a', letterSpacing: 1},
  heading: {fontSize: 30, color: '#fff', margin: 28},
  muted: {fontSize: 17, color: '#8998aa', marginTop: 6},
  visual: {
    height: 162,
    backgroundColor: '#0a121d',
    marginTop: 24,
    marginBottom: 24,
    borderRadius: 14,
    overflow: 'hidden',
  },
  orbit: {
    position: 'absolute',
    width: 235,
    height: 235,
    borderWidth: 1,
    borderColor: '#1c3540',
    borderRadius: 150,
    left: 110,
    top: -45,
  },
  airplane: {
    fontSize: 134,
    color: '#83aeaa',
    position: 'absolute',
    left: 142,
    top: -25,
    transform: [{rotate: '-22deg'}],
  },
  visualType: {
    position: 'absolute',
    left: 20,
    top: 20,
    color: '#abd6c5',
    fontSize: 20,
  },
  visualCaption: {
    position: 'absolute',
    left: 20,
    bottom: 17,
    fontSize: 11,
    letterSpacing: 2,
    color: '#59746f',
  },
  photo: {height: 170, borderRadius: 14, marginTop: 24},
  credit: {color: '#8998aa', fontSize: 13, textAlign: 'right'},
  callsign: {
    fontSize: 42,
    fontWeight: '700',
    color: '#f0f5fa',
    letterSpacing: -1,
  },
  registration: {
    fontSize: 18,
    color: '#22e69d',
    borderColor: '#24674e',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  operator: {fontSize: 22, color: '#9daabd', marginTop: 4},
  status: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
  },
  green: {fontSize: 20, color: '#22e69d'},
  route: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 25,
    marginVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#263142',
  },
  airport: {fontSize: 34, fontWeight: '600', color: '#e8eef5'},
  routeMiddle: {alignItems: 'center', flex: 1},
  routePlane: {color: '#22e69d', fontSize: 23},
  routeNote: {color: '#8998aa', fontSize: 13, marginTop: 6},
  metrics: {flexDirection: 'row', paddingVertical: 16},
  metricValue: {fontSize: 25, fontWeight: '600', color: '#edf2f7'},
  metricLabel: {
    fontSize: 12,
    color: '#8e9dae',
    letterSpacing: 1.5,
    marginTop: 8,
  },
  approach: {
    fontSize: 17,
    lineHeight: 24,
    color: '#8fbfa9',
    marginTop: 12,
    marginBottom: 22,
  },
  actions: {flexDirection: 'row', gap: 12, marginBottom: 18},
  extra: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#223040',
    paddingVertical: 12,
    alignItems: 'center',
  },
  value: {fontSize: 17, color: '#ced9e5'},
  footnote: {
    fontSize: 13,
    color: '#819183',
    marginTop: 18,
    textAlign: 'center',
  },
});
