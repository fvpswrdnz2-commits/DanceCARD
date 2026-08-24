import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App';

vi.mock('./services/cloudbase', () => ({
  authApi: {
    getProfile: vi.fn().mockResolvedValue(null),
    requestSmsCode: vi.fn(),
    signOut: vi.fn(),
  },
}));

describe('admin app entry page', () => {
  it('renders the administration heading', async () => {
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'DanceCARD 管理后台' })).toBeInTheDocument();
  });
});
