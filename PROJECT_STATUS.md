即時 CCTV 地圖專案狀態

專案版本：v2.3

更新日期：2026-07-22

專案方向：由雙北逐步擴充至北北基桃，未來可延伸至全臺

一、目前已完成的資料來源

臺北市

道路 CCTV

水情 CCTV

水情租賃 CCTV

新北市

道路 CCTV

桃園市

道路 CCTV

已完成資料下載與整理。

已完成縣市與行政區篩選。

已完成地圖標記。

已完成 CCTV 影像播放。

已完成縣市與行政區自動縮放。

桃園市 CCTV API 目前無法由 GitHub Actions 雲端主機穩定連線，因此資料暫時採本機手動更新。

二、目前前端功能

1. 縣市與行政區兩層篩選

原本臺北市與新北市共用一個行政區選單，現已改為：

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

選擇縣市
→ 地圖縮放到該縣市

選擇行政區
→ 地圖縮放到該行政區

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

目前搜尋半徑設定為：

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

搜尋附近 CCTV 時，會暫時新增：

distance: 350

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

正式部署後需加入正式網站網域

本機可保留 127.0.0.1 與 localhost 的來源限制

API Key 應持續保留網站來源限制與 API 限制

六、桃園 CCTV 更新方式

更新程式：

update-taoyuan-road-cctv.py

執行方式：

在 VS Code 終端機執行：

python update-taoyuan-road-cctv.py

成功後會更新：

taoyuan-road-cctv.json

接著使用 VS Code：

Commit
→ Push

操作教學：

專案內另有：

手動更新桃園CCTV資料.md

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

八、待辦事項

高優先

確認「清除搜尋」按鈕可同步清空 Google 搜尋框文字

搜尋模式下切換 CCTV 類型時重新計算並保留搜尋位置

明確區分搜尋模式與縣市瀏覽模式

處理搜尋範圍內沒有 CCTV 的提示

正式部署後加入正式網域的 API Key 來源限制

將 Google Maps JavaScript API 改為建議的非同步載入方式

更新 HTML、CSS、JavaScript 快取版本號

中優先

加入基隆市道路 CCTV

評估桃園其他 CCTV 資料來源

加入 Marker Cluster

CCTV 載入效能優化

行動版搜尋介面優化

顯示資料最後更新時間

評估是否加入搜尋半徑選單

評估是否顯示 CCTV 距離

長期

擴充至北北基桃完整資料

擴充至新竹

擴充至其他縣市

支援全臺 CCTV

統一各縣市資料更新流程

建立資料來源健康檢查

九、版本規劃

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

v3.0

北北基桃 CCTV 整合完成

v4.0

全臺 CCTV 架構

十、建議 Commit 訊息

完成 Google 地點搜尋可使用：

feat: 新增 Google 地點搜尋與附近 CCTV 查詢

完成 1 公里搜尋與地圖縮放可使用：

feat: 顯示搜尋地點 1 公里內 CCTV 並自動縮放地圖

完成清除搜尋功能可使用：

feat: 新增清除地點搜尋並恢復 CCTV 瀏覽模式

修正重複搜尋函式可使用：

fix: 移除重複的 Google 地點搜尋初始化函式

修正建議清單層級可使用：

fix: 修正 Google 地點建議清單被地圖遮擋