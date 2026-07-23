即時 CCTV 地圖專案交接

專案版本： v2.3更新日期： 2026-07-23專案網址： https://jyj8f6h6z6-hub.github.io/taipei_CCTV2/專案方向： 由雙北逐步擴充至北北基桃，未來延伸至全臺下一階段核心目標： 完成基隆市 CCTV，之後建立自有網域、網站內容與流量分析，再評估廣告變現

一、目前已完成

資料來源

臺北市

道路 CCTV

水情 CCTV

水情租賃 CCTV

新北市

道路 CCTV

桃園市

道路 CCTV

目前已完成：

資料下載與整理

縣市與行政區篩選

地圖標記

CCTV 影像播放

縣市與行政區自動縮放

桃園市 CCTV API 目前無法由 GitHub Actions 雲端主機穩定連線，因此暫時採本機手動更新。

二、目前前端功能

1. 縣市與行政區兩層篩選

縣市
↓
行政區

目前縣市選單可顯示：

全部縣市

臺北市

新北市

桃園市

行政區選單會依選擇的縣市動態更新。

目前縣市順序：

const CITY_ORDER = [
  "臺北市",
  "新北市",
  "基隆市",
  "桃園市"
];

只有實際已有 CCTV 資料的縣市會顯示於選單。

2. CCTV 類型篩選

目前支援：

全部 CCTV

道路 CCTV

水情 CCTV

水情租賃 CCTV

3. 地圖自動縮放

目前支援：

選擇縣市後縮放到該縣市

選擇行政區後縮放到該行政區

已支援：

臺北市

新北市

桃園市

4. CCTV 清單與地圖同步

側邊欄依行政區分組

點擊清單可移動至 CCTV

點擊地圖標記可開啟 CCTV 資訊

CCTV 可正常播放

支援 HLS .m3u8 串流

5. 我的定位

可取得使用者目前位置

可搜尋距離目前位置最近的 CCTV

可顯示最近 CCTV 的距離

6. Google Maps 地點搜尋

已完成：

Google Place Autocomplete

搜尋範圍限制為臺灣

可搜尋地址、路口、車站、地標、店家、公園等地點

點選 Google 建議地點後取得座標

Leaflet 地圖移動至搜尋位置

顯示搜尋位置 Marker

Marker 資訊視窗顯示搜尋位置名稱

計算搜尋位置附近 CCTV

依距離由近到遠排序

地圖只顯示搜尋範圍內 CCTV

側邊欄只顯示搜尋範圍內 CCTV

地圖自動縮放，讓搜尋位置與附近 CCTV 同時顯示

最多顯示 50 支 CCTV

新增「清除搜尋」功能

切換縣市時可恢復原本瀏覽模式

目前搜尋半徑：

1 公里

目前未顯示每支 CCTV 的距離文字，距離只用於篩選與排序。

三、目前資料結構

所有 CCTV 資料逐步統一為：

{
  key: "唯一識別值",
  id: "攝影機編號",
  name: "攝影機名稱或位置",
  x: 121.5,
  y: 25.0,
  city: "桃園市",
  district: "中壢區",
  url: "影像網址",
  streamUrl: "串流網址",
  type: "road",
  source: "資料來源"
}

重要共用欄位：

city

district

type

source

url

streamUrl

搜尋附近 CCTV 時，會暫時新增：

{
  distance: 350
}

單位為公尺。

四、目前程式架構

已完成：

使用共用 normalizeCity()

使用共用 normalizeDistrict()

新增 CITY_ORDER

新增 buildCityOptions()

行政區選單改為依縣市動態建立

filteredCams() 同時支援縣市與行政區條件

zoomToCity() 支援縣市縮放

zoomToDistrict() 同時使用縣市與行政區判定

行政區邊界已加入桃園市

cameraCounts 使用快取方式統計

桃園道路 CCTV 已加入 loadData()

搜尋欄已由舊 CCTV 文字搜尋改為 Google 地點搜尋

新增 initPlaceAutocomplete()

使用 gmp-select 取得 Google 地點選取結果

使用 place.fetchFields() 取得地點名稱、地址與座標

新增搜尋位置 Marker

沿用 distanceInMeters() 計算 CCTV 距離

新增 findNearbyCams()

新增搜尋結果地圖自動縮放

新增清除搜尋流程

已移除重複的 initPlaceAutocomplete() 舊函式

已處理 Google 建議清單被 Leaflet 地圖遮住的 z-index 問題

五、Google Maps Platform 設定

目前已完成：

建立 Google Maps Platform API Key

啟用 Maps JavaScript API

