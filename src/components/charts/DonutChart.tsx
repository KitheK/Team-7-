import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

type Segment = {
  name: string;
  value: number;
  color: string;
};

type Props = {
  width: number;
  height: number;
  data: Segment[];
};

export default function DonutChart({ width, height, data }: Props) {
  if (width <= 0 || data.length === 0) return null;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = 70;
  const strokeWidth = 28;
  const cx = radius + strokeWidth / 2 + 10;
  const cy = radius + strokeWidth / 2 + 10;
  const circumference = 2 * Math.PI * radius;
  const svgSize = (radius + strokeWidth / 2 + 10) * 2;

  let accumulated = 0;
  const segments = data.map((d) => {
    const arcLen = (d.value / total) * circumference;
    const offset = accumulated;
    accumulated += arcLen;
    return { ...d, arcLen, offset };
  });

  const legendWidth = width - svgSize - 20;

  return (
    <View style={styles.container}>
      <Svg width={svgSize} height={svgSize}>
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={Colors.border}
          strokeWidth={strokeWidth}
        />
        {segments.map((seg, i) => (
          <Circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${seg.arcLen} ${circumference - seg.arcLen}`}
            strokeDashoffset={-seg.offset + circumference * 0.25}
            strokeLinecap="butt"
          />
        ))}
        <SvgText
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          fontSize={Typography.chart.centerPrimary}
          fontWeight="700"
          fill={Colors.text}
        >
          ${(total / 1000).toFixed(1)}k
        </SvgText>
        <SvgText
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          fontSize={Typography.chart.centerSecondary}
          fill={Colors.textSecondary}
        >
          Total Spend
        </SvgText>
      </Svg>

      {legendWidth > 80 && (
        <View style={styles.legend}>
          {data.map((d) => {
            const pct = ((d.value / total) * 100).toFixed(0);
            return (
              <View key={d.name} style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                <Text style={styles.legendLabel} numberOfLines={1}>
                  {d.name}
                </Text>
                <Text style={styles.legendValue}>{pct}%</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legend: {
    flex: 1,
    marginLeft: 20,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  legendLabel: {
    flex: 1,
    fontSize: Typography.chart.legend,
    color: Colors.textSecondary,
  },
  legendValue: {
    fontSize: Typography.chart.legend,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
});
