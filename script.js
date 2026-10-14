/* =========================================================
 * 網站版本
 * 每次發布更新時：
 *   1. 修改這裡的版號與日期
 *   2. index.html 裡兩個 ?v= 改成相同版號
 *   3. 在 CHANGELOG.md 記錄這次改了什麼
 * ========================================================= */

const APP_VERSION = "2.1.0";
const APP_UPDATED = "2026-10-14";


/* =========================================================
 * 資料來源網址
 * ========================================================= */

const ROAD_API_URL = "./data/cctv.json";
const NEWTAIPEI_ROAD_API_URL = "./data/newtaipei-road-cctv.json";
const TAOYUAN_ROAD_API_URL = "./data/taoyuan-road-cctv.json";
const KEELUNG_ROAD_API_URL = "./data/keelung-road-cctv.json";
const YILAN_ROAD_API_URL = "./data/yilan-road-cctv.json";
const TAICHUNG_ROAD_API_URL = "./data/taichung-road-cctv.json";
const NANTOU_ROAD_API_URL = "./data/nantou-road-cctv.json";
const TAINAN_ROAD_API_URL = "./data/tainan-road-cctv.json";
const CHIAYI_COUNTY_ROAD_API_URL = "./data/chiayi-county-road-cctv.json";
const KAOHSIUNG_ROAD_API_URL = "./data/kaohsiung-road-cctv.json";
const PROVINCIAL_ROAD_API_URL = "./data/provincial-road-cctv.json";
const FREEWAY_CCTV_API_URL = "./data/freeway-cctv.json";
const WRA_STATION_API_URL = "./data/wra-stations.json";
const WATER_API_URL = "./data/water-cctv.json";
const WATER_RENTAL_API_URL = "./data/water-rental-cctv.json";

const TAIWAN_TOWNS_TOPOJSON_URL =
  "https://cdn.jsdelivr.net/npm/taiwan-atlas/towns-10t.json";

const TOPOJSON_CLIENT_URL =
  "https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js";


/* =========================================================
 * CCTV 類型設定
 * ========================================================= */

const CAMERA_TYPES = {
  road: {
    label: "道路 CCTV",
    color: "#2563eb",
    icon: "🔵"
  },
  provincial: {
    label: "省道 CCTV",
    color: "#7c3aed",
    icon: "🟣"
  },
  highway: {
    label: "國道 CCTV",
    color: "#dc2626",
    icon: "🔴"
  },
  wra: {
    label: "水利署 CCTV",
    color: "#0891b2",
    icon: "🔷"
  },
  water: {
    label: "台北水情 CCTV",
    color: "#22c55e",
    icon: "🟢"
  },
  "water-rental": {
    label: "台北水情租賃 CCTV",
    color: "#f59e0b",
    icon: "🟠"
  }
};

/* 縣市顯示順序 */
const CITY_ORDER = [
  "臺北市",
  "台北市",
  "新北市",
  "基隆市",
  "桃園市",
  "臺中市",
  "南投縣",
  "臺南市",
  "高雄市",
  "嘉義縣",
  "宜蘭縣"
];


/* =========================================================
 * 全域狀態
 * ========================================================= */

let allCams = [];

/*
 * 水利署資料需要在 loadData() 與
 * filteredCams() 之間共用，所以放在函式外。
 */
let wraCams = [];

let cameraCounts = {
  road: 0,
  provincial: 0,
  highway: 0,
  wra: 0,
  water: 0,
  "water-rental": 0
};

let map;
let markers = [];
let activeSidebarItem = null;
let userLocationMarker = null;
let searchLocationMarker = null;
let currentUserPosition = null;
let districtGeoJSON = null;

/*
 * 地圖可視範圍更新控制：
 * 拖曳或縮放結束後稍等一下再重畫，
 * 避免短時間重複建立 Marker。
 */
let visibleRenderTimer = null;
const VISIBLE_RENDER_DELAY = 250;


/* =========================================================
 * 桃園：開啟影像後返回時，恢復地圖位置
 * ========================================================= */

const TAOYUAN_MAP_VIEW_KEY = "taoyuan-map-view";

function saveTaoyuanMapView(cam) {
  if (
    !map ||
    normalizeCity(cam?.city) !== "桃園市"
  ) {
    return;
  }

  const center = map.getCenter();

  sessionStorage.setItem(
    TAOYUAN_MAP_VIEW_KEY,
    JSON.stringify({
      lat: center.lat,
      lng: center.lng,
      zoom: map.getZoom()
    })
  );
}

function restoreTaoyuanMapView() {
  if (!map) {
    return false;
  }

  const saved =
    sessionStorage.getItem(TAOYUAN_MAP_VIEW_KEY);

  if (!saved) {
    return false;
  }

  try {
    const view = JSON.parse(saved);

    if (
      !Number.isFinite(view.lat) ||
      !Number.isFinite(view.lng) ||
      !Number.isFinite(view.zoom)
    ) {
      return false;
    }

    map.stop();

    map.setView(
      [view.lat, view.lng],
      view.zoom,
      { animate: false }
    );

    return true;

  } catch (error) {
    console.warn("桃園地圖位置恢復失敗：", error);
    return false;
  }
}


/* =========================================================
 * 通用工具
 * ========================================================= */

