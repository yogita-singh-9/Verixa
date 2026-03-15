import { Colors } from '@/constants/theme';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

interface ButtonProps {
    title: string;
    onPress: () => void;
    isLoading?: boolean;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'outline';
    style?: ViewStyle;
}

export function Button({ title, onPress, isLoading, disabled, variant = 'primary', style }: ButtonProps) {
    const backgroundColor =
        variant === 'primary' ? Colors.light.primary :
            variant === 'secondary' ? '#333' : 'transparent';

    const textColor =
        variant === 'outline' ? Colors.light.primary : '#fff';

    const borderStyle = variant === 'outline' ? { borderWidth: 1, borderColor: Colors.light.primary } : {};

    return (
        <TouchableOpacity
            style={[styles.button, { backgroundColor }, borderStyle, style]}
            onPress={onPress}
            disabled={isLoading || disabled}
            activeOpacity={0.8}
        >
            {isLoading ? (
                <ActivityIndicator color={textColor} />
            ) : (
                <Text style={[styles.text, { color: textColor }]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 10,
        shadowColor: '#E53935',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
