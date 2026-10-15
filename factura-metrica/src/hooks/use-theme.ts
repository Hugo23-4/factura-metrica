import { Colors } from '@/constants/theme';

/** La app usa siempre el tema claro; el hook se mantiene como único punto de acceso a la paleta. */
export function useTheme() {
  return Colors;
}
