# Home ambient background

The latest refinement follows only the supplied reference's lower background and upper color transition. It replaces the experimental diagonal gradient and scattered highlights with the reference's darker blue transition, pale frosted-blue controls environment, brighter left side, and deeper right edge.

`src/components/home-ambient-background.tsx` contains the treatment:

- The lower base progresses from `#2A517F` through `#355D8A`, `#527FAB`, `#709CC9`, and `#8FB3D9` to `#84B2DE`.
- A broad `#C2D7F3` radial highlight brightens the lower-left; a muted `#2E5B8B` radial field gives the right edge depth.
- The restored S-shaped upper surface keeps its original geometry and darkest `#2A517F` top. Its gradient progressively becomes translucent near the curved edge, letting the lower blue lighting show through for a softer color transition.
- The upper blob remains `#94B0D5` at 27% opacity. A restrained `#C8DDF4` light remains centered behind the D-pad.

The camera, D-pad, side controls, navigation, press feedback, and layout were not modified in this refinement. No dependencies, animation loops, or blur filters were added. Decorative SVGs ignore pointer events. Gradient placement continues to follow the measured controls frame and scroll canvas.

TypeScript and Expo lint pass. The production background components were rendered with `node scripts/render-home-ambient.cjs` at 360 x 640, 390 x 844, 430 x 932, and 844 x 390. Portrait component studies were visually compared with the supplied reference for color distribution and transition softness. These are background studies, not full app screenshots; they do not verify native rendering, runtime controls, safe areas, or full-screen layout. No pixel-perfect claim is made against the small 228 x 423 reference.
