# 守宮陪伴放置遊戲 — 開發規格書

> 這份文件是給 Claude Code 的完整開發依據。請依照「開發階段」的順序實作，Phase 1 完成後即可遊玩驗證，不依賴任何美術資源。

---

## 1. 遊戲概述

一款療癒系守宮飼養放置遊戲。玩家擁有一個飼養缸和一隻守宮，守宮保持真實的夜行性習性：大部分時間在睡覺，關燈時才活躍。核心情感是「安靜的陪伴」——牠在你身邊過自己的生活，隨著好感度提升，牠越來越信任你、願意在你面前自在活動。

**設計基調（所有實作決策以此為準）：**
- 療癒、低壓，沒有死亡與失敗懲罰
- 低好感度的「代價」是守宮躲藏、不理你，而非扣血或生病
- 尊重真實守宮習性：夜行、日間睡覺、脫皮、以大便作為健康訊號
- 放置回收的內容：回來時發現牠脫皮了／餓了／大便了／換了睡姿

---

## 2. 技術選型

- **平台**：網頁（單頁應用），優先手機直式版面，桌面也可玩
- **技術**：Vite + Vanilla JS（或 TypeScript），不用框架也可以；若用框架選 React
- **繪圖**：DOM/CSS 為主，sprite 用 `<img>` 或 CSS background 切換；夜視濾鏡用 CSS filter
- **存檔**：localStorage，JSON 格式，每次狀態變更即存
- **時間**：所有冷卻與離線計算以真實時間 `Date.now()` 為準
- **像素風設定**：`image-rendering: pixelated`，畫面整體以固定倍率縮放（如 3x）

---

## 3. 核心資料模型

```js
gameState = {
  gecko: {
    name: string,
    affinity: number,        // 好感度 0–100
    hunger: number,          // 飽食度 0–100，隨時間下降
    weightGrams: number,     // 體重
    stage: "juvenile" | "subadult" | "adult",
    ageDays: number,         // 以真實天數累計
    isShedding: boolean,
    currentActivity: "sleeping" | "active" | "hiding" | "frozen",
    sleepPoseId: string,     // 目前睡姿
    locationId: string,      // 目前所在位置（hide / 水盆旁 / 流木上 / 玻璃邊 / 開闊處）
  },
  environment: {
    lightOn: boolean,
    viewMode: "normal" | "nightvision",
    poopPresent: boolean,
    shedSkinPresent: boolean,
  },
  timers: {
    lastFedAt: timestamp,
    lastSeenAt: timestamp,       // 上次開啟遊戲時間，用於離線結算
    lastPoopAt: timestamp,
    lastPoseChangeAt: timestamp,
    nextShedAt: timestamp,
  },
  records: {
    weighHistory: [{date, grams}],
    handTameCount: number,       // 成功上手次數
    photosUnlocked: [poseId],    // 看過的睡姿圖鑑
  }
}
```

---

## 4. 系統規格

### 4.1 燈光與觀看模式（核心機制）

三種畫面狀態：

| 狀態 | 條件 | 守宮行為 |
|---|---|---|
| 開燈 | lightOn = true | 見 4.2 好感度分級行為 |
| 關燈 | lightOn = false, viewMode = normal | 畫面全暗，幾乎看不見，只有微弱輪廓 |
| 夜視模式 | lightOn = false, viewMode = nightvision | 綠灰色濾鏡＋雜訊效果，守宮呈現自然夜間行為（活動、探索、喝水），完全不受打擾 |

- 所有互動按鈕（餵食、夾便、摸摸、量體重）**只在開燈時可用**；夜視模式是純觀察
- 夜視濾鏡實作：CSS `filter: grayscale + 綠色 tint`，加一層半透明雜訊 overlay，右上角顯示「REC ●」增加監視器感

### 4.2 好感度系統

好感度 0–100，分四級，決定開燈時的行為：

| 等級 | 範圍 | 開燈時反應 |
|---|---|---|
| 陌生 | 0–24 | 立刻定格 1–2 秒 → 快速躲進 hide，開燈期間不出來 |
| 警戒 | 25–49 | 定格 → 緩慢退到 hide 附近，偶爾探頭 |
| 熟悉 | 50–74 | 短暫定格後繼續原本的活動，但和玩家互動仍會閃躲 |
| 信任 | 75–100 | 開燈下自在活動甚至睡覺；解鎖「開闊處大字睡姿」 |

**加分事件**：成功餵食 +3；成功摸摸 +2；每日簽到看牠（開啟遊戲）+1；夾便 +1；成功上手 +5
**減分事件**：摸摸被閃躲 −1；連續 3 天未開啟遊戲，每日 −2（下限不低於當前等級的底線，避免挫折感）
**節奏目標**：正常每天玩 5 分鐘，約 3–4 週從 0 到信任級

