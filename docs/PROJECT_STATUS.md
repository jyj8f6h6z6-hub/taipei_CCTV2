# 一、更新後的 `PROJECT_STATUS.md`

````md
# 即時 CCTV 地圖專案狀態

專案版本：v2.4  
更新日期：2026-07-23  
專案方向：由雙北逐步擴充至北北基桃，未來可延伸至全臺  
長期營運方向：完成核心功能與內容建置後，導入自有網域、搜尋流量分析與廣告變現

---

## 一、目前已完成的資料來源

### 臺北市

- 道路 CCTV
- 水情 CCTV
- 水情租賃 CCTV

### 新北市

- 道路 CCTV

### 基隆市

- 道路 CCTV

### 桃園市

- 道路 CCTV

目前北北基桃四個縣市皆已有 CCTV 資料可於前端顯示。

目前已完成：

- 資料下載與整理
- CCTV 資料格式統一
- 縣市與行政區篩選
- 地圖標記
- CCTV 資訊視窗
- CCTV 影像播放
- 縣市與行政區自動縮放
- Google 地點搜尋
- 使用者目前位置定位
- 搜尋位置附近 CCTV
- 基隆市 CCTV 自動更新流程

### 資料更新方式

臺北市、新北市、水情及基隆市資料，依各自更新程式與 GitHub Actions 流程執行。

基隆市道路 CCTV 已建立：

- `update-keelung-road-cctv.py`
- `keelung-road-cctv.json`
- GitHub Actions 定時更新 workflow

目前已成功產生一次由 `github-actions[bot]` 建立的基隆 CCTV 更新 commit，代表下載、轉換、提交與推送流程至少已成功執行一次。

由於每日排程為近期新增，仍需持續觀察後續一至兩次自動排程，以確認長期執行是否穩定。

桃園市 CCTV API 目前無法由 GitHub Actions 雲端主機穩定連線，因此資料仍暫時採本機手動更新。

---

## 二、目前前端功能

### 1. 縣市與行政區兩層篩選

目前操作流程：

