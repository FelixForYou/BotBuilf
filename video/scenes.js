/* Motion graphics: Bot Telegram Node.js di Pterodactyl.
   Semua animasi adalah fungsi waktu murni (render(t)), sehingga setiap frame deterministik. */
'use strict';
const DURATION = 192.04;

/* ---------- ikon ---------- */
const I = {
  tg: (s = 64) => `<svg width="${s}" height="${s}" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#2AABEE"/><path d="M14 31.5 47 18.6c1.6-.6 3 .4 2.5 2.8l-5.6 26.5c-.4 1.9-1.5 2.3-3.1 1.4l-8.6-6.3-4.1 4c-.5.5-.8.8-1.7.8l.6-8.8 16-14.5c.7-.6-.2-.9-1.1-.4L22.4 37.6l-8.5-2.7c-1.8-.6-1.9-1.8.1-2.6z" fill="#fff"/></svg>`,
  node: (s = 64) => `<svg width="${s}" height="${s}" viewBox="0 0 64 64"><polygon points="32,3 58,18 58,46 32,61 6,46 6,18" fill="#5FA04E"/><text x="32" y="41" text-anchor="middle" font-family="Inter" font-weight="900" font-size="22" fill="#fff">JS</text></svg>`,
  panel: (s = 64) => `<svg width="${s}" height="${s}" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#1f2933"/><rect x="12" y="13" width="40" height="10" rx="3" fill="#3e4c59"/><rect x="12" y="27" width="40" height="10" rx="3" fill="#3e4c59"/><rect x="12" y="41" width="40" height="10" rx="3" fill="#3e4c59"/><circle cx="45" cy="18" r="2.6" fill="#3ccf7e"/><circle cx="45" cy="32" r="2.6" fill="#3ccf7e"/><circle cx="45" cy="46" r="2.6" fill="#2b8ef0"/><rect x="16" y="16.5" width="16" height="3" rx="1.5" fill="#9aa5b1"/><rect x="16" y="30.5" width="16" height="3" rx="1.5" fill="#9aa5b1"/><rect x="16" y="44.5" width="16" height="3" rx="1.5" fill="#9aa5b1"/></svg>`,
  verif: () => `<svg class="verif" viewBox="0 0 24 24"><path d="M12 1.5l2.6 2 3.3-.2 1 3.1 2.7 1.9-1 3.1 1 3.1-2.7 1.9-1 3.1-3.3-.2-2.6 2-2.6-2-3.3.2-1-3.1-2.7-1.9 1-3.1-1-3.1 2.7-1.9 1-3.1 3.3.2z" fill="#4fa3e8"/><path d="M7.8 12.2l2.8 2.8 5.6-5.6" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  send: (c = '#6ab3f3') => `<svg width="30" height="30" viewBox="0 0 24 24"><path d="M3 20.5 21 12 3 3.5l.01 6.6L15 12 3.01 13.9z" fill="${c}"/></svg>`,
  clip: () => `<svg width="28" height="28" viewBox="0 0 24 24"><path d="M16.5 6.5v10a4.5 4.5 0 0 1-9 0V5a3 3 0 0 1 6 0v10.5a1.5 1.5 0 0 1-3 0V6.5" stroke="#6d7f8f" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`,
  search: (c = '#6d7f8f') => `<svg width="22" height="22" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" stroke="${c}" stroke-width="2.2" fill="none"/><path d="M15.5 15.5 21 21" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  server: (c = '#9aa5b1', s = 26) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2"><rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><circle cx="7" cy="7.5" r=".8" fill="${c}"/><circle cx="7" cy="16.5" r=".8" fill="${c}"/></svg>`,
  cog: (c = '#9aa5b1') => `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/></svg>`,
  user: (c = '#9aa5b1') => `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>`,
  out: (c = '#9aa5b1') => `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/></svg>`,
  file: (c = '#9aa5b1') => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2"><path d="M6 2.5h8l4.5 4.5v14.5H6z"/><path d="M14 2.5V7h4.5"/></svg>`,
  zip: (c = '#facc15') => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2"><path d="M6 2.5h8l4.5 4.5v14.5H6z"/><path d="M10 3v2h2v2h-2v2h2v2h-2v3"/></svg>`,
  folder: (c = '#7cb7ff', s = 26) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M2.5 6.5a2 2 0 0 1 2-2h5l2 2.5h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2z" fill="${c}"/></svg>`,
  dots: () => `<svg width="26" height="26" viewBox="0 0 24 24" fill="#9aa5b1"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>`,
  play: () => `<svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M7 4.5v15l12-7.5z"/></svg>`,
};
const fIcon = (ext) => {
  const m = { json: ['#facc15', '{ }'], js: ['#f7df1e', 'JS'], env: ['#9be37a', '.e'], dir: ['#7cb7ff', '▸'] };
  const [bg, tx] = m[ext] || ['#9aa5b1', '?'];
  return `<span class="ic" style="background:${bg}">${tx}</span>`;
};

/* ---------- builder helper ---------- */
const scenes = [];
function scene(s, e, html, id) {
  scenes.push({ s, e, html, id });
}
const A = (o) => Object.entries(o).map(([k, v]) => `data-${k}="${v}"`).join(' ');

/* ---------- Telegram building blocks ---------- */
function tgMsg(side, t, html, time, extra = '') {
  return `<div class="mwrap ${side}" ${A({ in: t, fx: 'grow', mh: 420, d: 0.35 })} ${extra}><div class="msg">${html}<span class="tm">${time}${side === 'out' ? ' ✓✓' : ''}</span></div></div>`;
}
function tgItem(av, avbg, name, prev, time, extra = '', verif = false) {
  return `<div class="tg-item" ${extra}><div class="av" style="background:${avbg}">${av}</div><div class="meta"><div class="nm">${name}${verif ? I.verif() : ''}</div><div class="pv">${prev}</div></div><div class="tm">${time}</div></div>`;
}

/* ---------- Pterodactyl chrome ---------- */
function ptNav() {
  return `<div class="pt-nav"><div class="brand">${I.panel(38)} Pterodactyl</div><div class="ico">${I.server()}</div><div class="ico">${I.cog()}</div><div class="ico">${I.user()}</div><div class="ico">${I.out()}</div></div>`;
}
function ptSub(active) {
  const tabs = ['Console', 'Files', 'Databases', 'Schedules', 'Users', 'Backups', 'Network', 'Startup', 'Settings', 'Activity'];
  return `<div class="pt-sub">${tabs.map((x) => `<span class="${x === active ? 'on' : ''}">${x}</span>`).join('')}</div>`;
}

/* =====================================================================
   SCENE 0 — Intro (0 – 14.17)
   ===================================================================== */
scene(0, 14.17, `
<div class="abs" style="left:0;right:0;top:250px;display:flex;justify-content:center;align-items:center;gap:46px">
  <div ${A({ in: 0.25, fx: 'pop', d: 0.6 })}>${I.tg(150)}</div>
  <div ${A({ in: 0.5, fx: 'pop' })} style="font-size:64px;color:#55657c;font-weight:300">+</div>
  <div ${A({ in: 0.6, fx: 'pop', d: 0.6 })}>${I.node(150)}</div>
  <div ${A({ in: 0.85, fx: 'pop' })} style="font-size:64px;color:#55657c;font-weight:300">+</div>
  <div ${A({ in: 0.95, fx: 'pop', d: 0.6 })}>${I.panel(150)}</div>
</div>
<div class="abs" style="left:0;right:0;top:500px;text-align:center">
  <div class="big-title" ${A({ in: 1.5, fx: 'up', d: 0.7 })}>Menjalankan Bot Telegram</div>
  <div class="big-title grad" ${A({ in: 1.9, fx: 'up', d: 0.7 })} style="margin-top:8px">Node.js di Panel Pterodactyl</div>
</div>
<div class="abs" style="left:0;right:0;top:760px;display:flex;justify-content:center;gap:20px">
  <span class="chip" ${A({ in: 4.2, fx: 'up' })}>🤖 BotFather</span>
  <span class="chip" ${A({ in: 4.5, fx: 'up' })}>🟩 Node.js + Telegraf</span>
  <span class="chip" ${A({ in: 4.8, fx: 'up' })}>🖥️ Pterodactyl Panel</span>
</div>
<div class="abs" style="left:0;right:0;top:880px;display:flex;justify-content:center">
  <div ${A({ in: 9.6, fx: 'pop', d: 0.6 })} style="display:flex;align-items:center;gap:18px;padding:18px 34px;border-radius:999px;background:rgba(60,207,126,.12);border:1px solid rgba(60,207,126,.45);font-size:34px;font-weight:800;color:#bff5d6">
    <span id="pulse" style="width:20px;height:20px;border-radius:50%;background:#3ccf7e"></span> Online 24 jam nonstop
  </div>
</div>`);

