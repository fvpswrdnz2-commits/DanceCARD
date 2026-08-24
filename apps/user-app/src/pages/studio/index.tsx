import { Button, Text, View } from '@tarojs/components';
import Taro, { getCurrentInstance } from '@tarojs/taro';
import { AsyncState } from '../../components/async-state';
import { Hero } from '../../components/hero';
import { PageShell } from '../../components/page-shell';
import { useAsyncResource } from '../../hooks/use-async-resource';
import { authApi, publicApi } from '../../services/public-api';
import { readRouteParam } from '../../utils/route-params';

function formatDate(value: string) {
  return value.slice(0, 10).replace(/-/g, '.');
}

export default function StudioCardsPage() {
  const params = getCurrentInstance().router?.params ?? {};
  const studioId = readRouteParam(params.studioId);
  const studioName = readRouteParam(params.studioName, '舞室');
  const cards = useAsyncResource(
    () => (studioId ? publicApi.listCards(studioId) : Promise.reject(new Error('舞室链接无效'))),
    studioId,
  );
  const publishUrl = `/pages/publish/index?studioId=${encodeURIComponent(studioId)}&studioName=${encodeURIComponent(studioName)}`;

  const addCard = async () => {
    try {
      const profile = await authApi.getProfile();
      await Taro.navigateTo({
        url: profile ? publishUrl : `/pages/login/index?returnTo=${encodeURIComponent(publishUrl)}`,
      });
    } catch (reason) {
      await Taro.showToast({
        title: reason instanceof Error ? reason.message : '暂时无法登录，请稍后重试',
        icon: 'none',
      });
    }
  };

  return (
    <PageShell>
      <Hero eyebrow='舞室次卡' title={studioName} />
      <Button className='primary-button' onClick={addCard}>
        ＋ 添加次卡
      </Button>
      <Text className='section-title'>正在分享</Text>
      {cards.loading || cards.error ? <AsyncState {...cards} onRetry={cards.reload} /> : null}
      {!cards.loading && !cards.error && cards.data?.items.length === 0 ? (
        <AsyncState title='还没有人在这里分享次卡' copy='你可以成为第一个发布的人。' />
      ) : null}
      <View className='entity-list'>
        {cards.data?.items.map((card) => (
          <View
            className='dance-card'
            key={card.id}
            role='button'
            onClick={() =>
              Taro.navigateTo({
                url: `/pages/card-detail/index?cardId=${encodeURIComponent(card.id)}&studioName=${encodeURIComponent(studioName)}`,
              })
            }
          >
            <View className='dance-card__top'>
              <Text className='dance-card__seller'>{card.sellerNickname}</Text>
              <Text className='dance-card__price'>¥{card.pricePerClass}/次</Text>
            </View>
            <View className='dance-card__meta'>
              <Text className='pill'>分享 {card.remainingCount} 次</Text>
              <Text className='pill pill--pink'>有效至 {formatDate(card.expireDate)}</Text>
            </View>
            <Text className='card-date'>发布于 {formatDate(card.createdAt)}</Text>
          </View>
        ))}
      </View>
    </PageShell>
  );
}
