import json
import re

import requests


API_URL = (
    "https://tcintgr.tycg.gov.tw/"
    "cptapi/Other/api/getCctvData"
    "?$format=json"
    "&$token=FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF"
)


def clean_location(value):
    text = str(value or "").strip()

    text = re.sub(
        r"^\s*[\(（]CCTV\d+[\)）]\s*",
        "",
        text,
        flags=re.IGNORECASE,
    )

    return text.strip()


def extract_district(location):
    match = re.search(
        r"([\u4e00-\u9fff]{2,4}區)",
        location,
    )

    if match:
        return match.group(1)

    return "未判定"


def main():
    session = requests.Session()

    session.headers.update({
        "User-Agent": (
            "Mozilla/5.0 "
            "taoyuan-cctv-local-updater/1.0"
        ),
        "Accept": "application/json, text/plain, */*",
        "Referer": "https://tcc.tycg.gov.tw/ATISNew/",
    })

    print("下載桃園道路 CCTV API……")

    response = session.get(
        API_URL,
        timeout=(30, 120),
    )

    response.raise_for_status()
    data = response.json()

    if not isinstance(data, list):
        raise SystemExit(
            "桃園 CCTV API 格式不正確，預期為陣列。"
        )

    print(f"API 原始資料：{len(data)} 筆")

    output = []
    excluded_non_taoyuan = 0
    invalid_count = 0
    seen_ids = set()

    for row in data:
        if not isinstance(row, dict):
            continue

        area = str(
            row.get("Area") or ""
        ).strip().upper()

        if area != "TAO":
            excluded_non_taoyuan += 1
            continue

        device_id = str(
            row.get("DeviceId") or ""
        ).strip()

        location = clean_location(
            row.get("Location")
        )

        stream_url = str(
            row.get("UrlStreaming")
            or row.get("Url")
            or ""
        ).strip()

        try:
            latitude = float(
                str(
                    row.get("Latitude") or ""
                ).strip()
            )

            longitude = float(
                str(
                    row.get("Longitude") or ""
                ).strip()
            )
        except (TypeError, ValueError):
            invalid_count += 1
            continue

        if (
            not device_id
            or not location
            or not stream_url
        ):
            invalid_count += 1
            continue

        if device_id in seen_ids:
            continue

        if not (
            120.90 <= longitude <= 121.50
            and
            24.60 <= latitude <= 25.20
        ):
            invalid_count += 1
            continue

        seen_ids.add(device_id)

        output.append({
            "id": device_id,
            "name": location,
            "x": longitude,
            "y": latitude,
            "city": "桃園市",
            "district": extract_district(location),
            "url": stream_url,
            "streamUrl": stream_url,
            "type": "road",
            "source": "桃園市政府交通局",
        })

    if not output:
        raise SystemExit(
            "整理後沒有任何可用的桃園道路 CCTV。"
        )

    output.sort(
        key=lambda item: (
            item["district"],
            item["name"],
            item["id"],
        )
    )

    result = {
        "count": len(output),
        "sourceCount": len(data),
        "excludedNonTaoyuanCount":
            excluded_non_taoyuan,
        "invalidCount": invalid_count,
        "results": output,
    }

    with open(
        "taoyuan-road-cctv.json",
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            result,
            file,
            ensure_ascii=False,
            indent=2,
        )

    print(
        f"成功產生 {len(output)} 筆桃園道路 CCTV。"
    )

    print(
        "排除非 TAO 資料："
        f"{excluded_non_taoyuan} 筆。"
    )

    print(
        "排除格式或座標異常："
        f"{invalid_count} 筆。"
    )


if __name__ == "__main__":
    main()