/* =====================================================================
   SCENE 1 — BotFather (14.17 – 33.95)
   ===================================================================== */
scene(14.17, 33.95, `
<div class="win tg" ${A({ in: 14.3, fx: 'zoom', d: 0.7 })}>
  <div class="tg-side">
    <div class="tg-top"><div class="tg-burger"></div>
      <div class="tg-search" id="tgsearch" ${A({ on: '16.75,18.0', onc: 'focus' })}>${I.search()}
        <span ${A({ vis: '0,16.75' })}>Search</span>
        <span class="q" ${A({ vis: '16.75,99', type: 16.85, cps: 15 })}>BotFather</span>
      </div>
    </div>
    <div class="tg-list">
      <div ${A({ vis: '0,17.5' })}>
        ${tgItem('⭐', '#3d8fd6', 'Saved Messages', 'catatan: beli domain bot', '09:12')}
        ${tgItem('GD', '#e17076', 'Grup Developer', 'Raka: udah deploy belum?', '08:47')}
        ${tgItem('KN', '#7bc862', 'Kantor', 'Meeting jam 10 ya', 'Sen')}
        ${tgItem('IB', '#ee7aae', 'Ibu', 'Jangan lupa makan 😊', 'Min')}
        ${tgItem('MS', '#faa774', 'Musik Santai', 'Playlist baru sudah ada', 'Sab')}
      </div>
      <div ${A({ vis: '17.5,99', in: 17.5, fx: 'fade', d: 0.25 })}>
        <div style="padding:14px 20px;color:#6ab3f3;font-size:17px;font-weight:600">Global search results</div>
        <div id="bfres" ${A({ on: '17.95,99', onc: 'sel' })} class="tg-item">
          <div class="av" style="background:linear-gradient(135deg,#59a7ea,#2f6fb8)">BF</div>
          <div class="meta"><div class="nm">BotFather${I.verif()}</div><div class="pv">@BotFather</div></div>
        </div>
        ${tgItem('BF', '#5d6b7a', 'BotFather Indonesia', '@botfather_id_fans · 1.2K subscribers', '')}
      </div>
    </div>
  </div>
  <div class="tg-main">
    <div ${A({ vis: '0,17.95' })} style="position:absolute;inset:0;display:grid;place-items:center">
      <span style="background:rgba(0,0,0,.28);padding:8px 18px;border-radius:16px;color:#b8c7d6;font-size:19px">Select a chat to start messaging</span>
    </div>
    <div ${A({ vis: '17.95,99', in: 17.95, fx: 'fade', d: 0.25 })} style="display:flex;flex-direction:column;height:100%">
      <div class="tg-head"><div class="av" style="width:50px;height:50px;font-size:19px;background:linear-gradient(135deg,#59a7ea,#2f6fb8)">BF</div>
        <div><div class="nm">BotFather${I.verif()}</div>
          <div class="st"><span ${A({ vis: '0,19.45' })}>bot</span><span class="typing" ${A({ vis: '19.45,19.8' })}>typing…</span><span ${A({ vis: '19.8,20.95' })}>bot</span><span class="typing" ${A({ vis: '20.95,21.25' })}>typing…</span><span ${A({ vis: '21.25,22.85' })}>bot</span><span class="typing" ${A({ vis: '22.85,23.9' })}>typing…</span><span ${A({ vis: '23.9,99' })}>bot</span></div></div>
      </div>
      <div class="tg-msgs">
        ${tgMsg('out', 19.35, '/newbot', '10:21')}
        ${tgMsg('in', 19.8, 'Alright, a new bot. How are we going to call it? Please choose a name for your bot.', '10:21')}
        ${tgMsg('out', 20.85, 'Toko Bot', '10:21')}
        ${tgMsg('in', 21.25, 'Good. Now let\'s choose a username for your bot. It must end in <code>bot</code>. Like this, for example: TetrisBot or tetris_bot.', '10:21')}
        ${tgMsg('out', 22.75, 'tokoku_bot', '10:22')}
        ${tgMsg('in', 23.9, 'Done! Congratulations on your new bot. You will find it at <a>t.me/tokoku_bot</a>. You can now add a description, about section and profile picture for your bot, see <a>/help</a> for a list of commands.<br><br>Use this token to access the HTTP API:<br><span class="tok" ' + A({ hl: 26.9 }) + '>7712045893:AAF3kQ_x9Lz2vB8mTqW1cJ4hYp</span><br><br>Keep your token <b>secure</b> and <b>store it safely</b>, it can be used by anyone to control your bot.', '10:22')}
      </div>
      <div class="tg-input" id="tginput1">${I.clip()}
        <div class="txt" ${A({ vis: '0,18.75' })}>Write a message…</div>
        <div class="txt has" ${A({ vis: '18.75,19.35', type: 18.8, cps: 16 })}>/newbot</div>
        <div class="txt" ${A({ vis: '19.35,20.1' })}>Write a message…</div>
        <div class="txt has" ${A({ vis: '20.1,20.85', type: 20.15, cps: 14 })}>Toko Bot</div>
        <div class="txt" ${A({ vis: '20.85,21.95' })}>Write a message…</div>
        <div class="txt has" ${A({ vis: '21.95,22.75', type: 22.0, cps: 15 })}>tokoku_bot</div>
        <div class="txt" ${A({ vis: '22.75,99' })}>Write a message…</div>
        <div class="sendbtn">${I.send()}</div>
      </div>
    </div>
  </div>
</div>
<div class="callout" ${A({ in: 27.3, fx: 'right', d: 0.6 })} style="right:110px;top:190px;width:560px;border-color:rgba(255,181,71,.5)">
  <b class="big">🔑 Token = kunci bot kamu</b>
  <span style="color:#c9d3e0;font-weight:500">Simpan baik-baik. <span style="color:#ffb547;font-weight:700">Jangan dibagikan</span> ke siapa pun — siapa pun yang memegangnya bisa mengendalikan bot.</span>
</div>`);

/* =====================================================================
   SCENE 2 — Kode bot (33.95 – 63.80)
   ===================================================================== */
