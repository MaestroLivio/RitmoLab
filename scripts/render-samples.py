"""Prepare local MP3 excerpts from Debian's MIT-licensed FluidR3 GM bank.

Usage: python3 scripts/render-samples.py /path/to/FluidR3_GM.sf2
Requires FluidSynth and FFmpeg; not needed for ordinary builds.
"""
import struct
import subprocess
import sys
import tempfile
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "public" / "samples"
PERCUSSION = {
    "clap": 39, "chest": 64, "thighs": 37, "feet": 36, "snap": 70,
    "claves": 75, "tambourine": 54, "triangle": 81, "cymbals": 49,
    "tick": 77, "accent": 76, "kick": 35, "hat": 42,
}
MELODIC = {
    "xylophone": (13, [55, 60, 64, 67, 72, 77]),
    "glockenspiel": (9, [55, 60, 64, 67, 72, 77]),
    "flute": (74, [55, 60, 64, 67, 72, 77]),
    "piano": (0, [48, 55, 60, 67, 72]),
    "bass": (32, [43, 48, 55]),
}


def vlq(value):
    result = [value & 127]
    while value > 127:
        value >>= 7
        result.insert(0, (value & 127) | 128)
    return bytes(result)


def render(bank, directory, name, key, program=None):
    channel = 9 if program is None else 0
    midi = directory / "note.mid"
    wav = directory / "note.wav"
    track = b"" if program is None else bytes([0, 0xC0, program])
    track += bytes([0, 0x90 | channel, key, 100])
    track += vlq(3840) + bytes([0x80 | channel, key, 0, 0, 0xFF, 0x2F, 0])
    midi.write_bytes(b"MThd" + struct.pack(">IHHH", 6, 0, 1, 480)
                     + b"MTrk" + struct.pack(">I", len(track)) + track)
    subprocess.run(["fluidsynth", "-ni", "-q", "-R", "0", "-C", "0", "-g", "1",
                    "-F", wav, "-r", "44100", bank, midi], check=True)
    trim = "silenceremove=start_periods=1:start_threshold=-49dB"
    # Truncate long trailing silence without normalizing away musical dynamics.
    length = 3.8 if program is not None else 2.2 if name in ("triangle", "cymbals") else 0.65
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", wav, "-af", trim,
                    "-t", str(length), "-codec:a", "libmp3lame", "-q:a", "4",
                    OUT / f"{name}.mp3"], check=True)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        for name, key in PERCUSSION.items():
            render(sys.argv[1], Path(tmp), name, key)
        for name, (program, keys) in MELODIC.items():
            for key in keys:
                render(sys.argv[1], Path(tmp), f"{name}-{key}", key, program)
