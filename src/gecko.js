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

const HIDE = CONFIG.locations.hide;      // 窩內位置（尾巴會露出窩外）
const HIDE_PEEK_X = HIDE.x + 36;         // 探頭時頭從洞口伸出

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
    this.micro = null;                 // 進行中的小動作（打哈欠、舔眼睛…）
    this.microAt = now + randMs(CONFIG.micro.firstMs);

    // 暫態 activity 不跨 session
    if (['hunting', 'frozen', 'petted'].includes(gs.gecko.currentActivity)) {
      gs.gecko.currentActivity = 'sleeping';
    }
    if (gs.gecko.currentActivity === 'hiding') {
      this.x = HIDE.x; this.y = HIDE.y;
      this.sub = 'in';
      this.peek = this.tier() === 'wary';
      this.timer = rand(4, 10);
    }
  }

  get act() { return gs.gecko.currentActivity; }
  set(a) { gs.gecko.currentActivity = a; }
  tier() { return tierOf(gs.gecko.affinity).id; }

  update(dt, now) {
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
    if (this.act !== 'sleeping' && !(this.act === 'active' && this.sub === 'idle')) return;
    this.microAt = now + randMs(CONFIG.micro.gapMs);
    const env = gs.environment;
    if (!env.lightOn && env.viewMode !== 'nightvision') return;   // 沒人看見就不演了
    let pool;
    if (this.act === 'sleeping') {
      // 臉被尾巴遮住／頭埋著的睡姿只能吐舌
      const face = !['tailmask', 'buttup', 'hide_tail'].includes(gs.gecko.sleepPoseId);
      pool = face ? ['wink', 'yawn', 'blep'] : ['blep'];
    } else {
      pool = ['yawn', 'eyelick', 'blep'];
    }
    const id = pool[(Math.random() * pool.length) | 0];
    this.micro = { id, until: now + CONFIG.micro.durMs[id] };
    unlockBehavior(id);
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
  }

  // ---- 燈光事件 ----
  onLightOn(now) {
    gs.environment.viewMode = 'normal';
    if (this.act === 'hunting' || this.act === 'petted') return;
    if (this.act === 'sleeping' && this.tier() === 'trust') {
      emit('toast', '「好亮…是你呀。嗯，那沒事，我翻個身繼續睡～」');
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
      this.set('hiding'); this.sub = 'retreat'; this.peek = false;
      this.tx = HIDE.x; this.ty = HIDE.y; this.speed = CONFIG.runSpeed;
      emit('toast', '「哇——！是巨人！快逃快逃快逃！」');
    } else if (t === 'wary') {
      this.set('hiding'); this.sub = 'retreat'; this.peek = true;
      this.tx = HIDE.x; this.ty = HIDE.y; this.speed = CONFIG.walkSpeed * 1.6;
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
      this.timer -= dt;                // 夜行性：黑暗中睡不久就醒
      if (this.timer <= 0) { this.set('active'); this.sub = 'idle'; this.timer = rand(0.5, 2); }
      return;
    }
    if (now >= this.nextPoseRotate) {  // 睡久了換個姿勢／地點
      rotateSleepPose(now);
      const l = CONFIG.locations[gs.gecko.locationId];
      this.x = l.x; this.y = l.y;
      this.nextPoseRotate = now + randMs(CONFIG.pose.rotateMs);
    }
  }

  updateActive(dt, now) {
    if (gs.environment.lightOn && this.sub === 'idle' && now >= this.sleepAt) {
      this.goSleep();
      return;
    }
    if (this.sub === 'idle') {
      this.timer -= dt;
      if (this.timer <= 0) {
        const locs = Object.keys(CONFIG.locations).filter(id => id !== gs.gecko.locationId);
        this.walkToLoc(pick(locs), CONFIG.walkSpeed, 'walk');
      }
    } else if (this.sub === 'walk') {
      if (this.moveToward(this.tx, this.ty, dt, this.speed)) {
        gs.gecko.locationId = this.pendingLoc;
        if (this.pendingLoc === 'water' && Math.random() < CONFIG.night.drinkChance) {
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
      if (this.timer <= 0) { this.sub = 'idle'; this.timer = randMs(CONFIG.night.pauseMs) / 1000; }
    } else if (this.sub === 'bedtime') {
      if (this.moveToward(this.tx, this.ty, dt, this.speed)) this.fallAsleep(now);
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
      if (this.moveToward(this.tx, this.ty, dt, this.speed)) {
        gs.gecko.locationId = 'hide';
        this.sub = 'in';
        this.timer = rand(4, 10);
        this.x = HIDE.x; this.y = HIDE.y;
        this.facing = 1;               // 頭朝窩內，尾巴露在外面
      }
    } else if (this.sub === 'in') {
      if (this.peek) {                 // 警戒級：偶爾探頭
        this.timer -= dt;
        if (this.timer <= 0) { this.sub = 'peek'; this.timer = rand(1.2, 2.2); this.x = HIDE_PEEK_X; }
      }
    } else if (this.sub === 'peek') {
      this.timer -= dt;
      if (this.timer <= 0) { this.sub = 'in'; this.timer = rand(5, 14); this.x = HIDE.x; }
    }
  }

  // ---- 餵食 ----
  startHunt(session, now) {
    session.startedAt = now;
    this.hunt = session;
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
    emit('toast', '「嗷嗚！！蟲蟲！好吃！！尾巴又可以變胖了嘿嘿」');
    emit('sfx', 'eat');
    this.micro = { id: 'lick_lips', until: now + CONFIG.micro.durMs.lick_lips };
    unlockBehavior('lick_lips');
    diaryLog('抓到蟲蟲吃掉了！尾巴應該又胖了一點，很滿意。', now);
    s.onCaught();
    // 吃完後回到對應好感度的反應
    const t = this.tier();
    if (gs.environment.lightOn && (t === 'stranger' || t === 'wary')) {
      this.set('hiding'); this.sub = 'retreat'; this.peek = (t === 'wary');
      this.tx = HIDE.x; this.ty = HIDE.y;
      this.speed = t === 'stranger' ? CONFIG.runSpeed : CONFIG.walkSpeed * 1.6;
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
      this.set('hiding'); this.sub = 'retreat'; this.peek = (t === 'wary');
      this.tx = HIDE.x; this.ty = HIDE.y;
      this.speed = t === 'stranger' ? CONFIG.runSpeed : CONFIG.walkSpeed * 1.6;
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
