import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';

export default function TabsLayout() {
  const { status } = useAuth();
  const theme = useTheme();

  if (status === 'loading') {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  if (status === 'signedOut') {
    return <Redirect href="/" />;
  }

  return <AppTabs />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
