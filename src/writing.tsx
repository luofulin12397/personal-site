import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/shell.css';
import './styles/home.css';
import './styles/writing.css';
import Writing from './pages/Writing';
import ArticlePage from './pages/Article';
import { findArticle } from './data/writing';

/* 03 文章的单一入口：?p=slug 有值就渲染详情，否则渲染目录。
   静态托管没有服务端，标题与 description 只能在前端补。 */
const slug = new URLSearchParams(window.location.search).get('p');
const article = findArticle(slug);

if (article) {
  document.title = `${article.title} — 罗富麟`;
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute('content', article.lede);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>{article ? <ArticlePage article={article} /> : <Writing />}</StrictMode>,
);
