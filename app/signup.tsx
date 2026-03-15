import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { SelectInput } from '@/components/SelectInput';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

const BRANCHES = [
    'Computer Science Engineering',
    'Artificial Intelligence & Data Science',
    'Information Technology',
    'Electronics & Communication Engineering',
    'Mechanical Engineering',
    'Electrical Engineering',
    'Civil Engineering',
    'Mechatronics Engineering',
    'Industrial Production Engineering'
];

export default function SignupScreen() {
    const [formData, setFormData] = useState({
        fullName: '',
        enrollmentNo: '',
        branch: '',
        semester: '',
        phone: '',
        email: '',
        aadhaar: '',
        password: '',
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSignup = async () => {
        const { email, password, fullName, enrollmentNo, branch, semester, phone, aadhaar } = formData;

        if (!email || !password || !fullName || !enrollmentNo || !branch || !semester || !phone || !aadhaar) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setIsLoading(true);

        // Sign up with Supabase Auth
        const { data: { session, user }, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    // Other metadata will be handled by the trigger or manual insertion if trigger fails
                },
            },
        });

        if (error) {
            Alert.alert('Signup Failed', error.message);
            setIsLoading(false);
            return;
        }

        if (user) {
            // Manually insert into profiles (if trigger not set up or for redundancy)
            // Note: RLS allows inserting own profile
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    email: email,
                    role: 'student', // Enforce student role
                    full_name: fullName,
                    enrollment_no: enrollmentNo,
                    branch: branch,
                    semester: parseInt(semester) || 1,
                    phone_number: phone,
                    aadhaar_no: aadhaar,
                });

            if (profileError) {
                console.error('Profile creation error:', profileError);
                Alert.alert('Warning', 'Account created but profile setup failed. Please contact support.');
            } else {
                Alert.alert('Success', 'Account created successfully!', [
                    { text: 'OK', onPress: () => router.replace('/(tabs)') }
                ]);
            }
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
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Student Registration</Text>
                </View>

                <View style={styles.form}>
                    <Input
                        placeholder="Full Name"
                        icon="person"
                        value={formData.fullName}
                        onChangeText={(t) => handleChange('fullName', t)}
                    />
                    <Input
                        placeholder="Enrollment No. (e.g. 1234AB123456)"
                        icon="card"
                        value={formData.enrollmentNo}
                        onChangeText={(t) => handleChange('enrollmentNo', t)}
                    />
                    <SelectInput
                        placeholder="Select Branch"
                        icon="school"
                        value={formData.branch}
                        options={BRANCHES}
                        onSelect={(t) => handleChange('branch', t)}
                    />
                    <Input
                        placeholder="Semester (1-8)"
                        icon="calendar"
                        keyboardType="numeric"
                        value={formData.semester}
                        onChangeText={(t) => handleChange('semester', t)}
                    />
                    <Input
                        placeholder="Phone Number"
                        icon="call"
                        keyboardType="phone-pad"
                        value={formData.phone}
                        onChangeText={(t) => handleChange('phone', t)}
                    />
                    <Input
                        placeholder="Email ID"
                        icon="mail"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={formData.email}
                        onChangeText={(t) => handleChange('email', t)}
                    />
                    <Input
                        placeholder="Aadhaar Number (12 digits)"
                        icon="finger-print"
                        keyboardType="numeric"
                        value={formData.aadhaar}
                        onChangeText={(t) => handleChange('aadhaar', t)}
                    />
                    <Input
                        placeholder="Password"
                        icon="lock-closed"
                        isPassword
                        value={formData.password}
                        onChangeText={(t) => handleChange('password', t)}
                    />

                    <Button
                        title="Sign Up"
                        onPress={handleSignup}
                        isLoading={isLoading}
                        style={styles.signupButton}
                    />

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <Link href="/login" asChild>
                            <Text style={styles.link}>Login</Text>
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
        paddingTop: 60,
    },
    header: {
        marginBottom: 30,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        color: '#888',
    },
    form: {
        width: '100%',
    },
    signupButton: {
        marginTop: 20,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    footerText: {
        color: '#888',
    },
    link: {
        color: Colors.dark.primary,
        fontWeight: 'bold',
    },
});
