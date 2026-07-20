const ROAD_API_URL = "./cctv.json";
const NEWTAIPEI_ROAD_API_URL = "./newtaipei-road-cctv.json";

const WATER_API_URL = "./water-cctv.json";
const WATER_RENTAL_API_URL = "./water-rental-cctv.json";

const DISTRICTS = [
  "中正區",
  "大同區",
  "中山區",
  "松山區",
  "大安區",
  "萬華區",
  "信義區",
  "士林區",
  "北投區",
  "內湖區",
  "南港區",
  "文山區"
];

const BOXES = [
  { d: "北投區", minX: 121.45, maxX: 121.62, minY: 25.10, maxY: 25.23 },
  { d: "士林區", minX: 121.47, maxX: 121.67, minY: 25.07, maxY: 25.16 },
  { d: "內湖區", minX: 121.55, maxX: 121.68, minY: 25.04, maxY: 25.10 },
  { d: "南港區", minX: 121.57, maxX: 121.70, minY: 25.00, maxY: 25.08 },
  { d: "文山區", minX: 121.51, maxX: 121.64, minY: 24.95, maxY: 25.03 },
  { d: "萬華區", minX: 121.47, maxX: 121.52, minY: 25.015, maxY: 25.055 },
  { d: "中正區", minX: 121.49, maxX: 121.54, minY: 25.015, maxY: 25.055 },
  { d: "大同區", minX: 121.49, maxX: 121.53, minY: 25.045, maxY: 25.085 },
  { d: "中山區", minX: 121.51, maxX: 121.57, minY: 25.045, maxY: 25.095 },
  { d: "松山區", minX: 121.54, maxX: 121.59, minY: 25.035, maxY: 25.075 },
  { d: "大安區", minX: 121.51, maxX: 121.57, minY: 25.005, maxY: 25.055 },
  { d: "信義區", minX: 121.55, maxX: 121.61, minY: 25.005, maxY: 25.055 }
];

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
let map;
let markers = [];
let activeSidebarItem = null;
let userLocationMarker = null;
let currentUserPosition = null;

/* 找出攝影機所在行政區 */
function districtByCoord(x, y) {
  const result = BOXES.find(box =>
    x >= box.minX &&
    x <= box.maxX &&
    y >= box.minY &&
    y <= box.maxY
  );

  return result ? result.d : "未判定";
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

      return {
        key: `road-${id}`,
        id,
        name: cleanName(rawName),
        rawName,
        x,
        y,
        district: districtByCoord(x, y),
        url: playerUrl(id),
        city: "台北市",
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

function normalizeNewTaipeiDistrict(district) {
  const name = String(district || "").trim();

  if (!name) {
    return "未判定";
  }

  return name.endsWith("區")
    ? name
    : `${name}區`;
}

function normalizeNewTaipeiRoad(data) {
  if (!Array.isArray(data)) return [];

  return data.map(cam => ({
    key: `ntpc-road-${cam.cctv_id}`,
    id: cam.cctv_id,
    name: cam.address,
    x: Number(cam.longitude),
    y: Number(cam.latitude),
    district: normalizeNewTaipeiDistrict(cam.district),
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
        city: "台北市",
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
        city: "台北市",
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
    fetchJson(NEWTAIPEI_ROAD_API_URL),   // ← 新增
    fetchJson(WATER_API_URL),
    fetchJson(WATER_RENTAL_API_URL)
  ]);

  let roadCams = [];
  let newTaipeiRoadCams = [];   // ← 新增，先不用
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
      waterCams = normalizeWaterCams(
        results[2].value
      );
    } catch (error) {
      errors.push(error.message);
    }
  } else {
    errors.push(
      `水情 CCTV：${results[2].reason.message}`
    );
  }

  if (results[3].status === "fulfilled") {
    try {
      waterRentalCams =
        normalizeWaterRentalCams(
          results[3].value
        );
    } catch (error) {
      errors.push(error.message);
    }
  } else {
    errors.push(
      `水情租賃 CCTV：` +
      results[3].reason.message
    );
  }

  allCams = [
    ...roadCams,
    ...newTaipeiRoadCams,
    ...waterCams,
    ...waterRentalCams
  ];

  console.log("全部 CCTV：", allCams.length);

  if (allCams.length === 0) {
    throw new Error(
      errors.join("；") ||
      "沒有載入任何 CCTV 資料"
    );
  }

  buildDistrictOptions();
  render();

  if (errors.length > 0) {
    console.warn(
      "部分資料來源載入失敗：",
      errors
    );
  }
}

/* 建立行政區選單 */
/* 建立行政區選單 */
function buildDistrictOptions() {
  const select =
    document.getElementById("districtFilter");

  const optionsByCity = {};

  allCams.forEach(cam => {
    const city = cam.city || "其他";
    const district = cam.district || "未判定";

    if (!optionsByCity[city]) {
      optionsByCity[city] = new Set();
    }

    optionsByCity[city].add(district);
  });

  const preferredCities = [
    "台北市",
    "臺北市",
    "新北市"
  ];

  const cityOrder = [
    ...preferredCities.filter(
      city => optionsByCity[city]
    ),
    ...Object.keys(optionsByCity)
      .filter(
        city => !preferredCities.includes(city)
      )
      .sort((a, b) =>
        a.localeCompare(b, "zh-Hant")
      )
  ];

  let html =
    `<option value="全部">全部行政區</option>`;

  cityOrder.forEach(city => {
    const districts = [
      ...optionsByCity[city]
    ].sort((a, b) =>
      a.localeCompare(b, "zh-Hant")
    );

    html += `<optgroup label="${esc(city)}">`;

    html += districts
      .map(
        district =>
          `<option value="${esc(district)}">` +
          `${esc(district)}</option>`
      )
      .join("");

    html += `</optgroup>`;
  });

  select.innerHTML = html;
}

/* 取得符合目前搜尋條件的 CCTV */
function filteredCams() {
  const query = document
    .getElementById("q")
    .value
    .trim()
    .toLowerCase();

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

    return (
      matchesSearch &&
      matchesDistrict &&
      matchesSource
    );
  });
}

/* 重新顯示側欄與地圖標記 */
function render() {
  const cams = filteredCams();

  const roadCount = allCams.filter(
    cam => cam.type === "road"
  ).length;

  const waterCount = allCams.filter(
    cam => cam.type === "water"
  ).length;

  const waterRentalCount = allCams.filter(
    cam => cam.type === "water-rental"
  ).length;

  document.getElementById("status").textContent =
    `道路 ${roadCount} 支；` +
    `水情 ${waterCount} 支；` +
    `水情租賃 ${waterRentalCount} 支；` +
    `目前顯示 ${cams.length} 支。`;

  renderSidebar(cams);
  renderMarkers(cams);
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

/* 正式啟動 */
initMap();