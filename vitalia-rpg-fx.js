/* ============================================================
   Vitalia RPG FX Engine — v1.0
   - body.vrpg-on を付与してRPGモード有効化
   - クエスト達成・XP獲得・撃破演出 を全ページ横断で提供
   - 既存ボタン/カードに自動アタッチ
   ============================================================ */
(function(){
  'use strict';

  // ===== Globals =====
  const VFX = window.VitaliaFX = window.VitaliaFX || {};
  const STORE_KEY = 'vrpg_settings_v1';
  const FOE_KEY   = 'vitalia_defeated_foes';

  // ===== Settings (persisted) =====
  const DEFAULTS = {
    theme: 'dawn',          // dawn / dusk / night / abyss / parchment
    density: 'standard',    // off / minimal / standard / cinematic
    sounds: false,
    autoEffects: true       // 自動でボタンクリックに XP バーストを付ける
  };
  function loadSettings(){
    try{
      const raw = localStorage.getItem(STORE_KEY);
      if(!raw) return {...DEFAULTS};
      return {...DEFAULTS, ...JSON.parse(raw)};
    }catch(e){ return {...DEFAULTS}; }
  }
  function saveSettings(s){
    try{ localStorage.setItem(STORE_KEY, JSON.stringify(s)); }catch(e){}
  }
  const S = VFX.settings = loadSettings();

  function applySettings(){
    document.documentElement.setAttribute('data-vrpg-theme', S.theme);
    document.body.classList.toggle('vrpg-density-low',  S.density==='minimal');
    document.body.classList.toggle('vrpg-density-high', S.density==='cinematic');
    document.body.classList.toggle('vrpg-density-off',  S.density==='off');
  }
  VFX.set = function(patch){
    Object.assign(S, patch);
    saveSettings(S);
    applySettings();
    document.dispatchEvent(new CustomEvent('vrpg:settings', {detail: {...S}}));
  };

  // ===== Density gate =====
  function densityGate(level){
    // level: 'low' | 'mid' | 'high'
    if(S.density==='off') return false;
    if(S.density==='minimal' && level!=='low') return false;
    return true;
  }

  // ===== Floating XP =====
  VFX.xpFloat = function(x, y, amount, opts){
    if(!densityGate('low')) return;
    opts = opts||{};
    const el = document.createElement('div');
    el.className = 'vrpg-fx-xp' + (opts.crit ? ' crit' : '');
    el.style.left = x+'px';
    el.style.top  = y+'px';
    el.textContent = (opts.label || ('+'+ amount + ' XP'));
    document.body.appendChild(el);
    setTimeout(()=>el.remove(), 1200);
  };

  // ===== Spark burst =====
  VFX.sparkBurst = function(x, y, count, opts){
    if(!densityGate('mid')) return;
    opts = opts||{};
    count = count|| (S.density==='cinematic'?22:12);
    const color = opts.color || 'gold';
    for(let i=0;i<count;i++){
      const s = document.createElement('div');
      s.className = 'vrpg-fx-spark';
      s.style.left = x+'px';
      s.style.top  = y+'px';
      const ang = (Math.PI*2)*(i/count) + Math.random()*0.3;
      const dist = 40 + Math.random()*70;
      s.style.setProperty('--vx', Math.cos(ang)*dist + 'px');
      s.style.setProperty('--vy', Math.sin(ang)*dist + 'px');
      s.style.animationDuration = (0.7 + Math.random()*0.5) + 's';
      if(color==='cyan'){
        s.style.background = 'radial-gradient(circle, #d4f0ff, #5fd0e8 60%, transparent 70%)';
        s.style.boxShadow  = '0 0 8px rgba(95,208,232,.9)';
      } else if(color==='red'){
        s.style.background = 'radial-gradient(circle, #ffd0c0, #ff7060 60%, transparent 70%)';
        s.style.boxShadow  = '0 0 8px rgba(255,90,80,.9)';
      } else if(color==='green'){
        s.style.background = 'radial-gradient(circle, #d8ffe0, #5ee090 60%, transparent 70%)';
        s.style.boxShadow  = '0 0 8px rgba(94,224,144,.9)';
      }
      document.body.appendChild(s);
      setTimeout(()=>s.remove(), 1000);
    }
  };

  // ===== Quest complete overlay =====
  let qcEl = null;
  function ensureQC(){
    if(qcEl) return qcEl;
    qcEl = document.createElement('div');
    qcEl.className = 'vrpg-qc-stage';
    qcEl.innerHTML = `
      <div class="vrpg-qc-card">
        <div class="vrpg-qc-rays"></div>
        <div class="vrpg-qc-eyebrow">✦ QUEST CLEAR ✦</div>
        <div class="vrpg-qc-title">クエスト達成！</div>
        <div class="vrpg-qc-body" data-vrpg-qc-body>素晴らしい一歩だ。</div>
        <div class="vrpg-qc-stats" data-vrpg-qc-stats></div>
        <button class="vrpg-qc-close" type="button">冒険を続ける ✦</button>
      </div>`;
    document.body.appendChild(qcEl);
    qcEl.addEventListener('click', (e)=>{
      if(e.target.classList.contains('vrpg-qc-close') || e.target===qcEl){
        qcEl.classList.remove('open');
      }
    });
    return qcEl;
  }
  VFX.questComplete = function(opts){
    opts = opts||{};
    const el = ensureQC();
    el.querySelector('.vrpg-qc-title').textContent = opts.title || 'クエスト達成！';
    el.querySelector('[data-vrpg-qc-body]').textContent = opts.body || '素晴らしい一歩だ。あなたの行動が確かに記録された。';
    const sw = el.querySelector('[data-vrpg-qc-stats]');
    sw.innerHTML = '';
    (opts.stats || [{n: (opts.xp||30), l:'XP'}, {n:'+1', l:'STREAK'}]).forEach(st=>{
      const d = document.createElement('div');
      d.className = 'vrpg-qc-stat';
      d.innerHTML = `<b>${st.n}</b><span>${st.l}</span>`;
      sw.appendChild(d);
    });
    el.classList.add('open');
    // Side sparks
    if(densityGate('mid')){
      setTimeout(()=>{
        const r = el.getBoundingClientRect();
        const cx = window.innerWidth/2, cy = window.innerHeight/2;
        VFX.sparkBurst(cx, cy, 28, {color:'gold'});
        VFX.sparkBurst(cx-80, cy, 14, {color:'cyan'});
        VFX.sparkBurst(cx+80, cy, 14, {color:'cyan'});
      }, 120);
    }
  };

  // ===== Level up cinematic =====
  let lvlEl = null;
  function ensureLvl(){
    if(lvlEl) return lvlEl;
    lvlEl = document.createElement('div');
    lvlEl.className = 'vrpg-lvl-stage';
    lvlEl.innerHTML = `
      <div class="vrpg-lvl-card">
        <div class="vrpg-lvl-eyebrow">LEVEL UP</div>
        <div class="vrpg-lvl-portrait"><img alt="" data-vrpg-lvl-img></div>
        <div class="vrpg-lvl-num" data-vrpg-lvl-num>2</div>
        <div class="vrpg-lvl-sub" data-vrpg-lvl-sub>カイト ／ 鍛錬の剣士</div>
      </div>`;
    document.body.appendChild(lvlEl);
    lvlEl.addEventListener('click', ()=>{
      lvlEl.classList.remove('open');
    });
    return lvlEl;
  }
  VFX.levelUp = function(opts){
    opts = opts || {};
    const el = ensureLvl();
    el.querySelector('[data-vrpg-lvl-img]').src = opts.portrait || './image/kaito-sabun (5).png';
    el.querySelector('[data-vrpg-lvl-num]').textContent = 'Lv. ' + (opts.level||2);
    el.querySelector('[data-vrpg-lvl-sub]').textContent = opts.subtitle || 'カイト ／ 鍛錬の剣士';
    el.classList.add('open');
    if(densityGate('mid')){
      setTimeout(()=>{
        const cx = window.innerWidth/2, cy = window.innerHeight/2;
        VFX.sparkBurst(cx, cy, 32, {color:'gold'});
      }, 200);
    }
    // auto close
    clearTimeout(VFX._lvlTimer);
    VFX._lvlTimer = setTimeout(()=>el.classList.remove('open'), 3200);
  };

  // ===== Monster spirit (defeat) =====
  VFX.monsterDefeat = function(monsterSrc, x, y){
    if(!densityGate('mid')) return;
    const el = document.createElement('div');
    el.className = 'vrpg-monster-spirit';
    el.style.left = (x||window.innerWidth/2)+'px';
    el.style.top  = (y||window.innerHeight/2)+'px';
    el.innerHTML = `<img src="${monsterSrc}" alt="">`;
    document.body.appendChild(el);
    setTimeout(()=>el.remove(), 2700);

    // persist to defeated foes list
    try{
      const list = JSON.parse(localStorage.getItem(FOE_KEY)||'[]');
      if(!list.includes(monsterSrc)){
        list.unshift(monsterSrc);
        localStorage.setItem(FOE_KEY, JSON.stringify(list.slice(0,7)));
      }
    }catch(e){}
  };

  // ===== Auto-attach to common buttons =====
  function tryAttach(){
    if(!S.autoEffects) return;
    document.body.addEventListener('click', (e)=>{
      const target = e.target.closest('.qbtn, .sh-rec-btn, .add-meal-btn, .add-quest-btn, [data-vrpg-spark]');
      if(!target) return;
      if(target.disabled) return;
      const r = target.getBoundingClientRect();
      const cx = r.left + r.width/2;
      const cy = r.top  + r.height/2;
      // small XP float for q-buttons
      if(target.classList.contains('qbtn') || target.matches('[data-vrpg-spark]')){
        const xp = parseInt(target.getAttribute('data-xp')||'10',10);
        VFX.xpFloat(cx, r.top + 8, xp);
        VFX.sparkBurst(cx, cy, 8, {color:'cyan'});
      }
    }, true);
  }

  // ===== Init =====
  function init(){
    document.body.classList.add('vrpg-on');
    applySettings();
    tryAttach();
    document.dispatchEvent(new CustomEvent('vrpg:ready'));
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', init, {once:true});
  } else {
    init();
  }
})();
