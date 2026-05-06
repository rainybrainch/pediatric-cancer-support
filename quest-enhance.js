/* ヴィタリア転生録 — クエスト拡張モジュール
   quest.html / nutrition.html 共通：
   - 上部ボスバナー（現在の冒険敵を表示・記録時にダメージ演出）
   - キャラ応援セリフ
   - コンボシステム
   - 時間帯ヒント
   - デイリークエスト
   モジュールは AppEnhance グローバルとして公開。
*/
(function(){
  'use strict';

  // ========== 設定 ==========
  const ADV_CHAPTERS=[
    {id:'tutorial',name:'迷いの霧',img:'./image/A9-Photoroom.png',hp:30},
    {id:'growth_kaito',name:'疲労の影',img:'./image/A10-Photoroom.png',hp:80},
    {id:'growth_sera',name:'枯渇の魔物',img:'./image/A12-Photoroom.png',hp:100},
    {id:'growth_luna',name:'孤独の幽霊',img:'./image/A11-Photoroom.png',hp:120},
    {id:'sloth',name:'スロウス（怠惰）',img:'./image/A1-Photoroom.png',hp:200},
    {id:'gluttony',name:'グラト（暴食）',img:'./image/A2-Photoroom.png',hp:220},
    {id:'wrath',name:'イラ（憤怒）',img:'./image/A3-Photoroom.png',hp:220},
    {id:'envy',name:'インヴィ（嫉妬）',img:'./image/A6-Photoroom.png',hp:270},
    {id:'greed',name:'ガラクタ鬼（強欲）',img:'./image/A4-Photoroom.png',hp:270},
    {id:'pride',name:'スペルビア（傲慢）',img:'./image/A5-Photoroom.png',hp:270},
    {id:'lust',name:'ルクス（色欲）',img:'./image/A7-Photoroom.png',hp:220},
    {id:'final',name:'真の試練',img:'./image/A8-Photoroom.png',hp:450},
  ];

  // 状態
  let _uid='';
  let _comboCount=0;
  let _lastRecordTime=0;
  const COMBO_WINDOW_MS=8000; // 8秒以内なら連続

  // ========== スタイル注入 ==========
  function injectStyles(){
    if(document.getElementById('qe-styles')) return;
    const style=document.createElement('style');
    style.id='qe-styles';
    style.textContent=`
      .qe-boss-banner{
        background:linear-gradient(135deg,rgba(40,15,40,.85),rgba(20,12,40,.9));
        border:1px solid rgba(180,80,160,.35);border-radius:14px;
        padding:11px 14px;margin-bottom:12px;
        display:flex;align-items:center;gap:12px;
        position:relative;overflow:hidden;
      }
      .qe-boss-img{
        width:54px;height:54px;flex-shrink:0;border-radius:50%;
        background:radial-gradient(circle,rgba(180,80,160,.3),transparent 70%);
        display:flex;align-items:center;justify-content:center;
        overflow:hidden;
      }
      .qe-boss-img img{width:100%;height:100%;object-fit:contain;
        filter:drop-shadow(0 0 8px rgba(180,80,160,.5));}
      .qe-boss-info{flex:1;min-width:0;}
      .qe-boss-lbl{font-size:.55rem;letter-spacing:.12em;color:rgba(220,160,210,.65);
        font-weight:700;text-transform:uppercase;margin-bottom:3px;}
      .qe-boss-name{font-family:'Noto Serif JP',serif;font-size:.85rem;font-weight:900;color:#f0d0e8;line-height:1.3;}
      .qe-hp-bar{
        height:8px;background:rgba(0,0,0,.5);border:1px solid rgba(180,80,160,.4);
        border-radius:99px;margin-top:6px;position:relative;overflow:hidden;
      }
      .qe-hp-fill{height:100%;background:linear-gradient(90deg,#e05c5c,#e08a3c);
        border-radius:99px;transition:width .8s cubic-bezier(.4,0,.2,1);}
      .qe-hp-text{font-size:.55rem;color:rgba(240,200,220,.8);margin-top:3px;}

      /* ダメージ演出 */
      .qe-damage-pop{
        position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);
        font-family:'Noto Serif JP',serif;font-size:2rem;font-weight:900;
        color:#fff;text-shadow:0 0 20px rgba(255,200,100,.9),0 0 40px rgba(255,150,50,.7);
        z-index:5000;pointer-events:none;
        animation:qeDmgPop 1.4s ease-out forwards;
      }
      @keyframes qeDmgPop{
        0%{opacity:0;transform:translate(-50%,-30%) scale(.6);}
        20%{opacity:1;transform:translate(-50%,-50%) scale(1.15);}
        80%{opacity:1;transform:translate(-50%,-80%) scale(1);}
        100%{opacity:0;transform:translate(-50%,-110%) scale(.95);}
      }
      .qe-combo-pop{
        position:fixed;left:50%;top:30%;transform:translate(-50%,0);
        z-index:5001;pointer-events:none;
        animation:qeComboPop 1.6s ease-out forwards;
        font-family:'Noto Serif JP',serif;font-weight:900;
        text-shadow:0 0 20px currentColor,0 0 40px currentColor;
      }
      .qe-combo-pop.lvl1{font-size:1.6rem;color:#a8e8c0;}
      .qe-combo-pop.lvl2{font-size:2.2rem;color:#f0d48a;}
      .qe-combo-pop.lvl3{font-size:3rem;color:#ff80c0;}
      @keyframes qeComboPop{
        0%{opacity:0;transform:translate(-50%,30%) scale(.5);}
        20%{opacity:1;transform:translate(-50%,0) scale(1.1);}
        85%{opacity:1;transform:translate(-50%,-20%) scale(1);}
        100%{opacity:0;transform:translate(-50%,-50%) scale(.9);}
      }
      .qe-screen-flash{
        position:fixed;inset:0;pointer-events:none;z-index:4999;
        background:radial-gradient(circle at center,rgba(255,220,140,.25),transparent 70%);
        opacity:0;
      }
      .qe-screen-flash.show{animation:qeFlash .5s ease both;}
      @keyframes qeFlash{0%{opacity:0;}30%{opacity:1;}100%{opacity:0;}}

      /* キャラセリフ */
      .qe-cheer{
        position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
        z-index:5002;pointer-events:none;
        background:rgba(15,12,30,.95);border:1px solid rgba(201,168,76,.4);
        border-radius:14px;padding:10px 16px;
        max-width:80vw;display:flex;align-items:center;gap:9px;
        box-shadow:0 8px 28px rgba(0,0,0,.5);
        opacity:0;animation:qeCheerIn .3s ease forwards;
      }
      .qe-cheer.out{animation:qeCheerOut .3s ease forwards;}
      @keyframes qeCheerIn{from{opacity:0;transform:translate(-50%,20px);}to{opacity:1;transform:translate(-50%,0);}}
      @keyframes qeCheerOut{from{opacity:1;}to{opacity:0;transform:translate(-50%,-10px);}}
      .qe-cheer-face{width:34px;height:34px;border-radius:50%;overflow:hidden;flex-shrink:0;
        border:1.5px solid;}
      .qe-cheer-face img{width:100%;height:100%;object-fit:cover;}
      .qe-cheer-text{font-size:.78rem;line-height:1.55;color:rgba(220,225,245,.92);}
      .qe-cheer-name{font-size:.55rem;color:rgba(170,188,216,.6);font-weight:700;letter-spacing:.04em;}
      .qe-cheer-luna .qe-cheer-face{border-color:rgba(201,168,76,.6);}
      .qe-cheer-kaito .qe-cheer-face{border-color:rgba(224,92,92,.55);}
      .qe-cheer-sera .qe-cheer-face{border-color:rgba(78,201,138,.55);}
      .qe-cheer-pixe .qe-cheer-face{border-color:rgba(160,240,190,.6);}
      .qe-cheer-luna .qe-cheer-name{color:rgba(240,212,138,.75);}
      .qe-cheer-kaito .qe-cheer-name{color:rgba(240,160,160,.75);}
      .qe-cheer-sera .qe-cheer-name{color:rgba(160,240,190,.75);}
      .qe-cheer-pixe .qe-cheer-name{color:rgba(160,240,190,.85);}

      /* デイリー＆時間帯 */
      .qe-daily{
        background:linear-gradient(135deg,rgba(201,168,76,.12),rgba(78,201,138,.06));
        border:1px solid rgba(201,168,76,.3);border-radius:14px;
        padding:11px 14px;margin-bottom:12px;
      }
      .qe-daily.done{opacity:.6;}
      .qe-daily-head{font-size:.55rem;letter-spacing:.12em;color:rgba(240,212,138,.75);
        font-weight:700;text-transform:uppercase;margin-bottom:5px;display:flex;align-items:center;gap:5px;}
      .qe-daily-text{font-size:.84rem;color:#f0e6c8;font-weight:700;}
      .qe-daily-progress{margin-top:6px;height:5px;background:rgba(0,0,0,.3);border-radius:99px;overflow:hidden;}
      .qe-daily-progress-fill{height:100%;background:linear-gradient(90deg,#c9a84c,#f0d48a);
        border-radius:99px;transition:width .8s ease;}
      .qe-daily-status{font-size:.6rem;color:rgba(220,210,180,.7);margin-top:4px;}

      .qe-time-tip{
        background:rgba(78,140,200,.08);border-left:3px solid rgba(78,140,200,.4);
        border-radius:6px;padding:7px 11px;margin-bottom:10px;
        font-size:.7rem;color:rgba(200,220,240,.8);line-height:1.55;
      }
      .qe-time-tip strong{color:#a8d8ff;}

      @media(max-width:480px){
        .qe-damage-pop{font-size:1.6rem;}
        .qe-combo-pop.lvl1{font-size:1.3rem;}
        .qe-combo-pop.lvl2{font-size:1.7rem;}
        .qe-combo-pop.lvl3{font-size:2.3rem;}
        .qe-cheer{padding:9px 12px;max-width:90vw;}
        .qe-cheer-text{font-size:.72rem;}
      }
    `;
    document.head.appendChild(style);
  }

  // ========== 現在の冒険状態 ==========
  function getCurrentBoss(){
    if(!_uid) return null;
    let state;
    try{ state=JSON.parse(localStorage.getItem(`va_state_${_uid}`)||'{}'); }
    catch(e){ state={chapterIdx:0,defeated:[]}; }
    const idx=state.chapterIdx||0;
    return ADV_CHAPTERS[idx]||ADV_CHAPTERS[0];
  }

  function calcDamageDealt(boss){
    if(!boss||!_uid) return 0;
    let state={};
    try{ state=JSON.parse(localStorage.getItem(`va_state_${_uid}`)||'{}'); }catch(e){}
    const baseline=state.chapterStartDmg||0;
    let totalDmg=0;
    try{
      // 運動分数
      for(let i=0;i<localStorage.length;i++){
        const k=localStorage.key(i);
        if(!k) continue;
        if(k.startsWith(`vq_${_uid}_`) && !k.includes('hist') && !k.includes('streak') && !k.includes('ach')){
          try{ const d=JSON.parse(localStorage.getItem(k)||'{}'); totalDmg+=(d.score||0); }catch(e){}
        }
        if(k.startsWith(`vn_${_uid}_`) && !k.includes('hist') && !k.includes('counts') && !k.includes('ach')){
          try{
            const d=JSON.parse(localStorage.getItem(k)||'{}');
            if(d.counts){
              totalDmg+=(d.counts.veg||0)*5;
              totalDmg+=(d.counts.fruit||0)*4;
              totalDmg+=(d.counts.protein||0)*3;
            }
          }catch(e){}
        }
      }
      const qHist=JSON.parse(localStorage.getItem(`vq_hist_${_uid}`)||'[]');
      qHist.forEach(h=>{ totalDmg+=(h.score||0); });
      const nHist=JSON.parse(localStorage.getItem(`vn_hist_${_uid}`)||'[]');
      nHist.forEach(h=>{
        if(h.counts){
          totalDmg+=(h.counts.veg||0)*5;
          totalDmg+=(h.counts.fruit||0)*4;
          totalDmg+=(h.counts.protein||0)*3;
        }
      });
      const ch=JSON.parse(localStorage.getItem(`vc_hist_${_uid}`)||'[]');
      totalDmg+=ch.filter(m=>m.role==='user').length*8;
    }catch(e){}
    return Math.max(0, totalDmg-baseline);
  }

  // ========== ボスバナー描画 ==========
  function renderBossBanner(){
    const banner=document.getElementById('qe-boss-banner');
    if(!banner) return;
    const boss=getCurrentBoss();
    if(!boss){ banner.style.display='none'; return; }
    banner.style.display='flex';
    const dmgDealt=Math.min(boss.hp, calcDamageDealt(boss));
    const remaining=boss.hp-dmgDealt;
    const pct=Math.round(dmgDealt/boss.hp*100);
    document.getElementById('qe-boss-img-el').src=boss.img;
    document.getElementById('qe-boss-name').textContent='vs '+boss.name;
    document.getElementById('qe-hp-fill').style.width=(100-pct)+'%';
    document.getElementById('qe-hp-text').textContent=`HP ${remaining} / ${boss.hp}（あと${boss.hp-dmgDealt}pt で討伐）`;
  }

  // ========== ダメージ演出 ==========
  function showDamage(amount){
    const pop=document.createElement('div');
    pop.className='qe-damage-pop';
    pop.textContent=`-${amount}`;
    document.body.appendChild(pop);
    setTimeout(()=>pop.remove(), 1500);
    // 軽い振動
    try{ if(navigator.vibrate) navigator.vibrate(8); }catch(e){}
    // 効果音
    try{ sndCoin(); sndDamage(); }catch(e){}
    // ボスバナー再描画
    setTimeout(renderBossBanner, 300);
  }

  // ========== コンボ判定 ==========
  function checkCombo(){
    const now=Date.now();
    if(now-_lastRecordTime<COMBO_WINDOW_MS){
      _comboCount++;
    } else {
      _comboCount=1;
    }
    _lastRecordTime=now;

    if(_comboCount>=2){
      let lvl=1, txt='NICE!', bonus=5;
      if(_comboCount>=5){ lvl=3; txt='PERFECT!! '+_comboCount+' COMBO'; bonus=50; }
      else if(_comboCount>=3){ lvl=2; txt='COMBO! '+_comboCount; bonus=15; }

      const pop=document.createElement('div');
      pop.className=`qe-combo-pop lvl${lvl}`;
      pop.textContent=txt;
      document.body.appendChild(pop);
      setTimeout(()=>pop.remove(), 1700);

      // 振動フィードバック（モバイル）
      try{
        if(navigator.vibrate){
          if(lvl===3) navigator.vibrate([30,40,30,40,80]);
          else if(lvl===2) navigator.vibrate([20,30,30]);
          else navigator.vibrate(15);
        }
      }catch(e){}
      // 効果音
      try{ sndCombo(lvl); }catch(e){}

      // フラッシュ
      if(lvl>=2){
        let flash=document.querySelector('.qe-screen-flash');
        if(!flash){
          flash=document.createElement('div');
          flash.className='qe-screen-flash';
          document.body.appendChild(flash);
        }
        flash.classList.remove('show');
        void flash.offsetWidth;
        flash.classList.add('show');
      }

      // ボーナスXP（ローカルでコーチXPに加算）
      try{
        const wk=weekKey();
        const k=`vc_xp_${_uid}_${wk}`;
        const cur=parseInt(localStorage.getItem(k)||'0',10);
        localStorage.setItem(k, String(cur+bonus));
      }catch(e){}
    }
    return _comboCount;
  }

  // ========== キャラ応援 ==========
  const CHEERS={
    kaito:{
      face:'./image/kaito-sabun%20(1).png', name:'カイト',
      msgs:[
        '「いいぞ、続けろ！」',
        '「その調子だ、無理せず一歩ずつ。」',
        '「動くたびに強くなっている。」',
        '「俺も若い頃そうだった。続けることが力だ。」',
        '「焦らず、でも止まるな。」',
      ]
    },
    sera:{
      face:'./image/sera-sabun%20(1).png', name:'セラ',
      msgs:[
        '「魔力が満ちてきましたね✨」',
        '「素晴らしい選択です。」',
        '「あなたの体が喜んでいます。」',
        '「バランス、大切ですよ。」',
        '「今日も一日、自分を大切に。」',
      ]
    },
    seraFish:{
      face:'./image/sera-sabun%20(2).png', name:'セラ',
      msgs:[
        '「魚！週2回の理想ですね🐟」',
        '「青魚は脳と心に効くんですよ。」',
        '「DHA・EPAで魔力UP！」',
      ]
    },
    seraSoy:{
      face:'./image/sera-sabun%20(2).png', name:'セラ',
      msgs:[
        '「大豆、植物性の優等生です🌱」',
        '「イソフラボンの恵みですね。」',
        '「続けやすい味方ですね。」',
      ]
    },
    luna:{
      face:'./image/runa-sabun%20(2).png', name:'ルナ',
      msgs:[
        '「あなたの努力、ちゃんと見ていますよ。」',
        '「今日のあなたが、明日の自分を救います。」',
        '「無理せず、自分のペースで。」',
      ]
    },
    pixe:{
      face:'./image/pikuse-sabun%20(1).png', name:'ピクセ',
      msgs:[
        '「ぴくっ！絶好調！」',
        '「いいペース！その調子！」',
        '「ぴく〜♪楽しくなってきた！」',
        '「記録するのが習慣になってきたね！」',
      ]
    }
  };

  function showCheer(charKey){
    const c=CHEERS[charKey];
    if(!c) return;
    const msg=c.msgs[Math.floor(Math.random()*c.msgs.length)];
    // 既存のセリフを消す
    document.querySelectorAll('.qe-cheer').forEach(e=>e.remove());
    const div=document.createElement('div');
    div.className='qe-cheer qe-cheer-'+(charKey.replace('Fish','').replace('Soy',''));
    div.innerHTML=`
      <div class="qe-cheer-face"><img src="${c.face}" alt="${c.name}"></div>
      <div>
        <div class="qe-cheer-name">${c.name}</div>
        <div class="qe-cheer-text">${msg}</div>
      </div>`;
    document.body.appendChild(div);
    setTimeout(()=>{ div.classList.add('out'); setTimeout(()=>div.remove(),300); }, 2400);
  }

  // ========== 時間帯ヒント ==========
  function renderTimeTip(){
    const tip=document.getElementById('qe-time-tip');
    if(!tip) return;
    const h=new Date().getHours();
    let msg='';
    if(h>=5 && h<11){
      msg='<strong>🌅 朝</strong>：朝の散歩で1日のスタートを。<strong>カイト</strong>の運動クエストがおすすめ。';
    } else if(h>=11 && h<14){
      msg='<strong>🍱 昼</strong>：今日のランチに <strong>魚🐟</strong> や <strong>大豆🌱</strong> はどう？セラのレシピが効きます。';
    } else if(h>=14 && h<18){
      msg='<strong>🌤 午後</strong>：5〜10分の散歩・ストレッチでリフレッシュ。';
    } else if(h>=18 && h<22){
      msg='<strong>🌙 夜</strong>：1日の振り返りに、<strong>ルナ</strong>と話してみては？';
    } else {
      msg='<strong>🌌 深夜</strong>：色欲ルクスの誘惑に注意⚠️ 早めの就寝を。';
    }
    tip.innerHTML=msg;
  }

  // ========== デイリークエスト ==========
  function getDailyQuest(){
    const today=new Date().toISOString().slice(0,10);
    const seed=parseInt(today.replace(/-/g,''),10);
    const QUESTS=[
      {id:'veg2', text:'🥦 野菜2皿以上を記録', bonus:30, page:'nutrition', check:s=>s.vegToday>=2},
      {id:'fish1', text:'🐟 魚1食を記録', bonus:40, page:'nutrition', check:s=>s.fishToday>=1},
      {id:'soy1', text:'🌱 大豆製品1食を記録', bonus:30, page:'nutrition', check:s=>s.soyToday>=1},
      {id:'ex10', text:'⚔ 運動10分以上を記録', bonus:20, page:'quest', check:s=>s.exMinToday>=10},
      {id:'ex30', text:'⚔ 運動30分以上を記録', bonus:50, page:'quest', check:s=>s.exMinToday>=30},
      {id:'frt2', text:'🍎 果物2皿を記録', bonus:25, page:'nutrition', check:s=>s.fruitToday>=2},
      {id:'pro2', text:'🍳 たんぱく質2食を記録', bonus:30, page:'nutrition', check:s=>s.proToday>=2},
    ];
    return QUESTS[seed%QUESTS.length];
  }

  function getTodayStats(){
    const today=new Date().toISOString().slice(0,10);
    let s={vegToday:0,fishToday:0,soyToday:0,fruitToday:0,proToday:0,exMinToday:0};
    try{
      const dailyKey=`qe_daily_count_${_uid}_${today}`;
      const stored=JSON.parse(localStorage.getItem(dailyKey)||'{}');
      Object.assign(s, stored);
    }catch(e){}
    return s;
  }

  function bumpTodayStat(field, amount){
    const today=new Date().toISOString().slice(0,10);
    const dailyKey=`qe_daily_count_${_uid}_${today}`;
    let s={};
    try{ s=JSON.parse(localStorage.getItem(dailyKey)||'{}'); }catch(e){}
    s[field]=(s[field]||0)+amount;
    localStorage.setItem(dailyKey, JSON.stringify(s));
  }

  function renderDailyQuest(){
    const banner=document.getElementById('qe-daily');
    if(!banner) return;
    const q=getDailyQuest();
    const s=getTodayStats();
    const done=q.check(s);
    document.getElementById('qe-daily-text').textContent=q.text+`（達成で +${q.bonus}XP）`;
    if(done){
      banner.classList.add('done');
      document.getElementById('qe-daily-status').textContent='✅ 達成済み！';
      document.getElementById('qe-daily-progress-fill').style.width='100%';
      // 一度だけボーナスXP付与
      const today=new Date().toISOString().slice(0,10);
      const claimedKey=`qe_daily_claimed_${_uid}_${today}`;
      if(!localStorage.getItem(claimedKey)){
        try{
          const wk=weekKey();
          const xpKey=`vc_xp_${_uid}_${wk}`;
          const cur=parseInt(localStorage.getItem(xpKey)||'0',10);
          localStorage.setItem(xpKey, String(cur+q.bonus));
          localStorage.setItem(claimedKey,'1');
        }catch(e){}
      }
    } else {
      banner.classList.remove('done');
      document.getElementById('qe-daily-status').textContent='まだ達成してません';
      document.getElementById('qe-daily-progress-fill').style.width='0%';
    }
  }

  // ========== HTML 注入 ==========
  function injectBanners(){
    const target=document.querySelector('.main-content')
      ||document.querySelector('main')
      ||document.body;
    if(!target) return;
    if(document.getElementById('qe-boss-banner')) return;
    // 一番先頭に挿入
    const wrap=document.createElement('div');
    wrap.innerHTML=`
      <div class="qe-time-tip" id="qe-time-tip"></div>
      <div class="qe-daily" id="qe-daily">
        <div class="qe-daily-head"><span>🎯</span><span>今日のミッション</span></div>
        <div class="qe-daily-text" id="qe-daily-text">…</div>
        <div class="qe-daily-progress"><div class="qe-daily-progress-fill" id="qe-daily-progress-fill"></div></div>
        <div class="qe-daily-status" id="qe-daily-status">…</div>
      </div>
      <div class="qe-boss-banner" id="qe-boss-banner" style="display:none;">
        <div class="qe-boss-img"><img id="qe-boss-img-el" src="" alt=""></div>
        <div class="qe-boss-info">
          <div class="qe-boss-lbl">⚔ 戦闘中</div>
          <div class="qe-boss-name" id="qe-boss-name">—</div>
          <div class="qe-hp-bar"><div class="qe-hp-fill" id="qe-hp-fill" style="width:100%"></div></div>
          <div class="qe-hp-text" id="qe-hp-text">—</div>
        </div>
      </div>
    `;
    // 入れる場所：main-content の最初の子の前
    if(target.firstElementChild){
      target.insertBefore(wrap.firstElementChild, target.firstElementChild);
      while(wrap.firstElementChild){ target.insertBefore(wrap.firstElementChild, target.firstElementChild.nextSibling); }
    }
  }

  // ========== 実績解放トースト（全ページ共通） ==========
  function showAchievementToast(achName, icon){
    const t=document.createElement('div');
    t.className='qe-ach-toast';
    t.innerHTML=`
      <div class="qe-ach-burst"></div>
      <div class="qe-ach-icon">${icon||'🏆'}</div>
      <div class="qe-ach-text">
        <div class="qe-ach-lbl">ACHIEVEMENT UNLOCKED</div>
        <div class="qe-ach-name">${achName}</div>
      </div>
    `;
    document.body.appendChild(t);
    try{ if(navigator.vibrate) navigator.vibrate([20,40,20]); }catch(e){}
    try{ sndAchievement(); }catch(e){}
    setTimeout(()=>{ t.classList.add('out'); setTimeout(()=>t.remove(),500); }, 3500);
  }
  // CSSも追加
  const achStyles=document.createElement('style');
  achStyles.textContent=`
    .qe-ach-toast{
      position:fixed;top:80px;left:50%;transform:translate(-50%,-30px);
      background:linear-gradient(135deg,rgba(40,30,80,.96),rgba(20,15,40,.96));
      border:2px solid rgba(240,212,138,.6);border-radius:14px;
      padding:14px 20px;display:flex;align-items:center;gap:14px;
      z-index:5003;pointer-events:none;
      box-shadow:0 12px 40px rgba(240,212,138,.3),0 0 60px rgba(240,212,138,.2);
      animation:qeAchIn .5s cubic-bezier(.22,1,.36,1) both;
      max-width:90vw;
    }
    .qe-ach-toast.out{animation:qeAchOut .4s ease both;}
    @keyframes qeAchIn{
      0%{opacity:0;transform:translate(-50%,-50px) scale(.5);}
      60%{opacity:1;transform:translate(-50%,5px) scale(1.05);}
      100%{opacity:1;transform:translate(-50%,0) scale(1);}
    }
    @keyframes qeAchOut{
      0%{opacity:1;transform:translate(-50%,0) scale(1);}
      100%{opacity:0;transform:translate(-50%,-30px) scale(.95);}
    }
    .qe-ach-burst{
      position:absolute;inset:-12px;border-radius:18px;pointer-events:none;
      background:radial-gradient(ellipse at center,rgba(240,212,138,.3),transparent 60%);
      animation:qeAchBurst 1.2s ease-out forwards;
    }
    @keyframes qeAchBurst{0%{transform:scale(.5);opacity:0;}40%{opacity:1;}100%{transform:scale(1.5);opacity:0;}}
    .qe-ach-icon{font-size:2rem;line-height:1;filter:drop-shadow(0 0 8px rgba(240,212,138,.6));z-index:1;}
    .qe-ach-text{position:relative;z-index:1;}
    .qe-ach-lbl{font-size:.5rem;letter-spacing:.18em;color:rgba(240,212,138,.7);font-weight:900;}
    .qe-ach-name{font-family:'Noto Serif JP',serif;font-size:.95rem;font-weight:900;color:#f0d48a;line-height:1.3;margin-top:2px;}
    @media(max-width:480px){
      .qe-ach-toast{padding:11px 16px;gap:11px;}
      .qe-ach-icon{font-size:1.6rem;}
      .qe-ach-name{font-size:.82rem;}
    }
  `;
  document.head.appendChild(achStyles);

  // ========== 効果音（Web Audio API・素材不要） ==========
  let _audioCtx=null;
  function getAudio(){
    if(_audioCtx) return _audioCtx;
    try{
      _audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    }catch(e){}
    return _audioCtx;
  }
  function isSoundEnabled(){
    try{ return localStorage.getItem('vt_sound_off')!=='1'; }catch(e){ return true; }
  }
  function tone(freq, duration, type='sine', vol=0.05, delay=0){
    if(!isSoundEnabled()) return;
    const ctx=getAudio(); if(!ctx) return;
    const t0=ctx.currentTime+delay;
    const osc=ctx.createOscillator();
    const gain=ctx.createGain();
    osc.type=type;
    osc.frequency.value=freq;
    gain.gain.value=0;
    gain.gain.linearRampToValueAtTime(vol, t0+0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t0+duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0+duration+0.05);
  }

  function sndCoin(){
    // 短い金属チャリン
    tone(880, 0.08, 'square', 0.04, 0);
    tone(1320, 0.12, 'square', 0.04, 0.05);
  }
  function sndCombo(level){
    if(level===1){
      tone(660, 0.1, 'triangle', 0.05);
      tone(880, 0.15, 'triangle', 0.05, 0.08);
    } else if(level===2){
      [523,659,784,1047].forEach((f,i)=>tone(f, 0.12, 'triangle', 0.05, i*0.06));
    } else {
      [523,659,784,1047,1318].forEach((f,i)=>tone(f, 0.18, 'square', 0.06, i*0.07));
      tone(2093, 0.4, 'sine', 0.06, 0.4);
    }
  }
  function sndAchievement(){
    // ファンファーレ
    [523,659,784,1047,1568].forEach((f,i)=>tone(f, 0.15, 'triangle', 0.05, i*0.08));
    tone(2093, 0.5, 'sine', 0.07, 0.5);
  }
  function sndDamage(){
    // ボス被弾
    tone(120, 0.18, 'sawtooth', 0.05);
  }

  // ========== 公開 API ==========
  window.AppEnhance={
    init(uid){
      _uid=uid;
      injectStyles();
      injectBanners();
      renderTimeTip();
      renderDailyQuest();
      renderBossBanner();
    },
    onExerciseRecord(minutes, type){
      bumpTodayStat('exMinToday', minutes);
      checkCombo();
      showDamage(minutes); // 1分=1ダメ
      // セリフ
      const cheerKey = type==='high' ? 'kaito' : (Math.random()<0.5?'kaito':'pixe');
      showCheer(cheerKey);
      renderDailyQuest();
      renderBossBanner();
    },
    onFoodRecord(cat, subtype, xp){
      const map={veg:'vegToday',fruit:'fruitToday',protein:'proToday'};
      if(map[cat]) bumpTodayStat(map[cat], 1);
      if(subtype==='fish') bumpTodayStat('fishToday', 1);
      if(subtype==='soy')  bumpTodayStat('soyToday', 1);
      checkCombo();
      const dmg = (cat==='veg'?5:cat==='fruit'?4:cat==='protein'?3:1) + (subtype==='fish'?5:subtype==='soy'?3:0);
      showDamage(dmg);
      // セリフ
      let cheerKey='sera';
      if(subtype==='fish') cheerKey='seraFish';
      else if(subtype==='soy') cheerKey='seraSoy';
      else if(Math.random()<0.3) cheerKey='pixe';
      showCheer(cheerKey);
      renderDailyQuest();
      renderBossBanner();
    },
    refresh(){
      renderTimeTip();
      renderDailyQuest();
      renderBossBanner();
    },
    achievement: showAchievementToast,
  };

  // helper
  function weekKey(){
    const d=new Date(), j=new Date(d.getFullYear(),0,1);
    const w=Math.ceil(((d-j)/86400000+j.getDay()+1)/7);
    return `${d.getFullYear()}_W${String(w).padStart(2,'0')}`;
  }
})();
