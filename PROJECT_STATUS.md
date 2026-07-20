---

# PROJECT_STATUS.md

## 專案名稱

**台北 / 新北 即時 CCTV 地圖**

---

# 目前版本

**Version：2.0**

更新日期：

> 2026-07-20

---

# 已完成功能

## 台北市

### 道路 CCTV

* ✅ 約 416 支
* ✅ 官方播放器
* ✅ 搜尋
* ✅ Popup
* ✅ 側欄

---

### 水情 CCTV

* ✅ 約 53 支
* ✅ HLS 播放
* ✅ Snapshot
* ✅ Popup

---

### 水情租賃 CCTV

* ✅ 約 110 支
* ✅ HLS 播放
* ✅ Popup

---

## 新北市

### 道路 CCTV

* ✅ 官方 OpenData
* ✅ 約 459 支
* ✅ Marker
* ✅ 搜尋
* ✅ Sidebar
* ✅ 行政區篩選
* ✅ Popup
* ✅ 官方即時影像網址

影像網址格式：

```text
https://atis.ntpc.gov.tw/ATIS/ShowFrame4CCTV/{areacode}
```

例如：

```text
https://atis.ntpc.gov.tw/ATIS/ShowFrame4CCTV/C000228
```

---

# 資料來源

## 台北

* 道路 CCTV
* 水情 CCTV
* 水情租賃 CCTV

---

## 新北

交通局 OpenData

欄位：

* cctv_id
* areacode
* district
* address
* latitude
* longitude

---

# 程式修改

## 新增

```
normalizeNewTaipeiRoad()
```

功能：

* 轉換官方 JSON
* 建立 city
* 建立 district
* 建立官方影像網址

---

新增

```
normalizeNewTaipeiDistrict()
```

功能：

統一：

```
新店
↓
新店區

淡水
↓
淡水區
```

避免行政區重複。

---

修改

```
loadData()
```

目前載入：

```
台北道路
新北道路
台北水情
台北水情租賃
```

---

修改

```
buildDistrictOptions()
```

改為：

* 動態行政區
* 台北 / 新北 分組
* 不再使用固定 DISTRICTS

---

修改

```
renderSidebar()
```

改為：

依 city + district 分組。

---

修改

```
openInfo()
```

新增：

若沒有

```
cam.url
```

則顯示：

```
目前僅提供 CCTV 點位資料，
尚無可開啟的即時影像網址。
```

避免重新開啟本站。

---

# 目前資料量

| 類型     |       數量 |
| ------ | -------: |
| 台北道路   |      416 |
| 新北道路   |      459 |
| 台北水情   |       53 |
| 台北水情租賃 |      110 |
| **總計** | **1038** |

---

# 待完成

## 高優先

* ⏳ 新北水情 CCTV
* ⏳ GitHub Actions 自動更新新北道路資料

---

## 中優先

* Marker Cluster（大量 Marker 聚合）
* fitBounds 自動縮放
* 側欄城市可收合

---

## 低優先

* 北北基桃擴充
* 科技執法 CCTV
* 收藏功能
* 分享功能

---

# Git Commit 建議

```text
feat: 新增新北市道路 CCTV 與官方即時影像支援
```

---

## 我另外建議

我發現這個專案已經不是簡單的練習了，而是逐漸成為一個完整的應用程式。建議從下一版開始採用版本號管理，例如：

* **v1.0**：台北市 CCTV
* **v2.0**：加入新北市道路 CCTV（目前）
* **v2.1**：加入新北水情 CCTV
* **v2.2**：Marker Cluster
* **v3.0**：北北基桃 CCTV

之後每次更新 `PROJECT_STATUS.md` 都記錄版本號與更新內容，未來回顧專案歷程會清楚很多。