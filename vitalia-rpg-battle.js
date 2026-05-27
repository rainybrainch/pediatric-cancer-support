/* ============================================================
   Vitalia RPG — Battle Modal (turn-based)
   - 全画面オーバーレイ、モンスターA1-A12×4キャラ
   - 攻撃 / スキル / 防御 / 撤退
   - 勝利時：撃破リストに追加、XPバースト
   ============================================================ */
(function(){
  'use strict';

  const VFX = window.VitaliaFX = window.VitaliaFX || {};

  // ===== モンスターデータ =====
  const FOES = [
    {id:'A1', name:'スロウス',     tag:'怠惰の影',   src:'./image/A1-Photoroom.png',  stay:'./image/A1stay.mp4',  atkVid:'./image/A1attack.mp4', hp:60,  atk:12, weak:'運動'},
    {id:'A2', name:'グラウラス',   tag:'飢渇の獣',   src:'./image/A2-Photoroom.png',  stay:'./image/A2stay.mp4',  atkVid:'./image/A2attack.mp4', hp:75,  atk:14, weak:'栄養'},
    {id:'A3', name:'プリディ',     tag:'高慢の翼',   src:'./image/A3-Photoroom.png',  stay:'./image/A3stay.mp4',  atkVid:'./image/A3attack.mp4', hp:90,  atk:16, weak:'コーチ'},
    {id:'A4', name:'グリディ',     tag:'強欲の腕',   src:'./image/A4-Photoroom.png',  stay:'./image/A4stay.mp4',  atkVid:'./image/A4attack.mp4', hp:100, atk:18, weak:'運動'},
    {id:'A5', name:'インヴィ',     tag:'嫉妬の眼',   src:'./image/A5-Photoroom.png',  stay:'./image/A5stay.mp4',  atkVid:'./image/A5attack.mp4', hp:110, atk:20, weak:'栄養'},
    {id:'A6', name:'ラスト',       tag:'欲望の灯',   src:'./image/A6-Photoroom.png',  stay:'./image/A6stay.mp4',  atkVid:'./image/A6attack.mp4', hp:120, atk:22, weak:'運動'},
    {id:'A7', name:'ラース',       tag:'憤怒の炎',   src:'./image/A7-Photoroom.png',  stay:'./image/A7stay.mp4',  atkVid:'./image/A7attack.mp4', hp:140, atk:26, weak:'コーチ'},
    {id:'A8', name:'ナイト',       tag:'夜霧の影',   src:'./image/A8-Photoroom.png',  stay:'./image/A8stay.mp4',  atkVid:'./image/A8attack.mp4', hp:90,  atk:18, weak:'栄養'},
    {id:'A9', name:'メランコリア', tag:'憂愁の刃',   src:'./image/A9-Photoroom.png',  hp:130, atk:24, weak:'コーチ'},
    {id:'A10',name:'インソムニア', tag:'不眠の幕',   src:'./image/A10-Photoroom.png', hp:150, atk:28, weak:'運動'},
    {id:'A11',name:'パニカ',       tag:'動悸の鎖',   src:'./image/A11-Photoroom.png', hp:170, atk:32, weak:'栄養'},
    {id:'A12',name:'デスペア',     tag:'絶望の王',   src:'./image/A12-Photoroom.png', hp:220, atk:38, weak:'コーチ'},
  ];

  // ===== プレイヤークラス =====
  const CLASSES = {
    kaito: {name:'カイト', cls:'鍛錬の剣士', portrait:'./image/kaito-sabun (1).png', stay:'./image/kaito-stay.mp4', hp:120, mp:30, atk:[14,22], skills:[
      {name:'必殺の一撃', cost:8, dmg:[28,42], type:'phys'},
      {name:'鍛錬の波動', cost:14, dmg:[20,28], type:'phys', extra:'2hit'}
    ]},
    sera:  {name:'セラ',  cls:'癒しの神官', portrait:'./image/sera-sabun (1).png', stay:'./image/sera-stay.mp4',  hp:100, mp:50, atk:[10,16], skills:[
      {name:'治癒の光',  cost:10, heal:[26,40]},
      {name:'神聖な裁き',cost:18, dmg:[24,36], type:'holy'}
    ]},
    runa:  {name:'ルナ',  cls:'導きの賢者', portrait:'./image/runa-sabun (1).png', stay:'./image/runa-stay.mp4',  atkVid:'./image/runa-attack.mp4', hp:90, mp:60, atk:[8,14],  skills:[
      {name:'導きの星',  cost:12, dmg:[22,32], type:'magic'},
      {name:'希望の歌',  cost:16, heal:[18,28], extra:'mpregen'}
    ]},
    pikuse:{name:'ピクセ',cls:'勇者見習い', portrait:'./image/pikuse-sabun (1).png', stay:'./image/pikuse-stay.mp4', hp:130, mp:25, atk:[12,20], skills:[
      {name:'勇気の叫び', cost:6, dmg:[20,30], type:'phys'},
      {name:'守りの構え', cost:8, buff:'def'}
    ]}
  };

  // ===== State =====
  let stage = null;
  let state = null; // {foe, player, hp, mp, fhp, turn, defending, log}
  let isAnimating = false;

  // ===== Build DOM =====
  function build(){
    stage = document.createElement('div');
    stage.className = 'vrpg-battle';
    stage.innerHTML = `
      <div class="vrpg-bt-top">
        <button class="vrpg-bt-back" type="button" data-vrpg-bt-back>⟵ 撤退</button>
        <div class="vrpg-bt-turn" data-vrpg-bt-turn>あなたのターン</div>
        <div style="width:60px;"></div>
      </div>
      <div class="vrpg-bt-arena">
        <div class="vrpg-bt-foe">
          <div class="vrpg-bt-foe-tag" data-vrpg-foe-tag>怠惰の影</div>
          <div class="vrpg-bt-foe-name" data-vrpg-foe-name>スロウス</div>
          <div class="vrpg-bt-hpbar">
            <div class="vrpg-bt-hpbar-fill" data-vrpg-foe-hp-fill></div>
            <div class="vrpg-bt-hpbar-text" data-vrpg-foe-hp-text>60 / 60</div>
          </div>
          <div class="vrpg-bt-foe-sprite" data-vrpg-foe-sprite>
            <video data-vrpg-foe-vid autoplay loop muted playsinline preload="metadata" style="width:100%;height:100%;object-fit:contain;display:none;"></video>
            <img alt="" data-vrpg-foe-img>
          </div>
        </div>
        <div class="vrpg-bt-log" data-vrpg-bt-log style="display:none;"><div class="vrpg-bt-log-text"></div></div>
        <div class="vrpg-bt-player">
          <div class="vrpg-bt-player-portrait" data-vrpg-player-portrait>
            <video data-vrpg-player-vid autoplay loop muted playsinline preload="metadata" style="width:100%;height:100%;object-fit:cover;object-position:center 14%;display:none;"></video>
            <img alt="" data-vrpg-player-img>
          </div>
          <div class="vrpg-bt-player-stats">
            <div class="vrpg-bt-player-class" data-vrpg-player-class>鍛錬の剣士</div>
            <div class="vrpg-bt-player-name" data-vrpg-player-name>カイト</div>
            <div class="vrpg-bt-pbar hp">
              <div class="vrpg-bt-pbar-fill" data-vrpg-hp-fill></div>
              <div class="vrpg-bt-pbar-lbl">HP</div>
              <div class="vrpg-bt-pbar-val" data-vrpg-hp-val>120/120</div>
            </div>
            <div class="vrpg-bt-pbar mp" style="margin-top:4px;">
              <div class="vrpg-bt-pbar-fill" data-vrpg-mp-fill></div>
              <div class="vrpg-bt-pbar-lbl">MP</div>
              <div class="vrpg-bt-pbar-val" data-vrpg-mp-val>30/30</div>
            </div>
          </div>
        </div>
      </div>
      <div class="vrpg-bt-cmd" data-vrpg-bt-cmd>
        <button class="vrpg-bt-cmd-btn atk"  type="button" data-cmd="atk"><span class="vrpg-bt-cmd-icon">⚔</span>攻撃</button>
        <button class="vrpg-bt-cmd-btn skl"  type="button" data-cmd="skl1"><span class="vrpg-bt-cmd-icon">✦</span><span data-skl-name>必殺の一撃</span><span class="vrpg-bt-cmd-cost" data-skl-cost>MP 8</span></button>
        <button class="vrpg-bt-cmd-btn def"  type="button" data-cmd="def"><span class="vrpg-bt-cmd-icon">🛡</span>防御</button>
        <button class="vrpg-bt-cmd-btn skl"  type="button" data-cmd="skl2"><span class="vrpg-bt-cmd-icon">⟁</span><span data-skl-name2>鍛錬の波動</span><span class="vrpg-bt-cmd-cost" data-skl-cost2>MP 14</span></button>
      </div>
    `;
    document.body.appendChild(stage);

    stage.querySelector('[data-vrpg-bt-back]').addEventListener('click', flee);
    stage.querySelectorAll('[data-cmd]').forEach(b=>{
      b.addEventListener('click', ()=> handleCmd(b.getAttribute('data-cmd')));
    });
  }

  function pickFoe(opts){
    opts = opts||{};
    if(opts.foeId){
      return FOES.find(f=>f.id===opts.foeId) || FOES[0];
    }
    return FOES[Math.floor(Math.random()*FOES.length)];
  }
  function pickPlayer(opts){
    opts = opts||{};
    const id = opts.playerId || localStorage.getItem('vitalia_class') || 'kaito';
    return CLASSES[id] || CLASSES.kaito;
  }

  function syncBars(){
    const f = state.foe;
    const p = state.player;
    stage.querySelector('[data-vrpg-foe-hp-fill]').style.width = Math.max(0,(state.fhp/f.hp)*100)+'%';
    stage.querySelector('[data-vrpg-foe-hp-text]').textContent = Math.max(0,state.fhp)+' / '+f.hp;
    stage.querySelector('[data-vrpg-hp-fill]').style.width = Math.max(0,(state.hp/p.hp)*100)+'%';
    stage.querySelector('[data-vrpg-hp-val]').textContent = Math.max(0,state.hp)+'/'+p.hp;
    stage.querySelector('[data-vrpg-mp-fill]').style.width = Math.max(0,(state.mp/p.mp)*100)+'%';
    stage.querySelector('[data-vrpg-mp-val]').textContent = Math.max(0,state.mp)+'/'+p.mp;
  }

  function setTurnLabel(t){
    stage.querySelector('[data-vrpg-bt-turn]').textContent = t;
  }
  function logMsg(text, dur){
    const wrap = stage.querySelector('[data-vrpg-bt-log]');
    const inner = wrap.querySelector('.vrpg-bt-log-text');
    wrap.style.display = 'block';
    inner.textContent = text;
    inner.style.animation = 'none';
    void inner.offsetWidth;
    inner.style.animation = '';
    clearTimeout(state._logT);
    state._logT = setTimeout(()=>{ wrap.style.display = 'none'; }, dur||1400);
  }

  function spawnDamageOn(targetSel, dmg, opts){
    opts = opts||{};
    const target = stage.querySelector(targetSel);
    if(!target) return;
    const r = target.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'vrpg-bt-dmg' + (opts.crit?' crit':'') + (opts.heal?' heal':'');
    el.style.left = (r.left + r.width/2) + 'px';
    el.style.top  = (r.top  + r.height/2) + 'px';
    el.textContent = (opts.heal?'+':'') + dmg;
    document.body.appendChild(el);
    setTimeout(()=>el.remove(), 1100);
  }

  function rng(a,b){return a + Math.floor(Math.random()*(b-a+1));}

  function handleCmd(cmd){
    if(isAnimating) return;
    isAnimating = true;
    const p = state.player;
    const f = state.foe;
    setTurnLabel('あなたのターン ⚔');

    if(cmd==='atk'){
      const dmg = rng(p.atk[0], p.atk[1]);
      const crit = Math.random()<0.18;
      const finalDmg = crit ? Math.floor(dmg*1.7) : dmg;
      state.fhp = Math.max(0, state.fhp - finalDmg);
      const sprite = stage.querySelector('[data-vrpg-foe-sprite]');
      sprite.classList.remove('hit','flash'); void sprite.offsetWidth;
      sprite.classList.add('hit','flash');
      spawnDamageOn('[data-vrpg-foe-sprite]', finalDmg, {crit});
      logMsg(crit?'痛恨の一撃！':'攻撃が命中した！');
      syncBars();
      setTimeout(afterPlayer, 700);
    }
    else if(cmd==='skl1' || cmd==='skl2'){
      const idx = cmd==='skl1'?0:1;
      const sk = p.skills[idx];
      if(state.mp < sk.cost){
        logMsg('MPが足りない...');
        isAnimating = false; return;
      }
      state.mp -= sk.cost;
      syncBars();
      if(sk.heal){
        const heal = rng(sk.heal[0], sk.heal[1]);
        state.hp = Math.min(p.hp, state.hp + heal);
        spawnDamageOn('[data-vrpg-player-portrait]', heal, {heal:true});
        logMsg(p.name+'は『'+sk.name+'』を唱えた');
        syncBars();
        setTimeout(afterPlayer, 700);
      } else {
        const hits = sk.extra==='2hit' ? 2 : 1;
        let total=0;
        const sprite = stage.querySelector('[data-vrpg-foe-sprite]');
        let i=0;
        logMsg(p.name+'は『'+sk.name+'』を放った');
        const doHit = ()=>{
          const dmg = rng(sk.dmg[0], sk.dmg[1]);
          const crit = Math.random()<0.25;
          const finalDmg = crit ? Math.floor(dmg*1.6) : dmg;
          total += finalDmg;
          state.fhp = Math.max(0, state.fhp - finalDmg);
          sprite.classList.remove('hit','flash'); void sprite.offsetWidth;
          sprite.classList.add('hit','flash');
          spawnDamageOn('[data-vrpg-foe-sprite]', finalDmg, {crit});
          // Cyan sparks for skills
          const r = sprite.getBoundingClientRect();
          if(window.VitaliaFX){
            VFX.sparkBurst(r.left+r.width/2, r.top+r.height/2, 14, {color:'cyan'});
          }
          syncBars();
          i++;
          if(i<hits) setTimeout(doHit, 380);
          else setTimeout(afterPlayer, 700);
        };
        doHit();
      }
    }
    else if(cmd==='def'){
      state.defending = true;
      logMsg(p.name+'は守りを固めた');
      setTimeout(afterPlayer, 600);
    }
  }

  function afterPlayer(){
    if(state.fhp<=0){
      victory();
      return;
    }
    setTurnLabel(state.foe.name+'のターン');
    setTimeout(foeTurn, 600);
  }

  function foeTurn(){
    const f = state.foe;
    let dmg = rng(Math.floor(f.atk*0.7), Math.floor(f.atk*1.3));
    if(state.defending) dmg = Math.floor(dmg*0.45);
    state.defending = false;

    // Swap foe video to attack animation if available
    const foeVid = stage.querySelector('[data-vrpg-foe-vid]');
    if(f.atkVid && foeVid && foeVid.style.display !== 'none'){
      const stayUrl = f.stay;
      foeVid.src = f.atkVid;
      foeVid.loop = false;
      foeVid.play().catch(()=>{});
      // restore to stay after a moment
      clearTimeout(state._atkVidT);
      state._atkVidT = setTimeout(()=>{
        if(!stage.classList.contains('open')) return;
        foeVid.src = stayUrl;
        foeVid.loop = true;
        foeVid.play().catch(()=>{});
      }, 1200);
    }

    state.hp = Math.max(0, state.hp - dmg);
    const portrait = stage.querySelector('[data-vrpg-player-portrait]');
    portrait.classList.remove('hit'); void portrait.offsetWidth;
    portrait.style.animation = 'vrpg-shake .35s ease';
    setTimeout(()=>portrait.style.animation='', 360);
    spawnDamageOn('[data-vrpg-player-portrait]', dmg);
    if(window.VitaliaFX){
      const r = portrait.getBoundingClientRect();
      VFX.sparkBurst(r.left+r.width/2, r.top+r.height/2, 10, {color:'red'});
    }
    logMsg(f.name+'の攻撃！');
    syncBars();
    setTimeout(()=>{
      if(state.hp<=0){
        defeat();
      } else {
        setTurnLabel('あなたのターン ⚔');
        isAnimating = false;
      }
    }, 800);
  }

  function victory(){
    const f = state.foe;
    setTurnLabel('勝利！');
    const sprite = stage.querySelector('[data-vrpg-foe-sprite]');
    sprite.classList.add('faint');
    if(window.VitaliaFX){
      const r = sprite.getBoundingClientRect();
      VFX.sparkBurst(r.left+r.width/2, r.top+r.height/2, 28, {color:'gold'});
      setTimeout(()=>{
        VFX.monsterDefeat(f.src, r.left+r.width/2, r.top+r.height/2);
      }, 400);
    }
    setTimeout(()=>{
      close();
      const xp = 30 + f.atk*4;
      if(window.VitaliaFX){
        VFX.questComplete({
          title: f.name + ' を撃破した！',
          body:  f.tag+'を打ち破り、ヴィタリアに光が戻った。',
          stats: [{n:'+'+xp, l:'XP'}, {n:'+1', l:'撃破'}, {n:'★', l:f.weak}]
        });
      }
      isAnimating = false;
    }, 1600);
  }

  function defeat(){
    setTurnLabel('力尽きた...');
    logMsg('しかし冒険はまだ終わらない。', 1800);
    setTimeout(()=>{
      close();
      isAnimating = false;
    }, 2000);
  }

  function flee(){
    if(!state) return close();
    logMsg('撤退した — 再挑戦しよう');
    setTimeout(close, 700);
  }

  function close(){
    if(!stage) return;
    stage.classList.remove('open');
  }

  VFX_Battle = {
    start(opts){
      if(!stage) build();
      const foe = pickFoe(opts);
      const player = pickPlayer(opts);
      state = {
        foe, player,
        fhp: foe.hp,
        hp:  player.hp,
        mp:  player.mp,
        defending: false,
      };
      // sync DOM
      stage.querySelector('[data-vrpg-foe-name]').textContent = foe.name;
      stage.querySelector('[data-vrpg-foe-tag]').textContent  = foe.tag;
      const foeImg = stage.querySelector('[data-vrpg-foe-img]');
      const foeVid = stage.querySelector('[data-vrpg-foe-vid]');
      foeImg.src = foe.src;
      if(foe.stay){
        foeVid.src = foe.stay;
        foeVid.style.display = 'block';
        foeImg.style.display = 'none';
        foeVid.play().catch(()=>{});
      } else {
        foeVid.removeAttribute('src');
        foeVid.style.display = 'none';
        foeImg.style.display = 'block';
      }
      stage.querySelector('[data-vrpg-player-name]').textContent = player.name;
      stage.querySelector('[data-vrpg-player-class]').textContent= player.cls;
      const pImg = stage.querySelector('[data-vrpg-player-img]');
      const pVid = stage.querySelector('[data-vrpg-player-vid]');
      pImg.src = player.portrait;
      if(player.stay){
        pVid.src = player.stay;
        pVid.style.display = 'block';
        pImg.style.display = 'none';
        pVid.play().catch(()=>{});
      } else {
        pVid.removeAttribute('src');
        pVid.style.display = 'none';
        pImg.style.display = 'block';
      }
      stage.querySelector('[data-skl-name]').textContent      = player.skills[0].name;
      stage.querySelector('[data-skl-cost]').textContent      = 'MP '+player.skills[0].cost;
      stage.querySelector('[data-skl-name2]').textContent     = player.skills[1].name;
      stage.querySelector('[data-skl-cost2]').textContent     = 'MP '+player.skills[1].cost;
      syncBars();
      setTurnLabel('あなたのターン ⚔');
      stage.classList.add('open');
      isAnimating = false;
    },
    close
  };
  window.VitaliaBattle = VFX_Battle;

  // ===== Battle launcher FAB =====
  function installFab(){
    return;
    const fab = document.createElement('button');
    fab.className = 'vrpg-fab';
    fab.setAttribute('aria-label','戦闘を開始');
    fab.innerHTML = '<span aria-hidden="true">⚔</span><span class="vrpg-fab-label">戦闘へ</span>';
    fab.addEventListener('click', ()=> VFX_Battle.start());
    document.body.appendChild(fab);
  }

  function init(){
    installFab();
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', init, {once:true});
  } else {
    init();
  }

  // helper local
  var VFX_Battle;
})();
