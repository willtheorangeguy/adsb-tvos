import React, {useState} from 'react';
import {ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import type {PiAwareMode} from '@adsb/shared';
import {POLL_OPTIONS_MS, type AppConfig} from '../config';
import {TVButton} from './TVButton';
import {FocusRegion} from './FocusRegion';
export function SettingsOverlay({
  initial,
  onSave,
  onCancel,
}: {
  initial: AppConfig;
  firstRun?: boolean;
  onSave: (config: AppConfig) => void;
  onCancel: () => void;
}) {
  const [onlineDetails, setOnlineDetails] = useState(initial.onlineDetails);
  const [demo, setDemo] = useState(initial.demo);
  const [mode, setMode] = useState<PiAwareMode>(initial.mode);
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl);
  const [pollMs, setPollMs] = useState(initial.pollMs);
  const [lat, setLat] = useState(initial.latitude?.toString() ?? '');
  const [lon, setLon] = useState(initial.longitude?.toString() ?? '');
  const [error, setError] = useState('');
  const save = () => {
    if (!/^https?:\/\/[^\s/]+(?::\d+)?(?:\/[^\s]*)?$/i.test(baseUrl.trim())) {
      setError('Enter a complete http:// or https:// receiver address.');
      return;
    }
    if (
      (lat.trim() || lon.trim()) &&
      (!lat.trim() ||
        !lon.trim() ||
        !Number.isFinite(Number(lat)) ||
        !Number.isFinite(Number(lon)) ||
        Math.abs(Number(lat)) > 90 ||
        Math.abs(Number(lon)) > 180)
    ) {
      setError(
        'Enter both coordinates: latitude −90 to 90, longitude −180 to 180.',
      );
      return;
    }
    onSave({
      demo,
      onlineDetails,
      mode,
      baseUrl: baseUrl.trim().replace(/\/$/, ''),
      pollMs,
      latitude: lat.trim() ? Number(lat) : undefined,
      longitude: lon.trim() ? Number(lon) : undefined,
    });
  };
  return (
    <FocusRegion style={s.root}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        <View style={s.card}>
          <Text style={s.eyebrow}>MAKE YOURSELF AT HOME</Text>
          <Text style={s.title}>Your receiver. Your sky.</Text>
          <Text style={s.subtitle}>
            Connect a PiAware, dump1090 or readsb receiver on your local
            network.
          </Text>
          <Field
            title="Data source"
            hint="Demo traffic is synthetic and stays separate from your real sightings.">
            <TVButton
              label="Explore demo"
              active={demo}
              onPress={() => setDemo(true)}
            />
            <TVButton
              label="Local receiver"
              active={!demo}
              onPress={() => setDemo(false)}
            />
          </Field>
          <Field
            title="Connection"
            hint="Use Direct on Apple TV. For a browser without feeder CORS, use the local proxy.">
            <TVButton
              label="Direct"
              active={mode === 'direct'}
              onPress={() => setMode('direct')}
            />
            <TVButton
              label="Local proxy"
              active={mode === 'proxy'}
              onPress={() => setMode('proxy')}
            />
          </Field>
          <Field
            title="Receiver address"
            hint="Use the host root, e.g. http://192.168.1.50. Proxy default: http://localhost:7070.">
            <TextInput
              accessibilityLabel="Receiver address"
              style={s.input}
              value={baseUrl}
              onChangeText={setBaseUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </Field>
          <Field
            title="Receiver location"
            hint="Optional fallback if your receiver hides its location. Enables range and overhead direction.">
            <TextInput
              accessibilityLabel="Receiver latitude"
              placeholder="Latitude"
              placeholderTextColor="#657788"
              style={s.input}
              value={lat}
              onChangeText={setLat}
              keyboardType="numbers-and-punctuation"
            />
            <TextInput
              accessibilityLabel="Receiver longitude"
              placeholder="Longitude"
              placeholderTextColor="#657788"
              style={s.input}
              value={lon}
              onChangeText={setLon}
              keyboardType="numbers-and-punctuation"
            />
          </Field>
          <Field
            title="Refresh interval"
            hint="Aircraft update while the app is open.">
            {POLL_OPTIONS_MS.map(ms => (
              <TVButton
                key={ms}
                label={`${ms / 1000} seconds`}
                active={pollMs === ms}
                onPress={() => setPollMs(ms)}
              />
            ))}
          </Field>
          <Field
            title="Aircraft details"
            hint="Free · No account or API key required.">
            <TVButton
              label="Online details"
              active={onlineDetails}
              onPress={() => setOnlineDetails(true)}
            />
            <TVButton
              label="Local only"
              active={!onlineDetails}
              onPress={() => setOnlineDetails(false)}
            />
          </Field>
          <Text style={s.note}>
            Online details sends the selected aircraft’s ICAO hex to adsbdb and
            Planespotters.net for registry details and credited photos. Your
            receiver supplies all live positions. No lookups run in demo mode.
          </Text>
        </View>
      </ScrollView>
      <FocusRegion style={s.footer}>
        {!!error && (
          <Text accessibilityRole="alert" style={s.error}>
            {error}
          </Text>
        )}
        <View style={s.actions}>
          <TVButton label="Save settings" onPress={save} primary />
          <TVButton label="Cancel" onPress={onCancel} />
        </View>
      </FocusRegion>
    </FocusRegion>
  );
}
function Field({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <View style={s.field}>
      <View style={{width: '40%', paddingRight: 35}}>
        <Text style={s.fieldTitle}>{title}</Text>
        <Text style={s.hint}>{hint}</Text>
      </View>
      <View style={s.controls}>{children}</View>
    </View>
  );
}
const s = StyleSheet.create({
  root: {flex: 1},
  scroll: {flex: 1},
  footer: {
    width: 1280,
    alignSelf: 'center',
    backgroundColor: '#101824',
    borderRadius: 20,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#253142',
  },
  error: {color: '#ff9c8c', fontSize: 20, marginBottom: 12},
  content: {alignItems: 'center', paddingVertical: 12},
  card: {
    width: 1280,
    padding: 40,
    borderRadius: 24,
    backgroundColor: '#101824',
    borderWidth: 1,
    borderColor: '#253142',
  },
  eyebrow: {color: '#21df98', letterSpacing: 3, fontSize: 15},
  title: {fontSize: 42, color: '#edf4f8', fontWeight: '600', marginTop: 10},
  subtitle: {fontSize: 21, color: '#96a7b6', marginTop: 12, marginBottom: 24},
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 22,
    borderTopColor: '#253142',
    borderTopWidth: 1,
  },
  fieldTitle: {fontSize: 24, color: '#e8eff5'},
  hint: {fontSize: 17, lineHeight: 23, color: '#8c9dab', marginTop: 7},
  controls: {flex: 1, flexDirection: 'row', gap: 12},
  input: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#090f17',
    borderWidth: 2,
    borderColor: '#375349',
    borderRadius: 10,
    color: '#e4f0ea',
    padding: 16,
    fontSize: 22,
  },
  note: {color: '#95ad9e', fontSize: 18, lineHeight: 26},
  actions: {flexDirection: 'row', gap: 16, justifyContent: 'flex-end'},
});
