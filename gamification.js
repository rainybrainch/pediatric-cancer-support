/**
 * gamification.js — RPG的な運/コレクション/操作要素を追加
 * - クリティカルヒット（記録時のRNG）
 * - レアアイテム・ドロップ
 * - 毎日ガチャ
 * - ボスタップミニゲーム
 * - カードコレクション
 * - スキルツリー（クラス別）
 */
(function(){
  'use strict';

  function uid(){ return localStorage.getItem('vitalia_uid_hint') || 'guest'; }
  function today(){ return new Date().toISOString().slice(0,10); }
  function rand(a,b){ return a + Math.random()*(b-a); }

  // ========== クリティカル判定 ==========
  // ベース10%、クラス特典で変動
  function getCritChance(){
    const cls = localStorage.getItem('vt_class');
    const skills = getActiveSkills();
    let base = 0.10;
    if(cls === 'hero') base += 0.05;        // 勇者: クリティカル+5%
    if(skills.includes('crit_master')) base += 0.10;
    if(skills.includes('crit_eye'))    base += 0.05;
    return Math.min(0.40, base);
  }
  function rollCritical(damage){
    if(Math.random() < getCritChance()){
      const mult = 2 + Math.random();    // 2.0x〜3.0x
      return { crit:true, damage: Math.round(damage * mult), mult };
    }
    return { crit:false, damage };
  }

  // ========== レアアイテム（ドロップアイテム）==========
  // 食事・運動の記録時に確率で取得
  const ITEMS = [
    // コモン（よく出る）
    { id:'cu1', name:'草の魔石',     rarity:'common',   icon:'🟢', desc:'+5XP', effect:{xp:5} },
    { id:'cu2', name:'水のしずく',   rarity:'common',   icon:'💧', desc:'水分+1', effect:{hyd:1} },
    { id:'cu3', name:'銅貨',         rarity:'common',   icon:'🟫', desc:'+10XP', effect:{xp:10} },
    // アンコモン
    { id:'un1', name:'銀の懐中時計', rarity:'uncommon', icon:'⌚', desc:'次の記録のクリティカル率+10%', effect:{nextCrit:0.10} },
    { id:'un2', name:'カイトの剣紋', rarity:'uncommon', icon:'⚔',  desc:'運動セッションを+10分換算', effect:{exBonus:10} },
    { id:'un3', name:'セラのレシピ', rarity:'uncommon', icon:'📜', desc:'次の食事XP+50%', effect:{nextFoodXp:1.5} },
    // レア
    { id:'rr1', name:'月光の結晶',   rarity:'rare',     icon:'🌙', desc:'XP+50', effect:{xp:50} },
    { id:'rr2', name:'紅蓮の宝玉',   rarity:'rare',     icon:'🔥', desc:'次のボスへのダメージ+30', effect:{nextBossDmg:30} },
    { id:'rr3', name:'治癒の聖水',   rarity:'rare',     icon:'🧪', desc:'ストリーク復活トークン', effect:{streakRestore:1} },
    // エピック
    { id:'ep1', name:'女神の祝福',   rarity:'epic',     icon:'✨', desc:'次の記録から24時間XP+30%', effect:{xpBoost24h:0.30} },
    { id:'ep2', name:'伝説の食材',   rarity:'epic',     icon:'🍱', desc:'次の食事セットボーナス確定発動', effect:{forceSetBonus:true} },
    // レジェンダリー
    { id:'lg1', name:'ヴィタリアの心', rarity:'legendary', icon:'💎', desc:'XP+200・ボスHP-50', effect:{xp:200, nextBossDmg:50} },
  ];
  const RARITY_WEIGHTS = { common:60, uncommon:25, rare:10, epic:4, legendary:1 };
  const RARITY_COLORS = { common:'#8a9a8a', uncommon:'#5878a8', rare:'#9c72e0', epic:'#f0a040', legendary:'#f0d048' };

  function rollLootDrop(){
    // 30%でドロップ
    if(Math.random() > 0.30) return null;
    // レアリティ抽選
    const total = Object.values(RARITY_WEIGHTS).reduce((a,b)=>a+b,0);
    let r = Math.random()*total, chosen = 'common';
    for(const [k,w] of Object.entries(RARITY_WEIGHTS)){
      r -= w; if(r <= 0){ chosen = k; break; }
    }
    const pool = ITEMS.filter(i=>i.rarity===chosen);
    return pool[Math.floor(Math.random()*pool.length)];
  }
  function addToInventory(item){
    if(!item) return;
    try{
      const k = `vt_inventory_${uid()}`;
      const inv = JSON.parse(localStorage.getItem(k)||'{}');
      inv[item.id] = (inv[item.id]||0) + 1;
      localStorage.setItem(k, JSON.stringify(inv));
    }catch(e){}
  }
  function getInventory(){
    try{ return JSON.parse(localStorage.getItem(`vt_inventory_${uid()}`)||'{}'); }catch(e){ return {}; }
  }
  function showLootToast(item){
    if(!item) return;
    const color = RARITY_COLORS[item.rarity];
    const t = document.createElement('div');
    t.className = 'gm-loot-toast';
    t.style.cssText = `position:fixed;top:90px;left:50%;transform:translate(-50%,-30px);background:linear-gradient(135deg,rgba(20,16,40,.96),rgba(8,6,20,.98));border:2px solid ${color};border-radius:14px;padding:12px 18px;display:flex;align-items:center;gap:12px;z-index:5005;box-shadow:0 12px 36px ${color}44, 0 0 50px ${color}33;animation:gmLootIn .5s cubic-bezier(.22,1,.36,1) both;max-width:90vw;`;
    t.innerHTML = `
      <div style="font-size:2rem;line-height:1;filter:drop-shadow(0 0 10px ${color});">${item.icon}</div>
      <div>
        <div style="font-size:.55rem;letter-spacing:.18em;color:${color};font-weight:900;">— ${item.rarity.toUpperCase()} GET —</div>
        <div style="font-family:'Noto Serif JP',serif;font-size:.95rem;font-weight:900;color:${color};">${item.name}</div>
        <div style="font-size:.65rem;color:rgba(220,225,245,.75);margin-top:2px;">${item.desc}</div>
      </div>
    `;
    document.body.appendChild(t);
    try{ if(navigator.vibrate) navigator.vibrate([20,40,20]); }catch(e){}
    setTimeout(()=>{ t.style.transition='all .4s'; t.style.opacity='0'; t.style.transform='translate(-50%,-30px)'; setTimeout(()=>t.remove(),500); }, 3500);
  }

  // ========== 毎日ガチャ ==========
  function canRollDailyGacha(){
    const k = `vt_gacha_${uid()}_${today()}`;
    return !localStorage.getItem(k);
  }
  function markDailyGachaUsed(){
    localStorage.setItem(`vt_gacha_${uid()}_${today()}`, '1');
  }
  function rollDailyGacha(){
    if(!canRollDailyGacha()) return null;
    markDailyGachaUsed();
    // 必ずアンコモン以上
    const total = 25+10+4+1;
    let r = Math.random()*total, chosen = 'uncommon';
    for(const [k,w] of Object.entries({uncommon:25,rare:10,epic:4,legendary:1})){
      r -= w; if(r <= 0){ chosen = k; break; }
    }
    const pool = ITEMS.filter(i=>i.rarity===chosen);
    const item = pool[Math.floor(Math.random()*pool.length)];
    addToInventory(item);
    return item;
  }
  function showGachaModal(){
    if(!canRollDailyGacha()){
      alert('今日のガチャは引き済みです。明日また！');
      return;
    }
    const overlay = document.createElement('div');
    overlay.id = 'gm-gacha-modal';
    overlay.style.cssText = `position:fixed;inset:0;z-index:9000;background:rgba(4,6,12,.92);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:18px;`;
    overlay.innerHTML = `
      <div style="background:linear-gradient(160deg,#1a1230,#0d0a20);border:2.5px solid rgba(240,212,138,.6);border-radius:22px;max-width:380px;width:100%;padding:26px 24px;text-align:center;box-shadow:0 24px 64px rgba(0,0,0,.7),0 0 60px rgba(240,212,138,.2);">
        <div style="font-size:.6rem;letter-spacing:.22em;color:rgba(240,212,138,.7);font-weight:900;margin-bottom:8px;">— DAILY GACHA —</div>
        <h2 style="font-family:'Noto Serif JP',serif;font-size:1.3rem;font-weight:900;color:#f0d48a;margin-bottom:14px;">今日の宝箱</h2>
        <div id="gm-gacha-stage" style="font-size:5rem;line-height:1;margin:18px 0;animation:gmGachaShake .15s ease-in-out infinite;">📦</div>
        <p style="font-size:.78rem;color:rgba(220,225,245,.75);margin-bottom:16px;">タップして開ける（1日1回）</p>
        <button id="gm-gacha-open" style="width:100%;background:linear-gradient(135deg,#c9a84c,#f0d48a);border:none;color:#1a1200;font-family:'Noto Serif JP',serif;font-size:.95rem;font-weight:900;padding:13px;border-radius:11px;cursor:pointer;letter-spacing:.06em;">✦ 開ける ✦</button>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('gm-gacha-open').onclick = ()=>{
      const item = rollDailyGacha();
      const stage = document.getElementById('gm-gacha-stage');
      const color = RARITY_COLORS[item.rarity];
      stage.style.animation = 'none';
      stage.textContent = item.icon;
      stage.style.filter = `drop-shadow(0 0 24px ${color})`;
      stage.style.transform = 'scale(1.3)';
      setTimeout(()=>{ stage.style.transition='transform .4s'; stage.style.transform='scale(1)'; }, 50);
      const btn = document.getElementById('gm-gacha-open');
      btn.innerHTML = `<span style="color:${color};">✦ ${item.name} ✦</span><br><span style="font-size:.65rem;font-weight:400;">${item.desc}</span>`;
      btn.style.background = `linear-gradient(135deg,${color},rgba(255,255,255,.4))`;
      btn.onclick = ()=>{ overlay.remove(); };
      try{ if(window.AppEnhance?.confetti) window.AppEnhance.confetti({count:50, duration:2200, colors:[color,'#fff8d8']}); }catch(e){}
      try{ if(navigator.vibrate) navigator.vibrate([30,60,30,60,80]); }catch(e){}
    };
  }

  // ========== ボスタップミニゲーム ==========
  // 30秒間タップ。多くタップするほどボーナスダメージ。1日1回。
  function canPlayBossMini(){
    const k = `vt_boss_mini_${uid()}_${today()}`;
    return !localStorage.getItem(k);
  }
  function markBossMiniUsed(damage){
    localStorage.setItem(`vt_boss_mini_${uid()}_${today()}`, JSON.stringify({damage, ts: Date.now()}));
  }
  function showBossMiniGame(boss){
    if(!canPlayBossMini()){
      alert('今日のミニゲームはプレイ済みです。明日また挑戦できます！');
      return;
    }
    const overlay = document.createElement('div');
    overlay.id = 'gm-boss-mini';
    overlay.style.cssText = `position:fixed;inset:0;z-index:9000;background:radial-gradient(ellipse at center,rgba(40,8,20,.95),rgba(10,2,8,.99));backdrop-filter:blur(8px);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:18px;`;
    overlay.innerHTML = `
      <div style="text-align:center;width:100%;max-width:380px;">
        <div style="font-size:.6rem;letter-spacing:.22em;color:#f0a0a0;font-weight:900;margin-bottom:6px;">— BOSS BLITZ —</div>
        <h2 style="font-family:'Noto Serif JP',serif;font-size:1.3rem;font-weight:900;color:#fff;margin-bottom:16px;">30秒間タップ連打！</h2>
        <div id="gm-mini-status" style="font-size:1rem;color:#f0d48a;margin-bottom:14px;font-family:'Noto Serif JP',serif;font-weight:900;">準備…</div>
        <div id="gm-mini-stage" style="position:relative;width:240px;height:240px;margin:0 auto 20px;background:radial-gradient(circle,rgba(224,92,92,.18),transparent);border:3px solid rgba(224,92,92,.5);border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;user-select:none;transition:transform .08s;">
          <img id="gm-mini-img" src="${boss.img||'./image/A1-Photoroom.png'}" style="width:80%;height:80%;object-fit:contain;pointer-events:none;">
        </div>
        <div style="font-size:.85rem;color:rgba(220,225,245,.85);">タップ数: <strong id="gm-mini-count" style="font-size:1.4rem;color:#f0d48a;font-family:'Noto Serif JP',serif;">0</strong></div>
        <div style="font-size:.85rem;color:rgba(220,225,245,.85);margin-top:4px;">ボーナス: <strong id="gm-mini-bonus" style="font-size:1.4rem;color:#a8e8c0;font-family:'Noto Serif JP',serif;">0</strong>pt</div>
        <button id="gm-mini-cancel" style="margin-top:16px;background:none;border:1px solid rgba(170,188,216,.3);color:rgba(170,188,216,.7);padding:7px 16px;border-radius:8px;cursor:pointer;font-family:inherit;font-size:.7rem;">中止</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const stage = document.getElementById('gm-mini-stage');
    const img = document.getElementById('gm-mini-img');
    const status = document.getElementById('gm-mini-status');
    const countEl = document.getElementById('gm-mini-count');
    const bonusEl = document.getElementById('gm-mini-bonus');
    let started = false, taps = 0, ended = false;

    // カウントダウン
    let cd = 3;
    status.textContent = `あと ${cd}…`;
    const cdTimer = setInterval(()=>{
      cd--;
      if(cd > 0){ status.textContent = `あと ${cd}…`; }
      else if(cd === 0){ status.textContent = 'GO!!'; status.style.color='#a8e8c0'; }
      else { clearInterval(cdTimer); startGame(); }
    }, 800);

    function startGame(){
      started = true;
      let timeLeft = 30;
      status.textContent = `残り ${timeLeft}秒`;
      status.style.color = '#f0d48a';
      const tapHandler = (e)=>{
        if(!started || ended) return;
        taps++;
        countEl.textContent = taps;
        const bonus = calcBonus(taps);
        bonusEl.textContent = bonus;
        // タップエフェクト
        stage.style.transform = 'scale(.95)';
        setTimeout(()=>{ stage.style.transform = 'scale(1)'; }, 80);
        // パンチ
        const pop = document.createElement('div');
        pop.textContent = '💥';
        pop.style.cssText = `position:absolute;font-size:2rem;left:${rand(20,80)}%;top:${rand(20,80)}%;pointer-events:none;animation:gmPunch .5s ease-out forwards;`;
        stage.appendChild(pop);
        setTimeout(()=>pop.remove(),500);
        try{ if(navigator.vibrate && taps%5===0) navigator.vibrate(8); }catch(e){}
      };
      stage.addEventListener('click', tapHandler);
      stage.addEventListener('touchstart', (e)=>{e.preventDefault(); tapHandler(e);}, {passive:false});
      const tick = setInterval(()=>{
        timeLeft--;
        if(timeLeft <= 0){
          clearInterval(tick); ended = true;
          finishGame();
        } else {
          status.textContent = `残り ${timeLeft}秒`;
          if(timeLeft <= 5) status.style.color = '#f0a0a0';
        }
      }, 1000);
    }
    function calcBonus(taps){
      // タップ100＝20pt、200＝50pt、300＝100pt
      return Math.floor(taps / 5) + Math.floor(Math.max(0,taps-100)/5) + Math.floor(Math.max(0,taps-200)/5);
    }
    function finishGame(){
      const bonus = calcBonus(taps);
      markBossMiniUsed(bonus);
      // ボスダメージに反映（adventure.html 側が va_boss_mini_${uid}_${chId} を加算する）
      try{
        const chId = boss.id;
        const k = `va_boss_mini_dmg_${uid()}_${chId}`;
        const cur = parseInt(localStorage.getItem(k)||'0',10);
        localStorage.setItem(k, String(cur + bonus));
      }catch(e){}
      status.textContent = '🎉 終了！';
      status.style.color = '#a8e8c0';
      img.style.filter = 'brightness(0.5) blur(2px)';
      stage.style.borderColor = 'rgba(168,232,192,.7)';
      // 最終ダメージ表示
      setTimeout(()=>{
        overlay.innerHTML = `
          <div style="text-align:center;background:linear-gradient(160deg,#0d1225,#101830);border:2px solid rgba(168,232,192,.5);border-radius:22px;padding:30px 26px;max-width:380px;width:100%;box-shadow:0 24px 64px rgba(0,0,0,.7);">
            <div style="font-size:3rem;margin-bottom:8px;">⚔</div>
            <div style="font-size:.6rem;letter-spacing:.22em;color:rgba(168,232,192,.7);font-weight:900;margin-bottom:8px;">— RESULT —</div>
            <h2 style="font-family:'Noto Serif JP',serif;font-size:1.3rem;color:#a8e8c0;margin-bottom:16px;">クエスト達成！</h2>
            <div style="background:rgba(0,0,0,.3);border-radius:12px;padding:14px 16px;margin-bottom:18px;">
              <div style="font-size:.7rem;color:rgba(220,225,245,.7);">タップ数</div>
              <div style="font-family:'Noto Serif JP',serif;font-size:2rem;color:#f0d48a;font-weight:900;">${taps}回</div>
              <div style="font-size:.7rem;color:rgba(220,225,245,.7);margin-top:8px;">追加ダメージ</div>
              <div style="font-family:'Noto Serif JP',serif;font-size:2rem;color:#a8e8c0;font-weight:900;">+${bonus}pt</div>
            </div>
            <button id="gm-mini-close" style="width:100%;background:linear-gradient(135deg,#4ec98a,#a8e8c0);border:none;color:#0a2018;font-family:'Noto Serif JP',serif;font-size:.95rem;font-weight:900;padding:12px;border-radius:11px;cursor:pointer;">受け取る</button>
          </div>
        `;
        document.getElementById('gm-mini-close').onclick = ()=>overlay.remove();
        try{ if(window.AppEnhance?.confetti) window.AppEnhance.confetti({count:80, duration:2500}); }catch(e){}
      }, 800);
    }
    document.getElementById('gm-mini-cancel').onclick = ()=>{
      ended = true; clearInterval(cdTimer);
      overlay.remove();
    };
  }

  // ========== スキルツリー ==========
  // クラスごとに3〜5スキル。XPの代わりに「章クリア時に得るスキルポイント」で解放
  const SKILL_TREES = {
    hero: [
      { id:'crit_master',  name:'クリティカルマスター', cost:1, desc:'クリティカル率+10%', icon:'⚔' },
      { id:'extra_xp',     name:'経験値の心得',         cost:1, desc:'XP+10%（全体）', icon:'⭐' },
      { id:'streak_armor', name:'継続の鎧',             cost:2, desc:'ストリークフリーズ追加+1/月', icon:'🛡' },
    ],
    knight: [
      { id:'streak_armor', name:'継続の鎧',         cost:1, desc:'ストリークフリーズ追加+1/月', icon:'🛡' },
      { id:'iron_will',    name:'鉄の意志',         cost:1, desc:'ストリーク7日でXP+25%（強化）', icon:'⚙' },
      { id:'crit_eye',     name:'冷静な眼',         cost:2, desc:'クリティカル率+5%', icon:'👁' },
    ],
    saint: [
      { id:'qol_recover',  name:'癒やしの力',       cost:1, desc:'QOL記録XP+50%', icon:'⛪' },
      { id:'low_day_boost',name:'弱者の祝福',       cost:1, desc:'QOL平均≤2.5の日のXP+50%', icon:'💖' },
      { id:'coach_grace',  name:'対話の恩寵',       cost:2, desc:'コーチXP+30%（強化）', icon:'🌙' },
    ],
    witch: [
      { id:'food_master',  name:'錬金術の極意',     cost:1, desc:'野菜・果物XP+20%（強化）', icon:'🥦' },
      { id:'set_genius',   name:'セットの天才',     cost:1, desc:'セットボーナスXP×2', icon:'🌟' },
      { id:'rare_drop',    name:'希少素材発見',     cost:2, desc:'アイテムドロップ率+15%', icon:'💎' },
    ],
    villainess: [
      { id:'comeback_god', name:'カムバック女神',   cost:1, desc:'カムバックXPさらに+50%', icon:'👑' },
      { id:'phoenix',      name:'不死鳥の血',       cost:1, desc:'ストリーク途切れ自動復活+1/月', icon:'🔥' },
      { id:'poison_immune',name:'毒への耐性',       cost:2, desc:'制限食品のXPダメージ-50%', icon:'☠' },
    ],
    prince: [
      { id:'party_aura',   name:'王者のオーラ',     cost:1, desc:'パーティ参加でXP+25%（強化）', icon:'🤴' },
      { id:'invite_x2',    name:'招きの王',         cost:1, desc:'招待コードXP×2', icon:'💌' },
      { id:'leadership',   name:'リーダーシップ',   cost:2, desc:'パーティ近況投稿XP+30', icon:'🎖' },
    ],
  };
  function getActiveSkills(){
    try{ return JSON.parse(localStorage.getItem(`vt_skills_${uid()}`)||'[]'); }catch(e){ return []; }
  }
  function getSkillPoints(){
    // 章クリア数 - 解放済みスキルコスト合計
    let earned = 0;
    try{
      const state = JSON.parse(localStorage.getItem(`va_state_${uid()}`)||'{"defeated":[]}');
      earned = (state.defeated||[]).length; // 1章クリア=1ポイント
    }catch(e){}
    const skills = getActiveSkills();
    const cls = localStorage.getItem('vt_class') || 'hero';
    const tree = SKILL_TREES[cls] || [];
    const used = skills.reduce((s,id)=>{
      const sk = tree.find(t=>t.id===id);
      return s + (sk ? sk.cost : 0);
    }, 0);
    return Math.max(0, earned - used);
  }
  function unlockSkill(id){
    const skills = getActiveSkills();
    if(skills.includes(id)) return false;
    skills.push(id);
    localStorage.setItem(`vt_skills_${uid()}`, JSON.stringify(skills));
    return true;
  }

  // ========== カードコレクション統計 ==========
  function getCollectionProgress(){
    const inv = getInventory();
    const totalUnique = ITEMS.length;
    const haveUnique = ITEMS.filter(i=>inv[i.id]>0).length;
    return { totalUnique, haveUnique, percent: Math.round(haveUnique/totalUnique*100) };
  }

  // ========== スタイル ==========
  const styles = document.createElement('style');
  styles.textContent = `
    @keyframes gmLootIn{0%{opacity:0;transform:translate(-50%,-60px) scale(.7);}60%{opacity:1;transform:translate(-50%,8px) scale(1.05);}100%{opacity:1;transform:translate(-50%,0) scale(1);}}
    @keyframes gmGachaShake{0%,100%{transform:rotate(-5deg);}50%{transform:rotate(5deg);}}
    @keyframes gmPunch{0%{opacity:1;transform:scale(.5);}100%{opacity:0;transform:scale(1.8) translateY(-30px);}}
  `;
  document.head.appendChild(styles);

  // ========== 装備スロット（3スロット）==========
  // 装備中のアイテム＝inventoryから1つずつ「装備中」フラグを立てる
  function getEquipped(){
    try{ return JSON.parse(localStorage.getItem(`vt_equipped_${uid()}`)||'[]'); }catch(e){ return []; }
  }
  function setEquipped(arr){
    localStorage.setItem(`vt_equipped_${uid()}`, JSON.stringify(arr.slice(0,3)));
  }
  function equipItem(itemId){
    const inv = getInventory();
    if(!inv[itemId] || inv[itemId] <= 0) return false;
    const eq = getEquipped();
    if(eq.includes(itemId)) return false;
    if(eq.length >= 3) return false;
    eq.push(itemId);
    setEquipped(eq);
    return true;
  }
  function unequipItem(itemId){
    const eq = getEquipped().filter(id=>id !== itemId);
    setEquipped(eq);
  }
  // 装備による永続的なボーナス効果
  function getEquippedBonuses(){
    const eq = getEquipped();
    const bonuses = { xpMult:1.0, critRate:0, exBonus:0, foodXpMult:1.0, dropRate:0 };
    eq.forEach(id=>{
      const item = ITEMS.find(i=>i.id===id);
      if(!item) return;
      if(item.effect.xp) bonuses.xpMult += 0.05; // 装備で+5%
      if(item.effect.nextCrit) bonuses.critRate += item.effect.nextCrit * 0.5; // 装備で半分の効果が永続
      if(item.effect.exBonus) bonuses.exBonus += item.effect.exBonus * 0.5;
      if(item.effect.nextFoodXp) bonuses.foodXpMult += (item.effect.nextFoodXp - 1) * 0.5;
      if(item.rarity === 'legendary') bonuses.xpMult += 0.10; // レジェンダリーは+10%
      if(item.rarity === 'epic') bonuses.xpMult += 0.05;
    });
    return bonuses;
  }

  // ========== アイテム消費・即時効果 ==========
  function useItem(itemId){
    const inv = getInventory();
    if(!inv[itemId] || inv[itemId] <= 0) return { ok:false, msg:'アイテムがありません' };
    const item = ITEMS.find(i=>i.id===itemId);
    if(!item) return { ok:false, msg:'不明なアイテム' };
    // 装備中のアイテムは消費できない
    const eq = getEquipped();
    if(eq.includes(itemId)) return { ok:false, msg:'装備中のアイテムは外してから使用してください' };
    // 効果適用
    let msg = '';
    const effect = item.effect || {};
    const wk = (function(){const d=new Date(),j=new Date(d.getFullYear(),0,1);const w=Math.ceil(((d-j)/86400000+j.getDay()+1)/7);return `${d.getFullYear()}_W${String(w).padStart(2,'0')}`;})();
    const xpKey = `vc_xp_${uid()}_${wk}`;
    const cur = parseInt(localStorage.getItem(xpKey)||'0',10);
    if(effect.xp){
      localStorage.setItem(xpKey, String(cur + effect.xp));
      msg = `+${effect.xp} XP獲得！`;
    }
    if(effect.xpBoost24h){
      localStorage.setItem(`vt_xp_boost_${uid()}`, JSON.stringify({mult:effect.xpBoost24h, until: Date.now()+24*3600*1000}));
      msg = `24時間 XP+${Math.round(effect.xpBoost24h*100)}% 発動！`;
    }
    if(effect.streakRestore){
      const sk = `vt_freeze_${uid()}_${today().slice(0,7)}`;
      localStorage.removeItem(sk); // 今月のフリーズをリセット
      msg = 'ストリークフリーズが今月分復活！';
    }
    if(effect.nextBossDmg){
      // 現在の章にボーナスダメージ
      try{
        const state = JSON.parse(localStorage.getItem(`va_state_${uid()}`)||'{"chapterIdx":0,"defeated":[]}');
        const CHAPTER_IDS = ['tutorial','growth_kaito','growth_sera','growth_luna','sloth','gluttony','wrath','envy','greed','pride','lust','final'];
        const chId = CHAPTER_IDS[state.chapterIdx];
        if(chId){
          const k = `va_boss_mini_dmg_${uid()}_${chId}`;
          const c = parseInt(localStorage.getItem(k)||'0',10);
          localStorage.setItem(k, String(c + effect.nextBossDmg));
          msg = `現在のボスに +${effect.nextBossDmg} ダメージ！`;
        }
      }catch(e){}
    }
    if(effect.nextCrit){
      localStorage.setItem(`vt_next_crit_boost_${uid()}`, String(effect.nextCrit));
      msg = `次の3回の記録でクリティカル率+${Math.round(effect.nextCrit*100)}%`;
    }
    if(effect.forceSetBonus){
      localStorage.setItem(`vt_force_set_${uid()}`, '1');
      msg = '次の食事でセットボーナスが確定発動！';
    }
    // 在庫を減らす
    inv[itemId]--;
    if(inv[itemId] <= 0) delete inv[itemId];
    localStorage.setItem(`vt_inventory_${uid()}`, JSON.stringify(inv));
    return { ok:true, msg };
  }

  // ========== ウィークエンド・特別イベント ==========
  function getActiveEvent(){
    const now = new Date();
    const d = now.getDay();
    // 土日
    if(d === 0 || d === 6){
      return {
        id:'weekend_2x',
        name:'週末ボーナスタイム',
        icon:'🎊',
        desc:'今週末はXP×1.5・ドロップ率+15%！',
        xpMult:1.5,
        dropBonus:0.15,
      };
    }
    // 月初（1〜3日）
    const date = now.getDate();
    if(date <= 3){
      return {
        id:'month_start',
        name:'月初の鼓舞',
        icon:'🌟',
        desc:'今月のスタート週はXP+20%',
        xpMult:1.2,
      };
    }
    return null;
  }

  // ========== 通貨：累積XPの一部を「ヴィタリアコイン」として扱う ==========
  // 1コイン = 10XP相当（ショップでの購入に使用）
  function getCoins(){
    let totalXp = 0;
    try{
      // 全週のコーチXP合計
      for(let i=0;i<localStorage.length;i++){
        const k = localStorage.key(i);
        if(k && k.startsWith(`vc_xp_${uid()}_`) && !k.includes('_daily_')){
          totalXp += parseInt(localStorage.getItem(k)||'0',10);
        }
      }
    }catch(e){}
    const spent = parseInt(localStorage.getItem(`vt_coins_spent_${uid()}`)||'0',10);
    return Math.max(0, Math.floor(totalXp/10) - spent);
  }
  function spendCoins(amount){
    const cur = parseInt(localStorage.getItem(`vt_coins_spent_${uid()}`)||'0',10);
    localStorage.setItem(`vt_coins_spent_${uid()}`, String(cur + amount));
  }

  // ========== ショップ品 ==========
  const SHOP_ITEMS = [
    { id:'sh_xp50',     name:'金貨袋',         icon:'💰', cost:50,  desc:'即時 +500 XP', effect:{xp:500} },
    { id:'sh_boost',    name:'女神の祝福',     icon:'✨', cost:80,  desc:'24時間 XP+30%', effect:{xpBoost24h:0.30} },
    { id:'sh_freeze',   name:'氷の聖水',       icon:'🧊', cost:100, desc:'ストリークフリーズを今月分復活', effect:{streakRestore:1} },
    { id:'sh_bossdmg',  name:'紅蓮の宝玉',     icon:'🔥', cost:60,  desc:'現在のボスに +50 ダメージ', effect:{nextBossDmg:50} },
    { id:'sh_crit3',    name:'運命の砂時計',   icon:'⏳', cost:40,  desc:'次3回の記録でクリ率+30%', effect:{nextCrit:0.30} },
    { id:'sh_setforce', name:'伝説の食材',     icon:'🍱', cost:50,  desc:'次の食事でセットボーナス確定', effect:{forceSetBonus:true} },
    { id:'sh_gachatick',name:'ガチャ追加チケット', icon:'🎟', cost:120, desc:'今日のガチャ枠をリセット', effect:{resetGacha:true} },
  ];
  function buyShopItem(id){
    const item = SHOP_ITEMS.find(i=>i.id===id);
    if(!item) return { ok:false, msg:'存在しません' };
    if(getCoins() < item.cost) return { ok:false, msg:`コイン不足（${item.cost}必要・${getCoins()}所持）` };
    spendCoins(item.cost);
    // 効果を即時適用
    const fakeItem = { id:'shopuse_'+id, effect:item.effect };
    if(item.effect.resetGacha){
      localStorage.removeItem(`vt_gacha_${uid()}_${today()}`);
      return { ok:true, msg:'今日のガチャ枠をリセット！もう一度引けます' };
    }
    // 一時的なinventoryに追加→useItem
    const inv = getInventory();
    inv[fakeItem.id] = 1;
    localStorage.setItem(`vt_inventory_${uid()}`, JSON.stringify(inv));
    // ITEMSに一時登録（使う時のために）
    if(!ITEMS.find(i=>i.id===fakeItem.id)){
      ITEMS.push({...fakeItem, name:item.name, icon:item.icon, desc:item.desc, rarity:'shop'});
    }
    const r = useItem(fakeItem.id);
    return r;
  }

  // ========== 公開API ==========
  window.Gamification = {
    rollCritical,
    rollLootDrop,
    addToInventory,
    getInventory,
    showLootToast,
    canRollDailyGacha,
    showGachaModal,
    canPlayBossMini,
    showBossMiniGame,
    SKILL_TREES,
    getActiveSkills,
    getSkillPoints,
    unlockSkill,
    ITEMS,
    RARITY_COLORS,
    getCollectionProgress,
    getEquipped,
    equipItem,
    unequipItem,
    getEquippedBonuses,
    useItem,
    getActiveEvent,
    getCoins,
    spendCoins,
    SHOP_ITEMS,
    buyShopItem,
  };
})();
