"""Light ambient bed for the CT-01 tour: soft pads, breathing air, sparse bells. Seamless 96 s loop."""
import numpy as np, wave, subprocess
SR, DUR = 44100, 96.0
N = int(SR * DUR); t = np.arange(N) / SR
rng = np.random.default_rng(7)
def ss(a, b, x):
    k = np.clip((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
# 8 chords x 12 s, open voicings in D major
CH = [[50, 57, 64, 66, 69], [47, 54, 62, 66, 71], [43, 50, 59, 62, 66], [45, 52, 57, 61, 64],
      [50, 57, 62, 64, 69], [42, 49, 57, 61, 66], [43, 50, 55, 59, 64], [45, 52, 59, 61, 64]]
L = np.zeros(N); R = np.zeros(N); seg = DUR / len(CH)
for i, ch in enumerate(CH):
    st = i * seg
    # circular crossfade window so the loop point is seamless
    tt = (t - st) % DUR
    w = ss(0, 3.5, tt) * (1 - ss(seg - .5, seg + 3.5, tt))
    for j, m in enumerate(ch):
        f = hz(m); amp = .06 / (1 + .35 * j)
        lfo = .8 + .2 * np.sin(2 * np.pi * (.05 + .013 * j) * t + j * 1.7)
        v = amp * lfo * w * (np.sin(2 * np.pi * f * t) + .12 * np.sin(4 * np.pi * f * t + .3))
        pan = (j / (len(ch) - 1)) * 1.2 - .6
        L += v * (1 - pan) / 2 * 1.4; R += v * (1 + pan) / 2 * 1.4
# breathing air: low-passed noise, slow swell
n = rng.normal(size=N); F = np.fft.rfft(n); fr = np.fft.rfftfreq(N, 1 / SR)
F *= np.exp(-(fr / 650) ** 2) * (fr > 40)
air = np.fft.irfft(F, N); air /= np.abs(air).max()
air *= .018 * (.6 + .4 * np.sin(2 * np.pi * t / 24))
L += air; R += np.roll(air, 2200)
# sparse glass bells, one every 12 s on the 3rd/4th chord tone, an octave up
for i, ch in enumerate(CH):
    at = i * seg + 4 + rng.random() * 4
    f = hz(ch[3] + 12)
    d = (t - at) % DUR
    env = np.where(d < 6, (1 - np.exp(-d / .01)) * np.exp(-d / 1.6), 0)
    b = .02 * env * (np.sin(2 * np.pi * f * d) + .3 * np.sin(2 * np.pi * 2.01 * f * d))
    p = rng.random() - .5
    L += b * (1 - p); R += b * (1 + p)
# reverb: circular convolution with a decaying noise impulse (keeps the loop seamless)
def verb(x, seed):
    irn = int(SR * 3.5); ir = np.random.default_rng(seed).normal(size=irn) * np.exp(-np.arange(irn) / (SR * .9))
    pad = np.zeros(N); pad[:irn] = ir
    return np.fft.irfft(np.fft.rfft(x) * np.fft.rfft(pad), N)
wl, wr = verb(L, 1), verb(R, 2)
L = .55 * L + .45 * wl / np.abs(wl).max() * np.abs(L).max()
R = .55 * R + .45 * wr / np.abs(wr).max() * np.abs(R).max()
st = np.stack([L, R], 1); st = st / np.abs(st).max() * .5
import os; os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
with wave.open('music_bed.wav', 'w') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes())
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', 'music_bed.wav', '-c:a', 'libmp3lame', '-b:a', '128k', 'watch/music_bed.mp3'], check=True)
print('ok')
