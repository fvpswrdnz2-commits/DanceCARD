import { Button, Text, View } from '@tarojs/components';

interface AsyncStateProps {
  copy?: string;
  error?: string | null;
  loading?: boolean;
  onRetry?: () => void;
  title?: string;
}

export function AsyncState({ copy, error, loading, onRetry, title }: AsyncStateProps) {
  if (!loading && !error && !title) return null;
  return (
    <View className='state-card'>
      <Text className='state-card__title'>
        {loading ? '正在加载…' : error ? '暂时没加载出来' : title}
      </Text>
      <Text className='state-card__copy'>{error || copy || '很快就好'}</Text>
      {error && onRetry ? (
        <Button className='secondary-button' onClick={onRetry}>
          再试一次
        </Button>
      ) : null}
    </View>
  );
}
