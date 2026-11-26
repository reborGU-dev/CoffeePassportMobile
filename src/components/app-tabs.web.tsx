import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, useColorScheme, View, StyleSheet } from 'react-native';

import { Icon, type IconName } from './ui/icon';
import { ThemedText } from './themed-text';

import { Colors, MaxContentWidth, Radius, Spacing, Type } from '@/constants/theme';

const TAB_ICONS: Record<string, IconName> = {
  mapa: 'map',
  pasaporte: 'book',
  perfil: 'person-circle',
};

const TAB_ICONS_ACTIVE: Record<string, IconName> = {
  mapa: 'map',
  pasaporte: 'book',
  perfil: 'person-circle',
};

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="mapa" href="/mapa" asChild>
            <TabButton icon="mapa">Mapa</TabButton>
          </TabTrigger>
          <TabTrigger name="pasaporte" href="/pasaporte" asChild>
            <TabButton icon="pasaporte">Pasaporte</TabButton>
          </TabTrigger>
          <TabTrigger name="perfil" href="/perfil" asChild>
            <TabButton icon="perfil">Perfil</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = Omit<TabTriggerSlotProps, 'ref'> & { icon: string };

export function TabButton({ children, isFocused, icon, ...props }: TabButtonProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Pressable
      {...props}
      style={({ pressed }) => [styles.tabPressable, pressed && styles.pressed]}>
      <View
        style={[
          styles.tabButtonView,
          isFocused && { backgroundColor: colors.backgroundSelected },
        ]}>
        <Icon
          name={isFocused ? TAB_ICONS_ACTIVE[icon] : TAB_ICONS[icon]}
          size={18}
          color={isFocused ? colors.primary : colors.textSecondary}
        />
        <ThemedText
          type="small"
          themeColor={isFocused ? 'text' : 'textSecondary'}
          style={[
            styles.tabLabel,
            isFocused && styles.tabLabelActive,
          ]}>
          {children}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View style={styles.tabListContainer}>
      {/* Contenedor flotante tipo "pill" */}
      <View
        style={[
          styles.innerContainer,
          {
            backgroundColor: colors.backgroundElement,
            borderColor: colors.border,
          },
        ]}>
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    bottom: Spacing.three,
    width: '100%',
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    flexGrow: 1,
    gap: Spacing.one,
    maxWidth: MaxContentWidth,
    // Sombra editorial sutil
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#1C130D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  tabPressable: {
    flex: 1,
  },
  pressed: {
    opacity: 0.65,
  },
  tabButtonView: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one + 2,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
  },
  tabLabel: {
    ...Type.caption,
    fontWeight: '600',
  },
  tabLabelActive: {
    fontWeight: '700',
  },
});
