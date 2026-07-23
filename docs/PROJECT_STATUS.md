即時 CCTV 地圖專案狀態

專案版本：v2.5 開發中更新日期：2026-07-23專案方向：由北北基桃擴充至宜蘭，未來逐步延伸至全臺長期營運方向：完成核心功能、資料品質與內容建置後，導入自有網域、搜尋流量分析與廣告變現

一、目前已完成的資料來源

臺北市

道路 CCTV

水情 CCTV

水情租賃 CCTV

新北市

道路 CCTV

基隆市

道路 CCTV

桃園市

道路 CCTV

宜蘭縣

道路 CCTV

已建立 yilan-road-cctv.json

twipcam 提供名稱、座標與 JPG 預覽圖

宜蘭縣政府警察局公開即時路況頁面提供官方播放器 did

GitHub Actions 已可自動下載、解析、配對並更新 JSON

目前已支援臺北市、新北市、基隆市、桃園市及宜蘭縣。

二、目前前端功能

1. 縣市與行政區兩層篩選

操作流程：

縣市
↓
行政區

目前縣市選單包含：

全部縣市

臺北市

新北市

基隆市

桃園市

宜蘭縣

CITY_ORDER 已加入：

const CITY_ORDER = [
  "臺北市",
  "新北市",
  "基隆市",
  "桃園市",
  "宜蘭縣"
];

宜蘭縣行政區可保留「市、鎮、鄉」尾碼，normalizeDistrict() 已調整為支援：

/[區市鎮鄉]$/

2. 行政區邊界與地圖縮放

目前行政區邊界已包含：

臺北市

新北市

基隆市

桃園市

宜蘭縣

已修正「找不到縣市邊界：宜蘭縣」問題。

目前支援：

選擇縣市後縮放至該縣市

選擇行政區後縮放至該行政區

選擇全部縣市後顯示全部支援範圍

3. CCTV 類型篩選

目前支援：

全部 CCTV

道路 CCTV

水情 CCTV

水情租賃 CCTV

水情與水情租賃資料目前仍主要屬於臺北市。

4. CCTV 清單與地圖同步

目前已完成：

側邊欄依縣市與行政區分組

顯示各行政區 CCTV 數量

點擊側邊欄 CCTV 可移動至地圖位置

點擊地圖 Marker 可開啟 CCTV 資訊

點擊 CCTV 後同步反白側邊欄項目

可開啟 CCTV 影像

支援 HLS .m3u8 串流

無可用影像網址時顯示提示

JPG 快照可作為預覽或無官方播放器時的備援

5. 我的定位

目前已完成：

取得使用者目前位置

顯示「我的位置」Marker

將地圖放大至使用者位置

找出距離目前位置最近的 CCTV

顯示最近 CCTV 名稱、類型與距離

已修正第一次點擊「我的位置」時，地圖縮放可能被全縣市縮放覆蓋的問題。

6. Google Maps 地點搜尋

目前已完成：

Google Place Autocomplete

搜尋範圍限制為臺灣

可搜尋地址、路口、車站、地標、店家與公園

取得地點名稱、地址與座標

Leaflet 顯示搜尋位置 Marker

計算搜尋位置附近 CCTV

依距離由近到遠排序

地圖與側邊欄只顯示搜尋範圍內 CCTV

地圖自動縮放至搜尋位置與附近 CCTV

最多顯示 50 支 CCTV

清除搜尋後恢復瀏覽模式

切換縣市時離開搜尋模式

修正 Google 地點建議清單被 Leaflet 遮住的問題

目前搜尋半徑：

3 公里

三、宜蘭縣 CCTV 整合狀態

1. 資料來源

宜蘭資料由兩個來源合併：

twipcam
→ 名稱
→ 經緯度
→ JPG 預覽圖

宜蘭縣政府警察局公開即時路況
→ 官方攝影機 did
→ 官方 HLS 播放器頁面

官方播放器網址格式：

https://ilcpb.ivs.hinet.net/public/hls_player?page=ilcpb&did=攝影機編號

2. GitHub Actions 更新流程

已建立：

.github/workflows/update-yilan-road-cctv.yml

目前 workflow 可執行：

下載 twipcam 公開 JSON
↓
下載宜蘭警察局公開清單 HTML
↓
解析官方攝影機名稱與 did
↓
依名稱與描述進行配對
↓
產生 yilan-road-cctv.json
↓
驗證資料與配對數量
↓
有變更時自動 commit、push

宜蘭更新流程不使用 Python，主要使用：

YAML

Shell

curl

jq

Perl

3. 官方網站連線處理

宜蘭官方網站曾在 GitHub Actions 出現：

curl: (35) Recv failure: Connection reset by peer

目前已調整：

強制 HTTP/1.1

限制 TLS 1.2

限制最大等待時間

降低重試次數

加入瀏覽器 User-Agent

官方伺服器仍可能偶爾不穩，後續應保留上一版資料作為更新失敗時的備援。

