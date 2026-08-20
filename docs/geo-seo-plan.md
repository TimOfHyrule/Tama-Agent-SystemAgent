# GEO + 在地 SEO：策略與落地規劃

狀態：**規劃中，尚未寫入 Tamarada**。這份文件是要被你改的，不是要被執行的。

範圍：同時涵蓋 **GEO**（Generative Engine Optimization，讓內容在 AI 生成式回答裡
被引用）與 **在地 SEO**（Local SEO，地圖包、在地關鍵字、GBP）。

---

## 1. 先講會卡住的三件事

規劃之前先把地基查清楚了，這三點決定了整個設計的形狀：

**一、Tamarada 沒有任何搜尋外掛。** 目前 install 上 18 個 plugin，唯一能對外拿資料
的是 `data/httpRequest`（狀態 ready，不需要 env）。沒有 SERP、沒有 Google Search
Console、沒有網頁搜尋。所以任何排名或引用資料，都得是「我們自己去打某個第三方 API」，
而那個 API 要嘛付費、要嘛要 OAuth。憑證可以用 `{{credential:HTTP_XXX}}` 注入，不必
寫進 SOP，這點沒問題。

**二、GEO 沒有「查排名」這回事。** 生成式引擎不給你排名表。業界實際能做的只有一種：
自己準備一組真人會問的問題，每週對各引擎問一遍，解析答案裡有沒有你、引用了哪一頁、
同時引用了誰。這在 Tamarada 裡完全做得出來（`httpRequest` 打 Anthropic / OpenAI /
Perplexity），但每跑一次就是 N 題 × M 引擎的第三方帳單 —— 那是你自己的 API 帳戶，
和 Tamarada 的 BYOK key 是兩本帳，但都是錢。

**三、寄不出去。** `communicate/emailSend` 狀態是 needs-setup，缺 `GMAIL_USER` 與
`GMAIL_APP_PASSWORD`。在補上之前，週報只能寫成 Pipeline Page 上的檔案給你自己看，
不能自動寄。

---

## 2. 追蹤什麼（策略層）

兩邊要衡量的東西不一樣，不要混成一張表。

### GEO — 衡量「被引用」

單位不是關鍵字，是**問題**。「台北 除濕機 推薦」是關鍵字；「我住在台北，房間會反潮，
該買哪種除濕機」才是有人真的會打進 AI 的東西。GEO 的整份清單都應該長成後者。

每次檢查要記下四件事，缺一不可：
- **有沒有被提到**（是非）
- **被引用的是哪一頁 URL** —— 這是後續唯一能行動的線索
- **同一個答案裡還引用了誰** —— 競爭對手的名單，比自己的分數有用
- **答案裡提到我們的那一段原文** —— 事後要判斷「為什麼是這頁而不是那頁」，只有這段能回答

### 在地 SEO — 衡量「被找到」

- Google Business Profile 的曝光/互動（GBP Performance API，免費但要 OAuth）
- Search Console 的在地查詢曝光與點擊（同樣免費、同樣要 OAuth）
- 地圖包排名要看**格點**（同一個關鍵字在城市不同座標排名不同），沒有免費 API，
  需要第三方（Local Falcon 之類）或自建座標查詢

---

## 3. 在 Tamarada 裡長什麼樣（系統層）

一個 Pipeline Page：**「搜尋可見度」**。一頁 = 一套互動系統，GEO 和在地 SEO 共用一頁，
因為它們回答的是同一個問題：「有人在找這類東西的時候，找不找得到我們」。

### Collections

**`queries`** —— 追蹤標的清單，人維護，很少變。

| 欄位 | 描述寫什麼（描述要說「意思」，不是「型別」） |
|---|---|
| `query_text` | 一個真人會完整打出來的問題或搜尋詞 |
| `surface` | 要在哪裡被看見：AI 生成回答 / 自然排名 / 地圖包 |
| `intent` | 問這句話的人想達成什麼：找店家、比較選項、學做法 |
| `locale` | 提問者所處的地理與語言脈絡，會改變答案的那種 |
| `priority` | 值不值得每週為它花一次查詢的錢，1-5 |

