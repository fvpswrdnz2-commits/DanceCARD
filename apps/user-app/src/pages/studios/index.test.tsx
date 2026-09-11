import { fireEvent, render, screen } from '@testing-library/react';
import Taro from '@tarojs/taro';
import type { ButtonHTMLAttributes, HTMLAttributes, PropsWithChildren } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { publicApi } from '../../services/public-api';
import StudiosPage from './index';

const shanghaiId = '20000000-0000-4000-8000-000000000001';

vi.mock('@tarojs/components', () => ({
  Button: ({ children, ...props }: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) => (
    <button {...props}>{children}</button>
  ),
  Text: ({ children }: PropsWithChildren) => <span>{children}</span>,
  View: ({ children, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) => (
    <div {...props}>{children}</div>
  ),
}));

vi.mock('@tarojs/taro', () => ({
  default: {
    navigateTo: vi.fn(),
    reLaunch: vi.fn(),
    setClipboardData: vi.fn(),
    showToast: vi.fn(),
  },
  getCurrentInstance: () => ({
    router: {
      params: {
        cityId: '20000000-0000-4000-8000-000000000001',
        cityName: '%E4%B8%8A%E6%B5%B7',
      },
    },
  }),
}));

vi.mock('../../services/public-api', () => ({
  publicApi: {
    listStudios: vi.fn().mockResolvedValue([
      {
        cityId: '20000000-0000-4000-8000-000000000001',
        id: '30000000-0000-4000-8000-000000000001',
        name: 'CASTER舞蹈教室',
      },
    ]),
  },
}));

describe('city studio page', () => {
  it('loads studios by city and keeps the city-to-studio route direct', async () => {
    render(<StudiosPage />);

    expect(await screen.findByText('CASTER舞蹈教室')).toBeInTheDocument();
    expect(screen.getByText('上海')).toBeInTheDocument();
    expect(publicApi.listStudios).toHaveBeenCalledWith(shanghaiId);

    fireEvent.click(screen.getByText('CASTER舞蹈教室'));
    expect(vi.mocked(Taro.navigateTo)).toHaveBeenCalledWith({
      url: '/pages/studio/index?studioId=30000000-0000-4000-8000-000000000001&studioName=CASTER%E8%88%9E%E8%B9%88%E6%95%99%E5%AE%A4',
    });
  });
});
