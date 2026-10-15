import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, View, StyleSheet } from 'react-native';

import { Icono } from './icono';
import { ThemedText } from './themed-text';

import type { Pestana } from '@/constants/pestanas';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

export default function AppTabs({ pestanas }: { pestanas: Pestana[] }) {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          {pestanas.map((pestana) => (
            <TabTrigger key={pestana.name} name={pestana.name} href={pestana.href} asChild>
              <TabButton ios={pestana.ios} md={pestana.md}>
                {pestana.etiqueta}
              </TabButton>
            </TabTrigger>
          ))}
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & Pick<Pestana, 'ios' | 'md'>;

export function TabButton({ children, isFocused, ios, md, ...props }: TabButtonProps) {
  const color = isFocused ? Colors.primary : Colors.textSecondary;
  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <View style={[styles.icono, isFocused && { backgroundColor: Colors.primarySoft }]}>
        <Icono ios={ios} md={md} size={22} color={color} />
      </View>
      <ThemedText type="small" style={[styles.etiqueta, { color }]}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <View style={styles.innerContainer}>{props.children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  innerContainer: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingVertical: Spacing.two,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
  },
  icono: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  etiqueta: {
    fontSize: 12,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.7,
  },
});
