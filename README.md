# 🚌 公車快到了 — Bus Coming Alert

台北市 ／ 新北市 公車即時到站語音提醒，專為年長使用者設計。

## 使用網址
**https://eb-barry.github.io/Bus-coming-alert/**

## 功能特色
- 🔊 中文語音播報（系統 TTS，免安裝）
- 📍 GPS 自動定位最近站牌
- 🔔 可調整提前幾站提醒（2–7站）
- 🚌 同時監控最多 8 條路線
- ⭐ 常用路線收藏
- 📳 震動提醒
- 💡 螢幕常亮（WakeLock）
- 🔤 字體大小切換（標準／大／特大）
- 📲 PWA — 可加入主畫面背景執行
- 🏙️ 支援台北市 ＆ 新北市

## 申請 TDX API 金鑰
1. 前往 https://tdx.transportdata.tw
2. 免費註冊帳號
3. 建立應用程式，取得 **Client ID** 和 **Client Secret**
4. 在本應用程式的「設定」中輸入金鑰

## 部署到 GitHub Pages
1. 在 `eb-barry` GitHub 帳號下建立 repo：`Bus-coming-alert`
2. 將 `index.html`、`sw.js`、`manifest.json` 上傳至 `main` branch
3. 至 Settings → Pages → 選擇 `main` branch 根目錄
4. 等待 1–2 分鐘後即可訪問

## 技術架構
- 純 HTML + CSS + JavaScript（無框架相依）
- TDX 運輸資料流通服務 API（OAuth 2.0）
- Web Speech API（TTS 語音播報）
- Geolocation API（GPS 定位）
- Service Worker（背景執行 + 推播通知）
- WakeLock API（螢幕常亮）
- Vibration API（震動提醒）
- localStorage（API 金鑰與偏好設定儲存）

## 瀏覽器支援
| 功能 | Chrome | Edge | Safari iOS |
|------|--------|------|------------|
| 主要功能 | ✅ | ✅ | ✅ |
| 語音播報 | ✅ | ✅ | ✅ |
| GPS 定位 | ✅ | ✅ | ✅（需 HTTPS）|
| 螢幕常亮 | ✅ | ✅ | ❌（手動設定）|
| 背景推播 | ✅ | ✅ | ⚠️（需加入主畫面）|
| PWA 安裝 | ✅ | ✅ | ✅（加入主畫面）|

## 注意事項
- 本應用程式需要 **HTTPS** 才能使用 GPS 功能（GitHub Pages 預設提供 HTTPS）
- iOS Safari 需要使用者主動點擊後才能播放語音（首次開啟需點選「開始監控」）
- API 每 30 秒更新一次即時資料
- Token 自動刷新，有效期約 24 小時
