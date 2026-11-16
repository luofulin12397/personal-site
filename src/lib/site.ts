// Internal links must follow Vite's base.
// GitHub Pages serves this repo at /personal-site/, Vercel at /.
// Hardcoded '/' would escape the site on Pages.
export const BASE = import.meta.env.BASE_URL;

export function site(path = ''): string {
  return BASE + path.replace(/^\/+/, '');
}

export const HOME_URL = site();
export const CASE_URL = site('projects/rag/');
