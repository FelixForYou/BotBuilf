import json, os
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS=60; GAP=0.15
d=json.load(open(f"{root}/scripts/.tts/durations.json"))
cap=json.load(open(f"{root}/scripts/captions.json"))
# lead-in before narration, tail after narration (seconds)
cfg={"s1":(0.5,0.4),"s2":(0.35,0.3),"s3":(0.35,0.3),"s4":(0.35,0.3),"s5":(0.35,0.3),"s6":(0.35,0.4),"s7":(0.35,0.3),"s8":(0.35,3.2)}
scenes=[]; t=0
for sid,(lead,tail) in cfg.items():
    parts=[]; c=lead
    for i,p in enumerate(d[sid]):
        parts.append({"start":round(c*FPS),"dur":round(p["dur"]*FPS),"text":cap[sid][i],"file":os.path.basename(p["file"])})
        c+=p["dur"]+GAP
    dur=round((c-GAP+tail)*FPS)
    scenes.append({"id":sid,"from":t,"dur":dur,"parts":parts}); t+=dur
json.dump({"fps":FPS,"total":t,"scenes":scenes},open(f"{root}/src/timeline.json","w"),indent=1)
print("total frames",t,"=",t/FPS,"s"); [print(s["id"],s["from"],s["dur"],[p["start"] for p in s["parts"]]) for s in scenes]
