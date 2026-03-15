import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { SelectInput } from '@/components/SelectInput';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Faculty {
    id: string;
    full_name: string;
    email: string;
}

interface Batch {
    id: string;
    branch: string;
    semester: string;
    batch_type: string;
    batch_group: string;
    subject: string;
    time: string;
    faculty_id: string;
    profiles?: { full_name: string }; // joined faculty details
}

// ... imports from original file ...

export default function ControllerDashboard() {
    const [activeTab, setActiveTab] = useState<'batches' | 'attendance' | 'logs'>('batches');
    const [batches, setBatches] = useState<Batch[]>([]);
    const [facultyList, setFacultyList] = useState<Faculty[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    // Batch creation state
    const [branch, setBranch] = useState('');
    const [semester, setSemester] = useState('');
    const [subject, setSubject] = useState('');
    const [batchType, setBatchType] = useState<'Regular' | 'Ex'>('Regular');
    const [batchGroup, setBatchGroup] = useState<'A' | 'B' | 'All'>('All');
    const [time, setTime] = useState('');
    const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);

    // Attendance View State
    const [selectedBatch, setSelectedBatch] = useState<any>(null); // For viewing records

    // Logs View State
    const [auditLogs, setAuditLogs] = useState<any[]>([]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (activeTab === 'logs') fetchAuditLogs();
    }, [activeTab]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const { data: facultyData } = await supabase.from('profiles').select('id, full_name, email').eq('role', 'faculty');
            setFacultyList(facultyData || []);
            await fetchTodaysBatches();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchTodaysBatches = async () => {
        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase
            .from('batches')
            .select('*, profiles:faculty_id(full_name)')
            .eq('date', today)
            .order('time', { ascending: true });
        setBatches(data || []);
    };

    const fetchAuditLogs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*, changed_by:changed_by(full_name), record:record_id(student:student_id(enrollment_no, full_name))')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) console.log(error);
        else setAuditLogs(data || []);
        setLoading(false);
    };

    const handleCreateBatch = async () => {
        // ... (Keep existing Create Batch Logic) ...
        if (!branch || !semester || !subject || !time || !selectedFacultyId) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        setLoading(true);

        const { error } = await supabase.from('batches').insert({
            branch, semester, batch_type: batchType, batch_group: batchGroup, subject, date: today, time, faculty_id: selectedFacultyId,
        });

        setLoading(false);

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            Alert.alert('Success', 'Batch created successfully');
            setModalVisible(false);
            resetForm();
            fetchTodaysBatches();
        }
    };

    const resetForm = () => {
        setBranch(''); setSemester(''); setSubject(''); setTime(''); setSelectedFacultyId(null); setBatchType('Regular'); setBatchGroup('All');
    };

    // Controller Viewing Attendance (Read Only)
    const handleViewBatch = async (batch: Batch) => {
        setLoading(true);
        const { data } = await supabase
            .from('attendance_sessions')
            .select('*, attendance_records(*, student:student_id(full_name, enrollment_no))')
            .eq('batch_id', batch.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        setLoading(false);
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
            setSelectedBatch({ ...batch, status: 'No Session', records: [] });
        }
    };

    const renderBatchesTab = () => (
        <ScrollView showsVerticalScrollIndicator={false}>
            {batches.length === 0 && !loading ? (
                <Text style={styles.emptyText}>No batches scheduled for today.</Text>
            ) : (
                batches.map(batch => (
                    <View key={batch.id} style={styles.card}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.batchName}>{batch.branch} {batch.semester} ({batch.batch_type})</Text>
                            <Text style={styles.details}>{batch.subject} • {batch.time}</Text>
                            <Text style={styles.groupBadge}>Group: {batch.batch_group}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.assignStatus}>{batch.profiles?.full_name || 'Unassigned'}</Text>
                        </View>
                    </View>
                ))
            )}
        </ScrollView>
    );

    const renderAttendanceTab = () => {
        if (selectedBatch) {
            return (
                <View style={{ flex: 1 }}>
                    <TouchableOpacity onPress={() => setSelectedBatch(null)} style={{ marginBottom: 10 }}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{selectedBatch.branch} {selectedBatch.semester} - {selectedBatch.subject}</Text>
                    <Text style={styles.subTitle}>Total Records: {selectedBatch.records?.length}</Text>

                    <ScrollView style={styles.table}>
                        {selectedBatch.records?.map((rec: any, i: number) => (
                            <View key={i} style={styles.tr}>
                                <Text style={styles.td}>{rec.enrollment}</Text>
                                <Text style={styles.td}>{rec.name?.split(' ')[0]}</Text>
                                <Text style={[styles.td, { color: rec.status === 'present' ? '#4CAF50' : '#E53935' }]}>
                                    {rec.status.toUpperCase()}
                                </Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            );
        }

        return (
            <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Select Batch to View Attendance</Text>
                {batches.map(batch => (
                    <TouchableOpacity key={batch.id} style={styles.card} onPress={() => handleViewBatch(batch)}>
                        <View>
                            <Text style={styles.batchName}>{batch.branch} {batch.semester}</Text>
                            <Text style={styles.details}>{batch.subject}</Text>
                        </View>
                        <Ionicons name="eye-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        );
    };

    const renderLogsTab = () => (
        <ScrollView showsVerticalScrollIndicator={false}>
            {auditLogs.map(log => (
                <View key={log.id} style={styles.logCard}>
                    <View style={styles.logHeader}>
                        <Text style={styles.logAction}>{log.action}</Text>
                        <Text style={styles.logTime}>{new Date(log.created_at).toLocaleString()}</Text>
                    </View>
                    <Text style={styles.logDetails}>
                        <Text style={{ fontWeight: 'bold' }}>{log.changed_by?.full_name}</Text> changed status of{' '}
                        <Text style={{ fontWeight: 'bold' }}>{log.record?.student?.enrollment_no}</Text>
                    </Text>
                    <View style={styles.logDiff}>
                        <Text style={styles.oldVal}>{log.old_value}</Text>
                        <Ionicons name="arrow-forward" size={16} color="#666" style={{ marginHorizontal: 5 }} />
                        <Text style={styles.newVal}>{log.new_value}</Text>
                    </View>
                </View>
            ))}
            {auditLogs.length === 0 && <Text style={styles.emptyText}>No recent activity.</Text>}
        </ScrollView>
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.title}>Controller Dashboard</Text>
                <TouchableOpacity onPress={fetchInitialData}>
                    <Ionicons name="refresh" size={24} color={Colors.dark.primary} />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                {['batches', 'attendance', 'logs'].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.activeTab]}
                        onPress={() => { setActiveTab(tab as any); setSelectedBatch(null); }}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.contentArea}>
                {loading && <ActivityIndicator size="large" color={Colors.dark.primary} style={{ marginTop: 20 }} />}

                {!loading && activeTab === 'batches' && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Today's Batches</Text>
                            <Button title="+ New Batch" onPress={() => setModalVisible(true)} style={{ paddingHorizontal: 15, height: 40 }} />
                        </View>
                        {renderBatchesTab()}
                    </>
                )}

                {!loading && activeTab === 'attendance' && renderAttendanceTab()}
                {!loading && activeTab === 'logs' && renderLogsTab()}
            </View>

            {/* Modal for Creating Batch (Keep Check on Modal Visible) */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView>
                            <Text style={styles.modalTitle}>Create New Batch</Text>
                            {/* ... kept shortened form inputs for brevity, assume original inputs are here properly ... */}
                            <Text style={styles.label}>Branch & Semester</Text>
                            <View style={styles.row}>
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    <SelectInput
                                        placeholder="Branch"
                                        value={branch}
                                        options={[
                                            'Computer Science Engineering',
                                            'Artificial Intelligence & Data Science',
                                            'Information Technology',
                                            'Electronics & Communication Engineering',
                                            'Mechanical Engineering',
                                            'Electrical Engineering',
                                            'Civil Engineering',
                                            'Mechatronics Engineering',
                                            'Industrial Production Engineering'
                                        ]}
                                        onSelect={setBranch}
                                    />
                                </View>
                                <Input
                                    placeholder="Sem (e.g. 3rd)"
                                    value={semester}
                                    onChangeText={setSemester}
                                    style={{ flex: 1 }}
                                />
                            </View>

                            <Text style={styles.label}>Type & Group</Text>
                            <View style={styles.row}>
                                <TouchableOpacity
                                    style={[styles.selectBtn, batchType === 'Regular' && styles.selectBtnActive]}
                                    onPress={() => setBatchType('Regular')}
                                >
                                    <Text style={styles.selectBtnText}>Regular</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.selectBtn, batchType === 'Ex' && styles.selectBtnActive]}
                                    onPress={() => setBatchType('Ex')}
                                >
                                    <Text style={styles.selectBtnText}>Ex</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.row, { marginTop: 10 }]}>
                                {['All', 'A', 'B'].map((grp) => (
                                    <TouchableOpacity
                                        key={grp}
                                        style={[styles.selectBtn, batchGroup === grp && styles.selectBtnActive, { flex: 1, marginHorizontal: 2 }]}
                                        onPress={() => setBatchGroup(grp as any)}
                                    >
                                        <Text style={styles.selectBtnText}>{grp}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>Details</Text>
                            <Input
                                placeholder="Subject Name"
                                value={subject}
                                onChangeText={setSubject}
                            />
                            <Input
                                placeholder="Time (e.g. 10:00 AM)"
                                value={time}
                                onChangeText={setTime}
                            />

                            <Text style={styles.label}>Assign Faculty</Text>
                            <ScrollView style={styles.facultyList} nestedScrollEnabled>
                                {facultyList.map(fac => (
                                    <TouchableOpacity
                                        key={fac.id}
                                        style={[styles.facultyItem, selectedFacultyId === fac.id && styles.facultyItemActive]}
                                        onPress={() => setSelectedFacultyId(fac.id)}
                                    >
                                        <Text style={[styles.facultyText, selectedFacultyId === fac.id && { color: Colors.dark.primary }]}>
                                            {fac.full_name}
                                        </Text>
                                        {selectedFacultyId === fac.id && <Ionicons name="checkmark" size={20} color={Colors.dark.primary} />}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <View style={styles.modalButtons}>
                                <Button title="Cancel" onPress={() => setModalVisible(false)} variant="secondary" style={{ flex: 1, marginRight: 10 }} />
                                <Button title="Create" onPress={handleCreateBatch} style={{ flex: 1 }} isLoading={loading} />
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: Colors.dark.primary,
    },
    tabText: {
        color: '#888',
        fontWeight: 'bold',
    },
    activeTabText: {
        color: '#fff',
    },
    contentArea: {
        flex: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
        alignItems: 'center',
    },
    sectionTitle: {
        color: '#aaa',
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptyText: {
        color: '#666',
        textAlign: 'center',
        marginTop: 50,
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
    groupBadge: {
        color: Colors.dark.primary,
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 2,
    },
    assignStatus: {
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    // Attendance View Styles
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 2,
        marginLeft: 10
    },
    subTitle: {
        color: '#888',
        fontSize: 12,
        marginBottom: 15,
        marginLeft: 10
    },
    table: {
        flex: 1,
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 15,
    },
    tr: {
        flexDirection: 'row',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    td: {
        flex: 1,
        color: '#fff',
        fontSize: 14,
    },
    // Log View Styles
    logCard: {
        backgroundColor: '#1E1E1E',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        borderLeftWidth: 4,
        borderLeftColor: Colors.dark.primary,
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    logAction: {
        color: Colors.dark.primary,
        fontWeight: 'bold',
        fontSize: 12,
    },
    logTime: {
        color: '#666',
        fontSize: 12,
    },
    logDetails: {
        color: '#fff',
        marginBottom: 8,
        fontSize: 14,
    },
    logDiff: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        padding: 8,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    oldVal: {
        color: '#E53935',
        fontWeight: 'bold',
        fontSize: 12,
    },
    newVal: {
        color: '#4CAF50',
        fontWeight: 'bold',
        fontSize: 12,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 20,
        maxHeight: '80%',
    },
    modalTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        color: '#aaa',
        marginTop: 10,
        marginBottom: 5,
        fontSize: 12,
        fontWeight: 'bold',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    selectBtn: {
        flex: 1,
        padding: 10,
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
        alignItems: 'center',
        marginRight: 5,
    },
    selectBtnActive: {
        borderColor: Colors.dark.primary,
        backgroundColor: 'rgba(108, 99, 255, 0.1)',
    },
    selectBtnText: {
        color: '#fff',
        fontSize: 12,
    },
    facultyList: {
        maxHeight: 150,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
    },
    facultyItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    facultyItemActive: {
        backgroundColor: '#252525',
    },
    facultyText: {
        color: '#fff',
    },
    modalButtons: {
        flexDirection: 'row',
        marginTop: 20,
    },
});
