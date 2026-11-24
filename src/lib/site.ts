// Internal links must follow Vite's base.
// GitHub Pages serves this repo at /personal-site/, Vercel at /.
// Hardcoded '/' would escape the site on Pages.
export const BASE = import.meta.env.BASE_URL;

export function site(path = ''): string {
  return BASE + path.replace(/^\/+/, '');
}

export const HOME_URL = site();
export const CASE_URL = site('projects/rag/');
export const PROJECTS_URL = site('projects/');
export const RISK_CASE_URL = site('projects/ai-risk-health/');

/* 03 文章：列表页是目录，详情靠 ?p=slug 取。
   Pages 是静态托管、没有 SPA 回退，所以不用 /writing/slug 这种深路径：
   列表与详情共用同一个 HTML 入口，链接永远指向真实存在的文件。 */
export const WRITING_URL = site('writing/');

export function articleUrl(slug: string): string {
  return `${WRITING_URL}?p=${encodeURIComponent(slug)}`;
}
