即時 CCTV 地圖專案狀態

專案版本： v2.3更新日期： 2026-07-23專案方向： 由雙北逐步擴充至北北基桃，未來可延伸至全臺長期營運方向： 完成核心功能與內容建置後，導入自有網域、搜尋流量分析與廣告變現

一、目前已完成的資料來源

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

桃園市 CCTV API 目前無法由 GitHub Actions 雲端主機穩定連線，因此資料暫時採本機手動更新。

二、目前前端功能

1. 縣市與行政區兩層篩選

目前操作流程：

縣市
↓
行政區

目前縣市選單可顯示：

全部縣市

臺北市

新北市

桃園市

行政區選單會依照選擇的縣市動態更新。

2. CCTV 類型篩選

目前支援：

全部 CCTV

道路 CCTV

水情 CCTV

水情租賃 CCTV

3. 地圖自動縮放

目前支援：

選擇縣市後，地圖縮放到該縣市

選擇行政區後，地圖縮放到該行政區

目前已支援：

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

搜尋位置名稱顯示於 Marker 資訊視窗

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

目前未顯示每支 CCTV 的距離文字，僅用於篩選與排序。

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

四、目前程式架構調整

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

目前縣市順序：

const CITY_ORDER = [
  "臺北市",
  "新北市",
  "基隆市",
  "桃園市"
];

只有實際已有 CCTV 資料的縣市才會顯示於選單。

五、Google Maps Platform 設定

目前已完成：

建立 Google Maps Platform API Key

啟用 Maps JavaScript API

啟用 Places API (New)

綁定有效帳單

設定 HTTP referrer 網站來源限制

設定 API 使用限制

本機開發網址已加入允許清單

目前使用的 API：

Maps JavaScript API

Places API (New)

注意事項：

API Key 不可公開貼在聊天、Issue 或文件中

若 API Key 曾公開，應立即更換

綁定自有網域後，需把正式網域加入允許來源

本機可保留 127.0.0.1 與 localhost 的來源限制

API Key 應持續保留網站來源限制與 API 限制

前端 API Key 即使使用自有網域仍可由瀏覽器查看，安全核心仍是來源限制、API 限制、配額與帳單警示

六、桃園 CCTV 更新方式

更新程式：

update-taoyuan-road-cctv.py

在 VS Code 終端機執行：

python update-taoyuan-road-cctv.py

成功後會更新：

taoyuan-road-cctv.json

接著使用 VS Code：

Commit
→ Push

操作教學位於：

docs/手動更新桃園CCTV資料.md

七、目前搜尋功能流程

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

八、近期執行順序

目前已決定依照下列順序推進：

完成基隆 CCTV

決定長期網站名稱

購買自己的網域

將自有網域綁定 GitHub Pages

加入「關於本站」、「使用說明」、「資料來源」、「隱私權政策」頁面

安裝 Google Search Console 與 Google Analytics

累積一段時間的真實流量

再申請 Google AdSense

通過後少量放置廣告

現階段原則：

網站仍繼續使用 GitHub Pages

暫時不搬移主機

優先完成資料、功能與內容品質

廣告不得遮擋地圖、搜尋框、CCTV 清單、播放按鈕或其他操作元件

在申請 AdSense 前，先補齊網站資訊頁與隱私權政策

九、待辦事項

最高優先：基隆市道路 CCTV

找到並確認基隆市官方道路 CCTV 資料來源

下載並檢查來源資料欄位

建立基隆市資料下載或更新程式

轉換成現有統一 CCTV 格式

產生 keelung-road-cctv.json

加入 loadData()

將基隆市行政區邊界加入判定

測試縣市與行政區篩選

測試縣市與行政區縮放

測試 Google 地點搜尋與附近 CCTV

測試基隆 CCTV 影像播放與 CORS

行政區邊界過濾需包含：

[
  "臺北市",
  "台北市",
  "新北市",
  "基隆市",
  "桃園市"
]

高優先：完善搜尋模式

確認「清除搜尋」按鈕可同步清空 Google 搜尋框文字

搜尋模式下切換 CCTV 類型時重新計算附近 CCTV

切換 CCTV 類型後保留搜尋位置 Marker

明確區分搜尋模式與縣市瀏覽模式

處理搜尋範圍內沒有 CCTV 的提示

確認清除搜尋後，縣市、行政區、Marker 與側邊欄全部正確恢復

建議建立狀態：

let viewMode = "browse"; // browse | search
let activeSearchPlace = null;
let activeSearchPosition = null;

中優先：自有網域與網站內容

決定長期網站名稱

選擇適合未來擴充至全臺的網域名稱

購買網域

將網域綁定 GitHub Pages

開啟 HTTPS

更新 Google API Key 正式網域來源限制

建立關於本站頁面

建立使用說明頁面

建立資料來源與更新時間頁面

建立隱私權政策頁面

規劃聯絡方式與常見問題頁面

中優先：流量分析與廣告準備

安裝 Google Search Console

安裝 Google Analytics

提交 Sitemap

設定網站標題、說明與分享資訊

觀察自然搜尋流量與使用者行為

累積一段時間的真實流量

確認網站內容與版面符合 AdSense 政策

通過 AdSense 後少量放置廣告

廣告位置避免造成誤點或妨礙地圖操作

其他中期待辦

評估桃園其他 CCTV 資料來源

加入 Marker Cluster

CCTV 載入效能優化

行動版搜尋介面優化

顯示資料最後更新時間

評估加入搜尋半徑選單

評估顯示 CCTV 距離

長期

擴充至北北基桃完整資料

評估整合北北基桃範圍內國道 CCTV

擴充至新竹及其他縣市

支援全臺 CCTV

統一各縣市資料更新流程

建立資料來源健康檢查

視流量與營運需求評估是否搬離 GitHub Pages

十、版本規劃

v2.0

新北市道路 CCTV

v2.1

縣市與行政區兩層篩選

行政區 Polygon 判定

縣市與行政區自動縮放

行政區判定與縮放流程重構

v2.2

桃園市道路 CCTV

桃園市行政區篩選

桃園市地圖縮放

桃園 HLS CCTV 播放

桃園手動更新工具與說明文件

v2.3

Google Maps 地點搜尋

Google Place Autocomplete

搜尋位置 Marker

1 公里內 CCTV 搜尋

距離排序

最多顯示 50 支 CCTV

地圖自動縮放顯示全部搜尋結果

清除搜尋與瀏覽模式恢復

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

北北基桃 CCTV 整合完成

評估北北基桃國道 CCTV 整合

v4.0

全臺 CCTV 架構

統一各縣市資料更新流程

建立資料來源健康檢查

十一、建議 Commit 訊息

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
feat: 新增基隆市 CCTV 資料更新流程

網站與網域：

chore: 設定自有網域並綁定 GitHub Pages
feat: 新增關於本站與使用說明頁面
feat: 新增資料來源與隱私權政策頁面
chore: 新增 Search Console 與 Analytics 設定

廣告準備：

chore: 完成 AdSense 申請前網站內容與版面調整
feat: 新增低干擾式廣告版位