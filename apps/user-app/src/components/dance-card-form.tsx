import {
  getPortableShanghaiDate,
  type PortableDanceCardEditData,
  validatePortableDanceCardEdit,
} from '@dancecard/validation/portable';
import {
  Button,
  Checkbox,
  CheckboxGroup,
  Form,
  Input,
  Label,
  Picker,
  Text,
  Textarea,
  View,
} from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';

const DANCE_OPTIONS = [
  ['hip-hop', 'Hip-hop'],
  ['jazz', 'Jazz'],
  ['locking', 'Locking'],
  ['popping', 'Popping'],
  ['house', 'House'],
  ['waacking', 'Waacking'],
  ['k-pop', 'K-pop'],
  ['other', '其他'],
] as const;

export interface DanceCardFormInitialValues {
  danceScope?: 'all' | 'specified';
  danceTypeOther?: string | null;
  danceTypes?: string[];
  description?: string | null;
  expireDate?: string;
  pricePerClass?: string;
  remainingCount?: string;
  sellerNickname?: string;
  usageRestrictions?: string | null;
  wechatId?: string;
}

interface DanceCardFormProps {
  initialValues?: DanceCardFormInitialValues;
  onSubmit(values: PortableDanceCardEditData): Promise<void>;
  studioName: string;
  submitLabel: string;
}

type FieldErrors = Record<string, string>;
type SubmitPhase = 'checking' | 'idle' | 'saving';

async function showSubmitError(message: string) {
  try {
    await Taro.showModal({
      title: '无法提交',
      content: message,
      showCancel: false,
    });
  } catch {
    // Inline field errors remain visible if the platform dialog cannot open.
  }
}

