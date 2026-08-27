import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DanceCardForm } from './dance-card-form';

const { showModal } = vi.hoisted(() => ({
  showModal: vi.fn().mockResolvedValue({ confirm: true }),
}));

vi.mock('@tarojs/taro', () => ({ default: { showModal } }));

afterEach(() => {
  cleanup();
  showModal.mockClear();
});

vi.mock('@tarojs/components', () => ({
  Button: ({ children, formType }: PropsWithChildren<{ formType?: 'reset' | 'submit' }>) => (
    <button type={formType === 'submit' ? 'submit' : 'button'}>{children}</button>
  ),
  Checkbox: () => <input type='checkbox' />,
  CheckboxGroup: ({ children }: PropsWithChildren) => <div>{children}</div>,
  Form: ({ children, onSubmit }: PropsWithChildren<{ onSubmit?: () => void }>) => (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.();
      }}
    >
      {children}
    </form>
  ),
  Input: (props: { placeholder?: string; value?: string }) => (
    <input placeholder={props.placeholder} value={props.value} readOnly />
  ),
  Label: ({ children }: PropsWithChildren) => <label>{children}</label>,
  Picker: ({ children }: PropsWithChildren) => <div>{children}</div>,
  Text: ({ children }: PropsWithChildren) => <span>{children}</span>,
  Textarea: (props: { placeholder?: string; value?: string }) => (
    <textarea placeholder={props.placeholder} value={props.value} readOnly />
  ),
  View: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));

describe('DanceCardForm', () => {
  it('keeps an invalid empty form local and shows field errors', async () => {
    const onSubmit = vi.fn();
    render(<DanceCardForm studioName='测试舞室' submitLabel='确认发布' onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: '确认发布' }));

    expect(await screen.findByText('卖家昵称必须填写')).toBeInTheDocument();
    expect(screen.getByText('微信号必须填写')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(showModal).toHaveBeenCalledWith({
      title: '无法提交',
      content: '卖家昵称必须填写',
      showCancel: false,
    });
  });

  it('shows a platform dialog when a valid submission is rejected', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('发布接口暂时不可用'));
    render(
      <DanceCardForm
        studioName='测试舞室'
        submitLabel='确认发布'
        initialValues={{
          danceScope: 'all',
          danceTypes: [],
          expireDate: '2099-12-31',
          pricePerClass: '60',
          remainingCount: '10',
          sellerNickname: 'Alice',
          wechatId: 'alice-wechat',
        }}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '确认发布' }));

    expect(await screen.findByText('数据库写入失败：发布接口暂时不可用')).toBeInTheDocument();
    expect(showModal).toHaveBeenCalledWith({
      title: '无法提交',
      content: '数据库写入失败：发布接口暂时不可用',
      showCancel: false,
    });
  });
});
