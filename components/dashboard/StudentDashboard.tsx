import { Button } from '@/components/Button';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const { width } = Dimensions.get('window');

export default function StudentDashboard() {
    const { user, role } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [qrData, setQrData] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [lastGenerated, setLastGenerated] = useState<string>('');

    // Fetch profile data (simulated or real)
    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user?.id)
                .single();

            if (data) {
                setProfile({
                    fullName: data.full_name,
                    enrollmentNo: data.enrollment_no,
                    branch: data.branch,
                    semester: data.semester,
                    aadhaar: data.aadhaar_no
                });
                // Delay generation slightly to ensure profile is set
                setTimeout(() => generateQR(data), 100);
            } else if (error) {
                console.error("Error fetching profile:", error);
                Alert.alert("Error", error.message);
                setLoading(false); // Stop loading even if there's an error
            } else {
                // No data found, perhaps new user. Set a default or handle.
                console.log("No profile data found for user:", user?.id);
                setLoading(false);
            }
        } catch (e) {
            console.error("Catch error fetching profile:", e);
            Alert.alert("Error", "Failed to fetch profile data.");
            setLoading(false);
        }
    };

    const generateQR = async (profileData = profile) => {
        setRegenerating(true);
        let locData = location;

        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission to access location was denied');
                // Proceed without location or block? Requirement says "exact location data".
                // We'll proceed with null for now to not block app.
            } else {
                locData = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
                setLocation(locData);
            }
        } catch (e) {
            console.log('Location error', e);
        }

        const timestamp = new Date().toISOString();
        setLastGenerated(new Date().toLocaleTimeString());

        const data = JSON.stringify({
            id: user?.id,
            role: 'student',
            timestamp: timestamp,
            location: {
                lat: locData?.coords.latitude,
                long: locData?.coords.longitude,
            },
            // Include minimal identity info for verification if offline
            enrollment: profileData?.enrollment_no || profileData?.enrollmentNo,
        });

        setQrData(data);
        setLoading(false);
        setRegenerating(false);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.dark.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.welcome}>Welcome,</Text>
                <Text style={styles.name}>{profile?.fullName}</Text>
            </View>

            <View style={styles.card}>
                <View style={styles.profileRow}>
                    <Ionicons name="person-circle-outline" size={24} color="#888" />
                    <View>
                        <Text style={styles.profileText}>{profile?.enrollmentNo}</Text>
                        <Text style={[styles.profileText, { fontSize: 12, color: '#aaa' }]}>{profile?.branch}</Text>
                    </View>
                </View>
                <View style={styles.profileRow}>
                    <Ionicons name="time-outline" size={24} color="#888" />
                    <Text style={styles.profileText}>Semester {profile?.semester}</Text>
                </View>
                <View style={styles.profileRow}>
                    <Ionicons name="card-outline" size={24} color="#888" />
                    <Text style={styles.profileText}>
                        Aadhaar: <Text style={{ color: Colors.dark.primary, fontWeight: 'bold' }}>{profile?.aadhaar}</Text>
                    </Text>
                </View>
            </View>

            <View style={styles.qrContainer}>
                <Text style={styles.qrTitle}>Verification QR</Text>
                <Text style={styles.qrSubtitle}>Present this to the invigilator</Text>

                <View style={styles.qrWrapper}>
                    {qrData && (
                        <QRCode
                            value={qrData}
                            size={width * 0.6}
                            backgroundColor="white"
                            color="black"
                        />
                    )}
                </View>

                {location && (
                    <View style={styles.locationRow}>
                        <Ionicons name="location-sharp" size={16} color={Colors.dark.primary} />
                        <Text style={styles.locationText}>
                            {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
                        </Text>
                    </View>
                )}

                <Button
                    title="Regenerate QR"
                    onPress={generateQR}
                    isLoading={regenerating}
                    style={styles.regenButton}
                />

                <Text style={styles.lastGenerated}>Last generated: {lastGenerated}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        marginBottom: 20,
    },
    welcome: {
        fontSize: 16,
        color: '#888',
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    card: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    profileText: {
        color: '#CCC',
        marginLeft: 10,
        fontSize: 14,
    },
    qrContainer: {
        backgroundColor: '#1E1E1E',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        flex: 1,
    },
    qrTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    qrSubtitle: {
        color: '#888',
        marginBottom: 20,
    },
    qrWrapper: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    locationText: {
        color: '#888',
        marginLeft: 5,
    },
    regenButton: {
        width: '100%',
        backgroundColor: Colors.dark.primary,
    },
    lastGenerated: {
        marginTop: 10,
        color: '#666',
        fontSize: 12,
    },
});
