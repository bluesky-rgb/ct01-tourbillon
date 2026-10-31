# CT-01 陀飞轮万年历

一块完全用代码造出来的 3D 机械表：双轴飞行陀飞轮、万年历、月相、自动上链摆陀，200 多个零件按真实齿比联动，表针显示此刻的真实时间。

整个页面就是一个 `index.html`（Three.js r128），没有构建步骤。

## 能做什么

- 外观 / 表盘 / 背面 / 陀飞轮特写 / 逐层拆开
- 定制：表壳（玫瑰金、铂金、黄金）× 表盘（银白、午夜蓝、黑曜石）× 表带（黑、干邑棕、海军蓝）
- 拧表冠调时间：拔出表冠、摆轮停摆，拖动拨时间，日历和月相跟着走
- 一键讲解：12 步，带配音和背景音乐，讲解中可自由拖动、暂停、跳步

## 目录

| 路径 | 说明 |
| --- | --- |
| `index.html` | 页面本体 |
| `music_bed.mp3` | 背景音乐：96 秒无缝循环的轻氛围音，由 `audio/make_bed.py` 合成 |
| `audio/narration.json` | 讲解配音文案（14 段，第 11 步分 a/b/c 三段） |
| `audio/gen_voice.py` | 调用 MiniMax 生成配音（`speech-2.6-hd`，音色 `Chinese (Mandarin)_Gentleman`） |
| `narration/` | 生成好的配音 `<id>.mp3` 和指纹 `manifest.json` |
| `.github/workflows/voice.yml` | 改了文案就自动重新生成配音 |

## 配音是怎么生成的

在仓库 Settings → Secrets and variables → Actions 里：

- Secret `MINIMAX_API_KEY`：必填
- Variable `MINIMAX_URL`：海外账号填 `https://api.minimax.io/v1/t2a_v2`，国内账号不用填
- 可选 Variable：`MINIMAX_VOICE`、`MINIMAX_MODEL`、`MINIMAX_SPEED`

之后只要修改 `audio/narration.json` 并推送，GitHub Actions 就会只重新生成改动过的段落，并把 mp3 提交回 `narration/`。也可以在 Actions 页面手动运行「生成 MiniMax 配音」。

页面只播放 `index.html` 里 `VO` 列表登记过的配音；没登记的段落会退回浏览器自带语音。

## 本地预览

```bash
python3 -m http.server 8000
# 打开 http://localhost:8000
```

（需要用本地服务器打开，直接双击 `index.html` 时浏览器会拦截音频文件的读取。）
