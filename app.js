const express = require('express');
const { Client, Options } = require('discord.js-selfbot-v13');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json({ limit: '2mb' }));

// THE HTML IS BAKED RIGHT HERE
const HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>The Vault</title><style>*{margin:0;padding:0;box-sizing:border-box;font-family:'Segoe UI',sans-serif}:root{--p:#d946ef;--c:#00ffcc;--bg:#0b0b12;--card:rgba(28,28,40,.7)}body{background:url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2000&auto=format&fit=crop') no-repeat center center fixed;background-size:cover;color:#fff;min-height:100vh}#login{position:fixed;inset:0;background:rgba(11,11,18,.95);backdrop-filter:blur(20px);z-index:999;display:flex;justify-content:center;align-items:center}.login-box{background:var(--card);padding:40px;border-radius:16px;border:1px solid rgba(217,70,239,.3);text-align:center;width:350px;box-shadow:0 0 50px rgba(217,70,239,.15)}.login-box h2{font-size:24px;color:#d946ef;margin-bottom:8px;letter-spacing:2px}.login-box p{color:#a1a1aa;font-size:13px;margin-bottom:25px}#pass{text-align:center;letter-spacing:8px;font-size:20px;padding:15px;background:rgba(0,0,0,.5);border:1px solid #333;color:#fff;border-radius:8px;width:100%;margin-bottom:20px;outline:0}#pass:focus{border-color:#d946ef}.shake{animation:sh .4s}@keyframes sh{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}50%{transform:translateX(8px)}75%{transform:translateX(-8px)}}#app{display:none;max-width:1100px;margin:0 auto;padding:40px 20px}header{text-align:center;margin-bottom:40px}.logo{font-size:50px;font-weight:900;letter-spacing:4px;background:linear-gradient(90deg,#d946ef,#00ffcc);-webkit-background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 15px rgba(217,70,239,.4))}.sub{font-size:12px;letter-spacing:6px;color:#a1a1aa;text-transform:uppercase;margin-top:5px}main{display:grid;grid-template-columns:1fr 1fr;gap:20px}.wide{grid-column:1/-1}.card{background:var(--card);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.05);border-radius:12px;padding:24px;box-shadow:0 10px 30px rgba(0,0,0,.5)}h2{font-size:13px;letter-spacing:1px;color:#d946ef;margin-bottom:15px;text-transform:uppercase}textarea,input{width:100%;padding:12px;margin-bottom:12px;background:rgba(11,11,18,.7);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:#fff;font-size:13px;outline:0}textarea:focus,input:focus{border-color:#d946ef;box-shadow:0 0 10px rgba(217,70,239,.2)}textarea{min-height:60px}.chk{display:inline-flex;align-items:center;gap:8px;font-size:13px;color:#a1a1aa;margin-right:15px;cursor:pointer}.chk input{width:auto;margin:0;accent-color:#d946ef}.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px}.row input[type=number]{width:80px;margin:0}.btns{display:flex;gap:10px;margin-top:15px}.btn{flex:1;padding:14px;border:none;border-radius:8px;font-weight:800;font-size:13px;letter-spacing:1px;cursor:pointer;transition:.2s;text-transform:uppercase}.btn.go{background:#d946ef;color:#fff;box-shadow:0 0 20px rgba(217,70,239,.4)}.btn.go:hover:not(:disabled){background:#c026d3;transform:translateY(-2px)}.btn.stop{background:rgba(255,77,77,.1);color:#ff4d4d;border:1px solid rgba(255,77,77,.3)}.btn:disabled{opacity:.4;cursor:not-allowed}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:15px}.stat{background:rgba(11,11,18,.5);border:1px solid rgba(255,255,255,.05);border-radius:8px;padding:15px;text-align:center}.stat b{display:block;font-size:24px;color:#00ffcc}.stat span{font-size:10px;letter-spacing:1px;color:#a1a1aa}.pill{display:inline-block;padding:6px 16px;border-radius:99px;font-size:12px;font-weight:800;margin-bottom:15px}.pill.off{background:rgba(255,77,77,.1);color:#ff4d4d;border:1px solid rgba(255,77,77,.3)}.pill.on{background:rgba(0,255,204,.1);color:#00ffcc;border:1px solid rgba(0,255,204,.3)}.bots{display:flex;flex-direction:column;gap:6px}.bot{display:flex;justify-content:space-between;padding:10px 14px;border-radius:6px;background:rgba(11,11,18,.7);font-size:12px;border-left:3px solid #444}.bot.good{border-left-color:#00ffcc;background:rgba(0,255,204,.05)}.bot.bad{border-left-color:#ff4d4d}.logs{max-height:250px;overflow-y:auto;font-family:monospace;font-size:12px;background:rgba(0,0,0,.6);padding:15px;border-radius:8px}.log{padding:4px 0}.log .t{color:#555;margin-right:10px}.log.ok{color:#00ffcc}.log.warn{color:#ffbd59}.log.err{color:#ff4d4d}.log.chat{color:#d946ef}.log.voice{color:#00ffcc}@media(max-width:800px){main{grid-template-columns:1fr}}</style></head><body><div id="login"><div class="login-box" id="login-box"><h2>THE VAULT</h2><p>Enter password to access</p><input type="password" id="pass" placeholder="••••" onkeypress="if(event.key==='Enter') checkPass()"><button class="btn go" style="width:100%" onclick="checkPass()">Login</button></div></div><div id="app"><header><div class="logo">THE VAULT</div><div class="sub">Trial Trigger V3</div></header><main><section class="card"><h2>⚡ Configuration</h2><textarea id="tokens" placeholder="Paste Discord tokens (one per line)" rows="3"></textarea><div class="row"><label class="chk"><input type="checkbox" id="camera"> Camera</label><label class="chk"><input type="checkbox" id="valorantRpc" checked> Valorant RPC</label><label class="chk"><input type="checkbox" id="deafen" checked> Deafen</label></div><input id="chatChannel" placeholder="Chat Channel ID" value="1234567890"><input id="voiceChannels" placeholder="Voice Channel ID" value="0987654321"><div class="row"><input type="number" id="chatDelay" value="5" min="1" placeholder="Chat Delay"></div><div class="btns"><button id="startBtn" class="btn go" onclick="start()">▶ Start</button><button id="stopBtn" class="btn stop" onclick="stop()" disabled>■ Stop</button></div></section><section class="card"><h2>📊 Statistics</h2><div class="stats"><div class="stat"><b id="sMsg">0</b><span>MSGS</span></div><div class="stat"><b id="sJoin">0</b><span>VC JOINS</span></div><div class="stat"><b id="sErr">0</b><span>ERRORS</span></div></div><div class="pill off" id="pill">● OFFLINE</div><div class="bots" id="bots"></div></section><section class="card wide"><h2>📜 Live Logs</h2><div class="logs" id="logs"></div></section></main></div><script>const $=id=>document.getElementById(id);let poll=null;function checkPass(){if($('pass').value==="2255"){$('login').style.opacity='0';setTimeout(()=>{$('login').style.display='none';$('app').style.display='block'},400)}else{$('login-box').classList.add('shake');setTimeout(()=>$('login-box').classList.remove('shake'),400);$('pass').value=''}}async function start(){$('startBtn').disabled=true;$('stopBtn').disabled=false;try{await fetch('/api/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tokens:$('tokens').value,chatChannel:$('chatChannel').value,voiceChannels:$('voiceChannels').value,deafen:$('deafen').checked,mute:false,chatDelay:parseInt($('chatDelay').value)||5,camera:$('camera').checked,valorantRpc:$('valorantRpc').checked})});poll=setInterval(update,2000)}catch(e){alert(e)}}async function stop(){await fetch('/api/stop',{method:'POST'});$('startBtn').disabled=false;$('stopBtn').disabled=true;clearInterval(poll)}function log(type,msg){const el=$('logs');el.innerHTML+=`<div class="log ${type}"><span class="t">${new Date().toLocaleTimeString()}</span> ${msg}</div>`;el.scrollTop=el.scrollHeight}async function update(){try{const r=await fetch('/api/status'),d=await r.json();$('pill').className='pill '+(d.running?'on':'off');$('pill').innerText=d.running?'● ONLINE':'● OFFLINE';$('sMsg').innerText=d.stats.msgs;$('sJoin').innerText=d.stats.joins;$('sErr').innerText=d.stats.errors;$('bots').innerHTML=d.bots.map(b=>`<div class="bot ${b.banned?'bad':b.voice?'good':''}"><b>${b.tag}</b><span>${b.voice?'🎙':''} ${b.banned?'❌':''}</span></div>`).join('');$('logs').innerHTML=d.logs.map(l=>`<div class="log ${l.type}"><span class="t">${new Date(l.ts).toLocaleTimeString()}</span> ${l.msg}</div>`).join('');$('logs').scrollTop=$('logs').scrollHeight}catch(e){}}</script></body></html>`;

// Serve the HTML directly
app.get('/', (req, res) => res.send(HTML));

// --- REST OF THE BOT LOGIC ---
const S = { running: false, bots: [], logs: [], cfg: null, chatTimer: null, locked: false, stats: { msgs: 0, joins: 0, errors: 0 } };
const pushLog = (type, msg) => { S.logs.push({ type, msg, ts: Date.now() }); if (S.logs.length > 100) S.logs.shift(); };
const parseList = raw => (raw || '').split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
const createAgent = url => { if (!url) return undefined; try { return url.startsWith('socks') ? new SocksProxyAgent(url) : new HttpsProxyAgent(url); } catch { return undefined; } };

const PHRASES = { greetings: ['yo','hey','hi','sup','wsp','hello','gm','yooo'], casual: ['lmao','fr','ngl','bruh','lol','no way','real','bet','facts'], replies: ['wait really','no way fr','exactly','you get it','for real tho','same energy'] };
const pick = a => a[Math.floor(Math.random() * a.length)];
function genReply() { let m = pick(PHRASES.replies); if (Math.random() < 0.3) m += ' ' + pick(PHRASES.casual); return m; }

const FRAME = Buffer.from([0xf8,0xff,0xfe,0,0,0,0,0,0,0,0,0,0,0,0,0]);
class Voice {
  constructor(client, ch) { this.c = client; this.ch = ch; this.conn = null; this.silent = null; this.dead = false; this.ok = false; }
  async join(cfg) {
    if (this.dead || !S.running || (this.conn && this.ok)) return;
    try {
      const channel = this.c.channels.cache.get(this.ch);
      if (!channel) return setTimeout(() => this.join(cfg), 5000);
      const fetched = await channel.fetch().catch(() => null);
      if (!fetched) return;
      this.conn = await this.c.voice.joinChannel(fetched, { selfMute: cfg.mute, selfDeaf: cfg.deafen, selfVideo: cfg.camera });
      this.ok = true; S.stats.joins++;
      this.silent = setInterval(() => { try { if (this.conn?.player && this.conn.status === 4) this.conn.player.play(FRAME, { type: 'opus' }); } catch {} }, 10000);
      this.conn.on('closed', () => { this.ok = false; this.cleanup(); if (!this.dead && S.running) setTimeout(() => this.join(cfg), 4000); });
    } catch (e) { setTimeout(() => this.join(cfg), 8000); }
  }
  cleanup() { if (this.silent) clearInterval(this.silent); this.silent = null; this.conn = null; this.ok = false; }
  destroy() { this.dead = true; this.cleanup(); try { this.conn?.disconnect(); } catch {} }
}

async function start(cfg) {
  if (S.running) throw new Error('Running');
  const tokens = parseList(cfg.tokens);
  S.running = true; S.cfg = { ...cfg, tokens }; S.bots = []; S.logs = []; S.stats = { msgs: 0, joins: 0, errors: 0 };
  for (let i = 0; i < tokens.length; i++) {
    const proxy = cfg.useProxy ? cfg.proxies.split('\n')[i % cfg.proxies.split('\n').length] : null;
    const agent = createAgent(proxy);
    const opts = { checkUpdate: false, rest: { timeout: 30000 }, ws: { version: 9 }, makeCache: Options.cacheWithLimits({ MessageManager: 0, PresenceManager: 0, GuildMemberManager: 0, UserManager: 0 }), sweepers: { messages: { interval: 60, lifetime: 60 } } };
    if (agent) { opts.rest.agent = agent; opts.ws.agent = agent; }
    const client = new Client(opts);
    const bot = { client, voices: [], index: i, banned: false };
    S.bots.push(bot);
    client.on('ready', async () => {
      if (cfg.valorantRpc) client.user.setActivity('Valorant', { type: 'PLAYING' });
      await new Promise(r => setTimeout(r, 8000));
      if (S.running && cfg.voiceChannels) { const v = new Voice(client, cfg.voiceChannels); bot.voices.push(v); await v.join(cfg); }
    });
    client.on('error', e => { S.stats.errors++; if (/401|invalid/i.test(e.message)) bot.banned = true; });
    try { await client.login(tokens[i]); } catch (e) { S.stats.errors++; if (/401|invalid/i.test(e.message)) bot.banned = true; }
    if (i < tokens.length - 1) await new Promise(r => setTimeout(r, 5000));
  }
  setTimeout(startChat, 12000);
}

function startChat() {
  if (!S.running || !S.cfg.chatChannel) return;
  const active = () => S.bots.filter(b => !b.banned && b.client.user);
  if (active().length < 2) return;
  const chain = { last: -1, msg: null }, delay = (S.cfg.chatDelay || 5) * 1000;
  const send = async (isOpener) => {
    if (S.locked || !S.running) return; S.locked = true;
    try {
      const act = active(); let bot = act[0], text = isOpener ? pick(PHRASES.greetings) : genReply();
      const ch = bot.client.channels.cache.get(S.cfg.chatChannel); if (!ch) return;
      chain.msg = await ch.send(!isOpener && chain.msg ? { content: text, reply: { messageReference: chain.msg.id } } : text);
      S.stats.msgs++;
    } catch (e) {} finally { S.locked = false; }
  };
  (async () => { await send(true); const loop = () => { if (!S.running) return; S.chatTimer = setTimeout(async () => { await send(false); loop(); }, delay * 0.5 + Math.random() * delay); }; loop(); })();
}

async function stop() { S.running = false; if (S.chatTimer) clearTimeout(S.chatTimer); for (const b of S.bots) { b.voices.forEach(v => v.destroy()); try { await b.client.destroy(); } catch {} } S.bots = []; }

app.get('/api/status', (_, res) => res.json({ running: S.running, bots: S.bots.map(b => ({ tag: b.client.user?.tag || '(connecting)', banned: b.banned, voice: b.voices.some(v => v.ok) })), stats: S.stats, logs: S.logs.slice(-50) }));
app.post('/api/start', async (req, res) => { try { await start(req.body); res.json({ ok: true }); } catch (e) { res.status(500).json({ error: e.message }); } });
app.post('/api/stop', async (_, res) => { await stop(); res.json({ ok: true }); });

app.listen(PORT, () => console.log(`\n  THE VAULT — Running on Port ${PORT}\n`));