啟用 Places API (New)

綁定有效帳單

設定 HTTP referrer 網站來源限制

設定 API 使用限制

本機開發網址已加入允許清單

目前使用：

Maps JavaScript API

Places API (New)

注意事項：

API Key 不可公開貼在聊天、Issue 或文件中

API Key 若曾公開，應立即更換

綁定自有網域後，需加入正式網域來源限制

本機可保留 127.0.0.1 與 localhost

API Key 應持續保留網站來源限制與 API 限制

自有網域不能隱藏前端 API Key，仍需搭配來源限制、API 限制、配額與帳單警示

六、桃園 CCTV 更新方式

更新程式：

update-taoyuan-road-cctv.py

執行方式：

python update-taoyuan-road-cctv.py

成功後會更新：

taoyuan-road-cctv.json

接著在 VS Code 執行：

Commit
→ Push

詳細操作說明：

docs/手動更新桃園CCTV資料.md

七、目前搜尋流程

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
計算 1 公里內 CCTV
↓
依距離由近到遠排序
↓
最多保留 50 支
↓
更新側邊欄與 CCTV Marker
↓
地圖自動縮放至搜尋位置與附近 CCTV

搜尋模式下：

側邊欄只顯示附近 CCTV

地圖只顯示附近 CCTV

搜尋位置會顯示獨立 Marker

清除搜尋後恢復縣市與行政區瀏覽模式

八、下一階段固定執行順序

目前已決定依照以下順序處理：

完成基隆 CCTV

決定長期網站名稱

購買自己的網域

網域先綁定 GitHub Pages

加入關於、使用說明、資料來源、隱私權頁面

安裝 Search Console 與 Analytics

累積一段時間的真實流量

再申請 AdSense

通過後少量放置廣告

執行原則：

現階段不搬離 GitHub Pages

先完成網站功能、內容與穩定度

自有網域主要用於品牌、網址穩定與長期經營

申請 AdSense 前需補齊內容頁、資料來源與隱私權政策

廣告不得遮擋地圖、搜尋框、播放按鈕或 CCTV 清單

九、下一次開工：基隆市 CCTV

第一階段：確認資料來源

找到基隆市官方道路 CCTV 資料來源

確認資料下載網址與更新頻率

下載來源 CSV、JSON 或其他格式

檢查攝影機編號、名稱、經緯度與串流網址欄位

確認是否有行政區欄位

確認串流格式、HTTPS 與 CORS

第二階段：建立資料更新流程

建議新增：

update-keelung-road-cctv.py
keelung-road-cctv.json

統一資料格式：

{
  key: "keelung-road-攝影機編號",
  id: "攝影機編號",
  name: "道路名稱或位置",
  x: 121.7,
  y: 25.1,
  city: "基隆市",
  district: "未判定",
  url: "影像網址",
  streamUrl: "影像網址",
  type: "road",
  source: "基隆市政府"
}

第三階段：接入前端

新增 KEELUNG_ROAD_API_URL

新增基隆市資料標準化函式

在 loadData() 載入 keelung-road-cctv.json

將基隆 CCTV 加入 allCams

將基隆 CCTV 數量加入 cameraCounts

確認縣市選單自動顯示基隆市

第四階段：加入行政區邊界

行政區邊界過濾需包含：

[
  "臺北市",
  "台北市",
  "新北市",
  "基隆市",
  "桃園市"
]

測試：

基隆市縣市縮放

基隆市行政區縮放

行政區判定

側邊欄行政區分組

Google 地點搜尋

1 公里內附近 CCTV

CCTV 播放

十、搜尋模式仍需完善

建議建立狀態：

let viewMode = "browse"; // browse | search
let activeSearchPlace = null;
let activeSearchPosition = null;

搜尋成功時：

viewMode = "search";

清除搜尋或切換縣市時：

viewMode = "browse";

待處理：

確認「清除搜尋」按鈕會同步清空 Google 搜尋框文字

搜尋模式下切換 CCTV 類型時，重新計算附近 CCTV

切換 CCTV 類型後保留搜尋位置 Marker

明確區分搜尋模式與縣市瀏覽模式

搜尋範圍內沒有 CCTV 時顯示提示

確認清除搜尋後，縣市、行政區、Marker 與側邊欄全部正確恢復

十一、自有網域與網站內容階段

基隆市完成後再開始：

1. 決定長期網站名稱

原則：

不要只限定臺北市

可支援北北基桃與未來全臺擴充

名稱容易記憶與輸入

避免與政府官方網站混淆

2. 購買網域並綁定 GitHub Pages

