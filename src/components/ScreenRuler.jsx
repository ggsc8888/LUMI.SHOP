"use client";import{useEffect,useRef,useState}from"react";import{ringSizeFromDiameter}from"@/lib/measure/ring";import{loadScreenScale,saveScreenScale}from"@/lib/screen-scale";import{Badge,Button,Card}from"./ui";const CARD={w:85.6,h:53.98};export function ScreenRuler({ring,onDone,onSkip}){const[scale,setScale]=useState(null),[calibrating,setCalibrating]=useState(!1),[tab,setTab]=useState(ring?"ring":"calipers"),[zoomed,setZoomed]=useState(!1);return useEffect(()=>{const t=setTimeout(()=>{const s=loadScreenScale();setScale(s),s.source==="estimate"&&!/iPhone|iPad/.test(navigator.userAgent)&&setCalibrating(!0);const vv=window.visualViewport;setZoomed(!!vv&&Math.abs(vv.scale-1)>.02)},0);return()=>clearTimeout(t)},[]),scale?calibrating?<Calibrate initial={scale.pxPerMm}onSave={v=>{saveScreenScale(v),setScale({pxPerMm:v,source:"calibrated"}),setCalibrating(!1)}}onCancel={scale.source==="estimate"&&!/iPhone|iPad/.test(navigator.userAgent)?void 0:()=>setCalibrating(!1)}/>:<div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="grid grid-cols-2 gap-1 rounded-full bg-ink/5 p-1 text-sm">
          {["calipers","ring"].map(t=><button key={t}onClick={()=>setTab(t)}className={`whitespace-nowrap rounded-full px-3 py-1.5 ${tab===t?"bg-white font-medium shadow-sm":"text-ink/60"}`}>
              {t==="calipers"?"Length":"Ring size"}
            </button>)}
        </div>
        <button onClick={()=>setCalibrating(!0)}className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs text-ink/60">
          <Badge tone={scale.source==="estimate"?"warn":"ok"}>
            {scale.source==="calibrated"?"Calibrated":scale.source==="device"?"Auto-sized":"Estimated"}
          </Badge>
          <span className="underline">Calibrate</span>
        </button>
      </div>
      {zoomed&&<p className="rounded-xl bg-amber-50 p-2 text-xs text-amber-900">The page is zoomed in — pinch back to normal size so the ruler is life-size.</p>}
      {scale.source==="estimate"&&<p className="rounded-xl bg-amber-50 p-2 text-xs text-amber-900">Screen size is estimated. Calibrate once for jewelry-grade accuracy.</p>}
      {tab==="calipers"?<Calipers pxPerMm={scale.pxPerMm}onDone={onDone}/>:<RingSizer pxPerMm={scale.pxPerMm}onDone={onDone}/>}
      <button onClick={onSkip}className="w-full text-center text-xs text-ink/50 underline">Skip measuring</button>
    </div>:null}function useDrag(ref,onMove){return{start:e=>{e.target.setPointerCapture(e.pointerId);const move=ev=>{const r=ref.current.getBoundingClientRect();onMove(ev.clientX-r.left)},up=()=>{window.removeEventListener("pointermove",move),window.removeEventListener("pointerup",up)};window.addEventListener("pointermove",move),window.addEventListener("pointerup",up)}}}function RulerTicks({widthPx,pxPerMm}){const mm=Math.floor(widthPx/pxPerMm),ticks=[];for(let i=0;i<=mm;i++){const x=i*pxPerMm,h=i%10===0?18:i%5===0?12:7;ticks.push(<line key={i}x1={x+.5}x2={x+.5}y1={0}y2={h}stroke="#1d1a17"strokeWidth={1}/>),i%10===0&&ticks.push(<text key={`t${i}`}x={x+3}y={28}fontSize={10}fill="#1d1a17">{i/10}</text>)}return<svg width={widthPx}height={32}className="block">
      {ticks}
    </svg>}function Calipers({pxPerMm,onDone}){const[w,setW]=useState(0),[a,setA]=useState(10),[b,setB]=useState(30),[active,setActive]=useState("b"),[length,setLength]=useState(null),[width,setWidth]=useState(null),maxMm=w/pxPerMm,clamp=v=>Math.min(Math.max(v,0),Math.max(0,maxMm)),boxRef=useRef(null),dragA=useDrag(boxRef,x=>{setActive("a"),setA(clamp(x/pxPerMm))}),dragB=useDrag(boxRef,x=>{setActive("b"),setB(clamp(x/pxPerMm))});useEffect(()=>{const el=boxRef.current;if(!el)return;const ro=new ResizeObserver(()=>setW(el.clientWidth));return ro.observe(el),()=>ro.disconnect()},[]);const d=Math.abs(b-a),nudge=v=>active==="a"?setA(x=>clamp(x+v)):setB(x=>clamp(x+v)),jaw=(mm,on)=><div className={`pointer-events-none absolute inset-y-0 w-0.5 ${on?"bg-gold":"bg-ink/60"}`}style={{left:mm*pxPerMm-1}}/>;return<Card className="space-y-3 p-0 sm:p-0">
      <p className="px-4 pt-4 text-sm text-ink/70">
        Lay the piece on the screen inside the white area, then drag the two handles so the gold lines touch its edges.
      </p>
      <div ref={boxRef}className="relative h-56 select-none bg-white ring-1 ring-ink/10">
        <div className="pointer-events-none absolute inset-x-0 bottom-0"><RulerTicks widthPx={w}pxPerMm={pxPerMm}/></div>
        {w>0&&jaw(a,active==="a")}
        {w>0&&jaw(b,active==="b")}
        {w>0&&<div className="pointer-events-none absolute top-2 rounded-full bg-ink px-2 py-0.5 text-xs text-paper"style={{left:Math.min(a,b)*pxPerMm+6}}>
            {d.toFixed(1)} mm
          </div>}
      </div>
      <div className="relative h-11 touch-none">
        {w>0&&["a","b"].map(k=><button key={k}onPointerDown={e=>k==="a"?dragA.start(e):dragB.start(e)}aria-label={k==="a"?"Left jaw":"Right jaw"}className={`absolute top-0 grid size-11 -translate-x-1/2 touch-none place-items-center rounded-full text-sm text-white shadow ${active===k?"bg-gold":"bg-ink/70"}`}style={{left:(k==="a"?a:b)*pxPerMm}}>
            ⇔
          </button>)}
      </div>
      <div className="flex items-center justify-between gap-3 px-4">
        <p className="font-display text-3xl">
          {d.toFixed(1)} <span className="text-lg text-ink/60">mm</span>
          <span className="ml-2 text-sm text-ink/50">{(d/25.4).toFixed(2)}″</span>
        </p>
        <div className="flex gap-1">
          <Button variant="secondary"className="min-h-9 px-3"onClick={()=>nudge(-.1)}aria-label="Nudge left">−0.1</Button>
          <Button variant="secondary"className="min-h-9 px-3"onClick={()=>nudge(.1)}aria-label="Nudge right">+0.1</Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 px-4">
        <Button variant={length!=null?"gold":"secondary"}onClick={()=>setLength(Math.round(d*10)/10)}>
          {length!=null?`Length ${length} mm`:"Save as length"}
        </Button>
        <Button variant={width!=null?"gold":"secondary"}onClick={()=>setWidth(Math.round(d*10)/10)}>
          {width!=null?`Width ${width} mm`:"Save as width"}
        </Button>
      </div>
      <div className="px-4 pb-4">
        <Button className="w-full"disabled={length==null&&d<.5}onClick={()=>onDone({kind:"length",lengthMm:length??Math.round(d*10)/10,widthMm:width})}>
          Use measurement
        </Button>
      </div>
    </Card>}function RingSizer({pxPerMm,onDone}){const[d,setD]=useState(17.3),size=ringSizeFromDiameter(d),px=d*pxPerMm,box=Math.max(px+40,220);return<Card className="space-y-3">
      <p className="text-sm text-ink/70">
        Put the ring flat on the circle and adjust until the circle lines up with the <b>inside edge</b> of the ring.
      </p>
      <div className="grid place-items-center rounded-xl bg-white ring-1 ring-ink/10"style={{height:box}}>
        <svg width={px+4}height={px+4}>
          <circle cx={px/2+2}cy={px/2+2}r={px/2}fill="rgba(176,141,87,0.12)"stroke="#85673a"strokeWidth={1}/>
          <line x1={px/2+2-6}x2={px/2+2+6}y1={px/2+2}y2={px/2+2}stroke="#85673a"strokeWidth={1}/>
          <line y1={px/2+2-6}y2={px/2+2+6}x1={px/2+2}x2={px/2+2}stroke="#85673a"strokeWidth={1}/>
        </svg>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary"className="min-h-9 px-3"onClick={()=>setD(v=>Math.max(11,+(v-.05).toFixed(2)))}>−</Button>
        <input type="range"min={11}max={26}step={.05}value={d}onChange={e=>setD(parseFloat(e.target.value))}className="w-full accent-[var(--color-gold)]"aria-label="Ring inner diameter"/>
        <Button variant="secondary"className="min-h-9 px-3"onClick={()=>setD(v=>Math.min(26,+(v+.05).toFixed(2)))}>+</Button>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink/50">Inner diameter</p>
          <p className="font-display text-3xl">{d.toFixed(2)} <span className="text-lg text-ink/60">mm</span></p>
        </div>
        <div className="rounded-2xl bg-gold/10 px-3 py-2 text-center">
          <p className="font-display text-2xl text-gold-dark">US {size.us}</p>
          <p className="text-[11px] text-gold-dark/80">UK {size.uk} · EU {size.eu}</p>
        </div>
      </div>
      <Button className="w-full"onClick={()=>onDone({kind:"ring",diameterMm:Math.round(d*100)/100})}>Use ring size</Button>
    </Card>}function Calibrate({initial,onSave,onCancel}){const[v,setV]=useState(initial),[ruler,setRuler]=useState(!1),w=CARD.w*v,h=CARD.h*v;return<Card className="space-y-3">
      <h3 className="font-display text-xl">Set up life-size ruler</h3>
      <p className="text-sm text-ink/70">
        One-time step for this screen.{" "}
        {ruler?"Hold a ruler against the screen and adjust until the bar is exactly 5 cm.":"Hold any bank or ID card against the screen and adjust until the outline matches the card's width."}
      </p>
      <div className="grid place-items-center overflow-hidden rounded-xl bg-white py-4 ring-1 ring-ink/10">
        {ruler?<svg width={50*v+2}height={30}>
            <rect x={1}y={4}width={50*v}height={10}fill="#1d1a17"/>
            {Array.from({length:51},(_,i)=><line key={i}x1={1+i*v}x2={1+i*v}y1={14}y2={i%10===0?28:i%5===0?24:19}stroke="#1d1a17"strokeWidth={1}/>)}
          </svg>:<div className="rounded-[3mm] border-2 border-gold bg-gold/10"style={{width:w,height:h,borderRadius:3.18*v}}/>}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary"className="min-h-9 px-3"onClick={()=>setV(x=>x*.998)}>−</Button>
        <input type="range"min={2.5}max={9}step={.005}value={v}onChange={e=>setV(parseFloat(e.target.value))}className="w-full accent-[var(--color-gold)]"aria-label="Screen scale"/>
        <Button variant="secondary"className="min-h-9 px-3"onClick={()=>setV(x=>x*1.002)}>+</Button>
      </div>
      <button onClick={()=>setRuler(!ruler)}className="text-xs text-ink/50 underline">
        {ruler?"Use a card instead":"No card? Use a ruler instead"}
      </button>
      <div className="flex gap-2">
        {onCancel&&<Button variant="secondary"className="flex-1"onClick={onCancel}>Cancel</Button>}
        <Button className="flex-1"onClick={()=>onSave(v)}>Save</Button>
      </div>
    </Card>}
