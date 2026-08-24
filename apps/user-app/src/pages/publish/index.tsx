import type { SellerProfile } from '@dancecard/api-client';
import Taro, { getCurrentInstance } from '@tarojs/taro';
import { useEffect, useMemo, useState } from 'react';
import { AsyncState } from '../../components/async-state';
import { DanceCardForm } from '../../components/dance-card-form';
import { Hero } from '../../components/hero';
import { PageShell } from '../../components/page-shell';
import { authApi, sellerApi } from '../../services/public-api';
import { readRouteParam } from '../../utils/route-params';

export default function PublishPage() {
  const params = getCurrentInstance().router?.params ?? {};
  const studioId = readRouteParam(params.studioId);
  const studioName = readRouteParam(params.studioName, '舞室');
  const returnTo = useMemo(
    () =>
      `/pages/publish/index?studioId=${encodeURIComponent(studioId)}&studioName=${encodeURIComponent(studioName)}`,
    [studioId, studioName],
  );
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    void authApi
      .getProfile()
      .then((nextProfile) => {
        if (!nextProfile) {
          return Taro.redirectTo({
            url: `/pages/login/index?returnTo=${encodeURIComponent(returnTo)}`,
          });
        }
        setProfile(nextProfile);
        return undefined;
      })
      .finally(() => setCheckingSession(false));
  }, [returnTo]);

  if (checkingSession || !profile) {
    return (
      <PageShell>
        <AsyncState loading />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Hero eyebrow='添加次卡' title={studioName} />
      <DanceCardForm
        initialValues={{
          sellerNickname: profile.defaultNickname || '',
          wechatId: profile.defaultWechatId || '',
        }}
        studioName={studioName}
        submitLabel='确认发布'
        onSubmit={async (values) => {
          await sellerApi.publishCard({ ...values, studioId });
          await Taro.showToast({ title: '次卡已发布', icon: 'success' });
          await Taro.redirectTo({
            url: `/pages/studio/index?studioId=${encodeURIComponent(studioId)}&studioName=${encodeURIComponent(studioName)}`,
          });
        }}
      />
    </PageShell>
  );
}
