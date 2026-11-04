#!/bin/bash
# Pemeriksaan hasil render: durasi, frame, fps, resolusi, frame hitam, freeze panjang, loudness.
V=${1:-out/pterodactyl-explainer.mp4}
echo "== stream"
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=codec_name,width,height,r_frame_rate,nb_read_frames,pix_fmt -of default=nw=1 "$V"
ffprobe -v error -show_entries format=duration -of default=nw=1 "$V"
ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,duration -of default=nw=1 "$V"
echo "== frame hitam (>=0.5 dtk)"
ffmpeg -hide_banner -i "$V" -vf "blackdetect=d=0.5:pix_th=0.06" -an -f null - 2>&1 | grep blackdetect || echo "tidak ada"
echo "== freeze (>=2 dtk)"
ffmpeg -hide_banner -i "$V" -vf "freezedetect=n=0.0008:d=2" -an -f null - 2>&1 | grep -E "freeze_(start|duration)" || echo "tidak ada"
echo "== loudness"
ffmpeg -hide_banner -i "$V" -af loudnorm=print_format=summary -vn -f null - 2>&1 | grep -E "Input (Integrated|True Peak)"