/* 動態載入外部 JavaScript */
function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[data-dynamic-src="${src}"]`
    );

    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
      } else {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
      }
      return;
    }

    const script = document.createElement("script");

    script.src = src;
    script.async = true;
    script.dataset.dynamicSrc = src;

    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true }
    );

    script.addEventListener(
      "error",
      () => {
        reject(new Error(`無法載入外部程式：${src}`));
      },
      { once: true }
    );

    document.head.appendChild(script);
  });
}

/* 讀取 JSON（no-cache：檔案沒變就用瀏覽器快取，有變才重新下載） */
async function fetchJson(url) {
  const response = await fetch(url, {
    cache: "no-cache"
  });

  if (!response.ok) {
    throw new Error(
      `${url} 載入失敗，HTTP ${response.status}`
    );
  }

  return response.json();
}

/* 安全顯示文字 */
function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[character]
  );
}

/* 清除道路攝影機名稱前方的編號 */
function cleanName(raw) {
  return String(raw || "")
    .trim()
    .replace(/^\s*\d+\s*[-_－—]\s*/, "") || "未命名";
}

/* 道路 CCTV 官方播放器網址 */
function playerUrl(id) {
  return (
    "https://hls.bote.gov.taipei/live/index.html?id=" +
    encodeURIComponent(id)
  );
}

/* 取得 CCTV 類型資料 */
function getCameraType(type) {
  return CAMERA_TYPES[type] || {
    label: "其他 CCTV",
    color: "#64748b",
    icon: "⚪"
  };
}

/* 統一縣市名稱 */
function normalizeCity(value, fallback = "") {
  const text = String(value || "")
    .trim()
    .replace(/\s+/g, "");

  if (!text) {
    return fallback;
  }

  const cityAliases = {
    台北市: "臺北市",
    臺北市: "臺北市",
    新北市: "新北市",
    基隆市: "基隆市",
    桃園市: "桃園市",
    台中市: "臺中市",
    臺中市: "臺中市",
    南投縣: "南投縣",
    宜蘭縣: "宜蘭縣",
    台南市: "臺南市",
    臺南市: "臺南市",
    高雄市: "高雄市",
    嘉義縣: "嘉義縣"
  };

  return cityAliases[text] || text;
}

/* 統一行政區名稱（沒有「區市鎮鄉」結尾就補「區」） */
function normalizeDistrict(value, defaultValue = "") {
  const name = String(value || "").trim();

  if (!name) {
    return defaultValue;
  }

  return /[區市鎮鄉]$/.test(name)
    ? name
    : `${name}區`;
}


/* =========================================================
 * 行政區邊界
 * ========================================================= */

/* 載入各縣市行政區邊界 */
async function loadDistrictBoundaries() {
  await loadScriptOnce(TOPOJSON_CLIENT_URL);

  if (!window.topojson?.feature) {
    throw new Error("行政區轉換程式載入失敗");
  }

  const topology = await fetchJson(TAIWAN_TOWNS_TOPOJSON_URL);

  const townsObject = topology.objects?.towns;

  if (!townsObject) {
    throw new Error("行政區資料格式不正確");
  }

  const allTowns = window.topojson.feature(
    topology,
    townsObject
  );

  const features = allTowns.features.filter(feature => {
    const properties = feature.properties || {};

    const county = String(
      properties.COUNTYNAME ||
      properties.COUNTY ||
      ""
    ).trim();

    return CITY_ORDER.includes(county);
  });

  districtGeoJSON = {
    type: "FeatureCollection",
    features
  };

  console.log(
    "已載入的縣市：",
    [
      ...new Set(
        features.map(feature =>
          feature.properties?.COUNTYNAME
        )
      )
    ]
  );
}

/* 取得行政區名稱 */
function getDistrictName(feature) {
  const properties = feature?.properties || {};

  return normalizeDistrict(
    properties.TOWNNAME ||
    properties.TOWN ||
    properties.TNAME ||
    properties["行政區"] ||
    ""
  );
}

/* 取得縣市名稱 */
function getCountyName(feature) {
  const properties = feature?.properties || {};

  const county = String(
    properties.COUNTYNAME ||
    properties.COUNTY ||
    ""
  ).trim();

  if (county === "臺北市" || county === "台北市") {
    return "台北市";
  }

  return county;
}

/* 判斷一個點是否在線環裡 */
function pointInRing(point, ring) {
  const [x, y] = point;
  let inside = false;

  for (
    let i = 0, j = ring.length - 1;
    i < ring.length;
    j = i++
  ) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];

    const intersects =
      (yi > y) !== (yj > y) &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

/* 處理 Polygon */
function pointInPolygonCoordinates(point, coordinates) {
  if (
    !coordinates?.length ||
    !pointInRing(point, coordinates[0])
  ) {
    return false;
  }

  return !coordinates
    .slice(1)
    .some(hole => pointInRing(point, hole));
}

/*
 * 計算行政區的外框（最小、最大經緯度），算一次就存起來。
 * 先用外框快速排除，不在框內的就不用做精細判斷。
 */
function getFeatureBbox(feature) {
  if (feature._bbox) {
    return feature._bbox;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  function scan(coords) {
    if (typeof coords[0] === "number") {
      const [x, y] = coords;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      return;
    }

    coords.forEach(scan);
  }

  scan(feature.geometry.coordinates);

  feature._bbox = [minX, minY, maxX, maxY];
  return feature._bbox;
}

/* 同時支援 Polygon 與 MultiPolygon */
function pointInFeature(point, feature) {
  const geometry = feature?.geometry;

  if (!geometry) {
    return false;
  }

  const [x, y] = point;
  const [minX, minY, maxX, maxY] = getFeatureBbox(feature);

  if (x < minX || x > maxX || y < minY || y > maxY) {
    return false;
  }

  if (geometry.type === "Polygon") {
    return pointInPolygonCoordinates(
      point,
      geometry.coordinates
    );
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some(polygon =>
      pointInPolygonCoordinates(point, polygon)
    );
  }

  return false;
}

/* 找出攝影機所在行政區 */
function districtByCoord(x, y) {
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !districtGeoJSON
  ) {
    return "未判定";
  }

  const feature = districtGeoJSON.features.find(item =>
    pointInFeature([x, y], item)
  );

  return feature
    ? getDistrictName(feature)
    : "未判定";
}

/* 地圖自動縮放到選取的行政區 */
function zoomToDistrict(districtName, cityName = "全部") {
  if (!map || !districtGeoJSON) {
    return;
  }

  if (!districtName || districtName === "全部") {
    const bounds = L.geoJSON(districtGeoJSON).getBounds();

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [20, 20],
        maxZoom: 11
      });
    }
    return;
  }

  const feature = districtGeoJSON.features.find(item => {
    const featureDistrict = normalizeDistrict(getDistrictName(item));
    const featureCity = normalizeCity(getCountyName(item));

    const districtMatches =
      featureDistrict === normalizeDistrict(districtName);

    const cityMatches =
      cityName === "全部" ||
      featureCity === normalizeCity(cityName);

    return districtMatches && cityMatches;
  });

  if (!feature) {
    console.warn("找不到行政區：", cityName, districtName);
    return;
  }

  const bounds = L.geoJSON(feature).getBounds();

  if (bounds.isValid()) {
    map.fitBounds(bounds, {
      padding: [30, 30],
      maxZoom: 15
    });
  }
}

/* 地圖縮放到指定縣市 */
function zoomToCity(cityName) {
  if (!map || !districtGeoJSON) {
    return;
  }

  if (!cityName || cityName === "全部") {
    const bounds = L.geoJSON(districtGeoJSON).getBounds();

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [20, 20],
        maxZoom: 11
      });
    }
    return;
  }

  const cityFeatures = districtGeoJSON.features.filter(feature =>
    normalizeCity(getCountyName(feature)) === normalizeCity(cityName)
  );

  if (cityFeatures.length === 0) {
    console.warn("找不到縣市邊界：", cityName);
    return;
  }

  const bounds = L.geoJSON({
    type: "FeatureCollection",
    features: cityFeatures
  }).getBounds();

  if (bounds.isValid()) {
    map.fitBounds(bounds, {
      padding: [30, 30],
      maxZoom: 12
    });
  }
}


/* =========================================================
 * 各資料來源的整理函式（normalize）
 * 每個函式把官方格式轉成網站統一使用的格式
 * ========================================================= */

/* 臺北市道路 */
function normalizeRoadCams(json) {
  const rows = json.result?.results;

  if (!Array.isArray(rows)) {
    throw new Error("道路 CCTV 資料格式不正確");
  }

  return rows
    .map(row => {
      const rawName = String(
        row["攝影機編號"] ||
        row["攝影機編號位置"] ||
        row["攝影機編號及位置"] ||
        ""
      ).trim();

      const id = rawName.match(/^\d+/)?.[0];

      const x = parseFloat(
        row["wgsx"] ??
        row["WGSX"] ??
        row["WGS84經度座標"] ??
        row["WGSX(WGS84經度座標)"]
      );

      const y = parseFloat(
        row["wgsy"] ??
        row["WGSY"] ??
        row["WGS84緯度座標"] ??
        row["WGSY(WGS84緯度座標)"]
      );

      const officialDistrict = normalizeDistrict(
        row["行政區"] ??
        row["行政區域"] ??
        row["區域"] ??
        row["DISTRICT"] ??
        row["district"]
      );

      return {
        key: `road-${id}`,
        id,
        name: cleanName(rawName),
        rawName,
        x,
        y,
        district: officialDistrict || districtByCoord(x, y),
        url: playerUrl(id),
        city: "臺北市",
        type: "road",
        source: "臺北市交通管制工程處"
      };
    })
    .filter(cam =>
      cam.id &&
      Number.isFinite(cam.x) &&
      Number.isFinite(cam.y)
    );
}

/* 新北市道路 */
function normalizeNewTaipeiRoad(data) {
  if (!Array.isArray(data)) {
    throw new Error("新北道路 CCTV 資料格式不正確");
  }

  return data.map(cam => ({
    key: `ntpc-road-${cam.cctv_id}`,
    id: cam.cctv_id,
    name: cam.address,
    x: Number(cam.longitude),
    y: Number(cam.latitude),
    district: normalizeDistrict(cam.district, "未判定"),
    city: "新北市",
    url: `https://atis.ntpc.gov.tw/ATIS/ShowFrame4CCTV/${cam.areacode}`,
    type: "road",
    source: "新北市政府交通局"
  }));
}

/* 桃園市道路 */
function normalizeTaoyuanRoad(json) {
  const rows = json?.results;

  if (!Array.isArray(rows)) {
    throw new Error("桃園道路 CCTV 資料格式不正確");
  }

  return rows
    .map(cam => ({
      ...cam,
      key: `taoyuan-road-${cam.id}`,
      id: String(cam.id || "").trim(),
      name: String(cam.name || "").trim(),
      x: Number(cam.x),
      y: Number(cam.y),
      city: normalizeCity(cam.city, "桃園市"),
      district: normalizeDistrict(cam.district, "未判定"),
      url: String(cam.url || "").trim(),
      streamUrl: String(cam.streamUrl || cam.url || "").trim(),
      type: "road",
      source: cam.source || "桃園市政府交通局"
    }))
    .filter(cam =>
      cam.id &&
      cam.name &&
      cam.url &&
      Number.isFinite(cam.x) &&
      Number.isFinite(cam.y)
    );
}

