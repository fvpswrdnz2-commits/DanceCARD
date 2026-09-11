import { fireEvent, render, screen } from '@testing-library/react';
import Taro from '@tarojs/taro';
import type { HTMLAttributes, PropsWithChildren } from 'react';
import { describe, expect, it, vi } from 'vitest';
import Index from './index';

vi.mock('@tarojs/components', () => ({
  Text: ({ children }: PropsWithChildren) => <span>{children}</span>,
  View: ({ children, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) => (
    <div {...props}>{children}</div>
  ),
}));

vi.mock('@tarojs/taro', () => ({
  default: { navigateTo: vi.fn() },
}));

vi.mock('../../services/public-api', () => ({
  publicApi: {
    listCities: vi.fn().mockResolvedValue([
      { id: 'beijing', name: '北京' },
      { id: 'shanghai', name: '上海' },
    ]),
  },
}));

describe('user app entry page', () => {
  it('renders active cities returned by the public API', async () => {
    render(<Index />);

    expect(await screen.findByText('北京')).toBeInTheDocument();
    expect(screen.getByText('上海')).toBeInTheDocument();
    expect(screen.getByText('今天想去哪跳？')).toBeInTheDocument();

    fireEvent.click(screen.getByText('上海'));
    expect(vi.mocked(Taro.navigateTo)).toHaveBeenCalledWith({
      url: '/pages/studios/index?cityId=shanghai&cityName=%E4%B8%8A%E6%B5%B7',
    });
  });
});
