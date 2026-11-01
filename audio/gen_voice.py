"""用 MiniMax 为讲解生成配音（参数与 38-billion-years-video 的 src/series.py 一致）。

在 GitHub Actions 里自动运行（见 .github/workflows/voice.yml），也可以本地运行：
  python3 audio/gen_voice.py [文案.json] [输出目录]
  export MINIMAX_API_KEY=...
  export MINIMAX_URL=https://api.minimaxi.com/v1/t2a_v2   # 国内账号（默认）；海外账号用 https://api.minimax.io/v1/t2a_v2
  python3 audio/gen_voice.py
输出到 narration/<id>.mp3，并在 narration/manifest.json 里记下每段文案的指纹：
文案没变的段落不会重复生成；改了哪段，只重新生成哪段。
"""
import hashlib, json, os, shutil, subprocess, sys, time, urllib.request
KEY = os.environ.get('MINIMAX_API_KEY') or sys.exit('缺少 MINIMAX_API_KEY')
URL = os.environ.get('MINIMAX_URL') or 'https://api.minimaxi.com/v1/t2a_v2'
VOICE = os.environ.get('MINIMAX_VOICE') or 'Chinese (Mandarin)_Gentleman'
MODEL = os.environ.get('MINIMAX_MODEL') or 'speech-2.6-hd'
SPEED = float(os.environ.get('MINIMAX_SPEED') or '1.0')
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
# 可选参数：文案 json 和输出目录（默认是手表的 watch/audio/narration.json → watch/narration/）
src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, 'watch', 'audio', 'narration.json')
out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(root, 'watch', 'narration')
lines = json.load(open(src, encoding='utf-8'))
os.makedirs(out, exist_ok=True)
mpath = os.path.join(out, 'manifest.json')
manifest = json.load(open(mpath, encoding='utf-8')) if os.path.exists(mpath) else {}
ffmpeg = shutil.which('ffmpeg')

def tts(text):
    body = {'model': MODEL, 'text': text, 'stream': False, 'language_boost': 'Chinese', 'output_format': 'hex',
            'voice_setting': {'voice_id': VOICE, 'speed': SPEED, 'vol': 1, 'pitch': 0},
            'audio_setting': {'sample_rate': 44100, 'bitrate': 128000, 'format': 'mp3', 'channel': 1}}
    req = urllib.request.Request(URL, data=json.dumps(body).encode(), method='POST',
                                 headers={'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json'})
    for attempt in range(4):
        try:
            r = json.loads(urllib.request.urlopen(req, timeout=90).read())
            if r.get('base_resp', {}).get('status_code') == 0 and (r.get('data') or {}).get('audio'):
                return bytes.fromhex(r['data']['audio'])
            raise RuntimeError(r.get('base_resp'))
        except Exception as ex:
            if attempt == 3: raise
            print('  重试：', ex, flush=True); time.sleep(2 + 3 * attempt)

made = 0
for k, text in lines.items():
    fp = hashlib.sha1(f'{MODEL}|{VOICE}|{SPEED}|{text}'.encode()).hexdigest()[:16]
    dst = os.path.join(out, f'{k}.mp3')
    if manifest.get(k) == fp and os.path.exists(dst):
        continue
    print('生成', k, text[:20] + '…', flush=True)
    raw = tts(text)
    if ffmpeg:  # 去掉首尾静音
        tmp = dst + '.raw.mp3'; open(tmp, 'wb').write(raw)
        subprocess.run([ffmpeg, '-y', '-v', 'error', '-i', tmp, '-af',
                        'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse',
                        '-c:a', 'libmp3lame', '-b:a', '96k', dst], check=True)
        os.remove(tmp)
    else:
        open(dst, 'wb').write(raw)
    manifest[k] = fp; made += 1
for k in list(manifest):           # 文案里删掉的段落，音频也一并删掉
    if k not in lines:
        manifest.pop(k); p = os.path.join(out, f'{k}.mp3')
        if os.path.exists(p): os.remove(p)
json.dump(manifest, open(mpath, 'w', encoding='utf-8'), ensure_ascii=False, indent=1, sort_keys=True)
print(f'完成：新生成 {made} 段，共 {len(manifest)} 段')
