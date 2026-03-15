import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleProp, StyleSheet, TextInput, TextInputProps, TouchableOpacity, View, ViewStyle } from 'react-native';

interface InputProps extends Omit<TextInputProps, 'style'> {
    icon?: keyof typeof Ionicons.glyphMap;
    isPassword?: boolean;
    style?: StyleProp<ViewStyle>;
}

export function Input({ icon, isPassword, style, ...props }: InputProps) {
    const [secureTextEntry, setSecureTextEntry] = useState(isPassword);
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={[
            styles.container,
            isFocused && styles.focusedContainer,
            style
        ]}>
            {icon && (
                <Ionicons
                    name={icon}
                    size={20}
                    color={isFocused ? Colors.light.primary : '#666'}
                    style={styles.icon}
                />
            )}
            <TextInput
                style={styles.input}
                placeholderTextColor="#666"
                secureTextEntry={secureTextEntry}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                {...props}
            />
            {isPassword && (
                <TouchableOpacity onPress={() => setSecureTextEntry(!secureTextEntry)}>
                    <Ionicons
                        name={secureTextEntry ? 'eye-off' : 'eye'}
                        size={20}
                        color="#666"
                    />
                </TouchableOpacity>
            )}
        </View>
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
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
    },
});
