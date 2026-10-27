# Minimal Ring D-pad

Implemented in the existing Expo 57 / React Native / TypeScript frontend. All movement remains a frontend preview operation. No camera protocols, streaming, or backend commands were added.

## Appearance and reference comparison

The chat reference is 347 × 345 pixels, including its caption. The component uses a 300 × 300 coordinate frame corresponding to approximately x=28..328, y=0..300 in that image. These coordinates are estimated from the displayed image: the original bitmap was not provided as a readable local attachment, so there is no image-processing measurement or source pixel-difference result.

| Detail | Reference estimate | Implementation |
| --- | --- | --- |
| Center in original image | (178,150) | (150,150) in the cropped frame |
| Perimeter ring | 284 × 272, fine white outline | Same dimensions; 0.8-unit outline; no filled disc |
| Side markers | (36,150), (320,150), radius 4 | (8,150), (292,150), radius 4 |
| Corner points | (83,55), (273,55), (83,245), (273,245) | Same positions after x crop |
| Top segment | Approximately x=117..239, y=28..108 | Custom cubic outline; other segments rotate this shape |
| Center circle | Diameter about 70 | Diameter 64; reduced independently at user request |
| Arrows and center icon | Open chevrons; curved four-point sparkle | Preserved; no playback icon |
| Glass colors | Blue/lavender | Colorful sky-blue left, cooler-blue right; lighter frosted top and bottom with distinct shades |
| Button sizing | Reference scale | Directional segments enlarged 8%; smaller center; Home footprint increased about 5% |
| Glow and tapping | Subtle still lighting | Requested blurred blue pulse; brighter held glass and release bloom |

The outer light scales from 0.98 to 1.085 while its opacity rises from 0.24 to 0.50. The underlying glow was reduced separately from the ripple; press-bloom opacity peaks at 0.35. The outward/inward cycle takes 3.6 seconds. Button bloom lights immediately and fades over 380 ms. Pressing a directional button compresses it to 95% and lowers it one point over 45 ms; releasing it springs back. A blue ripple expands for 650 ms with a quadratic ease-out and finishes even after a quick release. Ripple and tap bloom are clipped to the exact organic button shape; the ambient glow remains outside. Accepted taps trigger animation listeners directly instead of waiting for a React render. Each new tap immediately restarts the ripple from a visible phase and interrupts an unfinished spring return. Even a press-and-release shorter than a frame gets a brief visible dip; animations do not build up in a queue. The ring and hit targets remain stationary throughout. The center is decorative and never presses, ripples, focuses, or invokes an action. Reduced-motion settings disable the pulse, ripple and press movement while retaining immediate glass brightness feedback. Backgrounding or disabling the control stops the ambient loop.

The glow uses soft sky-blue tones and an 11-unit ambient blur, preserving a visible but light halo at 24–50% opacity. Soft blue shadows under the five shapes add definition without darkening all the glass. The left and right are intentionally more colorful than the top and bottom; all four use different palettes.

The tap ripple uses a broad 8-unit blue band with a 3.5-unit Gaussian blur. Blur is applied before the exact-shape clip, so the wave stays soft while remaining inside the button. Its duration remains 650 ms. Peak opacity is 0.36, fading through 0.16 to zero; fill opacity is 0.10. These shared values keep runtime and static previews consistent. The twelve-frame raster clipping check also passes with this blur enabled.

Native SVG gradient offsets use numeric values such as `offset={0.42}`. Shorthand strings such as `offset=".42"` are rejected by the installed native gradient parser and fall back to zero, producing repeated warnings and incorrect gradients. The same shorthand was normalized in the older camera surface components. `tests/svg-gradient-native.test.mjs` reproduces the original failure and checks all component gradient stops against the installed native parser without warnings or fallback.

## Interactive coordinate map

Coordinates below are conservative visual bounds in the 300-unit frame. Only the four directions have accessibility focus bounds, at least 48 layout points in each dimension. Physical touches use the actual cubic outlines plus 14 layout points of padding. Shared gap space is assigned to the nearest shape, so the targets never conflict. The center circle and nearby gap reserved for it are inactive; taps there are never redirected to a direction. Padding stays the same physical size as the component scales. On compact screens, the generous direction targets can also include the adjacent perimeter marker; that marker has no separate action. The path and inverse scaling share the same geometry definitions.

| Control | Left | Top | Width | Height |
| --- | ---: | ---: | ---: | ---: |
| Up | 84.12 | 24.96 | 131.76 | 86.40 |
| Right | 188.64 | 84.12 | 86.40 | 131.76 |
| Down | 84.12 | 188.64 | 131.76 | 86.40 |
| Left | 24.96 | 84.12 | 86.40 | 131.76 |
| Center | 118.00 | 118.00 | 64.00 | 64.00 |

The Home adapter uses a 246-point design footprint, approximately 5% larger than the previous 234 points, and scales using the app's existing responsive metrics. At 320-point screen width it occupies 201.85 points; at the 480-point canvas cap it occupies 302.77 points. The smaller center remains about 11% smaller on screen after accounting for the overall enlargement. Its existing placement between the audio and zoom controls is preserved, along with generous touch padding.

