# Camera control bubble

The active control uses `CameraDirectionSurface`, following the latest pale-blue
glass D-pad reference: a light circular glass disc, four raised pill-shaped keys,
filled white triangular arrows, and a blue center pause button with an illuminated
rim. The SVG traces the reference's proportions, curved key silhouettes, layered
reflections, and soft shadows. The disc uses a 10–18% blue-tinted fill with a
soft refractive edge, letting the page show through. The keys use deeper blue
tints at 46–68% opacity and restrained white highlights, keeping their bubble
glass appearance without washing out the arrows. The center is also translucent,
with a stronger blue tint for contrast. It replaces the previous navy disc design.
`CameraDirectionPad` aligns five accessible touch targets to the artwork. The
arrows retain camera-preview movement. The center pauses/resumes available camera
footage and displays a play icon while paused; it stays disabled with the reference
pause icon when no footage is available. Press feedback is confined to each key
and fades over 160 ms, with immediate feedback under reduced motion.

The original `assets/images/home-dpad-glass.png` and previous generated bubble
remain available as older visual variants.

## Previous water-bubble variant

The previous variant used `assets/images/home-dpad-bubble.png`, created with the
built-in imagegen tool from the user's pale-blue water-bubble reference. The
checkerboard in the reference is not part of the artwork. The PNG has actual
transparent pixels outside the bubble.

The retained `CameraBubbleSurface` component clips the texture to the same circle as the directional tap
lights and applies a radial transparency mask. The center stays faintly luminous;
the watery rim carries more of the texture. The four arrows and full-side tap
feedback remain separate interactive layers.

## Generation prompt

Use case: stylized-concept. Create one production-ready transparent PNG asset for
the circular camera direction control in a mobile app. The most recent attached
image is a STYLE REFERENCE ONLY: match its pale icy-blue water bubble, layered
watery rim refractions, soft realistic glossy highlights, airy translucency, and
rounded dimensional appearance. Generate only the bubble surface: absolutely no
arrows, buttons, eyes, mascot, text, symbols, center button, or extra objects.
Maintain a geometrically circular silhouette, straight-on orthographic view,
perfectly centered in a square canvas, bubble diameter about 95% of canvas width
and height so it has only 2.5% transparent padding on each side. Outside the bubble
must be genuinely transparent alpha, with NO checkerboard pattern, background
color, scenery, pedestal, or broad outside glow. The bubble should have delicate
softly layered pale-blue refractive texture around its rim like the reference,
not a crisp solid outline and not a metallic or plastic puck. Keep the body
lighter and lower-opacity than the reference: airy, clear, translucent water.
Add a very soft light blue-white luminescence filling the central interior, a
gentle low-opacity pearly glow, so it looks softly full rather than an empty ring
or punched-out hole. The central glow should merge smoothly into the watery rim.
Preserve a totally blank center with no markings. Avoid an opaque white disk,
dark saturated blue, opaque broad rim, harsh borders, solid outlines, and anything
checkerboard. High-resolution photorealistic 3D water/glass material, clean
premium UI asset.

## Refinement prompt

Refine this generated water-bubble UI asset. Preserve its circular shape, pale
icy-blue color, detailed layered watery rim, realistic soft glossy reflections,
and completely blank center. Make only these refinements: (1) remove all stray
white flecks, splashes, specks, and artifacts outside the smooth circular
silhouette; the surrounding canvas must be clean genuinely transparent alpha,
never a checkerboard pattern; (2) make the inner 65 percent of the bubble much
more transparent, with only a faint pearly blue-white central glow (roughly
20-30 percent opacity) that blends gradually into the rim. It should look softly
illuminated, not hollow, but must not be an opaque white disk. Keep the rim
delicate and translucent rather than heavy or saturated. Center the bubble
precisely, straight-on, with the circle occupying 95 percent of the square canvas
and only 2.5 percent empty transparent padding per side. No text, arrows, buttons,
mascot, eyes, symbols, shadow, or background. Retain the high-quality water/glass
texture.

The generated texture's center was still too opaque and some outside flecks
remained, so the component's mask handles those visual constraints at render time.
The source PNG is preserved without bitmap post-processing.
