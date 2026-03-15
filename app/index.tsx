import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
    const { session, role, isLoading, signOut } = useAuth();

    // Auto-logout if session exists but no role (invalid state)
    if (!isLoading && session && !role) {
        signOut();
        return <Redirect href="/login" />;
    }

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark.background }}>
                <ActivityIndicator size="large" color={Colors.dark.primary} />
            </View>
        );
    }

    if (!session) {
        return <Redirect href="/login" />;
    }

    return <Redirect href="/(tabs)" />;
}
