import { fireEvent, render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DanceCardForm } from './dance-card-form';

vi.mock('@tarojs/components', () => ({
  Button: ({ children, onClick }: PropsWithChildren<{ onClick?: () => void }>) => (
    <button onClick={onClick}>{children}</button>
  ),
  Checkbox: () => <input type='checkbox' />,
  CheckboxGroup: ({ children }: PropsWithChildren) => <div>{children}</div>,
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
  });
});
