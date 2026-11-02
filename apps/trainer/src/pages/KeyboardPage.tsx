import { KeyboardMap } from "../ui/KeyboardMap";

export function KeyboardPage() {
  return (
    <>
      <header className="page-head">
        <p className="eyebrow">键位</p>
        <h1 className="page-title">一张图看懂小鹤双拼</h1>
        <p className="lede">声母与韵母共用 26 个字母键；共享键位要结合完整音节判断，不能反向唯一还原。</p>
      </header>
      <KeyboardMap />
    </>
  );
}