function codeLines(lines, t0, step, hls = {}) {
  return lines.map((l, i) => {
    const h = hls[i];
    return `<div class="ln" ${A({ in: (t0 + i * step).toFixed(2), fx: 'left', d: 0.3, dx: 20 })} ${h ? A({ hl: h }) : ''}><span class="no">${i + 1}</span><span>${l || ' '}</span></div>`;
  }).join('');
}
const pkgLines = [
  '{',
  '  <span class="e">"name"</span>: <span class="s">"bot-telegram"</span>,',
  '  <span class="e">"version"</span>: <span class="s">"1.0.0"</span>,',
  '  <span class="e">"main"</span>: <span class="s">"index.js"</span>,',
  '  <span class="e">"scripts"</span>: { <span class="e">"start"</span>: <span class="s">"node index.js"</span> },',
  '  <span class="e">"dependencies"</span>: {',
  '    <span class="e">"telegraf"</span>: <span class="s">"^4.16.3"</span>,',
  '    <span class="e">"dotenv"</span>: <span class="s">"^16.4.5"</span>',
  '  }',
  '}',
];
const idxLines = [
  '<span class="f">require</span>(<span class="s">\'dotenv\'</span>).<span class="f">config</span>();',
  '<span class="k">const</span> { Telegraf } = <span class="f">require</span>(<span class="s">\'telegraf\'</span>);',
  '',
  '<span class="k">const</span> <span class="v">bot</span> = <span class="k">new</span> <span class="f">Telegraf</span>(process.env.<span class="p">BOT_TOKEN</span>);',
  '',
  '<span class="v">bot</span>.<span class="f">start</span>((ctx) => ctx.<span class="f">reply</span>(<span class="s">\'Halo! Bot aktif 🚀\'</span>));',
  '<span class="v">bot</span>.<span class="f">help</span>((ctx) => ctx.<span class="f">reply</span>(<span class="s">\'Perintah: /start /help /ping\'</span>));',
  '<span class="v">bot</span>.<span class="f">command</span>(<span class="s">\'ping\'</span>, (ctx) => ctx.<span class="f">reply</span>(<span class="s">\'pong 🏓\'</span>));',
  '',
  'console.<span class="f">log</span>(<span class="s">\'Menyalakan bot...\'</span>);',
  '<span class="v">bot</span>.<span class="f">launch</span>(() => console.<span class="f">log</span>(<span class="s">\'Bot berjalan (mode polling)...\'</span>));',
];
const envLines = [
  '<span class="c"># simpan token dari BotFather di sini</span>',
  '<span class="p">BOT_TOKEN</span>=<span class="s">7712045893:AAF3kQ_x9Lz2vB8mTqW1cJ4hYp</span>',
];
scene(33.95, 63.80, `
<div class="win ed" ${A({ in: 34.1, fx: 'zoom', d: 0.7 })}>
  <div class="ed-title"><span class="dot" style="background:#ff5f57"></span><span class="dot" style="background:#febc2e"></span><span class="dot" style="background:#28c840"></span><span style="margin-left:14px">bot-telegram — Editor</span></div>
  <div class="ed-body">
    <div class="ed-tree"><h5>EXPLORER</h5>
      <div class="fi" style="color:#8b93a7">${I.folder('#7cb7ff', 22)} bot-telegram</div>
      <div class="fi" style="padding-left:44px" ${A({ in: 36.9, fx: 'left' })} ${A({ hl: '37.0', hle: 45.5 })}>${fIcon('json')} package.json</div>
      <div class="fi" style="padding-left:44px" ${A({ in: 37.4, fx: 'left' })} ${A({ hl: '45.6', hle: 51.4 })}>${fIcon('js')} index.js</div>
      <div class="fi" style="padding-left:44px" ${A({ in: 51.6, fx: 'left' })} ${A({ hl: '51.7', hle: 99 })}>${fIcon('env')} .env</div>
    </div>
    <div class="ed-main">
      <div class="tabs">
        <div class="tab" ${A({ in: 41.55, fx: 'fade', d: 0.2, on: '41.55,45.63' })}>${fIcon('json').replace('class="ic"', 'class="ic" style="width:22px;height:22px;font-size:10px;background:#facc15"')} package.json</div>
        <div class="tab" ${A({ in: 45.63, fx: 'fade', d: 0.2, on: '45.63,51.49' })}>${fIcon('js').replace('class="ic"', 'class="ic" style="width:22px;height:22px;font-size:10px;background:#f7df1e"')} index.js</div>
        <div class="tab" ${A({ in: 51.49, fx: 'fade', d: 0.2, on: '51.49,99' })}>${fIcon('env').replace('class="ic"', 'class="ic" style="width:22px;height:22px;font-size:10px;background:#9be37a"')} .env</div>
      </div>
      <div ${A({ vis: '0,41.55' })} style="position:absolute;inset:50px 0 0 0;display:flex;align-items:center;justify-content:center;gap:50px">
        <div ${A({ in: 36.9, fx: 'pop', d: 0.5 })} class="card" style="width:330px;padding:36px;text-align:center;background:#23252d">
          <div style="font-size:64px">📦</div><div class="mono" style="font-size:30px;font-weight:700;margin-top:12px;color:#facc15">package.json</div><div style="color:#8b93a7;margin-top:8px;font-size:19px">daftar library</div></div>
        <div ${A({ in: 38.8, fx: 'pop', d: 0.5 })} class="card" style="width:330px;padding:36px;text-align:center;background:#23252d">
          <div style="font-size:64px">⚡</div><div class="mono" style="font-size:30px;font-weight:700;margin-top:12px;color:#f7df1e">index.js</div><div style="color:#8b93a7;margin-top:8px;font-size:19px">kode utama bot</div></div>
      </div>
      <div class="code" ${A({ vis: '41.55,45.63' })}>${codeLines(pkgLines, 41.7, 0.1, { 6: '42.9', 7: '43.6' })}</div>
      <div class="code" ${A({ vis: '45.63,51.49' })}>${codeLines(idxLines, 45.8, 0.12, { 5: '47.9', 6: '49.2', 7: '50.1' })}</div>
      <div class="code" ${A({ vis: '51.49,99' })}>${codeLines(envLines, 51.7, 0.25, { 1: '52.5' })}</div>
      <div class="term" ${A({ in: 54.86, fx: 'up', dy: 330, d: 0.5 })}>
        <div class="hd">TERMINAL</div>
        <div><span class="pr">➜ bot-telegram</span> <span ${A({ type: 55.3, cps: 22 })}>npm install</span></div>
        <div ${A({ in: 56.0, fx: 'fade', d: 0.2 })} style="color:#8b93a7">added 15 packages in 3s</div>
        <div ${A({ in: 56.3, fx: 'fade', d: 0.1 })}><span class="pr">➜ bot-telegram</span> <span ${A({ type: 56.4, cps: 22 })}>npm start</span></div>
        <div ${A({ in: 57.0, fx: 'fade', d: 0.2 })}>Menyalakan bot...</div>
        <div ${A({ in: 57.45, fx: 'fade', d: 0.2 })} style="color:#3ccf7e">Bot berjalan (mode polling)... ✓</div>
        <div ${A({ in: 59.6, fx: 'fade', d: 0.15 })} style="color:#ff8a95">^C  Bot dihentikan</div>
      </div>
    </div>
  </div>
</div>
<div class="callout" ${A({ in: 60.0, fx: 'pop', d: 0.5 })} style="left:560px;top:270px;width:800px;border-color:rgba(255,181,71,.55);text-align:center;padding:34px">
  <b class="big" style="font-size:40px">⚠️ 1 token = 1 tempat</b>
  <div style="display:flex;justify-content:center;align-items:center;gap:34px;margin:24px 0 18px;font-size:26px">
    <div style="padding:16px 22px;border-radius:14px;background:rgba(255,93,108,.12);border:1px solid rgba(255,93,108,.4)">💻 Komputer<br><b style="color:#ff8a95">dimatikan</b></div>
    <div style="font-size:40px;color:#55657c">→</div>
    <div style="padding:16px 22px;border-radius:14px;background:rgba(60,207,126,.12);border:1px solid rgba(60,207,126,.45)">🖥️ Pterodactyl<br><b style="color:#3ccf7e">jalan di sini</b></div>
  </div>
  <span style="color:#9fb0c4;font-weight:500;font-size:22px">Kalau jalan di dua tempat → error <span class="mono" style="color:#ff8a95">409 Conflict</span></span>
</div>`);

/* =====================================================================
   SCENE 3 — Server Pterodactyl (63.80 – 77.47)
   ===================================================================== */
function pRow(id, name, desc, ip, cpu, mem, disk, st, t, extra = '') {
  return `<div class="prow" id="${id}" style="--st:${st}" ${A({ in: t, fx: 'up' })} ${extra}>
    <div class="sic">${I.server('#9aa5b1', 28)}</div>
    <div style="flex:1"><div class="nm">${name}</div><div class="ds">${desc}</div></div>
    <div style="width:260px;color:var(--p-mut);font-size:18px;display:flex;gap:10px;align-items:center">🌐 <span class="mono" style="font-size:17px">${ip}</span></div>
    <div class="stat"><span>${cpu}</span><small>CPU</small></div>
    <div class="stat"><span>${mem}</span><small>MEMORY</small></div>
    <div class="stat"><span>${disk}</span><small>DISK</small></div>
  </div>`;
}
scene(63.80, 77.47, `
<div class="win pt" ${A({ in: 63.95, fx: 'zoom', d: 0.7 })}>
  ${ptNav()}
  <div class="pt-body" ${A({ vis: '0,73.8' })} style="padding-top:40px">
    <div style="display:flex;justify-content:flex-end;align-items:center;gap:14px;margin-bottom:24px;color:var(--p-mut);font-size:16px;letter-spacing:.08em">SHOWING YOUR SERVERS <span style="width:52px;height:28px;border-radius:14px;background:#2b8ef0;display:inline-block;position:relative"><i style="position:absolute;right:4px;top:4px;width:20px;height:20px;border-radius:50%;background:#fff"></i></span></div>
    ${pRow('row1', 'Bot Telegram', 'Egg: Node.js Generic · bot toko online', '103.152.118.20:2007', '0.18%', '48 MB', '31 MB', '#3ccf7e', 64.4, A({ hl: 67.1, hle: 73.6 }))}
    ${pRow('row2', 'Minecraft SMP', 'Egg: Paper', '103.152.118.20:25565', '—', '—', '1.4 GB', '#ff5d6c', 64.6)}
    ${pRow('row3', 'Discord Bot', 'Egg: Node.js Generic', '103.152.118.20:2010', '0.40%', '72 MB', '58 MB', '#3ccf7e', 64.8)}
  </div>
  <div ${A({ vis: '73.8,99', in: 73.8, fx: 'right', dx: 80, d: 0.5 })} style="flex:1;display:flex;flex-direction:column">
    ${ptSub('Startup')}
    <div class="pt-body" style="display:flex;gap:30px">
      <div class="pcard" style="flex:1"><h4>Startup Command</h4><div class="mono" style="padding:22px;font-size:17px;color:#cbd2d9;line-height:1.6">if [ -f /home/container/package.json ]; then npm install; fi; node /home/container/{{JS_FILE}}</div></div>
      <div class="pcard" style="width:560px;position:relative"><h4>Docker Image</h4>
        <div style="padding:22px">
          <div class="pin" id="dsel" style="display:flex;justify-content:space-between;align-items:center">
            <span ${A({ vis: '0,75.85' })}>ghcr.io/parkervcp/yolks:nodejs_18</span>
            <span ${A({ vis: '75.85,99' })} style="color:#7fe0a8">ghcr.io/parkervcp/yolks:nodejs_20</span><span style="color:var(--p-mut)">▾</span></div>
          <div style="color:var(--p-mut);font-size:16px;margin-top:12px">Pilih image yang sesuai dengan versi Node.js bot kamu.</div>
          <div class="menu" ${A({ vis: '74.55,75.85', in: 74.55, fx: 'down', dy: 10, d: 0.2 })} style="left:22px;top:84px;width:516px">
            <div>yolks:nodejs_16</div><div>yolks:nodejs_18</div><div id="opt20" ${A({ on: '75.3,99' })}>yolks:nodejs_20</div><div>yolks:nodejs_21</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<div class="callout" ${A({ in: 67.4, fx: 'up', out: 73.5 })} style="left:520px;top:520px;width:640px">
  <b class="big">🥚 Egg: Node.js</b><span style="color:#c9d3e0;font-weight:500">Server bot wajib memakai egg Node.js (mis. <i>Node.js Generic</i>).</span>
</div>
<div class="callout" ${A({ in: 70.1, fx: 'up', out: 73.5 })} style="right:110px;top:760px;width:640px;border-color:rgba(60,207,126,.5)">
  <b class="big">🛒 Beli dari hosting?</b><span style="color:#c9d3e0;font-weight:500">Biasanya server Node.js <span style="color:#3ccf7e;font-weight:700">sudah disiapkan ✓</span></span>
</div>
<div class="callout" ${A({ in: 76.0, fx: 'pop', d: 0.4 })} style="left:640px;top:690px;width:640px;text-align:center;border-color:rgba(60,207,126,.5)">
  <b class="big" style="margin:0">✅ Node.js versi 20</b>
</div>`);

