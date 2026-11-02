import type { ReactNode } from "react";
import { Link } from "../ui/Link";

type PlannedPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  points: string[];
  children?: ReactNode;
};

export function PlannedPage({ eyebrow, title, intro, points, children }: PlannedPageProps) {
  return (
    <section className="panel">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="page-title">{title}</h1>
      <p className="lede">{intro}</p>
      <ul className="plan-list">
        {points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      {children}
      <div className="actions">
        <Link to="/practice" className="secondary">
          先去自由训练
        </Link>
      </div>
    </section>
  );
}
