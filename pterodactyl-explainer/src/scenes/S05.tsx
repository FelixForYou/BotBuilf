import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT, MONO, glow } from "../lib/theme";
import { breathe, clamp01, DRIFT, GLIDE, lerp, out, PANEL, POP, rig, SNAP, spr, vel, WHIP } from "../lib/motion";
import { makeLocal } from "../lib/time";
import { s, SfxCue } from "../lib/sfx";
import { DashedGrid, Label, LightStreak, Obj, Stage, Words, WarmLight } from "../components/Primitives";
import { Barrel, SwapText } from "../components/Motion";
import { Icon } from "../components/Icon";
import { BrandLogo } from "../components/Logos";
import { ConsoleView, FileManager, Graph, Line, PowerButtons, PowerState, PteroWindow, StatusPill, series } from "../components/UI";

const L = makeLocal("s05");
const T = {
  dari: L.c("Dari sini"), peran: L.c("peran utama"), satu: L.c("satu tempat"), awasi: L.c("mengawasi bot"), ambil: L.c("Ambil contoh"), asisten: L.c("Asisten Bot"),
  telegram: L.c("Telegram fiktif"), console: L.c("console"), output: L.c("output"), error: L.c("error"), grafik: L.c("Grafik"), cpu: L.c("C P U"), ram: L.c("ram"),
  pakai: L.c("pemakaian"), meski: L.c("meski"), rendah: L.c("rendah"), jaminan: L.c("jaminan"), cepat: L.c("cepat"), file: L.c("File manager"), berkas: L.c("berkas"),
  semua: L.c("Semuanya terkumpul"), tampilan: L.c("satu tampilan"), lalu: L.c("Lalu"), tombol: L.c("tombol"), start: L.c("start"), stop: L.c("stop"), restart: L.c("restart"),
  proses: L.c("proses"), end: L.dur,
};
const GRID_IN = T.console - 26;
const GRID_OUT = T.semua - 4;
const WIPE = T.end - 34;

const lines: Line[] = [
  { t: 10, text: "$ node index.js", kind: "dim" },
  { t: 24, text: "[info] Asisten Bot v1.4.2 dimulai", kind: "info" },
  { t: 40, text: "[info] token dimuat dari variabel lingkungan (disensor)", kind: "dim" },
  { t: 60, text: "[ok]   terhubung ke Bot API Telegram", kind: "ok" },
  { t: T.console + 4, text: "[info] pesan masuk: /jadwal", kind: "in" },
  { t: T.output - 8, text: "[info] balasan terkirim (120 ms)", kind: "info" },
  { t: T.output + 14, text: "[warn] respons lambat: 1,8 s", kind: "warn" },
  { t: T.error - 6, text: "[error] TypeError: Cannot read properties of undefined", kind: "err" },
  { t: T.error + 30, text: "[info] pesan masuk: /info", kind: "in" },
  { t: T.grafik + 20, text: "[info] balasan terkirim (95 ms)", kind: "info" },
  { t: T.file + 10, text: "[info] pesan masuk: /bantuan", kind: "in" },
  { t: T.start + 4, text: "[panel] sinyal start dikirim", kind: "dim" },
  { t: T.stop + 4, text: "[panel] sinyal stop dikirim", kind: "dim" },
  { t: T.restart + 4, text: "[panel] sinyal restart dikirim", kind: "dim" },
  { t: T.restart + 60, text: "[info] Asisten Bot v1.4.2 dimulai", kind: "info" },
];
const ERR = 7;
const cpuFn = series(3, 9, 8, [[60, 20, 4], [130, 14, 3]]);
const ramFn = series(7, 38, 4, [[110, 8, 12]]);

/* split point of the 2x2 barrel grid, whipping to whichever panel the narration is on */
const split = (f: number) =>
  rig(f, { x: 0.5, y: 0.5 }, [
    { at: T.console - 10, to: { x: 0.7, y: 0.7 }, feel: WHIP },
    { at: T.grafik - 10, to: { x: 0.3, y: 0.7 }, feel: WHIP },
    { at: T.file - 12, to: { x: 0.7, y: 0.3 }, feel: WHIP },
    { at: T.berkas + 14, to: { x: 0.36, y: 0.36 }, feel: GLIDE },
    { at: GRID_OUT - 16, to: { x: 0.5, y: 0.5 }, feel: GLIDE },
  ]);

