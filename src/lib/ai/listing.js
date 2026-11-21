import"server-only";import{betaZodOutputFormat}from"@anthropic-ai/sdk/helpers/beta/zod";import{z}from"zod";import{ListingSuggestionSchema}from"../listing";import{claude,CLAUDE_MODEL,DIRECT,FALLBACK_BETA}from"./claude";import{gatewayChat,TEXT_MODEL,TEXT_MODEL_SEES_IMAGES,VISION_MODEL}from"./gateway";import{loadSkill}from"./skill";const BASE_INSTRUCTIONS=`You are the listing assistant inside Jewel Lister, a tool independent jewelry sellers use to turn a photo of a piece into a Shopify product draft.

You receive: the seller's photos (the first is a top-down shot; the others are guided angle/detail shots), sometimes a rectified close-up of the item, measurements produced by a calibrated camera pipeline (treat them as ground truth — they are far more accurate than anything you can estimate from pixels), optional seller notes, and store settings.

Produce suggestions for every Shopify field. Rules:
- Follow the brand skill below for voice, structure, pricing philosophy, SEO style and image direction. If the skill conflicts with these rules on facts or safety, these rules win; on style, the skill wins.
- Never invent facts you cannot see or were not told: hallmarks/karat, natural vs lab stones, carat weight, certifications, brand names. When you infer them, phrase cautiously and add an item to verifyNotes.
- Use the measured dimensions (mm) in the description and size line; convert to inches in parentheses where helpful. If a ring size is provided, use it.
- If bead/pearl sizes are provided, state the size range the way the trade does (e.g. "graduated 5.0–9.0 mm" or "7.0–7.5 mm") in the size line and description, and use the bead count if helpful.
- Seller notes override what you infer from the image.
- Price in the store currency. If cost is known, respect the target margin. Give a realistic low/high range for comparable pieces and a short rationale.
- SEO: title <= 60 chars with the primary keyword first; meta description <= 155 chars; handle lowercase-hyphenated; tags lowercase.
- imagePrompt must describe THIS exact piece faithfully (metal color, stones, shape, proportions) so a generated lifestyle image does not misrepresent it.`;async function systemBlocks(){const skill=await loadSkill();return[{type:"text",text:BASE_INSTRUCTIONS},{type:"text",text:skill.text?`<brand_skill name="${skill.name}">
${skill.text}
</brand_skill>`:"<brand_skill>(no brand skill installed — use a clean, professional voice)</brand_skill>",cache_control:{type:"ephemeral"}}]}const img=i=>({type:"image",source:{type:"base64",media_type:i.mimeType,data:i.base64}});function checkStop(r){if(r.stop_reason==="refusal")throw new Error(`The AI declined this request${r.stop_details?.explanation?`: ${r.stop_details.explanation}`:"."}`);if(r.stop_reason==="max_tokens")throw new Error("The AI response was cut off — please retry.")}async function structured(schema,o){if(DIRECT){const res=await(await claude()).beta.messages.parse({model:CLAUDE_MODEL,max_tokens:o.maxTokens,betas:[FALLBACK_BETA],fallbacks:"default",output_config:{effort:o.effort,format:betaZodOutputFormat(schema)},system:o.system,messages:o.messages});if(checkStop(res),!res.parsed_output)throw new Error("The AI returned an unreadable response — please retry.");return res.parsed_output}const jsonSchema=JSON.stringify(z.toJSONSchema(schema)),messages=[{role:"system",content:[...o.system.map(b=>b.text),`Respond with ONLY one JSON object (no prose, no code fences) that validates against this JSON Schema:
${jsonSchema}`].join(`

`)}];for(const m of o.messages)messages.push({role:m.role,content:await toChat(m.content)});for(let attempt=0;attempt<2;attempt++){const text=await gatewayChat({model:TEXT_MODEL,messages,maxTokens:o.maxTokens}),raw=text.replace(/^```(?:json)?\s*/i,"").replace(/```\s*$/,""),start=raw.indexOf("{"),end=raw.lastIndexOf("}");let problem;try{const parsed=schema.safeParse(JSON.parse(raw.slice(start,end+1)));if(parsed.success)return parsed.data;problem=z.prettifyError(parsed.error)}catch(err){problem=err instanceof Error?err.message:"invalid JSON"}messages.push({role:"assistant",content:text||"{}"},{role:"user",content:`That JSON was invalid:
${problem}
Return the corrected JSON object only.`})}throw new Error("The AI returned an unreadable response — please retry.")}const PHOTO_BRIEF=`You are a jewelry expert examining product photos of ONE piece for an online listing. Describe only what is visible, as short factual bullet points:
- item type and style
- metal colour/finish (gold, silver, rose gold, plated?) — say "unclear" if unsure
- stones or pearls: colour, shape, cut/luster, approximate count, setting
- clasp/closure, chain or band details
- any readable stamp or hallmark text
- condition and notable details
Do not guess karat, origin or whether stones are natural unless it is printed on the piece.`;async function toChat(content){if(!content||typeof content=="string")return content??"";const texts=[],images=[];for(const b of content)b.type==="text"?texts.push(b.text):b.type==="image"&&b.source.type==="base64"&&images.push({type:"image_url",image_url:{url:`data:${b.source.media_type};base64,${b.source.data}`}});if(!images.length)return texts.join(`

`);if(TEXT_MODEL_SEES_IMAGES)return[...images,{type:"text",text:texts.join(`

`)}];let brief=null;if(VISION_MODEL)try{brief=await gatewayChat({model:VISION_MODEL,maxTokens:1200,messages:[{role:"user",content:[...images,{type:"text",text:PHOTO_BRIEF}]}]})}catch(e){console.warn("vision model unavailable:",e instanceof Error?e.message:e)}return[brief?`<photo_analysis source="vision model">
${brief}
</photo_analysis>
(You cannot see the photos yourself; this analysis describes them.)`:"<photo_analysis>The photos could not be analysed. Rely on the item type, measurements and seller notes; do not invent materials or stones, and add verifyNotes asking the seller to confirm metal and stones.</photo_analysis>",...texts].join(`

`)}export async function analyzeListing(input){const{settings}=input,context={measurements:input.measurements??"not measured",sellerNotes:input.notes||null,store:{vendor:settings.vendor||null,currency:settings.currency,targetMarginPct:settings.targetMarginPct,costPerItem:input.costPerItem??null,pricingNotes:settings.pricingNotes||null,brandNotes:settings.brandNotes||null,defaultTags:settings.defaultTags,imageStyle:settings.imageStyle}},extra=(input.photos??[]).slice(0,3),content=[img(input.photo),...extra.map(img)];return input.crop&&content.push(img(input.crop)),content.push({type:"text",text:`Image 1: seller's main (top-down) photo.${extra.length?` Images 2–${extra.length+1}: more views of the same piece.`:""}${input.crop?" Last image: perspective-corrected close-up of the measured item.":""}

<context>
${JSON.stringify(context,null,2)}
</context>

Create the Shopify listing suggestions.`}),structured(ListingSuggestionSchema,{maxTokens:16e3,effort:"medium",system:await systemBlocks(),messages:[{role:"user",content}]})}const RewriteSchema=z.object({value:z.string()});export async function rewriteField(field,form,instruction){return(await structured(RewriteSchema,{maxTokens:8e3,effort:"low",system:await systemBlocks(),messages:[{role:"user",content:`Current Shopify draft:
<draft>
${JSON.stringify(form,null,2)}
</draft>

Rewrite only the "${field}" field.${instruction?` Instruction: ${instruction}`:""} Keep facts consistent with the draft. Return just the new value${field==="descriptionHtml"?" as simple HTML":""}.`}]})).value}const ImagePromptSchema=z.object({prompt:z.string()});export async function imagePromptFor(scene,form,basePrompt,style){return(await structured(ImagePromptSchema,{maxTokens:4e3,effort:"low",system:await systemBlocks(),messages:[{role:"user",content:`Write a prompt for an image-editing model that receives the seller's real photo of the piece and must produce a new product image.
Scene requested: ${scene}
Store image style: ${style}
Piece description: ${basePrompt}
Product: ${form.title} — ${form.materials} — ${form.size}

The piece must stay identical (shape, metal color, stones, proportions, scale relative to a human hand/neck if shown). Only change background, lighting and styling. Under 120 words.`}]})).prompt||basePrompt}
