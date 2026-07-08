import React, {useState} from 'react';
import {StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';

import type {PiAwareMode} from '@adsb/shared';

import {POLL_OPTIONS_MS, type AppConfig} from '../config';
import {theme} from '../theme';

interface SettingsOverlayProps {
  initial: AppConfig;
  firstRun: boolean;
  onSave: (config: AppConfig) => void;
  onCancel: () => void;
}

interface FocusButtonProps {
  label: string;
  onPress: () => void;
  selected?: boolean;
  primary?: boolean;
  hasTVPreferredFocus?: boolean;
}

function FocusButton({label, onPress, selected, primary, hasTVPreferredFocus}: FocusButtonProps) {
  const [focused, setFocused] = useState(false);
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      hasTVPreferredFocus={hasTVPreferredFocus}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[
        styles.button,
        primary && styles.buttonPrimary,
        selected && styles.buttonSelected,
        focused && styles.buttonFocused,
      ]}>
      <Text style={[styles.buttonText, (selected || primary) && styles.buttonTextStrong]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Field({label, hint, children}: {label: string; hint?: string; children: React.ReactNode}) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelBlock}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      </View>
      <View style={styles.fieldControl}>{children}</View>
    </View>
  );
}

export function SettingsOverlay({initial, firstRun, onSave, onCancel}: SettingsOverlayProps) {
  const [demo, setDemo] = useState(initial.demo);
  const [mode, setMode] = useState<PiAwareMode>(initial.mode);
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl);
  const [pollMs, setPollMs] = useState(initial.pollMs);
  const [urlFocused, setUrlFocused] = useState(false);

  const save = () => {
    const trimmed = baseUrl.trim();
    onSave({demo, mode, baseUrl: trimmed || initial.baseUrl, pollMs});
  };

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>
          {firstRun
            ? 'Welcome! Point the app at your PiAware feeder, or explore with demo data.'
            : 'Configure how the app connects to your PiAware feeder.'}
        </Text>

        <Field label="Data source" hint="Demo shows synthetic traffic without a feeder.">
          <FocusButton
            label="Demo data"
            selected={demo}
            hasTVPreferredFocus
            onPress={() => setDemo(true)}
          />
          <FocusButton label="Live feeder" selected={!demo} onPress={() => setDemo(false)} />
        </Field>

        <Field label="Connection mode" hint="Direct talks to the feeder; Proxy uses the CORS proxy.">
          <FocusButton label="Direct" selected={mode === 'direct'} onPress={() => setMode('direct')} />
          <FocusButton label="Proxy" selected={mode === 'proxy'} onPress={() => setMode('proxy')} />
        </Field>

        <Field label="Feeder URL" hint="e.g. http://piaware.local or http://192.168.1.50">
          <TextInput
            style={[styles.input, urlFocused && styles.inputFocused]}
            value={baseUrl}
            onChangeText={setBaseUrl}
            onFocus={() => setUrlFocused(true)}
            onBlur={() => setUrlFocused(false)}
            placeholder="http://piaware.local"
            placeholderTextColor={theme.color.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </Field>

        <Field label="Poll interval">
          {POLL_OPTIONS_MS.map((ms) => (
            <FocusButton
              key={ms}
              label={`${ms / 1000}s`}
              selected={pollMs === ms}
              onPress={() => setPollMs(ms)}
            />
          ))}
        </Field>

        <View style={styles.actions}>
          <FocusButton label="Save" primary onPress={save} />
          {!firstRun ? <FocusButton label="Cancel" onPress={onCancel} /> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.space.xl,
  },
  card: {
    width: '78%',
    maxWidth: 1100,
    backgroundColor: theme.color.panel,
    borderColor: theme.color.panelBorder,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: theme.space.xl,
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
    marginBottom: theme.space.lg,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.space.sm,
    borderTopColor: theme.color.panelBorder,
    borderTopWidth: 1,
  },
  fieldLabelBlock: {
    width: '38%',
    paddingRight: theme.space.md,
  },
  fieldLabel: {
    color: theme.color.text,
    fontSize: theme.font.body,
    fontWeight: '600',
  },
  fieldHint: {
    color: theme.color.textMuted,
    fontSize: theme.font.small,
    marginTop: 2,
  },
  fieldControl: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  button: {
    backgroundColor: theme.color.background,
    borderColor: theme.color.panelBorder,
    borderWidth: 2,
    borderRadius: theme.radius,
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.md,
    marginRight: theme.space.sm,
    marginVertical: theme.space.xs,
  },
  buttonSelected: {
    backgroundColor: theme.color.selected,
    borderColor: theme.color.accent,
  },
  buttonPrimary: {
    backgroundColor: theme.color.accent,
    borderColor: theme.color.accent,
  },
  buttonFocused: {
    borderColor: theme.color.focusBorder,
  },
  buttonText: {
    color: theme.color.textMuted,
    fontSize: theme.font.small,
    fontWeight: '600',
  },
  buttonTextStrong: {
    color: theme.color.text,
  },
  input: {
    flex: 1,
    minWidth: 320,
    color: theme.color.text,
    fontSize: theme.font.body,
    backgroundColor: theme.color.background,
    borderColor: theme.color.panelBorder,
    borderWidth: 2,
    borderRadius: theme.radius,
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.md,
    marginVertical: theme.space.xs,
  },
  inputFocused: {
    borderColor: theme.color.focusBorder,
  },
  actions: {
    flexDirection: 'row',
    marginTop: theme.space.lg,
    paddingTop: theme.space.md,
    borderTopColor: theme.color.panelBorder,
    borderTopWidth: 1,
  },
});