4. 宜蘭資料數量與配對結果

目前 twipcam 宜蘭道路 CCTV：

84 支

宜蘭官方清單解析結果：

89 筆

最新 GitHub Actions 配對結果：

成功配對官方播放器：82
尚未配對官方播放器：2

成功配對率約為：

97.6%

尚未配對的兩支：

ila-000020
台7線 大同鄉英士橋東端(5)-全景(往宜蘭方向)

ila-000083
羅東夜市 羅東鎮興東路、民權路口(5)-全景(往屈辰氏)

這兩支目前應保留 twipcam JPG 快照，不強制猜測官方 did，避免接錯攝影機。

5. 宜蘭 JSON 新增欄位

宜蘭資料目前包含：

{
  key: "yilan-road-ila-000001",
  id: "ila-000001",
  officialId: "1140804405",
  name: "攝影機名稱",
  x: 121.791,
  y: 24.8384,
  city: "宜蘭縣",
  district: "頭城鎮",
  imageUrl: "twipcam JPG 預覽圖",
  url: "宜蘭官方播放器網址",
  streamUrl: "宜蘭官方播放器網址",
  type: "road",
  source: "資料來源說明"
}

欄位用途：

officialId：宜蘭官方攝影機 did

imageUrl：twipcam JPG 預覽圖

url：使用者點擊後開啟的網址

streamUrl：官方播放器網址

6. 本機同步狀態

GitHub Actions 已產生 82 支配對版本，但本機曾仍停留在 32 支配對的舊版 JSON。

下次開工先執行：

git pull origin main

確認 yilan-road-cctv.json 已同步至最新版本。

四、目前資料結構

共用 CCTV 資料逐步統一為：

{
  key: "唯一識別值",
  id: "攝影機編號",
  name: "攝影機名稱或位置",
  x: 121.5,
  y: 25.0,
  city: "縣市名稱",
  district: "行政區",
  url: "影像或播放器網址",
  streamUrl: "串流或播放器網址",
  type: "road",
  source: "資料來源"
}

宜蘭額外使用：

{
  officialId: "官方 did",
  imageUrl: "JPG 預覽圖"
}

搜尋附近 CCTV 時會暫時新增：

{
  distance: 350
}

distance 單位為公尺。

五、目前程式架構

目前已完成：

共用 normalizeCity()

共用 normalizeDistrict()

normalizeDistrict() 支援區、市、鎮、鄉

CITY_ORDER

buildCityOptions()

buildSourceOptions()

buildDistrictOptions()

縣市與行政區動態選單

CCTV 類型動態選單

filteredCams() 支援縣市、行政區與類型條件

zoomToCity()

zoomToDistrict()

行政區 Polygon 判定

臺北、新北、基隆、桃園、宜蘭行政區邊界

cameraCounts 快取統計

桃園道路 CCTV 接入 loadData()

基隆道路 CCTV 接入 loadData()

宜蘭道路 CCTV 接入 loadData()

normalizeKeelungRoad()

normalizeYilanRoad() 基本版本

宜蘭資料加入 allCams

宜蘭資料加入道路 CCTV 數量統計

Google 地點搜尋

搜尋位置 Marker

3 公里搜尋半徑

搜尋結果距離排序

搜尋結果最多 50 支

清除搜尋流程

修正搜尋建議清單層級

修正我的位置縮放競爭問題

六、各縣市 CCTV 更新方式

桃園市道路 CCTV

更新程式：

update-taoyuan-road-cctv.py

執行：

python update-taoyuan-road-cctv.py

輸出：

taoyuan-road-cctv.json

目前仍採本機手動更新。

基隆市道路 CCTV

更新程式：

update-keelung-road-cctv.py

輸出：

keelung-road-cctv.json

已建立 GitHub Actions 每日更新流程，並曾成功由 github-actions[bot] commit、push。

宜蘭縣道路 CCTV

輸出：

yilan-road-cctv.json

更新流程：

.github/workflows/update-yilan-road-cctv.yml

已完成：

定時排程

手動執行 workflow_dispatch

twipcam JSON 下載

官方清單 HTML 下載

官方 did 解析

名稱配對

JSON 驗證

配對統計

自動 commit 與 push

七、目前已知問題

1. 宜蘭本機 JSON 尚需確認同步

GitHub Actions 已產生 82 支配對版本，但本機曾仍為舊版。

下次先執行：

git pull origin main

2. normalizeYilanRoad() 尚需完成最終確認

需確認前端完整保留：

officialId
imageUrl
url
streamUrl

建議結構：

officialId: String(cam.officialId || "").trim(),
imageUrl: String(cam.imageUrl || "").trim(),
url: String(cam.url || cam.imageUrl || "").trim(),
streamUrl: String(cam.streamUrl || "").trim()

3. 宜蘭播放器尚需前端實機測試

需確認：

已配對的 82 支會開啟官方播放器

未配對的 2 支會開啟 JPG 快照

手機與桌面瀏覽器皆可正常操作

