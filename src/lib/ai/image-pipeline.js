import "server-only";
import { gatewayToken, GATEWAY_URL } from "./claude";

// Generate -> verify -> retry pipeline for Jewel Lister scene images.
//
// Model access, in order:
//   1. The user's own OpenAI key (x-image-api-key header / body.apiKey), or OPENAI_API_KEY on the server:
//      calls OpenAI directly with PAID_IMAGE_MODEL (default gpt-image-2).
//   2. Vercel AI Gateway with IMAGE_MODEL (default openai/gpt-image-2). Works when the team has credits.
//   3. Free fallback: if the gateway says the paid model needs credits, rotate through FREE_IMAGE_MODELS.
// Every candidate is inspected by a vision model against the real product photo and the Holly Zhang
// checklist for the scene. Failed checks are fed back into the next attempt. Up to MAX_LOOPS attempts;
// the best-scoring candidate is returned with its verification report.

export const MAX_LOOPS = Math.max(1, Math.min(5, Number(process.env.IMAGE_VERIFY_LOOPS) || 3));
const PASS_SCORE = Number(process.env.IMAGE_VERIFY_PASS_SCORE) || 75;
const PAID_GATEWAY_MODEL = process.env.IMAGE_MODEL || "openai/gpt-image-2";
const PAID_DIRECT_MODEL = process.env.PAID_IMAGE_MODEL || "gpt-image-2";
const FREE_MODELS = (process.env.FREE_IMAGE_MODELS || "microsoft/mai-image-2.6-flash,microsoft/mai-image-2.7-flash,openai/gpt-image-1-mini")
  .split(",").map(s => s.trim()).filter(Boolean);
const VERIFY_MODEL = process.env.VERIFY_MODEL || "alibaba/qwen3.7-flash";

const NEEDS_CREDITS = /free tier|credits|top-up|top up|billing|balance/i;

const CHECKS = {
  studio: [
    "The background is ONE solid flat light warm grey (#EFEFEB) at all corners and edges: no gradient, vignette, texture, horizon, props or pure white",
    "Exactly one piece of jewelry, centered, nothing cropped or touching the edges",
    "Soft light from the upper-left; only a faint contact shadow",
  ],
  lifestyle: [
    "Exactly one piece of jewelry is worn (the product); no other jewelry, watch or rings",
    "Hands and fingers are anatomically correct (five fingers, natural joints); a ring is on the ring finger unless told otherwise",
    "The product is in proportion to the body (e.g. pearl about as wide as a finger)",
    "No commercial smile, no chin-on-hand pose, no pointing at the jewelry",
  ],
  flatlay: [
    "Exactly one piece of jewelry resting naturally on the surface with a believable contact shadow",
    "At most one sea-green accent object and it does not touch the jewelry",
    "No flowers, perfume, marble, silk folds or writing",
  ],
  gift: [
    "A ring in a box is SEATED: the lower band is inserted into the cushion slit, not standing on or floating above the cushion",
    "Realistic scale: the ring box is much larger than the ring",
    "Any card is blank (no writing); at most one sea-green accent",
  ],
  custom: ["The scene matches the request and is physically plausible (gravity, contact, scale)"],
};
const COMMON = [
  "The jewelry matches image 1 exactly: same pearl count, size relationship, color and overtone; same stone count/arrangement (halo, shoulders); same gallery/setting construction; same metal color. Nothing added or removed",
  "The pearl is the brightest, clearest point of interest",
  "No text, logo or watermark; a single standalone photo (not a collage)",
];

function inspectorPrompt(scene) {
  const list = [...COMMON, ...(CHECKS[scene] || CHECKS.custom)].map((c, i) => `${i + 1}. ${c}`).join("\n");
  return `You are the Holly Zhang Pearl Gallery image QA inspector. Image 1 is the REAL product photo (ground truth). Image 2 is an AI-generated listing image for the scene "${scene}".
Inspect image 2 strictly against image 1 and this checklist:
${list}
Return ONLY JSON: {"pass": boolean, "score": 0-100, "product_match": 0-10, "physical_plausibility": 0-10, "brand_rules": 0-10, "issues": ["short, specific, fixable problems"]}.
pass=false if any checklist item fails. Score product fidelity most heavily: a beautiful image of the wrong jewelry must fail.`;
}

function parseJson(text) {
  if (!text) return null;
  const m = String(text).match(/\{[\s\S]*\}/);
  try { return m ? JSON.parse(m[0]) : null; } catch { return null; }
}

async function gatewayAuth() {
  const t = await gatewayToken().catch(() => null);
  return t ? { authorization: `Bearer ${t}` } : {};
}

