"""Procedurally synthesised SFX (royalty-free) for the Juice Shop motion video."""
import numpy as np, wave, os
SR = 48000
rng = np.random.default_rng(7)
OUT = "public/sfx"

def t(d): return np.arange(int(SR*d))/SR
def env(n, a=0.005, r=0.1, shape=3.0):
    e = np.ones(n); ai=max(1,int(SR*a)); e[:ai]=np.linspace(0,1,ai)
    tail = np.linspace(0,1,n-ai); e[ai:] = (1-tail)**shape if r else 1
    return e
def lp(x, a):  # one-pole lowpass, a in (0,1) per-sample or array
    y = np.zeros_like(x); s = 0.0
    a = np.broadcast_to(a, x.shape)
    for i in range(len(x)): s += a[i]*(x[i]-s); y[i]=s
    return y
def hp(x,a): return x - lp(x,a)
def save(name, x, gain=0.9):
    x = np.asarray(x, dtype=np.float64)
    if x.ndim==1: x = np.stack([x,x],1)
    x = x/ (np.max(np.abs(x))+1e-9) * gain
    with wave.open(f"{OUT}/{name}.wav","wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x*32767).astype(np.int16).tobytes())
def pan(x, p):  # p: -1..1 array or scalar
    p = np.broadcast_to(p, x.shape); l=np.sqrt((1-p)/2); r=np.sqrt((1+p)/2)
    return np.stack([x*l,x*r],1)

# whoosh: noise with sweeping lowpass + stereo pan
def whoosh(d=0.7, up=True):
    n=int(SR*d); x=rng.standard_normal(n); k=np.linspace(0,1,n)
    cut = (0.01+0.25*np.sin(np.pi*k)**2) ; y=lp(lp(x,cut),cut)
    y*= np.sin(np.pi*k)**1.5
    return pan(y, np.linspace(-0.7,0.7,n) if up else np.linspace(0.7,-0.7,n))
save("whoosh", whoosh(0.7)); save("whoosh_rev", whoosh(0.55, False), 0.75)
# impact: sub drop + noise burst
tt=t(1.6); sub=np.sin(2*np.pi*(55*tt - 25*tt**2/1.6))*np.exp(-tt*2.6)
burst=lp(rng.standard_normal(len(tt)),0.08)*np.exp(-tt*14)
save("impact", sub*1.0+burst*0.6)
# riser: rising tone + noise
tt=t(1.8); f=200+1400*(tt/1.8)**2; ph=2*np.pi*np.cumsum(f)/SR
r=(np.sin(ph)*0.35+np.sin(ph*1.5)*0.15)+hp(rng.standard_normal(len(tt)),0.3)*0.3*(tt/1.8)
save("riser", r*(tt/1.8)**1.6, 0.7)
# ui click / tick
tt=t(0.06); c=np.sin(2*np.pi*2400*tt)*np.exp(-tt*120)+hp(rng.standard_normal(len(tt)),0.5)*np.exp(-tt*300)*0.5
save("click", c, 0.6)
# blip (HUD)
tt=t(0.12); save("blip", np.sin(2*np.pi*(1200+600*tt/0.12)*tt)*env(len(tt),0.002,1,2), 0.45)
# double beep confirm
tt=t(0.09); b=np.sin(2*np.pi*1500*tt)*env(len(tt),0.002,1,1.5)
save("beep2", np.concatenate([b,np.zeros(int(SR*0.04)),np.sin(2*np.pi*2000*tt)*env(len(tt),0.002,1,1.5)]),0.45)
# keyboard typing burst (2.0s of irregular key clicks)
def typing(d=2.0, rate=13):
    n=int(SR*d); y=np.zeros(n); p=0
    while p<n-2000:
        L=int(SR*0.035); k=np.arange(L)/SR
        key=(hp(rng.standard_normal(L),0.6)*np.exp(-k*180)*0.7+np.sin(2*np.pi*rng.uniform(1800,3200)*k)*np.exp(-k*260)*0.4)
        y[p:p+L]+=key*rng.uniform(0.5,1.0); p+=int(SR/rate*rng.uniform(0.55,1.5))
    return y
save("typing", typing(), 0.55); save("typing_short", typing(0.9), 0.55)
# glitch: bit-crushed stutter
n=int(SR*0.45); g=np.zeros(n); pos=0
while pos<n:
    L=int(SR*rng.uniform(0.015,0.05)); seg=np.sign(np.sin(2*np.pi*rng.uniform(80,900)*np.arange(L)/SR))*rng.uniform(0.3,1)
    seg+=rng.standard_normal(L)*0.4; g[pos:pos+L]=seg[:max(0,min(L,n-pos))]; pos+=L+int(SR*rng.uniform(0,0.02))
g=np.round(g*6)/6; save("glitch", lp(g,0.5), 0.5)
# success chime (arpeggio)
out=np.zeros(int(SR*1.2))
for i,f in enumerate([880,1108.7,1318.5,1760]):
    tt=t(0.9); s=(np.sin(2*np.pi*f*tt)+0.3*np.sin(4*np.pi*f*tt))*np.exp(-tt*5)
    o=int(SR*0.07*i); out[o:o+len(s)]+=s
save("chime", out, 0.55)
# star pop: sparkle shimmer
tt=t(1.0); sp=np.zeros(len(tt))
for f in [2093,2637,3136,4186,5274]:
    sp+=np.sin(2*np.pi*f*tt+rng.uniform(0,6))*np.exp(-tt*rng.uniform(4,8))
pop=np.sin(2*np.pi*(300+500*np.exp(-tt*30))*tt)*np.exp(-tt*25)
save("star", sp*0.5+pop, 0.6)
# scan sweep (sine sweep with tremolo)
tt=t(1.2); f=400+2400*tt/1.2; s=np.sin(2*np.pi*np.cumsum(f)/SR)*(0.6+0.4*np.sin(2*np.pi*22*tt))*np.sin(np.pi*tt/1.2)
save("scan", s, 0.32)
# data chatter (fast random blips)
n=int(SR*1.2); d=np.zeros(n); p=0
while p<n-3000:
    L=int(SR*0.018); k=np.arange(L)/SR; d[p:p+L]+=np.sin(2*np.pi*rng.choice([1600,2200,2800,3400])*k)*np.exp(-k*200)
    p+=int(SR*rng.uniform(0.025,0.06))
save("chatter", d, 0.3)
# soft tick for counter
tt=t(0.03); save("tick", np.sin(2*np.pi*3200*tt)*np.exp(-tt*250), 0.35)
# low drone pulse (hum for HUD boot) 
tt=t(2.5); save("hum", (np.sin(2*np.pi*55*tt)+0.5*np.sin(2*np.pi*110*tt))*np.sin(np.pi*tt/2.5)**2, 0.35)
# error buzz (vulnerable code highlight)
tt=t(0.35); save("buzz", np.sign(np.sin(2*np.pi*140*tt))*0.5*env(len(tt),0.005,1,1)+np.sin(2*np.pi*280*tt)*0.3*env(len(tt),0.005,1,1), 0.35)
print(sorted(os.listdir(OUT)))
