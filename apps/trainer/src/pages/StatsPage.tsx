import { PlannedPage } from "./PlannedPage";

export function StatsPage() {
  return (
    <PlannedPage
      eyebrow="S3 计划"
      title="学习统计"
      intro="目前还没有真实学习数据。为避免用假图表误导，这一页只说明之后会提供什么。"
      points={[
        "每日计划：到期复习优先，再安排新知与混合训练",
        "错题本：按规则级与题目级记录错误原因",
        "键位热力图：直接跳转到薄弱键位的专项练习",
        "CPM、正确率与练习时长曲线，全部来自真实作答事件",
      ]}
    />
  );
}
