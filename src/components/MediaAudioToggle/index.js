import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const MediaAudioToggle = ({
    visible = false,
    muted = true,
    hasAudio = true,
    onPress,
    style,
}) => {
    if (!visible) {
        return null;
    }

    const disabled = !hasAudio;
    const iconName = !hasAudio || muted ? 'volume-off' : 'volume-high';

    return (
        <Pressable
            style={[styles.button, disabled && styles.buttonDisabled, style]}
            onPress={disabled ? undefined : event => {
                event?.stopPropagation?.();
                onPress?.();
            }}
            onPressIn={event => {
                event?.stopPropagation?.();
            }}
            hitSlop={10}>
            <MaterialCommunityIcons name={iconName} style={styles.icon} />
        </Pressable>
    );
};

const styles = StyleSheet.create({
    button: {
        position: 'absolute',
        right: 12,
        bottom: 12,
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(17,24,39,0.72)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonDisabled: {
        opacity: 0.85,
    },
    icon: {
        fontSize: 20,
        color: '#FFFFFF',
    },
});

export default React.memo(MediaAudioToggle);
