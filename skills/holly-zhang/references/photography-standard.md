# Holly Zhang Photography Standard: e-commerce product images

Source: Holly Zhang Pearl Gallery Controlled Photography Standard, Final Color Decision (Color Policy v3, effective 21 November 2026), the November 2026 Product Image Consistency Update (AI-G 2.0, AI-ES 2.0) and the October 2026 Photography Guide (Part 3 grid, Part 4 cards). Where older pages mention #F2F1ED or a 4:5 product frame, **the November decision wins: #EFEFEB and 1:1.**

## One source of truth: background

- **#EFEFEB / RGB (239, 239, 235) / #EFEFEBFF fully opaque.** Solid sRGB color, no lighting or gradient variation.
- RETIRED for product images: #F2F1ED, #F5F3EE, #F1F0EC, any other off-white, and pure white #FFFFFF.
- Must match exactly: the product-photo canvas and all background regions away from the jewelry; listing cards, image containers, thumbnails, placeholders; generated derivatives / WebP exports.
- Unchanged: White for general page surfaces; Shell Cream and sea-green for non-product design; editorial gradients/horizon tiles only for campaigns and category stories. Model, lifestyle and campaign photos are **not** forced to a flat fill.

## Copy-ready primary product image prompt (AI-G 2.0, #EFEFEB)

Use the supplied real product photos and the category placement card below. Output a square 2048 × 2048 sRGB product image with exactly one solid background color: HEX #EFEFEB, RGB (239,239,235), opaque. Keep the backdrop seamless and exactly the same flat color at all four corners and along every edge. No gradient, vignette, paper texture, lens shading, auto white-balance drift, colored bounce light on the background, generated border, decorative props, text or watermark. One large soft light source from the upper-left (about 45°), ratio about 1:2; one soft highlight on each pearl at 10–11 o'clock, never clipped (stays below RGB 250, overtone visible); only a faint real contact shadow, as if the piece rests on light. 100 mm macro look, f/11, everything sharp. Preserve the exact photographed pearl colors, overtone, luster, shape, surface, size relationships, metal color, prongs, posts, backs, clasps and stones. No extra or missing parts, no retouched defects, no dramatic shadows. If a required view is missing from the photos, do not guess; flag it.

Post-processing rule: do not rely on prompt fidelity for exact color. Normalize the background to a solid #EFEFEB plate with an edge-aware jewelry mask that preserves pearl translucency, metal reflections and the contact shadow. Never regenerate an acceptable jewelry image only to change its background.

## Framing on the 1:1 canvas

- Nothing in the outer 10% safe margin; nothing touches an edge. Visual center sits slightly above the middle.
- Same category means same pose, scale, position and left-right order across every SKU. Do not freely restage.

## Category placement cards (use one with AI-G)

- **AI-ES 2.0 · Pearl studs / straight posts:** one stud upright, pearl facing the camera; the companion lies behind and to the right, post and back pointing to 3–4 o'clock. Front pearl center x=39%, y=45%; second pearl center x=64%, y=53%. Each pearl diameter 19–23% of canvas width, same apparent size if equal in reality. Silhouettes do not overlap; all metal inside the inner 80%. Highlight at 10–11 o'clock. Same template for white, black, golden and colored studs.
- **AI-EH · Earrings with hoop / lever-back / French hook:** pair standing upright side by side, hooks up, each about 25% of frame width, gap of about half a pearl between them, pearl bottoms on the same line, slightly above center. Camera exactly at pearl height (0–5°), never above. Turn each earring 30–45° about its vertical axis so the hoop's U opening shows, decorated side forward, closure behind; both the same way or mirrored. Hoop perfectly vertical; pearl hangs straight down from the hoop's center line. Never shoot a hoop straight on.
- **AI-NK · Necklace:** from directly above, lying flat as a clean even circle with evenly spaced pearls, about 75% of frame width, slightly above center. Clasp at 12 o'clock; main pearl/pendant between 6 and 7 o'clock. The strand is the brightest thing.
- **AI-BR · Bracelet:** from above, clean even circle about 60% of frame width, centered slightly above middle. Clasp at 12; feature pearl at 6–7 o'clock.
- **AI-PD · Pendant:** hanging vertically, straight on; chain enters from both sides of the top edge forming a symmetric narrow V; pendant about 35% of frame width, centered just below middle; bail centered over the pearl; chain never coiled. Camera at pendant height.
- **AI-RG · Ring:** standing upright, three-quarter view, camera about 30° above. Ring about 35% of frame width, centered; pearl/center stone slightly above middle; a little inside of the band visible; faint contact shadow only.
- **AI-BC · Brooch:** lying flat, tilted about 15° toward camera, pin hidden. About 50% of frame width, slightly above center. A drop hangs straight down at 6 o'clock.

## Other deliverables per SKU

| # | Image | Background | Light | Piece size |
|---|---|---|---|---|
| 1 | Product image (PDP first, cards, search) | #EFEFEB seamless, 1:1 | one large soft light, upper-left 45°, 1:2 | per card above |
| 2 | On-body (PDP second) | Look A/B/C scene, softly blurred | close-up framing, one piece, eyes off camera | piece in middle third |
| 3 | Scene still life (PDP third, social, gift guide) | oat washed linen, walnut/white-oak wood, white porcelain or sea-glass acrylic; exactly one sea-green object not touching the pearl | window light 5300 K, cool grey shadows | 30–45%, generous space |
| 4 | Macro (optional) | same as product image | same + white reflector | pearl surface ≥ half the frame |

Scene still lifes: no flowers, perfume bottles, silk folds or anything with writing.

## Acceptance tests (all must pass)

- Four corners and clear background pixels equal RGB (239,239,235).
- Product image and card background meet with no visible boundary.
- No gradients, texture, color casts or overlays.
- 1:1, approved pose and scale, soft light, unclipped hardware.
- Jewelry matches the real reference photos; nothing fabricated.
- Brightest point is the pearl; one soft highlight per pearl; key light from the left; no hard flash or direct sun.
- Recognizable at 400 px wide.
