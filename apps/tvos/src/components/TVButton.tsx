import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
export function TVButton({
  label,
  onPress,
  active,
  primary,
  style,
  onFocus,
  children,
  preferred,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  primary?: boolean;
  style?: StyleProp<ViewStyle>;
  onFocus?: () => void;
  children?: React.ReactNode;
  preferred?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{selected: !!active}}
      hasTVPreferredFocus={preferred}
      activeOpacity={0.85}
      onPress={onPress}
      onFocus={() => {
        setFocused(true);
        onFocus?.();
      }}
      onBlur={() => setFocused(false)}
      style={[
        s.button,
        active && s.active,
        primary && s.primary,
        style,
        focused && s.focus,
        focused && !!children && {backgroundColor: '#234c3c'},
      ]}>
      {children ?? (
        <Text
          style={[
            s.text,
            (primary || focused) && s.dark,
            active && !focused && !primary && s.green,
          ]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
const s = StyleSheet.create({
  button: {
    paddingHorizontal: 23,
    paddingVertical: 16,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#26313c',
    backgroundColor: '#10161e',
    justifyContent: 'center',
  },
  active: {borderColor: '#187b57', backgroundColor: '#10261f'},
  primary: {backgroundColor: '#22e69d', borderColor: '#22e69d'},
  focus: {backgroundColor: '#c5ffe6', borderColor: '#fff'},
  text: {
    color: '#c0cad6',
    fontSize: 21,
    fontWeight: '600',
    textAlign: 'center',
  },
  dark: {color: '#072219'},
  green: {color: '#22e69d'},
});
