## Version

建議改成：

```text
Version：2.1
```

更新日期維持：

```text
2026-07-20
```

因為目前已經不是單純加入新北道路 CCTV，還加入了行政區判定與地圖縮放功能。

---

## 程式修改

### 刪除

移除：

```text
normalizeNewTaipeiDistrict()
```

因為現在已經改成共用函式：

```text
normalizeDistrict()
```

---

新增：

```text
normalizeDistrict()
```

功能：

```text
統一行政區名稱

例如：

大安
↓
大安區

新店
↓
新店區

空值可指定預設值，例如：

normalizeDistrict(value, "未判定")
```

---

### 修改

新增一項：

```text
loadDistrictBoundaries()
```

功能：

* 載入雙北行政區 Polygon
* 提供行政區判定
* 提供行政區自動縮放

````

---

新增：

```text
districtByCoord()
````

功能：

* 使用行政區 Polygon 判斷
* 不再使用 Bounding Box
* 提高行政區判定準確度

````

---

新增：

```text
zoomToDistrict()
````

功能：

* 選擇行政區後自動縮放地圖
* 使用 Polygon 計算 Bounds

````

---

新增：

```text
cameraCounts
````

功能：

* 快取各類 CCTV 數量
* render() 不再重複 filter()

````

---

## 中優先

把

```text
fitBounds 自動縮放
````

刪掉。

因為這個功能已經完成了（至少臺北市已完成，新北市也正準備套用）。

可以改成：

```text
雙北行政區自動縮放優化
```

---

## Git Commit 建議

目前這次整理比較符合：

```text
refactor: 重構行政區判定與地圖縮放流程
```

或

```text
feat: 支援行政區 Polygon 判定與自動縮放
```

---

## 下一版規劃

我也建議新增一節，例如：

```text
# Version Roadmap

v2.0
新北道路 CCTV

v2.1
行政區 Polygon
行政區自動縮放
程式重構

v2.2
新北水情 CCTV

v2.3
Marker Cluster

v3.0
北北基桃 CCTV
```

這樣 `PROJECT_STATUS.md` 就會同時扮演「功能清單」和「開發日誌」，以後回頭看每個版本做了哪些事會很清楚。
