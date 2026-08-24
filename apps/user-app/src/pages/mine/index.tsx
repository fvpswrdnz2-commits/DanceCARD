import type { SellerDanceCard, SellerProfile } from '@dancecard/api-client';
import { Button, Text, View } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useCallback, useState } from 'react';
import { AsyncState } from '../../components/async-state';
import { Hero } from '../../components/hero';
import { PageShell } from '../../components/page-shell';
import { authApi, sellerApi } from '../../services/public-api';

function cardStatus(card: SellerDanceCard) {
  if (card.hiddenReason === 'admin') return '管理员隐藏';
  if (card.hiddenReason === 'expired') return '已过期';
  if (card.visibility === 'hidden') return '已隐藏';
  return '展示中';
}

export default function MinePage() {
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [cards, setCards] = useState<SellerDanceCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workingId, setWorkingId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const nextProfile = await authApi.getProfile();
      setProfile(nextProfile);
      setCards(nextProfile ? await sellerApi.listMine() : []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useDidShow(() => {
    void load();
  });

  const changeVisibility = async (card: SellerDanceCard) => {
    setWorkingId(card.id);
    try {
      await sellerApi.setCardHidden(card.id, card.visibility === 'active');
      await load();
    } catch (reason) {
      await Taro.showToast({
        title: reason instanceof Error ? reason.message : '操作失败',
        icon: 'none',
      });
    } finally {
      setWorkingId('');
    }
  };

  const deleteCard = async (card: SellerDanceCard) => {
    const confirmation = await Taro.showModal({
      title: '删除这张次卡？',
      content: '删除后不会出现在公开列表或“我的次卡”中，且无法自行恢复。',
      confirmColor: '#b42344',
      confirmText: '确认删除',
    });
    if (!confirmation.confirm) return;
    setWorkingId(card.id);
    try {
      await sellerApi.deleteCard(card.id);
      await load();
      await Taro.showToast({ title: '已删除', icon: 'success' });
    } catch (reason) {
      await Taro.showToast({
        title: reason instanceof Error ? reason.message : '删除失败',
        icon: 'none',
      });
    } finally {
      setWorkingId('');
    }
  };

  if (loading) {
    return (
      <PageShell activeTab='mine'>
        <AsyncState loading />
      </PageShell>
    );
  }

  if (!profile) {
    return (
      <PageShell activeTab='mine'>
        <Hero eyebrow='卖家中心' title='我的次卡' />
        <View className='content-card'>
          <Text className='state-card__title'>手机号登录后查看</Text>
          <Text className='state-card__copy'>你可以编辑、隐藏、恢复或删除自己的发布记录。</Text>
          <Button
            className='primary-button'
            onClick={() =>
              Taro.navigateTo({
                url: `/pages/login/index?returnTo=${encodeURIComponent('/pages/mine/index')}`,
              })
            }
          >
            手机号登录
          </Button>
        </View>
      </PageShell>
    );
  }

  return (
    <PageShell activeTab='mine'>
      <Hero eyebrow='卖家中心' title='我的次卡' />
      {error ? <AsyncState error={error} onRetry={load} /> : null}
      <View className='mine-toolbar'>
        <Text className='mine-toolbar__identity'>
          已登录 · {profile.role === 'admin' ? '管理员' : '普通用户'}
        </Text>
        <Button
          className='text-button'
          onClick={async () => {
            await authApi.signOut();
            await load();
          }}
        >
          退出登录
        </Button>
      </View>
      {cards.length === 0 ? (
        <AsyncState title='还没有发布过次卡' copy='请从目标舞室页面点击“添加次卡”。' />
      ) : null}
      <View className='entity-list'>
        {cards.map((card) => (
          <View className='dance-card' key={card.id}>
            <View className='dance-card__top'>
              <Text className='dance-card__seller'>{card.studioName}</Text>
              <Text className='status-badge'>{cardStatus(card)}</Text>
            </View>
            <View className='dance-card__meta'>
              <Text className='pill'>{card.remainingCount} 次</Text>
              <Text className='pill pill--pink'>¥{card.pricePerClass}/次</Text>
              <Text className='pill'>有效至 {card.expireDate}</Text>
            </View>
            <View className='card-actions'>
              <Button
                className='small-button'
                onClick={() =>
                  Taro.navigateTo({
                    url: `/pages/edit-card/index?cardId=${encodeURIComponent(card.id)}`,
                  })
                }
              >
                编辑
              </Button>
              {card.hiddenReason === null || card.hiddenReason === 'user' ? (
                <Button
                  className={
                    workingId === card.id ? 'small-button small-button--disabled' : 'small-button'
                  }
                  disabled={workingId === card.id}
                  onClick={() => changeVisibility(card)}
                >
                  {card.visibility === 'active' ? '隐藏' : '恢复'}
                </Button>
              ) : null}
              <Button
                className={
                  workingId === card.id
                    ? 'small-button small-button--danger small-button--disabled'
                    : 'small-button small-button--danger'
                }
                disabled={workingId === card.id}
                onClick={() => deleteCard(card)}
              >
                删除
              </Button>
            </View>
          </View>
        ))}
      </View>
    </PageShell>
  );
}
