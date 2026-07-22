PROJECT_STATUS.md

即時 CCTV 地圖專案狀態

專案版本：v2.2

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

已完成資料下載與整理

已完成縣市與行政區篩選

已完成地圖標記

已完成 CCTV 影像播放

已完成縣市與行政區自動縮放

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

四、目前程式架構調整

已完成

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

目前縣市順序

const CITY_ORDER = [
  "臺北市",
  "新北市",
  "基隆市",
  "桃園市"
];

只有實際已有 CCTV 資料的縣市才會顯示於選單。

五、桃園 CCTV 更新方式

更新程式

update-taoyuan-road-cctv.py

執行方式

在 VS Code 終端機執行：

python update-taoyuan-road-cctv.py

成功後會更新：

taoyuan-road-cctv.json

接著使用 VS Code：

Commit
→ Push

操作教學

專案內另有：

手動更新桃園CCTV資料.md

六、下一階段架構調整

搜尋欄用途重新定義

目前搜尋欄原本用於：

搜尋 CCTV 名稱
搜尋路名
搜尋行政區

下一階段將改為：

Google Maps 地點搜尋
↓
取得搜尋位置座標
↓
Leaflet 地圖移動至該位置
↓
計算附近 CCTV
↓
依距離排序並顯示

預計搜尋內容

地址

路口

車站

地標

店家

公園

其他 Google Maps 可搜尋的地點

預計搜尋結果

搜尋位置
附近 CCTV 數量
CCTV 距離
依距離由近到遠排序

預計新增功能

Google Place Autocomplete

搜尋位置標記

附近 CCTV 半徑篩選

CCTV 距離計算

側邊欄距離排序

清除搜尋定位

搜尋模式與縣市瀏覽模式切換

建議第一版設定

搜尋半徑：3 公里
最多顯示：50 支
排序方式：由近到遠

七、待辦事項

高優先

將搜尋欄改為 Google Maps 地點搜尋

取得 Google Maps Platform API Key

設定 API Key 網站來源限制

加入 Place Autocomplete

新增搜尋位置 Marker

計算搜尋位置附近 CCTV

依距離排序側邊欄

顯示 CCTV 距離

新增清除搜尋功能

中優先

加入基隆市道路 CCTV

評估桃園其他 CCTV 資料來源

加入 Marker Cluster

CCTV 載入效能優化

行動版搜尋介面優化

顯示資料最後更新時間

長期

擴充至北北基桃完整資料

擴充至新竹

擴充至其他縣市

支援全臺 CCTV

統一各縣市資料更新流程

建立資料來源健康檢查

八、版本規劃

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

附近 CCTV 搜尋

距離排序與搜尋位置標記

v2.4

基隆市道路 CCTV

Marker Cluster

效能優化

v3.0

北北基桃 CCTV 整合完成

v4.0

全臺 CCTV 架構

九、建議 Commit 訊息

目前完成桃園整合可使用：

feat: 新增桃園市道路 CCTV 與行政區篩選

目前架構整理可使用：

refactor: 擴充多縣市篩選與地圖縮放架構

開始搜尋功能時可使用：

feat: 新增 Google 地點搜尋與附近 CCTV 查詢