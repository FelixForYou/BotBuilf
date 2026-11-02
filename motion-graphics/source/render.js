const {chromium}=require('playwright');const {spawn}=require('child_process');
const [,,html,out,fpsArg,preview]=process.argv;const fps=+fpsArg||60;
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
 await p.goto('file://'+html);await p.waitForTimeout(500);
 const dur=await p.evaluate(()=>DUR);
 if(preview){ const ts=preview.split(',').map(Number);
   for(const t of ts){await p.evaluate(t=>render(t),t);await p.screenshot({path:`${out}/pv_${t.toFixed(2)}.jpg`,type:'jpeg',quality:80});}
   await b.close();return;}
 const ff=spawn('ffmpeg',['-y','-v','error','-f','image2pipe','-framerate',String(fps),'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','slow','-crf','16','-pix_fmt','yuv420p',out],{stdio:['pipe','inherit','inherit']});
 const N=Math.round(dur*fps);
 for(let i=0;i<N;i++){await p.evaluate(t=>render(t),i/fps);const buf=await p.screenshot({type:'jpeg',quality:95});
   if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r)); if(i%120==0)console.log(i,'/',N);}
 ff.stdin.end();await new Promise(r=>ff.on('close',r));await b.close();
})();
