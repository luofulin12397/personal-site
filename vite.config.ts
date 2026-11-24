import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// 两层各一个 HTML 入口。base 由 VITE_BASE 注入。
// 传不带斜杠的仓库名（VITE_BASE=personal-site）即可适配 Pages 项目站；
// 不传则是 '/'，对应 Vercel / 自定义域名。不传带斜杠的值，
// 因为 Git Bash 的 MSYS 会把 /xxx/ 误转换成 Windows 绝对路径。
const raw = process.env.VITE_BASE || '/';
const base = raw.startsWith('/') ? raw : `/${raw}/`;

export default defineConfig({
  base,
  plugins: [react()],
  appType: 'mpa',
  build: {
    rollupOptions: {
      input: {
        home: resolve(process.cwd(), 'index.html'),
        case: resolve(process.cwd(), 'projects/rag/index.html'),
        writing: resolve(process.cwd(), 'writing/index.html'),
      },
    },
  },
});
