"use client";import{useCallback,useEffect,useRef,useState}from"react";import{fileToRaster,rasterToCanvas,videoToRaster}from"@/lib/client/image";import{measureBeads}from"@/lib/measure/beads";import{fitHomography}from"@/lib/measure/homography";import{detectPaper}from"@/lib/measure/paper";import{drawRuler}from"./CameraCapture";import{Button}from"./ui";export function GuideShapes({w,h,target,dim=!1}){const m=Math.min(w,h),sw=Math.max(1.5,m/220),gold="rgba(214,178,112,0.95)",x=target.x*w,y=target.y*h;let shape;if(target.kind==="circle")shape=<circle cx={x}cy={y}r={target.w*m/2}/>;else if(target.kind==="pair")shape=<>
        <circle cx={x-target.w*w/4}cy={y}r={target.w*m/6}/>
        <circle cx={x+target.w*w/4}cy={y}r={target.w*m/6}/>
      </>;else if(target.kind==="ellipse")shape=<ellipse cx={x}cy={y}rx={target.w*w/2}ry={target.h*h/2}/>;else if(target.kind==="rect")shape=<rect x={x-target.w*w/2}y={y-target.h*h/2}width={target.w*w}height={target.h*h}rx={m/30}/>;else{const x0=x-target.w*w/2,x1=x+target.w*w/2,y0=y-target.h*h/2,y1=y+target.h*h*.75;shape=<path d={`M ${x0} ${y0} C ${x0} ${y1}, ${x1} ${y1}, ${x1} ${y0}`}/>}return<g>
      <g stroke={`rgba(255,255,255,${dim?.18:.35})`}strokeWidth={sw*.7}>
        <line x1={w/3}x2={w/3}y1={0}y2={h}/>
        <line x1={2*w/3}x2={2*w/3}y1={0}y2={h}/>
        <line y1={h/3}y2={h/3}x1={0}x2={w}/>
        <line y1={2*h/3}y2={2*h/3}x1={0}x2={w}/>
      </g>
      <g fill="rgba(214,178,112,0.10)"stroke={gold}strokeWidth={sw*1.6}strokeDasharray={`${sw*6} ${sw*4}`}>
        {shape}
      </g>
    </g>}export function GuidedCapture({category,measureShot,paperSize,autoStart,onDone}){const shots=category.shots,videoRef=useRef(null),overlayRef=useRef(null),streamRef=useRef(null),[live,setLive]=useState(!1),[dims,setDims]=useState({w:1280,h:960}),[error,setError]=useState(null),[busy,setBusy]=useState(null),[idx,setIdx]=useState(0),[taken,setTaken]=useState(()=>shots.map(()=>null)),[liveInfo,setLiveInfo]=useState(null),[flash,setFlash]=useState(!1),shot=shots[idx],analyse=measureShot&&!!shot.measure,stop=useCallback(()=>{streamRef.current?.getTracks().forEach(t=>t.stop()),streamRef.current=null,setLive(!1)},[]);useEffect(()=>stop,[stop]);async function start(){setError(null);try{const stream=await navigator.mediaDevices.getUserMedia({audio:!1,video:{facingMode:{ideal:"environment"},width:{ideal:3840},height:{ideal:2160}}});streamRef.current=stream,stream.getVideoTracks()[0].applyConstraints({advanced:[{focusMode:"continuous"}]}).catch(()=>{});const v=videoRef.current;v.srcObject=stream,await v.play(),setDims({w:v.videoWidth,h:v.videoHeight}),setLive(!0)}catch(e){setError(e instanceof Error&&e.name==="NotAllowedError"?"Camera permission was denied. Allow camera access, or add photos below.":"Camera unavailable in this browser. Add photos below instead.")}}useEffect(()=>{if(!autoStart)return;const t=setTimeout(start,0);return()=>clearTimeout(t)},[autoStart]),useEffect(()=>{const o=overlayRef.current;if(o&&o.getContext("2d")?.clearRect(0,0,o.width,o.height),!live||!analyse){const t=setTimeout(()=>setLiveInfo(null),0);return()=>clearTimeout(t)}let alive=!0;const tick=()=>{if(!alive)return;const v=videoRef.current,ov=overlayRef.current;if(v&&ov&&v.videoWidth){const rect=v.getBoundingClientRect();ov.width=rect.width*devicePixelRatio,ov.height=rect.height*devicePixelRatio;const ctx=ov.getContext("2d");if(ctx.clearRect(0,0,ov.width,ov.height),category.measure==="beads"){const frame=videoToRaster(v,1280),s=ov.width/frame.width,res=measureBeads(frame,paperSize,{fast:!0});ctx.lineWidth=2*devicePixelRatio;for(const b of res.beads)ctx.strokeStyle="rgba(52,211,153,0.95)",ctx.beginPath(),ctx.arc(b.photo.cx*s,b.photo.cy*s,b.photo.r*s,0,Math.PI*2),ctx.stroke();setLiveInfo(res.count===0?{text:res.reference?"Paper found — place the beads on it":"Looking for beads…",ok:!1}:res.reference?{text:`≈ ${res.count} beads \xB7 ${res.minMm.toFixed(1)}–${res.maxMm.toFixed(1)} mm`,ok:!0}:{text:`${res.count} beads found \xB7 add paper underneath for mm`,ok:!1})}else{const small=videoToRaster(v,640),det=detectPaper(small,paperSize,{refine:!1});if(det)try{drawRuler(ctx,fitHomography(det.mm,det.corners),ov.width/small.width,det.widthMm,det.heightMm)}catch{}setLiveInfo(det?{text:"Paper found \xB7 size will be measured",ok:!0}:{text:"No paper in view \xB7 photo only",ok:!1})}}setTimeout(tick,category.measure==="beads"?450:300)};return tick(),()=>{alive=!1}},[live,analyse,category.measure,paperSize]);function store(i,frames){const thumb=rasterToCanvas(frames[0],320).toDataURL("image/jpeg",.8);setTaken(prev=>{const next=[...prev];next[i]={shot:shots[i],frames,thumb};const empty=next.findIndex((t,j)=>!t&&j>i),firstEmpty=empty>=0?empty:next.findIndex(t=>!t);return setIdx(firstEmpty>=0?firstEmpty:i),next})}async function capture(){const v=videoRef.current;if(!v)return;setBusy("Capturing…"),setFlash(!0),setTimeout(()=>setFlash(!1),150);const frames=[];try{const track=streamRef.current?.getVideoTracks()[0];if(track&&window.ImageCapture)try{frames.push(await fileToRaster(await new window.ImageCapture(track).takePhoto()))}catch{}const extra=analyse&&category.measure==="object"?3:frames.length?0:1;for(let i=0;i<extra;i++)frames.push(videoToRaster(v)),await new Promise(r=>setTimeout(r,140));store(idx,frames)}finally{setBusy(null)}}async function onFiles(files,single=!1){if(files?.length){setBusy("Loading photos…");try{const list=Array.from(files).slice(0,single?1:shots.length),order=[idx,...shots.map((_,j)=>j).filter(j=>j!==idx&&!taken[j])];for(let k=0;k<list.length&&k<order.length;k++)store(order[k],[await fileToRaster(list[k])])}catch{setError("Could not read that image. Try a JPEG or PNG.")}finally{setBusy(null)}}}const count=taken.filter(Boolean).length,finish=()=>{stop(),onDone(taken.filter(t=>!!t))};return<div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm">
          <span className="font-semibold">Shot {idx+1}/{shots.length}</span> · {shot.title}
        </p>
        {count>0&&<button onClick={finish}className="shrink-0 text-xs text-ink/60 underline">
            Done with {count} photo{count>1?"s":""}
          </button>}
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-ink"onDragOver={e=>e.preventDefault()}onDrop={e=>{e.preventDefault(),onFiles(e.dataTransfer.files)}}>
        <video ref={videoRef}playsInline muted className={`block w-full ${live?"":"hidden"}`}/>
        {live&&<svg viewBox={`0 0 ${dims.w} ${dims.h}`}className="pointer-events-none absolute inset-0 h-full w-full">
            <GuideShapes w={dims.w}h={dims.h}target={shot.target}/>
          </svg>}
        <canvas ref={overlayRef}className="pointer-events-none absolute inset-0 h-full w-full"/>
        {flash&&<div className="pointer-events-none absolute inset-0 bg-white/70"/>}

        {!live&&<div className="relative aspect-[4/3]">
            <svg viewBox="0 0 400 300"className="absolute inset-0 h-full w-full">
              <GuideShapes w={400}h={300}target={shot.target}dim/>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-paper">
              <p className="max-w-xs rounded-xl bg-ink/60 px-3 py-2 text-sm text-paper/90">{shot.tip}</p>
              {autoStart?<Button variant="gold"onClick={start}>Start camera</Button>:<div className="flex flex-col items-center gap-2">
                  <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-gold px-5 text-sm font-medium text-white">
                    Choose photos
                    <input type="file"accept="image/*"multiple className="hidden"onChange={e=>onFiles(e.target.files)}/>
                  </label>
                  <span className="text-xs text-paper/60">or drag &amp; drop — several at once fill the shots in order</span>
                  <button onClick={start}className="text-xs text-paper/80 underline">Use webcam</button>
                </div>}
            </div>
          </div>}

        {live&&<>
            <div className="pointer-events-none absolute inset-x-0 top-0 space-y-1.5 bg-gradient-to-b from-ink/80 via-ink/50 to-transparent p-3 pb-6 text-xs text-paper">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-ink/60 px-2 py-0.5 font-semibold">{idx+1}/{shots.length} · {shot.title}</span>
                {liveInfo&&<span className={`rounded-full px-2 py-0.5 font-medium ${liveInfo.ok?"bg-emerald-500/90":"bg-amber-500/90"}`}>{liveInfo.text}</span>}
              </div>
              <p className="max-w-md text-[11px] leading-snug text-white/90">{shot.tip}</p>
            </div>
            <div className="absolute inset-x-0 bottom-0 px-4 pb-4">
              <div className="flex items-center justify-center">
                <button onClick={capture}disabled={!!busy}aria-label={`Take shot ${idx+1}`}className="grid size-16 place-items-center rounded-full border-4 border-white bg-ink/40 text-lg font-semibold text-white transition enabled:active:scale-95 disabled:opacity-40">
                  {idx+1}
                </button>
              </div>
            </div>
          </>}
      </div>

      {error&&<p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{error}</p>}
      {busy&&<p className="text-center text-sm text-ink/60">{busy}</p>}

      {}
      <div className="grid grid-cols-4 gap-2">
        {shots.map((s,i)=>{const t=taken[i];return<button key={s.id}onClick={()=>setIdx(i)}className={`relative aspect-square overflow-hidden rounded-xl text-left ring-2 transition ${i===idx?"ring-gold":"ring-transparent"} ${t?"bg-ink":"bg-ink/5"}`}>
              {t?<img src={t.thumb}alt=""className="absolute inset-0 h-full w-full object-cover"/>:<svg viewBox="0 0 400 300"className="absolute inset-0 h-full w-full bg-ink/80"preserveAspectRatio="xMidYMid slice">
                  <GuideShapes w={400}h={300}target={s.target}dim/>
                </svg>}
              <span className="absolute left-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-white text-[10px] font-semibold text-ink">
                {t?"✓":i+1}
              </span>
              <span className="absolute inset-x-0 bottom-0 truncate bg-ink/60 px-1.5 py-0.5 text-[10px] text-white">{s.title}</span>
            </button>})}
      </div>
      <p className="text-center text-xs text-ink/50">Tap a shot to retake it.</p>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-white text-sm font-medium ring-1 ring-ink/15">
          📷 Camera app
          <input type="file"accept="image/*"capture="environment"className="hidden"onChange={e=>onFiles(e.target.files,!0)}/>
        </label>
        <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-white text-sm font-medium ring-1 ring-ink/15">
          ⬆ Upload
          <input type="file"accept="image/*"multiple className="hidden"onChange={e=>onFiles(e.target.files)}/>
        </label>
      </div>

      <Button className="w-full"disabled={count===0}onClick={finish}>
        {count===shots.length?"Continue":count===0?`Take ${shots.length} photos`:`Continue with ${count} of ${shots.length}`}
      </Button>
    </div>}
