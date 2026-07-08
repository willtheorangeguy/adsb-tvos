import React, {useState} from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';

import {formatAltitude, formatDistance, formatSpeed, type TrackedAircraft} from '@adsb/shared';

import {theme} from '../theme';

interface AircraftListProps {
  aircraft: TrackedAircraft[];
  selectedHex?: string;
  onSelect: (hex: string) => void;
}

interface RowProps {
  plane: TrackedAircraft;
  selected: boolean;
  preferredFocus: boolean;
  onSelect: (hex: string) => void;
}

function Row({plane, selected, preferredFocus, onSelect}: RowProps) {
  const [focused, setFocused] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      hasTVPreferredFocus={preferredFocus}
      onFocus={() => {
        setFocused(true);
        // Moving focus to a row selects it, so details + radar track the remote.
        onSelect(plane.hex);
      }}
      onBlur={() => setFocused(false)}
      onPress={() => onSelect(plane.hex)}
      style={[
        styles.row,
        selected && styles.rowSelected,
        focused && styles.rowFocused,
      ]}>
      <View style={styles.rowMain}>
        <Text style={styles.callsign}>{plane.callsign || '--'}</Text>
        <Text style={styles.hex}>{plane.hex}</Text>
      </View>
      <View style={styles.rowMetrics}>
        <Text style={styles.metric}>{formatAltitude(plane)}</Text>
        <Text style={styles.metricMuted}>
          {formatSpeed(plane)} · {formatDistance(plane)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function AircraftList({aircraft, selectedHex, onSelect}: AircraftListProps) {
  return (
    <View style={styles.panel}>
      <Text style={styles.heading}>Aircraft ({aircraft.length})</Text>
      {aircraft.length === 0 ? (
        <Text style={styles.empty}>No aircraft match current filters.</Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {aircraft.slice(0, 50).map((plane, index) => (
            <Row
              key={plane.hex}
              plane={plane}
              selected={plane.hex === selectedHex}
              preferredFocus={index === 0}
              onSelect={onSelect}
            />
          ))}
        </ScrollView>
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
    marginLeft: theme.space.sm,
  },
  heading: {
    color: theme.color.textMuted,
    fontSize: theme.font.small,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.space.sm,
  },
  empty: {
    color: theme.color.textMuted,
    fontSize: theme.font.body,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.sm,
    borderRadius: theme.radius,
    marginBottom: theme.space.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rowSelected: {
    backgroundColor: theme.color.selected,
  },
  rowFocused: {
    borderColor: theme.color.focusBorder,
    backgroundColor: theme.color.selected,
  },
  rowMain: {
    flexShrink: 1,
  },
  callsign: {
    color: theme.color.text,
    fontSize: theme.font.body,
    fontWeight: '700',
  },
  hex: {
    color: theme.color.textMuted,
    fontSize: theme.font.small,
  },
  rowMetrics: {
    alignItems: 'flex-end',
  },
  metric: {
    color: theme.color.text,
    fontSize: theme.font.small,
    fontWeight: '600',
  },
  metricMuted: {
    color: theme.color.textMuted,
    fontSize: theme.font.small,
  },
});
