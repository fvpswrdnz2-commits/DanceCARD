import type { SellerProfile } from '@dancecard/api-client';
import { Layout, Spin, Typography } from 'antd';
import { useEffect, useState } from 'react';
import './App.css';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLogin } from './components/AdminLogin';
import { authApi } from './services/cloudbase';

function App() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<SellerProfile | null>(null);

  useEffect(() => {
    void authApi
      .getProfile()
      .then((value) =>
        setProfile(value?.role === 'admin' && value.status === 'active' ? value : null),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout className='admin-shell admin-shell--center'>
        <Spin size='large' description='检查管理员身份' />
      </Layout>
    );
  }
  if (!profile) {
    return (
      <Layout className='admin-shell admin-shell--center'>
        <Typography.Title level={1}>DanceCARD 管理后台</Typography.Title>
        <AdminLogin onAuthenticated={setProfile} />
      </Layout>
    );
  }
  return <AdminDashboard profile={profile} onSignedOut={() => setProfile(null)} />;
}

export default App;
