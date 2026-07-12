// 所有機率與數值參數集中於此，方便調整平衡
export const CONFIG = {
  stage: { w: 320, h: 240 },

  hunger: {
    max: 100,
    floor: 20,                        // 療癒向：不會餓死，只會「很想吃」
    decayPer6hMs: 6 * 3600 * 1000,    // 每 6 小時
    decayAmount: 10,                  // −10
  },

  feed: {
    cooldownMs: 3 * 3600 * 1000,      // 餵食冷卻 3 小時（真實時間）
    guideMinMs: 5000,                 // 至少引導 5 秒才會撲食
    pounceDist: 26,                   // 距離夠近觸發撲食（stage px）
    wormLerp: 0.14,                   // 蟲跟隨手指的緩動係數
    huntSpeed: 42,                    // 追蟲速度 px/s
    pounceSpeed: 240,                 // 撲食衝刺速度
    touchLift: 30,                    // 手機觸控時蟲浮在手指上方的距離，避免被指頭擋住
  },

  affinity: {
    feed: 3, pet: 2, checkin: 1, poop: 1, handTame: 5,
    shedCollect: 2,                   // 收蛻皮
    unlock: 1,                        // 解鎖新睡姿圖鑑
    companion: 2,                     // 安靜的陪伴：每天用夜視靜靜看牠
    companionMinMs: 3 * 60 * 1000,    // 累計看滿 3 分鐘
    petFail: -1,
    absenceGraceDays: 3,              // 連續 3 天未開啟開始扣分
    absencePerDay: -2,                // 每日 −2（不低於當前等級底線）
  },

  tiers: [
    { id: 'stranger', min: 0,  label: '陌生' },
    { id: 'wary',     min: 25, label: '警戒' },
    { id: 'familiar', min: 50, label: '熟悉' },
    { id: 'trust',    min: 75, label: '信任' },
  ],

  freezeMs: [1000, 2000],             // 開燈定格 1–2 秒
  walkSpeed: 26,
  runSpeed: 95,

  night: {                            // 關燈後的夜行行為
    wakeDelayMs: [2000, 6000],
    pauseMs: [3000, 9000],
    drinkChance: 0.25,
    drinkMs: [3000, 6000],
  },

  daySleep: {                         // 開燈下（熟悉/信任）過一陣子會睡著
    delayMs: [20000, 60000],
  },

  pose: {
    rotateMs: [1 * 3600 * 1000, 3 * 3600 * 1000],  // 睡姿每 1–3 小時輪換
  },

  poop: {
    delayMs: [12 * 3600 * 1000, 36 * 3600 * 1000], // 進食後 12–36 小時內產生
  },

  shed: {
    intervalMs: [7 * 86400 * 1000, 14 * 86400 * 1000],  // 每 7–14 天脫一次皮
    durationMs: [6 * 3600 * 1000, 24 * 3600 * 1000],    // 發白 6–24 小時後完成
  },

  pet: {
    judgeDelayMs: 900,                // 手伸過去到判定的時間
    happyMs: 1800,                    // 瞇眼享受的時間
    palmWaitMs: 5000,                 // 手心朝上等待 5 秒
    rateJitter: 10,                   // 摸摸成功率 = affinity ± 10
    palmRatePerAff: 1.5,              // 上手成功率 = (affinity−50) × 1.5%
  },

  weight: {                           // 體重 = base + 天數×perDay + 餵食次數×perFeed（冪等）
    base: 15, perDay: 0.22, perFeed: 0.35, max: 95,
  },

  locations: {
    hide:      { x: 44,  y: 200, label: '躲窩' },
    plant:     { x: 103, y: 198, label: '植物下' },
    mossbox:   { x: 139, y: 212, label: '苔蘚盒' },
    driftwood: { x: 150, y: 172, label: '流木上' },
    open:      { x: 185, y: 216, label: '開闊處' },
    water:     { x: 204, y: 206, label: '水盆旁' },
    rock:      { x: 272, y: 148, label: '岩石頂' },
    heatmat:   { x: 276, y: 222, label: '暖墊上' },
    glass:     { x: 296, y: 204, label: '玻璃邊' },
  },

  poses: {
    curl:      { label: '蜷睡' },
    flat:      { label: '攤平趴睡' },
    hide_tail: { label: '窩裡露尾' },
    glass:     { label: '貼玻璃睡' },
    open:      { label: '大字睡' },   // 信任級解鎖
    perch:     { label: '高處趴睡' }, // 流木／岩石
    moss:      { label: '苔蘚裡窩著' },
    belly:     { label: '暖墊攤肚' },
    leaf:      { label: '葉蔭下蜷睡' },
  },

  saveKey: 'gecko-game-save-v1',
};