## API and behavior

`MinimalRingDPad` accepts `size`, `onDirectionStart`, `onDirectionStop`, `disabled`, and `style`. Directions are `up`, `right`, `down`, `left`. The former center callback and accessibility label were removed at user request. A start callback stays active throughout a hold, with one matching stop on release, cancellation, dragging outside the retention area, app interruption, disable, resize, or unmount. Holds tolerate 24 layout points of finger drift into gaps; entering another button's visible shape or the decorative center stops the original movement. A held button retains responder ownership against incidental page scrolling, while OS cancellations still stop it. Additional fingers cannot replace or release the owner. To switch directions, release and press again. Screen-reader activation and keyboard Space/Enter are supported for directions only. Visual spring/ripple animation never delays movement start or stop.

`CameraDirectionPad` adapts these events to the existing preview pan. It moves once on press, repeats small preview movements every 60 ms while held, and clears the timer on stop or navigation blur. The sparkle has no action. Movement becomes visible when the preview is zoomed beyond 1× and footage is available; the actual camera is never moved.

## Assets, dependencies, and validation

The app uses its existing `react-native-svg`, React Native Animated, and Reanimated dependencies. No app package or lockfile changes are required. Glass is rendered with genuine alpha, gradients, reflective edges, and blurred light layers. There is no opaque reference-image rectangle.

Preview artifacts are in [validation/minimal-ring/preview.html](validation/minimal-ring/preview.html). The HTML displays reference-scale, transparent, dark-background, pressed, pulse-peak, and responsive-size states. [blue-preview.png](validation/minimal-ring/blue-preview.png) is the light-background reconstruction; [pressed-up.png](validation/minimal-ring/pressed-up.png) and [pulse-peak.png](validation/minimal-ring/pulse-peak.png) show effect states.

`node scripts/render-minimal-ring.cjs` renders the actual artwork components through the installed SVG library's web renderer. PNG generation uses an optional, temporary QA renderer installed with:

```powershell
npm.cmd install --prefix .tmp/dpad-validation --no-save --package-lock=false @resvg/resvg-js
node scripts/render-minimal-ring.cjs
```

The temporary renderer is outside app dependencies. SVG/HTML output can be regenerated without it.

TypeScript, Expo lint and production web export pass. Validation includes sixteen D-pad geometry/interaction tests, plus a pixel check of twelve rendered ripple frames across the four directions. The pixel check permits one pixel for antialiasing at the edge and rejects any visible ripple outside that boundary. The earlier full frontend suite (88 tests) passed before this revision. Static previews compose the same independently positioned button artwork used by the animated layers, including the held-button scale/offset and clipped ripple. Tests exercise directions, holds, stops, 100 consecutive taps in a single JS turn, animation listener cleanup, rapid direction switching, cancellation, rejected center presses, inactive center geometry, conflicting fingers, enlargement, near misses, padded target boundaries, larger-finger targets, finger drift, and coordinate alignment at sizes 192, 201.85, 234, 246, 300, 360, and 600. Runtime animation still needs device verification.

Limitations: no connected browser or mobile device was available for real gesture/rendering inspection. Android/iOS runtime rendering, screen-reader behavior, and animation smoothness need device verification. This is a vector frost simulation, not a live backdrop-blur material. The flattened source image cannot supply true scene-dependent refraction or blur; neither is claimed. Geometry and fine reflections remain a manual trace, not verified pixel equivalence. Blue color, added glow, stronger tapping, and enlarged buttons intentionally follow the later requests instead of matching the initial image exactly.

## Files

- `src/components/minimal-ring-dpad.tsx`: reusable interaction component.
- `src/components/minimal-ring-artwork.tsx`: curves, glass, chevrons, sparkle, ring, and dots.
- `src/components/minimal-ring-buttons.tsx`: independent press compression, spring return, and expanding tap ripples.
- `src/components/minimal-ring-button-ripple.tsx`: animated ripple radius and opacity.
- `src/components/minimal-ring-ripple-artwork.tsx`: exact-shape SVG ripple clipping and static validation frames.
- `src/components/minimal-ring-glow-artwork.tsx`: blurred blue light geometry.
- `src/components/minimal-ring-effects.tsx`: ambient pulse and button bloom.
- `src/utils/minimal-ring-geometry.ts`: shared render paths and shape-aware hit testing.
- `src/utils/dpad-interaction.ts`: single-owner gesture lifecycle.
- `src/utils/dpad-feedback.ts`: immediate press/release delivery to animation listeners, independent of React state batching.
- `src/components/camera-direction-pad.tsx`: replaced preview adapter.
- `src/app/home.tsx`: decorative-center integration and disabled state.
- `tests/minimal-ring-dpad.test.mjs`: geometry and interaction tests.
- `scripts/render-minimal-ring.cjs` and `docs/validation/minimal-ring/`: reproducible artwork previews.
- `docs/minimal-ring-dpad.md`: integration, comparison, and limitations.

Existing unrelated workspace changes and older D-pad assets/components were retained.
