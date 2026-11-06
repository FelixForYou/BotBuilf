import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Chip, Corners, MaskWords, Panel, SectionLabel, Sfx, Typewriter, clamp, easeInOut, prog, typeDuration} from '../components/fx';
import {Icon} from '../components/Icons';
import {cue, scene} from '../timeline';
import {C, FACTS, FONT} from '../theme';

/* ------------------------------- Terminal -------------------------------- */
const CMD1 = 'docker pull bkimminich/juice-shop';
const CMD2 = 'docker run --rm -p 127.0.0.1:3000:3000 bkimminich/juice-shop';

const Terminal: React.FC<{start: number}> = ({start}) => {
  const f = useCurrentFrame();
  const c1 = start + 10;
  const o1 = c1 + typeDuration(CMD1, 40) + 8;
  const c2 = o1 + 34;
  const o2 = c2 + typeDuration(CMD2, 48) + 8;
  const line = (at: number, txt: React.ReactNode, color = C.muted) =>
    f >= at ? <div style={{color, opacity: prog(f, at, at + 6)}}>{txt}</div> : null;
  return (
    <div style={{fontFamily: FONT.mono, fontSize: 25, lineHeight: 1.75, color: C.text}}>
      <div>
        <span style={{color: C.green}}>user@lab</span>
        <span style={{color: C.muted}}>:~$ </span>
        <Typewriter text={CMD1} start={c1} cps={40} caret={f < o1} />
      </div>
      {line(o1, 'latest: Pulling from bkimminich/juice-shop')}
      {line(o1 + 12, 'Status: Downloaded newer image for bkimminich/juice-shop:latest')}
      {f >= c2 && (
        <div>
          <span style={{color: C.green}}>user@lab</span>
          <span style={{color: C.muted}}>:~$ </span>
          <Typewriter text={CMD2} start={c2} cps={48} caret={f < o2} />
        </div>
      )}
      {line(
        o2,
        <span>
          info: <span style={{color: C.cyan}}>Server listening on port </span>
          <span style={{color: C.cyan, fontWeight: 700}}>3000</span>
        </span>,
        C.green,
      )}
    </div>
  );
};

/* ------------------------------ Score Board ------------------------------ */
const DIFF = [13, 19, 27, 26, 19, 12]; // challenges per difficulty (1..6 stars)
const CHALLS: [string, string, number][] = [
  ['Score Board', 'Miscellaneous', 1],
  ['Privacy Policy', 'Miscellaneous', 1],
  ['DOM XSS', 'XSS', 1],
  ['Zero Stars', 'Improper Input Validation', 1],
  ['Login Admin', 'Injection', 2],
  ['View Basket', 'Broken Access Control', 2],
];

const Stars: React.FC<{n: number; size?: number; color?: string}> = ({n, size = 18, color = C.amber}) => (
  <span style={{display: 'inline-flex', gap: 2}}>
    {new Array(n).fill(0).map((_, i) => (
      <Icon key={i} name="star" size={size} color={color} fill={color} stroke={1} />
    ))}
  </span>
);

