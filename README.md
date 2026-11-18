# 生活中的科學　客語詞彙篇｜V1.5.0（2026-11-18）

客語詞彙互動學習網站，分三個主題：擂茶（60詞）、傳統醫學與養生（40詞）、化學實驗（22詞）。海陸腔與四縣腔各一套用字與標音。

## 功能

- 主題切換：擂茶／傳統醫學與養生／化學實驗，另有「所有詞彙」把三個主題的詞接在一起看。網址加 `?topic=tcm`、`?topic=chem` 或 `?topic=all` 可直接開啟。
- 詞彙卡：先看客語漢字與拼音，猜華語詞義，再按「揭曉華語詞義」。
- 讀音：擂茶主題每個詞有海陸腔、四縣腔錄音（另兩個主題尚未錄音）。按「播放」才出聲，不自動播放；有又音的詞多一顆「又音」鈕。鍵盤 P 播放。
- 華語釋義：可切換「逐詞揭曉」或「全部顯示」（每張卡片直接顯示釋義與備註）。
- 腔調切換：海陸腔／四縣腔。
- 標音切換：調值（上標數字）／調型（符號）。
- 分類：各主題依詞性分類（例如名詞、名詞（顏色詞）、動詞、形容詞）；「所有詞彙」不分類。
- 補充：傳統醫學與養生主題附十二正經與任督二脈的示意圖（僅供參考，非教材）。
- 詞彙總表：整表瀏覽，點漢字可跳到該詞的詞彙卡。
- 語音工具：聲調、聲母、元音、韻母配字表、原始圖表、連讀變調（沿用「飄洋過海尋客家」beta V8.1.0）。
- 鍵盤：←／→ 換詞，空白鍵揭曉／蓋回，P 播放讀音，F 全螢幕，Esc 關閉視窗。

## 檔案

- `index.html`：頁面框架。
- `styles.css`：外觀。要調配色、字型，改檔案最上方 `:root` 內的變數。
- `vocab-data.js`：全部詞彙資料。**改詞彙、拼音、釋義、備註只需要編輯這個檔。**
- `app.js`：詞彙卡與詞彙總表的互動程式。
- `assets/audio/hailu/`、`assets/audio/sixian/`：逐詞音檔（MP3）。
- `audio-manifest.js`：音檔清單，網站依此決定哪些詞顯示播放鈕。
- `phonology-tools.js`、`phonology-rimes-data.js`、`assets/images/phonology/`：語音工具。
- `phonology-moe-map.js`：語音工具的 IPA → 教育部拼音對照表（元音表、韻母配字表顯示用）。
- `versions.html`、`CHANGELOG.md`：版本更新紀錄。
- `assets/images/`：詞彙圖片（選用）。
- `assets/images/meridians/`：補充區的經絡示意圖（動態圖 .gif 與縮圖 .jpg）。
- `.nojekyll`：讓GitHub Pages直接發布靜態檔案。

## 修改詞彙

打開 `vocab-data.js`。檔案依主題分段（`topics`），每個主題底下的 `words` 是該主題的詞彙，每個詞是一筆資料：

```js
{ id: 9, group: "noun", pos: "名詞",
  hailu: { han: "番豆", pinyin: "fan53 teu33" },
  sixian: { han: "番豆", pinyin: "fan24 teu55" },
  meaning: "花生",
  note: "海陸腔少用，多見於四縣腔。" }
```

- 拼音一律寫調值（`fan53 teu33`）。調型符號由網站依腔調自動轉換，不必另外輸入。
- 兩腔用字不同時，分別改 `hailu.han` 與 `sixian.han`。
- 又音寫在該腔調內：`hailu: { han: "…", pinyin: "…", alt: "…" }`。
- 色票：顏色詞加上 `colors: ["#ff0000"]`，漢字旁會顯示圓形色塊；寫多個色號就並排多個圓，例如 `colors: ["#019858", "#005757", "#6A6AFF"]`。色號用 `#RRGGBB` 格式。
- 要加圖片：把圖檔放進 `assets/images/`，在該詞加上
  `image: { src: "assets/images/檔名.jpg", credit: "圖片來源" }`，揭曉時會顯示。
- 新增分類：在該主題的 `groups` 加一筆 `{ id: "代號", label: "顯示名稱" }`，詞彙加上 `group: "代號"`。主題的 `groups` 是空的時候不顯示分類頁籤。
- 詞性標籤：詞彙加上 `pos: "名詞"` 就會顯示在卡片與總表。
- 新增主題：在 `topics` 加一段 `{ id: "英文代號", label: "顯示名稱", groups: [], words: [ … ] }`。

## 音檔

- 檔名是該主題內的兩位數編號，又音在編號後加 `-alt`，例如 `08-alt.mp3`。
- 各主題的位置：擂茶在 `assets/audio/hailu/`、`assets/audio/sixian/`；傳統醫學與養生在 `assets/audio/tcm/hailu/`、`assets/audio/tcm/sixian/`；化學實驗在 `assets/audio/chem/hailu/`、`assets/audio/chem/sixian/`。
- **重錄某個詞**：存成同樣的檔名，上傳覆蓋舊檔即可，其他都不用改。
- **新增一個原本沒有的音檔**（例如替某個詞補又音）：把檔案放進對應資料夾，再把檔名（不含 `.mp3`）加進 `audio-manifest.js` 該主題、該腔調的清單。
- 建議格式：單聲道 MP3。瀏覽器對 32 位元浮點 WAV 的支援不一致，請不要直接放。

## 改版時要做的事

每次修正都要留下日誌：

1. 把 `vocab-data.js` 的 `version` 與 `index.html` 的 `<title>` 改成新版本號。
2. 在 `CHANGELOG.md` 最上方新增一筆（版本號、日期、變更內容）。
3. 在 `versions.html` 的 `<main>` 內、標題與說明之後，加上同樣內容的一段，並更新頁首的版本號。

## 部署至GitHub Pages

把本資料夾內**全部檔案與 `assets/` 目錄**上傳到儲存庫根目錄（`index.html` 必須在根目錄），
到 Settings → Pages 選擇 main 分支、/(root)。也可以不連網，直接用瀏覽器開啟 `index.html`。
