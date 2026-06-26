import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { ClipPath, Polygon, Defs, Rect, Image as SvgImage } from 'react-native-svg';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { isSvgShape, getShapePolygonPoints } from '../../utils/shapes';
import { COLORS } from '../../utils/constants';

const SvgShapeContent = ({
  shape,
  width,
  height,
  photoUri,
  resizeMode = 'cover',
  borderColor,
  borderWidth,
  placeholderIcon,
}) => {
  const clipId = `sc_${shape}`;
  const points = getShapePolygonPoints(shape, width, height);
  const showBorder = borderWidth > 0 && borderColor && borderColor !== 'transparent';

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <ClipPath id={clipId}>
            <Polygon points={points} />
          </ClipPath>
        </Defs>
        {photoUri ? (
          <SvgImage
            href={{ uri: photoUri }}
            width={width}
            height={height}
            clipPath={`url(#${clipId})`}
            preserveAspectRatio={resizeMode === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice'}
          />
        ) : (
          <Rect
            x={0} y={0}
            width={width} height={height}
            clipPath={`url(#${clipId})`}
            fill={COLORS.surface}
          />
        )}
        {showBorder && (
          <Polygon
            points={points}
            fill="none"
            stroke={borderColor}
            strokeWidth={borderWidth * 2}
          />
        )}
      </Svg>
      {!photoUri && placeholderIcon && (
        <View style={[StyleSheet.absoluteFill, styles.placeholderCenter]}>
          <MaterialCommunityIcons name={placeholderIcon} style={styles.placeholderIcon} />
        </View>
      )}
    </View>
  );
};

const ShapeClipView = ({
  shape = 'circle',
  width = 150,
  height = 150,
  borderRadius = 0,
  borderColor = COLORS.primary,
  borderWidth = 0,
  photoUri,
  resizeMode = 'cover',
  placeholderIcon,
  style,
  children,
}) => {
  if (isSvgShape(shape)) {
    return (
      <SvgShapeContent
        shape={shape}
        width={width}
        height={height}
        photoUri={photoUri}
        resizeMode={resizeMode}
        borderColor={borderColor}
        borderWidth={borderWidth}
        placeholderIcon={placeholderIcon}
      />
    );
  }

  return (
    <View style={[{ width, height, borderRadius, borderColor, borderWidth }, styles.clipContainer, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  clipContainer: {
    overflow: 'hidden',
  },
  placeholderCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 32,
    color: COLORS.textMuted,
  },
});

export default ShapeClipView;