/* 基隆市道路 */
function normalizeKeelungRoad(json) {
  const rows =
    json.results ||
    json.result?.results ||
    json.data;

  if (!Array.isArray(rows)) {
    throw new Error("基隆道路 CCTV 資料格式不正確");
  }

  return rows
    .map(cam => {
      const id = String(cam.id || "").trim();
      const x = Number(cam.x);
      const y = Number(cam.y);

      const suppliedDistrict =
        cam.district && cam.district !== "未判定"
          ? normalizeDistrict(cam.district)
          : "";

      return {
        key: cam.key || `keelung-road-${id}`,
        id,
        name: String(
          cam.name ||
          cam.roadName ||
          cam.description ||
          id
        ).trim(),
        x,
        y,
        city: "基隆市",
        district: suppliedDistrict || districtByCoord(x, y),
        url: String(cam.url || cam.streamUrl || "").trim(),
        streamUrl: String(cam.streamUrl || cam.url || "").trim(),
        type: "road",
        source: cam.source || "基隆市政府交通處",
        roadName: String(cam.roadName || "").trim(),
        direction: String(cam.direction || "").trim(),
        description: String(cam.description || "").trim()
      };
    })
    .filter(cam =>
      cam.id &&
      cam.url &&
      Number.isFinite(cam.x) &&
      Number.isFinite(cam.y)
    );
}

/* 宜蘭縣道路 */
function normalizeYilanRoad(json) {
  const rows =
    json.results ||
    json.result?.results ||
    json.data;

  if (!Array.isArray(rows)) {
    throw new Error("宜蘭道路 CCTV 資料格式不正確");
  }

  return rows
    .map(cam => {
      const id = String(cam.id || "").trim();
      const x = Number(cam.x);
      const y = Number(cam.y);

      return {
        key: cam.key || `yilan-road-${id}`,
        id,
        officialId: String(cam.officialId || "").trim(),
        name: String(cam.name || id).trim(),
        x,
        y,
        city: "宜蘭縣",
        district: normalizeDistrict(cam.district, "未判定"),
        imageUrl: String(cam.imageUrl || "").trim(),
        url: String(cam.url || cam.imageUrl || "").trim(),
        streamUrl: String(cam.streamUrl || "").trim(),
        type: "road",
        source: cam.source || "宜蘭縣政府警察局公開即時路況"
      };
    })
    .filter(cam =>
      cam.id &&
      cam.url &&
      Number.isFinite(cam.x) &&
      Number.isFinite(cam.y)
    );
}

/* 臺中市道路 */
function normalizeTaichungRoad(data) {
  if (!Array.isArray(data)) {
    throw new Error("臺中道路 CCTV 資料格式不正確");
  }

  return data
    .map(cam => {
      const fullId = String(cam.cctvid || "").trim();

      /*
       * 官方 cctvid 為 66000C000001，
       * 播放器網址使用 C000001。
       */
      const id = fullId.match(/C\d+$/)?.[0] || fullId;

      const x = Number(cam.px);
      const y = Number(cam.py);

      /*
       * roadsection 同時含中文與英文，
       * 先保留逗號前面的中文名稱。
       */
      const name = String(cam.roadsection || id)
        .split(",")[0]
        .trim();

      return {
        key: `taichung-road-${fullId}`,
        id,
        officialId: fullId,
        name: name || "未命名臺中攝影機",
        x,
        y,
        city: "臺中市",
        district: districtByCoord(x, y),
        url: String(cam.url || "").trim(),
        streamUrl: "",
        type: "road",
        source: "臺中市政府交通局",
        status: String(cam.status ?? "").trim(),
        areaCode: String(cam.AreaCode || "").trim()
      };
    })
    .filter(cam =>
      cam.id &&
      cam.url &&
      Number.isFinite(cam.x) &&
      Number.isFinite(cam.y)
    );
}

/* 南投縣道路 */
function normalizeNantouRoad(json) {
  const rows = json.results || json.data || json;

  if (!Array.isArray(rows)) {
    throw new Error("南投道路 CCTV 資料格式不正確");
  }

  return rows
    .map(cam => {
      const id = String(cam.id || "").trim();
      const x = Number(cam.x);
      const y = Number(cam.y);

      const suppliedDistrict =
        cam.district && cam.district !== "未判定"
          ? normalizeDistrict(cam.district)
          : "";

      return {
        key: `nantou-road-${id}`,
        id,
        name: String(cam.name || cam.roadName || id).trim(),
        x,
        y,
        city: "南投縣",
        district: suppliedDistrict || districtByCoord(x, y),
        url: String(cam.url || "").trim(),
        streamUrl: String(cam.streamUrl || "").trim(),
        type: "road",
        source: cam.source || "南投縣政府建設處／南投縣即時交通監控系統",
        linkId: String(cam.linkId || "").trim(),
        roadId: String(cam.roadId || "").trim(),
        roadName: String(cam.roadName || "").trim(),
        roadClass: String(cam.roadClass || "").trim(),
        locationType: String(cam.locationType || "").trim()
      };
    })
    .filter(cam =>
      cam.id &&
      cam.url &&
      Number.isFinite(cam.x) &&
      Number.isFinite(cam.y)
    );
}

/* 臺南市道路 */
function normalizeTainanRoad(json) {
  const rows = json.results || json.data || json;

  if (!Array.isArray(rows)) {
    throw new Error("臺南道路 CCTV 資料格式不正確");
  }

  return rows
    .map(cam => {
      const id = String(cam.id || "").trim();
      const x = Number(cam.x);
      const y = Number(cam.y);

      const suppliedDistrict =
        cam.district && cam.district !== "未判定"
          ? normalizeDistrict(cam.district)
          : "";

      return {
        key: `tainan-road-${id}`,
        id,
        name: String(cam.name || id).trim(),
        x,
        y,
        city: "臺南市",
        district: suppliedDistrict || districtByCoord(x, y),
        url: String(cam.url || "").trim(),
        streamUrl: String(cam.streamUrl || "").trim(),
        type: "road",
        source: cam.source || "臺南市政府交通局"
      };
    })
    .filter(cam =>
      cam.id &&
      cam.url &&
      Number.isFinite(cam.x) &&
      Number.isFinite(cam.y)
    );
}

/* 嘉義縣道路 */
function normalizeChiayiCountyRoad(json) {
  const rows = json.results || json.data || json;

  if (!Array.isArray(rows)) {
    throw new Error("嘉義縣道路 CCTV 資料格式不正確");
  }

  return rows
    .map(cam => {
      const id = String(cam.id || "").trim();
      const x = Number(cam.x);
      const y = Number(cam.y);

      const originalUrl = String(cam.url || "").trim();

      const isUnavailableHost =
        /chiayicctv\.hungmingai\.com/i.test(originalUrl);

      const suppliedDistrict =
        cam.district && cam.district !== "未判定"
          ? normalizeDistrict(cam.district)
          : "";

      return {
        key: `chiayi-county-road-${id}`,
        id,
        name: String(cam.name || cam.roadName || id).trim(),
        x,
        y,
        city: "嘉義縣",
        district: suppliedDistrict || districtByCoord(x, y),
        url: isUnavailableHost ? "" : originalUrl,
        streamUrl: String(cam.streamUrl || "").trim(),
        originalUrl,
        isUnavailable: isUnavailableHost,
        type: "road",
        source: cam.source || "嘉義縣政府",
        linkId: String(cam.linkId || "").trim(),
        roadId: String(cam.roadId || "").trim(),
        roadName: String(cam.roadName || "").trim(),
        roadClass: String(cam.roadClass || "").trim(),
        locationType: String(cam.locationType || "").trim()
      };
    })
    .filter(cam =>
      cam.id &&
      Number.isFinite(cam.x) &&
      Number.isFinite(cam.y)
    );
}

