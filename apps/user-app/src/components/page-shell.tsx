import { Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import type { PropsWithChildren } from 'react';

export type PrimaryTab = 'cards' | 'faq' | 'mine';

const NAV_ITEMS: Array<{
  key: PrimaryTab;
  label: string;
  symbol: string;
  url: string;
}> = [
  { key: 'cards', label: '次卡', symbol: '01', url: '/pages/index/index' },
  { key: 'faq', label: '常见问题', symbol: '02', url: '/pages/faq/index' },
  { key: 'mine', label: '我的次卡', symbol: '03', url: '/pages/mine/index' },
];

export function PageShell({
  activeTab = 'cards',
  children,
}: PropsWithChildren<{ activeTab?: PrimaryTab }>) {
  return (
    <View className='page-shell'>
      <View className='brand-bar'>
        <Text className='brand-bar__name'>DanceCARD</Text>
        <Text className='brand-bar__meta'>PASS EXCHANGE</Text>
      </View>
      {children}
      <View className='bottom-nav' aria-label='一级菜单'>
        {NAV_ITEMS.map((item) => (
          <View
            className={
              item.key === activeTab
                ? 'bottom-nav__item bottom-nav__item--active'
                : 'bottom-nav__item'
            }
            key={item.key}
            role='button'
            onClick={() => {
              if (item.key !== activeTab) void Taro.reLaunch({ url: item.url });
            }}
          >
            <Text className='bottom-nav__symbol'>{item.symbol}</Text>
            <Text className='bottom-nav__label'>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
