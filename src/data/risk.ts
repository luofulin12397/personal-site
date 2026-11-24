export const RISK_REPO = 'https://github.com/luofulin12397/AI_RISK_HEALTH';
const SOURCE = `${RISK_REPO}/blob/9df57a1194b6461f7642a5102e5f198c0ce56dd2`;

export const RISK_NODES = [
  { id: 'request', title: '医保结算请求', tag: '校验与补全', row: 1, col: 2,
    detail: '先校验请求关联的业务实体，再补全订单、医疗机构和医生标识。这里用医保结算说明同一套引擎怎样处理一次风险检查。',
    href: `${SOURCE}/app/service/event.py#L43-L58` },
  { id: 'blacklist', title: '黑名单检查', tag: '入口拦截', row: 2, col: 2,
    detail: '检查用户、医保卡、身份证、医疗机构编码与执业证。命中直接返回；未命中才进入常规决策引擎。',
    href: `${SOURCE}/app/service/event.py#L100-L126` },
  { id: 'blocked', title: '直接拒绝', tag: '命中黑名单', row: 2, col: 3,
    detail: '入口直接构造拒绝响应，不走后面的事件、特征、评估或案件写入。它和引擎给出的「自动拒绝」不是同一条路径。',
    href: `${SOURCE}/app/service/event.py#L100-L150` },
  { id: 'features', title: '提取并保存特征', tag: '未命中黑名单', row: 3, col: 2,
    detail: '创建事件，计算特征并保存当时的快照，再进入规则匹配与模型评分。评估和快照属于同一次常规检查。',
    href: `${SOURCE}/app/engine/decision.py#L548-L584` },
  { id: 'rules', title: '规则打分', tag: '规则分与硬否决', row: 4, col: 1,
    detail: '规则分取命中项的最高分并加叠加分，最终封顶。命中极高风险规则产生硬否决信号，不能被模型低分抵消。',
    href: `${SOURCE}/app/engine/decision.py#L83-L105` },
  { id: 'model', title: 'XGBoost 评分', tag: '模型拒绝概率', row: 4, col: 3,
    detail: '模型未加载时只用规则分；已加载但推理失败时，目前返回零分并仍标为已加载。若没触发审核豁免或硬否决，零分仍可能参与融合并拉低结果。',
    href: `${SOURCE}/app/engine/ml_model.py#L126-L138` },
  { id: 'decision', title: '双轨决策', tag: '融合后执行硬否决', row: 5, col: 2,
    detail: '满足条件时，把模型概率变换成风险分，再与规则分加权。按事件类型阈值区分通过、标记、人工审核和拒绝。启用审核豁免且命中相关规则时不融合；命中硬否决则无论融合结果如何，都强制拒绝。',
    href: `${SOURCE}/app/engine/decision.py#L265-L339` },
  { id: 'persist', title: '保存评估与画像', tag: '常规检查统一提交', row: 6, col: 2,
    detail: '保存评估结果，按决策处理案件，更新用户画像，最后统一提交并返回。通过或标记不会创建案件。',
    href: `${SOURCE}/app/engine/decision.py#L570-L586` },
  { id: 'auto-reject', title: '自动拒绝', tag: '拒绝结果 / 不待审', row: 7, col: 1,
    detail: '引擎拒绝（含硬否决）在没有同业务单、同事件类型的未结案记录时创建已拒绝的案件，并记录系统审计，不进入待审队列。',
    href: `${SOURCE}/app/engine/decision.py#L382-L456` },
  { id: 'complete', title: '返回检查结果', tag: '通过或标记 / 不建案', row: 7, col: 2,
    detail: '通过或标记的常规检查仍保存评估，但不会建立案件；客户端直接收到检查结果。',
    href: `${SOURCE}/app/engine/decision.py#L382-L410` },
  { id: 'review', title: '人工审核', tag: '审核结果 / 待审核', row: 7, col: 3,
    detail: '若没有同一业务的未结案记录，人工审核决策创建待审核案件。后续审核受状态流转约束；案件更新、操作日志和拒绝时可选的加黑在同一事务提交。',
    href: `${SOURCE}/app/service/case.py#L332-L381`,
    related: `${SOURCE}/app/engine/decision.py#L382-L426` },
] as const;

export const RISK_EVIDENCE = {
  veto: `${SOURCE}/app/engine/decision.py#L294-L337`,
  modelFailure: `${SOURCE}/app/engine/ml_model.py#L126-L138`,
  boundary: `${SOURCE}/README.md#1-项目简介`,
};

export const VETO_EXCERPT = `if ml_fused:
    final_score = int(round(
        settings.ML_WEIGHT_RULE * rule_score
        + settings.ML_WEIGHT_XGB * ml_score_100
    ))
    final_score = max(0, min(100, final_score))
else:
    final_score = rule_score

risk_level = _score_to_level(final_score, event_type)
decision = _score_to_decision(final_score, event_type)

if has_veto:
    decision = "拒绝"
    risk_level = "极高"
    final_score = max(final_score, settings.RISK_VETO_MIN_SCORE)`;
