const ROAD_API_URL = "./cctv.json";
const NEWTAIPEI_ROAD_API_URL = "./newtaipei-road-cctv.json";

const WATER_API_URL = "./water-cctv.json";
const WATER_RENTAL_API_URL = "./water-rental-cctv.json";

const TAOYUAN_ROAD_API_URL =
  "./taoyuan-road-cctv.json";

const TAIWAN_TOWNS_TOPOJSON_URL =
  "https://cdn.jsdelivr.net/npm/taiwan-atlas/towns-10t.json";

const TOPOJSON_CLIENT_URL =
  "https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js";

const CAMERA_TYPES = {
  road: {
    label: "道路 CCTV",
    color: "#2563eb",
    icon: "🔵"
  },
  water: {
    label: "水情 CCTV",
    color: "#22c55e",
    icon: "🟢"
  },
  "water-rental": {
    label: "水情租賃 CCTV",
    color: "#f59e0b",
    icon: "🟠"
  }
};

let allCams = [];

let cameraCounts = {
  road: 0,
  water: 0,
  "water-rental": 0
};

let map;
let markers = [];
let activeSidebarItem = null;
let userLocationMarker = null;
let currentUserPosition = null;
let districtGeoJSON = null;

/* 縣市顯示順序 */
const CITY_ORDER = [
  "臺北市",
  "新北市",
  "基隆市",
  "桃園市"
];


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
        existing.addEventListener(
          "load",
          resolve,
          { once: true }
        );

        existing.addEventListener(
          "error",
          reject,
          { once: true }
        );
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
        reject(
          new Error(
            `無法載入外部程式：${src}`
          )
        );
      },
      { once: true }
    );

    document.head.appendChild(script);
  });
}

/* 載入臺北市行政區邊界 */
async function loadDistrictBoundaries() {
  await loadScriptOnce(TOPOJSON_CLIENT_URL);

  if (!window.topojson?.feature) {
    throw new Error(
      "行政區轉換程式載入失敗"
    );
  }

  const topology = await fetchJson(
    TAIWAN_TOWNS_TOPOJSON_URL
  );

  const townsObject =
    topology.objects?.towns;

  if (!townsObject) {
    throw new Error(
      "行政區資料格式不正確"
    );
  }

  const allTowns =
    window.topojson.feature(
      topology,
      townsObject
    );

  const features =
    allTowns.features.filter(feature => {
      const properties =
        feature.properties || {};

      const county = String(
        properties.COUNTYNAME ||
        properties.COUNTY ||
        ""
      ).trim();

      return [
        "臺北市",
        "台北市",
        "新北市"
      ].includes(county);
    });

    districtGeoJSON = {
      type: "FeatureCollection",
      features
    };

    console.log(
      "已載入臺北市及新北市行政區：",
      features.length
    );
}

/* 取得行政區名稱 */
function getDistrictName(feature) {
  const properties =
    feature?.properties || {};

  return normalizeDistrict(
    properties.TOWNNAME ||
    properties.TOWN ||
    properties.TNAME ||
    properties["行政區"] ||
    ""
  );
}

