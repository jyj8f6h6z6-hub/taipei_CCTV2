const fs = require("fs");
const path = require("path");

// 不論從哪裡執行都正確：原始檔在 raw/，輸出到 data/
const root = path.resolve(__dirname, "..");

const inputFile = path.join(root, "raw", "kaohsiung-original.json");
const outputFile = path.join(root, "data", "kaohsiung-road-cctv.json");

// 舊網域 cctvN.kctmc.nat.gov.tw 的憑證已不符，瀏覽器會拒絕連線；
// 同一支攝影機改用 cctvN.itc.tbkc.gov.tw 即可正常開啟（路徑相同）
function fixHost(value) {
  return String(value || "")
    .trim()
    .replace(
      /^(https?:\/\/)(cctv\d+)\.kctmc\.nat\.gov\.tw(?=[/:?]|$)/i,
      "$1$2.itc.tbkc.gov.tw"
    );
}

// cctv5 這批「/jpeg/CamXXX.php」預覽圖在新網域只會回傳黑畫面，
// 留空後地圖視窗不會顯示「查看預覽圖」按鈕，即時影像仍可正常開啟
function fixImageUrl(value) {
  const fixed = fixHost(value);

  return /^https?:\/\/cctv\d+\.itc\.tbkc\.gov\.tw\/jpeg\/[^/?]+\.php/i.test(fixed)
    ? ""
    : fixed;
}

const raw = JSON.parse(
  fs.readFileSync(inputFile, "utf8")
);

if (!Array.isArray(raw)) {
  throw new Error("高雄原始資料不是陣列格式");
}

// 同一個 id 重複出現時只保留第一筆（避免驗證時發現重複的 key）
const seenIds = new Set();

const results = raw
  .map(cam => {
    const id = String(
      cam.id || ""
    ).trim();

    const name = String(
      cam.name || id
    ).trim();

    const x = Number(
      cam.position?.lng
    );

    const y = Number(
      cam.position?.lat
    );

    const imageUrl = fixImageUrl(cam.imageUrl);

    const videoUrl = String(
      cam.videoUrl ||
      cam.url ||
      ""
    ).trim();

    return {
      key: `kaohsiung-road-${id}`,
      id,
      name,
      x,
      y,
      city: "高雄市",
      district: "未判定",
      imageUrl,
      url: videoUrl || imageUrl,
      streamUrl: videoUrl,
      locationImage: String(
        cam.locationImage || ""
      ).trim(),
      type: "road",
      source: "高雄市政府交通局"
    };
  })
  .filter(cam =>
    cam.id &&
    Number.isFinite(cam.x) &&
    Number.isFinite(cam.y) &&
    // 座標超出臺灣範圍的資料直接略過，避免一筆壞資料擋住整批更新
    cam.x >= 118 && cam.x <= 123.5 &&
    cam.y >= 21 && cam.y <= 26.5 &&
    cam.url
  )
  .filter(cam => {
    if (seenIds.has(cam.id)) return false;
    seenIds.add(cam.id);
    return true;
  });

const output = {
  metadata: {
    source: "高雄市政府交通局",
    total: results.length,
    skipped: raw.length - results.length
  },
  results
};

fs.writeFileSync(
  outputFile,
  JSON.stringify(output),
  "utf8"
);

console.log(
  `已產生 ${outputFile}，共 ${results.length} 支 CCTV，略過 ${raw.length - results.length} 筆`
);