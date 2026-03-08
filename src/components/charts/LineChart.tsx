import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, {
  Path,
  Circle,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
  G,
} from 'react-native-svg';
import { useColors } from '../../context/ThemeContext';
import { Typography, chartFontFamily } from '../../constants/typography';

type Props = {
  width: number;
  height: number;
  labels: string[];
  values: number[];
  color?: string;
};

export default function LineChart({
  width,
  height,
  labels,
  values,
  color,
}: Props) {
  const c = useColors();
  const resolvedColor = color ?? c.primary;

  if (width <= 0 || values.length === 0) return null;

  const pad = { top: 20, right: 20, bottom: 36, left: 58 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const maxVal = Math.max(...values) * 1.1;
  const tickCount = 5;

  const points = values.map((v, i) => ({
    x: pad.left + (i / (values.length - 1)) * plotW,
    y: pad.top + (1 - v / maxVal) * plotH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  const areaPath = [
    linePath,
    `L${points[points.length - 1].x},${pad.top + plotH}`,
    `L${points[0].x},${pad.top + plotH}`,
    'Z',
  ].join(' ');

  return (
    <View>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={resolvedColor} stopOpacity="0.2" />
            <Stop offset="100%" stopColor={resolvedColor} stopOpacity="0.01" />
          </LinearGradient>
        </Defs>

        {Array.from({ length: tickCount + 1 }).map((_, i) => {
          const y = pad.top + (i / tickCount) * plotH;
          const val = maxVal * (1 - i / tickCount);
          return (
            <G key={i}>
              <Line
                x1={pad.left}
                y1={y}
                x2={width - pad.right}
                y2={y}
                stroke={c.border}
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              <SvgText
                x={pad.left - 10}
                y={y + 4}
                textAnchor="end"
                fontFamily={chartFontFamily}
                fontSize={Typography.chart.axisValue}
                fill={c.textTertiary}
              >
                {val >= 1000 ? `${Math.round(val / 1000)}k` : Math.round(val).toString()}
              </SvgText>
            </G>
          );
        })}

        <Path d={areaPath} fill="url(#areaFill)" />
        <Path d={linePath} stroke={resolvedColor} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, i) => (
          <G key={i}>
            <Circle cx={p.x} cy={p.y} r={5} fill={c.white} stroke={resolvedColor} strokeWidth={2.5} />
            <SvgText
              x={p.x}
              y={pad.top + plotH + 24}
              textAnchor="middle"
              fontFamily={chartFontFamily}
              fontSize={Typography.chart.axisLabel}
              fill={c.textTertiary}
            >
              {labels[i]}
            </SvgText>
          </G>
        ))}
      </Svg>
    </View>
  );
}
