import { Text, View } from '@tarojs/components';
import { Hero } from '../../components/hero';
import { PageShell } from '../../components/page-shell';

const FAQS = [
  ['DanceCARD 是什么？', '面向舞蹈爱好者的次卡信息交换工具，只提供信息展示和联系方式连接。'],
  ['怎么买次卡？', '依次选择城市、行政区和舞室，查看次卡详情后复制卖家微信，双方自行线下沟通。'],
  [
    '怎么发布次卡？',
    '进入目标舞室后点击“添加次卡”，手机号登录并填写次卡信息。发布入口不在一级菜单。',
  ],
  [
    '找不到舞室怎么办？',
    '发送邮件至 m18800126467@163.com，提供舞室中英文名、城市、行政区及大众点评或地图截图。',
  ],
  ['平台会收款或担保吗？', '不会。平台不提供支付、托管、担保、核销、聊天或纠纷处理。'],
  [
    '信息一定真实吗？',
    '不一定。平台无法验证用户和次卡信息的真实性，请先确认舞室转卡规则并谨慎交易。',
  ],
  [
    '次卡过期后会怎样？',
    '截止日期当天 23:59 前仍有效；之后系统会停止公开展示，但不会自动删除后台记录。',
  ],
];

export default function FaqPage() {
  return (
    <PageShell activeTab='faq'>
      <Hero eyebrow='需要帮助？' title='常见问题' />
      <View className='faq-list'>
        {FAQS.map(([question, answer]) => (
          <View className='faq-item' key={question}>
            <Text className='faq-item__question'>{question}</Text>
            <Text className='faq-item__answer'>{answer}</Text>
          </View>
        ))}
      </View>
      <View className='notice'>
        完整免责声明：平台无法验证任何用户信息的真实性和可靠性。诈骗有可能发生，请谨慎使用。平台不参与交易、不处理付款、不提供担保，也不对基于本平台发生的任何交易负责。
      </View>
    </PageShell>
  );
}
