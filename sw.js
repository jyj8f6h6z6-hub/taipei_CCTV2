/*
 * Service Worker：讓網站第二次開啟後幾乎秒開、更省流量
 *
 * 策略：
 * - 本站檔案（網頁、程式、資料）：先用手機裡存的版本立刻顯示，
 *   同時在背景下載新版，下次開啟就是新的
 * - 外部程式庫（Leaflet、行政區邊界）：版本固定，存一次就一直用
 * - 其他（Google 地圖、地圖底圖、CCTV 影像）：不經手，照常連網
 *
 * 一般改版「不需要」修改這個檔案。
 * 只有快取方式本身大改時，才把 CACHE_NAME 的數字加 1。
 */

const CACHE_NAME = "cctv-map-cache-v1";

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

  // 本站檔案：先顯示存檔，背景更新
  if (
    url.origin === self.location.origin &&
    url.pathname.startsWith(scopePath)
  ) {
    event.respondWith(staleWhileRevalidate(event));
    return;
  }

  // 外部程式庫：有存檔就直接用
  if (CDN_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(request));
  }

  // 其他請求不處理，交給瀏覽器照常連網
});


/* 先回傳存檔，同時在背景下載新版 */
async function staleWhileRevalidate(event) {
  const request = event.request;
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const networkUpdate = fetch(request)
    .then(response => {
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(
          saveToCache(cache, request, copy)
        );
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