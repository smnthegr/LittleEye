# Adding first-aid videos

Assign each clip in `src/constants/first-aid-videos.ts`. There is one entry for
Mild, Moderate and Severe; leave an entry as `null` until that clip is ready.
The empty state and landscape/close controls already work without a clip.
The severity badge and X close button share the CCTV/Playback overlay styling.
Tap the video to hide the badge and buttons with the same fade/slide animation;
tap again to restore them. This works in portrait and landscape, including when
no clip is assigned. Entering or leaving landscape restores the controls.

For bundled files, create `assets/videos/first-aid/`, copy your MP4 files there,
and replace the matching entries with literal `require()` calls:

```ts
export const firstAidVideos: Record<Severity, VideoSource> = {
  Mild: require('../../assets/videos/first-aid/mild.mp4'),
  Moderate: require('../../assets/videos/first-aid/moderate.mp4'),
  Severe: require('../../assets/videos/first-aid/severe.mp4'),
};
```

Only add a `require()` after the file exists. Metro resolves these paths at build
time. H.264 video with AAC audio in an MP4 container is a practical mobile format.

For hosted clips, use a direct HTTPS media URL instead:

```ts
Mild: { uri: 'https://your-domain.example/videos/mild.mp4' },
```

Use the actual media file URL, rather than a YouTube or webpage link. The URL
must be reachable by the device; web playback also depends on the media host's
browser access configuration.

No screen changes are needed. Available clips have play/pause, tap-to-seek
and audio controls that hide with the badge, with the same player in portrait and landscape. Clips do
not autoplay or loop. Leaving the screen or backgrounding the app pauses video.

After assigning clips, check each severity on a device: play and seek, enter
landscape, use the X button, and confirm the position is preserved and portrait returns.
Also check a missing clip and an unreachable URL; written guidance stays
available. Rotation uses the existing fullscreen controller; web opens a
fullscreen app surface, with physical orientation controlled by the browser.
