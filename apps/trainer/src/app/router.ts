import { useMemo, useSyncExternalStore } from "react";

export type Route =
  | { name: "home" }
  | { name: "course" }
  | { name: "lesson"; lessonId: string }
  | { name: "practice" }
  | { name: "keyboard" }
  | { name: "stats" }
  | { name: "compare" }
  | { name: "settings" }
  | { name: "notFound"; path: string };

const LESSON_PATTERN = /^\/lesson\/([A-Za-z0-9-]+)$/u;
const NAVIGATE_EVENT = "xiaohe:navigate";

export function parseRoute(pathname: string): Route {
  const path = pathname.replace(/\/+$/u, "") || "/";

  if (path === "/" || path === "/home") return { name: "home" };
  if (path === "/course") return { name: "course" };

  const lesson = LESSON_PATTERN.exec(path);
  if (lesson) return { name: "lesson", lessonId: lesson[1] };

  if (path === "/practice") return { name: "practice" };
  if (path === "/keyboard") return { name: "keyboard" };
  if (path === "/stats") return { name: "stats" };
  if (path === "/compare") return { name: "compare" };
  if (path === "/settings") return { name: "settings" };

  return { name: "notFound", path };
}

export function pathFor(route: Route): string {
  switch (route.name) {
    case "home":
      return "/home";
    case "course":
      return "/course";
    case "lesson":
      return `/lesson/${route.lessonId}`;
    case "practice":
      return "/practice";
    case "keyboard":
      return "/keyboard";
    case "stats":
      return "/stats";
    case "compare":
      return "/compare";
    case "settings":
      return "/settings";
    case "notFound":
      return route.path;
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("popstate", onChange);
  window.addEventListener(NAVIGATE_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(NAVIGATE_EVENT, onChange);
  };
}

export function navigate(path: string, options: { replace?: boolean } = {}): void {
  if (path === window.location.pathname) return;
  if (options.replace) {
    window.history.replaceState(null, "", path);
  } else {
    window.history.pushState(null, "", path);
  }
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
  window.scrollTo({ top: 0, behavior: "auto" });
}

export function useRoute(): Route {
  const pathname = useSyncExternalStore(
    subscribe,
    () => window.location.pathname,
    () => "/home",
  );
  return useMemo(() => parseRoute(pathname), [pathname]);
}

export const NAV_ITEMS: ReadonlyArray<{ route: Route["name"]; label: string; path: string }> = [
  { route: "home", label: "首页", path: "/home" },
  { route: "course", label: "课程", path: "/course" },
  { route: "practice", label: "自由训练", path: "/practice" },
  { route: "keyboard", label: "键位", path: "/keyboard" },
  { route: "stats", label: "统计", path: "/stats" },
  { route: "compare", label: "对比", path: "/compare" },
  { route: "settings", label: "设置", path: "/settings" },
];
