import React, { useRef, useState, useEffect } from 'react';
import { Animated, PanResponder, Pressable, Text } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { setTextFieldPosition, setActiveTextField } from '../store/posterSlice';

const DraggableTextField = ({
  fieldId,
  text,
  style,
  layout,
  isActive,
  onPress,
  onDragStart,
  onDragEnd,
  fontSize,
  color,
  fontFamily,
  fontWeight,
  textAlign,
  children
}) => {
  const dispatch = useDispatch();
  const pan = useRef(new Animated.ValueXY()).current;
  const [isDragging, setIsDragging] = useState(false);

  const savedOffset = useSelector(state => state.poster.textFieldPositions[fieldId]);
  const committed = useRef(savedOffset || { x: 0, y: 0 });

  useEffect(() => {
    pan.setValue(committed.current);
  }, []);

  useEffect(() => {
    if (savedOffset) {
      committed.current = savedOffset;
      pan.setOffset({ x: 0, y: 0 });
      pan.setValue(savedOffset);
    }
  }, [savedOffset]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        setIsDragging(true);
        onDragStart?.(fieldId);
        dispatch(setActiveTextField(fieldId));
        pan.setOffset(committed.current);
        pan.setValue({ x: 0, y: 0 });
        console.log(`[DraggableTextField] Drag Start - fieldId: ${fieldId}, committedOffset:`, committed.current);
      },

      onPanResponderMove: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        pan.setValue({ x: dx, y: dy });
        const totalX = committed.current.x + dx;
        const totalY = committed.current.y + dy;
        console.log(`[DraggableTextField] Dragging - fieldId: ${fieldId}, gestureDelta: {dx: ${dx}, dy: ${dy}}, totalOffset: {x: ${totalX}, y: ${totalY}}`);
      },

      onPanResponderRelease: (evt, gestureState) => {
        setIsDragging(false);
        pan.flattenOffset();
        const { dx, dy } = gestureState;
        const next = {
          x: committed.current.x + dx,
          y: committed.current.y + dy,
        };
        committed.current = next;
        console.log(`[DraggableTextField] Drag End - fieldId: ${fieldId}, finalOffset: {x: ${next.x}, y: ${next.y}}`);
        dispatch(setTextFieldPosition({ id: fieldId, x: next.x, y: next.y }));
        onDragEnd?.(fieldId, next);
      },

      onPanResponderTerminate: () => {
        setIsDragging(false);
        pan.flattenOffset();
      },
    }),
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        style,
        {
          transform: pan.getTranslateTransform(),
          borderWidth: isActive ? 2 : 0,
          borderColor: isActive ? '#5B6CFF' : 'transparent',
          borderStyle: 'dashed',
          opacity: isDragging ? 0.8 : 1,
          padding: isActive ? 4 : 0,
        }
      ]}
    >
      <Pressable
        onPress={() => {
          dispatch(setActiveTextField(fieldId));
          onPress?.(fieldId);
        }}
        style={{ flex: 1 }}
      >
        {children || (
          <Text
            style={{
              fontSize: fontSize || 24,
              color: color || '#FFFFFF',
              fontFamily: fontFamily || 'Poppins',
              fontWeight: fontWeight || 'bold',
              textAlign: textAlign || 'center',
            }}
          >
            {text || ''}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
};

export default DraggableTextField;
