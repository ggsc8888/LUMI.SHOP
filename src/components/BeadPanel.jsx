"use client";import{useEffect,useMemo,useRef,useState}from"react";import{rasterToCanvas}from"@/lib/client/image";import{scaleBeads}from"@/lib/measure/beads";import{Badge,Button,Card,inputCls}from"./ui";export function BeadPanel({image,result,onChange,onUse,onRetake}){const ref=useRef(null),[sel,setSel]=useState(null),[known,setKnown]=useState(""),scaled=result.minMm!=null,minI=useMemo(()=>argBy(result,(a,b)=>a<b),[result]),maxI=useMemo(()=>argBy(result,(a,b)=>a>b),[result]);useEffect(()=>{const c=ref.current;if(!c)return;const base=rasterToCanvas(image,1400);c.width=base.width,c.height=base.height;const ctx=c.getContext("2d");ctx.drawImage(base,0,0);const s=base.width/image.width,lw=Math.max(2,base.width/500);result.beads.forEach((b,i)=>{const hl=i===sel?"#ef4444":i===maxI?"#d6b270":i===minI?"#3b82f6":"rgba(52,211,153,0.9)";ctx.strokeStyle=hl,ctx.lineWidth=i===sel||i===minI||i===maxI?lw*1.8:lw,ctx.beginPath(),ctx.arc(b.photo.cx*s,b.photo.cy*s,b.photo.r*s,0,Math.PI*2),ctx.stroke()}),ctx.font=`600 ${Math.round(lw*7)}px ui-sans-serif, system-ui`,ctx.textAlign="center";for(const[i,col]of[[minI,"#3b82f6"],[maxI,"#b08d57"]]){const b=result.beads[i];if(!b||b.dMm==null)continue;const t=`${b.dMm.toFixed(1)}`,x=b.photo.cx*s,y=(b.photo.cy-b.photo.r)*s-lw*3,w=ctx.measureText(t).width+lw*4;ctx.fillStyle=col,ctx.fillRect(x-w/2,y-lw*7,w,lw*8.5),ctx.fillStyle="#fff",ctx.fillText(t,x,y)}},[image,result,sel,minI,maxI]);function tap(e){const c=ref.current,r=c.getBoundingClientRect(),s=c.width/image.width,x=(e.clientX-r.left)/r.width*c.width/s,y=(e.clientY-r.top)/r.height*c.height/s;let best=-1,bd=1/0;result.beads.forEach((b,i)=>{const d=Math.hypot(b.photo.cx-x,b.photo.cy-y)/b.photo.r;d<bd&&(bd=d,best=i)}),setSel(bd<1.5?best:null)}const sorted=useMemo(()=>result.beads.map(b=>scaled?b.dMm:2*b.r).sort((a,b)=>a-b),[result,scaled]),top=sorted.at(-1)??1;return<Card className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-xl">Bead sizes</h3>
        <Badge tone={result.reference==="paper"?"ok":scaled?"gold":"warn"}>
          {result.reference==="paper"?"Measured on paper":scaled?"Scaled from one bead":"Relative only"}
        </Badge>
      </div>

      <canvas ref={ref}onClick={tap}className="w-full cursor-crosshair rounded-xl bg-ink/5"/>

      {result.count===0?<p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          No round beads found. Lay the strand flat on a sheet of paper, beads not overlapping, and shoot straight down.
        </p>:<>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Smallest"value={scaled?`${result.minMm.toFixed(1)} mm`:"—"}color="text-blue-600"/>
            <Stat label="Largest"value={scaled?`${result.maxMm.toFixed(1)} mm`:"—"}color="text-gold-dark"/>
            <Stat label={`${result.count} beads \xB7 median`}value={scaled?`${result.medianMm.toFixed(1)} mm`:"—"}/>
          </div>
          {scaled&&result.uncertaintyMm!=null&&<p className="text-center text-xs text-ink/50">
              ±{Math.max(.15,result.uncertaintyMm).toFixed(2)} mm per bead ·{" "}
              {result.maxMm-result.minMm>1?"graduated strand":"uniform strand"}
            </p>}
          <div className="flex h-16 items-end gap-px rounded-lg bg-ink/5 p-1"aria-label="Bead sizes, smallest to largest">
            {sorted.map((d,i)=><div key={i}className="flex-1 rounded-t-sm bg-gold/70"style={{height:`${Math.max(8,d/top*100)}%`}}/>)}
          </div>
        </>}

      {result.count>0&&<div className="space-y-2 rounded-xl bg-ink/5 p-3">
          <p className="text-xs text-ink/70">
            {result.reference==="paper"?"Tap a bead to check it. If you know one bead's exact size you can override the scale:":"No paper in the photo. Tap one bead, then enter its size (measure it with the Ruler tab or calipers):"}
          </p>
          <div className="flex gap-2">
            <input inputMode="decimal"value={known}onChange={e=>setKnown(e.target.value)}placeholder={sel==null?"Tap a bead first":`Bead ${sel+1} size, mm`}disabled={sel==null}className={inputCls}/>
            <Button variant="secondary"disabled={sel==null||!(parseFloat(known)>0)}onClick={()=>onChange(scaleBeads(result,sel,parseFloat(known)))}>
              Set
            </Button>
          </div>
          {sel!=null&&result.beads[sel]?.dMm!=null&&<p className="text-xs text-ink/60">Selected bead: {result.beads[sel].dMm.toFixed(2)} mm</p>}
        </div>}

      {result.warnings.map(w=><p key={w}className="text-xs text-amber-800">⚠ {w}</p>)}

      <div className="flex gap-2">
        <Button variant="secondary"className="flex-1"onClick={onRetake}>Retake</Button>
        <Button className="flex-1"onClick={onUse}>{scaled?"Use these sizes":"Continue without sizes"}</Button>
      </div>
    </Card>}function Stat({label,value,color=""}){return<div className="rounded-xl bg-white p-2 ring-1 ring-ink/10">
      <p className="text-[11px] uppercase tracking-wide text-ink/50">{label}</p>
      <p className={`font-display text-xl ${color}`}>{value}</p>
    </div>}function argBy(r,better){let bi=-1,bv=0;return r.beads.forEach((b,i)=>{const v=b.dMm??2*b.r;(bi<0||better(v,bv))&&(bi=i,bv=v)}),bi}