/* 高雄市道路 */
function normalizeKaohsiungRoad(json) {
  const rows = json.results || json.data || json;

  if (!Array.isArray(rows)) {
    throw new Error("高雄道路 CCTV 資料格式不正確");
  }

  return rows
    .map(cam => {
      const id = String(cam.id || "").trim();
      const x = Number(cam.x);
      const y = Number(cam.y);

      return {
        key: cam.key || `kaohsiung-road-${id}`,
        id,
        name: String(cam.name || id).trim(),
        x,
        y,
        city: "高雄市",
        district: normalizeDistrict(cam.district, "未判定"),
        imageUrl: String(cam.imageUrl || "").trim(),
        url: String(
          cam.url ||
          cam.videoUrl ||
          cam.imageUrl ||
          ""
        ).trim(),
        streamUrl: String(
          cam.streamUrl ||
          cam.videoUrl ||
          cam.url ||
          ""
        ).trim(),
        locationImage: String(cam.locationImage || "").trim(),
        type: "road",
        source: cam.source || "高雄市政府交通局"
      };
    })
    .filter(cam =>
      cam.id &&
      cam.url &&
      Number.isFinite(cam.x) &&
      Number.isFinite(cam.y)
    );
}

/* 省道 */
function normalizeProvincialRoad(json) {
  const rows = json.results || json.data || json;

  if (!Array.isArray(rows)) {
    throw new Error("省道 CCTV 資料格式不正確");
  }

  return rows
    .map(cam => {
      const id = String(cam.id || cam.CCTVID || "").trim();
      const x = Number(cam.x ?? cam.PositionLon);
      const y = Number(cam.y ?? cam.PositionLat);

      const url = String(
        cam.streamUrl ||
        cam.url ||
        cam.VideoStreamURL ||
        ""
      ).trim();

      const feature = districtGeoJSON?.features?.find(item =>
        pointInFeature([x, y], item)
      );

      return {
        key: cam.key || `provincial-${id}`,
        id,
        name: String(cam.name || `省道 CCTV ${id}`).trim(),
        x,
        y,
        city:
          normalizeCity(
            cam.city ||
            feature?.properties?.COUNTYNAME
          ) || "未判定",
        district: normalizeDistrict(
          cam.district ||
          (feature ? getDistrictName(feature) : ""),
          "未判定"
        ),
        url,
        streamUrl: url,
        type: "provincial",
        source: cam.source || "交通部公路局",
        linkId: String(cam.linkId || cam.LinkID || "").trim(),
        locationType: String(
          cam.locationType ||
          cam.LocationType ||
          ""
        ).trim()
      };
    })
    .filter(cam =>
      cam.id &&
      cam.url &&
      Number.isFinite(cam.x) &&
      Number.isFinite(cam.y)
    );
}

/* 國道 */
function normalizeFreewayCams(json) {
  const rows = json.results || json.data || json;

  if (!Array.isArray(rows)) {
    throw new Error("國道 CCTV 資料格式不正確");
  }

  return rows
    .map(cam => {
      const id = String(cam.id || cam.CCTVID || "").trim();
      const x = Number(cam.x ?? cam.PositionLon);
      const y = Number(cam.y ?? cam.PositionLat);

      const url = String(
        cam.streamUrl ||
        cam.url ||
        cam.VideoStreamURL ||
        ""
      ).trim();

      const feature = districtGeoJSON?.features?.find(item =>
        pointInFeature([x, y], item)
      );

      return {
        key: cam.key || `highway-${id}`,
        id,
        name: String(
          cam.name ||
          cam.roadName ||
          `國道 CCTV ${id}`
        ).trim(),
        x,
        y,
        city:
          normalizeCity(
            cam.city ||
            (feature ? getCountyName(feature) : "")
          ) || "未判定",
        district: normalizeDistrict(
          cam.district ||
          (feature ? getDistrictName(feature) : ""),
          "未判定"
        ),
        url,
        streamUrl: String(cam.streamUrl || url).trim(),
        type: "highway",
        source: cam.source || "交通部高速公路局",
        roadId: String(cam.roadId || "").trim(),
        roadName: String(cam.roadName || "").trim(),
        direction: String(cam.direction || "").trim(),
        locationMile: String(cam.locationMile || "").trim(),
        start: String(cam.start || "").trim(),
        end: String(cam.end || "").trim(),
        linkId: String(cam.linkId || "").trim(),
        locationType: String(cam.locationType || "").trim()
      };
    })
    .filter(cam =>
      cam.id &&
      cam.url &&
      Number.isFinite(cam.x) &&
      Number.isFinite(cam.y)
    );
}

/* 水利署 */
function normalizeWraStations(data) {
  if (!Array.isArray(data)) {
    throw new Error("水利署 CCTV 站點資料格式不正確");
  }

  const excludedKeywords = [
    "公路局",
    "公路總局",
    "旁收",
    "台電",
    "台水",
    "有線電視",
    "南科管理局"
  ];

  return data
    .filter(item => {
      const sourceId = Number(
        item.SourceId ??
        item.sourceId ??
        1
      );
      return sourceId === 1;
    })
    .filter(item => {
      const stationName = String(item.Name || item.name || "").trim();

      return !excludedKeywords.some(keyword =>
        stationName.includes(keyword)
      );
    })
    .map(item => {
      const lat = Number(item.lat ?? item.latitude ?? item.y);
      const lng = Number(item.lng ?? item.longitude ?? item.x);

      const sourceId = String(
        item.SourceId ??
        item.sourceId ??
        "1"
      ).trim();

      const stationId = String(
        item.ID ??
        item.id ??
        item.cameraId ??
        ""
      ).trim();

      /* 尋找可能使用的影像網址欄位 */
      const imageUrl = String(
        item.imageUrl ||
        item.mediaUrl ||
        item.url ||
        item.ImageURL ||
        item.ImageUrl ||
        ""
      ).trim();

      if (
        !stationId ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
      ) {
        return null;
      }

      return {
        key: `wra-${sourceId}-${stationId}`,
        id: stationId,
        stationId,
        sourceId,
        name: String(
          item.Name ||
          item.name ||
          `水利署 CCTV ${stationId}`
        ).trim(),
        city: String(item.Counname || item.city || "未判定").trim(),
        district: String(item.Town_name || item.district || "未判定").trim(),
        basin: String(
          item.Basin_name ||
          item.basinName ||
          item.basin ||
          ""
        ).trim(),
        lat,
        lng,
        x: lng,
        y: lat,
        url: imageUrl,
        imageUrl,
        mediaUrl: imageUrl,
        type: "wra",
        source: item.source || "經濟部水利署政府開放資料"
      };
    })
    .filter(Boolean);
}

/* 台北水情 */
function normalizeWaterCams(json) {
  const rows =
    json.results ||
    json.result?.results ||
    json.data;

  if (!Array.isArray(rows)) {
    throw new Error("水情 CCTV 資料格式不正確");
  }

  return rows
    .map(row => {
      const id = String(row.id || row.stationNo || "").trim();
      const name = String(row.name || row.stationName || "").trim();
      const x = parseFloat(row.x ?? row.longitude ?? row.lng);
      const y = parseFloat(row.y ?? row.latitude ?? row.lat);
      const url = String(row.url || row.imageUrl || "").trim();

      return {
        key: `water-${id}`,
        id,
        name: name || "未命名水情攝影機",
        rawName: `${id}-${name}`,
        x,
        y,
        district: districtByCoord(x, y),
        url,
        streamUrl: getWaterStreamUrl({ url }),
        city: "臺北市",
        type: "water",
        source: row.source || "臺北市政府工務局水利工程處"
      };
    })
    .filter(cam =>
      cam.id &&
      cam.url &&
      Number.isFinite(cam.x) &&
      Number.isFinite(cam.y)
    );
}

function getWaterStreamUrl(cam) {
  if (!cam.url) return null;

  return cam.url.replace("/snapshot", "/index.m3u8");
}