/* =====================================================================
   SCENE 4 — Upload file (77.47 – 103.20)
   ===================================================================== */
function fChip(id, ext, name, t, fly, extra = '') {
  return `<div ${A({ fly: fly, dx: 760, dy: 0 })} ${extra}><div class="fi card" id="${id}" style="padding:16px 22px;border-radius:14px;font-size:24px;background:#162236;width:340px" ${A({ in: t, fx: 'left' })}>${fIcon(ext)} <span class="mono">${name}</span></div></div>`;
}
function fRow(id, icon, name, size, date, a) {
  return `<div class="frow" id="${id}" ${a}>${icon}<span class="nm mono">${name}</span><span class="sz">${size}</span><span class="dt">${date}</span><span id="${id}d" style="width:40px;display:grid;place-items:center">${I.dots()}</span></div>`;
}
scene(77.47, 103.20, `
<div ${A({ vis: '0,85.45', out: 85.0, od: 0.4 })} class="abs" style="inset:0">
  <div class="card" style="position:absolute;left:250px;top:260px;width:480px;padding:34px" ${A({ in: 77.8, fx: 'up' })}>
    <div style="display:flex;align-items:center;gap:14px;font-size:30px;font-weight:800;margin-bottom:24px">${I.folder('#7cb7ff', 42)} bot-telegram/</div>
    <div style="display:flex;flex-direction:column;gap:14px">
      ${fChip('c1', 'json', 'package.json', 78.2, 80.9)}
      ${fChip('c2', 'js', 'index.js', 78.4, 81.3)}
      ${fChip('c3', 'env', '.env', 78.6, 81.7)}
      <div ${A({ shake: 83.0 })}><div class="fi card" style="padding:16px 22px;border-radius:14px;font-size:24px;background:#2a1820;width:340px;position:relative" ${A({ in: 78.8, fx: 'left' })}>${fIcon('dir')} <span class="mono">node_modules/</span>
        <span ${A({ in: 82.8, fx: 'pop' })} style="position:absolute;right:16px;top:8px;font-size:34px">❌</span></div></div>
    </div>
  </div>
  <div ${A({ in: 80.3, fx: 'fade' })} style="position:absolute;left:800px;top:470px;font-size:80px;color:#4ea8ff">➜</div>
  <div ${A({ in: 80.5, fx: 'pop', d: 0.6 })} style="position:absolute;left:1010px;top:310px;width:300px;height:340px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px" class="card">
    <div id="zipico">${I.zip('#facc15').replace('width="24" height="24"','width="150" height="150"')}</div><div class="mono" style="font-size:36px;font-weight:800;color:#facc15">bot.zip</div>
  </div>
  <div class="callout" ${A({ in: 83.2, fx: 'up' })} style="left:250px;top:800px;width:620px;border-color:rgba(255,93,108,.5)">
    <b class="big" style="margin:0">Jangan ikutkan <span class="mono" style="color:#ff8a95">node_modules</span></b>
  </div>
</div>
<div class="win pt" ${A({ in: 85.45, fx: 'zoom', d: 0.6 })}>
  ${ptNav()}${ptSub('Files')}
  <div class="pt-body">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:22px">
      <div class="mono" style="font-size:20px;color:var(--p-mut);padding:8px 14px;border-radius:8px;box-shadow:0 0 0 calc(var(--h,0)*3px) rgba(60,207,126,var(--h,0))" ${A({ hl: 94.3, hle: 99.2 })}>/ <span style="color:#fff">home</span> / <span style="color:#fff">container</span> /</div>
      <div style="display:flex;gap:14px">
        <span class="pbtn" style="background:#52606d">Create Directory</span>
        <span class="pbtn" id="upbtn" style="background:transparent;box-shadow:inset 0 0 0 2px #2b8ef0;color:#9ccbff">Upload</span>
        <span class="pbtn" style="background:#2b8ef0">New File</span>
      </div>
    </div>
    <div class="pcard" style="overflow:hidden;position:relative">
      <div ${A({ in: 93.3, fx: 'grow', mh: 70 })}>${fRow('fenv', fIcon('env'), '.env', '61 B', 'baru saja', A({ hl: 94.2, hle: 99.2 }))}</div>
      <div ${A({ in: 88.6, fx: 'grow', mh: 70, out: 100.95, od: 0.5 })}>${fRow('fzip', I.zip(), 'bot.zip', '2.1 KB', 'baru saja', '')}</div>
      <div ${A({ in: 93.0, fx: 'grow', mh: 70 })}>${fRow('fidx', fIcon('js'), 'index.js', '612 B', 'baru saja', A({ hl: 94.1, hle: 99.2 }))}</div>
      <div ${A({ in: 93.15, fx: 'grow', mh: 70 })}>${fRow('fpkg', fIcon('json'), 'package.json', '298 B', 'baru saja', A({ hl: 94.15, hle: 99.2 }))}</div>
      <div ${A({ vis: '0,88.6' })} style="padding:40px;text-align:center;color:var(--p-mut);font-size:19px">This directory seems to be empty.</div>
    </div>
    <div class="pcard" ${A({ in: 86.9, fx: 'up', out: 88.6, od: 0.25 })} style="position:absolute;right:60px;bottom:30px;width:460px;padding:20px 24px">
      <div style="display:flex;justify-content:space-between;font-size:18px;margin-bottom:12px"><span class="mono">bot.zip</span><span style="color:var(--p-mut)">Mengunggah…</span></div>
      <div style="height:8px;border-radius:4px;background:var(--p-in);overflow:hidden"><div style="height:100%;background:#2b8ef0;transform-origin:left;transform:scaleX(var(--p,0))" ${A({ p: 87.0, pe: 88.4 })}></div></div>
    </div>
    <div class="menu" ${A({ vis: '90.85,92.65', in: 90.85, fx: 'down', dy: 10, d: 0.2 })} style="right:110px;top:160px">
      <div>✏️ Rename</div><div>📁 Move</div><div>🔐 Permissions</div><div>📄 Copy</div><div id="mUnarc" ${A({ on: '91.9,99' })}>📦 Unarchive</div><div>⬇️ Download</div><div class="red">🗑️ Delete</div>
    </div>
    <div class="menu" ${A({ vis: '100.2,100.9', in: 100.2, fx: 'down', dy: 10, d: 0.2 })} style="right:110px;top:160px">
      <div>✏️ Rename</div><div>📁 Move</div><div>🔐 Permissions</div><div>📄 Copy</div><div>📦 Unarchive</div><div>⬇️ Download</div><div class="red" id="mDel" ${A({ on: '100.45,99', onc: 'on' })}>🗑️ Delete</div>
    </div>
  </div>
</div>
<div class="callout" ${A({ in: 95.0, fx: 'right', out: 99.4 })} style="right:120px;top:600px;width:700px">
  <div class="mono" style="font-size:22px;color:#3ccf7e">✅ /home/container/index.js</div>
  <div class="mono" style="font-size:22px;color:#ff8a95;margin-top:10px">❌ /home/container/bot-telegram/index.js</div>
  <div style="font-size:20px;color:#9fb0c4;margin-top:12px;font-weight:500">File harus langsung di folder utama, bukan subfolder.</div>
</div>
<div class="callout" ${A({ in: 101.1, fx: 'pop', d: 0.4 })} style="left:660px;top:700px;width:600px;text-align:center">
  <b class="big" style="margin:0">🗑️ bot.zip dihapus — selesai!</b>
</div>`);