### 4.3 六顆互動按鈕

1. **燈光開關**：切換 lightOn。開燈觸發 4.2 的行為反應
2. **夜視鏡**：僅關燈時可按，切換 viewMode
3. **餵食（蟲）**：冷卻 3 小時（真實時間）。按下後蟲出現並跟隨玩家手指/滑鼠移動，守宮會被吸引出來追蟲；玩家引導 5–10 秒後守宮撲食。hunger 回滿，affinity +3。冷卻中按鈕顯示剩餘時間
4. **夾子（清便）**:僅在 poopPresent 時有東西可夾。點大便將其夾走，affinity +1，顯示「牠很健康！」的訊息。大便產生規則：進食後 12–36 小時內隨機產生
5. **手（摸摸／上手）**：按下後選擇模式：
   - **摸摸**：伸手動畫 → 機率判定。成功率 = affinity%（加減隨機 ±10）。成功：守宮瞇眼享受動畫，affinity +2；失敗：閃開動畫，affinity −1
   - **手心朝上**：手掌平放等待 5 秒 → 判定守宮是否上手。成功率 = max(0, (affinity − 50)) × 1.5%，即好感 50 以下不可能、100 時 75%。成功 = 大獎：特寫動畫＋affinity +5＋記錄 handTameCount。失敗：牠聞一聞轉頭走掉（可愛化處理，不扣分）
6. **磅秤（量體重）**：顯示目前體重並記錄到 weighHistory，畫成長曲線圖。體重隨 ageDays 與餵食頻率成長

### 4.4 放置／離線結算

開啟遊戲時計算 `Date.now() − lastSeenAt`，依序結算：

- hunger 隨時間下降（每 6 小時 −10，下限 20——療癒向，不會餓死，只會「很想吃」）
- 大便判定（依 4.3 規則）
- 睡姿與位置更換（每 1–3 小時換一次，離線期間照樣輪換）
- 脫皮判定：nextShedAt 到期時 isShedding = true，守宮發白；6–24 小時後完成，缸內留下蛻皮（shedSkinPresent），玩家用夾子收走，收藏進圖鑑
- 回歸畫面：預設以**關燈＋夜視模式**開場，讓玩家先「偷看」牠的現況，再自行決定要不要開燈介入

### 4.5 睡姿輪換系統

- 睡姿 = poseId × locationId 的組合，程式隨機輪換（避免連續重複同一組合）
- 第一次看到新的「姿勢×地點」組合時，解鎖圖鑑並顯示小提示（收集要素）
- 稀有睡姿（如卡在奇怪角落）：2% 觸發率

### 4.6 成長系統

- juvenile（0–60 天）→ subadult（60–180 天）→ adult（180+ 天），以真實天數計
- 實作方式：sprite 縮放（幼體 0.6x、亞成 0.8x、成體 1x）＋幼體色調對比較高
- 體重成長曲線與階段連動

---

## 5. 美術資源規範

### 5.0 外觀參考（以玩家的寵物為原型）

遊戲主角以玩家真實飼養的**肥尾守宮（African Fat-tailed Gecko）**為原型，所有 sprite 與佔位圖形依以下特徵繪製：

- **體型**：粗壯短胖，頭大而圓、吻部短鈍，尾巴肥厚（這是肥尾守宮的招牌，佔位圖形的尾巴要畫得比豹紋守宮更粗）
- **花紋**：深棕與淺棕的寬橫帶（band）交錯環繞全身，帶與帶交界有細乳白色鑲邊；淺色帶上散布深棕色小圓斑點
- **眼睛**：大而深的黑棕色眼睛，外圈一圈乳白色細邊（像眼線），是最重要的辨識特徵，48px sprite 上務必保留
- **腹面與四肢**：粉膚色偏白，與背部形成明顯對比
- **建議主色盤**（從照片取樣）：
  - 深巧克力棕 `#5C3A28`（深色帶）
  - 焦糖橘棕 `#C08552`（淺色帶）
  - 暖棕斑點 `#7A4E30`
  - 乳白鑲邊 `#EFE3D0`（帶緣、眼圈）
  - 粉膚色 `#D9A98F`（腹面、四肢）
  - 近黑深棕 `#241812`（眼睛、輪廓線）

### 5.1 目錄與命名