const cam = (f: number) =>
  rig(f, { x: -460, y: -330, z: -700, ry: 0 }, [
    { at: 0, to: { z: -360, x: -420, y: -300, ry: -6 }, feel: GLIDE },
    { at: T.satu - 6, to: { x: 0, y: 0, z: 330, ry: -14, rx: 8 }, feel: GLIDE },
    { at: T.ambil - 8, to: { x: -430, y: -290, z: -380, ry: -4, rx: 3 }, feel: WHIP },
    { at: GRID_IN, to: { x: 0, y: 0, z: 240, ry: 4, rx: 3 }, feel: GLIDE },
    { at: T.meski - 6, to: { x: 120, z: 140, ry: -4 }, feel: GLIDE },
    { at: T.berkas + 10, to: { x: 0, z: 220, ry: 3 }, feel: DRIFT },
    { at: GRID_OUT + 10, to: { x: 0, y: 0, z: 460, ry: -10, rx: 7 }, feel: GLIDE },
    { at: T.tombol - 20, to: { x: 240, y: -300, z: -300, ry: 4, rx: 2 }, feel: WHIP },
    { at: T.restart + 40, to: { x: 120, y: -200, z: -120, ry: -4 }, feel: DRIFT },
    { at: WIPE - 6, to: { x: 520, y: 0, z: -600, ry: 0, rx: 0 }, feel: { stiffness: 160, damping: 24 } },
  ]);