/* =====================================================================
   SCENE 5 — Startup (103.20 – 117.35)
   ===================================================================== */
function pVar(title, val, desc, t, extra = '', inExtra = '') {
  return `<div class="pcard" ${A({ in: t, fx: 'up' })} ${extra}><h4>${title}</h4><div style="padding:18px 22px"><div class="pin" ${inExtra}>${val}</div><div style="color:var(--p-mut);font-size:15px;margin-top:10px">${desc}</div></div></div>`;
}
scene(103.20, 117.35, `
<div class="win pt" ${A({ in: 103.35, fx: 'zoom', d: 0.6 })}>
  ${ptNav()}${ptSub('Startup')}
  <div class="pt-body">
    <div class="pcard" ${A({ in: 103.7, fx: 'up' })}><h4>Startup Command</h4>
      <div class="mono" style="padding:20px 22px;font-size:17.5px;color:#cbd2d9;line-height:1.65">if [[ -d .git ]] &amp;&amp; [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [ -f /home/container/package.json ]; then <span style="padding:2px 6px;border-radius:6px;background:rgba(60,207,126,calc(var(--h,0)*.3));box-shadow:0 0 0 calc(var(--h,0)*2px) #3ccf7e;color:#fff" ${A({ hl: 112.5 })}>/usr/local/bin/npm install</span>; fi; <span style="padding:2px 6px;border-radius:6px;background:rgba(43,142,240,calc(var(--h,0)*.3));box-shadow:0 0 0 calc(var(--h,0)*2px) #2b8ef0;color:#fff" ${A({ hl: 109.6, hle: 112.3 })}>/usr/local/bin/node /home/container/{{JS_FILE}}</span></div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:22px;margin-top:22px">
      ${pVar('Git Repo Address', '<span style="color:#6b7785">—</span>', 'GitHub repo untuk di-clone (opsional).', 104.1)}
      ${pVar('Auto Update', '0', 'Tarik update git otomatis saat start.', 104.25)}
      ${pVar('Additional Node Packages', '<span style="color:#6b7785">—</span>', 'Paket tambahan (opsional).', 104.4)}
      ${pVar('Main File', '<span id="mainin" ' + A({ type: 107.7, cps: 9 }) + '>index.js</span>', 'File utama yang dijalankan oleh node.', 104.55, A({ hl: 105.9, hle: 112.0 }) + ' style="box-shadow:0 0 0 calc(var(--h,0)*4px) rgba(43,142,240,var(--h,0))"', A({ hl: 106.8, hle: 109.6 }))}
      ${pVar('Install Branch', '<span style="color:#6b7785">—</span>', 'Branch git (opsional).', 104.7)}
      ${pVar('Docker Image', 'yolks:nodejs_20', 'Versi Node.js.', 104.85)}
    </div>
  </div>
</div>
<div class="abs" style="left:160px;right:160px;top:930px;display:flex;justify-content:center;align-items:center;gap:22px;font-size:26px;font-weight:700">
  <span class="chip" ${A({ in: 112.6, fx: 'pop' })} style="background:rgba(60,207,126,.15);border-color:rgba(60,207,126,.5);color:#c9f7dc">▶ Start</span>
  <span ${A({ in: 113.0, fx: 'fade' })} style="color:#55657c">➜</span>
  <span class="chip" ${A({ in: 113.3, fx: 'pop' })}>📦 npm install</span>
  <span ${A({ in: 113.7, fx: 'fade' })} style="color:#55657c">➜</span>
  <span class="chip" ${A({ in: 114.0, fx: 'pop' })}>🚀 node index.js</span>
  <span class="chip" ${A({ in: 114.9, fx: 'pop' })} style="background:rgba(255,181,71,.14);border-color:rgba(255,181,71,.5);color:#ffe0ad;margin-left:20px">✨ otomatis, tanpa install manual</span>
</div>`);

/* =====================================================================
   SCENE 6 — Console + uji Telegram (117.35 – 134.69)
   ===================================================================== */
function sCard(label, val) {
  return `<div class="pcard" style="padding:18px 22px;display:flex;align-items:center;gap:16px"><div style="width:46px;height:46px;border-radius:8px;background:var(--p-in);display:grid;place-items:center">${I.server('#9aa5b1', 22)}</div><div><div style="font-size:13px;color:var(--p-mut);letter-spacing:.12em">${label}</div><div style="font-size:20px;font-weight:700;margin-top:4px">${val}</div></div></div>`;
}
const confetti = (() => {
  let s = 7, out = '';
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const cols = ['#4ea8ff', '#3ccf7e', '#ffb547', '#ff5d6c', '#9b7bff', '#6ab3f3'];
  for (let i = 0; i < 90; i++) {
    const a = rnd() * Math.PI * 2, v = 380 + rnd() * 620;
    out += `<i class="cf" data-vx="${(Math.cos(a) * v).toFixed(1)}" data-vy="${(Math.sin(a) * v - 420).toFixed(1)}" data-r="${(rnd() * 720 - 360).toFixed(0)}" style="position:absolute;left:960px;top:540px;width:${10 + rnd() * 10 | 0}px;height:${6 + rnd() * 8 | 0}px;background:${cols[i % cols.length]};border-radius:2px;opacity:0"></i>`;
  }
  return out;
})();
scene(117.35, 127.46, `
<div class="win pt" ${A({ in: 117.5, fx: 'zoom', d: 0.6 })}>
  ${ptNav()}${ptSub('Console')}
  <div class="pt-body" style="padding-top:22px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
      <div style="display:flex;align-items:center;gap:16px;font-size:28px;font-weight:800">Bot Telegram
        <span ${A({ vis: '0,121.9' })} style="font-size:15px;padding:5px 12px;border-radius:999px;background:rgba(255,93,108,.18);color:#ff8a95;font-weight:700">● OFFLINE</span>
        <span ${A({ vis: '121.9,125.3' })} style="font-size:15px;padding:5px 12px;border-radius:999px;background:rgba(250,204,21,.18);color:#facc15;font-weight:700">● STARTING</span>
        <span ${A({ vis: '125.3,999' })} style="font-size:15px;padding:5px 12px;border-radius:999px;background:rgba(60,207,126,.18);color:#4ade80;font-weight:700">● RUNNING</span>
      </div>
      <div style="display:flex;gap:12px">
        <span class="pbtn" id="startbtn" style="background:#16a34a;box-shadow:0 0 0 calc(var(--h,0)*4px) rgba(74,222,128,var(--h,0))" ${A({ hl: 120.9, hle: 122.4 })}>${I.play()} Start</span>
        <span class="pbtn" style="background:#52606d">Restart</span>
        <span class="pbtn" style="background:#dc2626">Stop</span>
      </div>
    </div>
    <div style="display:flex;gap:22px">
      <div class="console" style="flex:1;height:560px">
        <div style="color:#7b8794">[Pterodactyl Daemon]: Server is offline.</div>
        <div ${A({ in: 121.95, fx: 'fade', d: 0.1 })} class="y">container@pterodactyl~ Server marked as starting...</div>
        <div ${A({ in: 122.4, fx: 'fade', d: 0.1 })}><span class="b">:/home/container$</span> /usr/local/bin/npm install</div>
        <div ${A({ in: 123.0, fx: 'fade', d: 0.1 })} style="color:#9aa5b1">up to date, audited 16 packages in 1s</div>
        <div ${A({ in: 123.5, fx: 'fade', d: 0.1 })}><span class="b">:/home/container$</span> /usr/local/bin/node /home/container/index.js</div>
        <div ${A({ in: 124.2, fx: 'fade', d: 0.1 })}>Menyalakan bot...</div>
        <div ${A({ in: 125.0, fx: 'fade', d: 0.1 })} class="g">Bot berjalan (mode polling)...</div>
        <div ${A({ in: 125.3, fx: 'fade', d: 0.1 })} class="y">container@pterodactyl~ Server marked as running...</div>
        <div style="margin-top:8px;opacity:.6">▊</div>
      </div>
      <div style="width:330px;display:flex;flex-direction:column;gap:14px">
        ${sCard('ADDRESS', '103.152.118.20:2007')}
        ${sCard('UPTIME', '<span id="uptime">Offline</span>')}
        ${sCard('CPU LOAD', '<span id="cpu">0.00%</span> <span style="color:#7b8794;font-weight:500">/ 100%</span>')}
        ${sCard('MEMORY', '<span id="mem">0 B</span> <span style="color:#7b8794;font-weight:500">/ 512 MB</span>')}
        ${sCard('DISK', '31.2 MB <span style="color:#7b8794;font-weight:500">/ 2 GB</span>')}
      </div>
    </div>
  </div>
</div>
<div class="callout" ${A({ in: 125.4, fx: 'pop', d: 0.45 })} style="left:560px;top:820px;width:640px;text-align:center;border-color:rgba(60,207,126,.6)">
  <b class="big" style="margin:0">✅ Bot sudah berjalan!</b>
</div>`);

