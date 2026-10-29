import { writeFile } from 'node:fs/promises';
import { Senku } from '@senku/api';
import { logoSvg, tokens } from '@senku/brand';

const who = process.argv[2] ?? 'kage';
const out = process.argv[3] ?? `senku-${who}.svg`;
const senku = new Senku();

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const fmt = (n) => new Intl.NumberFormat('ru-RU').format(n);

const user = await senku.users.get(who);
const stats = await senku.users.stats(user.id);
const s = stats.stats;
const genres = stats.genres.slice(0, 3).map((g) => g.genre_name);
const c = tokens.color;

const cells = [
  ['Часов', fmt(s.watch_hours)],
  ['Серий', fmt(s.episodes)],
  ['Тайтлов', fmt(s.unique_anime_watched ?? s.anime_watched)],
  ['Дней подряд', fmt(s.streak_days)],
];

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="495" height="195" viewBox="0 0 495 195">
  <rect width="495" height="195" rx="18" fill="${c.background}"/>
  <g transform="translate(24 22)">${logoSvg({ size: 28, color: c.red }).replace('<svg ', '<svg x="0" y="0" ')}</g>
  <text x="62" y="43" fill="${c.text}" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="700">${esc(user.username)}</text>
  <text x="471" y="43" fill="${c.muted}" font-family="Segoe UI, Arial, sans-serif" font-size="13" text-anchor="end">Уровень ${stats.level}</text>
  <rect x="24" y="58" width="447" height="6" rx="3" fill="${c.surface2}"/>
  <rect x="24" y="58" width="${Math.max(6, (447 * stats.exp.percentage) / 100).toFixed(1)}" height="6" rx="3" fill="${c.red}"/>
  ${cells
    .map(
      ([label, value], i) => `
  <text x="${24 + i * 115}" y="108" fill="${c.text}" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="700">${value}</text>
  <text x="${24 + i * 115}" y="128" fill="${c.muted}" font-family="Segoe UI, Arial, sans-serif" font-size="12">${label}</text>`,
    )
    .join('')}
  <text x="24" y="168" fill="${c.muted}" font-family="Segoe UI, Arial, sans-serif" font-size="12">Любимое: <tspan fill="${c.text}">${esc(genres.join(' · ') || '—')}</tspan></text>
  <text x="471" y="168" fill="${c.muted}" font-family="Segoe UI, Arial, sans-serif" font-size="12" text-anchor="end">senku.one</text>
</svg>
`;

await writeFile(out, svg);
console.log(`Карточка ${user.username} сохранена в ${out}`);
