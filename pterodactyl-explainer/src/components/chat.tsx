import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Check, CheckCheck, ChevronLeft, MoreVertical, Paperclip, Send} from 'lucide-react';
import {C, FONT} from '../lib/theme';
import {E, clamp01, ip, p} from '../lib/anim';
import {Icon, TelegramLogo, TypingDots, WhatsAppLogo} from './graphics';

export type Platform = 'telegram' | 'whatsapp';
export type Msg = {at: number; text: string; from: 'user' | 'bot'; typingFrom?: number; time?: string};

const theme = (pl: Platform) =>
  pl === 'telegram'
    ? {head: '#ffffff', headText: '#0f1419', bg: '#e9eef3', user: '#e1f6cb', bot: '#ffffff', accent: C.telegram, sub: '#7c8a97'}
    : {head: '#f0f2f5', headText: '#111b21', bg: '#efeae2', user: '#d9fdd3', bot: '#ffffff', accent: C.whatsapp, sub: '#667781'};

/** Gelembung pesan tunggal (bisa dipakai lepas dari jendela chat). */
export const Bubble: React.FC<{text: string; from: 'user' | 'bot'; platform: Platform; size?: number; time?: string; maxW?: number; style?: React.CSSProperties; tint?: number}> = ({
  text, from, platform, size = 24, time = '09:41', maxW = 520, style, tint,
}) => {
  const t = theme(platform);
  const isUser = from === 'user';
  return (
    <div style={{display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', ...style}}>
      <div style={{maxWidth: maxW, background: isUser ? t.user : t.bot, padding: `${size * 0.5}px ${size * 0.7}px ${size * 0.4}px`,
        borderRadius: size * 0.75, borderBottomRightRadius: isUser ? size * 0.2 : size * 0.75, borderBottomLeftRadius: isUser ? size * 0.75 : size * 0.2,
        fontFamily: FONT, fontSize: size, color: '#111', lineHeight: 1.35, boxShadow: '0 2px 6px rgba(0,0,0,0.08)', position: 'relative',
        outline: tint ? `2px solid ${t.accent}${Math.round(tint * 255).toString(16).padStart(2, '0')}` : undefined}}>
        <span style={{whiteSpace: 'pre-wrap'}}>{text}</span>
        <span style={{display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 12, fontSize: size * 0.58, color: t.sub, verticalAlign: 'bottom'}}>
          {time}
          {isUser && <Icon i={platform === 'whatsapp' ? CheckCheck : Check} size={size * 0.7} color={platform === 'whatsapp' ? '#53bdeb' : '#4fae4e'} />}
        </span>
      </div>
    </div>
  );
};

/** Jendela percakapan (dibuat sederhana; nama & isi fiktif). */
export const ChatWindow: React.FC<{
  w: number; h: number; platform: Platform; title: string; subtitle?: string; msgs: Msg[]; size?: number; morph?: number;
}> = ({w, h, platform, title, subtitle = 'bot', msgs, size = 24}) => {
  const f = useCurrentFrame();
  const t = theme(platform);
  const shown = msgs.filter((m) => f >= (m.typingFrom ?? m.at));
  return (
    <div style={{width: w, height: h, background: t.bg, borderRadius: 26, overflow: 'hidden', position: 'relative', fontFamily: FONT}}>
      <div style={{height: 92, background: t.head, display: 'flex', alignItems: 'center', gap: 16, padding: '0 24px', borderBottom: '1px solid rgba(0,0,0,0.06)'}}>
        <Icon i={ChevronLeft} size={28} color={t.accent} />
        <div style={{width: 54, height: 54, borderRadius: '50%', background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          {platform === 'telegram' ? <TelegramLogo size={34} mono="#fff" /> : <WhatsAppLogo size={32} mono="#fff" />}
        </div>
        <div>
          <div style={{fontSize: 24, fontWeight: 700, color: t.headText}}>{title}</div>
          <div style={{fontSize: 17, color: t.sub}}>{subtitle}</div>
        </div>
        <div style={{marginLeft: 'auto'}}>
          <Icon i={MoreVertical} size={26} color={t.sub} />
        </div>
      </div>
      <div style={{position: 'absolute', left: 22, right: 22, bottom: 96, display: 'flex', flexDirection: 'column', gap: 14}}>
        {shown.map((m, i) => {
          const typing = m.typingFrom !== undefined && f < m.at;
          const a = p(f, m.typingFrom ?? m.at, 22, E.back);
          const a2 = typing ? 1 : p(f, m.at, 16);
          return (
            <div key={i} style={{opacity: clamp01(a * 1.4), transform: `translateY(${(1 - a) * 26}px) scale(${0.9 + 0.1 * a})`,
              transformOrigin: m.from === 'user' ? '100% 100%' : '0% 100%'}}>
              {typing ? (
                <div style={{display: 'flex'}}>
                  <div style={{background: t.bot, borderRadius: 18, padding: '16px 20px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)'}}>
                    <TypingDots size={10} />
                  </div>
                </div>
              ) : (
                <div style={{opacity: a2}}>
                  <Bubble text={m.text} from={m.from} platform={platform} size={size} time={m.time} maxW={w * 0.78} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 82, background: t.head, display: 'flex', alignItems: 'center', gap: 16, padding: '0 24px'}}>
        <Icon i={Paperclip} size={26} color={t.sub} />
        <div style={{flex: 1, height: 48, borderRadius: 24, background: platform === 'telegram' ? '#f1f3f5' : '#fff', color: t.sub, fontSize: 19, display: 'flex', alignItems: 'center', padding: '0 20px'}}>
          Pesan
        </div>
        <div style={{width: 48, height: 48, borderRadius: '50%', background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Icon i={Send} size={22} color="#fff" sw={2} />
        </div>
      </div>
    </div>
  );
};

export const chatProgress = (f: number, a: number) => ip(f, [a, a + 20], [0, 1]);
