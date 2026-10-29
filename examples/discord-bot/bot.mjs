import { Client, EmbedBuilder, Events, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
import { Senku, SenkuError } from '@senku/api';

const token = process.env.DISCORD_TOKEN;
const appId = process.env.DISCORD_APP_ID;
if (!token || !appId) throw new Error('Set DISCORD_TOKEN and DISCORD_APP_ID');

const senku = new Senku({ cacheTtlMs: 5 * 60_000 });
const RED = 0xf04a4a;

const commands = [
  new SlashCommandBuilder()
    .setName('anime')
    .setDescription('Найти аниме на Senku')
    .addStringOption((o) => o.setName('название').setDescription('Как называется').setRequired(true)),
  new SlashCommandBuilder()
    .setName('senku')
    .setDescription('Профиль на Senku')
    .addStringOption((o) => o.setName('ник').setDescription('Ник или ссылка профиля').setRequired(true)),
];

await new REST().setToken(token).put(Routes.applicationCommands(appId), { body: commands.map((c) => c.toJSON()) });

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on(Events.InteractionCreate, async (i) => {
  if (!i.isChatInputCommand()) return;
  await i.deferReply();
  try {
    if (i.commandName === 'anime') {
      const { results } = await senku.search(i.options.getString('название', true));
      const hit = results[0];
      if (!hit) return void (await i.editReply('Ничего не нашлось'));
      const a = await senku.anime.get(hit.id);
      const rating = await senku.anime.rating(hit.id).catch(() => null);
      const embed = new EmbedBuilder()
        .setColor(RED)
        .setTitle(a.title)
        .setURL(`https://senku.one/anime/${a.id}`)
        .setDescription(a.description.slice(0, 350) + (a.description.length > 350 ? '…' : ''))
        .setThumbnail(a.poster)
        .addFields(
          { name: 'Год', value: a.year || '—', inline: true },
          { name: 'Серий', value: String(a.episodes_aired || a.episodes || '—'), inline: true },
          { name: 'Оценка Senku', value: rating?.total_votes ? `${rating.avg_score.toFixed(1)} · ${rating.total_votes} голосов` : '—', inline: true },
          { name: 'Жанры', value: a.genres.slice(0, 5).join(', ') || '—' },
        );
      return void (await i.editReply({ embeds: [embed] }));
    }
    if (i.commandName === 'senku') {
      const ref = i.options.getString('ник', true).replace(/^.*\/users\//, '');
      const u = await senku.users.get(ref);
      const st = await senku.users.stats(u.id);
      const embed = new EmbedBuilder()
        .setColor(RED)
        .setTitle(`${u.username} — уровень ${st.level}`)
        .setURL(`https://senku.one/users/${u.profile_url || u.id}`)
        .addFields(
          { name: 'Часов', value: String(st.stats.watch_hours), inline: true },
          { name: 'Серий', value: String(st.stats.episodes), inline: true },
          { name: 'Дней подряд', value: String(st.stats.streak_days), inline: true },
          { name: 'Любимые жанры', value: st.genres.slice(0, 3).map((g) => g.genre_name).join(', ') || '—' },
        );
      return void (await i.editReply({ embeds: [embed] }));
    }
  } catch (e) {
    const text = e instanceof SenkuError && e.isNotFound ? 'Не нашли такого' : 'Senku сейчас не отвечает, попробуй позже';
    await i.editReply(text);
  }
});

client.once(Events.ClientReady, (c) => console.log(`Бот ${c.user.tag} запущен`));
await client.login(token);
