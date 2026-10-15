import { NativeTabs } from 'expo-router/unstable-native-tabs';

import type { Pestana } from '@/constants/pestanas';
import { Colors } from '@/constants/theme';

export default function AppTabs({ pestanas }: { pestanas: Pestana[] }) {
  return (
    <NativeTabs
      backgroundColor={Colors.background}
      indicatorColor={Colors.primarySoft}
      iconColor={{ default: Colors.textSecondary, selected: Colors.primary }}
      labelStyle={{
        default: { color: Colors.textSecondary },
        selected: { color: Colors.primary },
      }}>
      {pestanas.map((pestana) => (
        <NativeTabs.Trigger key={pestana.name} name={pestana.name}>
          <NativeTabs.Trigger.Label>{pestana.etiqueta}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={pestana.ios} md={pestana.md} />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
