import type {
  AdminActionLog,
  AdminCity,
  AdminDanceCard,
  AdminDistrict,
  AdminStudio,
  AdminUser,
  SellerProfile,
} from '@dancecard/api-client';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Layout,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi, authApi } from '../services/cloudbase';

type Status = 'active' | 'inactive';

function statusTag(status: string) {
  return <Tag color={status === 'active' ? 'green' : 'default'}>{status}</Tag>;
}

function CitiesPanel({ onChanged }: { onChanged(): Promise<void> }) {
  const [items, setItems] = useState<AdminCity[]>([]);
  const [editing, setEditing] = useState<Partial<AdminCity> | null>(null);
  const [form] = Form.useForm();
  const load = useCallback(() => adminApi.listCities().then(setItems), []);
  useEffect(() => void load(), [load]);

  const open = (item?: AdminCity) => {
    const value = item || {
      name: '',
      sortOrder: items.length * 10 + 10,
      status: 'active' as Status,
    };
    setEditing(value);
    form.setFieldsValue(value);
  };
  const save = async () => {
    const values = await form.validateFields();
    await adminApi.saveCity({ ...values, id: editing?.id });
    message.success('城市已保存');
    setEditing(null);
    await load();
    await onChanged();
  };

  return (
    <Card title='城市管理' extra={<Button onClick={() => open()}>新增城市</Button>}>
      <Table
        rowKey='id'
        pagination={{ pageSize: 20 }}
        dataSource={items}
        columns={[
          { title: '城市', dataIndex: 'name' },
          { title: '排序', dataIndex: 'sortOrder', width: 100 },
          { title: '状态', dataIndex: 'status', render: statusTag, width: 120 },
          { title: '操作', render: (_, item) => <Button onClick={() => open(item)}>编辑</Button> },
        ]}
      />
      <Modal open={Boolean(editing)} title='保存城市' onOk={save} onCancel={() => setEditing(null)}>
        <Form form={form} layout='vertical'>
          <Form.Item name='name' label='城市名称' rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name='sortOrder' label='排序' rules={[{ required: true }]}>
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item name='status' label='状态' rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'active', label: '启用' },
                { value: 'inactive', label: '停用（下级内容停止公开）' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

function DistrictsPanel({
  cities,
  onChanged,
}: {
  cities: AdminCity[];
  onChanged(): Promise<void>;
}) {
  const [items, setItems] = useState<AdminDistrict[]>([]);
  const [editing, setEditing] = useState<Partial<AdminDistrict> | null>(null);
  const [cityFilter, setCityFilter] = useState<string>();
  const [form] = Form.useForm();
  const load = useCallback(() => adminApi.listDistricts().then(setItems), []);
  useEffect(() => void load(), [load]);
  const visible = cityFilter ? items.filter((item) => item.cityId === cityFilter) : items;
  const open = (item?: AdminDistrict) => {
    const value = item || {
      cityId: cityFilter || cities[0]?.id,
      name: '',
      sortOrder: 10,
      status: 'active' as Status,
    };
    setEditing(value);
    form.setFieldsValue(value);
  };
  const save = async () => {
    const values = await form.validateFields();
    await adminApi.saveDistrict({ ...values, id: editing?.id });
    message.success('行政区已保存');
    setEditing(null);
    await load();
    await onChanged();
  };
  return (
    <Card title='行政区管理' extra={<Button onClick={() => open()}>新增行政区</Button>}>
      <Select
        allowClear
        placeholder='按城市筛选'
        value={cityFilter}
        onChange={setCityFilter}
        options={cities.map((item) => ({ value: item.id, label: item.name }))}
        className='panel-filter'
      />
      <Table
        rowKey='id'
        pagination={{ pageSize: 20 }}
        dataSource={visible}
        columns={[
          { title: '行政区', dataIndex: 'name' },
          {
            title: '城市',
            dataIndex: 'cityId',
            render: (id) => cities.find((item) => item.id === id)?.name || id,
          },
          { title: '状态', dataIndex: 'status', render: statusTag },
          { title: '操作', render: (_, item) => <Button onClick={() => open(item)}>编辑</Button> },
        ]}
      />
      <Modal
        open={Boolean(editing)}
        title='保存行政区'
        onOk={save}
        onCancel={() => setEditing(null)}
      >
        <Form form={form} layout='vertical'>
          <Form.Item name='cityId' label='城市' rules={[{ required: true }]}>
            <Select options={cities.map((item) => ({ value: item.id, label: item.name }))} />
          </Form.Item>
          <Form.Item name='name' label='行政区名称' rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name='sortOrder' label='排序' rules={[{ required: true }]}>
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item name='status' label='状态' rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'active', label: '启用' },
                { value: 'inactive', label: '停用（下级内容停止公开）' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

function normalizeStudioName(value: string) {
  return value.toLocaleLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');
}

function StudiosPanel({
  districts,
  onChanged,
}: {
  districts: AdminDistrict[];
  onChanged(): Promise<void>;
}) {
  const [items, setItems] = useState<AdminStudio[]>([]);
  const [editing, setEditing] = useState<Partial<AdminStudio> | null>(null);
  const [districtFilter, setDistrictFilter] = useState<string>();
  const [form] = Form.useForm();
  const load = useCallback(() => adminApi.listStudios().then(setItems), []);
  useEffect(() => void load(), [load]);
  const visible = districtFilter
    ? items.filter((item) => item.districtId === districtFilter)
    : items;
  const open = (item?: AdminStudio) => {
    const value = item || {
      address: '',
      districtId: districtFilter || districts[0]?.id,
      name: '',
      status: 'active' as Status,
    };
    setEditing(value);
    form.setFieldsValue(value);
  };
  const persist = async (values: Omit<AdminStudio, 'id'>) => {
    await adminApi.saveStudio({ ...values, id: editing?.id });
    message.success('舞室已保存');
    setEditing(null);
    await load();
    await onChanged();
  };
  const save = async () => {
    const values = await form.validateFields();
    const normalized = normalizeStudioName(values.name);
    const peers = items.filter(
      (item) => item.id !== editing?.id && item.districtId === values.districtId,
    );
    if (peers.some((item) => normalizeStudioName(item.name) === normalized)) {
      message.error('同一行政区已存在标准化名称完全相同的舞室');
      return;
    }
    const similar = peers.filter((item) => {
      const candidate = normalizeStudioName(item.name);
      return candidate.includes(normalized) || normalized.includes(candidate);
    });
    if (similar.length > 0) {
      Modal.confirm({
        title: '发现相似舞室名称',
        content: `可能重复：${similar.map((item) => item.name).join('、')}。确认仍要保存吗？`,
        onOk: () => persist(values),
      });
      return;
    }
    await persist(values);
  };
  return (
    <Card title='舞室管理' extra={<Button onClick={() => open()}>新增舞室</Button>}>
      <Select
        showSearch
        allowClear
        optionFilterProp='label'
        placeholder='按行政区筛选'
        value={districtFilter}
        onChange={setDistrictFilter}
        options={districts.map((item) => ({ value: item.id, label: item.name }))}
        className='panel-filter'
      />
      <Table
        rowKey='id'
        pagination={{ pageSize: 20 }}
        dataSource={visible}
        columns={[
          { title: '舞室', dataIndex: 'name' },
          {
            title: '行政区',
            dataIndex: 'districtId',
            render: (id) => districts.find((item) => item.id === id)?.name || id,
          },
          { title: '地址', dataIndex: 'address' },
          { title: '状态', dataIndex: 'status', render: statusTag },
          { title: '操作', render: (_, item) => <Button onClick={() => open(item)}>编辑</Button> },
        ]}
      />
      <Modal open={Boolean(editing)} title='保存舞室' onOk={save} onCancel={() => setEditing(null)}>
        <Form form={form} layout='vertical'>
          <Form.Item name='districtId' label='行政区' rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp='label'
              options={districts.map((item) => ({ value: item.id, label: item.name }))}
            />
          </Form.Item>
          <Form.Item name='name' label='舞室名称' rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name='address' label='地址'>
            <Input />
          </Form.Item>
          <Form.Item name='status' label='状态' rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'active', label: '启用' },
                { value: 'inactive', label: '停用（其次卡停止公开）' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

function CardsPanel({ studios }: { studios: AdminStudio[] }) {
  const [items, setItems] = useState<AdminDanceCard[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>();
  const [studioFilter, setStudioFilter] = useState<string>();
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [target, setTarget] = useState<{ action: 'delete' | 'hide'; card: AdminDanceCard } | null>(
    null,
  );
  const [reason, setReason] = useState('');
  const load = useCallback(() => adminApi.listCards().then(setItems), []);
  useEffect(() => void load(), [load]);
  const visible = items.filter((item) => {
    const status = item.deletedAt ? 'deleted' : item.hiddenReason ? 'hidden' : 'active';
    return (
      (!query || item.sellerNickname.includes(query) || item.userId.includes(query)) &&
      (!statusFilter || status === statusFilter) &&
      (!studioFilter || item.studioId === studioFilter) &&
      (!dateRange ||
        (item.createdAt.slice(0, 10) >= dateRange[0] &&
          item.createdAt.slice(0, 10) <= dateRange[1]))
    );
  });
  const moderate = async () => {
    if (!target || !reason.trim()) return;
    await adminApi.moderateCard(target.card.id, target.action, reason);
    message.success('次卡已处理并记录审计日志');
    setTarget(null);
    setReason('');
    await load();
  };
  return (
    <Card title='次卡内容管理'>
      <Space wrap className='panel-filters'>
        <Input.Search
          allowClear
          placeholder='搜索昵称或用户 ID'
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Select
          allowClear
          placeholder='状态'
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'active', label: '公开' },
            { value: 'hidden', label: '隐藏' },
            { value: 'deleted', label: '已删除' },
          ]}
        />
        <Select
          showSearch
          allowClear
          optionFilterProp='label'
          placeholder='舞室'
          value={studioFilter}
          onChange={setStudioFilter}
          options={studios.map((item) => ({ value: item.id, label: item.name }))}
        />
        <DatePicker.RangePicker
          onChange={(_, dateStrings) =>
            setDateRange(dateStrings[0] && dateStrings[1] ? [dateStrings[0], dateStrings[1]] : null)
          }
        />
      </Space>
      <Table
        rowKey='id'
        pagination={{ pageSize: 20 }}
        dataSource={visible}
        columns={[
          { title: '卖家', dataIndex: 'sellerNickname' },
          {
            title: '舞室',
            dataIndex: 'studioId',
            render: (id) => studios.find((item) => item.id === id)?.name || '已停用舞室',
          },
          { title: '课时', dataIndex: 'remainingCount' },
          { title: '单价', dataIndex: 'pricePerClass', render: (value) => `¥${value}` },
          { title: '截止日', dataIndex: 'expireDate' },
          {
            title: '状态',
            render: (_, item) =>
              item.deletedAt ? (
                <Tag>已删除</Tag>
              ) : item.hiddenReason ? (
                <Tag color='orange'>{item.hiddenReason}</Tag>
              ) : (
                <Tag color='green'>公开</Tag>
              ),
          },
          {
            title: '操作',
            render: (_, item) => (
              <Space>
                <Button
                  disabled={Boolean(item.deletedAt)}
                  onClick={() => setTarget({ action: 'hide', card: item })}
                >
                  隐藏
                </Button>
                <Button
                  danger
                  disabled={Boolean(item.deletedAt)}
                  onClick={() => setTarget({ action: 'delete', card: item })}
                >
                  删除
                </Button>
              </Space>
            ),
          },
        ]}
      />
      <Modal
        open={Boolean(target)}
        title={target?.action === 'delete' ? '删除违规次卡' : '隐藏违规次卡'}
        onOk={moderate}
        okButtonProps={{ disabled: !reason.trim() }}
        onCancel={() => setTarget(null)}
      >
        <Input.TextArea
          rows={4}
          value={reason}
          placeholder='必须填写处理原因'
          onChange={(event) => setReason(event.target.value)}
        />
      </Modal>
    </Card>
  );
}

function UsersPanel() {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>();
  const load = useCallback(() => adminApi.listUsers().then(setItems), []);
  useEffect(() => void load(), [load]);
  const visible = items.filter(
    (item) =>
      (!query || item.id.includes(query) || item.defaultNickname?.includes(query)) &&
      (!statusFilter || item.status === statusFilter),
  );
  const change = async (item: AdminUser) => {
    const status = item.status === 'active' ? 'disabled' : 'active';
    await adminApi.setUserStatus(
      item.id,
      status,
      status === 'disabled' ? '管理员手动禁用' : '管理员手动恢复',
    );
    message.success('用户状态已更新');
    await load();
  };
  return (
    <Card title='用户管理'>
      <Space wrap className='panel-filters'>
        <Input.Search
          allowClear
          placeholder='搜索昵称或用户 ID'
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Select
          allowClear
          placeholder='状态'
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'active', label: '启用' },
            { value: 'disabled', label: '禁用' },
          ]}
        />
      </Space>
      <Table
        rowKey='id'
        pagination={{ pageSize: 20 }}
        dataSource={visible}
        columns={[
          { title: '昵称', dataIndex: 'defaultNickname', render: (value) => value || '未设置' },
          { title: '角色', dataIndex: 'role' },
          { title: '状态', dataIndex: 'status', render: statusTag },
          { title: '创建时间', dataIndex: 'createdAt' },
          {
            title: '操作',
            render: (_, item) =>
              item.role === 'admin' ? (
                <Tag>管理员</Tag>
              ) : (
                <Popconfirm
                  title={
                    item.status === 'active'
                      ? '禁用后其次卡立即停止公开，确认吗？'
                      : '确认恢复该用户吗？'
                  }
                  onConfirm={() => change(item)}
                >
                  <Button danger={item.status === 'active'}>
                    {item.status === 'active' ? '禁用' : '恢复'}
                  </Button>
                </Popconfirm>
              ),
          },
        ]}
      />
    </Card>
  );
}

function LogsPanel() {
  const [items, setItems] = useState<AdminActionLog[]>([]);
  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>();
  useEffect(() => void adminApi.listLogs().then(setItems), []);
  const actions = [...new Set(items.map((item) => item.action))];
  const visible = items.filter(
    (item) =>
      (!query ||
        item.actorUserId.includes(query) ||
        item.targetId.includes(query) ||
        item.targetType.includes(query)) &&
      (!actionFilter || item.action === actionFilter),
  );
  return (
    <Card title='只读审计日志'>
      <Space wrap className='panel-filters'>
        <Input.Search
          allowClear
          placeholder='搜索管理员、目标或类型'
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Select
          allowClear
          placeholder='动作'
          value={actionFilter}
          onChange={setActionFilter}
          options={actions.map((value) => ({ value, label: value }))}
        />
      </Space>
      <Table
        rowKey='id'
        pagination={{ pageSize: 20 }}
        dataSource={visible}
        columns={[
          { title: '时间', dataIndex: 'createdAt' },
          { title: '管理员', dataIndex: 'actorUserId' },
          { title: '动作', dataIndex: 'action' },
          { title: '目标类型', dataIndex: 'targetType' },
          { title: '目标 ID', dataIndex: 'targetId' },
          { title: '原因', dataIndex: 'reason' },
        ]}
      />
    </Card>
  );
}

export function AdminDashboard({
  profile,
  onSignedOut,
}: {
  profile: SellerProfile;
  onSignedOut(): void;
}) {
  const [cities, setCities] = useState<AdminCity[]>([]);
  const [districts, setDistricts] = useState<AdminDistrict[]>([]);
  const [studios, setStudios] = useState<AdminStudio[]>([]);
  const refreshReferenceData = useCallback(async () => {
    const [nextCities, nextDistricts, nextStudios] = await Promise.all([
      adminApi.listCities(),
      adminApi.listDistricts(),
      adminApi.listStudios(),
    ]);
    setCities(nextCities);
    setDistricts(nextDistricts);
    setStudios(nextStudios);
  }, []);
  useEffect(() => {
    void Promise.resolve().then(refreshReferenceData);
  }, [refreshReferenceData]);
  const tabs = useMemo(
    () => [
      {
        key: 'cities',
        label: '城市',
        children: <CitiesPanel onChanged={refreshReferenceData} />,
      },
      {
        key: 'districts',
        label: '行政区',
        children: <DistrictsPanel cities={cities} onChanged={refreshReferenceData} />,
      },
      {
        key: 'studios',
        label: '舞室',
        children: <StudiosPanel districts={districts} onChanged={refreshReferenceData} />,
      },
      { key: 'cards', label: '次卡内容', children: <CardsPanel studios={studios} /> },
      { key: 'users', label: '用户', children: <UsersPanel /> },
      { key: 'logs', label: '审计日志', children: <LogsPanel /> },
    ],
    [cities, districts, refreshReferenceData, studios],
  );
  return (
    <Layout className='admin-shell'>
      <Layout.Header className='admin-header'>
        <Typography.Title level={3} className='admin-title'>
          DanceCARD 管理后台
        </Typography.Title>
        <Space>
          <Typography.Text className='admin-identity'>
            管理员 {profile.id.slice(0, 8)}
          </Typography.Text>
          <Button
            onClick={async () => {
              await authApi.signOut();
              onSignedOut();
            }}
          >
            退出
          </Button>
        </Space>
      </Layout.Header>
      <Layout.Content className='admin-shell__content'>
        <Alert
          showIcon
          type='info'
          title='停用城市、行政区、舞室或用户后，关联次卡立即停止公开，但数据不会自动删除。'
        />
        <Tabs items={tabs} className='admin-tabs' />
      </Layout.Content>
    </Layout>
  );
}