/* 台北水情租賃 */
function normalizeWaterRentalCams(json) {
  const rows =
    json.results ||
    json.result?.results ||
    json.data;

  if (!Array.isArray(rows)) {
    throw new Error("水情租賃 CCTV 資料格式不正確");
  }

  return rows
    .map(row => {
      const id = String(row.id || row.stationNo || "").trim();
      const name = String(row.name || row.stationName || "").trim();
      const x = parseFloat(row.x ?? row.longitude ?? row.lng);
      const y = parseFloat(row.y ?? row.latitude ?? row.lat);
      const imageUrl = String(row.imageUrl || row.url || "").trim();
      const streamUrl = String(row.streamUrl || "").trim();

      return {
        key: `water-rental-${id}`,
        id,
        name: name || "未命名水情租賃攝影機",
        rawName: `${id}-${name}`,
        x,
        y,
        district: districtByCoord(x, y),
        url: imageUrl || streamUrl,
        imageUrl,
        streamUrl,
        category: String(row.category || "").trim(),
        city: "臺北市",
        type: "water-rental",
        source: row.source || "臺北市政府工務局水利工程處"
      };
    })
    .filter(cam =>
      cam.id &&
      cam.url &&
      Number.isFinite(cam.x) &&
      Number.isFinite(cam.y)
    );
}


/* =========================================================
 * 資料來源設定表
 * 以後要新增縣市：寫好 normalize 函式，再在這裡加一行就好。
 * group 決定這批資料算哪一種 CCTV（對應 CAMERA_TYPES）。
 * ========================================================= */

const DATA_SOURCES = [
  { label: "台北道路 CCTV",     url: ROAD_API_URL,               normalize: normalizeRoadCams,         group: "road" },
  { label: "新北道路 CCTV",     url: NEWTAIPEI_ROAD_API_URL,     normalize: normalizeNewTaipeiRoad,    group: "road" },
  { label: "桃園道路 CCTV",     url: TAOYUAN_ROAD_API_URL,       normalize: normalizeTaoyuanRoad,      group: "road" },
  { label: "基隆道路 CCTV",     url: KEELUNG_ROAD_API_URL,       normalize: normalizeKeelungRoad,      group: "road" },
  { label: "宜蘭道路 CCTV",     url: YILAN_ROAD_API_URL,         normalize: normalizeYilanRoad,        group: "road" },
  { label: "臺中道路 CCTV",     url: TAICHUNG_ROAD_API_URL,      normalize: normalizeTaichungRoad,     group: "road" },
  { label: "南投道路 CCTV",     url: NANTOU_ROAD_API_URL,        normalize: normalizeNantouRoad,       group: "road" },
  { label: "臺南道路 CCTV",     url: TAINAN_ROAD_API_URL,        normalize: normalizeTainanRoad,       group: "road" },
  { label: "嘉義縣道路 CCTV",   url: CHIAYI_COUNTY_ROAD_API_URL, normalize: normalizeChiayiCountyRoad, group: "road" },
  { label: "高雄道路 CCTV",     url: KAOHSIUNG_ROAD_API_URL,     normalize: normalizeKaohsiungRoad,    group: "road" },
  { label: "省道 CCTV",         url: PROVINCIAL_ROAD_API_URL,    normalize: normalizeProvincialRoad,   group: "provincial" },
  { label: "國道 CCTV",         url: FREEWAY_CCTV_API_URL,       normalize: normalizeFreewayCams,      group: "highway" },
  { label: "水利署 CCTV",       url: WRA_STATION_API_URL,        normalize: normalizeWraStations,      group: "wra" },
  { label: "台北水情 CCTV",     url: WATER_API_URL,              normalize: normalizeWaterCams,        group: "water" },
  { label: "台北水情租賃 CCTV", url: WATER_RENTAL_API_URL,       normalize: normalizeWaterRentalCams,  group: "water-rental" }
];


/* =========================================================
 * 載入所有資料
 * ========================================================= */

async function loadData() {
  const status = document.getElementById("status");

  status.textContent = "正在載入 CCTV 資料……";

  const results = await Promise.allSettled(
    DATA_SOURCES.map(source => fetchJson(source.url))
  );

  const errors = [];

  const camsByGroup = {
    road: [],
    provincial: [],
    highway: [],
    wra: [],
    water: [],
    "water-rental": []
  };

  results.forEach((result, index) => {
    const source = DATA_SOURCES[index];

    if (result.status === "rejected") {
      errors.push(`${source.label}：${result.reason.message}`);
      return;
    }

    try {
      const cams = source.normalize(result.value);

      camsByGroup[source.group] =
        camsByGroup[source.group].concat(cams);

      console.log(`${source.label}：`, cams.length);

    } catch (error) {
      errors.push(`${source.label}：${error.message}`);
    }
  });

  /*
   * 水利署點位很多（約 2,500 支），
   * 單獨存放，只有選「水利署 CCTV」時才顯示。
   */
  wraCams = camsByGroup.wra;

  allCams = [
    ...camsByGroup.road,
    ...camsByGroup.provincial,
    ...camsByGroup.highway,
    ...camsByGroup.water,
    ...camsByGroup["water-rental"]
  ];

  cameraCounts = Object.fromEntries(
    Object.entries(camsByGroup).map(
      ([group, cams]) => [group, cams.length]
    )
  );

  console.log("全部 CCTV：", allCams.length);

  window.debugCameras = allCams;

  if (allCams.length === 0) {
    throw new Error(
      errors.join("；") || "沒有載入任何 CCTV 資料"
    );
  }

  buildCityOptions();
  buildSourceOptions();
  buildDistrictOptions();
  render();

  if (errors.length > 0) {
    console.warn("部分資料來源載入失敗：", errors);
  }
}


/* =========================================================
 * 選單
 * ========================================================= */

/* 建立縣市選單 */
function buildCityOptions() {
  const citySelect = document.getElementById("cityFilter");

  if (!citySelect) {
    return;
  }

  const availableCities = [
    ...new Set(
      allCams
        .map(cam => normalizeCity(cam.city))
        .filter(Boolean)
    )
  ];

  availableCities.sort((a, b) => {
    const indexA = CITY_ORDER.indexOf(a);
    const indexB = CITY_ORDER.indexOf(b);

    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    return a.localeCompare(b, "zh-Hant");
  });

  citySelect.innerHTML = [
    `<option value="全部">全部縣市</option>`,
    ...availableCities.map(city =>
      `<option value="${esc(city)}">${esc(city)}</option>`
    )
  ].join("");
}

/* 依照縣市建立 CCTV 類型選單 */
function buildSourceOptions() {
  const citySelect = document.getElementById("cityFilter");
  const sourceSelect = document.getElementById("sourceFilter");

  if (!sourceSelect) {
    return;
  }

  const selectedCity = normalizeCity(citySelect?.value || "全部");
  const previousValue = sourceSelect.value || "all";

  const options = [
    { value: "all", label: "全部 CCTV" },
    { value: "road", label: CAMERA_TYPES.road.label },
    { value: "provincial", label: CAMERA_TYPES.provincial.label },
    { value: "highway", label: CAMERA_TYPES.highway.label },
    { value: "wra", label: CAMERA_TYPES.wra.label }
  ];

  const showTaipeiWaterTypes =
    selectedCity === "全部" ||
    selectedCity === "臺北市";

  if (showTaipeiWaterTypes) {
    options.push(
      { value: "water", label: CAMERA_TYPES.water.label },
      { value: "water-rental", label: CAMERA_TYPES["water-rental"].label }
    );
  }

  sourceSelect.innerHTML = options
    .map(option =>
      `<option value="${esc(option.value)}">${esc(option.label)}</option>`
    )
    .join("");

  const previousStillAvailable = options.some(
    option => option.value === previousValue
  );

  sourceSelect.value = previousStillAvailable
    ? previousValue
    : "all";
}

/* 依照目前縣市建立行政區選單 */
function buildDistrictOptions() {
  const citySelect = document.getElementById("cityFilter");
  const districtSelect = document.getElementById("districtFilter");

  if (!districtSelect) {
    return;
  }

  const selectedCity = citySelect?.value || "全部";

  const districts = [
    ...new Set(
      allCams
        .filter(cam =>
          selectedCity === "全部" ||
          normalizeCity(cam.city) === selectedCity
        )
        .map(cam => normalizeDistrict(cam.district, "未判定"))
        .filter(Boolean)
    )
  ].sort((a, b) => a.localeCompare(b, "zh-Hant"));

  districtSelect.innerHTML = [
    `<option value="全部">全部行政區</option>`,
    ...districts.map(district =>
      `<option value="${esc(district)}">${esc(district)}</option>`
    )
  ].join("");
}


