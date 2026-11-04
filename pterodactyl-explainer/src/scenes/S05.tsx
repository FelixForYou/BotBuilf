import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT, glow } from "../lib/theme";
import { easeBack, easeIO, easeOut, kf, life, mix, p } from "../lib/anim";
import { makeLocal } from "../lib/time";
import { s, SfxCue } from "../lib/sfx";
import { DashedGrid, Label, LightStreak, Obj, Stage, Words, WarmLight } from "../components/Primitives";
import { Icon } from "../components/Icon";
import { ConsoleView, FileManager, Graph, Line, PowerButtons, PowerState, PteroWindow, series } from "../components/UI";

const L = makeLocal("s05");
const T = {
  dari: L.c("Dari sini"), peran: L.c("peran utama"), satu: L.c("satu tempat"), awasi: L.c("mengawasi bot"), ambil: L.c("Ambil contoh"), asisten: L.c("Asisten Bot"),
  telegram: L.c("Telegram fiktif"), console: L.c("console"), output: L.c("output"), error: L.c("error"), grafik: L.c("Grafik"), cpu: L.c("C P U"), ram: L.c("ram"),
  pakai: L.c("pemakaian"), meski: L.c("meski"), rendah: L.c("rendah"), jaminan: L.c("jaminan"), cepat: L.c("cepat"), file: L.c("File manager"), berkas: L.c("berkas"),
  semua: L.c("Semuanya terkumpul"), tampilan: L.c("satu tampilan"), lalu: L.c("Lalu"), tombol: L.c("tombol"), start: L.c("start"), stop: L.c("stop"), restart: L.c("restart"),
  proses: L.c("proses"), end: L.dur,
};

const lines: Line[] = [
  { t: 40, text: "$ node index.js", kind: "dim" },
  { t: 70, text: "[info] Asisten Bot v1.4.2 dimulai", kind: "info" },
  { t: 100, text: "[info] token dimuat dari variabel lingkungan (disensor)", kind: "dim" },
  { t: 140, text: "[ok]   terhubung ke Bot API Telegram", kind: "ok" },
  { t: T.console + 10, text: "[info] pesan masuk: /jadwal", kind: "in" },
  { t: T.output - 10, text: "[info] balasan terkirim (120 ms)", kind: "info" },
  { t: T.output + 20, text: "[warn] respons lambat: 1,8 s", kind: "warn" },
  { t: T.error - 6, text: "[error] TypeError: Cannot read properties of undefined", kind: "err" },
  { t: T.error + 40, text: "[info] pesan masuk: /info", kind: "in" },
  { t: T.grafik + 30, text: "[info] balasan terkirim (95 ms)", kind: "info" },
  { t: T.start + 6, text: "[panel] sinyal start dikirim", kind: "dim" },
  { t: T.stop + 6, text: "[panel] sinyal stop dikirim", kind: "dim" },
  { t: T.restart + 6, text: "[panel] sinyal restart dikirim", kind: "dim" },
  { t: T.restart + 60, text: "[info] Asisten Bot v1.4.2 dimulai", kind: "info" },
];
const ERR_INDEX = 7;

const cpuFn = series(3, 9, 8, [[60, 20, 4], [130, 14, 3]]);
const ramFn = series(7, 38, 4, [[110, 8, 12]]);

