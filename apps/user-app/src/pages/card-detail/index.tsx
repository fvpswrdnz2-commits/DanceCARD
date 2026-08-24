import { Button, Text, View } from '@tarojs/components';
import Taro, { getCurrentInstance } from '@tarojs/taro';
import { AsyncState } from '../../components/async-state';
import { Hero } from '../../components/hero';
import { PageShell } from '../../components/page-shell';
import { useAsyncResource } from '../../hooks/use-async-resource';
import { publicApi } from '../../services/public-api';
import { readRouteParam } from '../../utils/route-params';

const DANCE_NAMES: Record<string, string> = {
  'hip-hop': 'Hip-hop',
  jazz: 'Jazz',
  locking: 'Locking',
  popping: 'Popping',
  house: 'House',
  waacking: 'Waacking',
  'k-pop': 'K-pop',
};

function displayDanceTypes(card: {
  danceScope: 'all' | 'specified';
  danceTypes: string[];
  danceTypeOther: string | null;
}) {
  if (card.danceScope === 'all') return '全部舞种通用';
  return [
    ...card.danceTypes.map((item) => DANCE_NAMES[item] || item),
    ...(card.danceTypeOther ? [card.danceTypeOther] : []),
  ].join('、');
}

export default function CardDetailPage() {
  const params = getCurrentInstance().router?.params ?? {};
  const cardId = readRouteParam(params.cardId);
  const studioName = readRouteParam(params.studioName, '舞室');
  const card = useAsyncResource(
    () => (cardId ? publicApi.getCard(cardId) : Promise.reject(new Error('次卡链接无效'))),
    cardId,
  );

  const contactSeller = async () => {
    try {
      const wechatId = await publicApi.getContact(cardId);
      await Taro.setClipboardData({ data: wechatId });
      await Taro.showToast({ title: '微信号已复制', icon: 'success' });
    } catch (reason) {
      await Taro.showToast({
        title: reason instanceof Error ? reason.message : '复制失败，请稍后重试',
        icon: 'none',
      });
    }
  };

  if (card.loading || card.error) {
    return (
      <PageShell>
        <AsyncState {...card} onRetry={card.reload} />
      </PageShell>
    );
  }
  if (!card.data) {
    return (
      <PageShell>
        <AsyncState title='这张次卡已不可用' copy='它可能已过期、隐藏或被删除。' />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Hero eyebrow='次卡详情' title={studioName} />
      <View className='content-card'>
        <View className='dance-card__top'>
          <Text className='dance-card__seller'>{card.data.sellerNickname}</Text>
          <Text className='dance-card__price'>¥{card.data.pricePerClass}/次</Text>
        </View>
        <View className='detail-grid'>
          <View className='detail-row'>
            <Text className='detail-label'>剩余课时</Text>
            <Text className='detail-value'>{card.data.remainingCount} 次</Text>
          </View>
          <View className='detail-row'>
            <Text className='detail-label'>使用截止日期</Text>
            <Text className='detail-value'>{card.data.expireDate}</Text>
          </View>
          <View className='detail-row'>
            <Text className='detail-label'>可用舞种</Text>
            <Text className='detail-value'>{displayDanceTypes(card.data)}</Text>
          </View>
          <View className='detail-row'>
            <Text className='detail-label'>使用限制</Text>
            <Text className='detail-value'>{card.data.usageRestrictions || '卖家未填写'}</Text>
          </View>
          <View className='detail-row'>
            <Text className='detail-label'>备注</Text>
            <Text className='detail-value'>{card.data.description || '卖家未填写'}</Text>
          </View>
        </View>
        <Button className='primary-button' onClick={contactSeller}>
          联系卖家并复制微信
        </Button>
      </View>
      <View className='notice'>
        免责声明：DanceCARD
        无法验证任何用户信息的真实性和可靠性。诈骗有可能发生，请谨慎使用。平台不参与、不监督任何交易，也不对基于本平台发生的交易承担责任。
      </View>
    </PageShell>
  );
}
