import { useAuth } from '@/src/auth/AuthProvider';
import { FloatingTabBar } from '@/src/components/FloatingTabBar';
import { ScrollProvider } from '@/src/components/ScrollContext';
import { Redirect, Tabs } from 'expo-router';

export default function TabsLayout() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <ScrollProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          animation: 'shift',
        }}
        tabBar={(props) => <FloatingTabBar {...props} />}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen
          name="patients"
          options={{ title: 'Patients', href: profile?.role === 'Patient' ? null : undefined }}
        />
        <Tabs.Screen
          name="households"
          options={{ title: 'Households', href: profile?.role === 'Patient' ? null : undefined }}
        />
        <Tabs.Screen
          name="tasks"
          options={{ title: 'Tasks', href: profile?.role === 'Patient' ? null : undefined }}
        />
        <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      </Tabs>
    </ScrollProvider>
  );
}
