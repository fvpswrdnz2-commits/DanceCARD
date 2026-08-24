import { Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { AsyncState } from '../../components/async-state';
import { Hero } from '../../components/hero';
import { PageShell } from '../../components/page-shell';
import { useAsyncResource } from '../../hooks/use-async-resource';
import { publicApi } from '../../services/public-api';
import './index.scss';

const CITY_ENGLISH_NAMES: Record<string, string> = {
  北京: 'BEIJING',
  上海: 'SHANGHAI',
};

export default function CitiesPage() {
  const cities = useAsyncResource(() => publicApi.listCities());

  return (
    <PageShell>
      <Hero eyebrow='CITY SELECT / 02' title='今天想去哪跳？' />
      <Text className='section-title'>选择城市</Text>
      {cities.loading || cities.error ? <AsyncState {...cities} onRetry={cities.reload} /> : null}
      {!cities.loading && !cities.error && cities.data?.length === 0 ? (
        <AsyncState title='暂时还没有城市' copy='首批将开放北京和上海。' />
      ) : null}
      <View className='entity-list city-list'>
        {cities.data?.map((city, index) => (
          <View
            className='entity-card city-card'
            key={city.id}
            role='button'
            onClick={() =>
              Taro.navigateTo({
                url: `/pages/districts/index?cityId=${encodeURIComponent(city.id)}&cityName=${encodeURIComponent(city.name)}`,
              })
            }
          >
            <Text className='entity-card__index'>{String(index + 1).padStart(2, '0')}</Text>
            <View className='entity-card__copy'>
              <Text className='entity-card__name'>{city.name}</Text>
              <Text className='entity-card__secondary'>
                {CITY_ENGLISH_NAMES[city.name] || 'CITY'}
              </Text>
            </View>
            <Text className='entity-card__arrow'>→</Text>
          </View>
        ))}
      </View>
    </PageShell>
  );
}