function getCountyName(feature) {
  const properties =
    feature?.properties || {};

  const county = String(
    properties.COUNTYNAME ||
    properties.COUNTY ||
    ""
  ).trim();

  if (
    county === "臺北市" ||
    county === "台北市"
  ) {
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
      x <
        ((xj - xi) * (y - yi)) /
          (yj - yi) +
        xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

/* 處理 Polygon */
function pointInPolygonCoordinates(
  point,
  coordinates
) {
  if (
    !coordinates?.length ||
    !pointInRing(point, coordinates[0])
  ) {
    return false;
  }

  return !coordinates
    .slice(1)
    .some(hole =>
      pointInRing(point, hole)
    );
}

/* 同時支援 Polygon 與 MultiPolygon */
function pointInFeature(point, feature) {
  const geometry = feature?.geometry;

  if (!geometry) {
    return false;
  }

  if (geometry.type === "Polygon") {
    return pointInPolygonCoordinates(
      point,
      geometry.coordinates
    );
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some(
      polygon =>
        pointInPolygonCoordinates(
          point,
          polygon
        )
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

  const feature =
    districtGeoJSON.features.find(
      item =>
        pointInFeature(
          [x, y],
          item
        )
    );

  return feature
    ? getDistrictName(feature)
    : "未判定";
}

/* 地圖自動縮放到選取的行政區 */
function zoomToDistrict(
  districtName,
  cityName = "全部"
) {
  if (!map || !districtGeoJSON) {
    return;
  }

  if (!districtName || districtName === "全部") {
    const allDistrictLayer =
      L.geoJSON(districtGeoJSON);

    const bounds =
      allDistrictLayer.getBounds();

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [20, 20],
        maxZoom: 11
      });
    }

    return;
  }

  const feature =
    districtGeoJSON.features.find(item => {
      const featureDistrict =
        normalizeDistrict(
          getDistrictName(item)
        );

      const featureCity =
        normalizeCity(
          getCountyName(item)
        );

      const districtMatches =
        featureDistrict ===
        normalizeDistrict(districtName);

      const cityMatches =
        cityName === "全部" ||
        featureCity ===
          normalizeCity(cityName);

      return (
        districtMatches &&
        cityMatches
      );
    });

  if (!feature) {
    console.warn(
      "找不到行政區：",
      cityName,
      districtName
    );

    return;
  }

  const districtLayer =
    L.geoJSON(feature);

  const bounds =
    districtLayer.getBounds();

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
    const allLayer = L.geoJSON(districtGeoJSON);
    const bounds = allLayer.getBounds();

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [20, 20],
        maxZoom: 11
      });
    }

    return;
  }

  const cityFeatures =
    districtGeoJSON.features.filter(feature => {
      return normalizeCity(
        getCountyName(feature)
      ) === normalizeCity(cityName);
    });

  
  if (cityFeatures.length === 0) {
    console.warn(
      "找不到縣市邊界：",
      cityName
    );

    return;
  }

  const cityGeoJSON = {
    type: "FeatureCollection",
    features: cityFeatures
  };

  const cityLayer = L.geoJSON(cityGeoJSON);
  const bounds = cityLayer.getBounds();

  if (bounds.isValid()) {
    map.fitBounds(bounds, {
      padding: [30, 30],
      maxZoom: 12
    });
  }
}

/* 顯示被選取的行政區 */
function showSelectedDistrictBoundary(districtName) {
  if (!map || !districtGeoJSON) {
    return;
  }

  if (selectedDistrictLayer) {
    map.removeLayer(selectedDistrictLayer);
    selectedDistrictLayer = null;
  }

  if (!districtName || districtName === "全部") {
    return;
  }

  const feature =
    districtGeoJSON.features.find(item => {
      return getDistrictName(item) === districtName;
    });

  if (!feature) {
    console.warn(
      "找不到行政區邊界：",
      districtName
    );

    return;
  }

  selectedDistrictLayer = L.geoJSON(
    feature,
    {
      style: {
        color: "#0066ff",
        weight: 4,
        opacity: 1,
        fillColor: "#3388ff",
        fillOpacity: 0.08
      }
    }
  ).addTo(map);

  const bounds =
    selectedDistrictLayer.getBounds();

  if (bounds.isValid()) {
    map.fitBounds(bounds, {
      padding: [30, 30],
      maxZoom: 15
    });
  }
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

/* 讀取 JSON */
async function fetchJson(url) {
  const response = await fetch(url, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(
      `${url} 載入失敗，HTTP ${response.status}`
    );
  }

  return response.json();
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
    桃園市: "桃園市"
  };

  return cityAliases[text] || text;
}

function normalizeDistrict(
  value,
  defaultValue = ""
) {
  const name = String(value || "").trim();

  if (!name) {
    return defaultValue;
  }

  return name.endsWith("區")
    ? name
    : `${name}區`;
}

