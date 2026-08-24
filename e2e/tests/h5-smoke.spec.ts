import { expect, test } from '@playwright/test';

test('guest can browse from a city to a dance-card detail', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('今天想去哪跳？')).toBeVisible();
  await expect(page.getByText('北京', { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('上海', { exact: true })).toBeVisible();

  await page.getByText('上海', { exact: true }).click();
  await expect(page.locator('.hero__title').getByText('选择行政区')).toBeVisible();
  await page.getByText('静安区', { exact: true }).click();

  await expect(page.locator('.hero__title').getByText('选择舞室')).toBeVisible();
  await page.getByText('CASTER舞蹈教室（上海大悦城南座店）', { exact: true }).click();

  await expect(page.getByText('正在分享')).toBeVisible();
  await expect(page.getByText('¥45/次', { exact: true })).toBeVisible();
  await page.getByText('¥45/次', { exact: true }).click();

  await expect(page.getByText('次卡详情', { exact: true }).last()).toBeVisible();
  await expect(page.locator('.bottom-nav:visible').last()).toBeVisible();
  await expect(page.getByText('全部舞种通用', { exact: true })).toBeVisible();
  await page.getByText('联系卖家并复制微信', { exact: true }).click();
  await expect(page.getByText('微信号已复制', { exact: true })).toBeVisible();
  await expect(page.getByText('联系前请留意', { exact: true })).toHaveCount(0);
});

test('guest sees a useful empty state for a studio without cards', async ({ page }) => {
  await page.goto('/');
  await page.getByText('北京', { exact: true }).click();
  await page.getByText('西城区', { exact: true }).click();
  await page.getByText('嘉禾舞社北京广安门店', { exact: true }).click();

  await expect(page.getByText('还没有人在这里分享次卡', { exact: true })).toBeVisible();
  await expect(page.getByText('＋ 添加次卡', { exact: true })).toBeVisible();
});

test('guest can open studio addition help and copy the support email', async ({ page }) => {
  await page.goto('/');
  await page.getByText('北京', { exact: true }).click();
  await page.getByText('东城区', { exact: true }).click();

  await page.getByText('找不到舞室？', { exact: true }).click();
  await expect(page.getByText('如何添加舞室 / 城市？', { exact: true })).toBeVisible();
  await expect(page.getByText('请发送邮件至 m18800126467@163.com', { exact: true })).toBeVisible();
  await page.getByText('复制邮箱', { exact: true }).click();
  await expect(page.getByText('邮箱已复制', { exact: true })).toBeVisible();
});

test('guest sees an unavailable state for an invalid card link', async ({ page }) => {
  await page.goto('/#/pages/card-detail/index?cardId=missing&studioName=invalid');

  await expect(page.getByText('这张次卡已不可用', { exact: true })).toBeVisible({
    timeout: 15_000,
  });
});

test('guest is sent to phone login and keeps the selected studio return path', async ({ page }) => {
  await page.goto('/');
  await page.getByText('上海', { exact: true }).click();
  await page.getByText('静安区', { exact: true }).click();
  await page.getByText('CASTER舞蹈教室（上海大悦城南座店）', { exact: true }).click();
  await page.getByText('＋ 添加次卡', { exact: true }).click();

  await expect(page.getByText('手机号登录', { exact: true }).last()).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: '请输入 11 位手机号' })).toBeVisible();
  await expect(page.getByText('获取验证码', { exact: true })).toBeVisible();
  await expect(page.locator('.bottom-nav:visible').last()).toBeVisible();
  await expect(page).toHaveURL(/returnTo=.*publish/);
});
