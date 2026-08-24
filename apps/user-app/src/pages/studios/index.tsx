import { Button, Text, View } from '@tarojs/components';
import Taro, { getCurrentInstance } from '@tarojs/taro';
import { useState } from 'react';
import { AsyncState } from '../../components/async-state';
import { Hero } from '../../components/hero';
import { PageShell } from '../../components/page-shell';
import { useAsyncResource } from '../../hooks/use-async-resource';
import { publicApi } from '../../services/public-api';
import { readRouteParam } from '../../utils/route-params';

const SUPPORT_EMAIL = 'm18800126467@163.com';

export default function StudiosPage() {
  const [showHelp, setShowHelp] = useState(false);
  const params = getCurrentInstance().router?.params ?? {};
  const districtId = readRouteParam(params.districtId);
  const districtName = readRouteParam(params.districtName, '当前区域');
  const studios = useAsyncResource(
    () =>
      districtId ? publicApi.listStudios(districtId) : Promise.reject(new Error('行政区链接无效')),
    districtId,
  );

  return (
    <PageShell>
      <Hero eyebrow={districtName} title='选择舞室' />
      {studios.loading || studios.error ? (
        <AsyncState {...studios} onRetry={studios.reload} />
      ) : null}
      {!studios.loading && !studios.error && studios.data?.length === 0 ? (
        <AsyncState title='这里还没有舞室' />
      ) : null}
      <View className='entity-list'>
        {studios.data?.map((studio, index) => (
          <View
            className='entity-card'
            key={studio.id}
            role='button'
            onClick={() =>
              Taro.navigateTo({
                url: `/pages/studio/index?studioId=${encodeURIComponent(studio.id)}&studioName=${encodeURIComponent(studio.name)}`,
              })
            }
          >
            <Text className='entity-card__index'>{String(index + 1).padStart(2, '0')}</Text>
            <Text className='entity-card__name'>{studio.name}</Text>
            <Text className='entity-card__arrow'>→</Text>
          </View>
        ))}
      </View>
      <Button className='studio-help-button' onClick={() => setShowHelp(true)}>
        找不到舞室？
      </Button>
      {showHelp ? (
        <View className='modal-overlay' role='dialog' onClick={() => setShowHelp(false)}>
          <View className='help-modal' onClick={(event) => event.stopPropagation()}>
            <Button
              className='help-modal__close'
              aria-label='关闭'
              onClick={() => setShowHelp(false)}
            >
              ×
            </Button>
            <Text className='help-modal__title'>如何添加舞室 / 城市？</Text>
            <Text className='help-modal__copy'>
              如果你需要新增城市、行政区或舞室，请告知舞室的中文 /
              英文名称、所在城市和行政区，并提供大众点评或地图截图。信息越完整，管理员越能及时核实并上架。
            </Text>
            <Text className='help-modal__email'>请发送邮件至 {SUPPORT_EMAIL}</Text>
            <Button
              className='help-modal__copy-button'
              onClick={async () => {
                await Taro.setClipboardData({ data: SUPPORT_EMAIL });
                await Taro.showToast({ title: '邮箱已复制', icon: 'success' });
              }}
            >
              复制邮箱
            </Button>
          </View>
        </View>
      ) : null}
    </PageShell>
  );
}
