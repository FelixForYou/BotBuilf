import numpy as np, wave
sr=48000; D=14.0; n=int(sr*D); t=np.arange(n)/sr; out=np.zeros(n)
rng=np.random.default_rng(1)
def add(sig,at,g=1.0):
    i=int(at*sr); j=min(n,i+len(sig)); out[i:j]+=g*sig[:j-i]
def env(L,a,d):
    x=np.arange(int(L*sr))/sr; return np.minimum(1,x/a)*np.exp(-x/d)
def lp(x,k):  # one-pole lowpass with time-varying coeff
    y=np.zeros_like(x); s=0
    k=np.broadcast_to(k,x.shape)
    for i in range(len(x)): s+=k[i]*(x[i]-s); y[i]=s
    return y
def whoosh(L=0.7,up=True):
    m=int(L*sr); x=rng.standard_normal(m); p=np.linspace(0,1,m)
    k=(0.02+0.25*(p if up else 1-p)); y=lp(x,k)
    e=np.sin(np.pi*p)**2; return y*e*0.9
def pop(f=900,L=0.18):
    x=np.arange(int(L*sr))/sr; fr=f*np.exp(-x*18)+f*.5
    return np.sin(2*np.pi*np.cumsum(fr)/sr)*env(L,.002,.04)
def chime(f=660,L=2.5):
    x=np.arange(int(L*sr))/sr; s=sum(np.sin(2*np.pi*f*h*x)/(i+1) for i,h in enumerate([1,2,3.01,4.2]))
    return s*env(L,.005,.6)*0.35
def click(L=0.03):
    m=int(L*sr); return rng.standard_normal(m)*np.exp(-np.arange(m)/(sr*.004))*0.5
# ambient pad
pad=sum(np.sin(2*np.pi*f*t+np.sin(2*np.pi*.2*t)*.5) for f in [55,82.4,110,164.8])*0.05
pad*=np.minimum(1,t/1.5)*np.clip((D-t)/1.0,0,1); out+=pad
# beat pulses
for b in np.arange(0.0,13.0,0.5):
    x=np.arange(int(.35*sr))/sr; k=np.sin(2*np.pi*np.cumsum(50+80*np.exp(-x*30))/sr)*np.exp(-x*9)
    add(k,b,0.35 if b<9.6 else 0.0)
for a,u in [(0.0,True),(1.95,True),(5.3,True),(8.45,False),(9.25,True)]: add(whoosh(.8,u),a,0.6)
for a,f in [(2.6,800),(3.45,900),(3.6,1000),(4.6,700),(6.2,600),(8.6,700)]: add(pop(f),a,0.5)
add(click(),6.78,1.0); add(pop(1400,.1),6.8,0.4)
for i in range(9): add(pop(1200+i*90,.08),6.95+i*.035,0.12)
add(chime(523),9.7,1.0); add(chime(784,2.0),10.2,0.6)
for i in range(15): add(click(.015),11.65+i*0.65/15,0.35)
add(chime(659,2.0),12.3,0.4)
# number tick sweep
for i in range(20): add(click(.01),4.7+i*0.03,0.15)
out=out/np.max(np.abs(out))*0.85
st=np.stack([out,np.roll(out,240)],1)
w=wave.open('sfx.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr)
w.writeframes((st*32767).astype(np.int16).tobytes()); w.close()