/* =========================================================
 * 篩選與畫面顯示
 * ========================================================= */

/* 取得符合目前篩選條件的 CCTV */
function filteredCams() {
  const city =
    document.getElementById("cityFilter")?.value || "全部";

  const district =
    document.getElementById("districtFilter")?.value || "全部";

  const source =
    document.getElementById("sourceFilter")?.value || "all";

  /*
   * 選擇水利署時，改用 wraCams；其他來源使用 allCams。
   * 所以預設「全部 CCTV」不會建立 2,500 多個水利署 Marker。
   */
  const sourceCams = source === "wra"
    ? wraCams
    : allCams;

  return sourceCams.filter(cam => {
    const matchesDistrict =
      district === "全部" ||
      cam.district === district;

    const matchesSource =
      source === "all" ||
      cam.type === source;

    const matchesCity =
      city === "全部" ||
      normalizeCity(cam.city) === city;

    return matchesCity && matchesDistrict && matchesSource;
  });
}

/*
 * 只保留目前地圖畫面範圍內的 CCTV。
 * 地圖尚未建立時，維持原本資料，避免初始化期間出錯。
 */
function camsInCurrentMapBounds(cams) {
  if (!map || !map.getBounds) {
    return cams;
  }

  const bounds = map.getBounds();

  if (!bounds || !bounds.isValid()) {
    return cams;
  }

  return cams.filter(cam => {
    const lat = Number(cam.y);
    const lng = Number(cam.x);

    return (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      bounds.contains([lat, lng])
    );
  });
}

/*
 * 地圖移動完成後延遲更新。
 * autoZoom 必須關閉，否則每次更新又會重新縮放地圖。
 */
function scheduleVisibleCamerasRender() {
  if (!map || allCams.length === 0) {
    return;
  }

  clearTimeout(visibleRenderTimer);

  visibleRenderTimer = setTimeout(() => {
    render({ autoZoom: false });
  }, VISIBLE_RENDER_DELAY);
}

/* 重新顯示側欄與地圖標記 */
function render(options = {}) {
  const { autoZoom = true } = options;

  const matchedCams = filteredCams();
  const cams = camsInCurrentMapBounds(matchedCams);

  document.getElementById("status").textContent =
    `目前畫面 ${cams.length} 支（篩選後 ${matchedCams.length} 支）；` +
    `道路 ${cameraCounts.road} 支；` +
    `省道 ${cameraCounts.provincial} 支；` +
    `國道 ${cameraCounts.highway} 支；` +
    `水情 ${cameraCounts.water} 支；` +
    `水情租賃 ${cameraCounts["water-rental"]} 支；` +
    `水利署 ${cameraCounts.wra} 支。`;

  renderSidebar(cams);
  renderMarkers(cams);

  const selectedCity =
    document.getElementById("cityFilter")?.value || "全部";

  const selectedDistrict =
    document.getElementById("districtFilter")?.value || "全部";

  if (autoZoom) {
    if (selectedDistrict !== "全部") {
      zoomToDistrict(selectedDistrict, selectedCity);
    } else {
      zoomToCity(selectedCity);
    }
  }
}

/* 顯示左側 CCTV 清單 */
function renderSidebar(cams) {
  const SIDEBAR_LIMIT = 200;

  const limitedCams = cams.slice(0, SIDEBAR_LIMIT);

  const grouped = {};

  limitedCams.forEach(cam => {
    const city = cam.city || "其他";
    const district = cam.district || "未判定";

    if (!grouped[city]) {
      grouped[city] = {};
    }

    if (!grouped[city][district]) {
      grouped[city][district] = [];
    }

    grouped[city][district].push(cam);
  });

  const preferredCities = ["台北市", "臺北市", "新北市"];

  const cityOrder = [
    ...preferredCities.filter(city => grouped[city]),
    ...Object.keys(grouped)
      .filter(city => !preferredCities.includes(city))
      .sort((a, b) => a.localeCompare(b, "zh-Hant"))
  ];

  let html = "";

  if (cams.length > SIDEBAR_LIMIT) {
    html += `
      <div class="empty-msg">
        目前畫面共有 ${cams.length} 支 CCTV，
        左側清單先顯示前 ${SIDEBAR_LIMIT} 支。
        請放大地圖或縮小篩選範圍。
      </div>
    `;
  }

  cityOrder.forEach(city => {
    const districts = Object.keys(grouped[city])
      .sort((a, b) => a.localeCompare(b, "zh-Hant"));

    districts.forEach(district => {
      const list = grouped[city][district];

      if (!list || list.length === 0) {
        return;
      }

      html += `
        <div class="district-group">
          <div class="district-header">
            ${esc(city)}・${esc(district)}
            <span class="badge">${list.length}</span>
          </div>
      `;

      list
        .sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"))
        .forEach(cam => {
          const typeInfo = getCameraType(cam.type);

          html += `
            <div
              class="cam-item"
              data-key="${esc(cam.key)}"
              onclick="focusCam('${esc(cam.key)}')"
            >
              <div class="cam-name">
                <span class="cam-type-icon">${typeInfo.icon}</span>
                ${esc(cam.name)}
              </div>
              <div class="cam-id">
                ${esc(typeInfo.label)}・ID ${esc(cam.id)}
              </div>
            </div>
          `;
        });

      html += "</div>";
    });
  });

  document.getElementById("sidebar").innerHTML =
    html ||
    `<div class="empty-msg">找不到符合條件的 CCTV。</div>`;
}

/* 顯示地圖上的攝影機標記 */
function renderMarkers(cams) {
  if (!map) {
    return;
  }

  const markerRadius = window.innerWidth <= 900 ? 10 : 8;

  markers.forEach(marker => {
    map.removeLayer(marker);
  });

  markers = [];

  cams.forEach(cam => {
    const typeInfo = getCameraType(cam.type);

    const marker = L.circleMarker([cam.y, cam.x], {
      radius: markerRadius,
      fillColor: typeInfo.color,
      fillOpacity: 0.85,
      color: "#ffffff",
      weight: 2
    });

    marker.camData = cam;

    marker.on("click", () => {
      openInfo(marker);
    });

    marker.addTo(map);
    markers.push(marker);
  });
}


/* =========================================================
 * 攝影機資訊視窗
 * ========================================================= */

function openInfo(marker) {
  const cam = marker.camData;
  const typeInfo = getCameraType(cam.type);

  const mediaUrl =
    cam.type === "water"
      ? (cam.streamUrl || cam.url)
      : cam.type === "water-rental"
        ? (cam.streamUrl || cam.imageUrl)
        : cam.url;

  const isSnapshot =
    /\.(jpg|jpeg|png|webp)(\?|$)/i.test(mediaUrl || "");

  const buttonText =
    cam.type === "water" || isSnapshot
      ? "🖼 查看目前影像"
      : "▶ 開啟即時影像";

  const saveViewAttribute =
    normalizeCity(cam.city) === "桃園市"
      ? `onclick="saveTaoyuanMapView(
          window.debugCameras.find(
            item => item.key === '${esc(cam.key)}'
          )
        )"`
      : "";

  let actionHtml;

  if (cam.type === "wra") {
    actionHtml = `
      <button type="button" class="iw-btn wra-image-btn">
        ▶ 開啟動態影像
      </button>
    `;
  } else if (mediaUrl) {
    actionHtml = `
      <a
        class="iw-btn"
        href="${esc(mediaUrl)}"
        target="_blank"
        rel="noopener noreferrer"
        ${saveViewAttribute}
      >
        ${buttonText}
      </a>
    `;
  } else {
    actionHtml = `
      <div class="iw-no-media">
        ${
          cam.isUnavailable
            ? "官方影像主機目前無法連線。"
            : "目前僅提供 CCTV 點位資料，尚無可開啟的即時影像網址。"
        }
      </div>
    `;
  }

  const content = `
    <div class="iw-wrap">
      <div class="iw-title">${esc(cam.name)}</div>
      <div class="iw-meta">
        ${esc(typeInfo.label)}・ID ${esc(cam.id)}・${esc(cam.district)}
      </div>
      <div class="iw-source">資料來源：${esc(cam.source)}</div>
      ${actionHtml}
    </div>
  `;

  marker.bindPopup(content, { maxWidth: 300 });

  if (cam.type === "wra") {
    marker.once("popupopen", event => {
      const button = event.popup
        .getElement()
        ?.querySelector(".wra-image-btn");

      if (!button) {
        return;
      }

      button.addEventListener("click", () => {
        openWraLiveViewer(cam);
      });
    });
  }

  marker.openPopup();

  highlightSidebar(cam.key);
}


