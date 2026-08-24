import type { SellerProfile, SmsChallenge } from '@dancecard/api-client';
import { Alert, Button, Card, Form, Input, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { authApi } from '../services/cloudbase';

interface AdminLoginProps {
  onAuthenticated(profile: SellerProfile): void;
}

export function AdminLogin({ onAuthenticated }: AdminLoginProps) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState<SmsChallenge | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [verifiedProfile, setVerifiedProfile] = useState<SellerProfile | null>(null);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const timer = window.setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);

  const requestCode = async () => {
    setBusy(true);
    setError('');
    try {
      setChallenge(await authApi.requestSmsCode(phone));
      setSeconds(60);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '验证码发送失败');
    } finally {
      setBusy(false);
    }
  };

  const login = async () => {
    if (!challenge) {
      setError('请先获取短信验证码');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const profile = await challenge.verify(code);
      if (profile.role !== 'admin' || profile.status !== 'active') {
        setVerifiedProfile(profile);
        throw new Error('手机号已验证，但该账号尚未授予管理员权限');
      }
      onAuthenticated(profile);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '登录失败');
    } finally {
      setBusy(false);
    }
  };

  const checkPermission = async () => {
    setBusy(true);
    setError('');
    try {
      const profile = await authApi.getProfile();
      if (!profile || profile.role !== 'admin' || profile.status !== 'active') {
        throw new Error('尚未检测到有效管理员权限');
      }
      onAuthenticated(profile);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '权限检查失败');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className='login-card'>
      <Typography.Title level={2}>管理员手机号登录</Typography.Title>
      <Typography.Paragraph type='secondary'>
        后台不开放管理员注册，仅已授权账号可进入。
      </Typography.Paragraph>
      {error ? <Alert type='error' showIcon title={error} /> : null}
      {verifiedProfile ? (
        <Space orientation='vertical' size='middle' className='login-form login-form--verified'>
          <Alert
            type='info'
            showIcon
            title='账号验证已完成'
            description='由运维人员在 CloudBase 中授予管理员权限后，点击下方按钮重新检查。'
          />
          <Button type='primary' block loading={busy} onClick={checkPermission}>
            重新检查权限
          </Button>
        </Space>
      ) : (
        <Form layout='vertical' className='login-form'>
          <Form.Item label='中国大陆手机号' htmlFor='admin-phone' required>
            <Input
              id='admin-phone'
              value={phone}
              maxLength={11}
              onChange={(event) => setPhone(event.target.value)}
            />
          </Form.Item>
          <Form.Item label='短信验证码' htmlFor='admin-code' required>
            <Space.Compact block>
              <Input
                id='admin-code'
                value={code}
                maxLength={6}
                onChange={(event) => setCode(event.target.value)}
              />
              <Button disabled={busy || seconds > 0} onClick={requestCode}>
                {seconds > 0 ? `${seconds} 秒` : '获取验证码'}
              </Button>
            </Space.Compact>
          </Form.Item>
          <Button type='primary' block loading={busy} onClick={login}>
            登录后台
          </Button>
        </Form>
      )}
    </Card>
  );
}
