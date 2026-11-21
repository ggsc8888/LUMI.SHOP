"use client";import Link from"next/link";import{useCallback,useEffect,useRef,useState}from"react";import{fileToRaster,videoToRaster}from"@/lib/client/image";import{applyH,fitHomography}from"@/lib/measure/homography";import{correspondences,detectMarkers}from"@/lib/measure/markers";import{MAT_SIZE}from"@/lib/measure/mat";import{detectPaper,PAPER_SIZES}from"@/lib/measure/paper";import{Button}from"./ui";export function drawRuler(ctx,H,s,Wmm,Hmm){const P=(x,y)=>{const p=applyH(H,{x,y});return{x:p.x*s,y:p.y*s}},cx=Wmm/2,cy=Hmm/2,pxPerMm=Math.hypot(P(cx+1,cy).x-P(cx,cy).x,P(cx+1,cy).y-P(cx,cy).y),dpr=devicePixelRatio;ctx.setLineDash([6*dpr,6*dpr]),ctx.strokeStyle="rgba(176,141,87,0.95)",ctx.lineWidth=2*dpr,ctx.beginPath(),[[0,0],[Wmm,0],[Wmm,Hmm],[0,Hmm]].forEach(([x,y],i)=>{const p=P(x,y);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)}),ctx.closePath(),ctx.stroke(),ctx.setLineDash([]);const step=pxPerMm>=3?1:pxPerMm>=1?5:10,every=pxPerMm*10<26*dpr?20:10,spanX=[Math.ceil(Wmm*.15/10)*10,Math.floor(Wmm*.85/10)*10],spanY=[Math.ceil(Hmm*.15/10)*10,Math.floor(Hmm*.85/10)*10],rulers=[[(t,o)=>P(t,cy+o),spanX],[(t,o)=>P(cx+o,t),spanY]];ctx.font=`${11*dpr}px ui-sans-serif, system-ui`,ctx.textAlign="center",ctx.textBaseline="top",rulers.forEach(([at,[t0,t1]],r)=>{const a=at(t0,0),b=at(t1,0);ctx.strokeStyle="rgba(255,255,255,0.95)",ctx.lineWidth=2*dpr,ctx.beginPath(),ctx.moveTo(a.x,a.y),ctx.lineTo(b.x,b.y),ctx.stroke();for(let t=t0;t<=t1;t+=step){const d=t-t0,len=d%10===0?4:d%5===0?2.5:1.5,p0=at(t,0),p1=at(t,len);ctx.strokeStyle=d%10===0?"rgba(255,255,255,1)":"rgba(255,255,255,0.8)",ctx.lineWidth=(d%10===0?2:1)*dpr,ctx.beginPath(),ctx.moveTo(p0.x,p0.y),ctx.lineTo(p1.x,p1.y),ctx.stroke();const centre=r===1&&Math.abs(t-cy)<5;if(d%every===0&&!centre){const lp=at(t,5.5),lbl=String(d/10);ctx.fillStyle="rgba(29,26,23,0.65)";const w=ctx.measureText(lbl).width+6*dpr;ctx.fillRect(lp.x-w/2,lp.y-1*dpr,w,14*dpr),ctx.fillStyle="#fff",ctx.fillText(lbl,lp.x,lp.y)}}});const u=P(spanX[1]+2,cy+2);ctx.textAlign="left",ctx.fillStyle="rgba(29,26,23,0.65)",ctx.fillRect(u.x,u.y,26*dpr,14*dpr),ctx.fillStyle="#fff",ctx.fillText("cm",u.x+4*dpr,u.y+1*dpr)}export function CameraCapture({mode,onCaptured,hint,autoStart=!1,paperSize="a4"}){const videoRef=useRef(null),overlayRef=useRef(null),streamRef=useRef(null),[live,setLive]=useState(!1),[error,setError]=useState(null),[markers,setMarkers]=useState(0),stableSince=useRef(null),[steady,setSteady]=useState(!1),[busy,setBusy]=useState(null),[res,setRes]=useState(""),stop=useCallback(()=>{streamRef.current?.getTracks().forEach(t=>t.stop()),streamRef.current=null,setLive(!1)},[]);useEffect(()=>stop,[stop]);async function start(){setError(null);try{const stream=await navigator.mediaDevices.getUserMedia({audio:!1,video:{facingMode:{ideal:"environment"},width:{ideal:3840},height:{ideal:2160}}});streamRef.current=stream,stream.getVideoTracks()[0].applyConstraints({advanced:[{focusMode:"continuous"}]}).catch(()=>{});const v=videoRef.current;v.srcObject=stream,await v.play(),setRes(`${v.videoWidth}\xD7${v.videoHeight}`),setLive(!0)}catch(e){setError(e instanceof Error&&e.name==="NotAllowedError"?"Camera permission was denied. Allow camera access, or use “Camera app” / “Upload” below.":"Camera unavailable in this browser. Use “Camera app” or “Upload” below.")}}useEffect(()=>{if(!autoStart)return;const t=setTimeout(start,0);return()=>clearTimeout(t)},[autoStart]),useEffect(()=>{if(!live||mode!=="mat"&&mode!=="paper")return;let alive=!0;const tick=()=>{if(!alive)return;const v=videoRef.current,o=overlayRef.current;if(v&&o&&v.videoWidth){const small=videoToRaster(v,mode==="paper"?640:960),rect=v.getBoundingClientRect();o.width=rect.width*devicePixelRatio,o.height=rect.height*devicePixelRatio;const ctx=o.getContext("2d");ctx.clearRect(0,0,o.width,o.height);const s=o.width/small.width;let ok=!1;if(mode==="paper"){const det=detectPaper(small,paperSize,{refine:!1});if(det)try{drawRuler(ctx,fitHomography(det.mm,det.corners),s,det.widthMm,det.heightMm),ok=!0}catch{}setMarkers(ok?4:0)}else{const found=detectMarkers(small,{maxDim:960,refine:!1});ctx.lineWidth=3*devicePixelRatio,ctx.strokeStyle=found.length===4?"#22c55e":"#f59e0b";for(const m of found)ctx.beginPath(),m.corners.forEach((c,i)=>i?ctx.lineTo(c.x*s,c.y*s):ctx.moveTo(c.x*s,c.y*s)),ctx.closePath(),ctx.stroke();if(found.length>=2){const{mm,px}=correspondences(found);try{drawRuler(ctx,fitHomography(mm,px),s,MAT_SIZE,MAT_SIZE)}catch{}}setMarkers(found.length),ok=found.length===4}stableSince.current=ok?stableSince.current??Date.now():null,setSteady(stableSince.current!=null&&Date.now()-stableSince.current>600)}setTimeout(tick,300)};return tick(),()=>{alive=!1}},[live,mode,paperSize]);async function captureBurst(){const v=videoRef.current;if(!v)return;setBusy("Capturing…");const frames=[];try{const track=streamRef.current?.getVideoTracks()[0];if(track&&window.ImageCapture)try{const blob=await new window.ImageCapture(track).takePhoto();frames.push(await fileToRaster(blob))}catch{}const n=mode==="mat"||mode==="paper"?4:frames.length?0:1;for(let i=0;i<n;i++)frames.push(videoToRaster(v)),await new Promise(r=>setTimeout(r,140));stop(),onCaptured(frames)}finally{setBusy(null)}}async function onFiles(files){if(files?.length){setBusy("Loading photo…");try{const frames=[];for(const f of Array.from(files).slice(0,5))frames.push(await fileToRaster(f));stop(),onCaptured(frames)}catch{setError("Could not read that image. Try a JPEG or PNG.")}finally{setBusy(null)}}}const refName=mode==="paper"?`${PAPER_SIZES[paperSize].label} paper`:"calibration mat";return<div className="space-y-4">
      <div className="relative overflow-hidden rounded-3xl bg-ink"onDragOver={e=>e.preventDefault()}onDrop={e=>{e.preventDefault(),onFiles(e.dataTransfer.files)}}>
        <video ref={videoRef}playsInline muted className={`block w-full ${live?"":"hidden"}`}/>
        <canvas ref={overlayRef}className="pointer-events-none absolute inset-0 h-full w-full"/>
        {!live&&<div className="flex aspect-[4/3] flex-col items-center justify-center gap-4 p-6 text-center text-paper">
            <div className="text-4xl">💍</div>
            <p className="max-w-xs text-sm text-paper/80">
              {hint?`${hint} `:""}
              {mode==="paper"?`Put the piece on a sheet of ${PAPER_SIZES[paperSize].label} paper on a darker table, then shoot straight down with all four paper corners in view.`:mode==="mat"?"Hold your phone parallel about 25–30 cm above the calibration mat.":mode==="card"?"Place the jewelry next to a bank card on a plain, light surface and shoot straight down.":"Take a clear photo of the piece on a plain background."}
            </p>
            {autoStart?<Button variant="gold"onClick={start}>Starting camera…</Button>:<div className="flex flex-col items-center gap-2">
                <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-gold px-5 text-sm font-medium text-white">
                  Choose photos
                  <input type="file"accept="image/*"multiple className="hidden"onChange={e=>onFiles(e.target.files)}/>
                </label>
                <span className="text-xs text-paper/60">or drag &amp; drop them here</span>
                <button onClick={start}className="text-xs text-paper/80 underline">Use webcam</button>
              </div>}
          </div>}
        {live&&<div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 bg-gradient-to-b from-ink/70 to-transparent p-3 text-xs text-paper">
            <span>{res}</span>
            {(mode==="mat"||mode==="paper")&&<span className={`rounded-full px-2 py-0.5 font-medium ${markers===4?"bg-emerald-500/90":"bg-amber-500/90"}`}>
                {markers===4?steady?"Locked \xB7 hold still":mode==="paper"?"Paper found":"Mat found":mode==="paper"?"Looking for paper…":`${markers}/4 markers`}
              </span>}
          </div>}
        {live&&(mode==="mat"||mode==="paper")&&markers<2&&<div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
            <div className="flex aspect-square w-3/4 max-w-sm items-end justify-center rounded-3xl border-2 border-dashed border-white/70 p-3">
              <p className="rounded-full bg-ink/60 px-3 py-1 text-center text-xs text-white">{`Show the whole ${refName} — a live ruler appears`}</p>
            </div>
          </div>}
        {live&&hint&&<p className="pointer-events-none absolute inset-x-3 top-11 rounded-xl bg-ink/55 px-3 py-1.5 text-center text-xs text-white">{hint}</p>}
        {live&&<div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 bg-gradient-to-t from-ink/70 to-transparent p-4">
            <button onClick={captureBurst}disabled={!!busy}aria-label="Capture"className="size-16 rounded-full border-4 border-white bg-white/30 transition enabled:active:scale-95 disabled:opacity-40"/>
          </div>}
      </div>

      {error&&<p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{error}</p>}
      {busy&&<p className="text-center text-sm text-ink/60">{busy}</p>}

      <div className="grid grid-cols-2 gap-3">
        <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-white text-sm font-medium ring-1 ring-ink/15">
          📷 Camera app
          <input type="file"accept="image/*"capture="environment"className="hidden"onChange={e=>onFiles(e.target.files)}/>
        </label>
        <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-white text-sm font-medium ring-1 ring-ink/15">
          ⬆ Upload
          <input type="file"accept="image/*"multiple className="hidden"onChange={e=>onFiles(e.target.files)}/>
        </label>
      </div>
      {mode==="mat"&&<p className="text-center text-xs text-ink/50">
          No mat yet? <Link href="/mat"target="_blank"className="underline">Print the calibration mat</Link> at 100% scale.
          Tip: upload 2–5 shots of the same setup to average out noise.
        </p>}
    </div>}
