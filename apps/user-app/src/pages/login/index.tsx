import type { SmsChallenge } from '@dancecard/api-client';
import { Button, Input, Text, View } from '@tarojs/components';
import Taro, { getCurrentInstance } from '@tarojs/taro';
import { useEffect, useMemo, useState } from 'react';
import { Hero } from '../../components/hero';
import { PageShell } from '../../components/page-shell';
import { authApi } from '../../services/public-api';
import { readRouteParam } from '../../utils/route-params';
import { isTabReturnPath, safeReturnPath } from '../../utils/return-path';

async function continueTo(returnTo: string) {
  if (isTabReturnPath(returnTo)) {
    await Taro.reLaunch({ url: returnTo });
    return;
  }
  await Taro.redirectTo({ url: returnTo });
}

export default function LoginPage() {
  const params = getCurrentInstance().router?.params ?? {};
  const returnTo = useMemo(
    () => safeReturnPath(readRouteParam(params.returnTo)),
    [params.returnTo],
  );
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState<SmsChallenge | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void authApi.getProfile().then((profile) => {
      if (profile) void continueTo(returnTo);
    });
  }, [returnTo]);

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const requestCode = async () => {
    setBusy(true);
    setError('');
    try {
      const nextChallenge = await authApi.requestSmsCode(phone);
      setChallenge(nextChallenge);
      setSecondsLeft(60);
      await Taro.showToast({ title: '验证码已发送', icon: 'success' });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '验证码发送失败，请稍后重试');
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    if (!challenge) {
      setError('请先获取短信验证码');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await challenge.verify(code);
      await Taro.showToast({ title: '登录成功', icon: 'success' });
      await continueTo(returnTo);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '登录失败，请稍后重试');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell activeTab='mine'>
      <Hero eyebrow='卖家身份' title='手机号登录' />
      <View className='content-card form-card'>
        <Text className='field-label'>中国大陆手机号</Text>
        <Input
          className='field-input'
          maxlength={11}
          placeholder='请输入 11 位手机号'
          type='number'
          value={phone}
          onInput={(event) => setPhone(event.detail.value)}
        />
        <Text className='field-label field-label--spaced'>短信验证码</Text>
        <View className='sms-code-row'>
          <Input
            className='field-input sms-code-input'
            maxlength={6}
            placeholder='请输入 6 位验证码'
            type='number'
            value={code}
            onInput={(event) => setCode(event.detail.value)}
          />
          <Button
            className={
              busy || secondsLeft > 0
                ? 'sms-code-button sms-code-button--disabled'
                : 'sms-code-button'
            }
            disabled={busy || secondsLeft > 0}
            onClick={requestCode}
          >
            {secondsLeft > 0 ? `${secondsLeft}秒` : '获取验证码'}
          </Button>
        </View>
        {error ? <Text className='field-error'>{error}</Text> : null}
        <Button className='primary-button' disabled={busy} onClick={verifyCode}>
          {busy ? '请稍候…' : '登录并继续'}
        </Button>
      </View>
      <View className='notice'>
        浏览和联系卖家不需要登录。登录仅用于发布、编辑、隐藏或删除你自己的次卡。
      </View>
    </PageShell>
  );
}
