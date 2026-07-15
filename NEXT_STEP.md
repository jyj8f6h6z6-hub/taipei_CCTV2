# NEXT STEP

## 專案
台北市道路 CCTV（Leaflet 版）

更新日期：2026-07-15

---

# 目前狀態

目前已成功由 Google Maps 遷移至 Leaflet，大部分功能已完成。

目前可正常使用：

- ✅ OpenStreetMap（Leaflet）
- ✅ CCTV Marker
- ✅ Sidebar
- ✅ 搜尋
- ✅ 行政區篩選
- ✅ Popup
- ✅ 我的位置
- ✅ GitHub Actions 自動更新 cctv.json
- ✅ cctv.json 讀取正常

---

# 下一個工作（依優先順序）

## 1. 完成 Leaflet 收尾（最高優先）

### 1-1 清除 Google Maps 殘留

目前 script.js 仍有少量 Google Maps 時代留下的程式。

需要：

- [ ] 移除未使用變數
- [ ] 移除 Google Maps 註解
- [ ] 檢查是否仍有 google.maps 字串
- [ ] 完全移除 callback 架構

---

### 1-2 重構定位流程

目前定位已正常。

下一步：

- [ ] 將 focusNearestCam() 改成純 Leaflet
- [ ] 改善定位動畫
- [ ] 可設定是否自動跳最近 CCTV

---

### 1-3 Marker 管理

目前 Marker 已可正常運作。

之後整理：

- [ ] Marker 建立流程
- [ ] Marker 清除流程
- [ ] Marker 更新流程

---

## 2. UI 改善

### Popup

- [ ] Popup 寬度微調
- [ ] Popup 陰影
- [ ] Popup 留白
- [ ] 手機版 Popup

---

### Sidebar

- [ ] 點選動畫
- [ ] Hover 動畫
- [ ] Active 樣式微調

---

### 地圖

- [ ] flyTo 動畫
- [ ] 縮放動畫
- [ ] Marker 動畫

---

## 3. script.js 整理

目前 script.js 已修改多次。

建議重新整理：

```
API
↓
資料整理
↓
搜尋
↓
Sidebar
↓
Leaflet
↓
Marker
↓
Popup
↓
定位
↓
工具函式
```

目標：

- 增加可讀性
- 減少重複程式
- 增加註解

---

## 4. 新功能

### 第一階段

- [ ] 最近 CCTV 清單
- [ ] 我的最愛
- [ ] 分享目前 CCTV

---

### 第二階段

- [ ] Popup 即時預覽
- [ ] CCTV 縮圖
- [ ] 多個底圖切換
  - OpenStreetMap
  - 衛星
  - 地形

---

### 第三階段

- [ ] 路況圖層
- [ ] YouBike
- [ ] 停車場
- [ ] 公車站
- [ ] 即時事件

---

# 備註

## 已完成的重要里程碑

✓ CSV → Open Data API

✓ API → GitHub Actions

✓ cctv.json

✓ Google Maps → Leaflet

✓ OpenStreetMap

✓ Popup

✓ Marker

✓ Sidebar

✓ 我的位置

---

目前專案約完成 **90～95%**。

剩餘工作主要為程式整理（Refactor）與功能擴充，不再是架構轉換。