/* 整理道路 CCTV 資料 */
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

      const officialDistrict =
        normalizeDistrict(
          row["行政區"] ??
          row["行政區域"] ??
          row["區域"] ??
          row["DISTRICT"] ??
          row["district"]
        );

      const district =
        officialDistrict ||
        districtByCoord(x, y);

      return {
        key: `road-${id}`,
        id,
        name: cleanName(rawName),
        rawName,
        x,
        y,
        district,
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


function normalizeNewTaipeiRoad(data) {
  if (!Array.isArray(data)) return [];

  return data.map(cam => ({
    key: `ntpc-road-${cam.cctv_id}`,
    id: cam.cctv_id,
    name: cam.address,
    x: Number(cam.longitude),
    y: Number(cam.latitude),
    district: normalizeDistrict(
        cam.district,
        "未判定"
      ),
    city: "新北市",

    url:
      `https://atis.ntpc.gov.tw/ATIS/ShowFrame4CCTV/${cam.areacode}`,

    type: "road",
    source: "新北市政府交通局"
  }));
}

/* 整理水情 CCTV 資料 */
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
      const id = String(
        row.id ||
        row.stationNo ||
        ""
      ).trim();

      const name = String(
        row.name ||
        row.stationName ||
        ""
      ).trim();

      const x = parseFloat(
        row.x ??
        row.longitude ??
        row.lng
      );

      const y = parseFloat(
        row.y ??
        row.latitude ??
        row.lat
      );

      const url = String(
        row.url ||
        row.imageUrl ||
        ""
      ).trim();

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
        source:
          row.source ||
          "臺北市政府工務局水利工程處"
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

  return cam.url.replace(
    "/snapshot",
    "/index.m3u8"
  );
}

/* 整理水情租賃 CCTV 資料 */
function normalizeWaterRentalCams(json) {
  const rows =
    json.results ||
    json.result?.results ||
    json.data;

  if (!Array.isArray(rows)) {
    throw new Error(
      "水情租賃 CCTV 資料格式不正確"
    );
  }

  return rows
    .map(row => {
      const id = String(
        row.id ||
        row.stationNo ||
        ""
      ).trim();

      const name = String(
        row.name ||
        row.stationName ||
        ""
      ).trim();

      const x = parseFloat(
        row.x ??
        row.longitude ??
        row.lng
      );

      const y = parseFloat(
        row.y ??
        row.latitude ??
        row.lat
      );

      const imageUrl = String(
        row.imageUrl ||
        row.url ||
        ""
      ).trim();

      const streamUrl = String(
        row.streamUrl ||
        ""
      ).trim();

      return {
        key: `water-rental-${id}`,
        id,
        name:
          name ||
          "未命名水情租賃攝影機",
        rawName: `${id}-${name}`,
        x,
        y,
        district: districtByCoord(x, y),
        url: imageUrl || streamUrl,
        imageUrl,
        streamUrl,
        category: String(
          row.category || ""
        ).trim(),
        city: "臺北市",
        type: "water-rental",
        source:
          row.source ||
          "臺北市政府工務局水利工程處"
      };
    })
    .filter(cam =>
      cam.id &&
      cam.url &&
      Number.isFinite(cam.x) &&
      Number.isFinite(cam.y)
    );
}