scene(127.46, 134.69, `
<div class="win tg" ${A({ in: 127.6, fx: 'zoom', d: 0.6 })}>
  <div class="tg-side">
    <div class="tg-top"><div class="tg-burger"></div><div class="tg-search">${I.search()} Search</div></div>
    <div class="tg-list">
      <div class="tg-item sel"><div class="av" style="background:linear-gradient(135deg,#7bc862,#3a9d5d)">TB</div><div class="meta"><div class="nm">Toko Bot</div><div class="pv" style="color:#b5cde3">bot</div></div><div class="tm" style="color:#b5cde3">10:31</div></div>
      ${tgItem('BF', 'linear-gradient(135deg,#59a7ea,#2f6fb8)', 'BotFather', 'Done! Congratulations on your new bot…', '10:22', '', true)}
      ${tgItem('GD', '#e17076', 'Grup Developer', 'Raka: udah deploy belum?', '08:47')}
      ${tgItem('KN', '#7bc862', 'Kantor', 'Meeting jam 10 ya', 'Sen')}
    </div>
  </div>
  <div class="tg-main">
    <div class="tg-head"><div class="av" style="width:50px;height:50px;font-size:19px;background:linear-gradient(135deg,#7bc862,#3a9d5d)">TB</div>
      <div><div class="nm">Toko Bot</div><div class="st"><span ${A({ vis: '0,129.5' })}>bot</span><span class="typing" ${A({ vis: '129.5,131.0' })}>typing…</span><span ${A({ vis: '131.0,999' })}>bot</span></div></div></div>
    <div class="tg-msgs">
      <div ${A({ vis: '0,129.05' })} style="align-self:center;margin-bottom:220px;background:rgba(0,0,0,.3);border-radius:18px;padding:26px 34px;max-width:520px;text-align:center;color:#c8d6e5">
        <b style="font-size:22px;color:#fff">What can this bot do?</b><br><span style="font-size:19px">Bot toko online — dijalankan di panel Pterodactyl.</span></div>
      ${tgMsg('out', 129.05, '/start', '10:31')}
      ${tgMsg('in', 131.0, 'Halo! Bot aktif di Pterodactyl 🚀', '10:31')}
    </div>
    <div class="tg-input">${I.clip()}
      <div class="txt" ${A({ vis: '0,128.3' })}>Write a message…</div>
      <div class="txt has" ${A({ vis: '128.3,129.05', type: 128.35, cps: 12 })}>/start</div>
      <div class="txt" ${A({ vis: '129.05,999' })}>Write a message…</div>
      <div class="sendbtn">${I.send()}</div>
    </div>
  </div>
</div>
<div id="confetti" class="abs" style="inset:0">${confetti}</div>
<div ${A({ in: 131.6, fx: 'pop', d: 0.6 })} class="abs" style="left:0;right:0;top:420px;display:flex;justify-content:center">
  <div style="padding:30px 60px;border-radius:30px;background:linear-gradient(135deg,rgba(22,163,74,.95),rgba(16,120,90,.95));box-shadow:0 30px 90px rgba(22,163,74,.45);font-size:64px;font-weight:900;letter-spacing:-.02em">🎉 Bot sudah ONLINE!</div>
</div>`, 'tgtest');

/* =====================================================================
   SCENE 7 — Troubleshooting (134.69 – 158.75)
   ===================================================================== */
function errCard(x, y, t, hle, code, title, body) {
  return `<div class="err card" ${A({ in: t, fx: 'up', d: 0.5 })} ${A({ hl: t, hle })} style="left:${x}px;top:${y}px;border-color:rgba(255,93,108,calc(.15 + var(--h,0)*.6));box-shadow:0 20px 60px rgba(0,0,0,.4),0 0 calc(var(--h,0)*50px) rgba(255,93,108,calc(var(--h,0)*.35))">
    <div class="code2">${code}</div><h3>${title}</h3><p>${body}</p></div>`;
}
scene(134.69, 158.75, `
<div class="abs" style="left:160px;top:80px">
  <span class="chip" ${A({ in: 134.9, fx: 'up' })} style="background:rgba(255,93,108,.12);border-color:rgba(255,93,108,.4);color:#ffc2c8">🛠️ PEMECAHAN MASALAH</span>
  <div ${A({ in: 135.2, fx: 'up', d: 0.6 })} style="font-size:56px;font-weight:900;margin-top:18px;letter-spacing:-.02em">Masalah yang sering muncul</div>
</div>
${errCard(160, 290, 139.11, 143.9, 'Error: Cannot find module \'telegraf\'', '📦 Cannot find module', 'Library belum ter-install atau file ada di subfolder → <b>taruh package.json di folder utama, lalu Restart.</b>')}
${errCard(1000, 290, 144.03, 148.3, '409: Conflict: terminated by other getUpdates request', '⚔️ 409 Conflict', 'Bot masih menyala di tempat lain dengan token yang sama → <b>matikan bot di komputer.</b>')}
${errCard(160, 640, 148.48, 154.2, '401: Unauthorized', '🔑 401 Unauthorized', 'Token yang dipakai salah → <b>salin ulang token dari BotFather.</b>')}
${errCard(1000, 640, 154.40, 158.7, 'Killed  (out of memory)', '💥 Server mati sendiri', 'Kemungkinan RAM-nya kurang → <b>naikkan limit memori server.</b>')}
`);

/* =====================================================================
   SCENE 8 — Tips (158.75 – 177.15)
   ===================================================================== */
scene(158.75, 177.15, `
<div class="abs" style="left:160px;top:80px">
  <span class="chip" ${A({ in: 158.9, fx: 'up' })} style="background:rgba(255,181,71,.12);border-color:rgba(255,181,71,.45);color:#ffe0ad">💡 TIPS</span>
  <div ${A({ in: 159.2, fx: 'up', d: 0.6 })} style="font-size:56px;font-weight:900;margin-top:18px;letter-spacing:-.02em">Biar bot aman &amp; awet</div>
</div>
<div class="tip card" ${A({ in: 163.28, fx: 'up', d: 0.6 })} ${A({ hl: 163.28, hle: 165.4 })} style="left:160px;border-color:rgba(78,168,255,calc(.1 + var(--h,0)*.6))">
  <div style="height:230px;border-radius:16px;background:#0e1621;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px">
    <div style="font-size:84px">🛡️</div>
    <div class="mono" style="font-size:20px;color:#ffd18a;padding:6px 14px;border-radius:8px;background:rgba(255,209,138,.1)">7712045893:••••••••••••</div>
  </div>
  <h3>Rahasiakan token</h3><p>Jangan pernah bagikan token bot kamu. Kalau bocor, <b style="color:#fff">/revoke</b> di BotFather.</p>
</div>
<div class="tip card" ${A({ in: 165.55, fx: 'up', d: 0.6 })} ${A({ hl: 165.55, hle: 168.0 })} style="left:710px;border-color:rgba(78,168,255,calc(.1 + var(--h,0)*.6))">
  <div style="height:230px;border-radius:16px;background:var(--p-page);padding:22px;display:flex;flex-direction:column;gap:16px">
    <div style="display:flex;justify-content:space-between;align-items:center;font-size:18px;font-weight:700;color:var(--p-ink)">Backups <span class="pbtn" style="background:#2b8ef0;padding:9px 16px;font-size:15px">Create Backup</span></div>
    <div ${A({ in: 166.6, fx: 'up' })} class="pcard" style="padding:14px 16px;font-size:16px;display:flex;justify-content:space-between;align-items:center"><span>📦 <span class="mono">backup-bot.tar.gz</span></span><span style="color:#4ade80">✓ 12 MB</span></div>
    <div ${A({ in: 167.0, fx: 'up' })} class="pcard" style="padding:14px 16px;font-size:16px;display:flex;justify-content:space-between;align-items:center;opacity:.7"><span>📦 <span class="mono">backup-lama.tar.gz</span></span><span style="color:#9aa5b1">11 MB</span></div>
  </div>
  <h3>Backups</h3><p>Buat backup dulu sebelum mengubah file penting.</p>
</div>
<div class="tip card" ${A({ in: 168.18, fx: 'up', d: 0.6 })} ${A({ hl: 168.18, hle: 176.5 })} style="left:1260px;border-color:rgba(78,168,255,calc(.1 + var(--h,0)*.6))">
  <div style="height:230px;border-radius:16px;background:var(--p-page);padding:22px;display:flex;flex-direction:column;gap:14px">
    <div style="font-size:18px;font-weight:700;color:var(--p-ink)">Schedules</div>
    <div class="pcard" style="padding:16px 18px">
      <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:19px">🔁 Restart Harian</b>
        <span ${A({ vis: '0,170.6' })} style="font-size:13px;padding:4px 10px;border-radius:999px;background:#52606d">INACTIVE</span>
        <span ${A({ vis: '170.6,999' })} style="font-size:13px;padding:4px 10px;border-radius:999px;background:#16a34a">ACTIVE</span></div>
      <div class="mono" style="font-size:16px;color:var(--p-mut);margin-top:10px">0 4 * * *  ·  setiap hari 04:00</div>
      <div style="font-size:15px;color:#9ccbff;margin-top:8px">Task: Send power action → restart</div>
    </div>
  </div>
  <h3>Schedules</h3><p>Restart bot otomatis setiap hari.</p>
</div>`);

