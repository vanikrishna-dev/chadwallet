import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export default function Sparkline({ bars, width = 64, height = 24, color = '#00E676' }) {
  if (!bars || bars.length < 2) return <View style={{ width, height }} />;

  const prices = bars.map((b) => Number(b.c));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const points = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * width;
    const y = height - ((p - min) / range) * height;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');

  return (
    <Svg width={width} height={height}>
      <Path d={points} stroke={color} strokeWidth={1.5} fill="none" />
    </Svg>
  );
}
