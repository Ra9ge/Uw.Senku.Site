import { Senku } from '@senku/api';

const senku = new Senku({ cacheTtlMs: 60_000 });
const { items } = await senku.schedule();

const now = Date.now();
const day = 24 * 60 * 60 * 1000;
const soon = items
  .map((i) => ({ ...i, time: Date.parse(i.at) }))
  .filter((i) => i.time >= now - day && i.time <= now + day)
  .sort((a, b) => a.time - b.time);

const when = new Intl.DateTimeFormat('ru-RU', { weekday: 'short', hour: '2-digit', minute: '2-digit' });

console.log(`Серии за сутки вокруг сейчас: ${soon.length}\n`);
for (const i of soon) {
  const mark = i.time <= now ? 'вышла ' : 'выйдет';
  console.log(`${mark}  ${when.format(i.time).padEnd(12)}  ${i.title} — ${i.episode} серия  https://senku.one/watch/${i.id}/${i.episode}`);
}
