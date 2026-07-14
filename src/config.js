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
    wormLerp: 0.14,                   // 蟲跟隨手指的緩動係數（預設）
    bugLerp: {                        // 每種食物的手感：蟋蟀彈、蟑螂快、麵包蟲慢、飼料蟲泥不會動
      mealworm: 0.12, black_cricket: 0.2, white_cricket: 0.18, roach: 0.26,
      pellets: 0.02, paste: 0.015,
    },
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
    delayMs: [3 * 3600 * 1000, 5 * 3600 * 1000],   // 進食後 3–5 小時內產生
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

  // 成長階段門檻（現實天數）。PoC 先加速：一週內看完整成長。
  // 真實步調參考值：subadult 60、adult 180。
  growth: { subadultDay: 3, adultDay: 7 },

  // 問小波（抽籤）：好感度到門檻牠才願意說牠的直覺
  oracle: { minAffinity: 80 },

  // 夜間限定夢話：關燈＋夜視靜靜看牠，才偶爾聽得到（給夜視鏡長期的意義）
  dream: { firstMs: [18000, 34000], gapMs: [30000, 75000], chance: 0.7 },

  locations: {
    hide:      { x: 44,  y: 200, label: '躲避屋' },
    plant:     { x: 103, y: 198, label: '植物下' },
    mossbox:   { x: 139, y: 212, label: '苔蘚盒' },
    driftwood: { x: 150, y: 172, label: '流木上' },
    open:      { x: 185, y: 216, label: '開闊處' },
    water:     { x: 204, y: 206, label: '水盆旁' },
    rock:      { x: 272, y: 148, label: '岩石頂' },
    heatmat:   { x: 276, y: 222, label: '暖墊上' },
    glass:     { x: 296, y: 204, label: '玻璃邊' },
  },

  // 睡姿圖鑑：own = 有專屬畫面（否則用側面圖＋變形）；rare = 稀有（圖鑑加星）
  poses: {
    hide_tail:  { label: '窩裡露尾',        quote: '尾巴放外面…裡面有點擠嘛' },
    halfout:    { label: '半身出窩睡',      quote: '走到一半…就睡著了…' },
    roof:       { label: '睡在屋頂上',      quote: '床的上面，比床好睡（？）' },
    curl:       { label: '蜷睡',            quote: '捲起來，保暖' },
    donut:      { label: '甜甜圈',          quote: '一個完美的圈圈', own: true },
    tailmask:   { label: '尾巴眼罩',        quote: '太亮了啦。尾巴是我的眼罩', own: true },
    flat:       { label: '攤平趴睡',        quote: '地板涼涼，整隻攤開' },
    chinrest:   { label: '下巴枕枕頭',      quote: '下巴要有枕頭才好睡', own: true },
    soak:       { label: '泡湯睡',          quote: '泡湯…舒服…咕嚕…', own: true },
    perch:      { label: '高處趴睡',        quote: '高的地方，視野好，安心' },
    draped:     { label: '掛襪子睡',        quote: '掛著也能睡，我很厲害吧', own: true },
    standlean:  { label: '靠著站睡',        quote: '站著…也可以…睡…', own: true },
    moss:       { label: '苔蘚裡窩著',      quote: '濕濕軟軟的苔蘚，五星級' },
    buttup:     { label: '屁股朝天',        quote: '頭埋進去就看不到明天（？）', own: true },
    leaf:       { label: '葉蔭下蜷睡',      quote: '葉子下面是我的秘密基地' },
    belly:      { label: '暖墊攤肚',        quote: '肚子暖暖的…要融化了…' },
    glass:      { label: '貼玻璃睡',        quote: '這面牆涼涼的，很好睡。你在看什麼？', own: true },
    headstand:  { label: '角落倒栽蔥',      quote: '？我覺得這樣很好睡啊', own: true, rare: true },
    open:       { label: '大字睡',          quote: '四腳大攤開，這裡最安全', own: true },   // 信任級解鎖
    bellyup:    { label: '翻肚睡',          quote: '肚肚朝上～（守護級的安心）', own: true, rare: true },
    blep_sleep: { label: '吐舌睡',          quote: 'Zzz…（舌頭露出來了）', rare: true },
  },

  // 行為圖鑑：親眼看到一次就解鎖
  behaviors: {
    yawn:       { icon: '🥱', label: '打哈欠',           desc: '嘴巴張超大，眼睛擠成一條線' },
    eyelick:    { icon: '👅', label: '舔眼睛',           desc: '守宮不能眨眼，要用舌頭把眼睛擦乾淨' },
    wink:       { icon: '👀', label: '睜一隻眼閉一隻眼', desc: '半夢半醒…還是在偷看你？' },
    blep:       { icon: '😛', label: '吐舌頭',           desc: '舌頭忘記收回去了（本人沒有發現）' },
    lick_lips:  { icon: '😋', label: '吃飽舔嘴',         desc: '蟲蟲好吃，嘴巴要舔乾淨' },
    heart_eyes: { icon: '😍', label: '愛心眼',           desc: '在你的手心上，眼睛裡有小愛心' },
    hop:        { icon: '🦘', label: '開心彈跳',         desc: '心情好的時候會突然彈一下' },
    rest:       { icon: '🪑', label: '攤坐發呆',         desc: '整隻趴下來，就…發個呆' },
    lookout:    { icon: '🔭', label: '抬頭張望',         desc: '前腳撐高高，觀察外面的世界' },
    stretch:    { icon: '🙆', label: '伸懶腰',           desc: '前腳伸長長、屁股翹高高' },
    dig:        { icon: '⛏️', label: '挖挖手',           desc: '前腳快速刨沙，想挖個洞' },
    zoom:       { icon: '💨', label: '深夜衝刺',         desc: '半夜突然全速衝過整個缸（原因不明）' },
    surf:       { icon: '🧗', label: '爬玻璃',           desc: '扒著玻璃想出去玩，肚皮全貼在上面' },
    beg:        { icon: '🥺', label: '討食蟲蟲',         desc: '肚子餓的時候，隔著玻璃眼巴巴看著你' },
    camface:    { icon: '📹', label: '懟臉查看',         desc: '發現了監視器！超大的臉湊上來聞鏡頭' },
  },

  idleAct: {                            // 各種日常行為的持續秒數
    durS: { rest: [6, 12], lookout: [4, 8], stretch: [1.6, 2.2], dig: [2.5, 4], hop: [0.85, 0.85], surf: [4, 7], beg: [6, 10] },
  },

  micro: {                              // 睡覺／發呆時的隨機小動作
    firstMs: [12000, 30000],
    gapMs: [20000, 60000],
    durMs: { yawn: 2500, eyelick: 1800, blep: 6000, wink: 5000, lick_lips: 1600, notice: 4500, camface: 5200 },
  },

  // 食物圖鑑：連續登入解鎖新食物（unlockStreak）；每隻守宮有一種最愛（四種活蟲之一）
  // lines = 吃下去之後的專屬食評；guide = 開始餵食時的提示
  bugs: {
    mealworm: {
      label: '麵包蟲', desc: '軟軟的入門款，守宮界的白飯', unlockStreak: 0,
      lines: [
        '「麵包蟲～安心的味道。日常的美好。」',
        '「軟軟的好入口。嗯，今天也是平穩的一天。」',
        '「經典款。不會出錯的選擇，巨人你懂。」',
      ],
    },
    pellets: {
      label: '飼料', desc: '顆粒狀的日常主食，咔啦咔啦', unlockStreak: 2,
      guide: '把飼料倒在牠附近吧',
      lines: [
        '「咔啦、咔啦。乾糧日，樸實的味道。」',
        '「顆粒飼料…乾乾的，等一下要多喝水。」',
        '「不是蟲，但、但也不錯啦。（咔啦咔啦）」',
      ],
    },
    black_cricket: {
      label: '黑蟋蟀', desc: '彈跳力驚人，追起來最有成就感', unlockStreak: 3,
      lines: [
        '「抓到了！！黑蟋蟀會跳，但我、更、快！」',
        '「呼…呼…追得累死了，但就是這個嚼勁！」',
        '「跳啊，再跳啊？最後還不是進了我的肚子。」',
      ],
    },
    white_cricket: {
      label: '白蟋蟀', desc: '溫和的蟋蟀，殼薄好消化', unlockStreak: 5,
      lines: [
        '「白蟋蟀～殼薄薄的，咔滋一下就好了。」',
        '「溫溫柔柔的味道，適合睡前來一隻。」',
        '「嗯，很細緻。今天走優雅路線。」',
      ],
    },
    roach: {
      label: '蟑螂（杜比亞）', desc: '爬得飛快、營養滿分的活力點心', unlockStreak: 7,
      lines: [
        '「杜比亞！跑得快，但巨人把它引到我嘴邊了，嘿嘿。」',
        '「肥肥的一隻，大～滿～足～」',
        '「吃完這個，感覺可以繞缸衝十圈！」',
      ],
    },
    paste: {
      label: '蟲泥', desc: '肉醬狀的蟲蟲精華，用舔的最高級點心', unlockStreak: 10,
      guide: '把蟲泥抹在牠面前吧',
      lines: [
        '「蟲泥！！不用追的蟲蟲精華！舔就好了！」',
        '「舔舔…舔舔舔…（完全停不下來）」',
        '「發明這個的人是天才吧。肉醬形態的蟲蟲！」',
      ],
    },
  },

  rhythm: {                             // 真實世界作息：晚上（19:00–07:00）才是牠的時間
    nightStartHour: 19,
    nightEndHour: 7,
    dayNapS: [30, 90],                  // 白天在黑暗中醒來又睡回去的間隔（秒）
    daySleepyChance: 0.45,              // 白天活動一下就想回去睡的機率
  },

  saveKey: 'gecko-game-save-v1',
};