/* =====================================================================
   SCENE 9 — Ringkasan (177.15 – 186.35)
   ===================================================================== */
const recap = [
  ['🤖', 'Buat bot', '@BotFather', 177.6],
  ['💻', 'Siapkan kode', 'package.json + index.js', 179.3],
  ['⬆️', 'Upload', 'Panel Pterodactyl', 180.4],
  ['⚙️', 'Atur Main File', 'index.js', 181.6],
  ['▶️', 'Klik Start', 'Bot online ✓', 182.5],
];
scene(177.15, 186.35, `
<div class="abs" style="left:0;right:0;top:150px;text-align:center">
  <span class="chip" ${A({ in: 177.3, fx: 'up' })}>📋 RINGKASAN</span>
</div>
<div class="abs" style="left:320px;width:1280px;top:503px;height:6px;border-radius:3px;background:rgba(255,255,255,.08)">
  <div style="height:100%;border-radius:3px;background:linear-gradient(90deg,#4ea8ff,#9b7bff,#3ccf7e);transform-origin:left;transform:scaleX(var(--p,0))" ${A({ p: 177.6, pe: 182.6 })}></div>
</div>
${recap.map(([ic, b, s, t], i) => `<div class="node" style="left:${320 + i * 320 - 125}px" ${A({ in: (177.4 + i * 0.12).toFixed(2), fx: 'up' })} ${A({ hl: t })}>
  <div class="ring" style="font-size:64px">${ic}</div><b>${i + 1}. ${b}</b><small>${s}</small></div>`).join('')}
<div class="abs" style="left:0;right:0;top:800px;text-align:center">
  <div class="big-title grad" ${A({ in: 183.35, fx: 'pop', d: 0.6 })} style="font-size:96px">Mudah, kan? <span style="-webkit-text-fill-color:initial;color:#fff">😉</span></div>
</div>`);

/* =====================================================================
   SCENE 10 — Outro (186.35 – 192.04)
   ===================================================================== */
scene(186.35, 192.5, `
<div class="abs" style="left:0;right:0;top:250px;display:flex;justify-content:center;gap:40px">
  <div ${A({ in: 186.5, fx: 'pop' })}>${I.tg(110)}</div>
  <div ${A({ in: 186.65, fx: 'pop' })}>${I.node(110)}</div>
  <div ${A({ in: 186.8, fx: 'pop' })}>${I.panel(110)}</div>
</div>
<div class="abs" style="left:0;right:0;top:450px;text-align:center">
  <div class="big-title" ${A({ in: 186.6, fx: 'up', d: 0.7 })} style="font-size:110px">Terima kasih! 🙏</div>
  <div ${A({ in: 187.6, fx: 'up' })} style="font-size:44px;font-weight:700;margin-top:30px;color:#c9d3e0">Semoga bermanfaat</div>
  <div ${A({ in: 188.6, fx: 'up' })} style="font-size:40px;font-weight:600;margin-top:16px" ><span class="grad">Sampai jumpa di video berikutnya</span> 👋</div>
</div>`);

/* ---------- HUD ---------- */
const steps = [
  [14.17, 33.95, 'Buat bot di BotFather'],
  [33.95, 63.80, 'Siapkan kode bot'],
  [63.80, 77.47, 'Siapkan server Pterodactyl'],
  [77.47, 103.20, 'Upload file bot'],
  [103.20, 117.35, 'Atur Startup'],
  [117.35, 134.69, 'Jalankan & uji bot'],
];

/* ---------- Cursor keyframes [waktu, target, klik] ---------- */
const CUR = [
  [16.2, [1500, 900]], [16.8, '#tgsearch', 1], [17.9, '#bfres', 1], [18.55, '#tginput1'],
  [66.5, [1450, 900]], [67.2, '#row1 .nm'], [68.6, '#row1 .nm'],
  [73.9, [1250, 950]], [74.5, '#dsel', 1], [75.8, '#opt20', 1], [76.6, '#opt20'],
  [85.8, [1300, 950]], [86.5, '#upbtn', 1], [90.75, '#fzipd', 1], [91.95, '#mUnarc', 1], [92.8, '#mUnarc'],
  [99.3, [1500, 950]], [100.1, '#fzipd', 1], [100.5, '#mDel', 1], [101.2, '#mDel'],
  [106.0, [1400, 990]], [106.8, '#mainin', 1], [107.8, '#mainin'],
  [120.6, [1300, 950]], [121.4, '#startbtn', 1], [122.4, '#startbtn'],
];
const CUR_SEG = [[16.2, 18.7], [66.5, 68.7], [73.9, 76.7], [85.8, 92.9], [99.3, 101.3], [106.0, 107.9], [120.6, 122.5]];

