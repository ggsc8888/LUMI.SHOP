"use client";import Link from"next/link";import{useEffect,useMemo,useState}from"react";import{canvasToB64,dataUrl,nextFrame,rasterToCanvas,shrinkB64}from"@/lib/client/image";import{emptyDraft,slugify}from"@/lib/listing";import{measureBeads}from"@/lib/measure/beads";import{defaultPaperSize,detectPaper,PAPER_SIZES}from"@/lib/measure/paper";import{ringSizeFromDiameter}from"@/lib/measure/ring";import{CATEGORIES}from"@/lib/shots";import{BeadPanel}from"./BeadPanel";import{GuidedCapture}from"./GuidedCapture";import{ImageStudio}from"./ImageStudio";import{ListingSheet}from"./ListingSheet";import{MeasurePanel}from"./MeasurePanel";import{ScreenRuler}from"./ScreenRuler";import{Badge,Button,Card,Field,inputCls,Spinner}from"./ui";const BASE={lengthMm:0,widthMm:0,maxFeretMm:0,areaMm2:0,method:"ruler",ppm:0,uncertaintyMm:.2,reprojRmsMm:0,perspectiveRatio:1,frames:1,segmentation:"classic",warnings:[],overlay:{rect:[],contour:[]}};function rulerToMeasure(r){return r.kind==="ring"?{result:{...BASE,hole:{diameterMm:r.diameterMm,circleFitMm:r.diameterMm,minWidthMm:r.diameterMm,circularity:1},ringSize:ringSizeFromDiameter(r.diameterMm),uncertaintyMm:.1}}:{result:{...BASE,lengthMm:r.lengthMm,maxFeretMm:r.lengthMm,widthMm:r.widthMm??0}}}function beadsToMeasure(b){const d=b.beads.map(x=>x.dMm).filter(v=>v!=null);return{result:{...BASE,method:"beads",ppm:b.ppm??0,uncertaintyMm:Math.max(.15,b.uncertaintyMm??.2),beads:{count:b.count,minMm:b.minMm,maxMm:b.maxMm,medianMm:b.medianMm,diametersMm:d.map(v=>Math.round(v*10)/10)}}}}const STEPS=[{id:"capture",label:"Photo & measure"},{id:"details",label:"Details"},{id:"done",label:"Draft"}];export function Studio(){const[method,setMethod]=useState("camera"),[phase,setPhase]=useState("shots"),[rulerMeasure,setRulerMeasure]=useState(null),[mobile,setMobile]=useState(!1);useEffect(()=>{const t=setTimeout(()=>setMobile(/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)||/Macintosh/.test(navigator.userAgent)&&navigator.maxTouchPoints>1),0);return()=>clearTimeout(t)},[]);const[paperSize,setPaperSize]=useState(defaultPaperSize),[category,setCategory]=useState(null),[step,setStep]=useState("capture"),[shots,setShots]=useState([]),[measureFrames,setMeasureFrames]=useState([]),[beads,setBeads]=useState(null),[measure,setMeasure]=useState(null),[measureNote,setMeasureNote]=useState(null),[photo,setPhoto]=useState(null),[notes,setNotes]=useState(""),[cost,setCost]=useState(""),[settings,setSettings]=useState(null),[shop,setShop]=useState(null),[analyzing,setAnalyzing]=useState(!1),[suggestion,setSuggestion]=useState(null),[form,setForm]=useState(emptyDraft),[aiFields,setAiFields]=useState(new Set),[images,setImages]=useState([]),[sheetOpen,setSheetOpen]=useState(!1),[submitting,setSubmitting]=useState(!1),[done,setDone]=useState(null),[error,setError]=useState(null);useEffect(()=>{fetch("/api/settings").then(r=>r.json()).then(j=>j.settings&&setSettings(j.settings)).catch(()=>{}),fetch("/api/shopify/status").then(r=>r.json()).then(j=>setShop(j.connected?j.shop:null)).catch(()=>{})},[]);function chooseMethod(m){setMethod(m),setPhase(m==="ruler"&&!rulerMeasure?"ruler":"shots")}async function onShots(list){setShots(list),setError(null),setMeasureNote(null);const imgs=[];for(const[i,s]of list.entries()){const b=await canvasToB64(rasterToCanvas(s.frames[0],2048),.88);imgs.push({...b,id:`shot-${s.shot.id}`,label:s.shot.title,include:!0}),i===0&&setPhoto(b)}if(setImages(imgs),method==="ruler"){setMeasure(rulerMeasure),setStep("details");return}const m=list.find(s=>s.shot.measure);if(!m||!category){setMeasure(null),setMeasureNote("No top-down measuring shot, so no size was measured."),setStep("details");return}if(setMeasureFrames(m.frames),setPhase("analysing"),await nextFrame(),category.measure==="beads"){const r=measureBeads(m.frames[0],paperSize);if(r.count>=3||category.id==="pearls"){setBeads(r),setPhase("beads");return}}if(detectPaper(m.frames[0],paperSize)){setPhase("object");return}setMeasure(null),setMeasureNote("No sheet of paper in the measuring shot, so size wasn't measured. Use the Ruler tab, or retake shot 1 on paper."),setPhase("shots"),setStep("details")}function onMeasured(m){if(setMeasure(m),m?.crop){const crop=m.crop;setImages(prev=>[...prev.filter(i=>i.id!=="crop"),{...crop,id:"crop",label:"Close-up",include:!1}])}setPhase("shots"),setStep("details")}function backToCapture(){setStep("capture"),setPhase(method==="ruler"&&!rulerMeasure?"ruler":"shots")}function reset(){setStep("capture"),setPhase(method==="ruler"?"ruler":"shots"),setCategory(null),setRulerMeasure(null),setShots([]),setMeasureFrames([]),setBeads(null),setMeasure(null),setMeasureNote(null),setPhoto(null),setNotes(""),setCost(""),setSuggestion(null),setForm(emptyDraft()),setAiFields(new Set),setImages([]),setDone(null),setError(null)}const measurementSummary=useMemo(()=>{const r=measure?.result;if(!r)return null;const round=n=>n==null?void 0:Math.round(n*100)/100;return{method:r.method==="beads"?"every bead measured from a top-down photo on a paper reference (sphere-corrected)":r.method==="mat"?"calibrated mat (ArUco), multi-frame":r.method==="paper"?"sheet of paper reference, multi-frame":r.method==="ruler"?"measured by the seller with a life-size on-screen ruler":"card reference",beads:r.beads?{count:r.beads.count,smallestMm:round(r.beads.minMm),largestMm:round(r.beads.maxMm),medianMm:round(r.beads.medianMm),diametersMm:r.beads.diametersMm}:void 0,lengthMm:r.lengthMm?round(r.lengthMm):void 0,widthMm:r.widthMm?round(r.widthMm):void 0,longestSpanMm:r.maxFeretMm?round(r.maxFeretMm):void 0,innerDiameterMm:round(r.hole?.diameterMm),outerDiameterMm:round(r.outerDiameterMm),ringSize:r.ringSize??void 0,uncertaintyMm:round(r.uncertaintyMm)}},[measure]);async function analyze(){if(photo){setAnalyzing(!0),setError(null);try{const small=await canvasToB64(rasterToCanvas(shots[0].frames[0],1568),.88),extra=await Promise.all(shots.slice(1,4).map(x=>canvasToB64(rasterToCanvas(x.frames[0],1024),.85))),r=await fetch("/api/ai/analyze",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({photo:small,photos:extra,crop:measure?.crop??null,measurements:measurementSummary,notes:[category?`Item type: ${category.label}.`:"",notes].filter(Boolean).join(" "),costPerItem:cost?parseFloat(cost):null})}),j=await r.json();if(!r.ok)throw new Error(j.error||"AI analysis failed");const s=j.suggestion,st=j.settings;setSettings(st),setSuggestion(s);const dims={};if(measurementSummary)for(const[k,v]of Object.entries(measurementSummary))typeof v=="number"&&(dims[k.replace(/Mm$/,"_mm").replace(/([A-Z])/g,"_$1").toLowerCase()]=v);const ring=measure?.result.ringSize?.us??s.size.ringSizeUS,next={title:s.title,descriptionHtml:s.descriptionHtml,productType:s.productType,vendor:st.vendor||"",tags:[...new Set([...s.tags,...st.defaultTags].map(t=>t.toLowerCase()))],price:s.price.suggested.toFixed(2),compareAtPrice:s.price.compareAt?s.price.compareAt.toFixed(2):"",costPerItem:cost,sku:"",barcode:"",weightGrams:s.estimatedWeightGrams!=null?String(s.estimatedWeightGrams):"",inventoryQuantity:String(st.defaultInventory??1),materials:s.materials.summary,size:s.size.display,ringSizeUS:ring!=null?String(ring):"",seoTitle:s.seo.title,seoDescription:s.seo.description,handle:slugify(s.seo.handle||s.title),imageAlt:s.seo.imageAlt,dimensions:dims};setForm(next),setAiFields(new Set(["title","descriptionHtml","productType","tags","price","compareAtPrice","weightGrams","materials","size","ringSizeUS","seoTitle","seoDescription","handle","imageAlt"])),setSheetOpen(!0)}catch(e){setError(e instanceof Error?e.message:"AI analysis failed")}finally{setAnalyzing(!1)}}}async function submit(){setSubmitting(!0),setError(null);try{let included=images.filter(i=>i.include);const total=()=>included.reduce((a,i)=>a+i.base64.length,0);total()>32e5&&(included=await Promise.all(included.map(async i=>i.base64.length>4e5?{...i,...await shrinkB64(i,1600,.85)}:i))),total()>36e5&&(included=await Promise.all(included.map(async i=>({...i,...await shrinkB64(i,1200,.8)}))));const handle=form.handle||slugify(form.title),r=await fetch("/api/shopify/draft",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({form,images:included.map((img,i)=>({base64:img.base64,mimeType:img.mimeType,filename:`${handle}-${i+1}.${img.mimeType==="image/png"?"png":"jpg"}`,alt:i===0?form.imageAlt||form.title:`${form.title} — ${img.label.toLowerCase()}`,aiGenerated:img.aiGenerated}))})}),j=await r.json();if(!r.ok)throw new Error(j.error||"Could not create draft");setDone({adminUrl:j.adminUrl,warnings:j.warnings??[]}),setSheetOpen(!1),setStep("done")}catch(e){setError(e instanceof Error?e.message:"Could not create draft")}finally{setSubmitting(!1)}}const stepIdx=STEPS.findIndex(s=>s.id===step);return<div className="mx-auto max-w-xl space-y-5 px-4 pb-24 pt-4 sm:pt-8">
      <ol className="flex items-center gap-2 text-xs">
        {STEPS.map((s,i)=><li key={s.id}className="flex flex-1 items-center gap-2">
            <span className={`grid size-6 place-items-center rounded-full text-[11px] font-semibold ${i<=stepIdx?"bg-ink text-paper":"bg-ink/10 text-ink/50"}`}>{i+1}</span>
            <span className={i===stepIdx?"font-medium":"text-ink/50"}>{s.label}</span>
            {i<STEPS.length-1&&<span className="h-px flex-1 bg-ink/10"/>}
          </li>)}
      </ol>

      {step==="capture"&&!category&&<div className="space-y-3">
          <h2 className="font-display text-2xl">What are you listing?</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {CATEGORIES.map(c=><button key={c.id}onClick={()=>{setCategory(c),setPhase(method==="ruler"&&!rulerMeasure?"ruler":"shots")}}className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl bg-white text-center text-sm font-medium shadow-sm ring-1 ring-ink/10 transition hover:ring-gold active:scale-95">
                <span className="text-3xl">{c.icon}</span>
                {c.label}
              </button>)}
          </div>
        </div>}

      {step==="capture"&&category&&<>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-gold/15 px-3 py-1.5 text-sm font-medium text-gold-dark">
              {category.icon} {category.label}
            </span>
            <button onClick={()=>setCategory(null)}className="text-xs text-ink/50 underline">Change type</button>
          </div>

          {(phase==="ruler"||phase==="shots")&&<>
              <div className="grid grid-cols-2 gap-1 rounded-full bg-ink/5 p-1 text-sm">
                {[["camera","\u{1F4F7} Camera measures"],["ruler","\u{1F4CF} I measure (ruler)"]].map(([m,l])=><button key={m}onClick={()=>chooseMethod(m)}className={`rounded-full py-2 transition ${method===m?"bg-white font-medium shadow-sm":"text-ink/60"}`}>
                    {l}
                  </button>)}
              </div>
              <p className="text-center text-xs text-ink/55">
                {method==="camera"?<>
                    {category.measure==="beads"?"Shot 1 sizes every bead automatically":"Shot 1 is measured automatically"} on a sheet of{" "}
                    {Object.keys(PAPER_SIZES).map((k,i)=><span key={k}>
                        {i>0&&" / "}
                        <button onClick={()=>setPaperSize(k)}className={paperSize===k?"font-semibold text-ink underline":"underline"}>
                          {PAPER_SIZES[k].label}
                        </button>
                      </span>)}{" "}
                    paper.
                  </>:"Lay the piece on your screen and measure it, then take the photos."}
              </p>
            </>}

          {phase==="ruler"&&<ScreenRuler ring={category.id==="ring"}onDone={r=>{setRulerMeasure(rulerToMeasure(r)),setPhase("shots")}}onSkip={()=>{setRulerMeasure(null),setPhase("shots")}}/>}

          {phase==="shots"&&<>
              {method==="ruler"&&rulerMeasure&&<div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
                  <span>
                    ✓ {rulerMeasure.result.ringSize?`\xD8 ${rulerMeasure.result.hole?.diameterMm.toFixed(2)} mm \xB7 US ${rulerMeasure.result.ringSize.us}`:`${rulerMeasure.result.lengthMm.toFixed(1)}${rulerMeasure.result.widthMm?` \xD7 ${rulerMeasure.result.widthMm.toFixed(1)}`:""} mm`}
                    {" "}— now the photos.
                  </span>
                  <button onClick={()=>setPhase("ruler")}className="shrink-0 text-xs underline">Re-measure</button>
                </div>}
              <GuidedCapture key={`${category.id}-${method}`}category={category}measureShot={method==="camera"}paperSize={paperSize}autoStart={mobile}onDone={onShots}/>
            </>}

          {phase==="analysing"&&<Card className="flex items-center justify-center gap-3 py-10 text-sm text-ink/70">
              <Spinner/> Measuring…
            </Card>}

          {phase==="beads"&&beads&&measureFrames[0]&&<BeadPanel image={measureFrames[0]}result={beads}onChange={setBeads}onRetake={()=>setPhase("shots")}onUse={()=>onMeasured(beads.minMm!=null?beadsToMeasure(beads):null)}/>}

          {phase==="object"&&measureFrames.length>0&&<MeasurePanel frames={measureFrames}mode="paper"paperSize={paperSize}printScale={settings?.printScale??1}onDone={onMeasured}onRetake={()=>setPhase("shots")}/>}
        </>}

      {step==="details"&&photo&&<div className="space-y-4">
          <Card className="flex gap-4">
            {}
            <img src={dataUrl(measure?.crop??photo)}alt=""className="size-24 shrink-0 rounded-xl object-cover"/>
            <div className="min-w-0 text-sm">
              {measure?<>
                  <p className="font-display text-xl">
                    {measure.result.beads?`Beads ${measure.result.beads.minMm.toFixed(1)}–${measure.result.beads.maxMm.toFixed(1)} mm`:measure.result.lengthMm?`${measure.result.lengthMm.toFixed(1)}${measure.result.widthMm?` \xD7 ${measure.result.widthMm.toFixed(1)}`:""} mm`:measure.result.hole?`Inner \xD8 ${measure.result.hole.diameterMm.toFixed(2)} mm`:""}
                  </p>
                  {measure.result.ringSize&&<Badge tone="gold">Ring size US {measure.result.ringSize.us}</Badge>}
                  <p className="mt-1 text-xs text-ink/50">±{measure.result.uncertaintyMm.toFixed(2)} mm · {measure.result.beads?`${measure.result.beads.count} beads, median ${measure.result.beads.medianMm.toFixed(1)} mm`:measure.result.method==="ruler"?"screen ruler":`${measure.result.frames} frame(s)`}</p>
                </>:<p className="text-ink/60">{measureNote??"No measurement — the AI will describe size qualitatively."} You can enter dimensions in the form.</p>}
              <button onClick={backToCapture}className="mt-2 text-xs underline text-ink/50">Retake / re-measure</button>
            </div>
          </Card>

          <Card className="space-y-3">
            <Field label="Notes for the AI (optional)"hint="Anything you know: hallmark, karat, stone type, lab vs natural, collection name, story…">
              <textarea rows={3}value={notes}onChange={e=>setNotes(e.target.value)}className={inputCls}placeholder="e.g. stamped 14K, 3mm lab-grown diamond, part of the Moonlight collection"/>
            </Field>
            <Field label={`Your cost per item (${settings?.currency??"USD"}, optional)`}hint="Used to suggest a price that hits your target margin">
              <input inputMode="decimal"value={cost}onChange={e=>setCost(e.target.value)}className={inputCls}placeholder="0.00"/>
            </Field>
            <Button variant="gold"className="w-full"loading={analyzing}onClick={analyze}>
              {analyzing?"Writing your listing…":suggestion?"✨ Regenerate listing":"✨ Generate listing"}
            </Button>
            {suggestion?<Button variant="secondary"className="w-full"onClick={()=>setSheetOpen(!0)}>Open listing details</Button>:<button onClick={()=>setSheetOpen(!0)}className="w-full text-center text-xs text-ink/50 underline">Fill in manually instead</button>}
          </Card>
          {!shop&&<p className="rounded-xl bg-ink/5 p-3 text-xs text-ink/60">
              Shopify isn&apos;t connected yet. <Link href="/settings"className="underline">Connect your store</Link> to save drafts.
            </p>}
        </div>}

      {step==="done"&&done&&<Card className="space-y-4 text-center">
          <div className="text-4xl">✨</div>
          <h2 className="font-display text-2xl">Draft saved to Shopify</h2>
          <p className="text-sm text-ink/60">It&apos;s saved as a draft in {shop} — review it in Shopify and publish when ready.</p>
          {done.warnings.length>0&&<ul className="rounded-xl bg-amber-50 p-3 text-left text-xs text-amber-900">
              {done.warnings.map(w=><li key={w}>⚠ {w}</li>)}
            </ul>}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <a href={done.adminUrl}target="_blank"rel="noreferrer">
              <Button variant="primary"className="w-full">Open in Shopify admin ↗</Button>
            </a>
            <Button variant="secondary"onClick={reset}>List another piece</Button>
          </div>
        </Card>}

      {error&&<p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      {photo&&<ListingSheet open={sheetOpen}onClose={()=>setSheetOpen(!1)}form={form}setForm={setForm}aiFields={aiFields}clearAi={k=>setAiFields(s=>{const n=new Set(s);return n.delete(k),n})}suggestion={suggestion}currency={settings?.currency??"USD"}shop={shop}submitting={submitting}onSubmit={submit}images={<ImageStudio images={images}setImages={setImages}source={photo}basePrompt={suggestion?.imagePrompt??form.title}form={form}/>}/>}
      {error&&sheetOpen&&<div className="fixed inset-x-4 bottom-24 z-[60] rounded-xl bg-red-600 p-3 text-sm text-white shadow-lg sm:left-auto sm:right-6 sm:w-96">
          {error}
        </div>}
    </div>}