/* 同時載入道路與水情資料 */
async function loadData() {
  const status = document.getElementById("status");

  status.textContent =
    "正在載入道路與水情 CCTV……";

  const results = await Promise.allSettled([
    fetchJson(ROAD_API_URL),
    fetchJson(NEWTAIPEI_ROAD_API_URL),   
    fetchJson(TAOYUAN_ROAD_API_URL),// ← 新增
    fetchJson(WATER_API_URL),
    fetchJson(WATER_RENTAL_API_URL)
  ]);

  let roadCams = [];
  let newTaipeiRoadCams = [];   // ← 新增，先不用
  let taoyuanRoadCams = [];
  let waterCams = [];
  let waterRentalCams = [];
  const errors = [];

  if (results[0].status === "fulfilled") {
    try {
      roadCams = normalizeRoadCams(
        results[0].value
      );
    } catch (error) {
      errors.push(error.message);
    }
  } else {
    errors.push(
      `道路 CCTV：${results[0].reason.message}`
    );
  }

  if (results[1].status === "fulfilled") {
    try {
      newTaipeiRoadCams =
        normalizeNewTaipeiRoad(
          results[1].value
        );
      
      console.log("台北道路：", roadCams.length);
      console.log("新北道路：", newTaipeiRoadCams.length);

    } catch (error) {
      errors.push(
        `新北道路 CCTV：${error.message}`
      );
    }
  } else {
    errors.push(
      `新北道路 CCTV：` +
      results[1].reason.message
    );
  }

  if (results[2].status === "fulfilled") {
    try {
      const rows =
        results[2].value?.results;

      taoyuanRoadCams =
        Array.isArray(rows)
          ? rows
              .map(cam => ({
                ...cam,
                key:
                  `taoyuan-road-${cam.id}`,

                id: String(
                  cam.id || ""
                ).trim(),

                name: String(
                  cam.name || ""
                ).trim(),

                x: Number(cam.x),
                y: Number(cam.y),

                city: normalizeCity(
                  cam.city,
                  "桃園市"
                ),

                district:
                  normalizeDistrict(
                    cam.district,
                    "未判定"
                  ),

                url: String(
                  cam.url || ""
                ).trim(),

                streamUrl: String(
                  cam.streamUrl ||
                  cam.url ||
                  ""
                ).trim(),

                type: "road",

                source:
                  cam.source ||
                  "桃園市政府交通局"
              }))
              .filter(cam =>
                cam.id &&
                cam.name &&
                cam.url &&
                Number.isFinite(cam.x) &&
                Number.isFinite(cam.y)
              )
          : [];

      console.log(
        "桃園道路：",
        taoyuanRoadCams.length
      );
    } catch (error) {
      errors.push(
        `桃園道路 CCTV：${error.message}`
      );
    }
  } else {
    errors.push(
      `桃園道路 CCTV：` +
      results[2].reason.message
    );
  }

  if (results[3].status === "fulfilled") {
    try {
      waterCams = normalizeWaterCams(
        results[3].value
      );
    } catch (error) {
      errors.push(error.message);
    }
  } else {
    errors.push(
      `水情 CCTV：${results[3].reason.message}`
    );
  }

  if (results[4].status === "fulfilled") {
    try {
      waterRentalCams =
        normalizeWaterRentalCams(
          results[4].value
        );
    } catch (error) {
      errors.push(error.message);
    }
  } else {
    errors.push(
      `水情租賃 CCTV：` +
      results[4].reason.message
    );
  }

  allCams = [
    ...roadCams,
    ...newTaipeiRoadCams,
    ...taoyuanRoadCams,
    ...waterCams,
    ...waterRentalCams
  ];

  cameraCounts = {
    road: roadCams.length + newTaipeiRoadCams.length + taoyuanRoadCams.length,
    water: waterCams.length,
    "water-rental": waterRentalCams.length
  };

  console.log("全部 CCTV：", allCams.length);

  window.debugCameras = allCams;

  if (allCams.length === 0) {
    throw new Error(
      errors.join("；") ||
      "沒有載入任何 CCTV 資料"
    );
  }

  buildCityOptions();
  buildDistrictOptions();
  render();

  if (errors.length > 0) {
    console.warn(
      "部分資料來源載入失敗：",
      errors
    );
  }
}

/* 建立縣市選單 */
/* 建立縣市選單 */
function buildCityOptions() {
  const citySelect =
    document.getElementById("cityFilter");

  if (!citySelect) {
    return;
  }

  const availableCities = [
    ...new Set(
      allCams
        .map(cam =>
          normalizeCity(cam.city)
        )
        .filter(Boolean)
    )
  ];

  availableCities.sort((a, b) => {
    const indexA = CITY_ORDER.indexOf(a);
    const indexB = CITY_ORDER.indexOf(b);

    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }

    if (indexA !== -1) {
      return -1;
    }

    if (indexB !== -1) {
      return 1;
    }

    return a.localeCompare(b, "zh-Hant");
  });

  citySelect.innerHTML = [
    `<option value="全部">全部縣市</option>`,

    ...availableCities.map(city => {
      return (
        `<option value="${esc(city)}">` +
        `${esc(city)}` +
        `</option>`
      );
    })
  ].join("");
}

