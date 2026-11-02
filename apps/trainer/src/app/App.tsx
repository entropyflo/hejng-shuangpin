import { useRoute } from "./router";
import { PreferencesProvider } from "./preferences";
import { ThemeProvider } from "./theme-context";
import { ComparePage } from "../pages/ComparePage";
import { CoursePage } from "../pages/CoursePage";
import { HomePage } from "../pages/HomePage";
import { KeyboardPage } from "../pages/KeyboardPage";
import { LessonPage } from "../pages/LessonPage";
import { MixedPage } from "../pages/MixedPage";
import { PracticeHubPage } from "../pages/PracticeHubPage";
import { PracticePage } from "../pages/PracticePage";
import { ReviewPage } from "../pages/ReviewPage";
import { SettingsPage } from "../pages/SettingsPage";
import { StatsPage } from "../pages/StatsPage";
import { TextsPage } from "../pages/TextsPage";
import { Layout } from "../ui/Layout";
import { Link } from "../ui/Link";

function NotFoundPage({ path }: { path: string }) {
  return (
    <section className="panel">
      <p className="eyebrow">404</p>
      <h1 className="page-title">没有这个页面</h1>
      <p className="lede">
        路径 <code>{path}</code> 不存在，可能是旧链接。
      </p>
      <div className="actions">
        <Link to="/home" className="primary">
          回到首页
        </Link>
      </div>
    </section>
  );
}

function RoutedApp() {
  const route = useRoute();

  return (
    <Layout>
      {route.name === "home" ? <HomePage /> : null}
      {route.name === "course" ? <CoursePage /> : null}
      {route.name === "lesson" ? <LessonPage lessonId={route.lessonId} /> : null}
      {route.name === "review" ? <ReviewPage /> : null}
      {route.name === "practice" ? <PracticeHubPage /> : null}
      {route.name === "practiceFree" ? <PracticePage /> : null}
      {route.name === "practiceKey" ? <PracticePage focusKey={route.key} /> : null}
      {route.name === "keyboard" ? <KeyboardPage /> : null}
      {route.name === "stats" ? <StatsPage /> : null}
      {route.name === "compare" ? <ComparePage /> : null}
      {route.name === "settings" ? <SettingsPage /> : null}
      {route.name === "texts" ? <TextsPage /> : null}
      {route.name === "mixed" ? <MixedPage /> : null}
      {route.name === "notFound" ? <NotFoundPage path={route.path} /> : null}
    </Layout>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <PreferencesProvider>
        <RoutedApp />
      </PreferencesProvider>
    </ThemeProvider>
  );
}
