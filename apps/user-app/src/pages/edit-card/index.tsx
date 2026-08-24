import Taro, { getCurrentInstance } from '@tarojs/taro';
import { AsyncState } from '../../components/async-state';
import { DanceCardForm } from '../../components/dance-card-form';
import { Hero } from '../../components/hero';
import { PageShell } from '../../components/page-shell';
import { useAsyncResource } from '../../hooks/use-async-resource';
import { sellerApi } from '../../services/public-api';
import { readRouteParam } from '../../utils/route-params';

export default function EditCardPage() {
  const params = getCurrentInstance().router?.params ?? {};
  const cardId = readRouteParam(params.cardId);
  const card = useAsyncResource(() => sellerApi.getMineCard(cardId), cardId);

  if (card.loading || card.error) {
    return (
      <PageShell activeTab='mine'>
        <AsyncState {...card} onRetry={card.reload} />
      </PageShell>
    );
  }
  if (!card.data) {
    return (
      <PageShell activeTab='mine'>
        <AsyncState title='次卡不存在或你无权编辑' />
      </PageShell>
    );
  }

  return (
    <PageShell activeTab='mine'>
      <Hero eyebrow='编辑次卡' title={card.data.studioName} />
      <DanceCardForm
        initialValues={{
          danceScope: card.data.danceScope,
          danceTypeOther: card.data.danceTypeOther,
          danceTypes: [...card.data.danceTypes, ...(card.data.danceTypeOther ? ['other'] : [])],
          description: card.data.description,
          expireDate: card.data.expireDate,
          pricePerClass: card.data.pricePerClass,
          remainingCount: String(card.data.remainingCount),
          sellerNickname: card.data.sellerNickname,
          usageRestrictions: card.data.usageRestrictions,
          wechatId: card.data.wechatId,
        }}
        studioName={card.data.studioName}
        submitLabel='保存修改'
        onSubmit={async (values) => {
          await sellerApi.updateCard(cardId, values);
          await Taro.showToast({ title: '已保存', icon: 'success' });
          await Taro.reLaunch({ url: '/pages/mine/index' });
        }}
      />
    </PageShell>
  );
}