**`visibility_checks`** —— 每次檢查一筆，只進不出，這是整個系統的歷史。

| 欄位 | 描述寫什麼 |
|---|---|
| `checked_at` | 這次檢查發生的時間 |
| `query_text` | 當時實際送出去的問題原文 |
| `engine` | 哪一個引擎給的答案 |
| `cited` | 我們有沒有出現在答案裡 |
| `rank` | 出現在第幾順位；完全沒出現記 0 |
| `cited_url` | 被引用的是我們的哪一頁 |
| `others_cited` | 同一個答案裡被引用的其他來源 |
| `evidence` | 答案中提到我們的那一段原文，用來事後判斷原因 |

**`actions`** —— 從資料推出來的待辦，人決定做不做。

### 頁面檔案（不是 collection）

週報是散文，**不能寫進 collection**。`collectionRecordWrite` 只吃「鍵對得上欄位的
JSON 物件」，丟純文字會在 pipeline 最後一步失敗 —— 也就是前面所有花掉的錢都已經花完
之後才失敗。這條是上次踩過的（`memory/dead-ends.md`）。所以週報走
`data/pipelinePageWrite`，寫成頁面上的 `weekly-digest.md`。

### SOP 與 module

- `geo-visibility-check` —— 讀 `queries`、逐題打引擎、解析、寫進 `visibility_checks`
- `local-seo-pull` —— 拉 GSC / GBP 數字，寫進 `visibility_checks`
- `visibility-digest` —— 讀本週資料，寫 `weekly-digest.md`

每支 SOP 配一個 module 指到這一頁。

**這裡有個未解的技術風險：** 我手上沒有 `sopContract.js`，不確定步驟能不能對一份清單
迭代。整個 `geo-visibility-check` 是「N 題 × M 引擎」的迴圈，如果步驟詞彙表達不出迭代，
設計就得換一種形狀（例如一次 httpRequest 帶整批、或一題一個 module）。寫 SOP 之前必須
先拿到那個檔案 —— 無效步驟寫入時會被擋，但**「合法但不做你以為的事」的步驟不會被擋**。

---

## 4. 進行順序

| 階段 | 做什麼 | 誰做 | 花錢嗎 |
|---|---|---|---|
| 0 | 決定標的網域、業別、服務地區、語言；擬第一版問題清單（10–20 題） | 你 + 我 | 否 |
| 1 | 決定資料來源，存好憑證（`PUT /api/accounts/me/credentials`） | 你 | 第三方帳單 |
| 2 | 建 page + 三個 collections | 我 | 不動 Anthropic key |
| 3 | 寫 SOP（需先有 `sopContract.js`）+ 建 modules | 我 | 不動 Anthropic key |
| 4 | `GET /api/pipeline-pages/:id/readiness` 要回 `ok`，然後**手動跑一次** | 我，先問你 | **會花錢** |
| 5 | 確認結果對了才排程 | 你決定頻率 | 每次都花錢 |

第 2、3 階段不會動到你的 Anthropic key。第 4 階段開始每一次執行都會，而且沒有例外，
所以節奏就是成本：GEO 每週一次夠了，不要每天。

---

## 5. 需要你回答的三件事

1. **標的是誰？** 網域、業別、服務的城市／國家、語言市場。這決定問題清單長什麼樣。
2. **GEO 要打哪些引擎，你願意開第三方 API key 嗎？** 或者先做低成本版：一週一次人工
   把答案貼進來，系統只負責解析與記錄，先驗證這批問題選得對不對，再自動化。
3. **在地 SEO 要不要接 Google？** GSC / GBP 是 OAuth，而 `httpRequest` 只能帶靜態
   憑證，access token 會過期。要嘛有人定期換 token，要嘛在外面跑一支小程式換好再餵進來。
   要接就得先解決這件事。
