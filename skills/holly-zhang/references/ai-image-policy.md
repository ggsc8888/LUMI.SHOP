# AI image policy (Photography Guide, Part 4)

Principle: **what we sell must be real; the mood around it may be generated.** A generated pearl is selling something that does not exist. AI's place is storyboarding before a shoot and backgrounds/mood after it.

| Use | Allowed? | Condition |
|---|---|---|
| Storyboard / pre-shoot preview | Yes, encouraged | Follow the grid and light rules; show the photographer. |
| Category tile backgrounds (sea & sand, horizon) | Yes | Generate the background plate only; composite the real product cut-out. |
| Scene surfaces and environments | Yes | Real product cut-out; redraw shadows in one consistent direction; run the release checks. |
| Brand mood / social / blog illustrations | Yes | No recognizable piece; never imply "shot at the gallery". |
| PDP product image of a real SKU | Only as a background-normalized version of the real photo | The jewelry pixels must stay the real photograph; never invent the piece. |
| Model wearing the piece (PDP) | No, for publication | Faces and hands look fake; the brand face must be a real person. Generated on-model images are concept previews only. |
| Certificates, macro, flaw disclosure | Never | This is the trust layer. |

## How Jewel Lister applies this

- Every generated image keeps the seller's real piece exactly as photographed: same pearl count, sizes, colors/overtone, metal, stones and findings. Only the scene changes.
- Label generated on-model, flat-lay and gift images as previews to verify. Recommend a real photo before using any on-model image as a product-page image.
- Release check for any AI image: Does pearl count and size match? Is the clasp plausible and unchanged? Is the circle even? Is the shadow direction consistent, with one light source? Is the background #EFEFEB (product) or a palette color (scene)? Is there at most one sea-green object? Is there no text, watermark, second earring or half finger? **Would a customer believe this is a real photo of the item? If it would mislead them, do not use it.**

## Prompt slots (write in English, with concrete numbers, in this order)

1. SUBJECT: the piece, pearl count, mm size, metal, overtone. Real numbers stop the model adding pearls.
2. COMPOSITION: aspect ratio, placement card position, clasp/main pearl o'clock, camera angle.
3. LIGHT: one source, direction, angle, ratio 1:2 or 1:3, shadow direction/length, one highlight per pearl.
4. COLOUR: background hex (#EFEFEB for product images), the one allowed sea-green (#9CCBC9) in scenes, "no teal behind the pearl, no blue cast".
5. CAMERA: product 100 mm f/11; scene 85 mm f/4; focus point.
6. MOOD: only brand words: quiet, assured, timeless, Pacific Northwest, overcast daylight, window light, linen, oat, walnut, sea glass.
7. AVOID: text, watermark, logo, glitter, sparkle, bokeh, HDR, golden hour, marble, extra beads or stones, flowers, studio reflections.
