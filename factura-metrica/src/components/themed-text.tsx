import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fuentes, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'small' | 'smallBold' | 'subtitle';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return <Text style={[{ color: theme[themeColor ?? 'text'] }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fuentes.regular,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fuentes.semibold,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Fuentes.regular,
  },
  subtitle: {
    fontSize: 30,
    lineHeight: 40,
    fontFamily: Fuentes.semibold,
    letterSpacing: -0.5,
  },
});
