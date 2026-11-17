# Generates one WAV per voiceover line with Piper (offline TTS) and writes
# their durations to public/audio/vo.json.
#   python3 scripts/vo.py <path-to-voice.onnx>
import json
import subprocess
import sys
import wave
from pathlib import Path

LINES = {
    "hook": "Matside, you get one free hand. And seconds.",
    "reveal": "Silicon Valley Judo. Competitor Analysis.",
    "roster": "Your whole roster. Who's on today, and which mat.",
    "athlete": "Tap in. Her focus, her techniques, and scouting on every opponent.",
    "capture": "Won by ippon? Log it before she's off the mat.",
    "assign": "Tournament day? Auto-assign coaches. Locks respected.",
    "print": "Print the coach card. Scan it. Cache it all for offline.",
    "privacy": "Private by design. First names, last initials. No photos.",
    "end": "Silicon Valley Judo. Built for the mat.",
}

voice = sys.argv[1]
out = Path(__file__).resolve().parent.parent / "public" / "audio"
out.mkdir(parents=True, exist_ok=True)
durations = {}
for key, text in LINES.items():
    wav = out / f"vo-{key}.wav"
    subprocess.run(
        [sys.executable, "-m", "piper", "-m", voice, "-f", str(wav),
         "--length-scale", "0.92", "--sentence-silence", "0.12"],
        input=text.encode(), check=True, capture_output=True,
    )
    with wave.open(str(wav)) as w:
        durations[key] = round(w.getnframes() / w.getframerate(), 3)
    print(f"{key:8s} {durations[key]:.2f}s  {text}")
(out / "vo.json").write_text(json.dumps(durations, indent=2))
