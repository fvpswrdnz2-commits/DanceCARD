import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminDashboard } from './AdminDashboard';

vi.mock('../services/cloudbase', () => ({
  adminApi: {
    listCards: vi.fn().mockResolvedValue([]),
    listCities: vi.fn().mockResolvedValue([]),
    listDistricts: vi.fn().mockResolvedValue([]),
    listLogs: vi.fn().mockResolvedValue([]),
    listStudios: vi.fn().mockResolvedValue([]),
    listUsers: vi.fn().mockResolvedValue([]),
  },
  authApi: { signOut: vi.fn() },
}));

describe('AdminDashboard', () => {
  it('renders all approved administration areas', async () => {
    render(
      <AdminDashboard
        profile={{
          defaultNickname: null,
          defaultWechatId: null,
          id: '00000000-0000-4000-8000-000000000001',
          role: 'admin',
          status: 'active',
        }}
        onSignedOut={vi.fn()}
      />,
    );

    expect(await screen.findByRole('tab', { name: '城市' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '行政区' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '舞室' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '次卡内容' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '用户' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '审计日志' })).toBeInTheDocument();
  });
});