```
/assets/sprites/
  sleep_curl_1.png, sleep_curl_2.png        // 蜷睡呼吸 2 frames
  sleep_flat_1.png, sleep_flat_2.png        // 攤平趴睡
  sleep_hide_1.png, sleep_hide_2.png        // hide 中露尾
  sleep_glass_1.png, sleep_glass_2.png      // 貼玻璃睡
  sleep_open_1.png, sleep_open_2.png        // 開闊處大字睡（信任級解鎖）
  walk_1.png ... walk_4.png                 // 走路循環
  freeze_1.png                              // 定格警戒
  retreat_1.png ... retreat_3.png           // 縮回 hide
  yawn_1.png ... yawn_3.png                 // 打哈欠
  lick_eye_1.png, lick_eye_2.png            // 舔眼睛
  hunt_1.png ... hunt_6.png                 // 追蟲＋捕食
  pet_happy_1.png, pet_happy_2.png          // 摸摸成功瞇眼
  pet_dodge_1.png, pet_dodge_2.png          // 閃開
  hand_climb_1.png ... hand_climb_4.png     // 上手
  shed_white_1.png                          // 脫皮發白（可用色調替代）
  poop.png / shed_skin.png / worm_1.png, worm_2.png
/assets/scene/
  tank_bg.png / hide.png / water_dish.png / driftwood.png
/assets/ui/
  icon_light.png / icon_nightvision.png / icon_worm.png
  icon_clamp.png / icon_hand.png / icon_scale.png
```

### 5.2 規格

- 守宮 sprite：48×48 px 畫布（實際佔用約 40×30），透明背景 PNG
- 場景：缸底圖 320×240 px，擺設各自獨立成圖（可重新排列位置）
- 調色盤：全遊戲限制 16–24 色，維持統一像素風
- **重要**：程式需支援水平鏡像翻轉（免費多一倍變化）；夜視效果由程式濾鏡處理，美術不用畫夜間版本

### 5.3 佔位圖形要求（Phase 1 用）

在任何 PNG 存在之前，程式用 SVG/Canvas 畫一隻簡化守宮（橢圓身體＋粗尾巴＋四個小短腿＋兩顆圓眼睛），支援所有狀態的簡化表現（睡＝閉眼縮起、定格＝瞪大眼、走路＝腿部擺動）。資源載入採 fallback 機制：`有 PNG 用 PNG，沒有就用佔位圖形`，讓美術可以一張一張逐步替換。

---

## 6. 開發階段

### Phase 1 — 可玩核心（先做這個）
- [ ] 專案架構、gameState、localStorage 存讀檔
- [ ] 缸畫面＋佔位守宮（含呼吸動畫）
- [ ] 燈光開關＋好感度四級行為反應（定格/躲藏/自在）
- [ ] 夜視模式（濾鏡＋守宮夜間活動）
- [ ] 餵食：3 小時冷卻＋蟲跟隨手指＋撲食＋加好感
- [ ] 好感度數值系統與 UI 顯示
- [ ] 離線結算：hunger 下降、睡姿輪換、回歸時預設夜視開場

**Phase 1 驗收標準**：關燈用夜視看牠活動 → 開燈牠定格躲起來 → 餵幾天蟲好感變高 → 開燈牠不再躲。這個循環成立，遊戲就成立。

### Phase 2 — 完整互動
- [ ] 大便系統＋夾子清理
- [ ] 摸摸／手心朝上（機率判定＋動畫）
- [ ] 量體重＋成長曲線圖
- [ ] 脫皮事件（發白→蛻皮→收藏）
- [ ] 睡姿×地點輪換＋圖鑑解鎖
- [ ] 音效（環境蟲鳴、按鈕音、撲食音）

### Phase 3 — 打磨與內容
- [ ] 成長階段（幼體→成體）
- [ ] 稀有睡姿與彩蛋
- [ ] 睡眠微動作（打哈欠、舔眼、翻身）
- [ ] 上手大獎的特寫演出
- [ ] 每日提示訊息（「牠今天換了新的地方睡覺」）
- [ ] 手機 PWA 包裝（可加到主畫面）

---

## 7. 給 Claude Code 的實作備註

- 動畫 frame 切換用簡單的 interval/requestAnimationFrame 循環即可，不需要動畫函式庫
- 所有機率與數值參數集中在一個 `config.js`，方便調整平衡
- 守宮的行為用有限狀態機（FSM）實作：sleeping / active / hiding / frozen / eating / being_petted 之間的轉移由燈光、好感度、互動事件驅動
- 蟲跟隨手指：監聽 pointermove，蟲以緩動（lerp）跟隨；守宮以較慢速度追蟲，距離夠近時觸發撲食
- 離線結算務必冪等：以 timestamp 差值計算，不依賴遊戲開著
- 先不做任何後端；一切本機執行
