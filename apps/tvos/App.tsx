/**
 * ADS-B TV — Apple TV viewer for a local PiAware feeder.
 *
 * Mirrors the web app's feature set (status, map, aircraft list + details)
 * using the shared @adsb/shared tracking logic, adapted for the Apple TV focus
 * engine. Runs against a live PiAware feed or the built-in demo feed. Feeder
 * settings are configured in-app and persisted (see src/settings.ts); the
 * settings screen opens automatically on first launch.
 */
import React, {useMemo, useState} from 'react';
import {SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View} from 'react-native';

import type {AircraftFilters} from '@adsb/shared';

import type {AppConfig} from './src/config';
import {AircraftDetails} from './src/components/AircraftDetails';
import {AircraftList} from './src/components/AircraftList';
import {RadarView} from './src/components/RadarView';
import {SettingsOverlay} from './src/components/SettingsOverlay';
import {StatusHeader} from './src/components/StatusHeader';
import {loadSettings, saveSettings} from './src/settings';
import {theme} from './src/theme';
import {useAdsbFeed} from './src/useAdsbFeed';

const FILTERS: AircraftFilters = {
  requirePosition: true,
  sortBy: 'distance',
  sortDirection: 'asc',
};

function SettingsButton({onPress}: {onPress: () => void}) {
  const [focused, setFocused] = useState(false);
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[styles.settingsButton, focused && styles.settingsButtonFocused]}>
      <Text style={styles.settingsButtonText}>⚙ Settings</Text>
    </TouchableOpacity>
  );
}

function App(): React.JSX.Element {
  // Settings load synchronously from NSUserDefaults, so there is no first-frame flash.
  const loaded = useMemo(() => loadSettings(), []);
  const [settings, setSettings] = useState(loaded.config);
  const [settingsOpen, setSettingsOpen] = useState(!loaded.configured);
  const [configured, setConfigured] = useState(loaded.configured);
  const [selectedHex, setSelectedHex] = useState<string>();

  const feed = useAdsbFeed(settings, FILTERS);

  const effectiveSelectedHex = useMemo(() => {
    if (!feed.aircraft.length) {
      return undefined;
    }
    if (!selectedHex || !feed.aircraft.some((plane) => plane.hex === selectedHex)) {
      return feed.aircraft[0]?.hex;
    }
    return selectedHex;
  }, [feed.aircraft, selectedHex]);

  const selected = feed.aircraft.find((plane) => plane.hex === effectiveSelectedHex);

  const handleSave = (next: AppConfig) => {
    saveSettings(next);
    setSettings(next);
    setConfigured(true);
    setSettingsOpen(false);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />

      <View style={styles.topBar}>
        <View style={styles.topBarHeader}>
          <StatusHeader
            visible={feed.aircraft.length}
            total={feed.allAircraft.length}
            asOfMs={feed.asOfMs}
            pollMs={settings.pollMs}
            source={`${settings.baseUrl} (${settings.mode})`}
            demo={settings.demo}
          />
        </View>
        {!settingsOpen ? (
          <View style={styles.topBarAction}>
            <SettingsButton onPress={() => setSettingsOpen(true)} />
          </View>
        ) : null}
      </View>

      {settingsOpen ? (
        <SettingsOverlay
          initial={settings}
          firstRun={!configured}
          onSave={handleSave}
          onCancel={() => setSettingsOpen(false)}
        />
      ) : (
        <>
          {feed.error ? <Text style={styles.error}>{feed.error}</Text> : null}
          {feed.loading && feed.allAircraft.length === 0 ? (
            <Text style={styles.loading}>Loading feed…</Text>
          ) : null}

          <View style={styles.layout}>
            <View style={styles.radarColumn}>
              <RadarView
                aircraft={feed.aircraft}
                receiver={feed.receiver}
                selectedHex={effectiveSelectedHex}
              />
            </View>
            <View style={styles.detailsColumn}>
              <AircraftDetails aircraft={selected} />
            </View>
            <View style={styles.listColumn}>
              <AircraftList
                aircraft={feed.aircraft}
                selectedHex={effectiveSelectedHex}
                onSelect={setSelectedHex}
              />
            </View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.color.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topBarHeader: {
    flex: 1,
  },
  topBarAction: {
    paddingRight: theme.space.xl,
  },
  settingsButton: {
    backgroundColor: theme.color.panel,
    borderColor: theme.color.panelBorder,
    borderWidth: 2,
    borderRadius: theme.radius,
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.md,
  },
  settingsButtonFocused: {
    borderColor: theme.color.focusBorder,
    backgroundColor: theme.color.selected,
  },
  settingsButtonText: {
    color: theme.color.text,
    fontSize: theme.font.small,
    fontWeight: '600',
  },
  error: {
    color: theme.color.error,
    fontSize: theme.font.small,
    paddingHorizontal: theme.space.xl,
    paddingBottom: theme.space.sm,
  },
  loading: {
    color: theme.color.textMuted,
    fontSize: theme.font.small,
    paddingHorizontal: theme.space.xl,
    paddingBottom: theme.space.sm,
  },
  layout: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: theme.space.lg,
    paddingTop: theme.space.sm,
    paddingBottom: theme.space.lg,
  },
  radarColumn: {
    flex: 1.2,
  },
  detailsColumn: {
    flex: 1,
  },
  listColumn: {
    flex: 1,
  },
});

export default App;
