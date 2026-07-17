const ROAD_URL = "./road.json";
const WATER_URL = "./water.json";

const DISTRICTS = ["中正區","大同區","中山區","松山區","大安區","萬華區",
                   "信義區","士林區","北投區","內湖區","南港區","文山區"];

const BOXES = [
  {d:"北投區", minX:121.45,maxX:121.62,minY:25.10,maxY:25.23},
  {d:"士林區", minX:121.47,maxX:121.67,minY:25.07,maxY:25.16},
  {d:"內湖區", minX:121.55,maxX:121.68,minY:25.04,maxY:25.10},
  {d:"南港區", minX:121.57,maxX:121.70,minY:25.00,maxY:25.08},
  {d:"文山區", minX:121.51,maxX:121.64,minY:24.95,maxY:25.03},
  {d:"萬華區", minX:121.47,maxX:121.52,minY:25.015,maxY:25.055},
  {d:"中正區", minX:121.49,maxX:121.54,minY:25.015,maxY:25.055},
  {d:"大同區", minX:121.49,maxX:121.53,minY:25.045,maxY:25.085},
  {d:"中山區", minX:121.51,maxX:121.57,minY:25.045,maxY:25.095},
  {d:"松山區", minX:121.54,maxX:121.59,minY:25.035,maxY:25.075},
  {d:"大安區", minX:121.51,maxX:121.57,minY:25.005,maxY:25.055},
  {d:"信義區", minX:121.55,maxX:121.61,minY:25.005,maxY:25.055},
];

function districtByCoord(x,y){
  const h = BOXES.find(b=>x>=b.minX&&x<=b.maxX&&y>=b.minY&&y<=b.maxY);
  return h?h.d:"未判定";
}
function cleanName(raw){
  return String(raw||"").trim().replace(/^\s*\d+\s*[-_－—]\s*/,"") || "未命名";
}
function playerUrl(id){
  return `https://hls.bote.gov.taipei/live/index.html?id=${encodeURIComponent(id)}`;
}

let allCams = [];
let map;
let infoWindow;
let markers = [];
let activeSidebarItem = null;
let userLocationMarker = null;
let currentUserPosition = null;

/* ── 從臺北市資料大平臺 API 載入資料 ── */
async function loadData() {
  const status = document.getElementById("status");
  status.textContent = "正在載入臺北市 CCTV 開放資料……";

  const res = await fetch(API_URL, {
    cache: "no-store"
  });

  if (!res.ok) {
    throw new Error(`API 連線失敗，HTTP ${res.status}`);
  }

  const json = await res.json();
  const rows = json.result?.results;

  if (!Array.isArray(rows)) {
    console.error("API 回傳內容：", json);
    throw new Error("API 回傳格式不正確");
  }

  allCams = rows.map(row => {
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
      id,
      name: cleanName(rawName),
      rawName,
      x,
      y,
      district: districtByCoord(x, y),
      url: playerUrl(id)
    };
  }).filter(cam =>
    cam.id &&
    Number.isFinite(cam.x) &&
    Number.isFinite(cam.y)
  );

  buildDistrictOptions();
  render();
}

/* ── 行政區選單 ── */
function buildDistrictOptions(){
  const sel=document.getElementById("districtFilter");
  sel.innerHTML=`<option value="全部">全部行政區</option>`+
    [...DISTRICTS,"未判定"].map(d=>`<option value="${d}">${d}</option>`).join("");
}

/* ── 篩選後的清單 ── */
function filteredCams(){
  const q=document.getElementById("q").value.trim().toLowerCase();
  const df=document.getElementById("districtFilter").value;
  return allCams.filter(c=>{
    const okQ=!q||(c.name+c.rawName+c.district).toLowerCase().includes(q);
    const okD=df==="全部"||c.district===df;
    return okQ&&okD;
  });
}

/* ── 主渲染：側欄 + 地圖 ── */
function render(){
  const cams=filteredCams();
  document.getElementById("status").textContent=
    `共 ${allCams.length} 支 CCTV；目前顯示 ${cams.length} 支。`;
  renderSidebar(cams);
  renderMarkers(cams);
}

/* ── 側欄 ── */
function renderSidebar(cams){
  const order=[...DISTRICTS,"未判定"];
  const grouped=Object.fromEntries(order.map(d=>[d,[]]));
  cams.forEach(c=>(grouped[c.district]||=[]).push(c));

  let html="";
  order.forEach(d=>{
    const list=grouped[d];
    if(!list||!list.length)return;
    html+=`<div class="district-group">
      <div class="district-header">${esc(d)}<span class="badge">${list.length}</span></div>`;
    list.sort((a,b)=>a.name.localeCompare(b.name,"zh-Hant")).forEach(c=>{
      html+=`<div class="cam-item" data-id="${esc(c.id)}" onclick="focusCam('${esc(c.id)}')">
        <div class="cam-name">${esc(c.name)}</div>
        <div class="cam-id">ID ${esc(c.id)}</div>
      </div>`;
    });
    html+="</div>";
  });
  document.getElementById("sidebar").innerHTML=html||
    `<div class="empty-msg">找不到符合條件的 CCTV。</div>`;
}

