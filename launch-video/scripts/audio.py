# Original score + UI sound design + voiceover mix, all synthesized here with numpy
# (no third-party samples). Reads src/timeline.json so sound lands on the picture's cues.
#   python3 scripts/audio.py   ->  public/audio/mix.wav
import json
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
TL = json.loads((ROOT / "src" / "timeline.json").read_text())
SR = 48000
DUR = TL["duration"]
N = int(SR * DUR)
BEAT = 60 / TL["bpm"]
BAR = BEAT * 4
rng = np.random.default_rng(7)


def t_arr(sec):
    return np.arange(int(sec * SR)) / SR


def place(buf, sig, at, gain=1.0):
    i = int(round(at * SR))
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    if i < 0:
        sig, i = sig[-i:], 0
        j = min(len(buf), len(sig))
    buf[i:j] += sig[: j - i] * gain


def onepole_lp(x, cutoff):
    cutoff = np.broadcast_to(cutoff, x.shape)
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for n in range(len(x)):
        acc = (1 - a[n]) * x[n] + a[n] * acc
        y[n] = acc
    return y


def hp(x, cutoff):
    return x - onepole_lp(x, cutoff)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# ---------- instruments ----------
def kick(gain=1.0):
    t = t_arr(0.45)
    f = 48 + 110 * np.exp(-t * 32)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 7.5)
    click = rng.standard_normal(len(t)) * np.exp(-t * 400) * 0.25
    return (body + click) * gain


def clap():
    t = t_arr(0.3)
    n = rng.standard_normal(len(t))
    env = np.zeros_like(t)
    for d in (0, 0.011, 0.022):
        env += np.where(t >= d, np.exp(-(t - d) * 60), 0)
    env += np.exp(-t * 14) * 0.35
    return hp(n * env, 900) * 0.55


def hat(open_=False):
    t = t_arr(0.18 if open_ else 0.05)
    n = rng.standard_normal(len(t))
    return hp(hp(n, 7000), 7000) * np.exp(-t * (18 if open_ else 90)) * 0.22


def saw(freq, t):
    return 2 * ((freq * t) % 1.0) - 1


def pad_chord(notes, sec, bright):
    t = t_arr(sec)
    s = np.zeros_like(t)
    for m in notes:
        for det in (-0.12, 0.0, 0.12):
            s += saw(midi(m + det / 1.0), t)
    s /= len(notes) * 3
    env = np.minimum(1, t / 0.08) * np.minimum(1, (sec - t) / 0.25)
    return onepole_lp(s * env, bright) * 0.5


def bass_note(m, sec):
    t = t_arr(sec)
    f = midi(m)
    s = np.sin(2 * np.pi * f * t) + 0.35 * onepole_lp(saw(f, t), 400)
    env = np.minimum(1, t / 0.004) * np.exp(-t * 3.2) * np.minimum(1, (sec - t) / 0.02)
    return s * env * 0.55


def riser(sec):
    t = t_arr(sec)
    n = rng.standard_normal(len(t))
    cut = 300 + (t / sec) ** 2 * 9000
    s = onepole_lp(n, cut) - onepole_lp(n, cut * 0.4)
    return s * (t / sec) ** 2.2 * 0.5


def impact():
    t = t_arr(2.5)
    f = 38 + 60 * np.exp(-t * 9)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    noise = onepole_lp(rng.standard_normal(len(t)), 1800) * np.exp(-t * 5) * 0.5
    return (boom + noise) * 0.9


# ---------- score ----------
music = np.zeros(N)
S = TL["sections"]
DROP, BREAK, FINAL = S["reveal"], S["privacy"], S["end"]
# A minor: Am  F  C  G   (root midi for bass, triad for pad)
PROG = [(45, [57, 60, 64]), (41, [57, 60, 65]), (48, [55, 60, 64]), (43, [55, 59, 62])]

bars = int(np.ceil(DUR / BAR))
for b in range(bars):
    t0 = b * BAR
    root, triad = PROG[b % 4]
    if t0 < DROP:
        bright = 500 + 900 * (t0 / DROP)
    elif t0 >= FINAL:
        bright = 2600
    elif t0 >= BREAK:
        bright = 900
    else:
        bright = 2200
    if t0 < FINAL + BAR:
        place(music, pad_chord(triad, BAR, bright), t0, 0.8 if t0 >= DROP else 0.6)

