"use client";import{useCallback,useEffect,useRef,useState}from"react";import{canvasToB64,nextFrame,rasterToCanvas}from"@/lib/client/image";import{analyzeFrame,analyzeWithCard,analyzeWithPaper,combine,measureCandidate,measureMask,pickCandidate}from"@/lib/measure/measure";import{holeMask,morph}from"@/lib/measure/segment";import{PAPER_SIZES}from"@/lib/measure/paper";import{orderCardCorners}from"./CardAlign";import{Badge,Button,Card}from"./ui";const fmt=(n,d=2)=>n.toFixed(d),inch=mm=>(mm/25.4).toFixed(2);export function MeasurePanel({frames,mode,paperSize="a4",cardCorners,printScale,onDone,onRetake}){const[status,setStatus]=useState("Finding the calibration reference…"),[error,setError]=useState(null),[analyses,setAnalyses]=useState([]),[target,setTarget]=useState(),[sensitivity,setSensitivity]=useState(.5),[objResults,setObjResults]=useState([]),[result,setResult]=useState(null),[aiProgress,setAiProgress]=useState(null),overviewRef=useRef(null),roiRef=useRef(null);useEffect(()=>{let cancelled=!1;return(async()=>{setError(null),setStatus(mode==="mat"?"Finding the calibration mat…":mode==="paper"?"Finding the sheet of paper…":"Calibrating from the card…"),await nextFrame();const out=[];let lastErr=null;for(let i=0;i<frames.length;i++){if(cancelled)return;setStatus(`Analysing frame ${i+1} of ${frames.length}…`),await nextFrame();try{const a=mode==="card"?analyzeWithCard(frames[i],orderCardCorners(cardCorners),{sensitivity}):mode==="paper"?analyzeWithPaper(frames[i],paperSize,{sensitivity}):analyzeFrame(frames[i],{printScale,sensitivity});out.push({img:frames[i],a})}catch(e){lastErr=e}}if(!cancelled){if(!out.length){setError(lastErr instanceof Error?lastErr.message:"Could not calibrate this photo."),setStatus(null);return}setAnalyses(out)}})(),()=>{cancelled=!0}},[frames,mode,paperSize,cardCorners,printScale,sensitivity]);const runMeasure=useCallback(async()=>{if(!analyses.length)return;const ref=analyses[0].a,cand=pickCandidate(ref,target);if(!cand){setStatus(null),setError(ref.warnings.find(w=>w.startsWith("No item"))||"No item found.");return}const res=[];for(let i=0;i<analyses.length;i++){setStatus(`Measuring at high resolution (${i+1}/${analyses.length})…`),await nextFrame();const{img,a}=analyses[i],c=pickCandidate(a,cand.centerMm);if(c)try{res.push({a,r:measureCandidate(img,a,c)})}catch{}}if(setStatus(null),!res.length){setError("Could not isolate the item. Try raising sensitivity or AI refine.");return}setError(null),setObjResults(res),setResult(combine(res,mode,"classic"))},[analyses,target,mode]);useEffect(()=>{const t=setTimeout(runMeasure,0);return()=>clearTimeout(t)},[runMeasure]),useEffect(()=>{const c=overviewRef.current;if(!c||!analyses.length)return;const a=analyses[0].a,src=rasterToCanvas(a.overview);c.width=src.width,c.height=src.height;const ctx=c.getContext("2d");ctx.drawImage(src,0,0);const sel=pickCandidate(a,target);for(const cand of a.candidates){const x=(cand.bboxMm.x0-a.matRegion.x0)*a.overviewPpm,y=(cand.bboxMm.y0-a.matRegion.y0)*a.overviewPpm,w=(cand.bboxMm.x1-cand.bboxMm.x0)*a.overviewPpm,h=(cand.bboxMm.y1-cand.bboxMm.y0)*a.overviewPpm;ctx.strokeStyle=cand===sel?"#b08d57":"rgba(28,25,23,0.35)",ctx.lineWidth=cand===sel?3:1.5,ctx.setLineDash(cand===sel?[]:[4,4]),ctx.strokeRect(x-3,y-3,w+6,h+6)}},[analyses,target]),useEffect(()=>{const c=roiRef.current;if(!c||!objResults.length||!result)return;const roi=objResults[0].r.roi,src=rasterToCanvas(roi,1200),s=src.width/roi.width;c.width=src.width,c.height=src.height;const ctx=c.getContext("2d");ctx.drawImage(src,0,0);const lw=Math.max(1.5,src.width/400),ov=result.overlay;ctx.lineWidth=lw,ctx.strokeStyle="rgba(34,197,94,0.95)",ctx.beginPath(),ov.contour.forEach((p,i)=>i?ctx.lineTo(p.x*s,p.y*s):ctx.moveTo(p.x*s,p.y*s)),ctx.closePath(),ctx.stroke(),ctx.strokeStyle="rgba(176,141,87,0.95)",ctx.setLineDash([6,4]),ctx.beginPath(),ov.rect.forEach((p,i)=>i?ctx.lineTo(p.x*s,p.y*s):ctx.moveTo(p.x*s,p.y*s)),ctx.closePath(),ctx.stroke(),ctx.setLineDash([]),ov.holeCircle&&(ctx.strokeStyle="rgba(59,130,246,0.95)",ctx.beginPath(),ctx.arc(ov.holeCircle.cx*s,ov.holeCircle.cy*s,ov.holeCircle.r*s,0,Math.PI*2),ctx.stroke())},[objResults,result]);async function aiRefine(){if(objResults.length){setError(null),setAiProgress(0);try{const{samSegment}=await import("@/lib/measure/sam"),base=objResults[0],roi=base.r.roi,xs=base.r.overlay.rect.map(p=>p.x),ys=base.r.overlay.rect.map(p=>p.y),pad=6,box=[Math.max(0,Math.min(...xs)-pad),Math.max(0,Math.min(...ys)-pad),Math.min(roi.width,Math.max(...xs)+pad),Math.min(roi.height,Math.max(...ys)+pad)],count=m2=>m2.reduce((a,v)=>a+v,0),total=count(base.r.mask);let core=base.r.mask;for(let i=0;i<40;i++){const e=morph(core,roi.width,roi.height,-1);if(count(e)<total*.2)break;core=e}const objPix=[];for(let y=0;y<roi.height;y+=2)for(let x=0;x<roi.width;x+=2)core[y*roi.width+x]&&objPix.push({x,y});if(!objPix.length)throw new Error("Nothing to refine — adjust sensitivity first.");const cx=(box[0]+box[2])/2,cy=(box[1]+box[3])/2;let first=objPix[0],bd=1/0;for(const p of objPix){const d=(p.x-cx)**2+(p.y-cy)**2;d<bd&&(bd=d,first=p)}const positives=[first];for(;positives.length<4;){let far=objPix[0],fd=-1;for(const p of objPix){const d=Math.min(...positives.map(q=>(p.x-q.x)**2+(p.y-q.y)**2));d>fd&&(fd=d,far=p)}positives.push(far)}const inset=3,negatives=[{x:inset,y:inset},{x:roi.width-inset,y:inset},{x:roi.width-inset,y:roi.height-inset},{x:inset,y:roi.height-inset}];base.r.overlay.holeCircle&&negatives.push({x:base.r.overlay.holeCircle.cx,y:base.r.overlay.holeCircle.cy}),setStatus("Running on-device AI segmentation…");const mask=await samSegment(roi,positives,negatives,box,p=>setAiProgress(Math.round(p))),holes=holeMask(base.r.mask,roi.width,roi.height);for(let i=0;i<mask.length;i++)holes[i]&&(mask[i]=0);const m=measureMask(mask,roi.width,roi.height,base.r.roiPpm);if(!m)throw new Error("AI segmentation found nothing at that spot.");const r={...base.r,measurement:m.measurement,overlay:m.overlay,mask:m.mask},next=[{a:base.a,r}];setObjResults(next),setResult(combine(next,mode,"ai"))}catch(e){setError(e instanceof Error?e.message:"AI refine failed")}finally{setStatus(null),setAiProgress(null)}}}async function accept(){if(!result||!objResults.length)return;const crop=await canvasToB64(rasterToCanvas(objResults[0].r.roi,1200),.9);onDone({result,crop})}function tapOverview(e){const a=analyses[0]?.a;if(!a)return;const r=e.currentTarget.getBoundingClientRect(),px=(e.clientX-r.left)/r.width*a.overview.width,py=(e.clientY-r.top)/r.height*a.overview.height;setTarget({x:a.matRegion.x0+px/a.overviewPpm,y:a.matRegion.y0+py/a.overviewPpm})}const a0=analyses[0]?.a;return<div className="space-y-4">
      {status&&<Card className="flex items-center gap-3 text-sm text-ink/70">
          <span className="inline-block size-4 animate-spin rounded-full border-2 border-gold border-r-transparent"/>
          {status} {aiProgress!=null&&aiProgress>0&&aiProgress<100&&<span>model {aiProgress}%</span>}
        </Card>}
      {error&&<Card className="space-y-3 bg-amber-50 text-sm text-amber-900 ring-amber-200">
          <p>{error}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary"onClick={onRetake}>Retake</Button>
            <Button variant="ghost"onClick={()=>onDone(null)}>Skip measuring</Button>
          </div>
        </Card>}

      {result&&<Card className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-ink/50">Measured size</p>
              <p className="font-display text-3xl">
                {fmt(result.lengthMm,1)} × {fmt(result.widthMm,1)} <span className="text-lg text-ink/60">mm</span>
              </p>
              <p className="text-sm text-ink/60">
                {inch(result.lengthMm)}″ × {inch(result.widthMm)}″ · ±{fmt(result.uncertaintyMm)} mm
              </p>
            </div>
            {result.ringSize&&<div className="rounded-2xl bg-gold/10 px-3 py-2 text-center">
                <p className="text-[10px] uppercase tracking-wide text-gold-dark">Ring size</p>
                <p className="font-display text-2xl text-gold-dark">US {result.ringSize.us}</p>
                <p className="text-[11px] text-gold-dark/80">UK {result.ringSize.uk} · EU {result.ringSize.eu}</p>
              </div>}
          </div>
          <canvas ref={roiRef}className="w-full rounded-xl bg-paper"/>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-ink/50">Longest span</dt>
            <dd className="text-right">{fmt(result.maxFeretMm)} mm</dd>
            {result.hole&&<>
                <dt className="text-ink/50">Inner Ø</dt>
                <dd className="text-right">{fmt(result.hole.diameterMm)} mm</dd>
                <dt className="text-ink/50">Outer Ø</dt>
                <dd className="text-right">{fmt(result.outerDiameterMm??0)} mm</dd>
                <dt className="text-ink/50">Band (approx.)</dt>
                <dd className="text-right">{fmt(((result.outerDiameterMm??0)-result.hole.diameterMm)/2)} mm</dd>
              </>}
            <dt className="text-ink/50">Area</dt>
            <dd className="text-right">{fmt(result.areaMm2,1)} mm²</dd>
          </dl>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="ok">{result.method==="mat"?`${a0?.markers.length??0}/4 markers`:result.method==="paper"?`${PAPER_SIZES[paperSize].label} paper`:"card reference"}</Badge>
            <Badge>{result.frames} frame{result.frames>1?"s":""} averaged</Badge>
            <Badge>{fmt(a0?.srcScale??0,1)} px/mm</Badge>
            <Badge>calib ±{fmt(result.reprojRmsMm,3)} mm</Badge>
            <Badge tone={result.segmentation==="ai"?"gold":"neutral"}>{result.segmentation==="ai"?"AI segmentation":"classic CV"}</Badge>
          </div>
          {result.warnings.length>0&&<ul className="space-y-1 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
              {result.warnings.map(w=><li key={w}>⚠ {w}</li>)}
            </ul>}
          <div>
            <label className="flex items-center justify-between text-xs text-ink/60">
              <span>Detection sensitivity</span>
              <span>{Math.round(sensitivity*100)}%</span>
            </label>
            <input type="range"min={0}max={1}step={.05}value={sensitivity}onChange={e=>setSensitivity(parseFloat(e.target.value))}className="w-full accent-[var(--color-gold)]"/>
            <p className="text-xs text-ink/50">
              Green outline should hug the piece. Raise for pale stones/pearls; lower if shadows are included — or use AI refine.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary"onClick={aiRefine}loading={aiProgress!=null}>✨ AI refine</Button>
            <Button variant="primary"onClick={accept}>Use measurement</Button>
          </div>
        </Card>}

      {a0&&a0.candidates.length>1&&<Card className="space-y-2">
          <p className="text-sm text-ink/70">Several items found — tap the one to measure.</p>
          <canvas ref={overviewRef}onClick={tapOverview}className="w-full cursor-crosshair rounded-xl"/>
        </Card>}
      {a0&&a0.candidates.length<=1&&<canvas ref={overviewRef}className="hidden"/>}

      {!error&&<div className="flex justify-between">
          <Button variant="ghost"onClick={onRetake}>← Retake</Button>
          <Button variant="ghost"onClick={()=>onDone(null)}>Skip measuring →</Button>
        </div>}
    </div>}
