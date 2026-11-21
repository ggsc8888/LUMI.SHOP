"use client";import{useEffect,useState}from"react";import{dataUrl}from"@/lib/client/image";import{Badge,Button,inputCls}from"./ui";const SCENES=[{id:"studio",label:"White studio"},{id:"lifestyle",label:"On model"},{id:"flatlay",label:"Flat lay"},{id:"gift",label:"Gift box"}];export function ImageStudio({images,setImages,source,basePrompt,form}){const[configured,setConfigured]=useState(null),[busy,setBusy]=useState(null),[custom,setCustom]=useState(""),[error,setError]=useState(null);useEffect(()=>{fetch("/api/ai/image").then(r=>r.json()).then(j=>setConfigured(!!j.configured)).catch(()=>setConfigured(!1))},[]);async function generate(scene){setBusy(scene),setError(null);try{const r=await fetch("/api/ai/image",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({photo:source,scene,basePrompt,form,custom:scene==="custom"?custom:void 0})}),j=await r.json();if(!r.ok)throw new Error(j.error||"Generation failed");setImages(prev=>[...prev,{...j.image,id:crypto.randomUUID(),label:SCENES.find(s=>s.id===scene)?.label??"Custom",include:!0,aiGenerated:!0,prompt:j.prompt}])}catch(e){setError(e instanceof Error?e.message:"Generation failed")}finally{setBusy(null)}}const move=(i,d)=>setImages(prev=>{const n=[...prev],j=i+d;return j<0||j>=n.length?prev:([n[i],n[j]]=[n[j],n[i]],n)});return<div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {images.map((img,i)=><figure key={img.id}className={`relative overflow-hidden rounded-xl ring-2 ${img.include?"ring-gold":"ring-transparent opacity-50"}`}>
            {}
            <img src={dataUrl(img)}alt={img.label}className="aspect-square w-full object-cover"/>
            <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-ink/70 to-transparent p-1.5 text-[10px] text-white">
              <span className="truncate">{i===0&&img.include?"★ ":""}{img.label}</span>
              <span className="flex gap-1">
                <button onClick={()=>move(i,-1)}aria-label="Move left">‹</button>
                <button onClick={()=>move(i,1)}aria-label="Move right">›</button>
              </span>
            </figcaption>
            <button onClick={()=>setImages(prev=>prev.map(p=>p.id===img.id?{...p,include:!p.include}:p))}className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-white/90 text-xs shadow"aria-label={img.include?"Exclude image":"Include image"}>
              {img.include?"✓":""}
            </button>
            {img.aiGenerated&&<span className="absolute left-1.5 top-1.5"><Badge tone="gold">AI</Badge></span>}
          </figure>)}
      </div>
      {configured===!1?<p className="text-xs text-ink/50">AI image generation is not configured on this server (OPENAI_API_KEY).</p>:<div className="space-y-2">
          <p className="text-xs text-ink/60">Generate extra shots from your photo — the piece is kept as-is, only the scene changes.</p>
          <div className="flex flex-wrap gap-2">
            {SCENES.map(s=><Button key={s.id}variant="secondary"className="min-h-9 px-3 text-xs"loading={busy===s.id}disabled={!!busy}onClick={()=>generate(s.id)}>
                ✨ {s.label}
              </Button>)}
          </div>
          <div className="flex gap-2">
            <input value={custom}onChange={e=>setCustom(e.target.value)}placeholder="Or describe a scene…"className={inputCls}/>
            <Button variant="secondary"className="shrink-0"disabled={!custom.trim()||!!busy}loading={busy==="custom"}onClick={()=>generate("custom")}>
              Go
            </Button>
          </div>
          {error&&<p className="text-xs text-red-700">{error}</p>}
          <p className="text-[11px] text-ink/40">Review AI images carefully before publishing — they must represent the real piece accurately.</p>
        </div>}
    </div>}
