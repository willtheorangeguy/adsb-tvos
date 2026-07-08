import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {theme} from '../theme';

interface StatusHeaderProps {
  visible: number;
  total: number;
  asOfMs?: number;
  pollMs: number;
  source: string;
  demo: boolean;
}

function Stat({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function StatusHeader({visible, total, asOfMs, pollMs, source, demo}: StatusHeaderProps) {
  const updated = asOfMs ? new Date(asOfMs).toLocaleTimeString() : '--';

  return (
    <View style={styles.container}>
      <View style={styles.titleBlock}>
        <Text style={styles.title}>ADS-B Local Radar</Text>
        <Text style={styles.subtitle}>
          {demo ? 'Demo feed (synthetic traffic)' : `Source: ${source}`}
        </Text>
      </View>
      <View style={styles.stats}>
        <Stat label="Visible" value={String(visible)} />
        <Stat label="Total" value={String(total)} />
        <Stat label="Updated" value={updated} />
        <Stat label="Poll" value={`${pollMs}ms`} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.space.xl,
    paddingTop: theme.space.lg,
    paddingBottom: theme.space.md,
  },
  titleBlock: {
    flexShrink: 1,
  },
  title: {
    color: theme.color.text,
    fontSize: theme.font.title,
    fontWeight: '700',
  },
  subtitle: {
    color: theme.color.textMuted,
    fontSize: theme.font.small,
    marginTop: theme.space.xs,
  },
  stats: {
    flexDirection: 'row',
  },
  stat: {
    alignItems: 'flex-end',
    marginLeft: theme.space.lg,
  },
  statValue: {
    color: theme.color.text,
    fontSize: theme.font.heading,
    fontWeight: '600',
  },
  statLabel: {
    color: theme.color.textMuted,
    fontSize: theme.font.small,
  },
});
