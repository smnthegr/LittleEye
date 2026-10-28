# Frontend QA corrections — 28 October 2026

The seven confirmed findings from the initial frontend audit have code changes
and regression coverage. These changes preserve the existing layout, artwork,
colors and fonts and do not add a backend, detector, CCTV connection or recording
service.

| Finding | Correction | Regression evidence |
| --- | --- | --- |
| FE-001: contact loss with an empty profile | Contacts are owned by the shared session; saving creates blank profile fields when needed. | `form-validation.test.mjs`, `session-sign-out.test.mjs` |
| FE-002: duplicate Setup routes | Button and keyboard submission share a synchronous lock, reset when Sign Up regains focus. | `form-validation.test.mjs` |
| FE-003: History loading/error feedback | Portrait/fullscreen show loading or error states; unready playback is blocked; returning to the list and reopening retries the source. | `history-screen.test.mjs` |
| FE-004: impossible incident dates | Validate calendar components before parsing; keep valid leap days and explicit offsets. | `recorded-footage.test.mjs` |
| FE-005: rejected browser launches | Native attribution-link errors show a recoverable message without rejecting the press handler. | `external-link.test.mjs` |
| FE-006: blank sign-in passwords | Reject whitespace-only input while preserving nonblank credentials unchanged. | `form-validation.test.mjs` |
| FE-007: TypeScript gate | Scope compiler inputs to the application and generated route types; use current RN instance/event/theme types. Preserve the old dependency backup. | `npm run typecheck` |

Related frontend safeguards:

- An open incident resolves the latest same-ID clip metadata and closes when
  that incident is removed. A shorter replacement clip clamps the restored
  position and displayed clock.
- Contact calling is explicitly labeled as a preview with no call placed.
  Audio pauses on blur/background; preview and alert pulses honor reduced motion.
- Alerts belong to the current account session. Old show/dismiss callbacks cannot
  affect a new account. Existing navigator state remains mounted.
- Profile, photo, camera, contact and event writes from a previous account are
  rejected. Transient address-search caches clear when sessions change, including
  protection against late requests refilling an old cache.
- Stale handoff documentation now describes the implemented screens accurately.

## Verification

From `frontend`, run:

```sh
npm test
npm run typecheck
npm run lint
```

Tests exercise actual handlers, hooks and the installed navigation reducer with
explicit native mocks. They do not certify Android rendering, native decoder
behavior, OS permission flows, memory use or frame rates. Run the emulator
checklist in the original audit on a connected test device before native UI
acceptance. No live emergency calls are needed.

Validation after the corrections: 210 tests pass with no skipped cases;
TypeScript and lint pass without errors. Native visual/performance checks remain
pending because this session has no connected emulator or browser.

The audit's suspected large-list/image performance risks still require device
measurements. No visual redesign or speculative asset/list rewrite was made.
Future timestamp clock-skew policy, external route-parameter policy and integration
schema extensions remain product/integration decisions rather than invented
frontend behavior. Authentication, live streams, recording storage, detector
accuracy and notification delivery remain outside this frontend correction.
