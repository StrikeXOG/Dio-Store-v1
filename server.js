const express = require('express');
const path = require('path');
const { Client } = require('discord.js-selfbot-v13');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const S = { running: false, bots: [], logs: [], cfg: null, chatTimer: null, locked: false, stats: { msgs: 0, joins: 0, errors: 0 } };

const pushLog = (type, msg) => {
  S.logs.push({ type, msg, ts: Date.now() });
  if (S.logs.length > 400) S.logs.shift();
  console.log(`[${type}] ${msg}`);
};

const parseList = raw => (raw || '').split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));

const createAgent = url => {
  if (!url) return undefined;
  try { return url.startsWith('socks') ? new SocksProxyAgent(url) : new HttpsProxyAgent(url); }
  catch { return undefined; }
};

const PHRASES = {
  greetings: ['yo','hey','hi','sup','wsp','hello','gm','yooo','ayy'],
  casual: ['lmao','fr','ngl','bruh','lol','no way','deadass','real','bet','facts','sheesh','no cap','valid'],
  questions: ['wbu','wdyt','anyone here','whats good','anyone up','whats the move','who else is up'],
  reactions: ['haha','sheesh','damn','yeah fr','i feel that','same','mood','based','thats fire'],
  replies: ['wait really','no way fr','exactly','you get it','for real tho','broo yes','same energy','lmaooo','you aint wrong'],
  openers: ['anyone wanna chat','yo is anyone here','whats good yall','gm everyone','who all is up']
};

const PERSONAS = [
  { name: 'Chill', style: 'casual', typo: 0.05 },
  { name: 'Hype', style: 'greetings', typo: 0.03 },
  { name: 'Lurker', style: 'reactions', typo: 0.02 },
  { name: 'Chatter', style: 'questions', typo: 0.04 },
  { name: 'Vibe', style: 'openers', typo: 0.03 },
];

const pick = a => a[Math.floor(Math.random() * a.length)];

function typo(t, c) {
  if (Math.random() > c) return t;
  const m = [[/\byou\b/gi,'u'],[/\bthe\b/gi,'teh'],[/\bwhat\b/gi,'wut'],[/\bto\b/gi,'2'],[/\bfor\b/gi,'4'],[/\bwith\b/gi,'w/']];
  const [p, r] = pick(m);
  return t.replace(p, r);
}

function genReply(p) {
  let m = Math.random() < 0.5 ? pick(PHRASES.replies) : pick([...PHRASES[p.style], ...PHRASES.casual]);
  if (Math.random() < 0.3) m += ' ' + pick(PHRASES.casual);
  m = typo(m, p.typo);
  if (Math.random() < 0.15) m = m.toUpperCase();
  if (Math.random() < 0.25) m += ' ' + pick(['😭','💀','😂','🔥','💯','👀']);
  return m;
}

const genOpener = p => Math.random() < 0.5 ? pick(PHRASES.openers) : pick([...PHRASES[p.style], ...PHRASES.greetings]);

const FRAME = Buffer.from([0xf8,0xff,0xfe,0,0,0,0,0,0,0,0,0,0,0,0,0]);

class Voice {
  constructor(client, ch) {
    this.c = client; this.ch = ch; this.conn = null;
    this.silent = null; this.heart = null; this.dead = false; this.ok = false;
  }
  async join(cfg) {
    if (this.dead || !S.running) return;
    if (this.conn && this.ok) return;
    try {
      const channel = this.c.channels.cache.get(this.ch);
      if (!channel) return setTimeout(() => this.join(cfg), 5000);
      const fetched = await channel.fetch().catch(() => null);
      if (!fetched) return;
      pushLog('voice', `${this.c.user.tag} joining ${fetched.name}`);
      this.conn = await this.c.voice.joinChannel(fetched, { selfMute: cfg.mute, selfDeaf: cfg.deafen, selfVideo: false, group: this.c.user.id });
      this.ok = true; S.stats.joins++;
      pushLog('voice', `${this.c.user.tag} connected`);
      this.silent = setInterval(() => {
        try { if (this.conn?.player && this.conn.status === 4) this.conn.player.play(FRAME, { type: 'opus' }); } catch {}
      }, 5000);
      this.conn.on('closed', () => { this.ok = false; this.cleanup(); if (!this.dead && S.running) setTimeout(() => this.join(cfg), 4000); });
      this.conn.on('error', e => pushLog('err', `${this.c.user.tag} voice: ${e.message}`));
    } catch (e) {
      pushLog('warn', `${this.c.user.tag} join fail: ${e.message}`);
      setTimeout(() => this.join(cfg), 8000);
    }
  }
  cleanup() { if (this.silent) clearInterval(this.silent); this.silent = null; this.conn = null; this.ok = false; }
  destroy() { this.dead = true; this.cleanup(); try { this.conn?.disconnect(); } catch {} }
}