官方播放器頁面 HTTPS 正常

不會誤把播放器頁面當作 .m3u8 直接交給 HLS.js

4. 宜蘭官方網站偶爾重設 TLS 連線

需持續觀察 GitHub Actions 排程穩定性，並考慮：

下載失敗時沿用上一版官方對照資料

保存官方 did 對照 JSON

更新失敗時不覆蓋既有 yilan-road-cctv.json

建立失敗通知

5. GitHub Actions Node.js 警告

actions/checkout@v4 可能顯示 Node.js 20 已淘汰警告，但目前 GitHub 會強制以 Node.js 24 執行。

這是警告，不是目前 workflow 失敗原因。後續可再依官方版本更新 actions/checkout。

八、最高優先待辦

下次開工第一步：完成宜蘭前端播放

執行：

git pull origin main

確認 yilan-road-cctv.json：

成功配對 82
未配對 2

修改或確認 normalizeYilanRoad() 保留：

officialId
imageUrl
url
streamUrl

儲存 script.js。

瀏覽器執行強制重新整理：

Ctrl + Shift + R

測試宜蘭第一支 CCTV：

ila-000001
did=1140804405

確認按鈕開啟：

https://ilcpb.ivs.hinet.net/public/hls_player?page=ilcpb&did=1140804405

測試未配對的兩支是否仍可開啟 JPG。

第二優先：強化宜蘭更新可靠性

保存 yilan-official-cams.json 作為備援

官方網站下載失敗時沿用上次資料

避免下載失敗覆蓋有效 JSON

檢查排程是否每日穩定執行

顯示資料最後更新時間

建立 workflow 失敗通知

第三優先：完善搜尋模式

明確建立 browse／search 狀態

搜尋模式切換 CCTV 類型後重新計算結果

保留搜尋位置 Marker

無附近 CCTV 時顯示提示

清除搜尋後完整恢復縣市、行政區、Marker 與側邊欄

評估顯示每支 CCTV 距離

評估搜尋半徑選單

九、近期執行順序

拉回 GitHub Actions 產生的最新宜蘭 JSON

完成 normalizeYilanRoad() 欄位保留

測試 82 支官方播放器

測試 2 支 JPG fallback

Commit 宜蘭前端整合

觀察宜蘭 GitHub Actions 定時排程

建立官方 did 對照資料備援

持續觀察基隆定時更新

完善搜尋模式狀態管理

再決定下一個縣市

規劃自有網域與網站內容頁面

十、版本規劃

v2.4

基隆市道路 CCTV

基隆市行政區篩選與縮放

基隆市資料更新程式

基隆市 GitHub Actions 更新

修正我的位置第一次縮放問題

v2.5 開發中

宜蘭縣道路 CCTV

宜蘭縣行政區篩選與縮放

宜蘭 twipcam 座標與預覽圖

宜蘭官方播放器 did 解析

宜蘭 GitHub Actions 自動更新

宜蘭名稱配對與播放器網址合併

82／84 支官方播放器配對

2 支 JPG fallback

宜蘭前端播放器最終驗證

搜尋模式狀態管理完善

v2.6

Marker Cluster

CCTV 載入效能優化

自有網域與 GitHub Pages 綁定

關於本站

使用說明

資料來源與更新時間

隱私權政策

Google Search Console

Google Analytics

SEO 基礎設定

v2.7

累積真實流量

AdSense 申請準備

通過後少量放置廣告

v3.0

北北基桃宜 CCTV 整合穩定

評估國道 CCTV 整合

下一批縣市擴充

v4.0

全臺 CCTV 架構

統一各縣市資料更新流程

資料來源健康檢查

更新失敗通知

十一、建議 Commit 訊息

宜蘭資料整合

feat: 新增宜蘭縣道路 CCTV
feat: 新增宜蘭 CCTV 自動更新流程
feat: 合併宜蘭官方 CCTV 播放器網址
fix: 改善宜蘭 CCTV 官方播放器配對
fix: 修正宜蘭官方網站 TLS 下載設定
fix: 修正宜蘭官方 CCTV 中文編碼

宜蘭前端

feat: 新增宜蘭縣 CCTV 前端資料整合
feat: 支援宜蘭官方播放器與 JPG 預覽圖
fix: 保留宜蘭 officialId 與 imageUrl 欄位
fix: 修正宜蘭縣行政區邊界與縮放

更新可靠性

chore: 保存宜蘭官方 CCTV did 對照資料
fix: 宜蘭官方來源失敗時沿用上一版資料
chore: 驗證宜蘭 CCTV 每日更新排程

十二、目前狀態摘要

目前專案已可顯示：

臺北市
新北市
基隆市
桃園市
宜蘭縣

宜蘭縣目前已完成：

JSON 建立

縣市選單

行政區邊界

地圖縮放

GitHub Actions 更新流程

官方清單下載

官方 did 解析

名稱配對

82 支官方播放器網址

2 支 JPG fallback