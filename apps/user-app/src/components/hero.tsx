import { Text, View } from '@tarojs/components';

export function Hero({
  eyebrow,
  subtitle,
  title,
}: {
  eyebrow: string;
  subtitle?: string;
  title: string;
}) {
  return (
    <View className='hero'>
      <Text className='hero__eyebrow'>{eyebrow}</Text>
      <Text className='hero__title'>{title}</Text>
      {subtitle ? <Text className='hero__subtitle'>{subtitle}</Text> : null}
    </View>
  );
}
