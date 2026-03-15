import { Button } from '@/components/Button';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Batch {
    id: string;
    branch: string;
    semester: string;
    batch_type: string;
    batch_group: string;
    subject: string;
    time: string;
}

interface AttendanceRecord {
    id: string;
    student_id: string;
    timestamp: string;
    student: {
        enrollment_no: string;
        full_name: string;
    };
}

export default function FacultyDashboard() {
    const { user } = useAuth();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanning, setScanning] = useState(false);
    const [loading, setLoading] = useState(true);

    const [batches, setBatches] = useState<Batch[]>([]);
    const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [scannedData, setScannedData] = useState<AttendanceRecord[]>([]);

    useEffect(() => {
        if (user) {
            fetchAssignedBatches();
        }
    }, [user]);

    const fetchAssignedBatches = async () => {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('batches')
            .select('*')
            .eq('faculty_id', user?.id)
            .eq('date', today);

        if (error) {
            Alert.alert('Error', 'Failed to fetch assigned batches');
            console.log(error);
        } else {
            setBatches(data || []);
        }
        setLoading(false);
    };

    const handleSelectBatch = async (batch: Batch) => {
        setSelectedBatch(batch);
        setLoading(true);

        // 1. Check if session exists for this batch today
        const { data: sessions, error } = await supabase
            .from('attendance_sessions')
            .select('id')
            .eq('batch_id', batch.id)
            .eq('created_by', user?.id)
            .eq('status', 'open') // Assuming we only care about open sessions or just the latest?
            .limit(1);

        if (error) {
            Alert.alert('Error', 'Failed to check session');
            setLoading(false);
            return;
        }

        let currentSessionId = sessions?.[0]?.id;

        if (!currentSessionId) {
            // Create new session
            const { data: newSession, error: createError } = await supabase
                .from('attendance_sessions')
                .insert({
                    batch_id: batch.id,
                    created_by: user?.id,
                    status: 'open'
                })
                .select()
                .single();

            if (createError) {
                Alert.alert('Error', 'Failed to create attendance session');
                setLoading(false);
                return;
            }
            currentSessionId = newSession.id;
        }

        setSessionId(currentSessionId);
        fetchAttendanceRecords(currentSessionId);
    };

    const fetchAttendanceRecords = async (sessId: string) => {
        const { data, error } = await supabase
            .from('attendance_records')
            .select('*, student:student_id(enrollment_no, full_name)')
            .eq('session_id', sessId)
            .order('timestamp', { ascending: false });

        if (error) {
            console.log('Fetch records error:', error);
        } else {
            setScannedData(data || []);
        }
        setLoading(false);
    };

    const handleBarCodeScanned = async ({ type, data }: { type: string, data: string }) => {
        // Debounce?
        if (!sessionId) return;

        try {
            const parsed = JSON.parse(data);
            const studentId = parsed.id; // Assuming QR contains { id: uuid, ... }

            if (scannedData.find(r => r.student_id === studentId)) {
                Alert.alert('Already Scanned', 'Student already marked present.');
                setScanning(false);
                return;
            }

            // Validation: Check if student belongs to this batch's branch & semester
            const { data: studentProfile, error: profileError } = await supabase
                .from('profiles')
                .select('branch, semester, full_name, enrollment_no')
                .eq('id', studentId)
                .single();

            if (profileError || !studentProfile) {
                Alert.alert('Error', 'Student not found in database.');
                setScanning(false);
                return;
            }

            const batchSem = selectedBatch?.semester; // e.g. "3rd"
            const studentSem = studentProfile.semester?.toString(); // e.g. 3 -> "3"

            // Normalize comparison (handle "3rd" vs "3")
            const isSemMatch = batchSem?.includes(studentSem || '999');
            const isBranchMatch = selectedBatch?.branch === studentProfile.branch;

            if (!isSemMatch || !isBranchMatch) {
                Alert.alert(
                    'Invalid Student',
                    `This student (${studentProfile.full_name}) belongs to ${studentProfile.branch} ${studentProfile.semester} Sem.\n\nBatch is for ${selectedBatch?.branch} ${selectedBatch?.semester} Sem.`
                );
                setScanning(false);
                return;
            }

            // Insert Record
            const { error } = await supabase.from('attendance_records').insert({
                session_id: sessionId,
                student_id: studentId,
                status: 'present',
                timestamp: new Date().toISOString(),
                location_data: parsed.location || null
            });

            if (error) {
                if (error.code === '23505') { // Unique violation
                    Alert.alert('Info', 'Already marked.');
                } else {
                    Alert.alert('Error', 'Failed to mark attendance');
                }
            } else {
                Alert.alert('Success', `Marked ${parsed.enrollment || 'Student'}`);
                fetchAttendanceRecords(sessionId); // Refresh list
            }

            setScanning(false);

        } catch (e) {
            Alert.alert('Error', 'Invalid QR Code');
            setScanning(false);
        }
    };

    const submitAttendance = async () => {
        if (!sessionId) return;

        Alert.alert(
            'Submit Attendance',
            'Are you sure you want to finalize this session? No more scans will be allowed.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Submit',
                    onPress: async () => {
                        const { error } = await supabase
                            .from('attendance_sessions')
                            .update({ status: 'submitted' })
                            .eq('id', sessionId);

                        if (error) {
                            Alert.alert('Error', error.message);
                        } else {
                            Alert.alert('Success', 'Attendance submitted.');
                            setSelectedBatch(null);
                            setSessionId(null);
                            fetchAssignedBatches();
                        }
                    }
                }
            ]
        );
    };

    if (!permission) return <View />;
    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>Camera permission required</Text>
                <Button onPress={requestPermission} title="Grant Permission" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {loading && !selectedBatch && <ActivityIndicator size="large" color={Colors.dark.primary} />}

            {!selectedBatch ? (
                <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                    <View style={styles.headerRow}>
                        <Text style={styles.title}>Assigned Batches</Text>
                        <TouchableOpacity onPress={fetchAssignedBatches}>
                            <Ionicons name="refresh" size={24} color={Colors.dark.primary} />
                        </TouchableOpacity>
                    </View>

                    {batches.length === 0 && !loading ? (
                        <Text style={styles.emptyText}>No batches assigned for today.</Text>
                    ) : (
                        batches.map(batch => (
                            <TouchableOpacity
                                key={batch.id}
                                style={styles.batchCard}
                                onPress={() => handleSelectBatch(batch)}
                            >
                                <View>
                                    <View style={styles.badgeRow}>
                                        <Text style={styles.batchValues}>{batch.branch} {batch.semester}</Text>
                                        <View style={styles.badge}>
                                            <Text style={styles.badgeText}>{batch.batch_type} - {batch.batch_group}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.subject}>{batch.subject}</Text>
                                    <Text style={styles.time}>{batch.time}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={24} color="#666" />
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            ) : (
                <View style={{ flex: 1 }}>
                    <View style={styles.batchHeader}>
                        <TouchableOpacity onPress={() => setSelectedBatch(null)}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={{ marginLeft: 15 }}>
                            <Text style={styles.batchName}>{selectedBatch.branch} {selectedBatch.semester} ({selectedBatch.batch_type})</Text>
                            <Text style={styles.subject}>{selectedBatch.subject}</Text>
                        </View>
                    </View>

                    <View style={styles.statsContainer}>
                        <Text style={styles.statsText}>Present: {scannedData.length}</Text>
                        {loading && <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 10 }} />}
                    </View>

                    <ScrollView style={styles.listContainer}>
                        {scannedData.map((record) => (
                            <View key={record.id} style={styles.studentRow}>
                                <Text style={styles.studentText}>{record.student?.enrollment_no || 'Unknown'}</Text>
                                <Text style={styles.bsideText}>{record.student?.full_name}</Text>
                                <Text style={styles.timeText}>{new Date(record.timestamp).toLocaleTimeString()}</Text>
                            </View>
                        ))}
                        {scannedData.length === 0 && !loading && (
                            <Text style={styles.emptyText}>No students scanned yet.</Text>
                        )}
                    </ScrollView>

                    <View style={styles.actionButtons}>
                        <Button
                            title="Scan QR"
                            onPress={() => setScanning(true)}
                            variant="primary"
                            style={{ marginBottom: 10 }}
                        />
                        <Button
                            title="Submit Attendance"
                            onPress={submitAttendance}
                            variant="secondary"
                            disabled={scannedData.length === 0}
                        />
                    </View>

                    <Modal visible={scanning} animationType="slide">
                        <View style={{ flex: 1, backgroundColor: 'black' }}>
                            <CameraView
                                style={StyleSheet.absoluteFill}
                                onBarcodeScanned={handleBarCodeScanned}
                                barcodeScannerSettings={{
                                    barcodeTypes: ["qr"],
                                }}
                            />
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setScanning(false)}
                            >
                                <Ionicons name="close-circle" size={50} color={Colors.dark.primary} />
                            </TouchableOpacity>
                            <View style={styles.overlay}>
                                <View style={styles.scanFrame} />
                                <Text style={styles.overlayText}>Align QR code within frame</Text>
                            </View>
                        </View>
                    </Modal>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    message: {
        textAlign: 'center',
        paddingBottom: 10,
        color: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    batchCard: {
        backgroundColor: '#1E1E1E',
        padding: 20,
        borderRadius: 12,
        marginBottom: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    batchValues: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginRight: 10,
    },
    badge: {
        backgroundColor: '#333',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        color: '#aaa',
        fontSize: 10,
        fontWeight: 'bold',
    },
    subject: {
        color: '#ccc',
        fontSize: 14,
    },
    time: {
        color: Colors.dark.primary,
        fontWeight: 'bold',
        marginTop: 4,
        fontSize: 12,
    },
    batchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    batchName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    statsContainer: {
        backgroundColor: '#333',
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    statsText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    listContainer: {
        flex: 1,
        backgroundColor: '#111',
        borderRadius: 8,
        marginBottom: 20,
        padding: 10,
        maxHeight: '50%',
    },
    studentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    studentText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    bsideText: {
        color: '#aaa',
        fontSize: 14,
        flex: 1,
        textAlign: 'right',
        marginRight: 10,
    },
    timeText: {
        color: '#666',
        fontSize: 12,
    },
    emptyText: {
        color: '#666',
        textAlign: 'center',
        marginTop: 20,
    },
    actionButtons: {
        marginTop: 10,
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
    },
    overlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanFrame: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: Colors.dark.primary,
        backgroundColor: 'transparent',
    },
    overlayText: {
        color: 'white',
        marginTop: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 10,
        borderRadius: 5,
    }
});