網站程式與資料仍保留在 GitHub

自有網域指向 GitHub Pages

開啟 HTTPS

確認原 GitHub Pages 網址與新網域導向正常

更新 Google API Key 允許來源

3. 補齊內容頁面

至少加入：

關於本站

使用說明

資料來源與更新時間

隱私權政策

建議後續加入：

聯絡方式

常見問題

免責聲明

各縣市 CCTV 資料說明

十二、Search Console、Analytics 與廣告準備

Search Console

驗證網站所有權

提交 Sitemap

觀察索引狀態

觀察搜尋關鍵字與點擊

Google Analytics

安裝追蹤碼

觀察每日使用者

觀察熱門搜尋與熱門地區

觀察手機版與桌面版比例

觀察使用者停留時間

AdSense 前置條件

網站功能穩定

有清楚的原創說明內容

有資料來源與更新說明

有隱私權政策

有一段時間的真實流量

頁面不能只是單一廣告載體

廣告不能妨礙地圖與 CCTV 操作

通過後先少量放置廣告，避免：

廣告覆蓋地圖

廣告緊貼播放按鈕

廣告混入 CCTV 清單造成誤點

手機版廣告遮擋主要操作區

十三、國道 CCTV 整合方案

國道 CCTV 可以納入現有專案，但目前優先順序排在基隆、自有網域與網站內容之後。

不建議由 GitHub Pages 前端直接呼叫 TDX API。

原因：

TDX CCTV API 需要：

Client ID

Client Secret

Access Token

以上資訊不可放在前端 JavaScript，否則會公開。

建議流程：

TDX 國道 CCTV API
↓
本機 Python 或 GitHub Actions 更新程式
↓
產生 freeway-cctv.json
↓
GitHub Pages 載入 JSON
↓
加入 allCams

GitHub Secrets：

TDX_CLIENT_ID
TDX_CLIENT_SECRET

禁止寫進：

script.js

Python 原始碼

JSON

README

Issue

Commit 訊息

建議新增：

update-freeway-cctv.py
freeway-cctv.json

第一階段先只納入北北基桃範圍內的國道 CCTV，避免一次載入全臺資料。

十四、版本規劃

v2.4

基隆市道路 CCTV

Marker Cluster

效能優化

搜尋模式細節完善

v2.5

自有網域與 GitHub Pages 綁定

關於本站、使用說明、資料來源與隱私權頁面

Google Search Console

Google Analytics

SEO 基礎設定

v2.6

累積真實流量

AdSense 申請準備

通過後少量放置廣告

v3.0

北北基桃市區 CCTV 整合完成

評估北北基桃國道 CCTV

v4.0

全臺 CCTV 架構

統一各縣市資料更新流程

建立資料來源健康檢查

十五、建議 Commit 訊息

基隆市：

feat: 新增基隆市道路 CCTV
feat: 新增基隆市 CCTV 資料更新流程
fix: 修正基隆市行政區判定與縮放

搜尋修正：

fix: 搜尋模式切換 CCTV 類型後重新計算結果
fix: 清除地點搜尋時同步重設搜尋框與地圖狀態
feat: 新增搜尋範圍內無 CCTV 的提示

網站與網域：

chore: 設定自有網域並綁定 GitHub Pages
feat: 新增關於本站與使用說明頁面
feat: 新增資料來源與隱私權政策頁面
chore: 新增 Search Console 與 Analytics 設定

廣告準備：

chore: 完成 AdSense 申請前網站內容與版面調整
feat: 新增低干擾式廣告版位

十六、下一次開工建議順序

確認基隆市官方道路 CCTV 資料來源

下載來源資料並檢查欄位

建立 update-keelung-road-cctv.py

產生 keelung-road-cctv.json

將基隆資料加入 loadData()

將基隆市加入行政區邊界過濾

測試基隆縣市與行政區縮放

測試基隆地點搜尋與附近 CCTV

測試基隆 CCTV 播放

基隆完成後再開始討論網站名稱與網域

十七、目前狀態摘要

目前 v2.3 核心功能已完成，可正常：

顯示臺北、新北、桃園 CCTV

依縣市與行政區篩選

播放 CCTV

取得使用者位置

使用 Google 地點搜尋

搜尋 1 公里內 CCTV

依距離排序

同步更新地圖與側邊欄

清除搜尋並恢復瀏覽模式

下一次工作以「完成基隆市道路 CCTV」為第一優先。

基隆完成後，再依序進行網站名稱、自有網域、內容頁面、Search Console、Analytics、流量累積與 AdSense。