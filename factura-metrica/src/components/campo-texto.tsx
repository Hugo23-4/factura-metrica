import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CampoTextoProps = TextInputProps & {
  etiqueta: string;
  error?: string | false;
  ayuda?: string;
};

export function CampoTexto({ etiqueta, error, ayuda, multiline, style, ...rest }: CampoTextoProps) {
  const theme = useTheme();
  return (
    <View style={styles.campo}>
      <ThemedText type="smallBold">{etiqueta}</ThemedText>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        multiline={multiline}
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.background,
            borderColor: error ? theme.rojo : theme.border,
          },
          multiline && styles.multilinea,
          style,
        ]}
        {...rest}
      />
      {error ? (
        <ThemedText type="small" style={{ color: theme.rojo }}>
          {error}
        </ThemedText>
      ) : (
        ayuda && (
          <ThemedText type="small" themeColor="textSecondary">
            {ayuda}
          </ThemedText>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  campo: {
    gap: Spacing.one,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
    fontSize: 16,
  },
  multilinea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
});
