import React, {useMemo} from 'react';
import {Platform, StyleSheet, Text, View} from 'react-native';
import {qrMatrix, sightingText, type Sighting} from '@adsb/shared';
import {downloadFile} from '../download';
import {TVButton} from './TVButton';
export function ShareSighting({
  sighting,
  onClose,
}: {
  sighting: Sighting;
  onClose: () => void;
}): React.JSX.Element {
  const text = sightingText(sighting);
  const matrix = useMemo(() => qrMatrix(text), [text]);
  const save = () =>
    downloadFile(text, `sighting-${sighting.aircraft.hex}.txt`, 'text/plain');
  return (
    <View style={s.root}>
      <View style={s.card}>
        <Text style={s.eyebrow}>ONE FOR THE LOGBOOK</Text>
        <Text style={s.title}>Take this sighting with you.</Text>
        <View style={s.content}>
          <View style={s.qr}>
            {matrix.map((row, i) => (
              <View key={i} style={{flexDirection: 'row'}}>
                {row.map((dark, j) => (
                  <View
                    key={j}
                    style={{
                      width: 6,
                      height: 6,
                      backgroundColor: dark ? '#000' : '#fff',
                    }}
                  />
                ))}
              </View>
            ))}
          </View>
          <View style={{flex: 1, gap: 25}}>
            <Text style={s.text}>{text}</Text>
            <Text style={s.hint}>
              Scan this QR code with your phone to copy the sighting. All
              details are embedded in the code.
            </Text>
            <View style={{flexDirection: 'row', gap: 16}}>
              {Platform.OS === 'web' && (
                <TVButton label="↓  Save sighting" onPress={save} primary />
              )}
              <TVButton label="Back to app" onPress={onClose} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  root: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  card: {
    width: 1250,
    padding: 50,
    backgroundColor: '#101824',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#253142',
  },
  eyebrow: {fontSize: 16, letterSpacing: 2, color: '#22e69d'},
  title: {fontSize: 42, color: '#edf4f8', fontWeight: '600', marginTop: 15},
  content: {flexDirection: 'row', alignItems: 'center', gap: 60, marginTop: 40},
  qr: {padding: 24, backgroundColor: '#fff', alignSelf: 'center'},
  text: {fontSize: 23, lineHeight: 36, color: '#dae7ee'},
  hint: {fontSize: 20, lineHeight: 30, color: '#8fa3b1'},
});