```text
縣市
↓
行政區
````

目前縣市選單可顯示：

* 全部縣市
* 臺北市
* 新北市
* 基隆市
* 桃園市

行政區選單會依照選擇的縣市動態更新。

只有實際已有 CCTV 資料的縣市才會顯示於選單。

目前縣市順序：

```js
const CITY_ORDER = [
  "臺北市",
  "新北市",
  "基隆市",
  "桃園市"
];
```

### 2. CCTV 類型篩選

目前支援：

* 全部 CCTV
* 道路 CCTV
* 水情 CCTV
* 水情租賃 CCTV

臺北市以外的縣市目前主要提供道路 CCTV。

水情 CCTV 與水情租賃 CCTV 僅在選擇「全部縣市」或「臺北市」時顯示於類型選單。

### 3. 地圖自動縮放

目前支援：

* 選擇縣市後，地圖縮放至該縣市
* 選擇行政區後，地圖縮放至該行政區
* 選擇全部縣市後，顯示目前已支援縣市的整體範圍

目前已支援：

* 臺北市
* 新北市
* 基隆市
* 桃園市

### 4. CCTV 清單與地圖同步

目前已完成：

* 側邊欄依縣市與行政區分組
* 顯示各行政區 CCTV 數量
* 點擊側邊欄 CCTV 可移動至地圖位置
* 點擊地圖 Marker 可開啟 CCTV 資訊
* 點擊 CCTV 後可同步反白側邊欄項目
* CCTV 可開啟即時影像
* 支援 HLS `.m3u8` 串流
* 無可用影像網址時顯示提示文字

### 5. 我的定位

目前已完成：

* 取得使用者目前位置
* 在地圖上顯示「我的位置」Marker
* 將地圖移動並放大至使用者位置
* 搜尋距離目前位置最近的 CCTV
* 顯示最近 CCTV 名稱、類型與距離

已修正定位時地圖縮放互相覆蓋的問題。

修正方式包括：

* 定位前重新顯示 CCTV 時，不再觸發全縣市縮放
* 定位成功時先停止尚未完成的 Leaflet 地圖動畫
* 再將地圖移動至使用者目前位置

修正後，第一次點擊「我的位置」即可直接放大至定位位置，不需要再次點擊。

### 6. Google Maps 地點搜尋

目前已完成：

* Google Place Autocomplete
* 搜尋範圍限制為臺灣
* 可搜尋地址、路口、車站、地標、店家與公園
* 點選 Google 建議地點後取得地點資料
* 使用 `place.fetchFields()` 取得名稱、地址與座標
* Leaflet 地圖移動至搜尋位置
* 顯示搜尋位置 Marker
* Marker 資訊視窗顯示搜尋位置名稱
* 計算搜尋位置附近 CCTV
* 依距離由近到遠排序
* 地圖只顯示搜尋範圍內 CCTV
* 側邊欄只顯示搜尋範圍內 CCTV
* 地圖自動縮放，使搜尋位置與附近 CCTV 同時顯示
* 最多顯示 50 支 CCTV
* 新增「清除搜尋」功能
* 切換縣市時恢復原本瀏覽模式
* 已處理 Google 地點建議清單被 Leaflet 地圖遮住的問題

目前搜尋半徑：

```text
3 公里
```

目前未在側邊欄顯示每支 CCTV 的距離文字，距離只用於篩選與排序。

---

## 三、目前資料結構

所有 CCTV 資料逐步統一為：

```js
{
  key: "唯一識別值",
  id: "攝影機編號",
  name: "攝影機名稱或位置",
  x: 121.5,
  y: 25.0,
  city: "基隆市",
  district: "仁愛區",
  url: "影像網址",
  streamUrl: "串流網址",
  type: "road",
  source: "資料來源"
}
```

重要共用欄位：

* `key`
* `id`
* `name`
* `x`
* `y`
* `city`
* `district`
* `type`
* `source`
* `url`
* `streamUrl`

搜尋附近 CCTV 時，會暫時新增：

```js
{
  distance: 350
}
```

`distance` 單位為公尺。

---

## 四、目前程式架構調整

目前已完成：

* 使用共用 `normalizeCity()`
* 使用共用 `normalizeDistrict()`
* 建立 `CITY_ORDER`
* 建立 `buildCityOptions()`
* 建立 `buildSourceOptions()`
* 建立 `buildDistrictOptions()`
* 行政區選單依縣市動態建立
* CCTV 類型選單依縣市動態調整
* `filteredCams()` 同時支援縣市、行政區與 CCTV 類型條件
* `zoomToCity()` 支援縣市縮放
* `zoomToDistrict()` 同時使用縣市與行政區判定
* 行政區邊界已包含臺北、新北、基隆與桃園
* `cameraCounts` 使用快取方式統計
* 桃園道路 CCTV 已加入 `loadData()`
* 基隆道路 CCTV 已加入 `loadData()`
* 新增 `normalizeKeelungRoad()`
* 基隆 CCTV 已加入 `allCams`
* 基隆 CCTV 已加入道路攝影機數量統計
* 搜尋欄由舊 CCTV 文字搜尋改為 Google 地點搜尋
* 新增 `initPlaceAutocomplete()`
* 使用 `gmp-select` 取得 Google 地點選取結果
* 使用 `place.fetchFields()` 取得地點名稱、地址與座標
* 新增搜尋位置 Marker
* 沿用 `distanceInMeters()` 計算距離
* 新增 `findNearbyCams()`
* 搜尋半徑設定為 3 公里
* 搜尋結果依距離排序
* 搜尋結果最多顯示 50 支
* 新增搜尋結果地圖自動縮放
* 新增清除搜尋流程
* 已移除重複的 `initPlaceAutocomplete()` 舊函式
* 已處理 Google 建議清單的 `z-index` 問題
* 已修正「我的位置」第一次點擊縮放異常

行政區邊界過濾目前包含：

```js
[
  "臺北市",
  "台北市",
  "新北市",
  "基隆市",
  "桃園市"
]
```

---

## 五、Google Maps Platform 設定

目前已完成：

* 建立 Google Maps Platform API Key
* 啟用 Maps JavaScript API
* 啟用 Places API (New)
* 綁定有效帳單
* 設定 HTTP referrer 網站來源限制
* 設定 API 使用限制
* 本機開發網址已加入允許清單

目前使用的 API：

* Maps JavaScript API
* Places API (New)

注意事項：

* API Key 不可公開貼在聊天、Issue 或公開文件中
* 若 API Key 曾公開，應立即更換
* 綁定自有網域後，需把正式網域加入允許來源
* 本機可保留 `127.0.0.1` 與 `localhost`
* API Key 應持續保留網站來源限制與 API 限制
* 前端 API Key 即使使用自有網域，仍可由瀏覽器查看
* 安全核心仍是來源限制、API 限制、使用配額與帳單警示

---

## 六、各縣市 CCTV 更新方式

### 桃園市道路 CCTV

更新程式：

```text
update-taoyuan-road-cctv.py
```

在 VS Code 終端機執行：

```bash
python update-taoyuan-road-cctv.py
```

成功後會更新：

```text
taoyuan-road-cctv.json
```

接著使用 VS Code：

```text
Commit
→ Push
```

操作教學位於：

```text
docs/手動更新桃園CCTV資料.md
```

桃園市目前維持本機手動更新。

### 基隆市道路 CCTV

更新程式：

```text
update-keelung-road-cctv.py
```

輸出資料：

```text
keelung-road-cctv.json
```

已建立 GitHub Actions workflow，每日自動執行基隆 CCTV 更新。

目前已成功產生一次由 `github-actions[bot]` 建立的更新 commit。

後續需觀察：

* 每日排程是否持續自動啟動
* 官方來源無變動時 workflow 是否正常成功結束
* 有資料變動時是否自動更新 JSON
* 是否能正常 commit 與 push
* 官方來源是否出現連線失敗或格式變更

---

## 七、目前搜尋功能流程

```text
輸入 Google Maps 地點
↓
Google 顯示地點建議
↓
使用者點選地點
↓
取得地點名稱與座標
↓
Leaflet 顯示搜尋位置 Marker
↓
計算 3 公里內 CCTV
↓
依距離由近到遠排序
↓
最多保留 50 支
↓
更新側邊欄與 CCTV Marker
↓
地圖自動縮放至搜尋位置與附近 CCTV
```

搜尋模式下：

* 側邊欄只顯示附近 CCTV
* 地圖只顯示附近 CCTV
* 搜尋位置顯示獨立 Marker
* CCTV 依距離排序
* 清除搜尋後恢復縣市與行政區瀏覽模式
* 切換縣市時離開搜尋模式並恢復一般瀏覽

---

## 八、近期執行順序

目前基隆市道路 CCTV 已完成，近期工作順序調整為：

1. 觀察基隆 GitHub Actions 每日排程
2. 確認基隆 JSON 可持續穩定更新
3. 完善搜尋模式狀態管理
4. 決定下一個要加入的縣市
5. 尋找下一縣市的官方 CCTV 資料來源
6. 決定長期網站名稱
7. 購買自己的網域
8. 將自有網域綁定 GitHub Pages
9. 加入「關於本站」、「使用說明」、「資料來源」、「隱私權政策」頁面
10. 安裝 Google Search Console 與 Google Analytics
11. 累積一段時間的真實流量
12. 再申請 Google AdSense
13. 通過後少量放置廣告

現階段原則：

* 網站繼續使用 GitHub Pages
* 暫時不搬移主機
* 優先完成資料、功能與內容品質
* 新增縣市時優先使用官方或可信資料來源
* 廣告不得遮擋地圖、搜尋框、CCTV 清單或播放按鈕
* 申請 AdSense 前，先補齊網站資訊頁與隱私權政策

---

## 九、待辦事項

### 最高優先：基隆市自動更新穩定性驗證

* 確認 GitHub Actions 每日排程能自動觸發
* 觀察明後天的 workflow 執行紀錄
* 確認成功與失敗狀態
* 確認無資料變更時不會因沒有 commit 而失敗
* 確認有資料變更時能更新 JSON
* 確認 `github-actions[bot]` 能正常 commit 與 push
* 確認官方資料來源連線穩定
* 確認資料欄位沒有突然變更
* 確認網站載入更新後的基隆 JSON

### 高優先：完善搜尋模式

建議建立明確狀態：

```js
let viewMode = "browse"; // browse | search
let activeSearchPlace = null;
let activeSearchPosition = null;
let activeNearbyCams = [];
```

待處理：

* 確認「清除搜尋」按鈕同步清空 Google 搜尋框文字
* 搜尋模式下切換 CCTV 類型時重新計算結果
* 切換 CCTV 類型後保留搜尋位置 Marker
* 明確區分搜尋模式與縣市瀏覽模式
* 搜尋範圍內沒有 CCTV 時顯示提示
* 確認清除搜尋後完整恢復縣市、行政區、Marker 與側邊欄
* 評估顯示每支 CCTV 與搜尋位置的距離
* 評估加入搜尋半徑選單

### 高優先：下一個縣市資料整合

* 決定下一個擴充縣市
* 找到官方 CCTV 資料來源
* 確認資料授權與更新頻率
* 檢查攝影機名稱、座標、行政區與影像網址
* 確認影像格式、HTTPS 與 CORS
* 建立資料下載或更新程式
* 轉換成現有統一格式
* 產生對應 JSON
* 加入 `loadData()`
* 加入行政區邊界
* 測試縣市與行政區篩選
* 測試地圖縮放
* 測試 Google 地點搜尋
* 測試 CCTV 播放

### 中優先：自有網域與網站內容

* 決定長期網站名稱
* 選擇適合未來擴充至全臺的網域名稱
* 購買網域
* 將網域綁定 GitHub Pages
* 開啟 HTTPS
* 更新 Google API Key 正式網域來源限制
* 建立關於本站頁面
* 建立使用說明頁面
* 建立資料來源與更新時間頁面
* 建立隱私權政策頁面
* 規劃聯絡方式與常見問題頁面
* 評估加入免責聲明

### 中優先：流量分析與廣告準備

* 安裝 Google Search Console
* 安裝 Google Analytics
* 提交 Sitemap
* 設定網站標題與說明
* 設定 Open Graph 分享資訊
* 觀察自然搜尋流量
* 觀察使用者行為
* 累積一段時間的真實流量
* 確認網站內容與版面符合 AdSense 政策
* 通過 AdSense 後少量放置廣告
* 廣告位置避免造成誤點或妨礙地圖操作

### 其他中期待辦

* 評估桃園其他 CCTV 資料來源
* 加入 Marker Cluster
* CCTV 載入效能優化
* 行動版搜尋介面優化
* 顯示資料最後更新時間
* 建立各資料來源健康狀態
* 評估資料載入失敗時的前端提示
* 評估延遲載入或分縣市載入資料

### 長期

* 擴充北北基桃其他 CCTV 類型
* 評估整合北北基桃範圍內國道 CCTV
* 擴充至新竹及其他縣市
* 支援全臺 CCTV
* 統一各縣市資料更新流程
* 建立資料來源健康檢查
* 建立更新失敗通知
* 視流量與營運需求評估是否搬離 GitHub Pages

---

## 十、版本規劃

### v2.0

* 新北市道路 CCTV

### v2.1

* 縣市與行政區兩層篩選
* 行政區 Polygon 判定
* 縣市與行政區自動縮放
* 行政區判定與縮放流程重構

### v2.2

* 桃園市道路 CCTV
* 桃園市行政區篩選
* 桃園市地圖縮放
* 桃園 HLS CCTV 播放
* 桃園手動更新工具與說明文件

### v2.3

* Google Maps 地點搜尋
* Google Place Autocomplete
* 搜尋位置 Marker
* 3 公里內 CCTV 搜尋
* 距離排序
* 最多顯示 50 支 CCTV
* 地圖自動縮放顯示全部搜尋結果
* 清除搜尋與瀏覽模式恢復
* 修正 Google 地點建議清單遮擋問題

### v2.4

* 基隆市道路 CCTV
* 基隆市行政區篩選
* 基隆市地圖縮放
* 基隆市 CCTV 播放
* 基隆市資料更新程式
* 基隆市 GitHub Actions 每日更新
* 修正「我的位置」第一次點擊縮放異常
* 持續驗證基隆定時更新穩定性

### v2.5

* 搜尋模式狀態管理完善
* Marker Cluster
* CCTV 載入效能優化
* 下一縣市 CCTV 初步整合

### v2.6

* 自有網域與 GitHub Pages 綁定
* 關於本站
* 使用說明
* 資料來源與更新時間
* 隱私權政策
* Google Search Console
* Google Analytics
* SEO 基礎設定

### v2.7

* 累積真實流量
* AdSense 申請準備
* 通過後少量放置廣告

### v3.0

* 北北基桃 CCTV 整合完成
* 評估北北基桃國道 CCTV 整合

### v4.0

* 全臺 CCTV 架構
* 統一各縣市資料更新流程
* 建立資料來源健康檢查

---

## 十一、建議 Commit 訊息

### 基隆市

```text
feat: 新增基隆市道路 CCTV
feat: 新增基隆市 CCTV 資料更新流程
chore: 新增基隆市 CCTV 每日自動更新
fix: 修正基隆市 CCTV 更新流程
fix: 修正基隆市行政區判定與縮放
```

### 定位功能

```text
fix: 修正我的位置第一次點擊未正確縮放
fix: 避免定位時全縣市縮放覆蓋使用者位置
```

### 搜尋功能

```text
feat: 新增 Google 地點搜尋與附近 CCTV 查詢
feat: 顯示搜尋地點 3 公里內 CCTV 並自動縮放地圖
feat: 新增清除地點搜尋並恢復 CCTV 瀏覽模式
```

### 搜尋修正

```text
fix: 移除重複的 Google 地點搜尋初始化函式
fix: 修正 Google 地點建議清單被地圖遮擋
fix: 搜尋模式切換 CCTV 類型後重新計算結果
fix: 清除搜尋時同步重設搜尋框與地圖狀態
feat: 新增搜尋範圍內無 CCTV 的提示
```

### 下一個縣市

```text
feat: 新增○○市道路 CCTV
feat: 新增○○市 CCTV 資料更新流程
chore: 新增○○市 CCTV 自動更新排程
```

### 網站與網域

```text
chore: 設定自有網域並綁定 GitHub Pages
feat: 新增關於本站與使用說明頁面
feat: 新增資料來源與隱私權政策頁面
chore: 新增 Search Console 與 Analytics 設定
```

### 廣告準備

```text
chore: 完成 AdSense 申請前網站內容與版面調整
feat: 新增低干擾式廣告版位
```

````

---

# 二、更新後的 `NEXT_STEP.md`

```md
# 即時 CCTV 地圖專案交接

