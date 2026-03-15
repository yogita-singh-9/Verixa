import { Button } from '@/components/Button';
import ControllerDashboard from '@/components/dashboard/ControllerDashboard';
import FacultyDashboard from '@/components/dashboard/FacultyDashboard';
import ManagementDashboard from '@/components/dashboard/ManagementDashboard';
import StudentDashboard from '@/components/dashboard/StudentDashboard';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';


export default function HomeScreen() {
  const { role, session, isLoading, signOut } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (role === 'student') return <StudentDashboard />;
  if (role === 'faculty') return <FacultyDashboard />;
  if (role === 'management') return <ManagementDashboard />;
  if (role === 'controller') return <ControllerDashboard />;

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { marginBottom: 10 }]}>Account Verification Failed</Text>
      <Text style={[styles.subText, { textAlign: 'center', marginBottom: 30 }]}>
        Your account details could not be verified or are incomplete.
      </Text>
      <Button
        title="Return to Login Screen"
        onPress={signOut}
        variant="primary"
        style={{ width: '80%' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  text: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subText: {
    color: '#888',
    marginTop: 10,
  },
});
