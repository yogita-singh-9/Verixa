import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setIsLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            Alert.alert('Login Failed', error.message);
        } else {
            router.replace('/(tabs)');
        }
        setIsLoading(false);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>VERIXA</Text>
                    <Text style={styles.subtitle}>Secure Attendance System</Text>
                </View>

                <View style={styles.form}>
                    <Input
                        placeholder="Email / Enrollment No."
                        icon="person-outline"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                    />
                    <Input
                        placeholder="Password"
                        icon="lock-closed-outline"
                        isPassword
                        value={password}
                        onChangeText={setPassword}
                    />

                    <Button
                        title="Login"
                        onPress={handleLogin}
                        isLoading={isLoading}
                        style={styles.loginButton}
                    />

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>New student? </Text>
                        <Link href="/signup" asChild>
                            <Text style={styles.link}>Create Account</Text>
                        </Link>
                    </View>


                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 50,
    },
    title: {
        fontSize: 42,
        fontWeight: '900',
        color: Colors.dark.primary,
        marginBottom: 10,
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 16,
        color: '#888',
        letterSpacing: 1,
    },
    form: {
        width: '100%',
    },
    loginButton: {
        marginTop: 20,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    footerText: {
        color: '#888',
    },
    link: {
        color: Colors.dark.primary,
        fontWeight: 'bold',
    },
    dummyHint: {
        marginTop: 40,
        padding: 15,
        backgroundColor: '#1E1E1E',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
    },
    dummyTitle: {
        color: '#666',
        fontWeight: 'bold',
        marginBottom: 5,
        fontSize: 12,
    },
    dummyText: {
        color: '#555',
        fontSize: 12,
        fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
    },
});
