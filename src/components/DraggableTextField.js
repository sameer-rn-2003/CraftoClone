import React, { useRef, useState, useEffect } from 'react';
import { Animated, PanResponder, Pressable, Text } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
    setTextFieldPosition,
    setActiveTextField,
    setNamePosition,
    setMessagePosition,
} from '../store/posterSlice';

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
  children,
  interactionScale = 1,
  baseX = 0,
  baseY = 0,
}) => {
  const dispatch = useDispatch();
  const pan = useRef(new Animated.ValueXY()).current;
  const [isDragging, setIsDragging] = useState(false);

  const isNameField = fieldId === 'name' || fieldId === 'headline';
  const isMessageField = fieldId === 'message' || fieldId === 'subtext';

  const namePosition = useSelector(state => state.poster.namePosition);
  const messagePosition = useSelector(state => state.poster.messagePosition);
  const textFieldPosition = useSelector(state => state.poster.textFieldPositions[fieldId]);

  const savedOffset = isNameField
    ? namePosition
    : (isMessageField ? messagePosition : textFieldPosition);
  const committed = useRef(
    savedOffset || {
      x: baseX,
      y: baseY,
    },
  );

  useEffect(() => {
    committed.current = savedOffset || {
      x: baseX,
      y: baseY,
    };

    pan.setValue(committed.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseX, baseY]);

  useEffect(() => {
    if (savedOffset) {
      committed.current = savedOffset;
      pan.setOffset({ x: 0, y: 0 });
      pan.setValue(savedOffset);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      },

      onPanResponderMove: (evt, gestureState) => {
        const scale = interactionScale && interactionScale > 0 ? interactionScale : 1;
        pan.setValue({ x: gestureState.dx / scale, y: gestureState.dy / scale });
      },

      onPanResponderRelease: (evt, gestureState) => {
        setIsDragging(false);
        pan.flattenOffset();
        const next = {
          x: pan.x.__getValue(),
          y: pan.y.__getValue(),
        };
        committed.current = next;
        if (isNameField) {
          dispatch(setNamePosition(next));
        } else if (isMessageField) {
          dispatch(setMessagePosition(next));
        } else {
          dispatch(setTextFieldPosition({ id: fieldId, x: next.x, y: next.y }));
        }
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
          position: 'absolute',
          left: pan.x,
          top: pan.y,
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
