#!/usr/bin/env python3
"""Offline voiceover (espeak-ng) plus an original score and UI ticks."""

import json
import math
import os
import subprocess
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CUES = os.path.join(ROOT, "cues.json")
STEMS = os.path.join(ROOT, "public", "audio", "stems")
OUT = os.path.join(ROOT, "public", "audio", "mix.wav")
SR = 48000


def read_wav(path: str) -> np.ndarray:
    with wave.open(path, "rb") as wf:
        channels = wf.getnchannels()
        sw = wf.getsampwidth()
        rate = wf.getframerate()
        frames = wf.readframes(wf.getnframes())
    if sw != 2:
        raise SystemExit(f"expected 16-bit wav: {path}")
    data = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0
    if channels > 1:
        data = data.reshape(-1, channels).mean(axis=1)
    if rate != SR:
        dur = len(data) / rate
        n = int(dur * SR)
        src_x = np.linspace(0, 1, len(data), endpoint=False)
        dst_x = np.linspace(0, 1, n, endpoint=False)
        data = np.interp(dst_x, src_x, data).astype(np.float32)
    return data


def place(mix: np.ndarray, clip: np.ndarray, t: float, gain: float) -> None:
    start = int(t * SR)
    end = min(len(mix), start + len(clip))
    if start >= len(mix) or end <= start:
        return
    mix[start:end] += clip[: end - start] * gain


def env_click(n: int) -> np.ndarray:
    tt = np.arange(n) / SR
    return np.exp(-tt / 0.012).astype(np.float32)


def synth_click() -> np.ndarray:
    n = int(0.045 * SR)
    tt = np.arange(n) / SR
    tone = np.sin(2 * math.pi * 1800 * tt) * env_click(n)
    rng = np.random.default_rng(3)
    noise = rng.uniform(-1, 1, n).astype(np.float32) * env_click(n)
    return (0.65 * tone + 0.35 * noise).astype(np.float32)


def synth_whoosh() -> np.ndarray:
    n = int(0.32 * SR)
    tt = np.arange(n) / SR
    rng = np.random.default_rng(9)
    noise = rng.uniform(-1, 1, n).astype(np.float32)
    # One-pole lowpass sweeping down, a soft cloth move, not a trailer riser.
    out = np.zeros(n, dtype=np.float32)
    acc = 0.0
    for i in range(n):
        cutoff = 0.18 + 0.35 * (1 - i / n)
        acc += cutoff * (noise[i] - acc)
        out[i] = acc
    env = np.sin(np.linspace(0, math.pi, n)).astype(np.float32) ** 1.4
    return (out * env).astype(np.float32)


def synth_score(duration: float) -> np.ndarray:
    n = int(duration * SR)
    tt = np.arange(n) / SR
    mix = np.zeros(n, dtype=np.float32)
    bpm = 120.0
    beat = 60.0 / bpm
    # D minor pentatonic, low and short so it sits under speech.
    notes = [73.42, 87.31, 98.00, 110.00, 87.31]
    for i, start_t in enumerate(np.arange(0, duration, beat)):
        start = int(start_t * SR)
        if i % 2 == 0:
            length = int(0.16 * SR)
            local = np.arange(length) / SR
            kick = np.sin(2 * math.pi * 52 * local * np.exp(-local * 8)) * np.exp(-local / 0.09)
            # Build: quieter in the hook, present from the profile, gone on the end card.
            if start_t < 3.1:
                gain = 0.22
            elif start_t < 28.3:
                gain = 0.55
            else:
                gain = 0.0
            end = min(n, start + length)
            mix[start:end] += kick[: end - start].astype(np.float32) * gain
        if start_t >= 3.25 and start_t < 28.2 and i % 2 == 1:
            length = int(0.03 * SR)
            local = np.arange(length) / SR
            rng = np.random.default_rng(100 + i)
            hat = rng.uniform(-1, 1, length).astype(np.float32) * np.exp(-local / 0.01)
            end = min(n, start + length)
            mix[start:end] += hat[: end - start] * 0.08
        if i % 2 == 0 and start_t < 28.2:
            length = int(0.22 * SR)
            local = np.arange(length) / SR
            freq = notes[(i // 4) % len(notes)]
            bass = np.sin(2 * math.pi * freq * local) * np.exp(-local / 0.14)
            end = min(n, start + length)
            gain = 0.08 if start_t > 3.2 else 0.03
            mix[start:end] += bass[: end - start].astype(np.float32) * gain
    # End-card tone: a single low D, no drums.
    tail_t = np.arange(int(3.4 * SR)) / SR
    tail = np.sin(2 * math.pi * 73.42 * tail_t) * np.exp(-tail_t / 1.6)
    place(mix, tail.astype(np.float32), 28.5, 0.12)
    peak = np.max(np.abs(mix)) or 1
    return (mix / peak).astype(np.float32)


def main() -> None:
    os.makedirs(STEMS, exist_ok=True)
    cues = json.load(open(CUES))
    duration = float(cues["durationSec"])
    mix = np.zeros(int(duration * SR), dtype=np.float32)

    for index, line in enumerate(cues["voice"]):
        path = os.path.join(STEMS, f"vo-{index:02d}.wav")
        subprocess.check_call(
            [
                "espeak-ng",
                "-v",
                "en-us+m3",
                "-s",
                str(line.get("rate", 150)),
                "-p",
                "42",
                "-w",
                path,
                line["text"],
            ]
        )
        clip = read_wav(path)
        # Trim espeak's leading silence a touch so words hit the beat.
        nz = np.argmax(np.abs(clip) > 0.02)
        if nz > 0:
            clip = clip[max(0, nz - int(0.01 * SR)) :]
        place(mix, clip, float(line["t"]), 0.92)
        print(f"vo {line['t']:.2f}s {len(clip) / SR:.2f}s {line['text']}")

    click = synth_click()
    for t in cues["clicks"]:
        place(mix, click, float(t), 0.28)
    whoosh = synth_whoosh()
    for t in cues["whooshes"]:
        place(mix, whoosh, float(t) - 0.04, 0.18)

    score = synth_score(duration) * 0.16
    mix += score

    peak = float(np.max(np.abs(mix))) or 1.0
    mix *= 0.89 / peak
    pcm = np.clip(mix, -1, 1)
    with wave.open(OUT, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes((pcm * 32767).astype(np.int16).tobytes())
    print(f"wrote {OUT} peak {peak:.3f} dur {len(mix) / SR:.2f}s")


if __name__ == "__main__":
    main()
