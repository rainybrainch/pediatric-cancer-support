/* ============================================================
   Vitalia RPG — Bind Layer
   ページ固有の装飾と既存UIへのフック
   ============================================================ */
(function(){
  'use strict';

  const VFX = window.VitaliaFX;

  // ===== Hero banner data (declared early so TDZ doesn't bite) =====
  const HERO = {
    quest:        {portrait:'./image/kaito-2-Photoroom.png',  brow:'EXERCISE QUEST', title:'カイトと挑む、鍛錬の試練',  sub:'1タップ = 10 分。歩く・階段・家事も冒険のうち。', stay:'./image/kaito-stay.mp4'},
    nutrition:    {portrait:'./image/sera-2-Photoroom.png',   brow:'NUTRITION QUEST',title:'セラと整える、命の食卓',     sub:'食べたものを書くだけ。あなたの選択が、明日の力になる。', stay:'./image/sera-stay.mp4'},
    adventure:    {portrait:'./image/runa-2-Photoroom.png',   brow:'ADVENTURE',     title:'12週間の旅、いま此処に。',   sub:'試練を超えるたび、世界は少しずつ色を取り戻していく。', stay:'./image/runa-stay.mp4'},
    'adventure-map':{portrait:'./image/pikuse-Photoroom.png',brow:'WORLD MAP',     title:'冒険の歩み — 章をめぐる。',    sub:'クリアした試練、これからの試練、すべてがあなたの軌跡。', stay:'./image/pikuse-stay.mp4'},
  };

  if(!VFX){
    document.addEventListener('vrpg:ready', bindAll, {once:true});
    setTimeout(()=>{ if(window.VitaliaFX) bindAll(); }, 200);
    return;
  }
  bindAll();

  function bindAll(){
    const page = detectPage();
    insertHero(page);
    bindGoalBanner();
    bindSaveToast();
    bindMonsterTokens();
    decorateAdventureChapters();
    if(page === 'adventure-map') decorateMap();
    if(page === 'adventure') hookAdventureBattleButtons();
    boostQbtnDataXp();
  }

  function detectPage(){
    const path = location.pathname.split('/').pop() || '';
    if(/quest/.test(path)) return 'quest';
    if(/nutrition/.test(path)) return 'nutrition';
    if(/adventure-map/.test(path)) return 'adventure-map';
    if(/adventure/.test(path)) return 'adventure';
    return 'unknown';
  }

  // ===== Hero banner =====
  function insertHero(page){
    if(!HERO[page]) return;
    if(document.querySelector('.vrpg-hero')) return;
    // Skip on pages that already have their own hero card to avoid duplication
    if((page==='quest' && document.querySelector('.quest-hero')) ||
       (page==='nutrition' && document.querySelector('.nutrition-hero, .quest-hero'))){
      // Instead, upgrade the existing hero: swap portrait img to looping video
      upgradeExistingHero(HERO[page]);
      return;
    }

    const h = HERO[page];
    const el = document.createElement('div');
    el.className = 'vrpg-hero';
    const portraitInner = h.stay
      ? `<video src="${h.stay}" autoplay loop muted playsinline preload="metadata" poster="${h.portrait}" aria-hidden="true"></video>`
      : `<img src="${h.portrait}" alt="">`;
    el.innerHTML = `
      <div class="vrpg-hero-row">
        <div class="vrpg-hero-portrait">${portraitInner}</div>
        <div class="vrpg-hero-info">
          <div class="vrpg-hero-eyebrow">${h.brow}</div>
          <div class="vrpg-hero-title">${h.title}</div>
          <div class="vrpg-hero-sub">${h.sub}</div>
        </div>
        <div class="vrpg-hero-stats" data-vrpg-hero-stats>
          <div class="vrpg-hero-stat"><b data-vrpg-stat-lv>—</b><span>LV</span></div>
        </div>
      </div>
      <div class="vrpg-hero-bar" data-vrpg-hero-bar>
        <div class="vrpg-hero-bar-label">XP <span data-vrpg-stat-xp>—</span></div>
        <div class="vrpg-hero-bar-fill" style="width:0%"></div>
      </div>
    `;

    // mount point: try common containers
    const mountSel = [
      '#main-screen',
      '.adv-main',
      'main.page',
      'main',
      'body'
    ];
    let mount = null;
    for(const s of mountSel){
      const found = document.querySelector(s);
      if(found){ mount = found; break; }
    }
    if(!mount) return;
    // Insert AFTER header element if it's a direct child, else as first child
    const headerEl = mount.querySelector(':scope > header, :scope > .adv-header, :scope > .main-header');
    if(headerEl){
      headerEl.after(el);
    } else {
      mount.insertBefore(el, mount.firstChild);
    }

    // populate from localStorage if present
    updateHeroStats();
    setInterval(updateHeroStats, 2000);
  }

  // Replace the existing hero's static portrait <img> with a looping stay.mp4 <video>
  function upgradeExistingHero(h){
    if(!h.stay) return;
    const candidates = document.querySelectorAll('.qh-char img, .quest-hero img, .nutrition-hero img');
    candidates.forEach(img=>{
      if(img.dataset.vrpgUpgraded) return;
      img.dataset.vrpgUpgraded = '1';
      const v = document.createElement('video');
      v.src = h.stay;
      v.autoplay = true; v.loop = true; v.muted = true;
      v.playsInline = true;
      v.defaultMuted = true;
      v.setAttribute('autoplay','');
      v.setAttribute('muted','');
      v.setAttribute('loop','');
      v.setAttribute('playsinline','');
      v.setAttribute('webkit-playsinline','');
      v.preload = 'auto';
      v.poster = img.src;
      // Copy crucial style props
      v.style.width  = '100%';
      v.style.height = '100%';
      v.style.objectFit = 'cover';
      v.style.objectPosition = img.style.objectPosition || 'center 14%';
      v.style.display = 'block';
      v.setAttribute('aria-hidden','true');
      img.parentNode.replaceChild(v, img);
      // Explicitly trigger play (some browsers won't autoplay even with all flags)
      const tryPlay = ()=>{
        const p = v.play();
        if(p && p.catch) p.catch(()=>{
          // Retry on user interaction
          const retry = ()=>{ v.play().catch(()=>{}); document.removeEventListener('touchstart', retry); document.removeEventListener('click', retry); };
          document.addEventListener('touchstart', retry, {once:true, passive:true});
          document.addEventListener('click', retry, {once:true});
        });
      };
      if(v.readyState >= 2){ tryPlay(); }
      else { v.addEventListener('loadedmetadata', tryPlay, {once:true}); }
    });
  }

  function readPlayer(){
    try{
      const xp = parseInt(localStorage.getItem('vt_xp')||localStorage.getItem('vitalia_xp')||'0', 10);
      let level = parseInt(localStorage.getItem('vt_level')||localStorage.getItem('vitalia_level')||'1', 10);
      if(!level || level<1) level = Math.max(1, 1 + Math.floor(xp/200));
      return {xp, level};
    } catch(e){ return {xp:0, level:1}; }
  }
  function xpForLevel(lv){ return 200 * lv; }

  function updateHeroStats(){
    const lvEl = document.querySelector('[data-vrpg-stat-lv]');
    const xpEl = document.querySelector('[data-vrpg-stat-xp]');
    const bar  = document.querySelector('[data-vrpg-hero-bar] .vrpg-hero-bar-fill');
    if(!lvEl) return;
    const {xp, level} = readPlayer();
    lvEl.textContent = level;
    const need = xpForLevel(level);
    const within = xp % need;
    xpEl.textContent = within + ' / ' + need;
    if(bar) bar.style.width = Math.min(100, (within/need)*100) + '%';
  }

  // ===== Goal banner → Quest complete =====
  function bindGoalBanner(){
    const banner = document.getElementById('goal-banner');
    if(!banner) return;
    const obs = new MutationObserver(()=>{
      const visible = banner.classList.contains('show') || banner.classList.contains('active') || getComputedStyle(banner).opacity > 0.5;
      if(visible && !banner.__vrpgTriggered){
        banner.__vrpgTriggered = true;
        const body = banner.textContent || 'クエスト達成！';
        VFX.questComplete({
          title:'クエスト達成！',
          body: body.replace(/^[⚔✦\s]+/,'').replace(/[!！✦]+$/,'') || '今週の目標を達成した。',
          stats:[{n:'+150', l:'XP'}, {n:'+1', l:'STREAK'}, {n:'⚔', l:'進撃'}]
        });
        setTimeout(()=>{ banner.__vrpgTriggered = false; }, 5000);
      }
    });
    obs.observe(banner, {attributes:true, attributeFilter:['class','style']});
  }

  // ===== Save toast → mini sparkle =====
  function bindSaveToast(){
    const t = document.getElementById('save-toast');
    if(!t) return;
    const obs = new MutationObserver(()=>{
      const visible = t.classList.contains('show') || (t.style && t.style.bottom && parseInt(t.style.bottom,10) > 0);
      if(visible && !t.__vrpgT){
        t.__vrpgT = true;
        const r = t.getBoundingClientRect();
        VFX.sparkBurst(r.left + r.width/2, r.top + r.height/2, 10, {color:'cyan'});
        VFX.xpFloat(r.left + r.width/2 + 30, r.top + 10, 10);
        setTimeout(()=>{ t.__vrpgT = false; }, 1200);
      }
    });
    obs.observe(t, {attributes:true, attributeFilter:['class','style']});
  }

  // ===== add data-xp to qbtns so taps show +XP =====
  function boostQbtnDataXp(){
    document.querySelectorAll('.qbtn').forEach(b=>{
      if(b.hasAttribute('data-xp')) return;
      const lbl = (b.textContent||'').trim();
      // simple heuristic
      let xp = 10;
      if(/30分|大|高/.test(lbl)) xp = 30;
      else if(/20分|中/.test(lbl)) xp = 20;
      b.setAttribute('data-xp', xp);
    });
  }

  // ===== Monster tokens: enable battle launch when clicked =====
  function bindMonsterTokens(){
    document.body.addEventListener('click', (e)=>{
      const t = e.target.closest('[data-vrpg-foe]');
      if(!t) return;
      const id = t.getAttribute('data-vrpg-foe');
      if(window.VitaliaBattle){
        VitaliaBattle.start({foeId: id});
      }
    });
  }

  // ===== Adventure chapter ornamentation =====
  function decorateAdventureChapters(){
    document.querySelectorAll('.chapter-card').forEach(c=>{
      if(c.querySelector('.vrpg-chapter-ornament')) return;
      const orn = document.createElement('div');
      orn.className = 'vrpg-chapter-ornament';
      orn.innerHTML = `<span class="vrpg-ch-corner tl"></span><span class="vrpg-ch-corner tr"></span><span class="vrpg-ch-corner bl"></span><span class="vrpg-ch-corner br"></span>`;
      c.style.position = 'relative';
      c.appendChild(orn);
    });
  }

  // ===== Adventure map embellishment =====
  function decorateMap(){
    // Add subtle pulse to current chapter
    document.querySelectorAll('.chapter-row.current .chapter-token').forEach(t=>{
      t.style.animation = 'tokenPulse 2.4s ease-in-out infinite';
    });
  }

  // ===== Adventure battle hook =====
  function hookAdventureBattleButtons(){
    document.body.addEventListener('click', (e)=>{
      const t = e.target.closest('[data-action="battle"], .adv-battle-btn, [data-vrpg-battle]');
      if(!t) return;
      e.preventDefault();
      const foe = t.getAttribute('data-foe') || t.getAttribute('data-vrpg-battle');
      if(window.VitaliaBattle) VitaliaBattle.start(foe ? {foeId:foe} : {});
    });
  }
})();