專案版本：v2.4  
更新日期：2026-07-23  
專案網址：https://jyj8f6h6z6-hub.github.io/taipei_CCTV2/  
專案方向：由雙北逐步擴充至北北基桃，未來延伸至全臺  
下一階段核心目標：確認基隆市自動更新穩定性、完善搜尋模式，並開始規劃下一個縣市資料整合

---

## 一、目前已完成

### 資料來源

#### 臺北市

- 道路 CCTV
- 水情 CCTV
- 水情租賃 CCTV

#### 新北市

- 道路 CCTV

#### 基隆市

- 道路 CCTV

#### 桃園市

- 道路 CCTV

北北基桃四個縣市皆已有 CCTV 資料接入前端。

目前已完成：

- 資料下載與整理
- CCTV 資料格式統一
- 縣市與行政區篩選
- 地圖 Marker
- CCTV 資訊視窗
- CCTV 影像播放
- 縣市與行政區自動縮放
- 使用者位置定位
- Google 地點搜尋
- 搜尋位置附近 CCTV
- 基隆市資料更新程式
- 基隆市 GitHub Actions 每日更新流程

基隆市更新流程已成功產生一次由 `github-actions[bot]` 建立的 commit，表示 GitHub Actions 已至少成功完成一次：

```text
下載資料
↓
整理資料
↓
輸出 JSON
↓
偵測 Git 變更
↓
Commit
↓
Push
````

目前仍需觀察後續每日排程是否持續穩定。

桃園市 CCTV API 目前無法由 GitHub Actions 雲端主機穩定連線，因此仍暫時採本機手動更新。

---

## 二、目前前端功能

### 1. 縣市與行政區兩層篩選

```text
縣市
↓
行政區
```

目前縣市選單可顯示：

* 全部縣市
* 臺北市
* 新北市
* 基隆市
* 桃園市

行政區選單會依選擇的縣市動態更新。

目前縣市順序：

```js
const CITY_ORDER = [
  "臺北市",
  "新北市",
  "基隆市",
  "桃園市"
];
```

只有實際已有 CCTV 資料的縣市會顯示於選單。

### 2. CCTV 類型篩選

目前支援：

* 全部 CCTV
* 道路 CCTV
* 水情 CCTV
* 水情租賃 CCTV

水情類型目前僅屬於臺北市資料。

### 3. 地圖自動縮放

目前支援：

* 選擇縣市後縮放至該縣市
* 選擇行政區後縮放至該行政區
* 選擇全部縣市後顯示目前支援範圍

已支援：

* 臺北市
* 新北市
* 基隆市
* 桃園市

### 4. CCTV 清單與地圖同步

* 側邊欄依縣市與行政區分組
* 點擊清單可移動至 CCTV
* 點擊地圖 Marker 可開啟 CCTV 資訊
* 點擊 Marker 後同步反白側邊欄項目
* CCTV 可正常播放
* 支援 HLS `.m3u8` 串流
* 沒有影像網址時顯示提示

### 5. 我的定位

目前已完成：

* 取得使用者目前位置
* 顯示「我的位置」Marker
* 將地圖放大至使用者位置
* 找出最近的 CCTV
* 顯示最近 CCTV 的名稱、類型與距離

已修正第一次點擊「我的位置」時，地圖可能先回到全縣市範圍的問題。

目前修正方式：

* 定位前更新 Marker 時不執行全縣市縮放
* 定位成功時先執行 `map.stop()`
* 再執行 `map.setView()`

修正後應可在第一次點擊時直接定位。

### 6. Google Maps 地點搜尋

目前已完成：

* Google Place Autocomplete
* 搜尋範圍限制為臺灣
* 可搜尋地址、路口、車站、地標、店家及公園
* 點選 Google 建議地點後取得座標
* Leaflet 地圖移動至搜尋位置
* 顯示搜尋位置 Marker
* Marker 資訊視窗顯示地點名稱
* 計算搜尋位置附近 CCTV
* 依距離由近到遠排序
* 地圖只顯示搜尋範圍內 CCTV
* 側邊欄只顯示搜尋範圍內 CCTV
* 地圖自動縮放顯示搜尋位置與附近 CCTV
* 最多顯示 50 支 CCTV
* 新增「清除搜尋」功能
* 切換縣市時恢復瀏覽模式
* 已修正 Google 地點建議清單被地圖遮住

目前搜尋半徑：

```text
3 公里
```

目前未顯示每支 CCTV 的距離文字，距離只用於篩選與排序。

---

## 三、目前資料結構

所有 CCTV 資料逐步統一為：

```js
{
  key: "唯一識別值",
  id: "攝影機編號",
  name: "攝影機名稱或位置",
  x: 121.5,
  y: 25.0,
  city: "基隆市",
  district: "中正區",
  url: "影像網址",
  streamUrl: "串流網址",
  type: "road",
  source: "資料來源"
}
```

重要共用欄位：

* `city`
* `district`
* `type`
* `source`
* `url`
* `streamUrl`

搜尋附近 CCTV 時暫時新增：

```js
{
  distance: 350
}
```

單位為公尺。

---

## 四、目前程式架構

已完成：

* 共用 `normalizeCity()`
* 共用 `normalizeDistrict()`
* `CITY_ORDER`
* `buildCityOptions()`
* `buildSourceOptions()`
* `buildDistrictOptions()`
* 行政區選單依縣市動態建立
* CCTV 類型選單依縣市動態建立
* `filteredCams()` 支援縣市、行政區與類型條件
* `zoomToCity()`
* `zoomToDistrict()`
* 行政區 Polygon 判定
* 臺北、新北、基隆與桃園行政區邊界
* `cameraCounts` 快取統計
* 桃園道路 CCTV 接入 `loadData()`
* 基隆道路 CCTV 接入 `loadData()`
* `normalizeKeelungRoad()`
* Google 地點搜尋
* `initPlaceAutocomplete()`
* `gmp-select`
* `place.fetchFields()`
* 搜尋位置 Marker
* `distanceInMeters()`
* `findNearbyCams()`
* 3 公里搜尋半徑
* 搜尋結果距離排序
* 搜尋結果最多 50 支
* 搜尋結果地圖自動縮放
* 清除搜尋流程
* 移除重複的 Google 地點搜尋函式
* 修正 Google 搜尋建議清單的 `z-index`
* 修正我的位置縮放競爭問題

行政區邊界目前包含：

```js
[
  "臺北市",
  "台北市",
  "新北市",
  "基隆市",
  "桃園市"
]
```

---

## 五、Google Maps Platform 設定

目前已完成：

* 建立 Google Maps Platform API Key
* 啟用 Maps JavaScript API
* 啟用 Places API (New)
* 綁定有效帳單
* 設定 HTTP referrer 網站來源限制
* 設定 API 使用限制
* 本機開發網址加入允許清單

目前使用：

* Maps JavaScript API
* Places API (New)

注意事項：

* API Key 不可公開貼在聊天、Issue 或公開文件
* API Key 若曾公開，應立即更換
* 綁定自有網域後，需加入正式網域來源限制
* 本機可保留 `127.0.0.1` 與 `localhost`
* API Key 應持續保留網站來源限制與 API 限制
* 自有網域無法隱藏前端 API Key
* 仍需搭配來源限制、API 限制、配額與帳單警示

---

## 六、桃園 CCTV 更新方式

更新程式：

```text
update-taoyuan-road-cctv.py
```

執行方式：

```bash
python update-taoyuan-road-cctv.py
```

成功後更新：

```text
taoyuan-road-cctv.json
```

接著在 VS Code 執行：

```text
Commit
→ Push
```

詳細操作說明：

```text
docs/手動更新桃園CCTV資料.md
```

桃園目前仍採本機手動更新。

---

## 七、基隆 CCTV 更新方式

更新程式：

```text
update-keelung-road-cctv.py
```

輸出檔案：

```text
keelung-road-cctv.json
```

GitHub Actions workflow 已設定每日執行。

目前已確認：

* workflow 可執行 Python 更新程式
* JSON 可產生變更
* GitHub Actions 可提交更新
* 已由 `github-actions[bot]` 建立一次基隆 CCTV 更新 commit

目前仍需確認：

* 每日 `schedule` 是否持續自動觸發
* GitHub Actions 排程是否出現延遲
* 無資料變更時是否能正常成功結束
* 有資料變更時是否能正常 commit
* 官方資料來源是否穩定
* 官方資料格式是否持續一致

GitHub Actions 使用 UTC 排程，實際啟動時間可能有延遲，不一定會準時到分鐘。

---

## 八、目前搜尋流程

```text
輸入 Google Maps 地點
↓
Google 顯示地點建議
↓
使用者點選地點
↓
取得地點名稱與座標
↓
Leaflet 顯示搜尋位置 Marker
↓
計算 3 公里內 CCTV
↓
依距離由近到遠排序
↓
最多保留 50 支
↓
更新側邊欄與 CCTV Marker
↓
地圖自動縮放至搜尋位置與附近 CCTV
```

搜尋模式下：

* 側邊欄只顯示附近 CCTV
* 地圖只顯示附近 CCTV
* 搜尋位置顯示獨立 Marker
* CCTV 依距離由近到遠排列
* 清除搜尋後恢復縣市與行政區瀏覽模式
* 切換縣市時離開搜尋狀態

---

## 九、下一次開工：先驗證基隆自動更新

第一階段先不要急著修改基隆資料程式，先觀察每日排程。

### 檢查 GitHub Actions

進入 GitHub 專案：

```text
Actions
↓
選擇基隆 CCTV 更新 workflow
```

確認：

* 是否由排程自動啟動
* workflow 結果是否為綠色成功
* Python 更新程式是否正常完成
* Git 是否偵測到資料變更
* 有變更時是否成功 commit 與 push
* 無變更時是否顯示沒有資料需要提交
* 無變更時 workflow 是否仍為成功

### 檢查 JSON

確認：

* `keelung-road-cctv.json` 是否仍可正常解析
* CCTV 數量是否合理
* 經緯度是否正常
* 行政區是否正常
* URL 是否仍有效
* 網站是否能正常載入資料

### 判定基隆自動更新完成的條件

符合以下條件後，可視為基隆自動更新流程穩定：

* 至少連續兩次排程自動觸發
* workflow 沒有權限或 push 錯誤
* 有變更時可正常提交
* 無變更時可正常結束
* 網站可正常讀取更新後 JSON

---

## 十、搜尋模式仍需完善

建議建立明確狀態：

```js
let viewMode = "browse"; // browse | search
let activeSearchPlace = null;
let activeSearchPosition = null;
let activeNearbyCams = [];
```

### 搜尋成功時

```js
viewMode = "search";
activeSearchPlace = place;
activeSearchPosition = { lat, lng };
activeNearbyCams = nearbyCams;
```

### 清除搜尋時

```js
viewMode = "browse";
activeSearchPlace = null;
activeSearchPosition = null;
activeNearbyCams = [];
```

待處理：

* 清除搜尋時同步清空 Google 搜尋框文字
* 搜尋模式下切換 CCTV 類型時重新計算附近 CCTV
* 切換類型後保留搜尋位置 Marker
* 明確區分搜尋模式與瀏覽模式
* 搜尋範圍內沒有 CCTV 時顯示提示
* 清除搜尋後完整恢復縣市、行政區、Marker 與側邊欄
* 評估顯示 CCTV 距離
* 評估搜尋半徑選單

---

## 十一、下一個縣市整合流程

基隆排程確認穩定後，可開始加入其他縣市。

目前尚未決定下一個縣市。

### 第一階段：確認官方資料來源

* 找到縣市政府官方 CCTV 資料
* 確認資料授權
* 確認下載網址
* 確認更新頻率
* 檢查資料格式
* 確認是否包含行政區
* 確認是否包含影像或串流網址
* 確認 HTTPS 與 CORS

### 第二階段：建立資料更新程式

建議命名：

```text
update-縣市英文-road-cctv.py
縣市英文-road-cctv.json
```

統一輸出格式：

```js
{
  key: "city-road-攝影機編號",
  id: "攝影機編號",
  name: "道路名稱或位置",
  x: 121.7,
  y: 24.9,
  city: "縣市名稱",
  district: "行政區",
  url: "影像網址",
  streamUrl: "影像網址",
  type: "road",
  source: "官方資料來源"
}
```

### 第三階段：接入前端

* 新增 API URL 常數
* 新增資料標準化函式
* 在 `loadData()` 載入 JSON
* 加入 `allCams`
* 加入 `cameraCounts`
* 加入 `CITY_ORDER`
* 加入行政區邊界
* 確認縣市選單自動顯示

### 第四階段：測試

* 縣市篩選
* 行政區篩選
* 縣市縮放
* 行政區縮放
* 側邊欄分組
* Google 地點搜尋
* 3 公里附近 CCTV
* 我的定位
* CCTV 播放
* HTTPS
* CORS
* 手機版顯示

---

## 十二、自有網域與網站內容階段

下一縣市開發方向確認後，可同步規劃自有網域。

### 1. 決定長期網站名稱

原則：

* 不只限定臺北市
* 可支援北北基桃及全臺擴充
* 名稱容易記憶與輸入
* 避免與政府官方網站混淆
* 適合搜尋引擎理解
* 適合未來建立品牌

### 2. 購買網域並綁定 GitHub Pages

* 網站程式與資料保留在 GitHub
* 自有網域指向 GitHub Pages
* 設定 `CNAME`
* 開啟 HTTPS
* 確認原 GitHub Pages 網址導向
* 更新 Google API Key 允許來源

### 3. 補齊內容頁面

至少加入：

* 關於本站
* 使用說明
* 資料來源與更新時間
* 隱私權政策

建議後續加入：

* 聯絡方式
* 常見問題
* 免責聲明
* 各縣市 CCTV 資料說明
* 資料更新狀態頁面

---

## 十三、Search Console、Analytics 與廣告準備

### Search Console

* 驗證網站所有權
* 提交 Sitemap
* 觀察索引狀態
* 觀察搜尋關鍵字
* 觀察搜尋點擊與曝光

### Google Analytics

* 安裝追蹤碼
* 觀察每日使用者
* 觀察熱門搜尋
* 觀察熱門地區
* 觀察手機版與桌面版比例
* 觀察使用者停留時間
* 觀察主要操作流程

### AdSense 前置條件

* 網站功能穩定
* 有清楚的原創說明內容
* 有資料來源與更新說明
* 有隱私權政策
* 有一段時間的真實流量
* 頁面不能只是單一地圖或廣告載體
* 廣告不得妨礙 CCTV 操作

通過後先少量放置廣告，避免：

* 廣告覆蓋地圖
* 廣告緊貼播放按鈕
* 廣告混入 CCTV 清單造成誤點
* 手機版廣告遮擋搜尋框
* 廣告遮擋縣市與行政區選單

---

## 十四、國道 CCTV 整合方案

國道 CCTV 可以納入目前專案，但優先順序仍排在：

```text
基隆排程驗證
↓
搜尋模式完善
↓
下一縣市資料
↓
自有網域與內容頁面
```

不建議由 GitHub Pages 前端直接呼叫 TDX API。

TDX CCTV API 可能需要：

* Client ID
* Client Secret
* Access Token

以上資訊不可放在前端 JavaScript。

建議流程：

```text
TDX 國道 CCTV API
↓
本機 Python 或 GitHub Actions 更新程式
↓
產生 freeway-cctv.json
↓
GitHub Pages 載入 JSON
↓
加入 allCams
```

GitHub Secrets 建議使用：

```text
TDX_CLIENT_ID
TDX_CLIENT_SECRET
```

禁止寫進：

* `script.js`
* Python 原始碼
* JSON
* README
* Issue
* Commit 訊息

建議新增：

```text
update-freeway-cctv.py
freeway-cctv.json
```

第一階段可先納入北北基桃範圍內的國道 CCTV，避免一次載入全臺資料。

---

## 十五、版本規劃

### v2.4

已完成或正在驗證：

* 基隆市道路 CCTV
* 基隆市行政區判定
* 基隆市縣市與行政區縮放
* 基隆市 CCTV 播放
* 基隆市資料更新程式
* 基隆市 GitHub Actions 每日更新
* 修正我的位置縮放問題
* 驗證基隆排程穩定性

### v2.5

* 搜尋模式狀態管理
* 搜尋類型切換
* 搜尋位置 Marker 保留
* 無 CCTV 提示
* Marker Cluster
* CCTV 載入效能優化
* 下一縣市資料初步整合

### v2.6

* 自有網域
* GitHub Pages 網域綁定
* 關於本站
* 使用說明
* 資料來源與更新時間
* 隱私權政策
* Google Search Console
* Google Analytics
* SEO 基礎設定

### v2.7

* 累積真實流量
* AdSense 申請準備
* 通過後少量放置廣告

### v3.0

* 北北基桃市區 CCTV 整合完成
* 評估北北基桃國道 CCTV

### v4.0

* 全臺 CCTV 架構
* 統一各縣市資料更新流程
* 建立資料來源健康檢查
* 建立更新失敗通知

---

## 十六、建議 Commit 訊息

### 基隆更新驗證

```text
fix: 修正基隆 CCTV 自動更新流程
chore: 驗證基隆 CCTV 每日更新排程
fix: 修正基隆 CCTV 無資料變更時的提交流程
```

### 我的定位

```text
fix: 修正我的位置第一次點擊未正確縮放
fix: 避免全縣市縮放覆蓋使用者定位
```

### 搜尋模式

```text
fix: 搜尋模式切換 CCTV 類型後重新計算結果
fix: 清除地點搜尋時同步重設搜尋框與地圖狀態
feat: 新增搜尋範圍內無 CCTV 的提示
feat: 新增搜尋模式狀態管理
feat: 顯示 CCTV 與搜尋位置的距離
```

### 下一縣市

```text
feat: 新增○○市道路 CCTV
feat: 新增○○市 CCTV 資料更新流程
chore: 新增○○市 CCTV 自動更新排程
```

### 網站與網域

```text
chore: 設定自有網域並綁定 GitHub Pages
feat: 新增關於本站與使用說明頁面
feat: 新增資料來源與隱私權政策頁面
chore: 新增 Search Console 與 Analytics 設定
```

### 廣告準備

```text
chore: 完成 AdSense 申請前網站內容與版面調整
feat: 新增低干擾式廣告版位
```

---

## 十七、下一次開工建議順序

1. 查看基隆 GitHub Actions 是否由排程自動執行
2. 檢查 workflow 執行結果
3. 確認有資料變更時能自動 commit
4. 確認無資料變更時能正常成功結束
5. 確認網站能載入更新後的基隆 JSON
6. 再觀察一次後續排程
7. 完善搜尋模式狀態管理
8. 修正切換 CCTV 類型後的搜尋結果
9. 處理搜尋範圍內沒有 CCTV 的提示
10. 決定下一個要加入的縣市
11. 尋找該縣市官方 CCTV 資料來源
12. 評估資料格式、影像網址與更新方式
13. 開始建立該縣市更新程式與 JSON
14. 下一縣市方向確認後，再開始討論網站名稱與網域

---

## 十八、目前狀態摘要

目前 v2.4 已可正常：

* 顯示臺北、新北、基隆與桃園 CCTV
* 依縣市與行政區篩選
* 依 CCTV 類型篩選
* 播放 CCTV
* 取得使用者位置
* 第一次點擊即放大至使用者位置
* 顯示距離使用者最近的 CCTV
* 使用 Google 地點搜尋
* 搜尋 3 公里內 CCTV
* 依距離排序
* 最多顯示 50 支
* 同步更新地圖與側邊欄
* 清除搜尋並恢復瀏覽模式
* 每日執行基隆 CCTV 更新 workflow

目前最優先工作：

```text
確認基隆 GitHub Actions 每日排程可持續穩定執行
```

確認後，下一步為：

```text
完善搜尋模式
↓
決定下一個縣市
↓
整合下一縣市 CCTV
↓
規劃網站名稱與自有網域
```

```
```
