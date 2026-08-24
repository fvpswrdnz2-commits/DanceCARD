import { fireEvent, render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { PageShell } from './page-shell';

const { reLaunch } = vi.hoisted(() => ({ reLaunch: vi.fn() }));

vi.mock('@tarojs/components', () => ({
  Text: ({ children }: PropsWithChildren) => <span>{children}</span>,
  View: ({
    children,
    onClick,
    role,
  }: PropsWithChildren<{ onClick?: () => void; role?: string }>) => (
    <div onClick={onClick} role={role}>
      {children}
    </div>
  ),
}));

vi.mock('@tarojs/taro', () => ({
  default: { reLaunch },
}));

describe('PageShell', () => {
  it('keeps all primary destinations available and navigates through the custom menu', () => {
    render(
      <PageShell activeTab='faq'>
        <span>页面内容</span>
      </PageShell>,
    );

    expect(screen.getByText('次卡')).toBeInTheDocument();
    expect(screen.getByText('常见问题')).toBeInTheDocument();
    expect(screen.getByText('我的次卡')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /我的次卡/ }));
    expect(reLaunch).toHaveBeenCalledWith({ url: '/pages/mine/index' });
  });
});