export const S05: React.FC = () => {
  const f = useCurrentFrame();
  const assemble = p(f, 0, 110, easeOut);
  const filesTab = p(f, T.file - 14, T.file + 16, easeIO) * (1 - p(f, T.semua + 40, T.semua + 70, easeIO));
  const state: PowerState =
    f < T.start ? "running" : f < T.stop ? "starting" : f < T.restart ? "stopping" : f < T.restart + 70 ? "starting" : "running";
  const active = f < T.start - 4 ? null : f < T.stop - 4 ? "start" : f < T.restart - 4 ? "stop" : f < T.restart + 40 ? "restart" : null;
  const press = active === "start" ? p(f, T.start - 4, T.start + 10) : active === "stop" ? p(f, T.stop - 4, T.stop + 10) : p(f, T.restart - 4, T.restart + 10);

  // camera targets (window is 1600x900 centred at origin)
  const keys = [0, T.dari, T.ambil - 10, T.telegram + 20, T.console - 10, T.output + 30, T.grafik - 10, T.pakai, T.file - 20, T.berkas + 10, T.semua, T.tampilan + 20, T.lalu, T.tombol, T.proses, T.end];
  const cx = kf(f, keys, [0, 0, -440, -420, -280, -300, 470, 470, -290, -280, 0, 0, 40, 60, 60, 0]);
  const cy = kf(f, keys, [0, 0, -300, -300, 60, 110, -20, 90, 80, 80, 0, 0, -250, -280, -280, -200]);
  const cz = kf(f, keys, [900, 380, -420, -400, -260, -320, -330, -360, -300, -280, 300, 380, -160, -220, -230, -60]);
  const ry = kf(f, keys, [-24, -12, -8, -4, 6, 4, -8, -6, 6, 4, 0, -6, 6, 2, -2, 4]);
  const rx = kf(f, keys, [16, 8, 4, 4, 2, 2, 2, 2, 2, 2, 6, 6, 2, 2, 2, 4]);

  const pieces = [
    { x: -800, y: -450, w: 1600, h: 200, dz: -500 },
    { x: -772, y: -250, w: 990, h: 676, dz: -900 },
    { x: 246, y: -250, w: 526, h: 676, dz: -1300 },
  ];

  return (
    <AbsoluteFill style={{ background: C.black, fontFamily: FONT }}>
      <LightStreak f={f} o={0.5} angle={-24} seed={5} />
      <WarmLight f={f} o={0.55} y={560} r={1050} seed={6} />
      <DashedGrid f={f} xs={[330, 1590]} ys={[170, 910]} bend={kf(f, [T.semua - 20, T.tampilan + 20, T.lalu], [0, 0.7, 0.2])} o={0.4 + 0.3 * p(f, T.semua - 20, T.semua + 20)} />
      <Stage cam={{ x: cx, y: cy, z: cz, ry, rx, persp: 1700 }}>
        <Obj x={0} y={0} w={1600} h={900} style={{ boxShadow: glow(0.9), borderRadius: 18 }}>
          <PteroWindow w={1600} h={900} tab={filesTab > 0.5 ? "Files" : "Console"} name="asisten-bot" state={state} f={f} brand="telegram"
            topRight={<PowerButtons active={active as "start" | "stop" | "restart" | null} press={press} />}>
            <div style={{ position: "absolute", left: 0, top: 0, width: 990, height: 676, overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, transform: `translateX(${-filesTab * 40}px)`, opacity: 1 - filesTab }}>
                <ConsoleView f={f} lines={lines} w={990} h={676} size={19} highlight={ERR_INDEX} hiA={life(f, T.error, 20, T.grafik, 30)} />
              </div>
              <div style={{ position: "absolute", inset: 0, transform: `translateX(${(1 - filesTab) * 40}px)`, opacity: filesTab }}>
                <FileManager f={f} at={T.file - 10} w={990} h={676} rows={[
                  { name: "node_modules", size: "—", dir: true }, { name: "commands", size: "—", dir: true }, { name: "index.js", size: "4,2 KB", hi: true },
                  { name: "config.js", size: "1,1 KB" }, { name: "package.json", size: "0,8 KB" }, { name: ".env (disensor)", size: "0,1 KB" }, { name: "logs", size: "—", dir: true },
                ]} />
              </div>
            </div>
            <div style={{ position: "absolute", left: 1018, top: 0, width: 526, display: "flex", flexDirection: "column", gap: 18 }}>
              <Graph f={f} w={526} h={210} fn={cpuFn} color={C.coral} label="CPU" icon="Cpu" unit={(v) => `${v.toFixed(1)}%`} grow={kf(f, [T.grafik - 20, T.cpu + 30], [0.15, 1], easeOut)} />
              <Graph f={f} w={526} h={210} fn={ramFn} color={C.telegram} label="Memory" icon="MemoryStick" unit={(v) => `${Math.round(v * 5.12)} MiB`} grow={kf(f, [T.ram - 20, T.ram + 30], [0.15, 1], easeOut)} offset={30} />
              <div style={{ height: 210, borderRadius: 12, background: "#23272e", padding: 18, display: "flex", flexDirection: "column", gap: 16, color: "#e6e8eb" }}>
                {([["Clock", "Uptime", "3j 12m"], ["HardDrive", "Disk", "212 MiB"], ["Network", "Jaringan", "12 KiB/s"]] as const).map(([ic, a, b], i) => (
                  <div key={a} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 18 }}>
                    <Icon name={ic} size={22} color="#8b929c" />
                    <div style={{ flex: 1, color: "#8b929c", fontWeight: 600 }}>{a}</div>
                    <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 17 }}>{i === 2 ? `${(10 + 4 * Math.sin(f * 0.07)).toFixed(0)} KiB/s` : b}</div>
                  </div>
                ))}
              </div>
            </div>
          </PteroWindow>
        </Obj>
        {/* assembling plates fly into the window at the start */}
        {pieces.map((pc, i) => {
          const q = p(f, i * 10, 90 + i * 12, easeOut);
          if (assemble >= 0.999) return null;
          return (
            <Obj key={i} x={pc.x + pc.w / 2} y={pc.y + pc.h / 2} z={mix(pc.dz, 2, q)} w={pc.w} h={pc.h} o={(1 - assemble) * 0.9}>
              <div style={{ width: pc.w, height: pc.h, borderRadius: 14, border: "1px solid rgba(255,138,92,0.6)", background: "rgba(255,106,43,0.06)" }} />
            </Obj>
          );
        })}
        {/* explanatory annotations living in the world */}
        <Obj x={-420} y={-372} z={60} w={420} h={50} o={life(f, T.telegram - 10, 24, T.console - 20, 24)}>
          <Label bg="rgba(38,165,228,0.18)" color="#9bd8f6" size={20}><Icon name="Info" size={18} color="#9bd8f6" /> bot Telegram fiktif</Label>
        </Obj>
        <Obj x={500} y={-222} z={120} w={560} h={50} o={life(f, T.meski - 10, 24, T.file - 30, 24)}>
          <Label bg="rgba(255,255,255,0.1)" color="#fff" size={20}><Icon name="TriangleAlert" size={18} color={C.warn} /> CPU rendah bukan jaminan bot cepat</Label>
        </Obj>
      </Stage>

      <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ position: "absolute", top: 84 }}>
          <Words f={f} text="Satu tempat untuk mengawasi bot." at={T.satu} times={[T.satu, T.satu + 12, T.awasi - 16, T.awasi, T.awasi + 18]} size={40} color="#fff" accent={[3, 4]} out={T.ambil - 20} />
        </div>
        <div style={{ position: "absolute", bottom: 70 }}>
          <Words f={f} text="Console · output dan error" at={T.console} times={[T.console, T.output - 4, T.output + 10, T.output + 18, T.error]} size={28} color="rgba(255,255,255,0.8)" weight={500} accent={[4]} accentColor={C.err} out={T.grafik - 20} />
        </div>
        <div style={{ position: "absolute", bottom: 70 }}>
          <Words f={f} text="Grafik CPU & RAM" at={T.grafik} times={[T.grafik, T.cpu, T.ram - 10, T.ram]} size={28} color="rgba(255,255,255,0.8)" weight={500} out={T.file - 20} />
        </div>
        <div style={{ position: "absolute", bottom: 70 }}>
          <Words f={f} text="File manager" at={T.file} size={28} color="rgba(255,255,255,0.8)" weight={500} out={T.semua - 10} />
        </div>
        <div style={{ position: "absolute", top: 84 }}>
          <Words f={f} text="Semua dalam satu tampilan." at={T.semua} times={[T.semua, T.tampilan - 20, T.tampilan, T.tampilan + 14]} size={40} color="#fff" accent={[3]} out={T.lalu - 6} />
        </div>
        <div style={{ position: "absolute", bottom: 70 }}>
          <Words f={f} text="Start · Stop · Restart" at={T.start} times={[T.start, T.stop - 10, T.stop, T.restart - 10, T.restart]} size={30} color="#fff" weight={600} out={T.end - 40} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const sfx05 = (): SfxCue[] => {
  const o = L.from;
  return [
    s(o, "panel_lift", 0.4, 0.9), s(o + 14, "panel_pass", 0.3, 1.1), s(o + 90, "settle", 0.45),
    s(o + 40, "type_short", 0.22), s(o + 140, "status_on", 0.18),
    s(o + T.ambil - 10, "panel_slide", 0.35, 1.1), s(o + T.console - 10, "panel_slide", 0.3, 0.9), s(o + T.console + 10, "type_short", 0.25, 1.1),
    s(o + T.error - 6, "error_blip", 0.4), s(o + T.grafik - 10, "panel_pass", 0.3), s(o + T.cpu - 10, "data_flow", 0.25), s(o + T.ram - 10, "data_flow", 0.22, 1.2),
    s(o + T.meski - 8, "status_warn", 0.22), s(o + T.file - 14, "click_soft", 0.4), s(o + T.file - 2, "panel_slide", 0.28, 1.25),
    s(o + T.semua - 10, "swell_bright", 0.3, 0.85), s(o + T.tombol - 20, "panel_pass", 0.3, 0.9),
    s(o + T.start - 4, "click_low", 0.5), s(o + T.stop - 4, "click_low", 0.5, 0.88), s(o + T.restart - 4, "click_low", 0.5, 1.08), s(o + T.restart + 70, "status_on", 0.25),
  ];
};
