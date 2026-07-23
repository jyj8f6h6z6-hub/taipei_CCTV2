手動更新桃園 CCTV 資料

這份文件是「桃園道路 CCTV 手動更新教學」。

桃園市 CCTV API 目前無法由 GitHub Actions 的雲端主機穩定連線，因此桃園資料需在自己的電腦上更新，再提交到 GitHub。

一、開啟專案

使用 VS Code 開啟專案資料夾：

D:\taipei_CCTV2

二、開啟 VS Code 終端機

在 VS Code 上方選單點選：

終端機
→ 新增終端機

正常情況下，終端機會顯示：

PS D:\taipei_CCTV2>

若目前不在專案資料夾，輸入：

cd D:\taipei_CCTV2

三、執行桃園 CCTV 更新程式

在終端機輸入：

python update-taoyuan-road-cctv.py

成功時會看到類似：

下載桃園道路 CCTV API……
API 原始資料：640 筆
成功產生 350 筆桃園道路 CCTV。
排除非 TAO 資料：290 筆。
排除格式或座標異常：0 筆。

程式會更新這個檔案：

taoyuan-road-cctv.json

四、確認網站資料

更新完成後，可以先在 VS Code 重新整理網站，確認：

縣市：桃園市
行政區：可正常選擇
地圖標記：正常顯示
CCTV：可正常播放

五、提交到 GitHub

使用 VS Code 原始檔控制

點左側「原始檔控制」圖示。

確認變更清單中有：

taoyuan-road-cctv.json

在提交訊息欄輸入：

更新桃園道路 CCTV 資料

按「Commit」。

按「Sync Changes」或「Push」。

六、更新失敗時

出現 python 找不到

改用：

py update-taoyuan-road-cctv.py

出現 No module named requests

先執行：

python -m pip install requests

再重新執行：

python update-taoyuan-road-cctv.py

出現連線逾時

稍後再執行一次：

python update-taoyuan-road-cctv.py

JSON 已更新，但網站仍顯示舊資料

在瀏覽器按：

Ctrl + Shift + R

強制重新載入。

七、最簡單的記憶方式

每次要更新桃園 CCTV，只要做兩件事：

python update-taoyuan-road-cctv.py

然後：

Commit
→ Push