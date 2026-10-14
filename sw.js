/*
 * Service Worker：讓網站開啟更快、更省流量，並自動偵測更新
 *
 * 策略：
 * - 網頁本身（index.html）：每次先上網檢查新版，
 *   3 秒內沒回應才用存檔 → 網站改版會自動生效
 * - 程式與資料（script.js、style.css、data/*.json）：
 *   先用存檔立刻顯示，背景下載新版；
 *   若攝影機資料有變化，通知網頁顯示「資料有更新」
 * - 外部程式庫（Leaflet、行政區邊界）：版本固定，存一次就一直用
 * - 其他（Google 地圖、地圖底圖、CCTV 影像）：不經手，照常連網
 *
 * 一般改版「不需要」修改這個檔案。
 * 只有快取方式本身大改時，才把 CACHE_NAME 的數字加 1。
 */

const CACHE_NAME = "cctv-map-cache-v1";

/* 網頁本身等待網路的最長時間（毫秒） */
const NETWORK_TIMEOUT = 3000;

/* 這些網站上的程式庫版本固定，可以放心長期保存 */
const CDN_HOSTS = [
  "unpkg.com",
  "cdn.jsdelivr.net"
];


/* 安裝：新版 Service Worker 立即生效 */
self.addEventListener("install", () => {
  self.skipWaiting();
});


/* 啟用：刪除舊的快取，並接管目前開著的網頁 */
self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();

      await Promise.all(
        names
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );

      await self.clients.claim();
    })()
  );
});


/* 攔截網路請求，決定要用快取還是連網 */
self.addEventListener("fetch", event => {
  const request = event.request;

  // 只處理「讀取」類請求
  if (request.method !== "GET") {
    return;
  }

  // 避開 Chrome 開發者工具的特殊請求
  if (
    request.cache === "only-if-cached" &&
    request.mode !== "same-origin"
  ) {
    return;
  }

  const url = new URL(request.url);
  const scopePath =
    new URL(self.registration.scope).pathname;

  // 本站檔案
  if (
    url.origin === self.location.origin &&
    url.pathname.startsWith(scopePath)
  ) {
    if (request.mode === "navigate") {
      // 網頁本身：網路優先，確保改版自動生效
      event.respondWith(networkFirst(event));
    } else {
      // 程式與資料：先顯示存檔，背景更新
      event.respondWith(staleWhileRevalidate(event));
    }
    return;
  }

  // 外部程式庫：有存檔就直接用
  if (CDN_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(request));
  }

  // 其他請求不處理，交給瀏覽器照常連網
});


/* 網路優先：先上網，逾時或失敗才用存檔 */
async function networkFirst(event) {
  const request = event.request;
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetchWithTimeout(
      request,
      NETWORK_TIMEOUT
    );

    if (response.ok) {
      event.waitUntil(
        cache.put(request, response.clone())
      );
    }

    return response;

  } catch (error) {
    const cached = await cache.match(request);
    return cached || Response.error();
  }
}


/* 先回傳存檔，同時在背景下載新版 */
async function staleWhileRevalidate(event) {
  const request = event.request;
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  // 先複製一份舊存檔，等一下用來比對內容
  const cachedCopy = cached ? cached.clone() : null;

  const networkUpdate = fetch(request)
    .then(response => {
      if (response.ok) {
        const copyForCache = response.clone();

        event.waitUntil(
          saveToCache(cache, request, copyForCache)
        );

        // 攝影機資料：比對新舊內容，有變化就通知網頁
        if (cachedCopy && isDataFile(request.url)) {
          const copyForCompare = response.clone();

          event.waitUntil(
            notifyIfChanged(
              cachedCopy,
              copyForCompare,
              request.url
            )
          );
        }
      }

      return response;
    })
    .catch(() => null);

  if (cached) {
    event.waitUntil(networkUpdate);
    return cached;
  }

  const response = await networkUpdate;

  return response || Response.error();
}


/* 有存檔就直接用，沒有才連網下載並保存 */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  const response = await fetch(request);

  if (response.ok || response.type === "opaque") {
    cache.put(request, response.clone());
  }

  return response;
}


/* 有時間限制的網路請求 */
function fetchWithTimeout(request, milliseconds) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("網路逾時"));
    }, milliseconds);

    fetch(request).then(
      response => {
        clearTimeout(timer);
        resolve(response);
      },
      error => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}


/* 判斷是不是 data 資料夾裡的攝影機資料 */
function isDataFile(url) {
  return new URL(url).pathname.includes("/data/");
}


/* 比對新舊資料，內容不同就通知所有開著的網頁 */
async function notifyIfChanged(oldResponse, newResponse, url) {
  const [oldText, newText] = await Promise.all([
    oldResponse.text(),
    newResponse.text()
  ]);

  if (oldText === newText) {
    return;
  }

  const windows = await self.clients.matchAll({
    type: "window"
  });

  windows.forEach(client => {
    client.postMessage({
      type: "data-updated",
      url
    });
  });
}


/*
 * 保存到快取。
 * 如果是 script.js?v=2.1.0 這種帶版號的檔案，
 * 順便刪掉舊版號的存檔，避免手機空間越用越多。
 */
async function saveToCache(cache, request, response) {
  const url = new URL(request.url);

  if (url.search) {
    const keys = await cache.keys();

    await Promise.all(
      keys
        .filter(key => {
          const keyUrl = new URL(key.url);

          return (
            keyUrl.pathname === url.pathname &&
            keyUrl.search !== url.search
          );
        })
        .map(key => cache.delete(key))
    );
  }

  await cache.put(request, response);
}