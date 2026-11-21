"use client";import{useState}from"react";import{Badge,Button,Field,inputCls,Sheet}from"./ui";const QUICK=["Shorter","More luxurious","More SEO-friendly","Warmer tone"];export function ListingSheet(p){const{form,setForm,aiFields,suggestion}=p,[rewriting,setRewriting]=useState(null),[openRewrite,setOpenRewrite]=useState(null),[instruction,setInstruction]=useState(""),[preview,setPreview]=useState(!1),[err,setErr]=useState(null),set=(k,v)=>{setForm(f=>({...f,[k]:v})),p.clearAi(k)};async function rewrite(field,how){setRewriting(field),setErr(null);try{const r=await fetch("/api/ai/rewrite",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({field,form,instruction:how})}),j=await r.json();if(!r.ok)throw new Error(j.error);setForm(f=>({...f,[field]:j.value})),setOpenRewrite(null),setInstruction("")}catch(e){setErr(e instanceof Error?e.message:"Rewrite failed")}finally{setRewriting(null)}}const ai=k=>aiFields.has(k)?<Badge tone="gold">✨ AI</Badge>:null,aside=(k,rewritable=!1)=><span className="flex items-center gap-1.5 normal-case tracking-normal">
      {ai(k)}
      {rewritable&&<button type="button"onClick={e=>{e.preventDefault(),setOpenRewrite(openRewrite===k?null:k)}}className="rounded-full px-1.5 text-gold-dark hover:bg-gold/10"title="Rewrite with AI">
          {rewriting===k?"…":"↻"}
        </button>}
    </span>,rewriteBox=k=>openRewrite===k&&<div className="mt-2 space-y-2 rounded-xl bg-gold/5 p-2">
        <div className="flex flex-wrap gap-1.5">
          {QUICK.map(q=><button key={q}type="button"onClick={()=>rewrite(k,q)}className="rounded-full bg-white px-2.5 py-1 text-xs ring-1 ring-ink/10">
              {q}
            </button>)}
        </div>
        <div className="flex gap-2">
          <input value={instruction}onChange={e=>setInstruction(e.target.value)}placeholder="Or tell the AI what to change…"className={inputCls}/>
          <Button className="shrink-0"loading={rewriting===k}onClick={()=>rewrite(k,instruction)}>Rewrite</Button>
        </div>
      </div>,count=(s,max)=><span className={s.length>max?"text-red-600":""}>{s.length}/{max}</span>;return<Sheet open={p.open}onClose={p.onClose}title="Listing details"footer={<div className="flex items-center gap-3">
          <p className="hidden flex-1 text-xs text-ink/50 sm:block">
            {p.shop?<>Saves as a <b>draft</b> in {p.shop} — nothing goes live.</>:"Connect Shopify in Settings to save drafts."}
          </p>
          <Button variant="gold"className="flex-1 sm:flex-none"loading={p.submitting}disabled={!p.shop||!form.title.trim()}onClick={p.onSubmit}>
            Save Shopify draft
          </Button>
        </div>}>
      <div className="space-y-6 pb-4">
        {suggestion&&suggestion.verifyNotes.length>0&&<div className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">
            <p className="mb-1 font-medium">Please verify before publishing</p>
            <ul className="list-disc space-y-0.5 pl-5 text-xs">
              {suggestion.verifyNotes.map(n=><li key={n}>{n}</li>)}
            </ul>
          </div>}
        {err&&<p className="rounded-xl bg-red-50 p-2 text-xs text-red-800">{err}</p>}

        <Section title="Media">{p.images}</Section>

        <Section title="Product">
          <Field label="Title"aside={aside("title",!0)}hint={count(form.title,70)}>
            <input className={inputCls}value={form.title}onChange={e=>set("title",e.target.value)}/>
          </Field>
          {rewriteBox("title")}
          <Field label="Description"aside={<span className="flex items-center gap-2">
                <button type="button"onClick={e=>{e.preventDefault(),setPreview(!preview)}}className="text-[11px] normal-case text-ink/50 underline">
                  {preview?"Edit HTML":"Preview"}
                </button>
                {aside("descriptionHtml",!0)}
              </span>}>
            {preview?<div className="prose-sm rounded-xl bg-white p-3 text-sm ring-1 ring-ink/10 [&_li]:ml-4 [&_li]:list-disc [&_p]:mb-2"dangerouslySetInnerHTML={{__html:sanitize(form.descriptionHtml)}}/>:<textarea rows={8}className={`${inputCls} font-mono text-[13px]`}value={form.descriptionHtml}onChange={e=>set("descriptionHtml",e.target.value)}/>}
          </Field>
          {rewriteBox("descriptionHtml")}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Product type"aside={aside("productType")}>
              <input className={inputCls}value={form.productType}onChange={e=>set("productType",e.target.value)}/>
            </Field>
            <Field label="Vendor">
              <input className={inputCls}value={form.vendor}onChange={e=>set("vendor",e.target.value)}/>
            </Field>
          </div>
          <Field label="Tags"aside={aside("tags")}hint="Comma separated">
            <input className={inputCls}value={form.tags.join(", ")}onChange={e=>set("tags",e.target.value.split(",").map(t=>t.trim()).filter(Boolean))}/>
          </Field>
        </Section>

        <Section title="Pricing">
          {suggestion&&<div className="rounded-2xl bg-white p-3 text-sm ring-1 ring-gold/30">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-gold-dark">AI price suggestion</span>
                <span className="font-display text-lg">
                  {money(suggestion.price.suggested,p.currency)}
                </span>
              </div>
              <p className="text-xs text-ink/60">
                Range {money(suggestion.price.low,p.currency)} – {money(suggestion.price.high,p.currency)}
              </p>
              <p className="mt-1 text-xs text-ink/70">{suggestion.price.rationale}</p>
            </div>}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Price"aside={aside("price")}>
              <input inputMode="decimal"className={inputCls}value={form.price}onChange={e=>set("price",e.target.value)}/>
            </Field>
            <Field label="Compare-at"aside={aside("compareAtPrice")}>
              <input inputMode="decimal"className={inputCls}value={form.compareAtPrice}onChange={e=>set("compareAtPrice",e.target.value)}/>
            </Field>
            <Field label="Cost">
              <input inputMode="decimal"className={inputCls}value={form.costPerItem}onChange={e=>set("costPerItem",e.target.value)}/>
            </Field>
          </div>
          {form.costPerItem&&form.price&&<p className="text-xs text-ink/50">
              Margin {Math.round((1-parseFloat(form.costPerItem)/parseFloat(form.price))*100)}%
            </p>}
        </Section>

        <Section title="Materials & size">
          <Field label="Materials"aside={aside("materials",!0)}>
            <input className={inputCls}value={form.materials}onChange={e=>set("materials",e.target.value)}/>
          </Field>
          {rewriteBox("materials")}
          <Field label="Size / dimensions"aside={aside("size",!0)}>
            <input className={inputCls}value={form.size}onChange={e=>set("size",e.target.value)}/>
          </Field>
          {rewriteBox("size")}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ring size (US)"aside={aside("ringSizeUS")}hint="Creates a “Ring size” variant">
              <input inputMode="decimal"className={inputCls}value={form.ringSizeUS}onChange={e=>set("ringSizeUS",e.target.value)}/>
            </Field>
            <Field label="Weight (g)"aside={aside("weightGrams")}hint="Estimate — weigh to confirm">
              <input inputMode="decimal"className={inputCls}value={form.weightGrams}onChange={e=>set("weightGrams",e.target.value)}/>
            </Field>
          </div>
          {Object.keys(form.dimensions).length>0&&<div className="flex flex-wrap gap-1.5">
              {Object.entries(form.dimensions).map(([k,v])=><Badge key={k}>{k}: {String(v)}</Badge>)}
            </div>}
        </Section>

        <Section title="Inventory">
          <div className="grid grid-cols-3 gap-3">
            <Field label="SKU"><input className={inputCls}value={form.sku}onChange={e=>set("sku",e.target.value)}/></Field>
            <Field label="Barcode"><input className={inputCls}value={form.barcode}onChange={e=>set("barcode",e.target.value)}/></Field>
            <Field label="Quantity"><input inputMode="numeric"className={inputCls}value={form.inventoryQuantity}onChange={e=>set("inventoryQuantity",e.target.value)}/></Field>
          </div>
        </Section>

        <Section title="Search engine listing">
          <div className="rounded-2xl bg-white p-3 ring-1 ring-ink/10">
            <p className="truncate text-xs text-emerald-800">{p.shop??"your-store.com"} › products › {form.handle||"…"}</p>
            <p className="truncate text-[17px] text-blue-800">{form.seoTitle||form.title||"Page title"}</p>
            <p className="line-clamp-2 text-xs text-ink/70">{form.seoDescription||"Meta description"}</p>
          </div>
          <Field label="Page title"aside={aside("seoTitle",!0)}hint={count(form.seoTitle,60)}>
            <input className={inputCls}value={form.seoTitle}onChange={e=>set("seoTitle",e.target.value)}/>
          </Field>
          {rewriteBox("seoTitle")}
          <Field label="Meta description"aside={aside("seoDescription",!0)}hint={count(form.seoDescription,155)}>
            <textarea rows={3}className={inputCls}value={form.seoDescription}onChange={e=>set("seoDescription",e.target.value)}/>
          </Field>
          {rewriteBox("seoDescription")}
          <Field label="URL handle"aside={aside("handle")}>
            <input className={inputCls}value={form.handle}onChange={e=>set("handle",e.target.value)}/>
          </Field>
          <Field label="Image alt text"aside={aside("imageAlt",!0)}>
            <input className={inputCls}value={form.imageAlt}onChange={e=>set("imageAlt",e.target.value)}/>
          </Field>
          {rewriteBox("imageAlt")}
          {suggestion&&suggestion.seo.keywords.length>0&&<p className="text-xs text-ink/50">Target keywords: {suggestion.seo.keywords.join(" \xB7 ")}</p>}
        </Section>
      </div>
    </Sheet>}function Section({title,children}){return<section className="space-y-3">
      <h3 className="font-display text-lg">{title}</h3>
      {children}
    </section>}function money(n,currency){try{return new Intl.NumberFormat(void 0,{style:"currency",currency}).format(n)}catch{return`${n} ${currency}`}}function sanitize(html){return html.replace(/<(script|style|iframe|object|embed)[\s\S]*?>[\s\S]*?<\/\1>/gi,"").replace(/\son\w+="[^"]*"/gi,"").replace(/\son\w+='[^']*'/gi,"").replace(/javascript:/gi,"")}
