import { render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { describe, expect, it, vi } from 'vitest';
import Index from './index';

vi.mock('@tarojs/components', () => ({
  Text: ({ children }: PropsWithChildren) => <span>{children}</span>,
  View: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));

vi.mock('@tarojs/taro', () => ({
  navigateTo: vi.fn(),
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
  });
});
