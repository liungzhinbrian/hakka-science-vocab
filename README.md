# 生活中的科學　客語詞彙篇｜V1.0.0（2026-11-17）

擂茶客語詞彙互動學習網站。共60詞，海陸腔與四縣腔各一套用字與標音。

## 功能

- 詞彙卡：先看客語漢字與拼音，猜華語詞義，再按「揭曉華語詞義」。
- 腔調切換：海陸腔／四縣腔。
- 標音切換：調值（上標數字）／調型（符號）。
- 分類：全部、名詞、名詞（器物）、動詞、數量詞、形容詞。
- 詞彙總表：整表瀏覽，點漢字可跳到該詞的詞彙卡。
- 語音工具：聲調、聲母、元音、韻母配字表、原始圖表、連讀變調（沿用「飄洋過海尋客家」beta V8.1.0）。
- 鍵盤：←／→ 換詞，空白鍵揭曉／蓋回，F 全螢幕，Esc 關閉視窗。

## 檔案

- `index.html`：頁面框架。
- `styles.css`：外觀。要調配色、字型，改檔案最上方 `:root` 內的變數。
- `vocab-data.js`：全部詞彙資料。**改詞彙、拼音、釋義、備註只需要編輯這個檔。**
- `app.js`：詞彙卡與詞彙總表的互動程式。
- `phonology-tools.js`、`phonology-rimes-data.js`、`assets/images/phonology/`：語音工具。
- `versions.html`、`CHANGELOG.md`：版本更新紀錄。
- `assets/images/`：詞彙圖片（選用）。
- `.nojekyll`：讓GitHub Pages直接發布靜態檔案。

## 修改詞彙

打開 `vocab-data.js`，每個詞是一筆資料：

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
- 要加圖片：把圖檔放進 `assets/images/`，在該詞加上
  `image: { src: "assets/images/檔名.jpg", credit: "圖片來源" }`，揭曉時會顯示。
- 新增分類：在 `groups` 加一筆 `{ id: "代號", label: "顯示名稱" }`，詞彙的 `group` 填同一個代號。

## 改版時要做的事

每次修正都要留下日誌：

1. 把 `vocab-data.js` 的 `version` 與 `index.html` 的 `<title>` 改成新版本號。
2. 在 `CHANGELOG.md` 最上方新增一筆（版本號、日期、變更內容）。
3. 在 `versions.html` 的 `<main>` 內、標題與說明之後，加上同樣內容的一段，並更新頁首的版本號。

## 部署至GitHub Pages

把本資料夾內**全部檔案與 `assets/` 目錄**上傳到儲存庫根目錄（`index.html` 必須在根目錄），
到 Settings → Pages 選擇 main 分支、/(root)。也可以不連網，直接用瀏覽器開啟 `index.html`。