const ScoreBoard: React.FC<{start: number; solveAt: number; hiAt: number}> = ({start, solveAt, hiAt}) => {
  const f = useCurrentFrame();
  const solved = f >= solveAt ? 1 : 0;
  const ring = prog(f, solveAt, solveAt + 30);
  const toast = interpolate(f, [solveAt, solveAt + 14, solveAt + 150, solveAt + 170], [0, 1, 1, 0], clamp);
  const hi = prog(f, hiAt, hiAt + 24);
  return (
    <div style={{position: 'absolute', inset: 0, background: '#0f1520', fontFamily: FONT.body, color: C.text}}>
      {/* app bar */}
      <div style={{height: 64, background: '#1b2433', display: 'flex', alignItems: 'center', gap: 16, padding: '0 28px'}}>
        <Img src={staticFile('juiceshop-logo.svg')} style={{height: 40}} />
        <span style={{fontSize: 24, fontWeight: 600}}>OWASP Juice Shop</span>
        <span style={{marginLeft: 'auto', fontFamily: FONT.mono, fontSize: 18, color: C.muted}}>Score Board</span>
      </div>
      <div style={{padding: '26px 34px', display: 'flex', gap: 30}}>
        {/* progress */}
        <div style={{width: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
          <svg width={200} height={200} viewBox="-100 -100 200 200">
            <circle r={84} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={14} />
            <circle r={84} fill="none" stroke={C.green} strokeWidth={14} strokeLinecap="round" pathLength={1000} strokeDasharray={`${Math.max(1, (solved / FACTS.challenges) * 1000 * ring) + ring * 40} 1000`} transform="rotate(-90)" />
            <text y={-4} textAnchor="middle" fill={C.text} style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 46}}>
              {solved}
            </text>
            <text y={30} textAnchor="middle" fill={C.muted} style={{fontFamily: FONT.mono, fontSize: 20}}>
              / {FACTS.challenges}
            </text>
          </svg>
          <div style={{fontFamily: FONT.mono, fontSize: 18, color: C.muted, letterSpacing: 2}}>CHALLENGES SOLVED</div>
          <div style={{width: '100%', marginTop: 10}}>
            {DIFF.map((n, i) => {
              const p = prog(f, start + 10 + i * 5, start + 40 + i * 5);
              return (
                <div key={i} style={{display: 'flex', alignItems: 'center', gap: 10, height: 30}}>
                  <div style={{width: 120}}>
                    <Stars n={i + 1} size={15} />
                  </div>
                  <div style={{flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)'}}>
                    <div style={{width: `${(n / 27) * 100 * p}%`, height: '100%', borderRadius: 4, background: C.cyan}} />
                  </div>
                  <span style={{fontFamily: FONT.mono, fontSize: 16, color: C.muted, width: 26, textAlign: 'right'}}>{n}</span>
                </div>
              );
            })}
          </div>
        </div>
        {/* challenge cards */}
        <div style={{flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignContent: 'start'}}>
          {CHALLS.map(([name, cat, d], i) => {
            const p = prog(f, start + 14 + i * 5, start + 40 + i * 5);
            const isSolved = i === 0 && solved;
            return (
              <div key={name} style={{border: `1.5px solid ${isSolved ? C.green : 'rgba(255,255,255,0.1)'}`, background: isSolved ? `${C.green}14` : 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '16px 20px', opacity: p, transform: `translateY(${(1 - p) * 20}px)`, position: 'relative', boxShadow: isSolved ? `0 0 30px ${C.green}44` : undefined}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <span style={{fontSize: 24, fontWeight: 600}}>{name}</span>
                  {isSolved ? <Icon name="check" size={26} color={C.green} stroke={3} draw={ring} /> : <Stars n={d} size={16} />}
                </div>
                <div style={{fontFamily: FONT.mono, fontSize: 16, color: C.muted, marginTop: 6}}>{cat}</div>
              </div>
            );
          })}
        </div>
      </div>
      {/* solved toast (real UI string) */}
      <div style={{position: 'absolute', left: 34, width: 820, bottom: 34, opacity: toast, transform: `translateY(${(1 - toast) * 30}px)`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '16px 22px', background: '#1f6f43', borderRadius: 10, fontSize: 22, boxShadow: '0 10px 40px rgba(0,0,0,0.5)'}}>
          <Icon name="check" size={26} color="#fff" stroke={3} />
          You successfully solved a challenge: <b>Score Board</b>
        </div>
      </div>
      {/* Hacking Instructor bubble (real UI string) */}
      <div style={{position: 'absolute', right: 40, bottom: 34, width: 520, opacity: hi, transform: `translateY(${(1 - hi) * 40}px) scale(${0.9 + 0.1 * hi})`, transformOrigin: 'bottom right'}}>
        <div style={{background: '#f4f6fb', color: '#1b2433', borderRadius: 16, padding: '20px 24px', fontSize: 22, lineHeight: 1.4, boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 0 3px ${C.cyan}`}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 10, fontFamily: FONT.mono, fontSize: 17, color: '#2563eb', marginBottom: 8, letterSpacing: 1}}>
            <Icon name="book" size={20} color="#2563eb" /> HACKING INSTRUCTOR · TUTORIAL
          </div>
          <Typewriter text="Launch a tutorial to get you started hacking the Juice Shop." start={hiAt + 10} cps={55} caret={false} />
        </div>
      </div>
    </div>
  );
};

/* ---------------------------- Coding Challenge ---------------------------- */
const CodeLine: React.FC<{n: number; children: React.ReactNode; bg?: string; border?: string}> = ({n, children, bg, border}) => (
  <div style={{display: 'flex', background: bg, borderLeft: `4px solid ${border ?? 'transparent'}`, padding: '2px 0'}}>
    <span style={{width: 56, textAlign: 'right', paddingRight: 18, color: C.dim}}>{n}</span>
    <span style={{whiteSpace: 'pre'}}>{children}</span>
  </div>
);
const K: React.FC<{c?: string; children: React.ReactNode}> = ({c = C.cyan, children}) => <span style={{color: c}}>{children}</span>;

const CodingChallenge: React.FC<{start: number; fixAt: number}> = ({start, fixAt}) => {
  const f = useCurrentFrame();
  const scan = prog(f, start + 16, start + 60, easeInOut);
  const vuln = prog(f, start + 50, start + 64);
  const fix = prog(f, fixAt, fixAt + 24);
  const red = `${C.red}22`;
  const green = `${C.green}1f`;
  return (
    <Panel style={{position: 'absolute', left: 150, top: 200, width: 1620, height: 640, overflow: 'hidden', padding: 0}} glow={fix > 0.5 ? C.green : C.cyan}>
      <div style={{height: 64, display: 'flex', alignItems: 'center', gap: 16, padding: '0 30px', borderBottom: `1px solid ${C.line}`}}>
        <Icon name="code" size={28} color={C.cyan} />
        <span style={{fontFamily: FONT.body, fontWeight: 600, fontSize: 26, color: C.text}}>Coding Challenge</span>
        <span style={{fontFamily: FONT.mono, fontSize: 20, color: C.muted}}>· Login Admin · routes/login.ts</span>
        <div style={{marginLeft: 'auto', display: 'flex', gap: 10}}>
          {[
            ['Find It', fix < 0.5],
            ['Fix It', fix >= 0.5],
          ].map(([t, on]) => (
            <span key={t as string} style={{fontFamily: FONT.mono, fontSize: 20, padding: '6px 16px', borderRadius: 8, background: on ? `${C.cyan}22` : 'transparent', color: on ? C.cyan : C.dim, border: `1.5px solid ${on ? C.cyan : C.dim}66`}}>
              {t as string}
            </span>
          ))}
        </div>
      </div>
      <div style={{position: 'relative', padding: '28px 10px', fontFamily: FONT.mono, fontSize: 25, lineHeight: 1.65, color: '#c9d4e8'}}>
        <CodeLine n={30}>
          <K c="#c792ea">return</K> (req, res, next) =&gt; {'{'}
        </CodeLine>
        {/* vulnerable line(s) — fade out on fix */}
        <div style={{position: 'relative', height: 3 * 41.25 + 12}}>
          <div style={{position: 'absolute', inset: 0, opacity: 1 - fix, transform: `translateX(${-fix * 40}px)`}}>
            <CodeLine n={31} bg={vuln ? red : undefined} border={vuln ? C.red : undefined}>
              {'  '}models.sequelize.<K>query</K>(
            </CodeLine>
            <CodeLine n={32} bg={vuln ? red : undefined} border={vuln ? C.red : undefined}>
              {'    '}
              <K c={C.green}>`SELECT * FROM Users WHERE email = &apos;</K>
              <K c={C.red}>{'${req.body.email}'}</K>
              <K c={C.green}>&apos; AND ...`</K>
            </CodeLine>
            <CodeLine n={33} bg={vuln ? red : undefined} border={vuln ? C.red : undefined}>
              {'  '})
            </CodeLine>
          </div>
          <div style={{position: 'absolute', inset: 0, opacity: fix, transform: `translateX(${(1 - fix) * 40}px)`}}>
            <CodeLine n={31} bg={green} border={C.green}>
              {'  '}models.sequelize.<K>query</K>(
            </CodeLine>
            <CodeLine n={32} bg={green} border={C.green}>
              {'    '}
              <K c={C.green}>`SELECT * FROM Users WHERE email = </K>
              <K c={C.amber}>$1</K>
              <K c={C.green}> AND ...`</K>,
            </CodeLine>
            <CodeLine n={33} bg={green} border={C.green}>
              {'    '}{'{ '}<K c={C.amber}>bind</K>: [ req.body.email, ... ] {'}'})
            </CodeLine>
          </div>
        </div>
        <CodeLine n={34}>
          {'    '}.<K>then</K>((authenticatedUser) =&gt; {'{'} ... {'}'})
        </CodeLine>
        <CodeLine n={35}>{'}'}</CodeLine>
        {/* scanning line */}
        {scan > 0 && scan < 1 && <div style={{position: 'absolute', left: 0, right: 0, top: 28 + scan * 260, height: 3, background: C.cyan, boxShadow: `0 0 20px ${C.cyan}`}} />}
      </div>
      {/* verdict */}
      <div style={{position: 'absolute', left: 40, right: 40, bottom: 34, display: 'flex', gap: 20}}>
        <div style={{flex: 1, display: 'flex', alignItems: 'center', gap: 14, padding: '18px 24px', borderRadius: 12, border: `1.5px solid ${C.red}66`, background: `${C.red}12`, opacity: vuln * (1 - fix * 0.6)}}>
          <Icon name="alert" size={32} color={C.red} />
          <span style={{fontFamily: FONT.body, fontSize: 25, color: C.text}}>Rentan: input dirangkai langsung ke query SQL</span>
        </div>
        <div style={{flex: 1, display: 'flex', alignItems: 'center', gap: 14, padding: '18px 24px', borderRadius: 12, border: `1.5px solid ${C.green}88`, background: `${C.green}14`, opacity: fix, transform: `translateY(${(1 - fix) * 20}px)`}}>
          <Icon name="shieldCheck" size={32} color={C.green} draw={fix} />
          <span style={{fontFamily: FONT.body, fontSize: 25, color: C.text}}>Aman: parameter binding memisahkan data & perintah</span>
        </div>
      </div>
    </Panel>
  );
};

/* --------------------------------- Scene --------------------------------- */
export const S5Demo: React.FC = () => {
  const f = useCurrentFrame();
  const {duration} = scene('s5');
  const tDocker = 6;
  const tLocal = cue('s5', 'lalu buka', -6);
  const tBoard = cue('s5', 'Ada seratus', -10);
  const tSolve = cue('s5', 'terpantau', -4);
  const tHI = cue('s5', 'Pemula', -6);
  const tCode = cue('s5', 'Lewat Coding', -10);
  const tFix = cue('s5', 'misalnya', 10);

  const termP = prog(f, 0, 26);
  const termOut = prog(f, tBoard - 12, tBoard + 8, easeInOut);
  const brIn = prog(f, tLocal, tLocal + 30);
  const brOut = prog(f, tCode - 14, tCode + 6, easeInOut);
  const brFull = prog(f, tBoard - 12, tBoard + 18, easeInOut);
  const codeIn = prog(f, tCode, tCode + 26);

  // browser geometry: small (beside terminal) → large centred
  const bx = interpolate(brFull, [0, 1], [1000, 210]);
  const by = interpolate(brFull, [0, 1], [500, 160]);
  const bw = interpolate(brFull, [0, 1], [800, 1500]);
  const bh = (bw / 1500) * 800;
  const scale = bw / 1500;

  return (
    <AbsoluteFill>
      <Sfx at={0} name="whoosh" volume={0.4} />
      <Sfx at={tDocker + 10} name="typing" volume={0.4} />
      <Sfx at={tDocker + 100} name="typing" volume={0.4} />
      <Sfx at={tLocal + 4} name="whoosh_rev" volume={0.35} />
      <Sfx at={tLocal + 18} name="beep2" volume={0.35} />
      <Sfx at={tBoard - 10} name="whoosh" volume={0.4} />
      <Sfx at={tBoard + 14} name="chatter" volume={0.3} />
      <Sfx at={tSolve} name="chime" volume={0.5} />
      <Sfx at={tHI} name="blip" volume={0.45} />
      <Sfx at={tHI + 12} name="typing_short" volume={0.3} />
      <Sfx at={tCode - 10} name="whoosh" volume={0.45} />
      <Sfx at={tCode + 16} name="scan" volume={0.35} />
      <Sfx at={tCode + 50} name="buzz" volume={0.4} />
      <Sfx at={tFix} name="glitch" volume={0.3} />
      <Sfx at={tFix + 6} name="chime" volume={0.45} />

      <SectionLabel index="04" title="Demo & Fitur" start={2} />
      <div style={{position: 'absolute', right: 90, top: 64, opacity: prog(f, 10, 30)}}>
        <Chip color={C.amber} style={{fontSize: 18}}>
          <Icon name="laptop" size={20} color={C.amber} /> Simulasi · lingkungan lokal
        </Chip>
      </div>

      {/* terminal */}
      {f < tBoard + 12 && (
        <div style={{position: 'absolute', left: 120, top: 180, opacity: termP * (1 - termOut), transform: `translateY(${(1 - termP) * 60}px) scale(${1 - termOut * 0.08})`, filter: `blur(${termOut * 8}px)`}}>
          <Panel style={{width: 1680, height: 540, overflow: 'hidden'}}>
            <div style={{height: 50, display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px', borderBottom: `1px solid ${C.line}`}}>
              {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
                <div key={c} style={{width: 13, height: 13, borderRadius: 7, background: c}} />
              ))}
              <Icon name="terminal" size={20} color={C.muted} style={{marginLeft: 14}} />
              <span style={{fontFamily: FONT.mono, fontSize: 18, color: C.muted}}>bash — juice-shop</span>
            </div>
            <div style={{padding: '24px 30px', width: 1600, }}>
              <Terminal start={tDocker} />
            </div>
          </Panel>
          <div style={{marginTop: 26, opacity: prog(f, 20, 40)}}>
            <MaskWords text="Satu perintah, siap berlatih." start={20} style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 52, color: C.text}} highlight={{'berlatih.': C.green}} />
          </div>
        </div>
      )}

      {/* browser with score board */}
      {f >= tLocal && f < tCode + 10 && (
        <div style={{position: 'absolute', left: bx, top: by, width: bw, height: bh, opacity: brIn * (1 - brOut), transform: `translateY(${(1 - brIn) * 60}px) scale(${1 - brOut * 0.06})`, filter: `blur(${brOut * 8}px)`}}>
          <div style={{width: 1500, height: 800, transform: `scale(${scale})`, transformOrigin: '0 0', borderRadius: 16, overflow: 'hidden', border: `1.5px solid ${C.cyan}55`, boxShadow: `0 40px 120px rgba(0,0,0,0.7), 0 0 60px ${C.cyan}22`}}>
            <div style={{height: 50, background: '#161b22', display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px'}}>
              {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
                <div key={c} style={{width: 13, height: 13, borderRadius: 7, background: c}} />
              ))}
              <div style={{marginLeft: 20, width: 600, height: 32, borderRadius: 16, background: '#010409', display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', fontFamily: FONT.mono, fontSize: 18, color: C.text}}>
                <Icon name="globe" size={16} color={C.muted} />
                <Typewriter text={f < tBoard ? 'localhost:3000' : 'localhost:3000/#/score-board'} start={tLocal + 6} cps={70} caret={false} />
              </div>
            </div>
            <div style={{position: 'relative', height: 750}}>
              {f < tBoard ? (
                <div style={{position: 'absolute', inset: 0, background: '#0f1520', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24}}>
                  <Img src={staticFile('juiceshop-logo.svg')} style={{height: 260, transform: `scale(${0.8 + 0.2 * prog(f, tLocal + 10, tLocal + 40)})`}} />
                  <div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 54, color: C.text}}>OWASP Juice Shop</div>
                  <div style={{fontFamily: FONT.mono, fontSize: 24, color: C.green}}>running on localhost:3000</div>
                </div>
              ) : (
                <ScoreBoard start={tBoard} solveAt={tSolve} hiAt={tHI} />
              )}
            </div>
          </div>
          <Corners w={bw} h={bh} size={30} p={brFull} />
        </div>
      )}

      {/* feature captions for the score board phase */}
      {f >= tBoard && f < tCode + 10 && (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 40, display: 'flex', justifyContent: 'center', gap: 20, opacity: prog(f, tBoard + 20, tBoard + 40) * (1 - brOut)}}>
          {[
            {t: `${FACTS.challenges} tantangan`, i: 'target', at: tBoard + 20},
            {t: 'Level 1–6 bintang', i: 'star', at: tBoard + 34},
            {t: 'Score Board', i: 'trophy', at: tSolve},
            {t: 'Hacking Instructor', i: 'book', at: tHI},
          ].map((c) => {
            const p = prog(f, c.at, c.at + 18);
            return (
              <div key={c.t} style={{display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderRadius: 10, background: 'rgba(4,7,13,0.85)', border: `1.5px solid ${C.cyan}55`, fontFamily: FONT.mono, fontSize: 22, color: C.text, opacity: p, transform: `translateY(${(1 - p) * 20}px)`}}>
                <Icon name={c.i} size={22} color={C.cyan} /> {c.t}
              </div>
            );
          })}
        </div>
      )}

      {/* coding challenge */}
      {f >= tCode && (
        <div style={{position: 'absolute', inset: 0, opacity: codeIn, transform: `translateY(${(1 - codeIn) * 60}px)`}}>
          <div style={{position: 'absolute', left: 150, top: 130}}>
            <MaskWords text="Temukan kode rentan, lalu perbaiki." start={tCode + 4} style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 50, color: C.text}} highlight={{rentan: C.red, 'perbaiki.': C.green}} />
          </div>
          <CodingChallenge start={tCode} fixAt={tFix} />
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 70, display: 'flex', justifyContent: 'center', opacity: prog(f, tFix + 40, tFix + 60)}}>
            <div style={{fontFamily: FONT.mono, fontSize: 24, color: C.cyan}}>
              Hasil: paham <span style={{color: C.red}}>celahnya</span> + paham <span style={{color: C.green}}>cara memperbaikinya</span>
            </div>
          </div>
        </div>
      )}
      <div style={{display: 'none'}}>{duration}</div>
    </AbsoluteFill>
  );
};