export const S05: React.FC = () => {
  const f = useCurrentFrame();
  const { v: c, d: cd } = vel((ff) => breathe(cam(ff), ff, 0.8, 5), f);
  const { v: sp, d: spd } = vel(split, f);
  const gridQ = spr(f, GRID_IN, PANEL) * (1 - spr(f, GRID_OUT, PANEL));
  const winO = 1 - clamp01(gridQ * 1.6);
  const state: PowerState = f < T.start ? "running" : f < T.stop ? "starting" : f < T.restart ? "stopping" : f < T.restart + 70 ? "starting" : "running";
  const active = f < T.start - 4 ? null : f < T.stop - 4 ? "start" : f < T.restart - 4 ? "stop" : f < T.restart + 40 ? "restart" : null;
  const press = active === "start" ? clamp01((f - T.start + 4) / 14) : active === "stop" ? clamp01((f - T.stop + 4) / 14) : clamp01((f - T.restart + 4) / 14);
  const wipe = clamp01(spr(f, WIPE + 12, WHIP) * 1.03);
  const lineHead = clamp01((f - WIPE) / 16);

  // barrel grid geometry
  const BW = 1560, BH = 860, G = 14;
  const cx = BW * sp.x, cy = BH * sp.y;
  const cells = [
    { k: "console", x: 0, y: 0, w: cx - G / 2, h: cy - G / 2 },
    { k: "graphs", x: cx + G / 2, y: 0, w: BW - cx - G / 2, h: cy - G / 2 },
    { k: "files", x: 0, y: cy + G / 2, w: cx - G / 2, h: BH - cy - G / 2 },
    { k: "power", x: cx + G / 2, y: cy + G / 2, w: BW - cx - G / 2, h: BH - cy - G / 2 },
  ];
  const splitSpeed = Math.hypot(spd.x * BW, spd.y * BH);

  const cell = (k: string, w: number, h: number) => {
    const pad = 18;
    if (k === "console")
      return <ConsoleView f={f} lines={lines} w={w - pad * 2} h={h - pad * 2} size={w > 800 ? 19 : 15} highlight={ERR} hiA={clamp01((f - T.error) / 10) * (1 - out(f, T.grafik, 14))} />;
    if (k === "graphs")
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Graph f={f} w={w - pad * 2} h={(h - pad * 2 - 12) / 2} fn={cpuFn} color={C.coral} label="CPU" icon="Cpu" unit={(v) => `${v.toFixed(1)}%`} grow={lerp(0.15, 1, clamp01(spr(f, T.cpu - 14, GLIDE)))} />
          <Graph f={f} w={w - pad * 2} h={(h - pad * 2 - 12) / 2} fn={ramFn} color={C.telegram} label="Memory" icon="MemoryStick" unit={(v) => `${Math.round(v * 5.12)} MiB`} grow={lerp(0.15, 1, clamp01(spr(f, T.ram - 14, GLIDE)))} offset={30} />
        </div>
      );
    if (k === "files")
      return <FileManager f={f} at={T.file - 8} w={w - pad * 2} h={h - pad * 2} rows={[
        { name: "node_modules", size: "—", dir: true }, { name: "commands", size: "—", dir: true }, { name: "index.js", size: "4,2 KB", hi: true },
        { name: "config.js", size: "1,1 KB" }, { name: "package.json", size: "0,8 KB" }, { name: ".env (disensor)", size: "0,1 KB" }]} />;
    return (
      <div style={{ height: h - pad * 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 22, fontWeight: 700 }}><BrandLogo brand="telegram" size={30} /> asisten-bot</div>
        <StatusPill state={state} f={f} size={18} />
        <PowerButtons scale={Math.min(1, w / 520)} active={null} />
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ background: C.black, fontFamily: FONT }}>
      <LightStreak f={f} o={0.5} angle={-24} seed={5} />
      <WarmLight f={f} o={0.5} y={560} r={1050} seed={6} />
      <DashedGrid f={f} xs={[180, 1740]} ys={[110, 970]} bend={0.55 * gridQ} o={0.6 * gridQ} reveal={clamp01((f - GRID_IN) / 20)} march={1} />
      <Stage cam={c} blur={[cd.x + (gridQ > 0.5 ? spd.x * 600 : 0), cd.y]}>
        <Obj x={0} y={0} w={1600} h={900} o={winO} s={lerp(1, 0.94, clamp01(gridQ))} style={{ boxShadow: glow(0.9), borderRadius: 18 }}>
          <PteroWindow w={1600} h={900} tab={"Console"} name="asisten-bot" state={state} f={f} brand="telegram"
            topRight={<PowerButtons active={active as "start" | "stop" | "restart" | null} press={press} />}>
            <div style={{ position: "absolute", left: 0, top: 0, width: 990, height: 676 }}>
              <ConsoleView f={f} lines={lines} w={990} h={676} size={19} />
            </div>
            <div style={{ position: "absolute", left: 1018, top: 0, width: 526, display: "flex", flexDirection: "column", gap: 18 }}>
              {[0, 1].map((k) => {
                const q = clamp01(spr(f, 8 + k * 6, SNAP));
                return (
                  <div key={k} style={{ opacity: q, transform: `translateY(${(1 - q) * 30}px)` }}>
                    {k === 0 ? <Graph f={f} w={526} h={210} fn={cpuFn} color={C.coral} label="CPU" icon="Cpu" unit={(v) => `${v.toFixed(1)}%`} />
                      : <Graph f={f} w={526} h={210} fn={ramFn} color={C.telegram} label="Memory" icon="MemoryStick" unit={(v) => `${Math.round(v * 5.12)} MiB`} offset={30} />}
                  </div>
                );
              })}
              <div style={{ height: 210, borderRadius: 12, background: "#23272e", padding: 18, display: "flex", flexDirection: "column", gap: 16, color: "#e6e8eb" }}>
                {([["Clock", "Uptime", "3j 12m"], ["HardDrive", "Disk", "212 MiB"], ["Network", "Jaringan", ""]] as const).map(([ic, a, b], i) => (
                  <div key={a} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 18 }}>
                    <Icon name={ic} size={22} color="#8b929c" />
                    <div style={{ flex: 1, color: "#8b929c", fontWeight: 600 }}>{a}</div>
                    <div style={{ fontFamily: MONO, fontSize: 17 }}>{i === 2 ? `${(10 + 4 * Math.sin(f * 0.07)).toFixed(0)} KiB/s` : b}</div>
                  </div>
                ))}
              </div>
            </div>
          </PteroWindow>
        </Obj>

        {/* barrel grid: the panel body opens into four curved screens */}
        {gridQ > 0.01 && (
          <Obj x={0} y={20} w={BW} h={BH} o={clamp01(gridQ * 1.6)} s={lerp(0.92, 1, clamp01(gridQ))}>
            <Barrel w={BW} h={BH} bulge={30 * clamp01(gridQ)} f={f} bg="transparent" dashO={0.85}>
              {cells.map((cl, i) => {
                const born = clamp01(spr(f, GRID_IN + 4 + i * 4, SNAP));
                const focus = (cl.k === "console" && f > T.console - 10 && f < T.grafik - 10) || (cl.k === "graphs" && f > T.grafik - 10 && f < T.file - 12) || (cl.k === "files" && f > T.file - 12 && f < T.berkas + 14);
                return (
                  <div key={cl.k} style={{ position: "absolute", left: cl.x, top: cl.y, width: cl.w, height: cl.h, background: "#1b1e23", overflow: "hidden", padding: 18, boxSizing: "border-box",
                    transform: `translateY(${(1 - born) * (i < 2 ? -80 : 80)}px)`, opacity: born, border: focus ? "1px solid rgba(255,138,92,0.5)" : "1px solid rgba(255,255,255,0.05)",
                    filter: splitSpeed > 6 ? `blur(${Math.min(5, splitSpeed * 0.08)}px)` : undefined }}>
                    {cell(cl.k, cl.w, cl.h)}
                  </div>
                );
              })}
            </Barrel>
          </Obj>
        )}

        {/* world annotations */}
        <Obj x={-420} y={-372} z={60} w={420} h={50} s={spr(f, T.telegram - 10, POP) * (1 - out(f, GRID_IN, 10))}>
          <Label bg="rgba(38,165,228,0.18)" color="#9bd8f6" size={20}><Icon name="Info" size={18} color="#9bd8f6" /> bot Telegram fiktif</Label>
        </Obj>
        <Obj x={330} y={-150} z={140} w={600} h={50} s={spr(f, T.meski - 8, POP) * (1 - out(f, T.file - 16, 10))}>
          <Label bg="rgba(20,20,22,0.92)" color="#fff" size={21}><Icon name="TriangleAlert" size={18} color={C.warn} /> CPU rendah bukan jaminan bot cepat</Label>
        </Obj>
      </Stage>

      <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ position: "absolute", top: 64 }}>
          <SwapText f={f} items={[
            { at: T.satu - 6, text: "Satu tempat untuk mengawasi bot.", color: "#fff" },
            { at: T.console - 6, text: "Console: output & error", color: "#fff" },
            { at: T.grafik - 6, text: "Grafik CPU & RAM", color: "#fff" },
            { at: T.file - 6, text: "File manager", color: "#fff" },
            { at: T.semua - 6, text: "Semua dalam satu tampilan.", color: "#fff" },
            { at: T.tombol - 6, text: "Start · Stop · Restart", color: "#fff" },
          ]} size={38} style={{ opacity: 1 - out(f, WIPE - 6, 10) }} />
        </div>
      </AbsoluteFill>

      {/* hand-off: the RAM line shoots out and drags the white world behind it */}
      {f >= WIPE && (
        <AbsoluteFill>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${wipe * 100}%`, background: C.white }} />
          <div style={{ position: "absolute", left: 0, top: 538, height: 4, width: `${lerp(55, 100, lineHead)}%`, background: C.telegram, boxShadow: "0 0 18px rgba(38,165,228,0.8)", borderRadius: 2 }} />
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ background: "#1b1e23", opacity: 1 - clamp01(f / 9) }} />
    </AbsoluteFill>
  );
};

export const sfx05 = (): SfxCue[] => {
  const o = L.from;
  return [
    s(o, "whip_low", 0.35, 0.9), s(o + 12, "impact_soft", 0.3), s(o + 10, "type_short", 0.2), s(o + 60, "status_on", 0.16),
    s(o + T.satu - 6, "scramble", 0.2), s(o + T.satu - 6, "whip_air", 0.25, 0.8), s(o + T.ambil - 8, "whip_fast", 0.35), s(o + T.telegram - 10, "impact_glass", 0.25),
    s(o + GRID_IN, "morph_up", 0.35), s(o + GRID_IN + 4, "stack_ticks", 0.3), s(o + T.console - 10, "whip_fast", 0.3, 1.1), s(o + T.console - 6, "scramble", 0.2),
    s(o + T.console + 4, "type_short", 0.25), s(o + T.error - 6, "error_blip", 0.4), s(o + T.grafik - 10, "whip_fast", 0.3, 0.95), s(o + T.cpu - 14, "data_flow", 0.25),
    s(o + T.ram - 14, "data_flow", 0.22, 1.2), s(o + T.meski - 8, "status_warn", 0.22), s(o + T.file - 12, "whip_fast", 0.3, 1.2), s(o + T.file - 4, "stack_ticks", 0.25, 1.15),
    s(o + GRID_OUT, "morph_down", 0.3), s(o + GRID_OUT + 14, "impact_soft", 0.3), s(o + T.tombol - 20, "whip_air", 0.3),
    s(o + T.start - 4, "click_low", 0.5), s(o + T.stop - 4, "click_low", 0.5, 0.88), s(o + T.restart - 4, "click_low", 0.5, 1.08), s(o + T.restart + 70, "status_on", 0.22),
    s(o + WIPE - 6, "rise_short", 0.3), s(o + WIPE + 8, "whip_low", 0.4, 1.2),
  ];
};
