import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { G, Path, Circle } from 'react-native-svg';
import { colors } from '../../theme/tokens';

interface Props {
  width: number;
  height: number;
  opacity?: number;
  color?: string;
}

// 8-pointed star path in a 40x40 tile, centered at (20,20)
const STAR =
  'M20,6 L22.5,14.5 L30.5,11.5 L25.5,18.5 L34,20 L25.5,21.5 L30.5,28.5 L22.5,25.5 L20,34 L17.5,25.5 L9.5,28.5 L14.5,21.5 L6,20 L14.5,18.5 L9.5,11.5 L17.5,14.5 Z';

const TILE = 40;

export const ZelligePattern: React.FC<Props> = ({
  width,
  height,
  opacity = 0.06,
  color = colors.terracotta.DEFAULT,
}) => {
  const cols = Math.ceil(width / TILE) + 1;
  const rows = Math.ceil(height / TILE) + 1;

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: rows }, (_, row) =>
        Array.from({ length: cols }, (_, col) => {
          const tx = col * TILE - TILE / 2;
          const ty = row * TILE - TILE / 2;
          return (
            <G key={`${row}-${col}`} transform={`translate(${tx},${ty})`}>
              <Path d={STAR} fill={color} opacity={opacity} />
              <Circle cx={0} cy={0} r={2.5} fill={color} opacity={opacity * 0.7} />
            </G>
          );
        })
      )}
    </Svg>
  );
};
