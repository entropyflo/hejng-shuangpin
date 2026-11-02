import { PlannedPage } from "./PlannedPage";

export function ComparePage() {
  return (
    <PlannedPage
      eyebrow="S3 计划"
      title="全拼 / 小鹤对比"
      intro="对比需要真实测速记录。当前没有数据，因此不展示任何推测曲线。"
      points={[
        "同一文本、同一判定规则下分别记录全拼与小鹤的 CPM",
        "按输入法类型记录，历史曲线与提升比可回看",
        "错误与修正次数单独统计，不混入 CPM 分子",
        "只在样本足够时给出对比结论",
      ]}
    />
  );
}