async function imageEdit({ base, headers, model, prompt, photo, size }) {
  const fd = new FormData();
  fd.append("model", model);
  fd.append("prompt", prompt);
  fd.append("size", size || "1024x1024");
  fd.append("n", "1");
  if (/gpt-image-1(\.5)?$/.test(model)) fd.append("input_fidelity", "high");
  const ext = (photo.mimeType || "image/jpeg").split("/")[1] || "jpeg";
  fd.append("image", new Blob([Buffer.from(photo.base64, "base64")], { type: photo.mimeType || "image/jpeg" }), `photo.${ext}`);
  const r = await fetch(`${base}/images/edits`, { method: "POST", headers, body: fd });
  const j = await r.json().catch(() => ({}));
  const d = j.data?.[0];
  if (!r.ok || !d) {
    const err = new Error(j.error?.message || `Image generation failed (${r.status})`);
    err.status = r.status;
    throw err;
  }
  if (d.b64_json) return { base64: d.b64_json, mimeType: "image/png" };
  const img = await fetch(d.url);
  return { base64: Buffer.from(await img.arrayBuffer()).toString("base64"), mimeType: img.headers.get("content-type") || "image/png" };
}

async function verify({ photo, candidate, scene }) {
  try {
    const headers = { "content-type": "application/json", ...(await gatewayAuth()) };
    const url = (p) => `data:${p.mimeType || "image/png"};base64,${p.base64}`;
    const r = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: VERIFY_MODEL,
        temperature: 0,
        max_tokens: 1500,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: inspectorPrompt(scene) },
          { role: "user", content: [
            { type: "image_url", image_url: { url: url(photo) } },
            { type: "image_url", image_url: { url: url(candidate) } },
            { type: "text", text: "Inspect image 2 against image 1. JSON only." },
          ] },
        ],
      }),
    });
    const j = await r.json().catch(() => ({}));
    const v = parseJson(j.choices?.[0]?.message?.content);
    if (!r.ok || !v) return { checked: false, pass: false, score: 0, issues: [`verifier unavailable (${j.error?.message || r.status})`] };
    const score = Math.max(0, Math.min(100, Number(v.score) || 0));
    return { checked: true, pass: !!v.pass && score >= PASS_SCORE, score, product_match: v.product_match, physical_plausibility: v.physical_plausibility, brand_rules: v.brand_rules, issues: Array.isArray(v.issues) ? v.issues.slice(0, 8).map(String) : [] };
  } catch (e) {
    return { checked: false, pass: false, score: 0, issues: [`verifier error: ${e.message}`] };
  }
}

function withFixes(prompt, issues) {
  if (!issues?.length) return prompt;
  return `${prompt}\n\nTHE PREVIOUS ATTEMPT FAILED QUALITY CHECK. FIX ALL OF THESE, while copying the jewelry exactly from the photo:\n- ${issues.join("\n- ")}`;
}

// userApiKey: the end user's own OpenAI key, if they provided one.
export async function generateVerified({ photo, prompt, scene = "studio", size, userApiKey }) {
  const directKey = userApiKey || process.env.OPENAI_API_KEY || null;
  let access = directKey ? "user-key" : "gateway-paid";
  let notice = null;
  const attempts = [];
  let best = null;
  let issues = [];

  for (let loop = 1; loop <= MAX_LOOPS; loop++) {
    const p = withFixes(prompt, issues);
    let image, model;
    try {
      if (access === "user-key") {
        model = PAID_DIRECT_MODEL;
        image = await imageEdit({ base: "https://api.openai.com/v1", headers: { authorization: `Bearer ${directKey}` }, model, prompt: p, photo, size });
      } else if (access === "gateway-paid") {
        model = PAID_GATEWAY_MODEL;
        image = await imageEdit({ base: `${GATEWAY_URL}/v1`, headers: await gatewayAuth(), model, prompt: p, photo, size });
      } else {
        model = FREE_MODELS[(loop - 1) % FREE_MODELS.length];
        image = await imageEdit({ base: `${GATEWAY_URL}/v1`, headers: await gatewayAuth(), model, prompt: p, photo, size });
      }
    } catch (e) {
      if (access === "gateway-paid" && (e.status === 402 || e.status === 403 || NEEDS_CREDITS.test(e.message))) {
        access = "free";
        notice = "Using the free image model. Add your own OpenAI API key in Settings for higher-fidelity images.";
        loop--; // the paid attempt did not produce an image; don't spend a verification loop on it
        continue;
      }
      if (access === "user-key" && (e.status === 401 || e.status === 403)) {
        const err = new Error("Your OpenAI API key was rejected. Check the key in Settings, or remove it to use the free model.");
        err.status = 400;
        throw err;
      }
      attempts.push({ loop, model, error: e.message });
      issues = [];
      continue;
    }
    const v = await verify({ photo, candidate: image, scene });
    attempts.push({ loop, model, score: v.score, pass: v.pass, checked: v.checked, issues: v.issues });
    if (!best || v.score > best.verification.score) best = { image, model, prompt: p, verification: v };
    if (v.pass) break;
    issues = v.checked ? v.issues : [];
  }

  if (!best) {
    const last = attempts[attempts.length - 1];
    const err = new Error(last?.error || "Image generation failed");
    err.status = 502;
    throw err;
  }
  return {
    image: best.image,
    prompt: best.prompt,
    model: best.model,
    access,
    needsKey: access === "free",
    notice,
    verification: {
      passed: !!best.verification.pass,
      score: best.verification.score,
      issues: best.verification.issues,
      loops: attempts.length,
      maxLoops: MAX_LOOPS,
      attempts,
    },
  };
}
