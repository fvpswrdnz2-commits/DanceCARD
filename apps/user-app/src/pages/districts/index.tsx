import { Text, View } from '@tarojs/components';
import Taro, { getCurrentInstance } from '@tarojs/taro';
import { AsyncState } from '../../components/async-state';
import { Hero } from '../../components/hero';
import { PageShell } from '../../components/page-shell';
import { useAsyncResource } from '../../hooks/use-async-resource';
import { publicApi } from '../../services/public-api';
import { readRouteParam } from '../../utils/route-params';

export default function DistrictsPage() {
  const params = getCurrentInstance().router?.params ?? {};
  const cityId = readRouteParam(params.cityId);
  const cityName = readRouteParam(params.cityName, '当前城市');
  const districts = useAsyncResource(
    () => (cityId ? publicApi.listDistricts(cityId) : Promise.reject(new Error('城市链接无效'))),
    cityId,
  );

  return (
    <PageShell>
      <Hero eyebrow={cityName} title='选择行政区' />
      {districts.loading || districts.error ? (
        <AsyncState {...districts} onRetry={districts.reload} />
      ) : null}
      {!districts.loading && !districts.error && districts.data?.length === 0 ? (
        <AsyncState title='这个城市还没有可选区域' />
      ) : null}
      <View className='entity-list'>
        {districts.data?.map((district, index) => (
          <View
            className='entity-card'
            key={district.id}
            role='button'
            onClick={() =>
              Taro.navigateTo({
                url: `/pages/studios/index?districtId=${encodeURIComponent(district.id)}&districtName=${encodeURIComponent(district.name)}`,
              })
            }
          >
            <Text className='entity-card__index'>{String(index + 1).padStart(2, '0')}</Text>
            <Text className='entity-card__name'>{district.name}</Text>
            <Text className='entity-card__arrow'>→</Text>
          </View>
        ))}
      </View>
    </PageShell>
  );
}
