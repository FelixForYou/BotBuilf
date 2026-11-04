import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Egg, FileCode, Cpu, MemoryStick, HardDrive, Ban} from 'lucide-react';
import {Chip, KText, Stage} from '../components/core';
import {ContainerBox, CpuChip, Gauge, Icon, RamStick, RecipeLines, StorageStack} from '../components/graphics';
import {Sfx} from '../components/Sfx';
import {E, clamp01, drift, ip, kf, p, sp} from '../lib/anim';
import {C, FONT, MONO} from '../lib/theme';
import {cues} from '../lib/timeline';

/*
 * 03:35–04:05 — Sumber daya dan lingkungan aplikasi
 * Shot 33 kamera masuk ke kartu sumber daya -> terbuka jadi tiga; CPU memproses perintah
 * Shot 34 RAM: memori kerja terisi data sementara
 * Shot 35 Penyimpanan: kode, dependensi, log masuk
 * Shot 36 Egg = resep -> berubah menjadi lingkungan container, aplikasi di dalamnya
 * Shot 37 kebutuhan bergantung pada kode, fitur, aktivitas, dependensi (tanpa angka)
 */
export const S8: React.FC = () => {
  const f = useCurrentFrame();
  const {L, LE, dur} = cues('s8');
  const tCpu = L(0, 'cpu');
  const tCmd = L(0, 'memproses');
  const tRam = L(1);
  const tTemp = L(1, 'sementara');
  const tSto = L(2);
  const tEgg = L(3);
  const tRecipe = L(3, 'resep');
  const tEnv = L(3, 'lingkungan');
  const tStart = L(3, 'perintah awal');
  const tNot = L(3, 'egg bukan');
  const tDep = L(4);
  const factors = [L(4, 'kode'), L(4, 'fitur'), L(4, 'jumlah'), L(4, 'dependensi')];

  // kartu sumber daya -> tiga kolom
  const split = ip(f, [tCpu - 30, tCpu + 20], [0, 1], E.inOut);
  const camX = kf(f, [0, tCpu + 20, tRam - 10, tRam + 30, tSto - 10, tSto + 30, tEgg - 30, tEgg + 10], [0, -560, -560, 0, 0, 560, 560, 0], E.inOut);
  const camS = kf(f, [0, tCpu - 30, tCpu + 20, tEgg - 30, tEgg + 10], [0.7, 0.9, 1.25, 1.25, 1], E.inOut);
  const colsOut = ip(f, [tEgg - 20, tEgg + 20], [0, 1], E.inOut);

  // egg
  const eggIn = sp(f, tEgg - 6, {damping: 14});
  const recipe = ip(f, [tEgg + 24, tStart + 30], [0, 1], E.linear);
  const toBox = ip(f, [tStart + 50, tStart + 100], [0, 1], E.inOut);
  const eggOut = ip(f, [tDep - 20, tDep + 20], [0, 1], E.inOut);
  const notIn = sp(f, tNot - 6, {damping: 15});

  // gauge
  const gIn = ip(f, [tDep - 10, tDep + 30], [0, 1], E.out);
  const needle = 0.25 + factors.reduce((acc, t, i) => acc + 0.14 * ip(f, [t - 5, t + 25], [0, 1], E.back) * (i % 2 === 0 ? 1 : 0.8), 0) + 0.03 * Math.sin(f * 0.07);

  const columns = [
    {x: -560, icon: Cpu, title: 'CPU', sub: 'tenaga untuk memproses perintah', at: tCpu},
    {x: 0, icon: MemoryStick, title: 'RAM', sub: 'memori kerja, data sementara', at: tRam},
    {x: 560, icon: HardDrive, title: 'Penyimpanan', sub: 'kode, dependensi, log, berkas', at: tSto},
  ];

  return (
    <Stage dark={0}>
      {/* kolom sumber daya */}
      <AbsoluteFill style={{perspective: 2000, opacity: 1 - colsOut}}>
        <div style={{position: 'absolute', left: 960, top: 560, transformStyle: 'preserve-3d',
          transform: `scale(${camS * (1 - 0.3 * colsOut)}) rotateY(${drift(f, 21, 2, 0.5) - camX / 160}deg) rotateX(6deg) translateX(${-camX}px)`}}>
          {columns.map((c, i) => {
            const x = c.x * split;
            const active = i === 0 ? f < tRam : i === 1 ? f >= tRam && f < tSto : f >= tSto;
            const act = active ? 1 : 0.35;
            return (
              <div key={i} style={{position: 'absolute', left: x - 250, top: -330, width: 500, height: 660, borderRadius: 30, background: '#fff',
                border: `2px solid ${active ? C.coral : '#ececec'}`, boxShadow: active ? `0 30px 90px rgba(0,0,0,0.12), 0 0 60px ${C.coral}33` : '0 20px 60px rgba(0,0,0,0.08)',
                opacity: i === 1 ? 1 : split, transition: 'none'}}>
                <div style={{padding: '30px 34px', display: 'flex', alignItems: 'center', gap: 14, opacity: 0.4 + 0.6 * act}}>
                  <Icon i={c.icon} size={38} color={C.ember} draw={p(f, c.at - 10, 40)} />
                  <div>
                    <div style={{fontFamily: FONT, fontSize: 40, fontWeight: 750, color: C.ink}}>{i === 1 && split < 0.5 ? 'Sumber daya' : c.title}</div>
                    <div style={{fontFamily: FONT, fontSize: 21, color: C.gray}}>{i === 1 && split < 0.5 ? 'CPU · RAM · penyimpanan' : c.sub}</div>
                  </div>
                </div>
                <div style={{position: 'absolute', left: 0, right: 0, top: 150, bottom: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.35 + 0.65 * act}}>
                  {i === 0 && <CpuChip size={330} draw={p(f, tCpu - 20, 60)} load={active ? 0.7 : 0.2} />}
                  {i === 1 && <RamStick w={430} draw={p(f, tRam - 20, 50)} fill={ip(f, [tRam, tTemp + 40], [0.15, 0.65])} />}
                  {i === 2 && <StorageStack w={300} draw={p(f, tSto - 20, 50)} used={ip(f, [tSto, LE(2)], [0.1, 0.7])} />}
                </div>
                {/* item yang masuk */}
                {i === 0 && ['/jadwal', '/bantuan', '/info'].map((t, k) => {
                  const tt = ip(f, [tCmd - 20 + k * 22, tCmd + 30 + k * 22], [0, 1], E.in);
                  if (tt <= 0 || tt >= 1) return null;
                  return (
                    <div key={k} style={{position: 'absolute', left: 250 - 60 + (1 - tt) * 260 * (k - 1), top: 120 + tt * 290, opacity: 1 - tt * 0.8, transform: `scale(${1 - tt * 0.6})`}}>
                      <Chip text={t} bg={C.ink} color="#fff" size={22} />
                    </div>
                  );
                })}
                {i === 1 && ['sesi', 'cache', 'antrian'].map((t, k) => {
                  const a = sp(f, tTemp - 20 + k * 14, {damping: 14});
                  return (
                    <div key={k} style={{position: 'absolute', left: 60 + k * 130, top: 520, opacity: clamp01(a) * (0.6 + 0.4 * Math.sin(f * 0.05 + k)), transform: `translateY(${(1 - clamp01(a)) * 30}px)`}}>
                      <Chip text={t} bg="#fff3ec" color={C.ember} size={20} />
                    </div>
                  );
                })}
                {i === 2 && ['kode', 'dependensi', 'log', 'berkas'].map((t, k) => {
                  const st = tSto + 20 + k * 22;
                  const tt = ip(f, [st, st + 40], [0, 1], E.in);
                  if (tt <= 0) return null;
                  return (
                    <div key={k} style={{position: 'absolute', left: 90 + (k % 2) * 180, top: 120 + tt * 260 + (k > 1 ? 40 : 0), opacity: tt < 1 ? 1 : ip(f, [st + 40, st + 55], [1, 0]),
                      transform: `scale(${1 - tt * 0.4})`}}>
                      <Chip text={t} bg={C.ink} color="#fff" size={22} />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      {/* egg: resep -> container */}
      {f > tEgg - 20 && eggOut < 1 && (
        <AbsoluteFill style={{perspective: 1800, opacity: 1 - eggOut}}>
          <div style={{position: 'absolute', left: 760, top: 560, transform: `translate(-50%, -50%) rotateY(${toBox * 70 - 8 + ip(f, [tEgg, tStart + 50], [0, 14], E.inOut) + drift(f, 22, 3, 0.8)}deg) rotateX(${drift(f, 23, 3, 0.7)}deg) scale(${clamp01(eggIn) * (1 - toBox * 0.4) * (1 + 0.08 * ip(f, [tEgg, tStart + 50], [0, 1], E.inOut))})`,
            opacity: 1 - toBox, width: 760, height: 520, borderRadius: 30, background: '#fffaf6', border: `2px solid ${C.coral}`, boxShadow: '0 30px 90px rgba(0,0,0,0.12)', padding: 44, boxSizing: 'border-box'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 18, marginBottom: 26}}>
              <div style={{width: 76, height: 76, borderRadius: 22, background: '#fff', border: '1px solid #f1d9cb', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <Icon i={Egg} size={44} color={C.ember} draw={p(f, tEgg, 40)} />
              </div>
              <div>
                <div style={{fontFamily: FONT, fontSize: 42, fontWeight: 750, color: C.ink}}>Egg</div>
                <div style={{fontFamily: FONT, fontSize: 24, color: C.gray}}>resep konfigurasi lingkungan</div>
              </div>
            </div>
            <RecipeLines reveal={recipe} size={27} lines={[
              ['lingkungan', 'image container Node.js'],
              ['runtime', 'Node.js'],
              ['perintah awal', 'node index.js'],
              ['variabel', 'BOT_TOKEN (diisi sendiri)'],
            ]} />
          </div>
          {/* hasil: container + aplikasi */}
          <div style={{position: 'absolute', left: 760, top: 560 + drift(f, 52, 12, 0.8), transform: `translate(-50%, -50%) scale(${(0.6 + 0.4 * toBox) * (1 + 0.05 * ip(f, [tStart + 100, tDep], [0, 1], E.linear))}) rotateY(${(1 - toBox) * -70 + drift(f, 53, 6, 0.8)}deg) rotateX(${drift(f, 54, 3, 0.6)}deg)`, opacity: toBox}}>
            <div style={{position: 'relative'}}>
              <ContainerBox size={520} draw={toBox} open={ip(f, [tStart + 100, tStart + 140], [0, 1])} color={C.ink} glow={C.coral} label="lingkungan container" />
              <div style={{position: 'absolute', left: 260, top: 250, transform: `translate(-50%, -50%) scale(${sp(f, tStart + 110, {damping: 12})})`, width: 150, height: 150, borderRadius: 36,
                background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, color: '#fff', fontSize: 22, textAlign: 'center'}}>
                aplikasi<br />bot
              </div>
            </div>
          </div>
          {/* egg bukan kode bot */}
          <div style={{position: 'absolute', left: 1420, top: 560 + drift(f, 56, 14, 0.9), transform: `translate(-50%, -50%) scale(${clamp01(notIn)}) rotate(${drift(f, 57, 3, 0.7)}deg)`, opacity: clamp01(notIn),
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20}}>
            <div style={{position: 'relative', width: 150, height: 150, borderRadius: 36, background: '#fff', border: '2px dashed #d4d4d8', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <Icon i={FileCode} size={70} color={C.gray} />
              <div style={{position: 'absolute', right: -16, top: -16, background: '#fff', borderRadius: 30}}>
                <Icon i={Ban} size={50} color={C.ember} draw={p(f, tNot + 6, 30)} />
              </div>
            </div>
            <div style={{fontFamily: FONT, fontSize: 34, fontWeight: 700, color: C.ink, textAlign: 'center', lineHeight: 1.2}}>Egg bukan<br />kode bot</div>
          </div>
        </AbsoluteFill>
      )}

      {/* gauge kebutuhan */}
      {gIn > 0 && (
        <AbsoluteFill style={{opacity: gIn}}>
          <div style={{position: 'absolute', left: 960, top: 420, transform: `translate(-50%, -50%) scale(${0.85 + 0.15 * gIn})`}}>
            <Gauge size={460} v={needle} draw={gIn} />
          </div>
          <div style={{position: 'absolute', left: 960, top: 690, transform: 'translateX(-50%)', display: 'flex', gap: 18}}>
            {['kode', 'fitur', 'jumlah aktivitas', 'dependensi'].map((t, i) => {
              const a = sp(f, factors[i] - 8, {damping: 13});
              return (
                <div key={t} style={{opacity: clamp01(a), transform: `translateY(${(1 - clamp01(a)) * 30}px) scale(${0.8 + 0.2 * clamp01(a)})`}}>
                  <Chip text={t} bg={C.ink} color="#fff" size={30} />
                </div>
              );
            })}
          </div>
          <KText text="Kebutuhan sumber daya bergantung pada botnya." at={tDep} x={960} y={150} size={50} weight={650} accent={[{word: 'bergantung', color: C.ember}]} />
          <div style={{position: 'absolute', left: 960, top: 820, transform: 'translateX(-50%)', fontFamily: FONT, fontSize: 24, color: C.gray, opacity: p(f, factors[3] + 20, 30)}}>
            tidak ada angka minimum yang berlaku untuk semua bot
          </div>
        </AbsoluteFill>
      )}

      <Sfx at={4} s="slide_soft_2" v={0.22} />
      <Sfx at={tCpu - 30} s="slide_glass_1" v={0.26} />
      <Sfx at={tCpu - 4} s="draw_2" v={0.22} />
      <Sfx at={tCmd - 20} s="data_3" v={0.2} />
      <Sfx at={tRam - 10} s="slide_paper_1" v={0.24} />
      <Sfx at={tTemp - 20} s="tick_1" v={0.2} />
      <Sfx at={tTemp - 6} s="tick_3" v={0.2} />
      <Sfx at={tSto - 10} s="slide_paper_2" v={0.24} />
      <Sfx at={tSto + 40} s="thud_1" v={0.2} />
      <Sfx at={tEgg - 6} s="pop_4" v={0.28} />
      <Sfx at={tRecipe} s="type_2" v={0.18} />
      <Sfx at={tStart + 50} s="slide_heavy_2" v={0.26} />
      <Sfx at={tStart + 110} s="pop_2" v={0.24} />
      <Sfx at={tNot - 6} s="snap_3" v={0.24} />
      <Sfx at={tDep - 10} s="slide_soft_1" v={0.22} />
      {factors.map((t, i) => <Sfx key={i} at={t - 8} s={`click_${(i % 4) + 1}`} v={0.22} />)}
    </Stage>
  );
};

