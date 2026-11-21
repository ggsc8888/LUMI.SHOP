import"server-only";import{readdir,readFile}from"node:fs/promises";import path from"node:path";let cached=null;export async function loadSkill(){if(cached&&process.env.NODE_ENV==="production")return cached;const dir=process.env.HOLLY_SKILL_DIR||path.join(process.cwd(),"skills","holly-zhang"),files=[];let text="";try{const main=await readFile(path.join(dir,"SKILL.md"),"utf8");files.push("SKILL.md"),text+=main.trim();const refDir=path.join(dir,"references"),refs=await readdir(refDir).catch(()=>[]);for(const f of refs.filter(f2=>/\.(md|txt)$/i.test(f2)).sort()){const body=await readFile(path.join(refDir,f),"utf8");files.push(`references/${f}`),text+=`

<reference file="${f}">
${body.trim()}
</reference>`}}catch{text=""}const nameMatch=text.match(/^name:\s*(.+)$/m);return cached={text,name:nameMatch?.[1]?.trim()||"holly-zhang",files,placeholder:!text||/PLACEHOLDER/.test(text)},cached}
