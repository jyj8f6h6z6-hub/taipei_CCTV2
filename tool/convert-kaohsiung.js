const fs = require("fs");

const inputFile = "kaohsiung-original.json";
const outputFile = "kaohsiung-road-cctv.json";

const raw = JSON.parse(
  fs.readFileSync(inputFile, "utf8")
);

if (!Array.isArray(raw)) {
  throw new Error("高雄原始資料不是陣列格式");
}

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

    const imageUrl = String(
      cam.imageUrl || ""
    ).trim();

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
    cam.url
  );

const output = {
  metadata: {
    source: "高雄市政府交通局",
    total: results.length
  },
  results
};

fs.writeFileSync(
  outputFile,
  JSON.stringify(output, null, 2),
  "utf8"
);

console.log(
  `已產生 ${outputFile}，共 ${results.length} 支 CCTV`
);