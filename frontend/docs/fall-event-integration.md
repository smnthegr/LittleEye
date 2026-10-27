# Automatic fall event recordings

The Events screen is prepared for system-created incidents. Users do not create
these cards manually. The detector and backend are not connected yet; the
frontend does not detect falls, trim video, or persist incident history.

## Expected system flow

1. The detector confirms a fall. The live integration can call the existing
   `useFallAlert().showFallAlert()` immediately; do not wait for video processing.
2. The recording service retains footage before and after the detection and
   produces an actual trimmed media file. Ten seconds before and twenty seconds
   after is the current suggested highlight window; use the footage available
   when a recording starts or ends near the detection.
3. After the clip is ready, the backend stores the incident and delivers a
   `FallEventRecording` to the signed-in user's integration adapter.
4. That adapter calls `useAppSession().recordFallEvent(record)`. History updates
   automatically and shows **Fall Detected**, the Philippine detection date/time,
   the supplied thumbnail, and a play button. Repeated IDs update the same card.
5. On initial load/reconnect, fetch saved incidents and pass the complete result
   to `replaceFallEvents(records)`. Loading history does not raise fall alerts.

The realtime subscription and fetch belong in an authenticated adapter mounted
under `AppSessionProvider` and `FallAlertProvider`, not in the History screen.
Unsubscribe and cancel pending fetches when that account session ends. The session
also rejects writes from callbacks captured by a previous signed-in session.
The backend remains responsible for authentication, incident ownership, durable
storage, fetching history, and any media URL renewal. No endpoint is invented here.

## Ready-clip payload

The typed contract and validation live in
[`src/utils/fall-event-recording.ts`](../src/utils/fall-event-recording.ts):

```ts
const record: FallEventRecording = {
  id: 'incident-from-backend',
  detectedAt: '2026-10-22T14:35:00+08:00',
  clip: {
    uri: 'https://your-media-service/incident-clip.mp4',
    durationSeconds: 30,
    fallOffsetSeconds: 10,
  },
  thumbnailUri: 'https://your-media-service/incident-thumbnail.jpg', // optional
};

// From the active signed-in integration adapter:
recordFallEvent(record);       // one ready incident or updated media URL
replaceFallEvents(records);   // complete fetched history
```

`detectedAt` must include `Z` or a timezone offset. The UI converts it to
`Asia/Manila` independently of the phone's timezone. `durationSeconds` is the
actual file duration, between one second and 24 hours. `fallOffsetSeconds` is
the detection's position **inside that file**, starting at zero and strictly
less than its duration. Supply the actual available pre-roll, not always `10`.
Invalid payloads throw before changing history; the adapter should report and
handle failed fetches/messages using its normal error handling.

For the example, the card shows **14:35:00**, but playback opens at **0:10** in
the thirty-second clip. The timeline uses elapsed clip time, places its red
marker at ten seconds, and limits seeking/playback to the supplied clip. The
viewer explicitly labels its elapsed clock **Clip**. This also works for clips
spanning midnight: the detection date stays correct and footage is not cut off
at a day boundary. A URL to the original full-day recording is not a trimmed
clip; trimming must happen in the recording/backend pipeline.

## Current limitations

The temporary event preview has been removed. Events displays only real session
history and shows its empty state until the backend supplies incidents.

History is currently in memory and clears on sign-out/deletion. Persistence,
automatic fetch/subscription, detection and video processing require the backend
adapter above. The older `clipStartSeconds`/`clipEndSeconds` fields remain for
full-day footage highlights; new trimmed event files use `trimmedClip` via the
ready-clip adapter instead.
