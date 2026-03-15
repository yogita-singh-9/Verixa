import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Batch {
    id: string;
    branch: string;
    semester: string;
    subject: string;
    batch_type: string;
    profiles?: { full_name: string }; // Faculty Name
    status?: string; // Derived from attendance_sessions
}

interface Stats {
    totalFaculty: number;
    totalStudents: number;
    todaysAttendance: number;
}

export default function ManagementDashboard() {
    const [selectedBatch, setSelectedBatch] = useState<any>(null);
    const [stats, setStats] = useState<Stats>({ totalFaculty: 0, totalStudents: 0, todaysAttendance: 0 });
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);
    const [batchRecords, setBatchRecords] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // 1. Stats
            const { count: facCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'faculty');
            const { count: stuCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');

            const today = new Date().toISOString().split('T')[0];
            const { count: attCount } = await supabase.from('attendance_records')
                .select('*', { count: 'exact', head: true })
                .gte('timestamp', `${today}T00:00:00`)
                .lte('timestamp', `${today}T23:59:59`);

            setStats({
                totalFaculty: facCount || 0,
                totalStudents: stuCount || 0,
                todaysAttendance: attCount || 0
            });

            // 2. Batches (Recent top 10 or today's)
            // Fetch batches and join with attendance_sessions to check status?
            // For now, list Today's batches
            const { data: batchData, error } = await supabase
                .from('batches')
                .select('*, profiles:faculty_id(full_name)')
                .order('date', { ascending: false })
                .limit(20);

            if (batchData) setBatches(batchData);

        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectBatch = async (batch: Batch) => {
        // Fetch specific batch records if needed
        const { data } = await supabase
            .from('attendance_sessions')
            .select('*, attendance_records(*, student:student_id(full_name, enrollment_no))')
            .eq('batch_id', batch.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        // If a session exists, show its records
        if (data) {
            const records = data.attendance_records?.map((r: any) => ({
                id: r.id,
                enrollment: r.student?.enrollment_no,
                status: r.status,
                time: new Date(r.timestamp).toLocaleTimeString(),
                name: r.student?.full_name,
                location: r.location_data
            })) || [];

            setSelectedBatch({ ...batch, status: data.status, records });
        } else {
            // No session yet
            setSelectedBatch({ ...batch, status: 'Pending', records: [] });
        }
    };

    const toggleStatus = async (recordId: string, currentStatus: string) => {
        if (!isEditing) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const newStatus = currentStatus === 'present' ? 'absent' : 'present';

        // Optimistic update
        const updatedRecords = selectedBatch.records.map((r: any) =>
            r.id === recordId ? { ...r, status: newStatus } : r
        );
        setSelectedBatch({ ...selectedBatch, records: updatedRecords });

        // API call
        const { error } = await supabase
            .from('attendance_records')
            .update({ status: newStatus })
            .eq('id', recordId);

        if (error) {
            Alert.alert('Error', 'Failed to update status');
            // Revert
            const revertedRecords = selectedBatch.records.map((r: any) =>
                r.id === recordId ? { ...r, status: currentStatus } : r
            );
            setSelectedBatch({ ...selectedBatch, records: revertedRecords });
        } else {
            // Log to Audit Logs
            await supabase.from('audit_logs').insert({
                record_id: recordId,
                action: 'STATUS_CHANGE',
                old_value: currentStatus,
                new_value: newStatus,
                changed_by: user.id
            });
        }
    };

    if (selectedBatch) {
        return (
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => setSelectedBatch(null)}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{selectedBatch.branch} {selectedBatch.semester}</Text>
                    <TouchableOpacity
                        onPress={() => setIsEditing(!isEditing)}
                        style={{ marginLeft: 'auto', backgroundColor: isEditing ? '#4CAF50' : '#333', padding: 8, borderRadius: 8 }}
                    >
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>{isEditing ? 'Done' : 'Edit'}</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.subTitle}>Subject: {selectedBatch.subject}</Text>
                <Text style={styles.subTitle}>Faculty: {selectedBatch.profiles?.full_name}</Text>
                <Text style={[styles.subTitle, { color: selectedBatch.status === 'submitted' ? '#4CAF50' : '#E53935' }]}>
                    Status: {selectedBatch.status || 'Not Started'}
                </Text>

                <View style={styles.tableHeader}>
                    <Text style={styles.th}>Enrollment</Text>
                    <Text style={styles.th}>Name</Text>
                    <Text style={styles.th}>Time</Text>
                    <Text style={styles.th}>Location</Text>
                    <Text style={styles.th}>Status</Text>
                </View>
                <ScrollView style={styles.table}>
                    {selectedBatch.records?.map((rec: any, i: number) => (
                        <View key={i} style={styles.tr}>
                            <Text style={styles.td}>{rec.enrollment}</Text>
                            <Text style={styles.td}>{rec.name?.split(' ')[0]}</Text>
                            <Text style={styles.td}>{rec.time}</Text>
                            <Text style={styles.td}>
                                {rec.location ? `${rec.location.lat?.toFixed(3)}, ${rec.location.long?.toFixed(3)}` : '-'}
                            </Text>
                            <TouchableOpacity
                                onPress={() => toggleStatus(rec.id, rec.status)}
                                disabled={!isEditing}
                                style={styles.td}
                            >
                                <Text style={{ color: rec.status === 'present' ? '#4CAF50' : '#E53935', fontWeight: 'bold' }}>
                                    {rec.status.toUpperCase()} {isEditing && '✎'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                    {selectedBatch.records?.length === 0 && (
                        <Text style={styles.empty}>No attendance data available yet.</Text>
                    )}
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.title}>Dashboard</Text>
                <TouchableOpacity onPress={fetchDashboardData}>
                    <Ionicons name="refresh" size={24} color={Colors.dark.primary} />
                </TouchableOpacity>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.totalFaculty}</Text>
                    <Text style={styles.statLabel}>Faculty</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.totalStudents}</Text>
                    <Text style={styles.statLabel}>Students</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.todaysAttendance}</Text>
                    <Text style={styles.statLabel}>Today's Attd.</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Recent Batches</Text>
            {loading && <ActivityIndicator size="large" color={Colors.dark.primary} />}

            <ScrollView>
                {batches.map(batch => (
                    <TouchableOpacity
                        key={batch.id}
                        style={styles.card}
                        onPress={() => handleSelectBatch(batch)}
                    >
                        <View>
                            <Text style={styles.batchName}>{batch.branch} {batch.semester} ({batch.batch_type})</Text>
                            <Text style={styles.details}>{batch.subject} | {batch.profiles?.full_name}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#666" />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionTitle: {
        color: '#aaa',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 10,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#1E1E1E',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.dark.primary,
    },
    statLabel: {
        color: '#888',
        fontSize: 12,
        marginTop: 5,
    },
    card: {
        backgroundColor: '#1E1E1E',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    batchName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    details: {
        color: '#888',
        fontSize: 12,
        marginTop: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 15,
    },
    subTitle: {
        color: '#aaa',
        marginBottom: 5,
        fontSize: 14,
    },
    tableHeader: {
        flexDirection: 'row',
        marginTop: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        paddingBottom: 10,
    },
    th: {
        flex: 1,
        color: '#888',
        fontWeight: 'bold',
    },
    table: {
        flex: 1,
    },
    tr: {
        flexDirection: 'row',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    td: {
        flex: 1,
        color: '#fff',
    },
    empty: {
        color: '#666',
        textAlign: 'center',
        marginTop: 30,
    },
});
