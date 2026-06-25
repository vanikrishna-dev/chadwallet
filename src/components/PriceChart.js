import { View } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

export default function PriceChart({ bars, width, height, color = '#00E676' }) {
  if (!bars || bars.length < 2) {
    return <View style={{ width, height }} />;
  }

  const prices = bars.map((b) => Number(b.c));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const pad = 4;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const points = prices.map((p, i) => {
    const x = pad + (i / (prices.length - 1)) * w;
    const y = pad + h - ((p - min) / range) * h;
    return [x, y];
  });

  const linePath = points.reduce(
    (acc, [x, y], i) => acc + (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`),
    ''
  );

  const areaPath = `${linePath} L ${points[points.length - 1][0]} ${height - pad} L ${points[0][0]} ${height - pad} Z`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.3" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={areaPath} fill="url(#grad)" />
      <Path d={linePath} stroke={color} strokeWidth={2} fill="none" />
    </Svg>
  );
}
