NEXT_STEP.md

即時 CCTV 地圖專案交接

專案版本：v2.3

更新日期：2026-07-22

專案網址：https://jyj8f6h6z6-hub.github.io/taipei_CCTV2/

專案方向：由雙北逐步擴充至北北基桃，未來延伸至全臺

下一階段重點：完善搜尋模式、加入基隆市、評估整合國道 CCTV

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

已完成資料下載與整理

已完成縣市與行政區篩選

已完成地圖標記

已完成 CCTV 影像播放

已完成縣市與行政區自動縮放

桃園市 CCTV API 目前無法由 GitHub Actions 雲端主機穩定連線，因此暫時採本機手動更新。

二、目前前端功能

1. 縣市與行政區兩層篩選

目前操作流程：

縣市
↓
行政區

縣市選單目前可顯示：

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

正式部署後需加入正式網站網域

本機可保留 127.0.0.1 與 localhost

API Key 應持續保留網站來源限制與 API 限制

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

手動更新桃園CCTV資料.md

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

八、明天優先處理

第一優先：完善搜尋模式

確認「清除搜尋」按鈕會同步清空 Google 搜尋框文字

搜尋模式下切換 CCTV 類型時，重新計算附近 CCTV

切換 CCTV 類型後保留搜尋位置 Marker

明確區分搜尋模式與縣市瀏覽模式

搜尋範圍內沒有 CCTV 時顯示提示

確認清除搜尋後，縣市、行政區、Marker 與側邊欄全部正確恢復

建議先建立狀態：

let viewMode = "browse"; // browse | search
let activeSearchPlace = null;
let activeSearchPosition = null;

搜尋成功時：

viewMode = "search";

清除搜尋或切換縣市時：

viewMode = "browse";

第二優先：正式部署設定

正式部署後加入正式網域的 Google API Key 來源限制

將 Google Maps JavaScript API 改為建議的非同步載入方式

更新 HTML、CSS、JavaScript 快取版本號

確認 GitHub Pages 不會載入舊版快取

第三優先：基隆市

找到並確認基隆市道路 CCTV 資料來源

建立基隆市資料下載或更新程式

統一轉換成既有 CCTV 格式

加入 loadData()

將基隆市行政區邊界加入判定

測試縣市與行政區縮放

測試地點搜尋與附近 CCTV

行政區邊界過濾需包含：

[
  "臺北市",
  "台北市",
  "新北市",
  "基隆市",
  "桃園市"
]

九、國道 CCTV 整合方案

國道 CCTV 可以納入現有專案，但不建議由 GitHub Pages 前端直接呼叫 TDX API。

原因

TDX CCTV API 需要：

Client ID

Client Secret

Access Token

以上資訊不可放在前端 JavaScript，否則會公開。

建議流程

TDX 國道 CCTV API
↓
本機 Python 或 GitHub Actions 更新程式
↓
產生 freeway-cctv.json
↓
GitHub Pages 載入 JSON
↓
加入 allCams

GitHub Secrets

若使用 GitHub Actions，憑證放在：

TDX_CLIENT_ID
TDX_CLIENT_SECRET

禁止寫進：

script.js

Python 原始碼

JSON

README

Issue

Commit 訊息

建議國道資料格式

{
  key: "freeway-CCTV-N1-S-25.000-M",
  id: "CCTV-N1-S-25.000-M",
  name: "國道1號南向 25K",
  x: 121.5,
  y: 25.0,
  city: "新北市",
  district: "未判定",
  url: "https://example.com/live/index.m3u8",
  streamUrl: "https://example.com/live/index.m3u8",
  type: "freeway",
  source: "交通部 TDX",
  roadName: "國道1號",
  direction: "南向",
  mile: "25K"
}

建議新增 CCTV 類型：

type: "freeway"

篩選器可改成：

全部 CCTV

市區道路 CCTV

國道 CCTV

水情 CCTV

水情租賃 CCTV

建議新增檔案

update-freeway-cctv.py
freeway-cctv.json

前端需要修改

新增 FREEWAY_CCTV_URL

新增 freewayCams

新增 normalizeFreewayCams()

在 loadData() 載入 freeway-cctv.json

將 freewayCams 加入 allCams

在 cameraCounts 增加 freeway

在 CCTV 類型選單增加「國道 CCTV」

播放時優先使用 streamUrl || url

Popup 顯示國道路線、方向及里程

測試 HLS、MJPEG、HTTPS 與 CORS

建議播放網址處理

const mediaUrl = cam.streamUrl || cam.url;

國道串流可能限制

HLS CORS 不允許 GitHub Pages

串流網址具有時效性

來源限制 Referer

來源只支援 HTTP

部分來源為 MJPEG

部分攝影機暫時離線

無法直接播放時，應顯示：

開啟官方影像

不要使用 GitHub Actions 或 GitHub Pages 代理影片串流。

第一階段範圍

先只納入北北基桃範圍內的國道 CCTV，避免一次載入全臺資料。

十、中期待辦

加入 Marker Cluster

CCTV 載入效能優化

行動版搜尋介面優化

顯示各資料來源最後更新時間

評估加入搜尋半徑選單

評估顯示 CCTV 距離

評估桃園其他 CCTV 資料來源

建立資料來源健康檢查

統一各縣市資料更新流程

十一、版本規劃

v2.4

基隆市道路 CCTV

Marker Cluster

效能優化

搜尋模式細節完善

v2.5

新增 TDX 國道 CCTV

新增國道 CCTV 類型篩選

顯示國道路線、方向與里程

建立 TDX 更新流程

顯示資料更新時間

v3.0

北北基桃市區與國道 CCTV 整合完成

v4.0

全臺 CCTV 架構

統一各縣市資料更新流程

建立資料來源健康檢查

十二、建議 Commit 訊息

搜尋功能：

feat: 新增 Google 地點搜尋與附近 CCTV 查詢

feat: 顯示搜尋地點 1 公里內 CCTV 並自動縮放地圖

feat: 新增清除地點搜尋並恢復 CCTV 瀏覽模式

搜尋修正：

fix: 移除重複的 Google 地點搜尋初始化函式

fix: 修正 Google 地點建議清單被地圖遮擋

fix: 搜尋模式切換 CCTV 類型後重新計算結果

基隆市：

feat: 新增基隆市道路 CCTV

國道 CCTV：

feat: 新增 TDX 國道 CCTV 資料與地圖顯示

feat: 新增國道 CCTV 自動更新流程

chore: 使用 GitHub Secrets 管理 TDX API 憑證

十三、明天開工建議順序

測試「清除搜尋」是否真的清空 Google 搜尋框。

建立 viewMode，明確區分搜尋與瀏覽模式。

修正搜尋模式下切換 CCTV 類型的行為。

補上「附近沒有 CCTV」提示。

更新前端快取版本號並部署測試。

開始整理基隆市 CCTV 資料來源。

建立 update-freeway-cctv.py 空白骨架。

註冊或確認 TDX 應用程式憑證。

先抓少量國道 CCTV 測試資料。

確認國道串流在 GitHub Pages 的播放與 CORS 狀況。

十四、下班前狀態摘要

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

下一次工作先完善搜尋狀態管理，再進入基隆市與國道 CCTV 整合