/* =========================================================
 * 水利署：定時更新的快照視窗
 * ========================================================= */

let wraLiveTimer = null;

function closeWraLiveViewer() {
  if (wraLiveTimer) {
    clearInterval(wraLiveTimer);
    wraLiveTimer = null;
  }

  document.querySelector(".wra-live-overlay")?.remove();
}

function getWraImageUrl(cam) {
  const imageUrl = String(
    cam.mediaUrl ||
    cam.imageUrl ||
    cam.url ||
    ""
  ).trim();

  if (!imageUrl) {
    throw new Error("這支攝影機沒有提供影像網址");
  }

  return imageUrl;
}

function openWraLiveViewer(cam) {
  closeWraLiveViewer();

  const overlay = document.createElement("div");

  overlay.className = "wra-live-overlay";

  overlay.innerHTML = `
    <div class="wra-live-box">
      <div class="wra-live-header">
        <div>
          <strong>${esc(cam.name)}</strong>
          <div class="wra-live-status">正在取得影像…</div>
        </div>
        <button type="button" class="wra-live-close" aria-label="關閉">
          ×
        </button>
      </div>

      <div class="wra-live-image-wrap">
        <img class="wra-live-image" alt="${esc(cam.name)}最新影像">
      </div>

      <div class="wra-live-footer">
        定時更新的監視器快照，並非影片串流
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const image = overlay.querySelector(".wra-live-image");
  const status = overlay.querySelector(".wra-live-status");
  const closeButton = overlay.querySelector(".wra-live-close");

  closeButton.addEventListener("click", closeWraLiveViewer);

  overlay.addEventListener("click", event => {
    if (event.target === overlay) {
      closeWraLiveViewer();
    }
  });

  image.onload = () => {
    status.textContent =
      `更新時間：${new Date().toLocaleTimeString("zh-TW")}`;
  };

  image.onerror = () => {
    status.textContent = "影像載入失敗，稍後重試";
  };

  function refreshImage() {
    try {
      status.textContent = "影像更新中…";

      const imageUrl = getWraImageUrl(cam);
      const separator = imageUrl.includes("?") ? "&" : "?";

      // 加上時間參數，避免瀏覽器顯示快取圖片
      image.src = `${imageUrl}${separator}_t=${Date.now()}`;

    } catch (error) {
      console.error("水利署動態影像更新失敗：", error);
      status.textContent = `更新失敗：${error.message}`;
    }
  }

  refreshImage();

  // 每 5 秒重新取得一次最新圖片
  wraLiveTimer = setInterval(refreshImage, 5000);
}


/* =========================================================
 * 側欄互動
 * ========================================================= */

/* 點選側欄後移動到該攝影機 */
function focusCam(key) {
  const marker = markers.find(item => item.camData.key === key);

  if (!marker) {
    return;
  }

  map.flyTo(marker.getLatLng(), 16, {
    animate: true,
    duration: 0.8
  });

  openInfo(marker);
}

/* 標示目前選取的側欄項目 */
function highlightSidebar(key) {
  if (activeSidebarItem) {
    activeSidebarItem.classList.remove("active");
  }

  const element = document.querySelector(
    `.cam-item[data-key="${CSS.escape(key)}"]`
  );

  if (!element) {
    activeSidebarItem = null;
    return;
  }

  element.classList.add("active");

  element.scrollIntoView({
    block: "nearest",
    behavior: "smooth"
  });

  activeSidebarItem = element;
}


/* =========================================================
 * 距離計算
 * ========================================================= */

/* 計算兩個座標之間的距離（公尺） */
function distanceInMeters(position1, position2) {
  const earthRadius = 6371000;

  const lat1 = position1.lat * Math.PI / 180;
  const lat2 = position2.lat * Math.PI / 180;
  const deltaLat = (position2.lat - position1.lat) * Math.PI / 180;
  const deltaLng = (position2.lng - position1.lng) * Math.PI / 180;

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) *
    Math.cos(lat2) *
    Math.sin(deltaLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

/* 找出距離使用者最近的 CCTV */
function findNearestCam(userPosition) {
  if (!userPosition || allCams.length === 0) {
    return null;
  }

  let nearest = null;

  allCams.forEach(cam => {
    const distance = distanceInMeters(userPosition, {
      lat: cam.y,
      lng: cam.x
    });

    if (!nearest || distance < nearest.distance) {
      nearest = { cam, distance };
    }
  });

  return nearest;
}

/* 找出搜尋位置 3 公里內的 CCTV */
function findNearbyCams(searchPosition) {
  const radiusMeters = 3000;

  return allCams
    .map(cam => ({
      ...cam,
      distance: distanceInMeters(searchPosition, {
        lat: cam.y,
        lng: cam.x
      })
    }))
    .filter(cam =>
      Number.isFinite(cam.distance) &&
      cam.distance <= radiusMeters
    )
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 50);
}

/* 顯示距離文字 */
function formatDistance(distance) {
  if (distance < 1000) {
    return `${Math.round(distance)} 公尺`;
  }

  return `${(distance / 1000).toFixed(1)} 公里`;
}


/* =========================================================
 * 地點搜尋
 * ========================================================= */

/* 清除地點搜尋，恢復原本瀏覽模式 */
function clearPlaceSearch() {
  exitPlaceSearchMode();

  const citySelect = document.getElementById("cityFilter");

  if (citySelect) {
    citySelect.value = "全部";
  }

  buildSourceOptions();
  buildDistrictOptions();

  const districtSelect = document.getElementById("districtFilter");

  if (districtSelect) {
    districtSelect.value = "全部";
  }

  render();
}

/* 離開地點搜尋模式 */
function exitPlaceSearchMode() {
  if (searchLocationMarker) {
    map.removeLayer(searchLocationMarker);
    searchLocationMarker = null;
  }

  const clearButton = document.getElementById("clearSearchBtn");

  if (clearButton) {
    clearButton.hidden = true;
  }

  const container = document.getElementById("placeAutocomplete");

  if (container) {
    container.replaceChildren();
    initPlaceAutocomplete();
  }

  map.closePopup();
}

/* 建立 Google 地點搜尋框 */
async function initPlaceAutocomplete() {
  const container = document.getElementById("placeAutocomplete");

  if (!container) {
    console.error("找不到 Google 地點搜尋框容器");
    return;
  }

  try {
    const { PlaceAutocompleteElement } =
      await google.maps.importLibrary("places");

    const autocomplete = new PlaceAutocompleteElement();

    autocomplete.includedRegionCodes = ["tw"];
    autocomplete.placeholder = "搜尋地址、車站、地標或店家";

    autocomplete.addEventListener("gmp-select", async event => {
      try {
        const place = event.placePrediction.toPlace();

        await place.fetchFields({
          fields: ["displayName", "formattedAddress", "location"]
        });

        if (!place.location) {
          console.error("這個地點沒有座標");
          return;
        }

        const lat = place.location.lat();
        const lng = place.location.lng();

        const nearbyCams = findNearbyCams({ lat, lng });

        const clearButton = document.getElementById("clearSearchBtn");

        if (clearButton) {
          clearButton.hidden = false;
        }

        console.log("3 公里內 CCTV：", nearbyCams);

        renderSidebar(nearbyCams);
        renderMarkers(nearbyCams);

        const bounds = L.latLngBounds([
          [lat, lng],
          ...nearbyCams.map(cam => [cam.y, cam.x])
        ]);

        if (bounds.isValid()) {
          map.fitBounds(bounds, {
            padding: [40, 40],
            maxZoom: 16
          });
        }

        if (searchLocationMarker) {
          map.removeLayer(searchLocationMarker);
        }

        searchLocationMarker = L.marker([lat, lng])
          .addTo(map)
          .bindPopup(
            `<strong>${esc(place.displayName || "搜尋位置")}</strong>`
          )
          .openPopup();

        document.getElementById("status").textContent =
          `已找到：${place.displayName || "搜尋地點"}`;

      } catch (error) {
        console.error("取得搜尋地點失敗：", error);
      }
    });

    container.replaceChildren(autocomplete);

  } catch (error) {
    console.error("Google 地點搜尋載入失敗：", error);
  }
}


/* =========================================================
 * 使用者定位
 * ========================================================= */

function locateUser() {
  const button = document.getElementById("locationBtn");
  const status = document.getElementById("status");
  const citySelect = document.getElementById("cityFilter");
  const districtSelect = document.getElementById("districtFilter");
  const sourceSelect = document.getElementById("sourceFilter");

  exitPlaceSearchMode();

  if (citySelect) {
    citySelect.value = "全部";
  }

  buildSourceOptions();

  if (sourceSelect) {
    sourceSelect.value = "all";
  }

  buildDistrictOptions();

  if (districtSelect) {
    districtSelect.value = "全部";
  }

  render({ autoZoom: false });

  if (!navigator.geolocation) {
    status.textContent = "你的瀏覽器不支援定位功能。";
    return;
  }

  button.disabled = true;
  button.textContent = "定位中…";
  status.textContent = "正在取得你的位置……";

  navigator.geolocation.getCurrentPosition(
    position => {
      currentUserPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      if (userLocationMarker) {
        map.removeLayer(userLocationMarker);
      }

      userLocationMarker = L.circleMarker(
        [currentUserPosition.lat, currentUserPosition.lng],
        {
          radius: 9,
          fillColor: "#ef4444",
          fillOpacity: 1,
          color: "#ffffff",
          weight: 3
        }
      );

      userLocationMarker
        .bindTooltip("我的位置")
        .addTo(map);

      map.stop();

      map.setView(
        [currentUserPosition.lat, currentUserPosition.lng],
        16,
        { animate: true }
      );

      button.disabled = false;
      button.textContent = "📍 我的位置";

      const nearest = findNearestCam(currentUserPosition);

      if (nearest) {
        const typeInfo = getCameraType(nearest.cam.type);

        status.textContent =
          `已完成定位。最近的是` +
          `「${nearest.cam.name}」` +
          `（${typeInfo.label}），` +
          `距離約 ${formatDistance(nearest.distance)}。`;
      } else {
        status.textContent =
          "已定位，但目前沒有可用的 CCTV 資料。";
      }
    },

    error => {
      let message = "無法取得你的位置。";

      if (error.code === error.PERMISSION_DENIED) {
        message = "你沒有允許定位權限，請在瀏覽器設定中允許位置存取。";
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        message = "目前無法取得位置資訊。";
      } else if (error.code === error.TIMEOUT) {
        message = "定位逾時，請再試一次。";
      }

      status.textContent = message;
      button.disabled = false;
      button.textContent = "📍 我的位置";
    },

    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }
  );
}


/* =========================================================
 * 啟動地圖
 * ========================================================= */

async function initMap() {
  // preferCanvas：大量標記時用 Canvas 繪製，效能較好
  map = L.map("map", { preferCanvas: true }).setView(
    [25.0478, 121.5318],
    12
  );

  L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">' +
        "OpenStreetMap</a> contributors"
    }
  ).addTo(map);

  /* 拖曳或縮放後，重新顯示目前範圍內的 CCTV */
  map.on("moveend", scheduleVisibleCamerasRender);

  try {
    document.getElementById("status").textContent =
      "正在載入行政區邊界……";

    await loadDistrictBoundaries();
    await loadData();

  } catch (error) {
    console.error(error);

    document.getElementById("status").textContent =
      `載入失敗：${error.message}`;
  }
}


/* =========================================================
 * 事件綁定
 * ========================================================= */

/* 縣市選單 */
document
  .getElementById("cityFilter")
  ?.addEventListener("change", () => {
    buildSourceOptions();
    buildDistrictOptions();

    const districtSelect = document.getElementById("districtFilter");

    if (districtSelect) {
      districtSelect.value = "全部";
    }

    exitPlaceSearchMode();
    render();
  });

/* 行政區選單 */
document
  .getElementById("districtFilter")
  ?.addEventListener("change", () => {
    exitPlaceSearchMode();
    render();
  });

/* CCTV 類型選單 */
document
  .getElementById("sourceFilter")
  ?.addEventListener("change", () => {
    exitPlaceSearchMode();
    render();
  });

/* 我的位置按鈕 */
document
  .getElementById("locationBtn")
  ?.addEventListener("click", locateUser);

/* 清除搜尋按鈕 */
document
  .getElementById("clearSearchBtn")
  ?.addEventListener("click", clearPlaceSearch);

/* 從影像頁按「上一頁」返回時，恢復桃園地圖位置 */
window.addEventListener("pageshow", event => {
  if (!event.persisted || !map || allCams.length === 0) {
    return;
  }

  setTimeout(() => {
    restoreTaoyuanMapView();
    map.invalidateSize();
  }, 100);
});


/* =========================================================
 * 更新通知
 * ========================================================= */

/* 在畫面下方顯示通知條 */
function showUpdateBanner(message, buttonText, onClick) {
  let banner = document.getElementById("updateBanner");

  if (!banner) {
    banner = document.createElement("div");
    banner.id = "updateBanner";
    banner.className = "update-banner";
    banner.setAttribute("role", "status");
    document.body.appendChild(banner);
  }

  banner.innerHTML = `
    <span>${esc(message)}</span>
    ${
      buttonText
        ? `<button type="button" class="update-banner-btn">${esc(buttonText)}</button>`
        : ""
    }
    <button type="button" class="update-banner-close" aria-label="關閉">×</button>
  `;

  if (buttonText && onClick) {
    banner
      .querySelector(".update-banner-btn")
      .addEventListener("click", onClick);
  }

  banner
    .querySelector(".update-banner-close")
    .addEventListener("click", () => banner.remove());
}

/* 版本更新提示：和上次開啟時的版號比對 */
function checkVersionChange() {
  const VERSION_KEY = "cctv-map-version";

  try {
    const lastVersion = localStorage.getItem(VERSION_KEY);

    if (lastVersion && lastVersion !== APP_VERSION) {
      showUpdateBanner(`網站已更新至 v${APP_VERSION}`);

      setTimeout(() => {
        document.getElementById("updateBanner")?.remove();
      }, 5000);
    }

    localStorage.setItem(VERSION_KEY, APP_VERSION);

  } catch (error) {
    // 無痕模式等情況可能無法使用 localStorage，略過即可
  }
}

/* 資料更新提示：Service Worker 發現資料有新版時通知 */
function listenForDataUpdates() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  let notified = false;

  navigator.serviceWorker.addEventListener("message", event => {
    if (event.data?.type !== "data-updated" || notified) {
      return;
    }

    // 好幾個檔案同時更新時，只顯示一次
    notified = true;

    showUpdateBanner(
      "攝影機資料有更新",
      "重新載入",
      () => location.reload()
    );
  });
}

/* =========================================================
 * 正式啟動
 * ========================================================= */

/* 顯示版號 */
const appVersionElement = document.getElementById("appVersion");

if (appVersionElement) {
  appVersionElement.textContent = `v${APP_VERSION}`;
  appVersionElement.title = `更新日期：${APP_UPDATED}`;
}

console.log(`即時 CCTV 地圖 v${APP_VERSION}（${APP_UPDATED}）`);

/* 註冊 Service Worker（第二次開啟後更快、更省流量） */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .catch(error => {
        console.warn("Service Worker 註冊失敗：", error);
      });
  });
}

checkVersionChange();
listenForDataUpdates();

initPlaceAutocomplete();
initMap();