/* ── 地圖標記 ── */
function renderMarkers(cams){

  const markerRadius = window.innerWidth <= 900 ? 10 : 8;
  
  markers.forEach(m=>{
    map.removeLayer(m);
  });

  markers=[];

  if(!map)return;

  cams.forEach(c=>{

    const marker=L.circleMarker(
      [c.y,c.x],
      {
        radius: markerRadius,
        fillColor:"#2563eb",
        fillOpacity:.85,
        color:"#ffffff",
        weight:2
      }
    );

    marker.camData=c;

    marker.on("click",()=>{
      openInfo(marker);
    });

    marker.addTo(map);

    markers.push(marker);

  });

}

/* ── Info Window ── */
function openInfo(marker){
  const c=marker.camData;

  const content=`
    <div class="iw-wrap">
      <div class="iw-title">${esc(c.name)}</div>
      <div class="iw-meta">
        ID ${esc(c.id)} ・ ${esc(c.district)}
      </div>
      <a
        class="iw-btn"
        href="${c.url}"
        target="_blank"
        rel="noopener"
      >
        ▶ 開啟即時影像
      </a>
    </div>
  `;

  marker.bindPopup(content,{
    maxWidth:280
  });

  marker.openPopup();

  highlightSidebar(c.id);
}

/* ── 側欄點擊 → 地圖飛到該點 ── */
function focusCam(id){
  const marker = markers.find(
    m => m.camData.id === id
  );

  if(!marker) return;

  map.flyTo(
    marker.getLatLng(),
    16,
    {
      animate: true,
      duration: 0.8
    }
  );

  openInfo(marker);
  highlightSidebar(id);
}

function highlightSidebar(id){
  if(activeSidebarItem) activeSidebarItem.classList.remove("active");
  const el=document.querySelector(`.cam-item[data-id="${id}"]`);
  if(el){el.classList.add("active");el.scrollIntoView({block:"nearest"});activeSidebarItem=el;}
}

function distanceInMeters(position1, position2) {
  const earthRadius = 6371000;

  const lat1 = position1.lat * Math.PI / 180;
  const lat2 = position2.lat * Math.PI / 180;

  const deltaLat =
    (position2.lat - position1.lat) * Math.PI / 180;

  const deltaLng =
    (position2.lng - position1.lng) * Math.PI / 180;

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

function findNearestCam(userPosition) {
  if (!userPosition || allCams.length === 0) {
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

    if (!nearest || distance < nearest.distance) {
      nearest = {
        cam,
        distance
      };
    }
  });

  return nearest;
}

function formatDistance(distance) {
  if (distance < 1000) {
    return `${Math.round(distance)} 公尺`;
  }

  return `${(distance / 1000).toFixed(1)} 公里`;
}

/* ── 使用者定位 ── */
  function locateUser() {
  const button = document.getElementById("locationBtn");
  const status = document.getElementById("status");

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

      const userPosition = currentUserPosition;

      if (userLocationMarker) {
      map.removeLayer(userLocationMarker);
    }

    userLocationMarker = L.circleMarker(
      [userPosition.lat, userPosition.lng],
      {
        radius:9,
        fillColor:"#ef4444",
        fillOpacity:1,
        color:"#ffffff",
        weight:3
      }
    );

    userLocationMarker
      .bindTooltip("我的位置")
      .addTo(map);

    map.setView(
      [userPosition.lat, userPosition.lng],
      16,
      {
        animate:true
      }
    );

      button.disabled = false;
      button.textContent = "📍 我的位置";

      const nearest = findNearestCam(userPosition);

      if (nearest) {
        status.textContent =
          `已完成定位。最近的 CCTV 是「${nearest.cam.name}」，` +
          `距離約 ${formatDistance(nearest.distance)}。`;

        /*
        * 定位完成後自動前往最近 CCTV。
        * 不希望自動跳轉時，可以移除下一行。
        */
        //focusNearestCam();
      } else {
        status.textContent = "已定位，但目前沒有可用的 CCTV 資料。";
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

function esc(s){
  return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

/* ── Google Maps 初始化 ── */
window.initMap = async function () {
  map = L.map("map").setView(
    [25.0478, 121.5318],
    12
  );

  L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
  ).addTo(map);

  try {
    await loadData();
  } catch (err) {
    document.getElementById("status").textContent =
      "載入失敗：" + err.message;
  }
};

document.getElementById("q").addEventListener("input",render);
document.getElementById("districtFilter").addEventListener("change",render);
document.getElementById("locationBtn").addEventListener("click", locateUser);

window.initMap = async function () {
  map = L.map("map").setView(
    [25.0478, 121.5318],
    12
  );

  L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
  ).addTo(map);

  try {
    await loadData();
  } catch (err) {
    document.getElementById("status").textContent =
      "載入失敗：" + err.message;
  }
};

document.getElementById("q").addEventListener("input", render);
document.getElementById("districtFilter").addEventListener("change", render);
document.getElementById("locationBtn").addEventListener("click", locateUser);

/* 啟動 Leaflet 地圖 */
initMap();