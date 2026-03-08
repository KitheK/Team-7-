import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  G,
  Line,
  Text as SvgText,
  Path,
} from 'react-native-svg';
import { useColors } from '../../context/ThemeContext';
import type { ColorScheme } from '../../constants/colors';
import { Typography, chartFontFamily } from '../../constants/typography';

type Props = {
  width: number;
  height: number;
  labels: string[];
  series: { data: number[]; color: string; label: string }[];
};

function roundedTopRect(x: number, y: number, w: number, h: number, r: number) {
  if (h < r * 2) r = h / 2;
  return [
    `M${x},${y + h}`,
    `L${x},${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `L${x + w - r},${y}`,
    `Q${x + w},${y} ${x + w},${y + r}`,
    `L${x + w},${y + h}`,
    `Z`,
  ].join(' ');
}

export default function BarChart({ width, height, labels, series }: Props) {
  const c = useColors();
  const s = useMemo(() => createStyles(c), [c]);

  if (width <= 0 || labels.length === 0) return null;

  const pad = { top: 20, right: 20, bottom: 36, left: 58 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const allValues = series.flatMap((s) => s.data);
  const maxVal = Math.max(...allValues) * 1.1;
  const tickCount = 5;

  const groupW = plotW / labels.length;
  const barCount = series.length;
  const barW = groupW * (barCount > 2 ? 0.22 : 0.28);
  const barGap = 4;
  const totalBarsW = barCount * barW + (barCount - 1) * barGap;

  return (
    <View>
      <Svg width={width} height={height}>
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

        {labels.map((label, gi) => {
          const groupX = pad.left + gi * groupW;
          const startX = groupX + (groupW - totalBarsW) / 2;

          return (
            <G key={gi}>
              {series.map((s, si) => {
                const barH = (s.data[gi] / maxVal) * plotH;
                const bx = startX + si * (barW + barGap);
                const by = pad.top + plotH - barH;
                return (
                  <Path
                    key={si}
                    d={roundedTopRect(bx, by, barW, barH, 4)}
                    fill={s.color}
                    opacity={0.9}
                  />
                );
              })}
              <SvgText
                x={groupX + groupW / 2}
                y={pad.top + plotH + 24}
                textAnchor="middle"
                fontFamily={chartFontFamily}
                fontSize={Typography.chart.axisLabel}
                fill={c.textTertiary}
              >
                {label}
              </SvgText>
            </G>
          );
        })}
      </Svg>

      <View style={s.legendRow}>
        {series.map((ser) => (
          <View key={ser.label} style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: ser.color }]} />
            <Text style={s.legendLabel}>{ser.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (c: ColorScheme) =>
  StyleSheet.create({
    legendRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 8,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 12,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 6,
    },
    legendLabel: {
      fontSize: Typography.chart.legend,
      color: c.textSecondary,
    },
  });