export function DanceCardForm({
  initialValues = {},
  onSubmit,
  studioName,
  submitLabel,
}: DanceCardFormProps) {
  const [nickname, setNickname] = useState(initialValues.sellerNickname || '');
  const [wechatId, setWechatId] = useState(initialValues.wechatId || '');
  const [remainingCount, setRemainingCount] = useState(initialValues.remainingCount || '');
  const [price, setPrice] = useState(initialValues.pricePerClass || '');
  const [expireDate, setExpireDate] = useState(
    initialValues.expireDate || getPortableShanghaiDate(),
  );
  const [danceScope, setDanceScope] = useState<'all' | 'specified'>(
    initialValues.danceScope || 'all',
  );
  const [danceTypes, setDanceTypes] = useState<string[]>(initialValues.danceTypes || []);
  const [danceTypeOther, setDanceTypeOther] = useState(initialValues.danceTypeOther || '');
  const [usageRestrictions, setUsageRestrictions] = useState(initialValues.usageRestrictions || '');
  const [description, setDescription] = useState(initialValues.description || '');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitPhase, setSubmitPhase] = useState<SubmitPhase>('idle');
  const submitting = submitPhase !== 'idle';

  const chooseScope = (scope: 'all' | 'specified') => {
    setDanceScope(scope);
    if (scope === 'all') {
      setDanceTypes([]);
      setDanceTypeOther('');
    }
  };

  const submit = async () => {
    if (submitting) return;

    let stage = '表单校验';
    setSubmitPhase('checking');
    try {
      const result = validatePortableDanceCardEdit({
        danceScope,
        danceTypeOther: danceTypeOther || null,
        danceTypes,
        description,
        expireDate,
        pricePerClass: price,
        remainingCount,
        sellerNickname: nickname,
        usageRestrictions,
        wechatId,
      });
      if (!result.success) {
        const nextErrors: FieldErrors = {};
        for (const issue of result.issues) {
          const field = String(issue.path[0] || 'form');
          nextErrors[field] ||= issue.message;
        }
        setErrors(nextErrors);
        await showSubmitError(result.issues[0]?.message || '请检查表单内容');
        return;
      }

      setErrors({});
      stage = '数据库写入';
      setSubmitPhase('saving');
      await onSubmit(result.data);
    } catch (reason) {
      console.error(`[DanceCARD] ${stage}失败`, reason);
      const detail = reason instanceof Error ? reason.message : '保存失败，请稍后重试';
      const message = `${stage}失败：${detail}`;
      setErrors({ form: message });
      await showSubmitError(message);
    } finally {
      setSubmitPhase('idle');
    }
  };

  return (
    <Form className='content-card form-card' onSubmit={() => void submit()}>
      <Text className='field-label'>舞室</Text>
      <View className='readonly-field'>{studioName}</View>

      <Text className='field-label field-label--spaced'>卖家昵称</Text>
      <Input
        className='field-input'
        maxlength={30}
        placeholder='1–30 个字符'
        value={nickname}
        onInput={(event) => setNickname(event.detail.value)}
      />
      {errors.sellerNickname ? <Text className='field-error'>{errors.sellerNickname}</Text> : null}

      <Text className='field-label field-label--spaced'>微信号</Text>
      <Input
        className='field-input'
        maxlength={50}
        placeholder='1–50 个字符'
        value={wechatId}
        onInput={(event) => setWechatId(event.detail.value)}
      />
      {errors.wechatId ? <Text className='field-error'>{errors.wechatId}</Text> : null}

      <Text className='field-label field-label--spaced'>剩余课时</Text>
      <Input
        className='field-input'
        placeholder='1–999'
        type='number'
        value={remainingCount}
        onInput={(event) => setRemainingCount(event.detail.value)}
      />
      {errors.remainingCount ? <Text className='field-error'>{errors.remainingCount}</Text> : null}

      <Text className='field-label field-label--spaced'>单节价格（人民币）</Text>
      <Input
        className='field-input'
        placeholder='最多两位小数'
        type='digit'
        value={price}
        onInput={(event) => setPrice(event.detail.value)}
      />
      {errors.pricePerClass ? <Text className='field-error'>{errors.pricePerClass}</Text> : null}

      <Text className='field-label field-label--spaced'>使用截止日期</Text>
      <Picker
        end='2099-12-31'
        mode='date'
        start={getPortableShanghaiDate()}
        value={expireDate}
        onChange={(event) => setExpireDate(String(event.detail.value))}
      >
        <View className='field-input field-input--picker'>{expireDate}</View>
      </Picker>
      {errors.expireDate ? <Text className='field-error'>{errors.expireDate}</Text> : null}

      <Text className='field-label field-label--spaced'>可用舞种</Text>
      <View className='segmented-control'>
        <Button
          className={danceScope === 'all' ? 'segment segment--active' : 'segment'}
          onClick={() => chooseScope('all')}
        >
          全部舞种
        </Button>
        <Button
          className={danceScope === 'specified' ? 'segment segment--active' : 'segment'}
          onClick={() => chooseScope('specified')}
        >
          指定舞种
        </Button>
      </View>
      {danceScope === 'specified' ? (
        <CheckboxGroup
          className='dance-options'
          onChange={(event) => setDanceTypes(event.detail.value)}
        >
          {DANCE_OPTIONS.map(([value, label]) => (
            <Label className='dance-option' key={value}>
              <Checkbox checked={danceTypes.includes(value)} value={value} />
              <Text>{label}</Text>
            </Label>
          ))}
        </CheckboxGroup>
      ) : null}
      {danceScope === 'specified' && danceTypes.includes('other') ? (
        <Input
          className='field-input'
          maxlength={80}
          placeholder='填写自定义舞种名称'
          value={danceTypeOther}
          onInput={(event) => setDanceTypeOther(event.detail.value)}
        />
      ) : null}
      {errors.danceTypes ? <Text className='field-error'>{errors.danceTypes}</Text> : null}
      {errors.danceTypeOther ? <Text className='field-error'>{errors.danceTypeOther}</Text> : null}

      <Text className='field-label field-label--spaced'>使用限制（选填）</Text>
      <Textarea
        className='field-textarea'
        maxlength={200}
        placeholder='最多 200 个字符'
        value={usageRestrictions}
        onInput={(event) => setUsageRestrictions(event.detail.value)}
      />
      {errors.usageRestrictions ? (
        <Text className='field-error'>{errors.usageRestrictions}</Text>
      ) : null}

      <Text className='field-label field-label--spaced'>备注（选填）</Text>
      <Textarea
        className='field-textarea'
        maxlength={500}
        placeholder='最多 500 个字符'
        value={description}
        onInput={(event) => setDescription(event.detail.value)}
      />
      {errors.description ? <Text className='field-error'>{errors.description}</Text> : null}
      {errors.form ? <Text className='field-error'>{errors.form}</Text> : null}

      <View className='notice'>
        提交即表示你理解：DanceCARD
        无法验证信息真实性，不参与付款、核销或纠纷处理，也不对线下交易承担责任。
      </View>
      <Button className='primary-button' disabled={submitting} formType='submit'>
        {submitPhase === 'checking'
          ? '正在检查…'
          : submitPhase === 'saving'
            ? '正在保存…'
            : submitLabel}
      </Button>
    </Form>
  );
}
