import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SelectInputProps {
    options: string[];
    value: string;
    onSelect: (value: string) => void;
    placeholder?: string;
    icon?: keyof typeof Ionicons.glyphMap;
}

const { height } = Dimensions.get('window');

export function SelectInput({ options, value, onSelect, placeholder, icon }: SelectInputProps) {
    const [visible, setVisible] = useState(false);

    return (
        <>
            <TouchableOpacity
                style={[styles.container, visible && styles.focusedContainer]}
                onPress={() => setVisible(true)}
                activeOpacity={0.8}
            >
                {icon && (
                    <Ionicons
                        name={icon}
                        size={20}
                        color={visible ? Colors.light.primary : '#666'}
                        style={styles.icon}
                    />
                )}
                <Text style={[styles.text, !value && styles.placeholder]}>
                    {value || placeholder}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            <Modal
                visible={visible}
                transparent
                animationType="slide"
                onRequestClose={() => setVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{placeholder}</Text>
                            <TouchableOpacity onPress={() => setVisible(false)}>
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={options}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.optionItem, item === value && styles.selectedOption]}
                                    onPress={() => {
                                        onSelect(item);
                                        setVisible(false);
                                    }}
                                >
                                    <Text style={[styles.optionText, item === value && styles.selectedOptionText]}>{item}</Text>
                                    {item === value && <Ionicons name="checkmark" size={20} color={Colors.dark.primary} />}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 50,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: '#333',
    },
    focusedContainer: {
        borderColor: Colors.light.primary,
        backgroundColor: '#252525',
    },
    icon: {
        marginRight: 10,
    },
    text: {
        flex: 1,
        fontSize: 16,
        color: '#fff',
    },
    placeholder: {
        color: '#666',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1E1E1E',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: height * 0.7,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        paddingBottom: 15,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    selectedOption: {
        backgroundColor: '#333',
        borderRadius: 8,
        paddingHorizontal: 10,
        borderBottomWidth: 0,
    },
    optionText: {
        fontSize: 16,
        color: '#ccc',
    },
    selectedOptionText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
