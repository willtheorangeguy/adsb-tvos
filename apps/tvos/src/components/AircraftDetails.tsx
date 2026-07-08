import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {
  formatAltitude,
  formatDistance,
  formatSpeed,
  formatTrack,
  type TrackedAircraft,
} from '@adsb/shared';

import {theme} from '../theme';

interface AircraftDetailsProps {
  aircraft?: TrackedAircraft;
}

function Row({label, value}: {label: string; value: string | number | undefined}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value === undefined || value === '' ? '--' : String(value)}</Text>
    </View>
  );
}

export function AircraftDetails({aircraft}: AircraftDetailsProps) {
  return (
    <View style={styles.panel}>
      <Text style={styles.heading}>Selected aircraft</Text>
      {aircraft ? (
        <View>
          <Text style={styles.callsign}>{aircraft.callsign || aircraft.hex}</Text>
          <Row label="ICAO Hex" value={aircraft.hex} />
          <Row label="Squawk" value={aircraft.squawk} />
          <Row label="Registration" value={aircraft.registration} />
          <Row label="Category" value={aircraft.category} />
          <Row label="Altitude" value={formatAltitude(aircraft)} />
          <Row label="Ground speed" value={formatSpeed(aircraft)} />
          <Row label="Track" value={formatTrack(aircraft)} />
          <Row label="Distance" value={formatDistance(aircraft)} />
          <Row label="Age" value={`${aircraft.ageSeconds.toFixed(1)} sec`} />
          <Row label="RSSI" value={aircraft.rssi?.toFixed(1)} />
          <Row label="Messages" value={aircraft.messages} />
        </View>
      ) : (
        <Text style={styles.empty}>Move focus to the list to select an aircraft.</Text>
      )}
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
    marginHorizontal: theme.space.sm,
  },
  heading: {
    color: theme.color.textMuted,
    fontSize: theme.font.small,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.space.sm,
  },
  callsign: {
    color: theme.color.text,
    fontSize: theme.font.heading,
    fontWeight: '700',
    marginBottom: theme.space.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.space.xs,
    borderBottomColor: theme.color.panelBorder,
    borderBottomWidth: 1,
  },
  label: {
    color: theme.color.textMuted,
    fontSize: theme.font.small,
  },
  value: {
    color: theme.color.text,
    fontSize: theme.font.small,
    fontWeight: '600',
  },
  empty: {
    color: theme.color.textMuted,
    fontSize: theme.font.body,
  },
});
