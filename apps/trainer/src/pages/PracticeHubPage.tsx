import { Link } from "../ui/Link";

const ITEMS = [
  { to: "/practice/free", title: "自由训练", body: "按难度随机抽题，可换一批。" },
  { to: "/review", title: "到期复习", body: "按间隔重复巩固到期知识点。" },
  { to: "/mixed", title: "薄弱加权", body: "按答错次数与反应时加权抽题。" },
  { to: "/texts", title: "自定义文本", body: "粘贴自己的句子，用输入法练习。" },
  { to: "/compare", title: "全拼 / 小鹤对比", body: "同一段文本各测一次，看提升比。" },
  { to: "/keyboard", title: "键位映射", body: "26 键、共享韵母与十二个零声母。" },
];

export function PracticeHubPage() {
  return (
    <>
      <header className="page-head">
        <p className="eyebrow">练习</p>
        <h1 className="page-title">今天想练什么</h1>
        <p className="lede">自由训练、到期复习、薄弱加权、自定义文本与测速对比都从这里进入。</p>
      </header>

      <div className="entry-grid">
        {ITEMS.map((item) => (
          <Link key={item.to} to={item.to} className="entry-card">
            <strong>{item.title}</strong>
            <span>{item.body}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
