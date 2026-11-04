#!/bin/bash
# pemakaian: scripts/stills.sh nama frame1 frame2 ...  -> out/<nama>.png (lembar kontak)
name=$1; shift
files=()
for fr in "$@"; do
  npx remotion still Explainer out/_s_$fr.png --frame=$fr --scale=0.5 --log=error >/dev/null 2>&1 || echo "gagal $fr"
  files+=(-i out/_s_$fr.png)
done
n=$#
cols=3
python3 - "$name" "$@" <<'PY'
import sys,subprocess
name=sys.argv[1]; frs=sys.argv[2:]
cols=3
rows=(len(frs)+cols-1)//cols
inputs=[]
for fr in frs: inputs+=['-i',f'out/_s_{fr}.png']
# pad to full grid
filt=''
labels=[]
for i,fr in enumerate(frs):
    filt+=f'[{i}]drawtext=text={fr}:x=10:y=10:fontsize=28:fontcolor=red:box=1:boxcolor=white@0.6[v{i}];'
    labels.append(f'[v{i}]')
while len(labels)%cols: 
    filt+=f'color=gray:s=960x540:d=1[e{len(labels)}];'; labels.append(f'[e{len(labels)}]')
layout='|'.join(f'{(i%cols)*960}_{(i//cols)*540}' for i in range(len(labels)))
filt+=''.join(labels)+f'xstack=inputs={len(labels)}:layout={layout},scale=1440:-1'
subprocess.run(['ffmpeg','-v','error','-y']+inputs+['-filter_complex',filt,'-frames:v','1',f'out/{name}.png'],check=True)
PY
rm -f out/_s_*.png
