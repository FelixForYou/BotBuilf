#!/usr/bin/env bash
# Render preview stills: scripts/stills.sh OUTDIR frame1 frame2 ...
out=$1; shift
mkdir -p "$out"
npx remotion bundle src/index.ts --out-dir .remotion/bundle >/dev/null 2>&1 || { echo bundle failed; exit 1; }
for fr in "$@"; do
  npx remotion still .remotion/bundle PterodactylExplainer "$out/f$fr.jpg" --frame=$fr --image-format=jpeg --scale=0.5 --log=error &
  while [ $(jobs -r | wc -l) -ge 4 ]; do wait -n; done
done
wait
