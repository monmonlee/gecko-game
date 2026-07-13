import { CONFIG } from './config.js';
import {
  gs, tierOf, addAffinity, poseForLocation, rotateSleepPose,
  unlockCombo, sleepLocationPool, computeWeight, unlockBehavior, diaryLog,
} from './state.js';
import { emit } from './events.js';
import { drawGecko } from './render.js';

const rand = (a, b) => a + Math.random() * (b - a);
const randMs = span => rand(span[0], span[1]);
const pick = arr => arr[(Math.random() * arr.length) | 0];

const HIDE = CONFIG.locations.hide;      // 躲避屋的邏輯位置
const HIDE_IN = { x: 62, y: 202 };       // 屋內實際趴的位置：頭朝內、尾巴剛好留在洞口
const HIDE_PEEK_X = 80;                  // 探頭時頭從洞口伸出
const HIDE_DOOR = { x: 106, y: 204 };    // 洞口外的落點：進窩要先走到門口再鑽進去

// 真實世界作息：晚上才是牠的時間
const isNight = now => {
  const h = new Date(now).getHours();
  return h >= CONFIG.rhythm.nightStartHour || h < CONFIG.rhythm.nightEndHour;
};

// 守宮行為 FSM：sleeping / active / hiding / frozen / hunting / petted
// 轉移由燈光、好感度、餵食、摸摸事件驅動；currentActivity 持久化在 gs
export class Brain {
  constructor(now) {
    const loc = CONFIG.locations[gs.gecko.locationId] || HIDE;
    this.x = loc.x;
    this.y = loc.y;
    this.facing = Math.random() < 0.5 ? 1 : -1;
    this.tx = this.x; this.ty = this.y;
    this.speed = CONFIG.walkSpeed;
    this.sub = 'idle';                 // 各 activity 內的子狀態
    this.timer = rand(2, 6);           // 通用倒數（秒）
    this.peek = false;
    this.freezeUntil = 0;
    this.sleepAt = Infinity;           // 開燈下什麼時候想睡
    this.pendingLoc = gs.gecko.locationId;
    this.nextPoseRotate = now + randMs(CONFIG.pose.rotateMs);
    this.hunt = null;
    this.via = null;                   // 移動的中途點（進窩先繞洞口）
    this.micro = null;                 // 進行中的小動作（打哈欠、舔眼睛…）
    this.microAt = now + randMs(CONFIG.micro.firstMs);

    // 暫態 activity 不跨 session
    if (['hunting', 'frozen', 'petted'].includes(gs.gecko.currentActivity)) {
      gs.gecko.currentActivity = 'sleeping';
    }
    if (gs.gecko.currentActivity === 'hiding') {
      this.x = HIDE_IN.x; this.y = HIDE_IN.y;
      this.facing = -1;                // 頭朝屋內、尾巴朝洞口
      this.sub = 'in';
      this.peek = this.tier() === 'wary';
      this.timer = rand(4, 10);
    }
  }

  get act() { return gs.gecko.currentActivity; }
  set(a) { gs.gecko.currentActivity = a; }
  tier() { return tierOf(gs.gecko.affinity).id; }

  update(dt, now) {
    // 第一晚的保證時刻：新玩家第一次用夜視看牠，一定會看到牠出來喝水
    if (!gs.records.firstNightDone && !gs.environment.lightOn &&
        gs.environment.viewMode === 'nightvision' &&
        this.act === 'active' && this.sub === 'idle' && !this.fnStarted) {
      this.fnStarted = true;
      this.walkToLoc('water', CONFIG.walkSpeed * 0.8, 'walk');
    }
    switch (this.act) {
      case 'frozen':   if (now >= this.freezeUntil) this.reactAfterFreeze(now); break;
      case 'hunting':  this.updateHunt(dt, now); break;
      case 'hiding':   this.updateHiding(dt, now); break;
      case 'active':   this.updateActive(dt, now); break;
      case 'sleeping': this.updateSleeping(dt, now); break;
      case 'petted':   this.updatePetted(dt, now); break;
    }
    this.maybeMicro(now);
    this.checkUnlock();
    drawGecko(this);
  }

