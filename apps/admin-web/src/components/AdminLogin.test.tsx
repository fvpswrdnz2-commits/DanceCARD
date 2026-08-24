import type { SellerProfile, SmsChallenge } from '@dancecard/api-client';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authApi } from '../services/cloudbase';
import { AdminLogin } from './AdminLogin';

vi.mock('../services/cloudbase', () => ({
  authApi: {
    getProfile: vi.fn(),
    requestSmsCode: vi.fn(),
    signOut: vi.fn(),
  },
}));

const userProfile: SellerProfile = {
  defaultNickname: null,
  defaultWechatId: null,
  id: '00000000-0000-4000-8000-000000000001',
  role: 'user',
  status: 'active',
};

const adminProfile: SellerProfile = { ...userProfile, role: 'admin' };

describe('AdminLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('preserves a verified non-admin session and can recheck permissions', async () => {
    const challenge: SmsChallenge = {
      expiresIn: 600,
      phone: '+8613900000000',
      verify: vi.fn().mockResolvedValue(userProfile),
    };
    vi.mocked(authApi.requestSmsCode).mockResolvedValue(challenge);
    vi.mocked(authApi.getProfile).mockResolvedValue(adminProfile);
    const onAuthenticated = vi.fn();
    render(<AdminLogin onAuthenticated={onAuthenticated} />);

    fireEvent.change(screen.getByLabelText('中国大陆手机号'), {
      target: { value: '13900000000' },
    });
    fireEvent.click(screen.getByRole('button', { name: '获取验证码' }));
    await waitFor(() => expect(authApi.requestSmsCode).toHaveBeenCalledWith('13900000000'));
    const loginButton = screen.getByText('登录后台').closest('button');
    await waitFor(() => expect(loginButton).not.toBeDisabled());

    fireEvent.change(screen.getByLabelText('短信验证码'), { target: { value: '123456' } });
    fireEvent.click(loginButton!);

    expect(await screen.findByText('账号验证已完成')).toBeInTheDocument();
    expect(authApi.signOut).not.toHaveBeenCalled();
    expect(onAuthenticated).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '重新检查权限' }));
    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledWith(adminProfile));
  });
});
