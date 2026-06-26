export const SVG_SHAPES = ['triangle', 'star', 'hexagon'];

export const isSvgShape = (shape) => SVG_SHAPES.includes(shape);

export const getShapePolygonPoints = (shape, w, h) => {
  switch (shape) {
    case 'triangle': {
      return `${w / 2},2 ${w - 2},${h - 2} 2,${h - 2}`;
    }
    case 'star': {
      const cx = w / 2;
      const cy = h / 2;
      const outerR = Math.min(w, h) / 2 - 2;
      const innerR = outerR * 0.4;
      const pts = [];
      for (let i = 0; i < 5; i++) {
        const outerAngle = (i * 2 * Math.PI / 5) - Math.PI / 2;
        const innerAngle = outerAngle + Math.PI / 5;
        pts.push(`${(cx + outerR * Math.cos(outerAngle)).toFixed(1)},${(cy + outerR * Math.sin(outerAngle)).toFixed(1)}`);
        pts.push(`${(cx + innerR * Math.cos(innerAngle)).toFixed(1)},${(cy + innerR * Math.sin(innerAngle)).toFixed(1)}`);
      }
      return pts.join(' ');
    }
    case 'hexagon': {
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) / 2 - 2;
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60 * Math.PI / 180) - Math.PI / 6;
        pts.push(`${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`);
      }
      return pts.join(' ');
    }
    default:
      return '';
  }
};

export const SHAPE_LABELS = {
  circle: 'Circle',
  square: 'Square',
  rect: 'Rect',
  rectangle: 'Rect',
  triangle: 'Triangle',
  star: 'Star',
  hexagon: 'Hexagon',
};