  // 隨機小動作：睡覺時打哈欠／偷睜一隻眼／吐舌，發呆時舔眼睛
  maybeMicro(now) {
    if (this.micro && now >= this.micro.until) this.micro = null;
    if (this.micro || now < this.microAt) return;
    if (this.act !== 'sleeping' && !(this.act === 'active' && ['idle', 'rest'].includes(this.sub))) return;
    this.microAt = now + randMs(CONFIG.micro.gapMs);
    const env = gs.environment;
    if (!env.lightOn && env.viewMode !== 'nightvision') return;   // 沒人看見就不演了
    if (this.act === 'sleeping' && gs.gecko.locationId === 'hide') return;  // 睡在窩裡也看不到
    let pool;
    if (this.act === 'sleeping') {
      // 臉被尾巴遮住／頭埋著的睡姿只能吐舌
      const face = !['tailmask', 'buttup', 'hide_tail'].includes(gs.gecko.sleepPoseId);
      pool = face ? ['wink', 'yawn', 'blep'] : ['blep'];
    } else {
      pool = ['yawn', 'eyelick', 'blep'];
      // 「牠注意到你了」：熟悉之後，夜視下偶爾會停下來朝你這邊看一眼
      if (env.viewMode === 'nightvision' && !env.lightOn &&
          ['familiar', 'trust'].includes(this.tier())) {
        pool.push('notice', 'notice');
        // 稀有：發現監視器，超大的臉懟上鏡頭
        if (Math.random() < 0.5) pool.push('camface');
      }
    }
    const id = pool[(Math.random() * pool.length) | 0];
    this.micro = { id, until: now + CONFIG.micro.durMs[id] };
    if (id === 'camface') emit('camface');
    if (id !== 'notice') unlockBehavior(id);   // notice 不進圖鑑——它是純粹的時刻，不是收集品
  }