# final chord rings out
place(music, pad_chord([57, 60, 64, 69], DUR - FINAL, 2600) * np.linspace(1, 0, int((DUR - FINAL) * SR)), FINAL, 1.0)

step = BEAT / 2
for k in range(int(DUR / step)):
    t0 = k * step
    beat_i = k // 2
    off = k % 2 == 1
    in_groove = DROP <= t0 < BREAK
    in_break = BREAK <= t0 < FINAL
    if in_groove:
        if not off:
            place(music, kick(), t0, 0.95)
            if beat_i % 2 == 1:
                place(music, clap(), t0, 0.9)
        place(music, hat(open_=off), t0, 0.9 if off else 0.6)
        if t0 >= S["print"] and t0 < BREAK:
            place(music, hat(), t0 + step / 2, 0.45)
        root = PROG[int(t0 // BAR) % 4][0]
        place(music, bass_note(root + (12 if off and beat_i % 4 == 3 else 0), step * 0.95), t0, 0.9)
    elif in_break:
        if not off and beat_i % 4 == 0:
            place(music, kick(0.7), t0)
        if off:
            place(music, hat(), t0, 0.35)
    elif t0 < DROP and t0 >= BAR:
        place(music, hat(open_=off), t0, 0.35 if off else 0.2)

# builds: risers and snare rolls into the drop and into the final card
for target, length in ((DROP, 2.0), (FINAL, 2.0)):
    place(music, riser(length), target - length, 0.8)
    t = target - length
    while t < target - 0.02:
        frac = (t - (target - length)) / length
        place(music, clap(), t, 0.15 + 0.45 * frac)
        t += BEAT / (2 if frac < 0.5 else 4 if frac < 0.8 else 8)
place(music, impact(), DROP, 0.8)
place(music, kick(1.1), DROP)
place(music, impact(), FINAL, 1.0)
place(music, kick(1.2), FINAL)

# ---------- UI sound design ----------
sfx = np.zeros(N)


def tap():
    t = t_arr(0.12)
    tone = np.sin(2 * np.pi * 1850 * t) * np.exp(-t * 70)
    body = np.sin(2 * np.pi * 420 * t) * np.exp(-t * 45) * 0.6
    tick = hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 600) * 0.6
    return (tone * 0.35 + body + tick) * 0.5


def whoosh(sec=0.5):
    t = t_arr(sec)
    n = rng.standard_normal(len(t))
    shape = np.sin(np.pi * t / sec) ** 2
    cut = 400 + 3800 * np.sin(np.pi * t / sec)
    s = onepole_lp(n, cut) - onepole_lp(n, cut * 0.35)
    return s * shape * 0.35


for name, at in TL["taps"].items():
    place(sfx, tap(), at - 0.004, 1.0)
for at in TL["whoosh"]:
    w = whoosh(0.5)
    place(sfx, w, at - 0.32, 0.9 if at not in (DROP, FINAL) else 0.5)

# ---------- voiceover ----------
def read_wav(path):
    with wave.open(str(path)) as w:
        sr = w.getframerate()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
    if sr != SR:
        xi = np.arange(0, len(x), sr / SR)
        x = np.interp(xi, np.arange(len(x)), x)
    return x


vo = np.zeros(N)
for key, at in TL["vo"].items():
    v = read_wav(ROOT / "public" / "audio" / f"vo-{key}.wav")
    v = v / (np.max(np.abs(v)) + 1e-9) * 0.9
    place(vo, v, at)

# duck music under voice (smoothed envelope, ~-8 dB)
env = onepole_lp(np.abs(vo), 6.0)
env = np.minimum(1, env / (np.max(env) * 0.25 + 1e-9))
duck = 1 - 0.6 * env

mix = music * 0.42 * duck + sfx * 0.55 + vo * 0.95

speaking = env > 0.5
rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x[speaking] ** 2)) + 1e-12)
print(f"while speaking: voice {rms(vo * 0.95):.1f} dBFS, music bed {rms(music * 0.42 * duck):.1f} dBFS")
fade = np.ones(N)
fl = int(1.2 * SR)
fade[-fl:] = np.linspace(1, 0, fl)
mix *= fade
mix *= 0.93 / np.max(np.abs(mix))

out = ROOT / "public" / "audio" / "mix.wav"
stereo = np.repeat((mix * 32767).astype(np.int16)[:, None], 2, axis=1)
with wave.open(str(out), "w") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(stereo.tobytes())
print("wrote", out, f"{DUR}s")
