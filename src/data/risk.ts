export const RISK_REPO = 'https://github.com/luofulin12397/AI_RISK_HEALTH';
const SOURCE = `${RISK_REPO}/blob/9df57a1194b6461f7642a5102e5f198c0ce56dd2`;

export const RISK_FLOW = [
  { title: '校验业务实体，补全请求', detail: '先校验请求引用的业务实体，再补齐订单、医疗机构和医生标识，为黑名单检查准备上下文。', href: `${SOURCE}/app/service/event.py#L43-L58` },
  { title: '黑名单提前返回', detail: '检查用户、医保卡、身份证、医疗机构编码和执业证。命中时直接返回拒绝，不进入常规评估流水线。', href: `${SOURCE}/app/service/event.py#L100-L138` },
  { title: '保存特征快照，再算决策', detail: '建事件、提取特征并保存快照，再匹配规则和运行评分。按事件类型把最终分数映射为通过、标记、人工审核或拒绝。', href: `${SOURCE}/app/engine/decision.py#L548-L574` },
  { title: '写评估与案件，统一提交', detail: '保存评估结果，按决策和规则创建案件，更新用户画像，最后统一提交并构造响应。', href: `${SOURCE}/app/engine/decision.py#L573-L586` },
];

export const RISK_DECISIONS = [
  { title: '模型可以改分，不能推翻否决', detail: '满足融合条件时，先把 XGBoost 的拒绝概率变换到风险分，再与规则分加权。一旦命中极高风险规则，融合之后仍强制拒绝；启用人工审核豁免且命中相应规则时，模型分只作参考。代价是规则配置错误时，模型也无法纠正硬否决。', href: `${SOURCE}/app/engine/decision.py#L265-L339` },
  { title: '把人工审核当作有约束的状态流转', detail: '审核前检查原状态是否允许到达目标状态。更新案件、记操作日志，以及拒绝时可选的加黑动作，在同一个事务提交。这样可以避免只改了案件、却没写入相应记录的半完成状态。', href: `${SOURCE}/app/service/case.py#L332-L381` },
  { title: '模型未加载和推理失败，不是同一条回退路径', detail: '模型未加载时，决策回到规则分。但已加载的模型推理抛错时，当前实现返回零分且仍标记为已加载；如果没有触发审核豁免或硬否决，零分可能参与融合并拉低最终分。', href: `${SOURCE}/app/engine/ml_model.py#L126-L138` },
];
