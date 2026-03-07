import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { Colors } from '../../constants/colors';
import { Typography, chartFontFamily } from '../../constants/typography';

type Segment = {
  name: string;
  value: number;
  color: string;
};

const MAX_VISIBLE = 8;
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

type Props = {
  width: number;
  height: number;
  data: Segment[];
};

export default function DonutChart({ width, height, data }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (width <= 0 || data.length === 0) return null;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const visible = data.slice(0, MAX_VISIBLE);
  const rest = data.slice(MAX_VISIBLE);
  const restValue = rest.reduce((s, d) => s + d.value, 0);
  const displayData = restValue > 0 ? [...visible, { name: 'Other', value: restValue, color: Colors.textTertiary }] : visible;

  const radius = isNative ? 60 : 70;
  const strokeWidth = isNative ? 24 : 28;
  const cx = radius + strokeWidth / 2 + 10;
  const cy = radius + strokeWidth / 2 + 10;
  const circumference = 2 * Math.PI * radius;
  const svgSize = (radius + strokeWidth / 2 + 10) * 2;

  let accumulated = 0;
  const segments = displayData.map((d) => {
    const arcLen = (d.value / total) * circumference;
    const offset = accumulated;
    accumulated += arcLen;
    return { ...d, arcLen, offset };
  });

  const centerLabel = `$${(total / 1000).toFixed(1)}k`;

  if (isNative) {
    return (
      <View style={styles.containerNative}>
        <View style={styles.chartWrapNative}>
          <Svg width={svgSize} height={svgSize}>
            <Circle cx={cx} cy={cy} r={radius} fill="none" stroke={Colors.border} strokeWidth={strokeWidth} />
            {segments.map((seg, i) => (
              <Circle
                key={i}
                cx={cx} cy={cy} r={radius}
                fill="none" stroke={seg.color} strokeWidth={strokeWidth}
                strokeDasharray={`${seg.arcLen} ${circumference - seg.arcLen}`}
                strokeDashoffset={-seg.offset + circumference * 0.25}
                strokeLinecap="butt"
              />
            ))}
            <SvgText
              x={cx} y={cy - 6}
              textAnchor="middle"
              fontFamily={chartFontFamily}
              fontSize={Typography.chart.centerPrimary}
              fontWeight="700"
              fill={Colors.text}
            >
              {centerLabel}
            </SvgText>
            <SvgText
              x={cx} y={cy + 14}
              textAnchor="middle"
              fontFamily={chartFontFamily}
              fontSize={Typography.chart.centerSecondary}
              fill={Colors.textSecondary}
            >
              Total
            </SvgText>
          </Svg>
        </View>
        <View style={styles.legendNative}>
          {displayData.map((d) => {
            const pct = ((d.value / total) * 100).toFixed(1);
            return (
              <View key={d.name} style={styles.legendRowNative}>
                <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                <Text style={styles.legendLabelNative} numberOfLines={1}>{d.name}</Text>
                <Text style={styles.legendValueNative}>{pct}%</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  }

  const legendWidth = width - svgSize - 20;

  return (
    <View style={styles.container}>
      <Svg width={svgSize} height={svgSize}>
        <Circle cx={cx} cy={cy} r={radius} fill="none" stroke={Colors.border} strokeWidth={strokeWidth} />
        {segments.map((seg, i) => (
          <Circle
            key={i}
            cx={cx} cy={cy} r={radius}
            fill="none" stroke={seg.color} strokeWidth={strokeWidth}
            strokeDasharray={`${seg.arcLen} ${circumference - seg.arcLen}`}
            strokeDashoffset={-seg.offset + circumference * 0.25}
            strokeLinecap="butt"
          />
        ))}
        <SvgText
          x={cx} y={cy - 8}
          textAnchor="middle"
          fontFamily={chartFontFamily}
          fontSize={Typography.chart.centerPrimary}
          fontWeight="700"
          fill={Colors.text}
        >
          {centerLabel}
        </SvgText>
        <SvgText
          x={cx} y={cy + 14}
          textAnchor="middle"
          fontFamily={chartFontFamily}
          fontSize={Typography.chart.centerSecondary}
          fill={Colors.textSecondary}
        >
          Total
        </SvgText>
      </Svg>

      {legendWidth > 80 && (
        <View style={styles.legend}>
          {displayData.map((d) => {
            const pct = ((d.value / total) * 100).toFixed(1);
            const isHovered = hovered === d.name;
            return (
              <Pressable
                key={d.name}
                style={[styles.legendRow, isHovered && styles.legendRowHover]}
                onHoverIn={Platform.OS === 'web' ? () => setHovered(d.name) : undefined}
                onHoverOut={Platform.OS === 'web' ? () => setHovered(null) : undefined}
              >
                <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                <View style={styles.legendTextWrap}>
                  <Text style={styles.legendLabel} numberOfLines={1}>
                    {d.name}
                  </Text>
                  {isHovered && (
                    <Text style={styles.legendDetail}>
                      ${d.value.toLocaleString()} · {pct}%
                    </Text>
                  )}
                </View>
                <Text style={styles.legendValue}>{pct}%</Text>
              </Pressable>
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
  containerNative: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  chartWrapNative: {
    marginBottom: 16,
  },
  legendNative: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  legendRowNative: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
  },
  legendLabelNative: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
    marginRight: 4,
  },
  legendValueNative: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  legend: {
    flex: 1,
    marginLeft: 20,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  legendRowHover: {
    backgroundColor: Colors.sidebarActiveBg,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  legendTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  legendLabel: {
    fontSize: Typography.chart.legend,
    color: Colors.textSecondary,
  },
  legendDetail: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  legendValue: {
    fontSize: Typography.chart.legend,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
});