async function start(cfg) {
  if (S.running) throw new Error('Already running');
  const tokens = parseList(cfg.tokens);
  if (!tokens.length) throw new Error('No tokens');
  const proxies = parseList(cfg.proxies);
  const useP = proxies.length > 0 && cfg.useProxy !== false;

  S.running = true; S.cfg = { ...cfg, tokens, proxies, useP };
  S.bots = []; S.logs = []; S.stats = { msgs: 0, joins: 0, errors: 0 }; S.locked = false;
  pushLog('info', `Starting ${tokens.length} bot(s) | proxies: ${useP ? proxies.length : 'OFF'}`);

  for (let i = 0; i < tokens.length; i++) {
    const p = PERSONAS[i % PERSONAS.length];
    const proxy = useP ? proxies[i % proxies.length] : null;
    const agent = createAgent(proxy);
    const opts = { checkUpdate: false, rest: { timeout: 30000 }, ws: { version: 9 } };
    if (agent) { opts.rest.agent = agent; opts.ws.agent = agent; }

    const client = new Client(opts);
    const bot = { client, p, voices: [], index: i, banned: false };
    S.bots.push(bot);

    client.on('ready', async () => {
      pushLog('ready', `${client.user.tag} [${p.name}]`);
      await new Promise(r => setTimeout(r, 15000 + Math.random() * 8000));
      if (!S.running || !S.cfg.voiceChannels?.length) return;
      const vc = S.cfg.voiceChannels.length === 1 ? S.cfg.voiceChannels[0] : S.cfg.voiceChannels[i % S.cfg.voiceChannels.length];
      const v = new Voice(client, vc);
      bot.voices.push(v);
      await v.join(S.cfg);
    });
    client.on('error', e => {
      S.stats.errors++;
      if (/401|Unauthorized|invalid token/i.test(e.message)) { bot.banned = true; pushLog('warn', `${client.user?.tag} banned`); }
      else pushLog('err', `${client.user?.tag}: ${e.message}`);
    });

    try { await client.login(tokens[i]); }
    catch (e) { S.stats.errors++; pushLog('err', `Login #${i+1}: ${e.message}`); if (/401|invalid/i.test(e.message)) bot.banned = true; }

    if (i < tokens.length - 1 && S.running) await new Promise(r => setTimeout(r, 5000 + Math.random() * 5000));
  }

  setTimeout(startChat, 12000);
}

function startChat() {
  if (!S.running) return;
  const active = () => S.bots.filter(b => !b.banned && b.client.user);
  if (active().length < 2) return pushLog('warn', 'Need 2+ accounts for chat');

  pushLog('chat', `Reply chain active (${active().length} bots)`);
  const chain = { last: -1, msg: null };
  const delay = (S.cfg.chatDelay || 5) * 1000;

  const send = async (isOpener) => {
    if (S.locked || !S.running) return;
    S.locked = true;
    try {
      const act = active();
      if (act.length < 2) return;
      let bot, text;
      if (isOpener) { bot = act[0]; text = genOpener(bot.p); }
      else {
        if (Math.random() < 0.2) return;
        const avail = act.filter((_, i) => i !== chain.last);
        if (!avail.length) return;
        bot = pick(avail); text = genReply(bot.p);
      }
      const ch = bot.client.channels.cache.get(S.cfg.chatChannel);
      if (!ch) return;
      try { ch.startTyping(); } catch {}
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 2500));
      const payload = !isOpener && chain.msg ? { content: text, reply: { messageReference: chain.msg.id } } : text;
      chain.msg = await ch.send(payload);
      if (!isOpener) chain.last = act.indexOf(bot);
      S.stats.msgs++;
      pushLog('chat', `${bot.client.user.tag}: ${text}`);
    } catch (e) { S.stats.errors++; pushLog('err', `Chat: ${e.message}`); }
    finally { S.locked = false; }
  };

  (async () => {
    await send(true);
    const loop = () => {
      if (!S.running) return;
      S.chatTimer = setTimeout(async () => { await send(false); loop(); }, delay * 0.5 + Math.random() * delay * 1.5);
    };
    loop();
  })();
}

async function stop() {
  S.running = false;
  if (S.chatTimer) clearTimeout(S.chatTimer);
  for (const b of S.bots) {
    b.voices.forEach(v => v.destroy());
    try { await b.client.destroy(); } catch {}
  }
  S.bots = [];
  pushLog('warn', 'Stopped');
}

app.get('/api/status', (_, res) => res.json({
  running: S.running,
  bots: S.bots.map(b => ({ tag: b.client.user?.tag || '(connecting)', p: b.p.name, banned: b.banned, voice: b.voices.some(v => v.ok) })),
  stats: S.stats, logs: S.logs.slice(-80)
}));

app.post('/api/start', async (req, res) => {
  try {
    if (!req.body.chatChannel) return res.status(400).json({ error: 'chatChannel required' });
    await start(req.body);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/stop', async (_, res) => { await stop(); res.json({ ok: true }); });

app.listen(PORT, () => console.log(`\n  ╔═══════════════════════════════╗\n  ║  DIO STORE — Trial Trigger    ║\n  ║  Port ${PORT}                     ║\n  ╚═══════════════════════════════╝\n`));

process.on('SIGTERM', async () => { await stop(); process.exit(0); });
process.on('SIGINT', async () => { await stop(); process.exit(0); });