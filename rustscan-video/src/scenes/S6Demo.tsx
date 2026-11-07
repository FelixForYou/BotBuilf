import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Icon } from "../components/Icons";
import { KaliTerminal, Seg, TermLine } from "../components/KaliTerminal";
import { C, FONT, MONO } from "../theme";
import { beat, easeInOut, prog, sec, spr } from "../timing";

const CMD = "rustscan -a 127.0.0.1 -r 3000-9000 --ulimit 5000 -- -sV";
const span = (tok: string, from = 0) => {
  const i = CMD.indexOf(tok, from);
  return { from: i, to: i + tok.length };
};

// Captured verbatim from a real run in our local lab (output condensed, not altered).
const BANNER = [
  ".----. .-. .-. .----..---.  .----. .---.   .--.  .-. .-.",
  "| {}  }| { } |{ {__ {_   _}{ {__  /  ___} / {} \\ |  `| |",
  "| .-. \\| {_} |.-._} } | |  .-._} }\\     }/  /\\  \\| |\\  |",
  "`-' `-'`-----'`----'  `-'  `----'  `---' `-'  `-'`-' `-'",
];

const PARAMS = [
  { tok: "-a 127.0.0.1", desc: "alamat target (lab lokal)", key: "tok0" },
  { tok: "-r 3000-9000", desc: "rentang port yang dipindai", key: "tok1" },
  { tok: "--ulimit 5000", desc: "naikkan batas koneksi/file", key: "tok2" },
  { tok: "-- -sV", desc: "diteruskan ke Nmap: deteksi versi", key: "tok3" },
];

