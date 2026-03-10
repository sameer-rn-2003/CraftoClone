// src/components/PhotoFrame/index.js
// Circular/rounded photo frame with PanResponder-based drag

import React, { useRef, useCallback } from 'react';
import {
    Animated,
    Image,
    PanResponder,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { setPhotoPosition } from '../../store/posterSlice';
import { COLORS, SPACING } from '../../utils/constants';

const PhotoFrame = ({
    width = 150,
    height = 150,
    borderRadius = 75,
    borderColor = COLORS.primary,
    borderWidth = 3,
    draggable = false,
    style,
}) => {
    const dispatch = useDispatch();
    const { userPhoto, photoPosition } = useSelector(s => s.poster);

    // Animated position values
    const pan = useRef(
        new Animated.ValueXY({ x: photoPosition.x, y: photoPosition.y }),
    ).current;
    const lastOffset = useRef({ x: photoPosition.x, y: photoPosition.y });

    // PanResponder for drag to reposition
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => draggable,
            onMoveShouldSetPanResponder: () => draggable,
            onPanResponderGrant: () => {
                pan.setOffset(lastOffset.current);
                pan.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false },
            ),
            onPanResponderRelease: (_, gestureState) => {
                pan.flattenOffset();
                const newPos = {
                    x: lastOffset.current.x + gestureState.dx,
                    y: lastOffset.current.y + gestureState.dy,
                };
                lastOffset.current = newPos;
                dispatch(setPhotoPosition(newPos));
            },
        }),
    ).current;

    const containerStyle = [
        styles.frame,
        {
            width,
            height,
            borderRadius,
            borderColor,
            borderWidth,
        },
        draggable && {
            transform: pan.getTranslateTransform(),
        },
        style,
    ];

    if (!userPhoto) {
        return (
            <View style={containerStyle}>
                <Text style={styles.placeholder}>👤</Text>
            </View>
        );
    }

    if (draggable) {
        return (
            <Animated.View
                style={[containerStyle, { transform: pan.getTranslateTransform() }]}
                {...panResponder.panHandlers}>
                <Image
                    source={{ uri: userPhoto }}
                    style={styles.photo}
                    resizeMode="cover"
                />
            </Animated.View>
        );
    }

    return (
        <View style={containerStyle}>
            <Image
                source={{ uri: userPhoto }}
                style={styles.photo}
                resizeMode="cover"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    frame: {
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.surface,
    },
    photo: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        fontSize: 48,
    },
});

export default PhotoFrame;
