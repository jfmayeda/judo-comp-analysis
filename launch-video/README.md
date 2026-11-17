# Launch video (Remotion)

A 38 s, 1920×1080, 30 fps H.264 launch film for Silicon Valley Judo — Competitor Analysis.
It lives apart from the app; the root `tsconfig.json` excludes this folder.

Final master: `out/judo-comp-launch.mp4`.

## How it is made

- **Screens are real.** `scripts/capture.mjs` drives the running app with the repo's own
  Supabase mock (`scripts/ui-smoke/*`, demo fixtures only) and saves 2×/3× screenshots plus element
  boxes (`public/shots/rects.json`) used for camera targets and clicks.
- **One timeline.** `src/timeline.json` holds section starts, voiceover starts and click times. The
  picture (`src/Film.tsx`) and the audio mix (`scripts/audio.py`) both read it.
- **Motion.** One window shape morphs through every scene (pill → login → browser → phone → … →
  end-card pill); content swaps with a short blur; closed-form springs (`src/motion.ts`).
- **Voiceover.** Piper TTS, voice `en_US-ryan-high`, generated offline by `scripts/vo.py`.
- **Music and SFX.** Original 120 BPM score and UI sounds synthesized with numpy in
  `scripts/audio.py`; no third-party samples. Music ducks under the voice.
- **Type and colour** come from the app: Archivo, Source Sans 3, Michroma and the `--svj-*` tokens.

## Rebuild

```bash
npm install
# real screens (app dev server running at :3000 with any NEXT_PUBLIC_SUPABASE_ANON_KEY)
node scripts/capture.mjs
# voiceover + mix (pip install piper-tts numpy; download en_US-ryan-high.onnx + .json)
python3 scripts/vo.py path/to/en_US-ryan-high.onnx
python3 scripts/audio.py
# preview / render
npx remotion studio
npx remotion render LaunchFilm out/judo-comp-launch.mp4 --codec=h264 --crf=17 --image-format=png --color-space=bt709
```
