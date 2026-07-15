# PROJECT STATUS

## 專案名稱
台北市道路 CCTV 地圖

---

# 目前完成進度

## ✅ 資料來源

- 已由 CSV 改為台北市政府 Open Data API
- 因 API CORS 限制，改採 GitHub Actions 定時下載
- 自動產生 `cctv.json`
- 網站直接讀取 `cctv.json`
- 不再直接呼叫台北市 API

---

## ✅ 地圖

已完成 Google Maps → Leaflet 遷移（大部分）

### 已完成

- Leaflet 1.9.4
- OpenStreetMap 底圖
- Marker 改為 `L.circleMarker`
- Popup 改為 Leaflet Popup
- 左側清單
- 搜尋
- 行政區篩選
- Popup 樣式
- 我的位置（Leaflet）
- 最近 CCTV 計算
- 已移除 Google API Key

---

## ✅ 已修正

- API CORS 問題
- 新版 API 欄位名稱
  - `攝影機編號`
  - `wgsx`
  - `wgsy`
- Popup 樣式
- 按鈕文字顏色
- 定位 Marker
- Sidebar 正常

---

# 尚未完成

## Leaflet 最後整理

- [ ] 完全移除 Google Maps 殘留程式
- [ ] 整理 `script.js`
- [ ] 移除未使用函式
- [ ] 清除 Google Maps 註解

---

## 功能

- [ ] 定位後自動飛到最近 CCTV（重新整理為 Leaflet 寫法）
- [ ] Sidebar 點擊動畫最佳化
- [ ] 地圖飛行動畫最佳化

---

## UI

- [ ] Popup 外觀微調
- [ ] Marker 顏色可設定
- [ ] 深色模式（未開始）

---

# GitHub

## 已完成

- GitHub Pages
- GitHub Actions
- 自動更新 cctv.json

---

# 下一步

1. 完成 Leaflet 最終整理
2. 完全移除 Google Maps 程式
3. 清理 script.js
4. 新增更多功能

---

# 未來規劃

- ⭐ 收藏 CCTV
- ⭐ 最近 CCTV 清單
- ⭐ 即時預覽（Popup 直接播放）
- ⭐ 衛星地圖切換
- ⭐ 路況圖層
- ⭐ 分享目前 CCTV
- ⭐ 行動裝置 UI 優化

---

更新日期：2026-07-15
狀態：🟢 開發中（Leaflet 遷移約 90% 完成）