/* =====================================================================
   ENGINE
   ===================================================================== */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const E = {
  out: (x) => 1 - Math.pow(1 - x, 3),
  io: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  back: (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
};
const prog = (t, t0, d) => clamp((t - t0) / d);

const root = document.getElementById('scenes');
const SC = scenes.map((s) => {
  const el = document.createElement('div');
  el.className = 'scene';
  if (s.id) el.id = s.id;
  el.innerHTML = s.html;
  root.appendChild(el);
  return { ...s, el, items: [...el.querySelectorAll('*')].filter((n) => Object.keys(n.dataset).length) };
});
SC.forEach((s) => s.items.forEach((n) => { if (n.dataset.type) n.dataset.full = n.textContent; }));

const hud = document.getElementById('hud');
hud.innerHTML = steps.map(([a, b, t], i) => `<div class="step" data-s="${a}" data-e="${b}"><div class="n">${i + 1}</div><div class="t"><small>LANGKAH ${i + 1} DARI 6</small><b>${t}</b></div></div>`).join('');
const HS = [...hud.children];
const progEl = document.getElementById('prog');
progEl.innerHTML = steps.map(() => '<i><b></b></i>').join('');
const PB = [...progEl.querySelectorAll('b')];

function applyItem(n, t) {
  const d = n.dataset;
  let op = 1, tf = '';
  if (d.vis) {
    const [a, b] = d.vis.split(',').map(Number);
    const on = t >= a && t < b;
    n.style.display = on ? '' : 'none';
    if (!on) return;
  }
  if (d.in !== undefined) {
    const dur = +(d.d || 0.5), fx = d.fx || 'up';
    const r = prog(t, +d.in, dur), p = E.out(r);
    if (fx === 'grow') {
      const q = d.out ? 1 - E.out(prog(t, +d.out, +(d.od || 0.3))) : 1;
      n.style.maxHeight = (p * q * +(d.mh || 80)).toFixed(1) + 'px';
      n.style.opacity = Math.min(r * 1.4, 1) * q;
      n.style.overflow = 'hidden';
      return;
    }
    op = fx === 'pop' ? clamp(r * 2) : p;
    const dy = +(d.dy || 30), dx = +(d.dx || 40);
    if (fx === 'up') tf = `translateY(${((1 - p) * dy).toFixed(1)}px)`;
    else if (fx === 'down') tf = `translateY(${(-(1 - p) * dy).toFixed(1)}px)`;
    else if (fx === 'left') tf = `translateX(${(-(1 - p) * dx).toFixed(1)}px)`;
    else if (fx === 'right') tf = `translateX(${((1 - p) * dx).toFixed(1)}px)`;
    else if (fx === 'pop') tf = `scale(${(0.5 + 0.5 * E.back(r)).toFixed(4)})`;
    else if (fx === 'zoom') tf = `scale(${(1.06 - 0.06 * p).toFixed(4)}) translateY(${((1 - p) * 40).toFixed(1)}px)`;
  }
  if (d.out !== undefined) op *= 1 - E.out(prog(t, +d.out, +(d.od || 0.3)));
  if (d.fly !== undefined) {
    const p = E.io(prog(t, +d.fly, 0.75));
    tf += ` translate(${(p * +d.dx).toFixed(1)}px,${(p * +d.dy - Math.sin(p * Math.PI) * 120).toFixed(1)}px) scale(${(1 - 0.7 * p).toFixed(3)})`;
    op *= p > 0.85 ? 1 - (p - 0.85) / 0.15 : 1;
  }
  if (d.shake !== undefined) {
    const r = prog(t, +d.shake, 0.6);
    if (r > 0 && r < 1) tf += ` translateX(${(Math.sin(r * 40) * 14 * (1 - r)).toFixed(1)}px)`;
    if (t > +d.shake + 1.2) op *= 1 - E.out(prog(t, +d.shake + 1.2, 0.5)) * 0.65;
  }
  if (d.in !== undefined || d.out !== undefined || d.fly !== undefined || d.shake !== undefined) {
    n.style.opacity = op.toFixed(3);
    n.style.transform = tf;
  }
  if (d.type !== undefined) {
    const full = d.full, cps = +(d.cps || 30);
    const k = Math.max(0, Math.min(full.length, Math.floor((t - +d.type) * cps)));
    n.textContent = t < +d.type ? (d.vis ? '' : full.slice(0, 0)) : full.slice(0, k);
    const typing = t >= +d.type - 0.3 && k < full.length;
    n.classList.toggle('caret', typing);
  }
  if (d.hl !== undefined) {
    const a = +d.hl, b = d.hle !== undefined ? +d.hle : 1e9;
    const h = E.out(prog(t, a, 0.35)) * (1 - E.out(prog(t, b, 0.35)));
    n.style.setProperty('--h', h.toFixed(3));
  }
  if (d.p !== undefined) n.style.setProperty('--p', clamp((t - +d.p) / (+d.pe - +d.p)).toFixed(4));
  if (d.on !== undefined) {
    const [a, b] = d.on.split(',').map(Number);
    n.classList.toggle(d.onc || 'on', t >= a && t < b);
  }
}

const cursor = document.getElementById('cursor'), ripple = document.getElementById('ripple');
const lastPos = {};
function targetPos(tg, i) {
  if (Array.isArray(tg)) return tg;
  const el = document.querySelector(tg);
  if (el) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && el.offsetParent !== null) {
      lastPos[i] = [r.left + r.width / 2, r.top + r.height / 2];
    }
  }
  return lastPos[i] || [960, 540];
}
function updateCursor(t) {
  const seg = CUR_SEG.find(([a, b]) => t >= a && t <= b);
  if (!seg) { cursor.style.opacity = 0; ripple.style.opacity = 0; return; }
  const vis = Math.min(prog(t, seg[0], 0.25), 1 - prog(t, seg[1] - 0.25, 0.25));
  let i = 0;
  while (i < CUR.length - 1 && CUR[i + 1][0] <= t) i++;
  const a = CUR[i], b = CUR[i + 1];
  let [x, y] = targetPos(a[1], i);
  if (b && b[0] > t) {
    const [x2, y2] = targetPos(b[1], i + 1);
    const md = Math.min(0.75, b[0] - a[0]);
    const p = E.io(prog(t, b[0] - md, md));
    x += (x2 - x) * p; y += (y2 - y) * p;
  }
  let sc = 1;
  const clicks = CUR.filter((k) => k[2] && t >= k[0] && t < k[0] + 0.45);
  if (clicks.length) {
    const r = (t - clicks[0][0]) / 0.45;
    sc = 1 - 0.18 * Math.sin(r * Math.PI);
    ripple.style.opacity = ((1 - r) * vis).toFixed(3);
    ripple.style.transform = `translate(${x - 35}px,${y - 35}px) scale(${0.3 + r})`;
  } else ripple.style.opacity = 0;
  cursor.style.opacity = vis.toFixed(3);
  cursor.style.transform = `translate(${x - 8}px,${y - 4}px) scale(${sc})`;
}

function render(t) {
  // latar
  const b1 = document.getElementById('b1'), b2 = document.getElementById('b2'), b3 = document.getElementById('b3');
  b1.style.transform = `translate(${Math.sin(t * 0.13) * 120}px,${Math.cos(t * 0.11) * 80}px)`;
  b2.style.transform = `translate(${Math.cos(t * 0.09) * 140}px,${Math.sin(t * 0.12) * 90}px)`;
  b3.style.transform = `translate(${Math.sin(t * 0.07) * 200}px,${Math.cos(t * 0.1) * 120}px)`;
  // adegan
  for (const s of SC) {
    const on = t >= s.s - 0.3 && t < s.e + 0.35;
    s.el.style.display = on ? 'block' : 'none';
    if (!on) continue;
    const fi = E.out(prog(t, s.s - 0.3, 0.55));
    const fo = 1 - E.io(prog(t, s.e - 0.15, 0.45));
    s.el.style.opacity = Math.min(fi, fo).toFixed(3);
    s.el.style.transform = `scale(${(1 + 0.03 * (1 - fo)).toFixed(4)})`;
    for (const n of s.items) applyItem(n, t);
  }
  // HUD
  HS.forEach((h) => {
    const a = +h.dataset.s, b = +h.dataset.e;
    const p = E.out(prog(t, a + 0.1, 0.5)) * (1 - E.out(prog(t, b - 0.25, 0.3)));
    h.style.display = p > 0 ? 'flex' : 'none';
    h.style.opacity = p.toFixed(3);
    h.style.transform = `translateX(${(-(1 - p) * 40).toFixed(1)}px)`;
  });
  const pv = E.out(prog(t, 14.2, 0.5)) * (1 - E.out(prog(t, 134.5, 0.4)));
  progEl.style.opacity = pv.toFixed(3);
  PB.forEach((b, i) => b.style.setProperty('--p', clamp((t - steps[i][0]) / (steps[i][1] - steps[i][0])).toFixed(4)));
  // detail dinamis
  const pulse = document.getElementById('pulse');
  if (pulse) pulse.style.boxShadow = `0 0 0 ${(8 + Math.sin(t * 5) * 6).toFixed(1)}px rgba(60,207,126,.25)`;
  const up = document.getElementById('uptime');
  if (up) {
    if (t < 125.3) up.textContent = t < 121.9 ? 'Offline' : 'Starting';
    else { const s = Math.floor(t - 125.3); up.textContent = `00:00:${String(s).padStart(2, '0')}`; }
  }
  const cpu = document.getElementById('cpu'), mem = document.getElementById('mem');
  if (cpu) {
    if (t < 121.9) { cpu.textContent = '0.00%'; mem.textContent = '0 B'; }
    else {
      const k = Math.floor(t * 4);
      const rnd = (Math.sin(k * 12.9898) * 43758.5453) % 1;
      const boot = t < 125.3;
      cpu.textContent = (boot ? 18 + Math.abs(rnd) * 30 : 0.2 + Math.abs(rnd) * 1.2).toFixed(2) + '%';
      mem.textContent = (boot ? 24 + (t - 121.9) * 7 : 48 + Math.abs(rnd) * 3).toFixed(1) + ' MB';
    }
  }
  // konfeti
  const cf = document.querySelectorAll('#confetti .cf');
  const ct = t - 131.6;
  cf.forEach((c) => {
    if (ct < 0 || ct > 2.6) { c.style.opacity = 0; return; }
    const vx = +c.dataset.vx, vy = +c.dataset.vy;
    const x = vx * ct, y = vy * ct + 0.5 * 900 * ct * ct;
    c.style.opacity = (1 - Math.max(0, ct - 1.8) / 0.8).toFixed(2);
    c.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${(+c.dataset.r * ct).toFixed(0)}deg)`;
  });
  // fade akhir
  document.getElementById('stage').style.opacity = (1 - prog(t, DURATION - 0.6, 0.6)).toFixed(3);
  updateCursor(t);
}
window.render = render;
window.DURATION = DURATION;
const q = new URLSearchParams(location.search);
if (q.has('t')) render(+q.get('t'));
else if (!navigator.webdriver) {
  // pratinjau: putar langsung di browser bersama audio jika ada
  const t0 = performance.now();
  const loop = () => { render(((performance.now() - t0) / 1000) % DURATION); requestAnimationFrame(loop); };
  loop();
}