export const S6Demo: React.FC = () => {
  const f = useCurrentFrame();
  const type = beat("s6", "type");
  const enter = beat("s6", "enter");
  const o0 = beat("s6", "open0");
  const o1 = beat("s6", "open1");
  const nm = beat("s6", "nmap");
  const table = beat("s6", "table");
  const dash = beat("s6", "dash");

  const hl = [
    { ...span("-a 127.0.0.1"), color: C.cyan, at: beat("s6", "tok0") },
    { ...span("-r 3000-9000"), color: C.cyan, at: beat("s6", "tok1") },
    { ...span("--ulimit 5000"), color: C.cyan, at: beat("s6", "tok2") },
    { ...span("-- -sV"), color: C.yellow, at: beat("s6", "tok3") },
  ].map((h) => ({ ...h, at: h.at }));

  const o = (at: number, segs: Seg[]): TermLine => ({ at, kind: "out", segs });
  const g = (t: string) => [{ text: t, color: C.green }];
  const lines: TermLine[] = [
    { at: type, kind: "cmd", text: CMD, typeDur: sec(2.1), hl },
    ...BANNER.map((b, i) => o(enter + 2 + i, [{ text: b, color: C.kali }])),
    o(enter + 6, [{ text: "The Modern Day Port Scanner.", color: C.text }]),
    o(enter + 12, [{ text: "[~] ", color: C.cyan }, { text: "Automatically increasing ulimit value to 5000." }]),
    o(o0, [{ text: "Open ", color: C.text }, { text: "127.0.0.1:3000", color: C.cyan, bold: true }]),
    o(o1, [{ text: "Open ", color: C.text }, { text: "127.0.0.1:8080", color: C.cyan, bold: true }]),
    o(nm - 8, [{ text: "[~] ", color: C.cyan }, { text: "Starting Script(s)" }]),
    o(nm, [{ text: "[>] ", color: C.yellow }, { text: 'Running script "nmap -vvv -p {{port}} -{{ipversion}} {{ip}} -sV"' }]),
    o(nm + 10, g("Initiating SYN Stealth Scan")),
    o(nm + 18, g("Discovered open port 8080/tcp on 127.0.0.1")),
    o(nm + 24, g("Discovered open port 3000/tcp on 127.0.0.1")),
    o(nm + 34, g("Initiating Service scan")),
    o(nm + 52, [{ text: "Nmap scan report for localhost (127.0.0.1)", color: C.text }]),
    o(table - 6, [{ text: "PORT     STATE SERVICE REASON         VERSION", color: C.text, bold: true }]),
    o(table, [{ text: "3000/tcp ", color: C.cyan }, { text: "open  http    syn-ack ttl 64 SimpleHTTPServer 0.6 (Python 3.13.18)", color: C.text }]),
    o(table + 6, [{ text: "8080/tcp ", color: C.cyan }, { text: "open  http    syn-ack ttl 64 SimpleHTTPServer 0.6 (Python 3.13.18)", color: C.text }]),
    o(table + 18, [{ text: "Nmap done: 1 IP address (1 host up) scanned in 6.24 seconds" }]),
  ];

  const legendOut = prog(f, dash - 14, 24, easeInOut);
  const labP = prog(f, beat("s6", "lab"), 24);
  const dashP = spr(f, dash, 15, 110);
  const timelapse = f > enter && f < table + 30;

  return (
    <AbsoluteFill>
      {/* target badge */}
      <div style={{ position: "absolute", left: 100, top: 110, display: "flex", alignItems: "center", gap: 14, padding: "10px 22px", borderRadius: 999, border: `1.5px solid ${C.green}88`, background: `${C.green}12`, fontFamily: MONO, fontSize: 24, color: C.text, opacity: labP, transform: `translateY(${(1 - labP) * -20}px)` }}>
        <Icon name="shieldCheck" size={30} color={C.green} />
        TARGET: 127.0.0.1 · LAB LOKAL · MILIK SENDIRI
      </div>
      {timelapse ? (
        <div style={{ position: "absolute", left: 1010, top: 118, fontFamily: MONO, fontSize: 20, color: C.yellow, letterSpacing: 3, display: "flex", alignItems: "center", gap: 8, opacity: 0.6 + 0.4 * Math.sin(f / 6) }}><Icon name="play" size={20} color={C.yellow} fill={C.yellow} /> TIMELAPSE</div>
      ) : null}

      <KaliTerminal x={100} y={180} w={1160} h={720} lines={lines} start={beat("s6", "term")} fontSize={20} title="kali@kali: ~/lab" tilt={interpolate(f, [0, 900], [3, -2])} />

      {/* parameter legend */}
      <div style={{ position: "absolute", left: 1310, top: 190, width: 510, opacity: 1 - legendOut, transform: `translateX(${legendOut * 60}px)` }}>
        <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 4, color: C.cyan, marginBottom: 18, opacity: prog(f, beat("s6", "tok0") - 10, 20) }}>PARAMETER</div>
        {PARAMS.map((p) => {
          const at = beat("s6", p.key);
          const pp = prog(f, at, 24);
          const isNmap = p.key === "tok3";
          return (
            <div key={p.key} style={{ marginBottom: 20, padding: "16px 20px", borderRadius: 14, background: C.panel, border: `1.5px solid ${(isNmap ? C.yellow : C.cyan)}66`, opacity: pp, transform: `translateX(${(1 - pp) * 50}px)`, boxShadow: `inset 4px 0 0 ${isNmap ? C.yellow : C.cyan}` }}>
              <div style={{ fontFamily: MONO, fontSize: 30, color: isNmap ? C.yellow : C.cyan, fontWeight: 700 }}>{p.tok}</div>
              <div style={{ fontFamily: FONT, fontSize: 26, color: C.text, marginTop: 4 }}>{p.desc}</div>
            </div>
          );
        })}
      </div>

      {/* results dashboard */}
      <div style={{ position: "absolute", left: 1310, top: 190, width: 510, opacity: Math.min(dashP, 1), transform: `translateY(${(1 - dashP) * 50}px)` }}>
        <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 4, color: C.green, marginBottom: 14 }}>HASIL SCAN</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 18 }}>
          <span style={{ fontFamily: FONT, fontSize: 110, fontWeight: 700, color: C.text, lineHeight: 1 }}>2</span>
          <span style={{ fontFamily: FONT, fontSize: 34, color: C.muted }}>port terbuka</span>
        </div>
        {["3000", "8080"].map((port, i) => {
          const pp = prog(f, dash + 10 + i * 8, 22);
          return (
            <div key={port} style={{ display: "flex", alignItems: "center", gap: 18, padding: "16px 20px", marginBottom: 14, borderRadius: 14, background: C.panel, border: `1.5px solid ${C.green}66`, opacity: pp, transform: `translateX(${(1 - pp) * 40}px)` }}>
              <Icon name="server" size={40} color={C.green} />
              <div>
                <div style={{ fontFamily: MONO, fontSize: 30, color: C.text, fontWeight: 700 }}>{port}/tcp · http</div>
                <div style={{ fontFamily: MONO, fontSize: 20, color: C.muted }}>SimpleHTTPServer 0.6 (Python)</div>
              </div>
            </div>
          );
        })}
        <div style={{ marginTop: 10, padding: "16px 20px", borderRadius: 14, border: `1.5px dashed ${C.kali}88`, fontFamily: MONO, fontSize: 21, color: C.muted, lineHeight: 1.5, opacity: prog(f, dash + 36, 24) }}>
          <span style={{ color: C.cyan }}>Benchmark lab:</span> -r 1-65535 di localhost selesai ±3,1 dtk (diukur langsung).
        </div>
      </div>
    </AbsoluteFill>
  );
};
