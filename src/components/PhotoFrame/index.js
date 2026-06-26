// src/components/PhotoFrame/index.js
// Circular/rounded photo frame with PanResponder-based drag

import React, { useRef } from 'react';
import {
    Animated,
    Image,
    PanResponder,
    StyleSheet,
    View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { setPhotoPosition } from '../../store/posterSlice';
import { COLORS } from '../../utils/constants';
import ShapeClipView from '../ShapeClipView';

const PhotoFrame = ({
    width = 150,
    height = 150,
    borderRadius = 75,
    draggable = false,
    style,
    photoShape = 'circle',
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
            borderWidth: 0,
        },
        draggable && {
            transform: pan.getTranslateTransform(),
        },
        style,
    ];

    if (!userPhoto) {
        return (
            <ShapeClipView
                shape={photoShape}
                width={width}
                height={height}
                placeholderIcon="account-outline"
                style={StyleSheet.absoluteFill}>
                <View style={containerStyle}>
                    <MaterialCommunityIcons name="account-outline" style={styles.placeholder} />
                </View>
            </ShapeClipView>
        );
    }

    if (draggable) {
        return (
            <Animated.View
                style={[containerStyle, { transform: pan.getTranslateTransform() }]}
                {...panResponder.panHandlers}>
                <ShapeClipView
                    shape={photoShape}
                    width={width}
                    height={height}
                    photoUri={userPhoto}
                    resizeMode="cover"
                    style={StyleSheet.absoluteFill}>
                    <Image
                        source={{ uri: userPhoto }}
                        style={styles.photo}
                        resizeMode="cover"
                    />
                </ShapeClipView>
            </Animated.View>
        );
    }

    return (
        <View style={containerStyle}>
            <ShapeClipView
                shape={photoShape}
                width={width}
                height={height}
                photoUri={userPhoto}
                resizeMode="cover"
                style={StyleSheet.absoluteFill}>
                <Image
                    source={{ uri: userPhoto }}
                    style={styles.photo}
                    resizeMode="cover"
                />
            </ShapeClipView>
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
        color: COLORS.textMuted,
    },
});

export default PhotoFrame;
