# 台北市道路 CCTV
Project Status

最後更新：2026-07-15

---

# 專案網址

GitHub
https://github.com/jyj8f6h6z6-hub/taipei_CCTV2

GitHub Pages
https://jyj8f6h6z6-hub.github.io/taipei_CCTV2/

---

# 專案狀態

版本：v1.1

目前狀態：

✅ 正常運作

---

# 已完成功能

## 地圖

- Google Maps 顯示所有 CCTV
- Marker 顯示全部攝影機
- 點擊 Marker 開啟資訊視窗
- 開啟官方即時影像

---

## 側邊欄

- 行政區分類
- CCTV 清單
- 高亮目前選取 CCTV
- 點選清單自動定位

---

## 搜尋

- 關鍵字搜尋
- 行政區篩選

---

## 資料

- 讀取 cctv.csv
- Big5 編碼支援
- 自動建立官方 HLS 播放網址

---

## 定位（2026-07-15）

新增：

- 📍 我的位置按鈕
- 瀏覽器 GPS 定位
- 地圖移動到目前位置
- 顯示紅色定位 Marker
- 定位失敗訊息
- 定位權限處理

---

## 程式架構

已完成拆分：

- index.html
- style.css
- script.js

不再使用單一 HTML。

---

# Git

Repository：

https://github.com/jyj8f6h6z6-hub/taipei_CCTV2

目前 Branch：

main

---

# 下一步開發

Priority 1

□ 找最近 CCTV

功能：

- 自動計算最近攝影機
- 顯示距離
- 地圖自動飛過去
- 自動開啟 InfoWindow

---

Priority 2

□ 附近 CCTV

- 顯示 500 公尺內
- 顯示 1 公里內
- 距離排序

---

Priority 3

□ 即時影像內嵌播放

- 不開新分頁
- 側邊播放
- 可切換 CCTV

---

Priority 4

□ 收藏 CCTV

- LocalStorage
- 常用攝影機

---

Priority 5

□ Marker Cluster

大量 Marker 效能最佳化

---

Priority 6

□ PWA

- 離線支援
- 安裝到手機
- App Icon

---

# 備註

本專案目前已改為：

GitHub Repository
↓

Clone 到本機

↓

VS Code 開發

↓

Commit

↓

Push

↓

GitHub Pages 自動更新

不再直接於 GitHub 網頁編輯程式碼。