  moveToward(tx, ty, dt, speed) {
    const dx = tx - this.x, dy = ty - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 2) return true;
    const s = Math.min(d, speed * dt);
    this.x += dx / d * s;
    this.y += dy / d * s;
    if (Math.abs(dx) > 2) this.facing = dx > 0 ? 1 : -1;
    return d - s < 2;
  }

  walkToLoc(id, speed, sub) {
    const l = CONFIG.locations[id];
    this.pendingLoc = id;
    this.tx = l.x; this.ty = l.y;
    this.speed = speed;
    this.sub = sub;
    // 進窩不能穿牆：先走到洞口，再從門口鑽進去
    this.via = id === 'hide' ? { x: HIDE_DOOR.x, y: HIDE_DOOR.y } : null;
  }

  // 帶中途點的移動（回傳是否抵達最終目標）
  advance(dt) {
    if (this.via) {
      if (this.moveToward(this.via.x, this.via.y, dt, this.speed)) this.via = null;
      return false;
    }
    return this.moveToward(this.tx, this.ty, dt, this.speed);
  }

  // ---- 燈光事件 ----
  onLightOn(now) {
    gs.environment.viewMode = 'normal';
    if (this.act === 'hunting' || this.act === 'petted') return;
    if (this.act === 'sleeping' && this.tier() === 'trust') {
      emit('toast', pick([
        '「好亮…是你呀。嗯，那沒事，我翻個身繼續睡～」',
        '「是你回來了嗎…看到了…Zzz」',
        '「燈亮了…今天也有蟲蟲嗎？…先睡飽再說…」',
      ]));
      return;                          // 信任級：開燈照睡
    }
    this.set('frozen');
    this.freezeUntil = now + randMs(CONFIG.freezeMs);
  }

  onLightOff(now) {
    if (this.act === 'hunting' || this.act === 'petted') return;
    this.sleepAt = Infinity;
    this.set('active');                // 夜行性：關燈後過一下就出來活動
    this.sub = 'idle';
    this.timer = randMs(CONFIG.night.wakeDelayMs) / 1000;
  }

  reactAfterFreeze(now) {
    const t = this.tier();
    if (t === 'stranger') {
      this.set('hiding');
      this.walkToLoc('hide', CONFIG.runSpeed, 'retreat');
      this.peek = false;
      emit('toast', '「哇——！是巨人！快逃快逃快逃！」');
    } else if (t === 'wary') {
      this.set('hiding');
      this.walkToLoc('hide', CONFIG.walkSpeed * 1.6, 'retreat');
      this.peek = true;
      emit('toast', '「是那個巨人…我先回窩邊，從這裡盯著你」');
    } else if (t === 'familiar') {
      this.set('active'); this.sub = 'idle'; this.timer = rand(1, 3);
      this.sleepAt = now + randMs(CONFIG.daySleep.delayMs);
    } else {
      this.set('active'); this.sub = 'idle'; this.timer = rand(1, 3);
      this.sleepAt = now + randMs(CONFIG.daySleep.delayMs) / 2;
    }
  }

  // ---- 各狀態 ----
  updateSleeping(dt, now) {
    if (!gs.environment.lightOn) {
      this.timer -= dt;
      if (this.timer <= 0) {
        // 真實作息：晚上醒來活動；白天翻個身繼續睡（偶爾醒一下）
        if (isNight(now) || !gs.records.firstNightDone || Math.random() < 0.25) {
          this.set('active'); this.sub = 'idle'; this.timer = rand(0.5, 2);
        } else {
          this.timer = randMs(CONFIG.rhythm.dayNapS.map(s => s * 1000)) / 1000;
        }
      }
      return;
    }
    if (now >= this.nextPoseRotate) {  // 睡久了換個姿勢／地點
      rotateSleepPose(now);
      const l = CONFIG.locations[gs.gecko.locationId];
      this.x = l.x; this.y = l.y;
      this.nextPoseRotate = now + randMs(CONFIG.pose.rotateMs);
    }
  }

  visible() {
    return gs.environment.lightOn || gs.environment.viewMode === 'nightvision';
  }

  // 發呆結束後決定下一個日常行為：走路以外還會坐下、張望、伸懶腰、挖沙、彈跳、爬玻璃、衝刺
  startIdleAction() {
    // 在躲窩後面做動作沒人看得到：先走出來再表演
    if (gs.gecko.locationId === 'hide') {
      const locs = Object.keys(CONFIG.locations).filter(id => id !== 'hide');
      this.walkToLoc(pick(locs), CONFIG.walkSpeed, 'walk');
      return;
    }
    // 白天（真實時間）沒什麼精神，活動一下就想回去睡
    if (!isNight(Date.now()) && gs.records.firstNightDone &&
        Math.random() < CONFIG.rhythm.daySleepyChance) {
      this.goSleep();
      return;
    }
    // 肚子餓＋開燈＋不太怕你了：到玻璃邊眼巴巴討食
    if (gs.environment.lightOn && gs.gecko.hunger <= 35 &&
        this.tier() !== 'stranger' && Math.random() < 0.5) {
      this.walkToLoc('glass', CONFIG.walkSpeed, 'beg_go');
      return;
    }
    const pool = ['walk', 'walk', 'walk', 'walk', 'rest', 'rest', 'lookout', 'lookout', 'stretch', 'dig', 'hop'];
    if (!gs.environment.lightOn) pool.push('zoom', 'zoom', 'surf', 'surf');   // 夜行性的招牌行為
    else if (this.tier() === 'trust') pool.push('zoom', 'surf');
    const a = pick(pool);
    if (a === 'walk') {
      const locs = Object.keys(CONFIG.locations).filter(id => id !== gs.gecko.locationId);
      this.walkToLoc(pick(locs), CONFIG.walkSpeed, 'walk');
    } else if (a === 'zoom') {
      const locs = Object.keys(CONFIG.locations).filter(id => id !== gs.gecko.locationId);
      this.walkToLoc(pick(locs), CONFIG.runSpeed * 1.1, 'zoom');
      if (this.visible()) unlockBehavior('zoom');
    } else if (a === 'surf') {
      this.walkToLoc('glass', CONFIG.walkSpeed, 'surf_go');
    } else {
      this.sub = a;
      this.timer = randMs(CONFIG.idleAct.durS[a].map(s => s * 1000)) / 1000;
      if (this.visible()) unlockBehavior(a);
    }
  }

  updateActive(dt, now) {
    if (gs.environment.lightOn && this.sub === 'idle' && now >= this.sleepAt) {
      this.goSleep();
      return;
    }
    if (this.sub === 'idle') {
      this.timer -= dt;
      if (this.timer <= 0) this.startIdleAction();
    } else if (['rest', 'lookout', 'stretch', 'dig', 'hop', 'surf', 'beg'].includes(this.sub)) {
      this.timer -= dt;
      if (this.timer <= 0) { this.sub = 'idle'; this.timer = randMs(CONFIG.night.pauseMs) / 1000; }
    } else if (this.sub === 'surf_go' || this.sub === 'zoom' || this.sub === 'beg_go') {
      if (this.advance(dt)) {
        gs.gecko.locationId = this.pendingLoc;
        if (this.sub === 'surf_go') {
          this.sub = 'surf';
          this.timer = randMs(CONFIG.idleAct.durS.surf.map(s => s * 1000)) / 1000;
          this.facing = 1;             // 面向右邊的玻璃
          if (this.visible()) unlockBehavior('surf');
        } else if (this.sub === 'beg_go') {
          this.sub = 'beg';
          this.timer = randMs(CONFIG.idleAct.durS.beg.map(s => s * 1000)) / 1000;
          this.facing = 1;             // 貼著玻璃看向巨人
          if (this.visible()) unlockBehavior('beg');
        } else {
          this.sub = 'idle';
          this.timer = randMs(CONFIG.night.pauseMs) / 1000;
        }
      }
    } else if (this.sub === 'walk') {
      if (this.advance(dt)) {
        gs.gecko.locationId = this.pendingLoc;
        if (this.pendingLoc === 'water' &&
            (!gs.records.firstNightDone || Math.random() < CONFIG.night.drinkChance)) {
          this.sub = 'drink';
          this.timer = randMs(CONFIG.night.drinkMs) / 1000;
          this.facing = 1;             // 面向水盆
        } else {
          this.sub = 'idle';
          this.timer = randMs(CONFIG.night.pauseMs) / 1000;
        }
      }
    } else if (this.sub === 'drink') {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.sub = 'idle';
        this.timer = randMs(CONFIG.night.pauseMs) / 1000;
        if (!gs.records.firstNightDone && this.visible()) {
          gs.records.firstNightDone = true;
          emit('toast', '🌙 牠小心翼翼地喝了水——第一次在你面前活動');
          diaryLog('第一個晚上。那個巨人安安靜靜的。我出去喝了水，沒有發生可怕的事。', 9);
        }
      }
    } else if (this.sub === 'bedtime') {
      if (this.advance(dt)) this.fallAsleep(now);
    }
  }

  goSleep() {
    const pool = sleepLocationPool(this.tier(), gs.gecko.isShedding)
      .filter(id => id !== gs.gecko.locationId);
    this.walkToLoc(pick(pool) || 'hide', CONFIG.walkSpeed * 0.8, 'bedtime');
  }

  fallAsleep(now) {
    gs.gecko.locationId = this.pendingLoc;
    gs.gecko.sleepPoseId = poseForLocation(this.pendingLoc, this.tier());
    gs.timers.lastPoseChangeAt = now;
    this.nextPoseRotate = now + randMs(CONFIG.pose.rotateMs);
    this.set('sleeping');
    this.sub = 'idle';
  }

  updateHiding(dt, now) {
    if (!gs.environment.lightOn && this.sub !== 'retreat') {
      this.set('active'); this.sub = 'idle'; this.timer = rand(1, 4);
      return;
    }
    if (this.sub === 'retreat') {
      if (this.advance(dt)) {
        gs.gecko.locationId = 'hide';
        this.sub = 'in';
        this.timer = rand(4, 10);
        this.x = HIDE_IN.x; this.y = HIDE_IN.y;
        this.facing = -1;              // 頭朝屋內，尾巴留在洞口
      }
    } else if (this.sub === 'in') {
      if (this.peek) {                 // 警戒級：偶爾探頭
        this.timer -= dt;
        if (this.timer <= 0) {
          this.sub = 'peek';
          this.timer = rand(1.2, 2.2);
          this.x = HIDE_PEEK_X;
          this.facing = 1;             // 轉過身，頭從洞口探出來
        }
      }
    } else if (this.sub === 'peek') {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.sub = 'in';
        this.timer = rand(5, 14);
        this.x = HIDE_IN.x;
        this.facing = -1;
      }
    }
  }

  // ---- 餵食 ----
  startHunt(session, now) {
    session.startedAt = now;
    this.hunt = session;
    this.micro = null;                 // 打斷進行中的小動作（例如正在懟鏡頭）
    this.set('hunting');               // 蟲的吸引力蓋過恐懼，會從窩裡出來
    this.sub = 'chase';
    this.sleepAt = Infinity;
  }

  cancelHunt(now) {
    this.hunt = null;
    if (gs.environment.lightOn) this.reactAfterFreeze(now);
    else { this.set('active'); this.sub = 'idle'; this.timer = rand(1, 3); }
  }

  updateHunt(dt, now) {
    const s = this.hunt;
    if (!s || !s.active) { this.set('active'); this.sub = 'idle'; this.timer = 2; return; }
    const w = s.wormPos;
    const dist = Math.hypot(w.x - this.x, w.y - this.y);
    if (this.sub === 'pounce') {
      if (dist > 46) { this.sub = 'chase'; return; }   // 蟲被拉走，重新追
      this.moveToward(w.x, Math.min(216, w.y), dt, CONFIG.feed.pounceSpeed);
      if (Math.hypot(w.x - this.x, w.y - this.y) < 8) this.catchWorm(now);
    } else if (this.sub === 'crouch') {
      // 壓低蓄力，盯緊蟲蟲
      if (Math.abs(w.x - this.x) > 2) this.facing = w.x > this.x ? 1 : -1;
      this.timer -= dt;
      if (dist > 46) { this.sub = 'chase'; return; }
      if (this.timer <= 0) { this.sub = 'pounce'; emit('sfx', 'pounce'); }
    } else {
      // 守宮只在地面追，蟲飛太高就在下面等
      this.moveToward(w.x, Math.max(150, Math.min(216, w.y)), dt, CONFIG.feed.huntSpeed);
      if (now - s.startedAt >= CONFIG.feed.guideMinMs && dist < CONFIG.feed.pounceDist) {
        this.sub = 'crouch';
        this.timer = 0.18;
      }
    }
  }

  catchWorm(now) {
    const s = this.hunt;
    this.hunt = null;
    gs.gecko.hunger = CONFIG.hunger.max;
    gs.timers.lastFedAt = now;
    gs.records.feedCount = (gs.records.feedCount || 0) + 1;
    gs.gecko.weightGrams = computeWeight();
    gs.timers.nextPoopAt = now + randMs(CONFIG.poop.delayMs);   // 吃飽了，之後某個時刻會「嗯嗯」
    addAffinity(CONFIG.affinity.feed, '餵我吃蟲蟲');
    // 蟲蟲圖鑑與「最愛」判定
    const bugId = s.bug || 'mealworm';
    const bugCfg = CONFIG.bugs[bugId] || CONFIG.bugs.mealworm;
    gs.records.bugsTried ??= [];
    if (!gs.records.bugsTried.includes(bugId)) {
      gs.records.bugsTried.push(bugId);
      emit('toast', `🪱 蟲蟲圖鑑＋1：${bugCfg.label}`);
      emit('sfx', 'unlock');
    }
    if (bugId === gs.gecko.favBug) {
      addAffinity(1, '最愛的蟲蟲');
      if (!gs.records.favBugFound) {
        gs.records.favBugFound = true;
        emit('toast', `😻「！！！是${bugCfg.label}！！我這輩子最愛這個！！」`);
        diaryLog(`今天吃到${bugCfg.label}。就是它。我這輩子最愛的味道，被巨人發現了。`, 6, now);
      } else {
        emit('toast', `😻「${bugCfg.label}！最愛！尾巴都翹起來了！」`);
      }
    } else {
      emit('toast', pick([
        '「嗷嗚！！蟲蟲！好吃！！尾巴又可以變胖了嘿嘿」',
        '「一口！蟲蟲就是要一口吞！」',
        '「唔嗯～～蟲蟲的味道，就是幸福的味道」',
        '「好吃！…還有嗎？沒有了嗎。好吧，下次見。」',
      ]));
    }
    emit('sfx', 'eat');
    this.micro = { id: 'lick_lips', until: now + CONFIG.micro.durMs.lick_lips };
    unlockBehavior('lick_lips');
    diaryLog(pick([
      '抓到蟲蟲吃掉了！尾巴應該又胖了一點，很滿意。',
      '今天的蟲蟲很好吃。尾巴的收藏＋1。',
      '吃到蟲蟲了。是巨人給的。……有記住。',
      '蟲蟲逃得很努力，但我更努力。',
    ]), 3, now);
    s.onCaught();
    // 吃完後回到對應好感度的反應
    const t = this.tier();
    if (gs.environment.lightOn && (t === 'stranger' || t === 'wary')) {
      this.set('hiding');
      this.walkToLoc('hide', t === 'stranger' ? CONFIG.runSpeed : CONFIG.walkSpeed * 1.6, 'retreat');
      this.peek = (t === 'wary');
    } else {
      this.set('active'); this.sub = 'idle'; this.timer = rand(2, 5);
      if (gs.environment.lightOn) this.sleepAt = now + randMs(CONFIG.daySleep.delayMs);
    }
  }

  // ---- 摸摸／上手（由 ui/hand 流程呼叫，這裡只管守宮的身體反應）----
  startPetWait() {
    this.hunt = null;
    this.set('petted');
    this.sub = 'wait';                 // 手伸過來時先停住不動
  }

  petHappy() {
    this.sub = 'happy';
    this.timer = CONFIG.pet.happyMs / 1000;
  }

  petDodge() {
    this.sub = 'dodge';
    const dir = this.x > CONFIG.stage.w / 2 ? -1 : 1;
    this.tx = Math.max(20, Math.min(300, this.x + dir * 60));
    this.ty = Math.min(216, this.y + 6);
    this.speed = CONFIG.runSpeed;
  }

  palmApproach(px, py) {
    this.set('petted');
    this.sub = 'palm_go';
    this.tx = px + (this.x < px ? -18 : 18);   // 走到手掌旁邊
    this.ty = py;
    this.speed = CONFIG.walkSpeed * 0.7;
  }

  palmClimb(px, py) {
    this.sub = 'climb';
    this.tx = px; this.ty = py - 4;
    this.speed = CONFIG.walkSpeed * 0.6;
  }

  palmOff() {
    this.sub = 'walkoff';
    const dir = this.x > CONFIG.stage.w / 2 ? -1 : 1;
    this.tx = Math.max(20, Math.min(300, this.x + dir * 46));
    this.ty = Math.min(216, Math.max(196, this.y));
    this.speed = CONFIG.walkSpeed;
  }

  endPet(now) {
    const t = this.tier();
    if (gs.environment.lightOn && (t === 'stranger' || t === 'wary')) {
      this.set('hiding');
      this.walkToLoc('hide', t === 'stranger' ? CONFIG.runSpeed : CONFIG.walkSpeed * 1.6, 'retreat');
      this.peek = (t === 'wary');
    } else {
      this.set('active'); this.sub = 'idle'; this.timer = rand(1, 3);
      if (gs.environment.lightOn) this.sleepAt = now + randMs(CONFIG.daySleep.delayMs);
    }
  }

  updatePetted(dt, now) {
    switch (this.sub) {
      case 'wait':                     // 等待 ui 的判定
        break;
      case 'happy':
        this.timer -= dt;
        if (this.timer <= 0) this.endPet(now);
        break;
      case 'dodge':
      case 'walkoff':
        if (this.moveToward(this.tx, this.ty, dt, this.speed)) this.endPet(now);
        break;
      case 'palm_go':
        if (this.moveToward(this.tx, this.ty, dt, this.speed)) this.sub = 'sniff';
        break;
      case 'sniff':                    // 聞聞手心，等待 5 秒判定
        break;
      case 'climb':
        if (this.moveToward(this.tx, this.ty, dt, this.speed)) {
          this.sub = 'onhand';
          this.timer = 3;
        }
        break;
      case 'onhand':
        this.timer -= dt;
        if (this.timer <= 0) this.palmOff();
        break;
    }
  }

  // 睡姿圖鑑：親眼看到（開燈或夜視）才解鎖
  checkUnlock() {
    if (this.act !== 'sleeping') return;
    const env = gs.environment;
    if (!env.lightOn && env.viewMode !== 'nightvision') return;
    unlockCombo(gs.gecko.sleepPoseId, gs.gecko.locationId);
  }
}
