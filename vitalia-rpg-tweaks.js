/* ============================================================
   Vitalia RPG — Tweaks Panel
   ============================================================ */
(function(){
  'use strict';
  const VFX = window.VitaliaFX = window.VitaliaFX || {};
  let panelEl = null, openBtn = null;

  const THEMES = [
    {id:'dawn',     name:'水彩',    sw:'linear-gradient(135deg,#c8e4f4,#5fd0e8)'},
    {id:'dusk',     name:'黄昏',    sw:'linear-gradient(135deg,#ffcca0,#c45a2a)'},
    {id:'night',    name:'星夜',    sw:'linear-gradient(135deg,#15264a,#5fd0e8)'},
    {id:'abyss',    name:'深海',    sw:'linear-gradient(135deg,#063040,#4ec3e8)'},
    {id:'parchment',name:'羊皮紙',  sw:'linear-gradient(135deg,#f8edd2,#d4a838)'},
  ];
  const DENSITIES = [
    {id:'off',       name:'OFF'},
    {id:'minimal',   name:'抑えめ'},
    {id:'standard',  name:'標準'},
    {id:'cinematic', name:'劇場'}
  ];

  function buildPanel(){
    panelEl = document.createElement('div');
    panelEl.className = 'vrpg-tweaks';
    panelEl.innerHTML = `
      <div class="vrpg-tweaks-head">
        <div class="vrpg-tweaks-title">✦ Tweaks</div>
        <button class="vrpg-tweaks-close" aria-label="閉じる">×</button>
      </div>

      <div class="vrpg-tweaks-sec">
        <div class="vrpg-tweaks-lbl">テーマ</div>
        <div class="vrpg-tweaks-swatch" data-vrpg-theme-grp></div>
      </div>

      <div class="vrpg-tweaks-sec">
        <div class="vrpg-tweaks-lbl">演出の密度</div>
        <div class="vrpg-tweaks-row" data-vrpg-density-grp></div>
      </div>

      <div class="vrpg-tweaks-sec">
        <div class="vrpg-tweaks-lbl">テスト</div>
        <div class="vrpg-tweaks-row">
          <button class="vrpg-tweaks-chip" data-vrpg-test="xp">＋XP演出</button>
          <button class="vrpg-tweaks-chip" data-vrpg-test="quest">クエスト達成</button>
        </div>
        <div class="vrpg-tweaks-row" style="margin-top:6px;">
          <button class="vrpg-tweaks-chip" data-vrpg-test="lvl">レベルアップ</button>
          <button class="vrpg-tweaks-chip" data-vrpg-test="defeat">モンスター撃破</button>
        </div>
        <div class="vrpg-tweaks-row" style="margin-top:6px;">
          <button class="vrpg-tweaks-chip" data-vrpg-test="battle" style="flex:1 1 100%;background:linear-gradient(135deg,#f0c548,#c8941a);color:#1a0e02;border-color:#8e6510;">⚔ 戦闘開始</button>
        </div>
      </div>

      <div class="vrpg-tweaks-foot">変更は自動で保存されます</div>
    `;
    document.body.appendChild(panelEl);

    // Theme swatches
    const tg = panelEl.querySelector('[data-vrpg-theme-grp]');
    THEMES.forEach(t=>{
      const b = document.createElement('button');
      b.setAttribute('data-theme', t.id);
      b.style.background = t.sw;
      b.title = t.name;
      if(VFX.settings.theme===t.id) b.classList.add('is-active');
      b.addEventListener('click', ()=>{
        VFX.set({theme:t.id});
        tg.querySelectorAll('button').forEach(x=>x.classList.toggle('is-active', x.getAttribute('data-theme')===t.id));
      });
      tg.appendChild(b);
    });

    // Density chips
    const dg = panelEl.querySelector('[data-vrpg-density-grp]');
    DENSITIES.forEach(d=>{
      const b = document.createElement('button');
      b.className = 'vrpg-tweaks-chip';
      b.textContent = d.name;
      b.setAttribute('data-density', d.id);
      if(VFX.settings.density===d.id) b.classList.add('is-active');
      b.addEventListener('click', ()=>{
        VFX.set({density:d.id});
        dg.querySelectorAll('button').forEach(x=>x.classList.toggle('is-active', x.getAttribute('data-density')===d.id));
      });
      dg.appendChild(b);
    });

    // Tests
    panelEl.querySelectorAll('[data-vrpg-test]').forEach(b=>{
      b.addEventListener('click', ()=>{
        const k = b.getAttribute('data-vrpg-test');
        const cx = window.innerWidth/2;
        const cy = window.innerHeight*0.55;
        if(k==='xp'){
          for(let i=0;i<5;i++){
            setTimeout(()=>VFX.xpFloat(cx + (Math.random()-0.5)*120, cy + (Math.random()-0.5)*40, 10 + Math.floor(Math.random()*20)), i*120);
          }
          VFX.sparkBurst(cx, cy, 18, {color:'cyan'});
        } else if(k==='quest'){
          VFX.questComplete({title:'試練を乗り越えた！', body:'今週の運動目標 150 分を達成。仲間の称賛が響く。', stats:[{n:'+180', l:'XP'}, {n:'+1', l:'STREAK'}, {n:'⚔', l:'撃破×1'}]});
        } else if(k==='lvl'){
          VFX.levelUp({level: 12, portrait:'./image/kaito-sabun (5).png', subtitle:'カイト ／ 鍛錬の剣士'});
        } else if(k==='defeat'){
          VFX.monsterDefeat('./image/A4-Photoroom.png', cx, cy);
        } else if(k==='battle' && window.VitaliaBattle){
          VitaliaBattle.start();
        }
      });
    });

    panelEl.querySelector('.vrpg-tweaks-close').addEventListener('click', ()=>{
      panelEl.classList.remove('open');
    });
  }

  function buildToggle(){
    // Place a small toggle in the FAB stack (above battle FAB)
    openBtn = document.createElement('button');
    openBtn.className = 'vrpg-fab vrpg-fab-tweaks';
    openBtn.style.background = 'linear-gradient(180deg, #5fd0e8, #1e7fa4)';
    openBtn.style.border = '2px solid #0a4870';
    openBtn.style.color = '#fff';
    openBtn.style.fontSize = '1.3rem';
    openBtn.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,.4),0 0 0 4px rgba(180,220,250,.2),0 4px 0 #0a4870,0 12px 24px -6px rgba(10,40,60,.55)';
    openBtn.innerHTML = '<span aria-hidden="true">⚙</span><span class="vrpg-fab-label">Tweaks</span>';
    openBtn.setAttribute('aria-label','Tweaks');
    openBtn.addEventListener('click', ()=>{
      panelEl.classList.toggle('open');
    });
    document.body.appendChild(openBtn);
  }

  function init(){
    buildPanel();
    buildToggle();
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', init, {once:true});
  } else {
    init();
  }
})();