/* 依照目前縣市建立行政區選單 */
function buildDistrictOptions() {
  const citySelect =
    document.getElementById("cityFilter");

  const districtSelect =
    document.getElementById("districtFilter");

  if (!districtSelect) {
    return;
  }

  const selectedCity =
    citySelect?.value || "全部";

  const districts = [
    ...new Set(
      allCams
        .filter(cam => {
          const cameraCity =
            normalizeCity(cam.city);

          return (
            selectedCity === "全部" ||
            cameraCity === selectedCity
          );
        })
        .map(cam =>
          normalizeDistrict(
            cam.district,
            "未判定"
          )
        )
        .filter(Boolean)
    )
  ].sort((a, b) =>
    a.localeCompare(b, "zh-Hant")
  );

  districtSelect.innerHTML = [
    `<option value="全部">全部行政區</option>`,

    ...districts.map(district => {
      return (
        `<option value="${esc(district)}">` +
        `${esc(district)}` +
        `</option>`
      );
    })
  ].join("");
}

/* 取得符合目前搜尋條件的 CCTV */
function filteredCams() {
  const query = document
    .getElementById("q")
    .value
    .trim()
    .toLowerCase();

  const city =
  document.getElementById("cityFilter")
    ?.value || "全部";

  const district = document
    .getElementById("districtFilter")
    .value;

  const sourceFilter =
    document.getElementById("sourceFilter");

  const source = sourceFilter
    ? sourceFilter.value
    : "all";

  return allCams.filter(cam => {
    const typeInfo = getCameraType(cam.type);

    const searchableText = [
      cam.name,
      cam.rawName,
      cam.id,
      cam.district,
      cam.source,
      typeInfo.label
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !query ||
      searchableText.includes(query);

    const matchesDistrict =
      district === "全部" ||
      cam.district === district;

    const matchesSource =
      source === "all" ||
      cam.type === source;

    const cameraCity =
      normalizeCity(cam.city);

    const matchesCity =
      city === "全部" ||
      cameraCity === city;

    return (
      matchesSearch &&
      matchesCity &&
      matchesDistrict &&
      matchesSource
    );
  });
}

/* 重新顯示側欄與地圖標記 */
function render() {
  const cams = filteredCams();

  const roadCount = cameraCounts.road;
  const waterCount = cameraCounts.water;
  const waterRentalCount =
    cameraCounts["water-rental"];

  document.getElementById("status").textContent =
    `道路 ${roadCount} 支；` +
    `水情 ${waterCount} 支；` +
    `水情租賃 ${waterRentalCount} 支；` +
    `目前顯示 ${cams.length} 支。`;

  renderSidebar(cams);
  renderMarkers(cams);

  const selectedCity =
  document.getElementById(
    "cityFilter"
  )?.value || "全部";

  const selectedDistrict =
    document.getElementById(
      "districtFilter"
    )?.value || "全部";

  if (selectedDistrict !== "全部") {
    zoomToDistrict(
      selectedDistrict,
      selectedCity
    );
  } else {
    zoomToCity(selectedCity);
  }
}

/* 顯示左側 CCTV 清單 */
function renderSidebar(cams) {
  const grouped = {};

  cams.forEach(cam => {
    const city = cam.city || "其他";
    const district =
      cam.district || "未判定";

    if (!grouped[city]) {
      grouped[city] = {};
    }

    if (!grouped[city][district]) {
      grouped[city][district] = [];
    }

    grouped[city][district].push(cam);
  });

  const preferredCities = [
    "台北市",
    "臺北市",
    "新北市"
  ];

  const cityOrder = [
    ...preferredCities.filter(
      city => grouped[city]
    ),
    ...Object.keys(grouped)
      .filter(
        city => !preferredCities.includes(city)
      )
      .sort((a, b) =>
        a.localeCompare(b, "zh-Hant")
      )
  ];

  let html = "";

  cityOrder.forEach(city => {
    const districts = Object.keys(
      grouped[city]
    ).sort((a, b) =>
      a.localeCompare(b, "zh-Hant")
    );

    districts.forEach(district => {
      const list =
        grouped[city][district];

      if (!list || list.length === 0) {
        return;
      }

      html += `
        <div class="district-group">
          <div class="district-header">
            ${esc(city)}・${esc(district)}
            <span class="badge">
              ${list.length}
            </span>
          </div>
      `;

      list
        .sort((a, b) =>
          a.name.localeCompare(
            b.name,
            "zh-Hant"
          )
        )
        .forEach(cam => {
          const typeInfo =
            getCameraType(cam.type);

          html += `
            <div
              class="cam-item"
              data-key="${esc(cam.key)}"
              onclick="focusCam('${esc(cam.key)}')"
            >
              <div class="cam-name">
                <span class="cam-type-icon">
                  ${typeInfo.icon}
                </span>
                ${esc(cam.name)}
              </div>

              <div class="cam-id">
                ${esc(typeInfo.label)}
                ・ID ${esc(cam.id)}
              </div>
            </div>
          `;
        });

      html += "</div>";
    });
  });

  document.getElementById("sidebar").innerHTML =
    html ||
    `<div class="empty-msg">
      找不到符合條件的 CCTV。
    </div>`;
}

/* 顯示地圖上的攝影機標記 */
function renderMarkers(cams) {
  if (!map) {
    return;
  }

  const markerRadius =
    window.innerWidth <= 900 ? 10 : 8;

  markers.forEach(marker => {
    map.removeLayer(marker);
  });

  markers = [];

  cams.forEach(cam => {
    const typeInfo =
      getCameraType(cam.type);

    const marker = L.circleMarker(
      [cam.y, cam.x],
      {
        radius: markerRadius,
        fillColor: typeInfo.color,
        fillOpacity: 0.85,
        color: "#ffffff",
        weight: 2
      }
    );

    marker.camData = cam;

    marker.on("click", () => {
      openInfo(marker);
    });

    marker.addTo(map);
    markers.push(marker);
  });
}

/* 開啟攝影機資訊視窗 */
function openInfo(marker) {
  const cam = marker.camData;
  const typeInfo =
    getCameraType(cam.type);

  const mediaUrl =
    cam.type === "water"
      ? (cam.streamUrl || cam.url)
      : cam.type === "water-rental"
        ? cam.streamUrl
        : cam.url;

  const buttonText =
    cam.type === "water"
      ? "🖼 查看目前影像"
      : "▶ 開啟即時影像";

  const actionHtml = mediaUrl
    ? `
      <a
        class="iw-btn"
        href="${esc(mediaUrl)}"
        target="_blank"
        rel="noopener noreferrer"
      >
        ${buttonText}
      </a>
    `
    : `
      <div class="iw-no-media">
        目前僅提供 CCTV 點位資料，
        尚無可開啟的即時影像網址。
      </div>
    `;

  const content = `
    <div class="iw-wrap">
      <div class="iw-title">
        ${esc(cam.name)}
      </div>

      <div class="iw-meta">
        ${esc(typeInfo.label)}
        ・ID ${esc(cam.id)}
        ・${esc(cam.district)}
      </div>

      <div class="iw-source">
        資料來源：${esc(cam.source)}
      </div>

      ${actionHtml}
    </div>
  `;

  marker
    .bindPopup(content, {
      maxWidth: 300
    })
    .openPopup();

  highlightSidebar(cam.key);
}

/* 點選側欄後移動到該攝影機 */
function focusCam(key) {
  const marker = markers.find(
    item => item.camData.key === key
  );

  if (!marker) {
    return;
  }

  map.flyTo(
    marker.getLatLng(),
    16,
    {
      animate: true,
      duration: 0.8
    }
  );

  openInfo(marker);
}

/* 標示目前選取的側欄項目 */
function highlightSidebar(key) {
  if (activeSidebarItem) {
    activeSidebarItem.classList.remove(
      "active"
    );
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

/* 計算兩個座標之間的距離 */
function distanceInMeters(
  position1,
  position2
) {
  const earthRadius = 6371000;

  const lat1 =
    position1.lat * Math.PI / 180;

  const lat2 =
    position2.lat * Math.PI / 180;

  const deltaLat =
    (position2.lat - position1.lat) *
    Math.PI / 180;

  const deltaLng =
    (position2.lng - position1.lng) *
    Math.PI / 180;

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) *
    Math.cos(lat2) *
    Math.sin(deltaLng / 2) ** 2;

  const c =
    2 * Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadius * c;
}

/* 找出距離使用者最近的 CCTV */
function findNearestCam(userPosition) {
  if (
    !userPosition ||
    allCams.length === 0
  ) {
    return null;
  }

  let nearest = null;

  allCams.forEach(cam => {
    const distance = distanceInMeters(
      userPosition,
      {
        lat: cam.y,
        lng: cam.x
      }
    );

    if (
      !nearest ||
      distance < nearest.distance
    ) {
      nearest = {
        cam,
        distance
      };
    }
  });

  return nearest;
}

/* 顯示距離文字 */
function formatDistance(distance) {
  if (distance < 1000) {
    return `${Math.round(distance)} 公尺`;
  }

  return `${(distance / 1000).toFixed(1)} 公里`;
}

/* 使用者定位 */
function locateUser() {
  const button =
    document.getElementById("locationBtn");

  const status =
    document.getElementById("status");

  if (!navigator.geolocation) {
    status.textContent =
      "你的瀏覽器不支援定位功能。";
    return;
  }

  button.disabled = true;
  button.textContent = "定位中…";

  status.textContent =
    "正在取得你的位置……";

  navigator.geolocation.getCurrentPosition(
    position => {
      currentUserPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      if (userLocationMarker) {
        map.removeLayer(
          userLocationMarker
        );
      }

      userLocationMarker =
        L.circleMarker(
          [
            currentUserPosition.lat,
            currentUserPosition.lng
          ],
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

      map.setView(
        [
          currentUserPosition.lat,
          currentUserPosition.lng
        ],
        16,
        {
          animate: true
        }
      );

      button.disabled = false;
      button.textContent =
        "📍 我的位置";

      const nearest =
        findNearestCam(
          currentUserPosition
        );

      if (nearest) {
        const typeInfo =
          getCameraType(
            nearest.cam.type
          );

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
      let message =
        "無法取得你的位置。";

      if (
        error.code ===
        error.PERMISSION_DENIED
      ) {
        message =
          "你沒有允許定位權限，請在瀏覽器設定中允許位置存取。";
      } else if (
        error.code ===
        error.POSITION_UNAVAILABLE
      ) {
        message =
          "目前無法取得位置資訊。";
      } else if (
        error.code ===
        error.TIMEOUT
      ) {
        message =
          "定位逾時，請再試一次。";
      }

      status.textContent = message;
      button.disabled = false;
      button.textContent =
        "📍 我的位置";
    },

    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }
  );
}

/* 啟動 Leaflet 地圖 */
async function initMap() {
  map = L.map("map").setView(
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

/* 搜尋框 */
document
  .getElementById("q")
  .addEventListener(
    "input",
    render
  );

/* CCTV 類型選單 */
document
  .getElementById("sourceFilter")
  .addEventListener(
    "change",
    render
  );

/* 行政區選單 */
document
  .getElementById("districtFilter")
  .addEventListener(
    "change",
    render
  );

/* 我的定位按鈕 */
document
  .getElementById("locationBtn")
  .addEventListener(
    "click",
    locateUser
  );

/* 縣市選單 */
document
  .getElementById("cityFilter")
  ?.addEventListener(
    "change",
    () => {
      const districtSelect =
        document.getElementById(
          "districtFilter"
        );

      buildDistrictOptions();

      if (districtSelect) {
        districtSelect.value = "全部";
      }

      render();
    }
  );

/* 正式啟動 */
initMap();