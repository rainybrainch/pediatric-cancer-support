/**
 * app-safety.js — 危機介入・同意管理・オフライン同期
 * 全ページから共通で読み込まれる安全モジュール
 */
(function(){
  'use strict';

  // ========== 危機キーワード（red flag）==========
  // 自傷・自殺念慮の表現を検出（過剰検知より見逃し防止優先）
  const CRISIS_KEYWORDS = [
    '死にたい','しにたい','消えたい','きえたい','自殺','じさつ',
    '殺したい','ころしたい','終わりにしたい','人生終わり',
    '生きていけない','生きる意味','楽になりたい',
    '自傷','リストカット','リスカ','薬を飲んで',
    '飛び降り','とびおり','首吊り','くびつり',
    'いなくなりたい','存在を消したい','希望がない',
  ];

  function detectCrisis(text){
    if(!text || typeof text !== 'string') return false;
    const t = text.toLowerCase().replace(/\s/g, '');
    return CRISIS_KEYWORDS.some(k => t.includes(k.toLowerCase()));
  }

  // ========== 危機モーダル ==========
  function showCrisisModal(opts){
    opts = opts || {};
    if(document.getElementById('crisis-modal')) return; // 二重表示防止
    const ctx = opts.context || '';
    const modal = document.createElement('div');
    modal.id = 'crisis-modal';
    modal.innerHTML = `
      <div class="crisis-backdrop"></div>
      <div class="crisis-dialog" role="dialog" aria-modal="true" aria-labelledby="crisis-title">
        <div class="crisis-icon">🌙</div>
        <h2 id="crisis-title">大丈夫？ひとりで抱えこまないで</h2>
        <p class="crisis-msg">
          ${ctx ? `「${escapeHtml(ctx)}」という言葉が見えました。<br><br>` : ''}
          つらい気持ちを感じているなら、専門の窓口で話を聞いてもらえます。<br>
          <strong>あなたの命は、あなたが思うよりずっと大切です。</strong>
        </p>
        <div class="crisis-actions">
          <a href="tel:0120279338" class="crisis-btn primary">
            <span class="crisis-btn-lbl">📞 よりそいホットライン</span>
            <span class="crisis-btn-tel">0120-279-338（24h・無料）</span>
          </a>
          <a href="./support.html" class="crisis-btn secondary">
            🛟 すべての相談先を見る
          </a>
        </div>
        <button class="crisis-close" id="crisis-close">いまは話せない（閉じる）</button>
        <p class="crisis-foot">主治医・家族・友人に話すだけでも、気持ちは少し軽くなります。</p>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('crisis-close').onclick = () => modal.remove();

    // ログ（個人を特定しない、検知のみ）
    try{
      const uid = localStorage.getItem('vitalia_uid_hint') || 'guest';
      const k = `vt_crisis_log_${uid}`;
      const arr = JSON.parse(localStorage.getItem(k) || '[]');
      arr.unshift({ ts: Date.now(), source: opts.source || 'unknown' });
      localStorage.setItem(k, JSON.stringify(arr.slice(0,50)));
    }catch(e){}
  }

  // ========== QOL連続低下トリガー ==========
  function checkQolPattern(uid){
    if(!uid || uid==='guest') return;
    // 直近3日連続でmood/conditionが1〜2なら危機モーダル
    let lowDays = 0;
    for(let i=0;i<3;i++){
      const d = new Date(Date.now()-i*86400000).toISOString().slice(0,10);
      try{
        const r = localStorage.getItem(`vt_qol_${uid}_${d}`);
        if(!r) return; // 連続性が途切れたら判定しない
        const v = JSON.parse(r);
        if((v.mood||5)<=2 || (v.condition||5)<=2) lowDays++;
      }catch(e){ return; }
    }
    if(lowDays >= 3){
      // 1週間に1回だけ表示
      const seenK = `vt_crisis_qol_seen_${uid}`;
      const last = parseInt(localStorage.getItem(seenK)||'0',10);
      if(Date.now()-last < 7*86400000) return;
      localStorage.setItem(seenK, String(Date.now()));
      showCrisisModal({source:'qol_pattern'});
    }
  }

  // ========== 同意管理 ==========
  // 同意バージョン（変更時に再同意を求める）
  const CONSENT_VERSION = '2026-05-04';
  function hasConsented(uid){
    if(!uid) return false;
    const v = localStorage.getItem(`vt_consent_${uid}`);
    return v === CONSENT_VERSION;
  }
  function setConsented(uid){
    if(!uid) return;
    localStorage.setItem(`vt_consent_${uid}`, CONSENT_VERSION);
    localStorage.setItem(`vt_consent_ts_${uid}`, String(Date.now()));
  }

  function showConsentModal(uid, onAccept, onDecline){
    if(document.getElementById('consent-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'consent-modal';
    modal.innerHTML = `
      <div class="consent-backdrop"></div>
      <div class="consent-dialog" role="dialog" aria-modal="true" aria-labelledby="consent-title">
        <div class="consent-head">
          <div class="consent-badge">研究参加のお願い</div>
          <h2 id="consent-title">ヴィタリア転生録について</h2>
          <p class="consent-sub">本アプリは小児がん経験者の健康行動継続を支援する <strong>修士論文研究</strong> です。</p>
        </div>
        <div class="consent-body">
          <div class="consent-section">
            <h3>📜 ご協力いただくこと</h3>
            <ul>
              <li>運動・食事・QOL記録の入力（1日2〜5分）</li>
              <li>AIコーチ「ルナ」との対話（任意）</li>
              <li>研究期間：12週間（その後も継続利用は自由）</li>
            </ul>
          </div>
          <div class="consent-section">
            <h3>🔬 データの取り扱い</h3>
            <ul>
              <li>記録は <strong>匿名化された統計</strong> として研究に使用されます</li>
              <li>個人を特定する形で公表されることはありません</li>
              <li>いつでも研究離脱・データ削除が可能です</li>
              <li>詳細は <a href="./privacy.html" target="_blank">プライバシーポリシー</a> をご確認ください</li>
            </ul>
          </div>
          <div class="consent-section">
            <h3>⚠ 重要な注意</h3>
            <ul>
              <li>本アプリは <strong>医療助言の代替ではありません</strong></li>
              <li>体調や治療に関する判断は、必ず主治医にご相談ください</li>
              <li>つらい時は <a href="./support.html" target="_blank">サポート窓口</a> をご利用ください</li>
              <li>18歳未満の方は、保護者の同意のもとご利用ください</li>
            </ul>
          </div>
          <label class="consent-check">
            <input type="checkbox" id="consent-read"> 上記の内容を読み、理解しました
          </label>
        </div>
        <div class="consent-actions">
          <button class="consent-btn-decline" id="consent-decline">同意しない（ゲスト利用へ）</button>
          <button class="consent-btn-accept" id="consent-accept" disabled>同意して開始する ✦</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const chk = document.getElementById('consent-read');
    const accept = document.getElementById('consent-accept');
    chk.addEventListener('change', () => {
      accept.disabled = !chk.checked;
      accept.style.opacity = chk.checked ? '1' : '.4';
    });
    accept.addEventListener('click', () => {
      setConsented(uid);
      modal.remove();
      if(onAccept) onAccept();
    });
    document.getElementById('consent-decline').addEventListener('click', () => {
      modal.remove();
      if(onDecline) onDecline();
    });
  }

  // ========== オフライン同期キュー ==========
  // 通信失敗時の保存・再送
  function queueRecord(collection, data){
    try{
      const q = JSON.parse(localStorage.getItem('vt_sync_queue')||'[]');
      q.push({ collection, data, ts: Date.now() });
      localStorage.setItem('vt_sync_queue', JSON.stringify(q.slice(-200)));
    }catch(e){}
  }
  async function flushQueue(addDocFn){
    if(!navigator.onLine) return 0;
    let q;
    try{ q = JSON.parse(localStorage.getItem('vt_sync_queue')||'[]'); }catch(e){ return 0; }
    if(q.length === 0) return 0;
    let success = 0;
    const remain = [];
    for(const item of q){
      try{
        await addDocFn(item.collection, item.data);
        success++;
      }catch(e){
        remain.push(item);
      }
    }
    localStorage.setItem('vt_sync_queue', JSON.stringify(remain));
    return success;
  }
  function getQueueSize(){
    try{ return JSON.parse(localStorage.getItem('vt_sync_queue')||'[]').length; }catch(e){ return 0; }
  }

  // ========== オンライン状態インジケータ ==========
  function showOfflineIndicator(){
    if(document.getElementById('offline-indicator')) return;
    const div = document.createElement('div');
    div.id = 'offline-indicator';
    div.textContent = '📡 オフライン — 記録は同期待ちで保存されます';
    document.body.appendChild(div);
  }
  function hideOfflineIndicator(){
    const el = document.getElementById('offline-indicator');
    if(el) el.remove();
  }

  // ========== ヘルパー ==========
  function escapeHtml(s){
    return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // ========== アクセシビリティ補助 ==========
  // ESCキーでモーダルを閉じる
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape'){
      const crisis = document.getElementById('crisis-modal');
      if(crisis){ document.getElementById('crisis-close')?.click(); return; }
      // 他のモーダル：data-esc-close 属性を持つものは閉じる
      document.querySelectorAll('[data-esc-close="1"]').forEach(el=>{
        if(el.style.display !== 'none') el.style.display='none';
      });
    }
  });

  // フォーカストラップ（簡易版：modal内をTabでループ）
  function trapFocus(modal){
    if(!modal) return;
    const focusables = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if(focusables.length === 0) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    modal.addEventListener('keydown', (e)=>{
      if(e.key !== 'Tab') return;
      if(e.shiftKey){
        if(document.activeElement === first){ e.preventDefault(); last.focus(); }
      } else {
        if(document.activeElement === last){ e.preventDefault(); first.focus(); }
      }
    });
    setTimeout(()=>first.focus(), 50);
  }
  // 危機モーダルが描画されたら自動でフォーカストラップ
  const _focusObserver = new MutationObserver((muts)=>{
    for(const m of muts){
      m.addedNodes.forEach(n=>{
        if(n.nodeType===1 && (n.id==='crisis-modal'||n.id==='consent-modal')){
          setTimeout(()=>trapFocus(n), 100);
        }
      });
    }
  });
  _focusObserver.observe(document.body, { childList: true });

  // スキップリンク注入（最初の <main> へジャンプ）
  if(!document.getElementById('skip-link')){
    const skip = document.createElement('a');
    skip.id = 'skip-link';
    skip.href = '#main';
    skip.textContent = 'メインコンテンツへスキップ';
    skip.style.cssText = `position:absolute;left:-9999px;top:0;z-index:9500;background:#f0d48a;color:#1a1200;padding:8px 14px;font-weight:700;border-radius:0 0 8px 0;text-decoration:none;`;
    skip.addEventListener('focus', ()=>{ skip.style.left='0'; });
    skip.addEventListener('blur', ()=>{ skip.style.left='-9999px'; });
    document.addEventListener('DOMContentLoaded', ()=>{
      document.body.insertBefore(skip, document.body.firstChild);
      // メインコンテンツに id 付与（無ければ）
      const main = document.querySelector('main, #main-screen, .page');
      if(main && !main.id) main.id = 'main';
    });
  }

  // 動きを軽減する設定の自動適用（OSの prefers-reduced-motion を尊重）
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    if(!localStorage.getItem('vt_reduced_motion')){
      localStorage.setItem('vt_reduced_motion', '1');
    }
  }
  if(localStorage.getItem('vt_reduced_motion')==='1'){
    const rm = document.createElement('style');
    rm.textContent = `*,*::before,*::after{animation-duration:.01s !important;animation-iteration-count:1 !important;transition-duration:.01s !important;}`;
    document.head.appendChild(rm);
  }
  if(localStorage.getItem('vt_large_text')==='1'){
    document.documentElement.style.fontSize = '110%';
  }

  // ========== スタイル注入 ==========
  const styles = document.createElement('style');
  styles.textContent = `
    /* 危機モーダル */
    #crisis-modal{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;padding:18px;}
    .crisis-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.85);backdrop-filter:blur(8px);}
    .crisis-dialog{
      position:relative;background:linear-gradient(160deg,#1a1230,#0d0a20);
      border:2px solid rgba(156,114,224,.55);border-radius:20px;max-width:440px;width:100%;
      padding:26px 22px;text-align:center;
      box-shadow:0 24px 64px rgba(0,0,0,.7),0 0 60px rgba(156,114,224,.15);
      animation:crisisIn .4s cubic-bezier(.22,1,.36,1) both;
    }
    @keyframes crisisIn{0%{opacity:0;transform:scale(.92);}100%{opacity:1;transform:scale(1);}}
    .crisis-icon{font-size:2.5rem;line-height:1;margin-bottom:10px;animation:crisisFloat 3s ease-in-out infinite;}
    @keyframes crisisFloat{0%,100%{transform:translateY(0);}50%{transform:translateY(-4px);}}
    .crisis-dialog h2{font-family:'Noto Serif JP',serif;font-size:1.05rem;font-weight:900;color:#e8d4ff;margin-bottom:10px;line-height:1.4;}
    .crisis-msg{font-size:.78rem;line-height:1.85;color:rgba(220,225,245,.9);margin-bottom:18px;}
    .crisis-msg strong{color:#fff;}
    .crisis-actions{display:flex;flex-direction:column;gap:8px;margin-bottom:14px;}
    .crisis-btn{
      display:block;text-decoration:none;border-radius:12px;padding:12px 14px;
      font-family:inherit;font-weight:700;cursor:pointer;border:none;font-size:.85rem;
    }
    .crisis-btn.primary{
      background:linear-gradient(135deg,rgba(78,201,138,.4),rgba(78,201,138,.22));
      border:1.5px solid rgba(78,201,138,.6);color:#a8e8c0;
    }
    .crisis-btn.secondary{
      background:rgba(156,114,224,.12);border:1px solid rgba(156,114,224,.4);color:#c0a0f0;
    }
    .crisis-btn-lbl{display:block;font-size:.85rem;font-weight:900;}
    .crisis-btn-tel{display:block;font-size:.7rem;opacity:.85;margin-top:2px;}
    .crisis-close{
      background:none;border:none;color:rgba(170,188,216,.55);font-size:.72rem;
      cursor:pointer;margin-bottom:8px;font-family:inherit;
    }
    .crisis-foot{font-size:.66rem;color:rgba(170,188,216,.45);line-height:1.6;}

    /* 同意モーダル */
    #consent-modal{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;padding:18px;}
    .consent-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.85);backdrop-filter:blur(8px);}
    .consent-dialog{
      position:relative;background:linear-gradient(160deg,#0d1225,#101830);
      border:2px solid rgba(201,168,76,.4);border-radius:20px;max-width:480px;width:100%;
      max-height:90vh;display:flex;flex-direction:column;
      box-shadow:0 24px 64px rgba(0,0,0,.7);
      animation:crisisIn .4s cubic-bezier(.22,1,.36,1) both;
    }
    .consent-head{padding:22px 22px 14px;text-align:center;border-bottom:1px solid rgba(201,168,76,.15);}
    .consent-badge{
      display:inline-block;background:rgba(201,168,76,.15);border:1px solid rgba(201,168,76,.4);
      color:#f0d48a;font-size:.6rem;font-weight:700;letter-spacing:.16em;padding:3px 12px;border-radius:99px;margin-bottom:8px;
    }
    .consent-dialog h2{font-family:'Noto Serif JP',serif;font-size:1.15rem;font-weight:900;color:#f0d48a;margin-bottom:6px;}
    .consent-sub{font-size:.74rem;color:rgba(220,225,245,.75);line-height:1.65;}
    .consent-sub strong{color:#f0d48a;}
    .consent-body{padding:18px 22px;overflow-y:auto;flex:1;}
    .consent-section{margin-bottom:14px;}
    .consent-section h3{font-family:'Noto Serif JP',serif;font-size:.85rem;font-weight:900;color:#e8d4ff;margin-bottom:6px;}
    .consent-section ul{padding-left:20px;font-size:.74rem;line-height:1.85;color:rgba(220,225,245,.85);}
    .consent-section li{margin-bottom:3px;}
    .consent-section strong{color:#f0d48a;}
    .consent-section a{color:#a8c8f0;text-decoration:underline;}
    .consent-check{
      display:flex;align-items:center;gap:9px;font-size:.8rem;color:#e8e4d4;font-weight:700;
      background:rgba(78,201,138,.06);border:1px solid rgba(78,201,138,.28);border-radius:10px;
      padding:11px 14px;cursor:pointer;margin-top:14px;
    }
    .consent-check input{width:18px;height:18px;accent-color:#4ec98a;cursor:pointer;}
    .consent-actions{display:flex;gap:8px;padding:16px 22px;border-top:1px solid rgba(201,168,76,.12);}
    .consent-btn-decline,.consent-btn-accept{
      flex:1;border-radius:11px;padding:11px;font-family:'Noto Serif JP',serif;
      font-weight:900;cursor:pointer;font-size:.82rem;
    }
    .consent-btn-decline{background:none;border:1px solid rgba(170,188,216,.25);color:rgba(170,188,216,.7);}
    .consent-btn-accept{background:linear-gradient(135deg,#c9a84c,#f0d48a);border:none;color:#1a1200;opacity:.4;transition:opacity .2s;}
    .consent-btn-accept:not(:disabled){opacity:1;}
    .consent-btn-accept:disabled{cursor:not-allowed;}
    @media(max-width:480px){
      .consent-dialog{max-height:94vh;}
      .consent-head{padding:18px 16px 12px;}
      .consent-body{padding:14px 16px;}
      .consent-actions{padding:12px 16px;flex-direction:column;}
      .consent-dialog h2{font-size:1rem;}
    }

    /* オフラインインジケータ */
    #offline-indicator{
      position:fixed;top:0;left:0;right:0;z-index:8000;
      background:rgba(224,160,80,.95);color:#1a1200;
      padding:6px 12px;font-size:.72rem;font-weight:700;text-align:center;
      animation:offSlide .3s ease both;
    }
    @keyframes offSlide{0%{transform:translateY(-100%);}100%{transform:translateY(0);}}
  `;
  document.head.appendChild(styles);

  // ========== オンライン/オフラインリスナー ==========
  window.addEventListener('online', () => {
    hideOfflineIndicator();
    if(window.AppSafety && typeof window.AppSafety._onOnline === 'function'){
      window.AppSafety._onOnline();
    }
    // Background Sync 登録
    requestBackgroundSync();
  });
  window.addEventListener('offline', showOfflineIndicator);
  if(!navigator.onLine) showOfflineIndicator();

  // ========== Service Worker 登録 + Background Sync ==========
  function requestBackgroundSync(){
    if(!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;
    if(!('SyncManager' in window)) return;
    navigator.serviceWorker.ready.then(reg => {
      try{ reg.sync.register('flush-queue').catch(()=>{}); }catch(e){}
    });
  }
  if('serviceWorker' in navigator){
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(()=>{});
      // SWからのメッセージ：FLUSH_QUEUE
      navigator.serviceWorker.addEventListener('message', (e) => {
        if(e.data?.type === 'FLUSH_QUEUE' && window.AppSafety._onOnline){
          window.AppSafety._onOnline();
        }
      });
    });
  }

  // ========== クラッシュレポート（window.onerror & unhandledrejection） ==========
  function logError(detail){
    try{
      const uid = localStorage.getItem('vitalia_uid_hint') || 'guest';
      const k = `vt_error_log_${uid}`;
      const arr = JSON.parse(localStorage.getItem(k) || '[]');
      arr.unshift({
        ts: Date.now(),
        url: location.pathname,
        ua: navigator.userAgent.slice(0,200),
        ...detail
      });
      localStorage.setItem(k, JSON.stringify(arr.slice(0,30)));
    }catch(e){}
  }
  window.addEventListener('error', (e) => {
    logError({
      type: 'error',
      message: String(e.message||'').slice(0,500),
      filename: e.filename || '',
      line: e.lineno || 0,
      col: e.colno || 0,
      stack: String(e.error?.stack||'').slice(0,1500),
    });
  });
  window.addEventListener('unhandledrejection', (e) => {
    logError({
      type: 'rejection',
      message: String(e.reason?.message || e.reason || '').slice(0,500),
      stack: String(e.reason?.stack||'').slice(0,1500),
    });
  });

  // ========== エンゲージメント計測（process evaluation） ==========
  // 各ページの滞在時間・アクション数を localStorage に記録、定期的にFirestoreにフラッシュ
  const _pageEnter = Date.now();
  const _page = location.pathname.split('/').pop() || 'index';
  let _pageActions = 0;
  // クリック・キー入力をカウント
  ['click','keydown'].forEach(ev=>{
    document.addEventListener(ev, ()=>{ _pageActions++; }, { passive: true, capture: true });
  });

  function logPageEngagement(){
    try{
      const uid = localStorage.getItem('vitalia_uid_hint') || 'guest';
      if(uid === 'guest') return;
      const dwell = Math.round((Date.now() - _pageEnter) / 1000); // 秒
      if(dwell < 2) return; // 即離脱は記録しない
      const k = `vt_engage_log_${uid}`;
      const arr = JSON.parse(localStorage.getItem(k) || '[]');
      arr.unshift({
        page: _page,
        dwellSec: dwell,
        actions: _pageActions,
        ts: Date.now(),
      });
      localStorage.setItem(k, JSON.stringify(arr.slice(0,200)));
    }catch(e){}
  }
  // ページ離脱時に記録
  window.addEventListener('beforeunload', logPageEngagement);
  document.addEventListener('visibilitychange', ()=>{
    if(document.visibilityState === 'hidden') logPageEngagement();
  });

  // ========== A/B ランダム化フレームワーク ==========
  // 研究用：ユーザーを安定的に実験群に割り当て（uidハッシュベース）
  // 各実験のキー： vt_exp_<expId> = 'A' | 'B' | 'C'
  function hashCode(s){
    let h=0; for(let i=0;i<s.length;i++){ h=((h<<5)-h)+s.charCodeAt(i); h|=0; }
    return Math.abs(h);
  }
  function getExperimentArm(expId, arms){
    arms = arms || ['A','B'];
    const uid = localStorage.getItem('vitalia_uid_hint') || 'anon';
    const k = `vt_exp_${expId}`;
    let arm = localStorage.getItem(k);
    if(arm && arms.includes(arm)) return arm;
    // ハッシュで決定論的に割り当て（再起動しても同じ）
    const idx = hashCode(`${uid}_${expId}`) % arms.length;
    arm = arms[idx];
    localStorage.setItem(k, arm);
    // 割り当てログ
    try{
      const log = JSON.parse(localStorage.getItem('vt_exp_log')||'[]');
      log.push({ expId, arm, uid, ts: Date.now() });
      localStorage.setItem('vt_exp_log', JSON.stringify(log.slice(-50)));
    }catch(e){}
    return arm;
  }
  function getAllAssignments(){
    const out = {};
    for(let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      if(k && k.startsWith('vt_exp_') && k !== 'vt_exp_log'){
        out[k.slice(7)] = localStorage.getItem(k);
      }
    }
    return out;
  }

  // ========== 匿名化研究ID ==========
  // uid（Firebase UID）→ 6文字の研究コード（再現性あり）
  function getResearchId(){
    const uid = localStorage.getItem('vitalia_uid_hint') || '';
    if(!uid) return 'ANON00';
    let stored = localStorage.getItem(`vt_research_id_${uid}`);
    if(stored) return stored;
    // uid のハッシュから R + 5英数字を生成
    const h = hashCode(uid).toString(36).toUpperCase().padStart(5,'0').slice(0,5);
    stored = 'R' + h;
    localStorage.setItem(`vt_research_id_${uid}`, stored);
    return stored;
  }

  // ========== ドロップアウトリスク予測 ==========
  // 直近7日の活動量とトレンドから、離脱リスクを 0-100 で算出
  function calcDropoutRisk(){
    const uid = localStorage.getItem('vitalia_uid_hint') || '';
    if(!uid || uid==='guest') return 0;
    let recordDays = 0, qolDays = 0;
    for(let i=0;i<7;i++){
      const d = new Date(Date.now()-i*86400000).toISOString().slice(0,10);
      try{
        const s = JSON.parse(localStorage.getItem(`qe_daily_count_${uid}_${d}`)||'{}');
        if(s.exMinToday || s.vegToday || s.proToday) recordDays++;
      }catch(e){}
      if(localStorage.getItem(`vt_qol_${uid}_${d}`)) qolDays++;
    }
    // 活動量 × トレンド × 連続記録 で重み付け
    const inactivityScore = Math.max(0, 7 - recordDays) / 7 * 50;
    const qolGapScore = Math.max(0, 5 - qolDays) / 5 * 30;
    // 最終ログイン
    const lastLogin = localStorage.getItem(`vt_last_login_${uid}`)||'';
    let gapScore = 0;
    if(lastLogin){
      const gap = Math.floor((Date.now() - new Date(lastLogin).getTime())/86400000);
      gapScore = Math.min(20, gap * 5);
    }
    return Math.min(100, Math.round(inactivityScore + qolGapScore + gapScore));
  }

  // ========== 臨床安全性チェック ==========
  // ベースラインの治療歴・服薬から、運動・食事の禁忌・注意を抽出
  function getClinicalProfile(){
    const uid = localStorage.getItem('vitalia_uid_hint') || '';
    if(!uid) return null;
    try{
      const bl = JSON.parse(localStorage.getItem(`vt_baseline_${uid}`)||'null');
      if(!bl || !bl.step1) return null;
      return {
        chemoClass: bl.step1.chemoClass || [],
        tx: bl.step1.tx || [],
        meds: bl.step1.meds || [],
        hist: bl.step1.hist || [],
        stage: bl.step1.stage || null,
      };
    }catch(e){ return null; }
  }
  // 高強度運動が懸念される条件
  function hasCardioRiskFromTx(profile){
    if(!profile) return false;
    return profile.chemoClass.includes('anthracycline')
        || profile.tx.includes('radio')   // 胸部放射線も心リスク
        || profile.hist.includes('cardiac');
  }
  // 食事相互作用
  function getFoodInteractionWarnings(profile, foodName){
    if(!profile || !foodName) return [];
    const warnings = [];
    // ワルファリン × 納豆・ビタミンK食品
    if(profile.meds.includes('warfarin')){
      if(/納豆|青汁|ほうれん草|小松菜|ブロッコリー/.test(foodName)){
        warnings.push({level:'warn', text:'ワルファリン服用中：ビタミンK含有食品の量を急に変えると効果が変動します。主治医に相談を。'});
      }
    }
    // 免疫抑制剤 × 生もの・グレープフルーツ
    if(profile.meds.includes('immunosup')){
      if(/グレープフルーツ/.test(foodName)){
        warnings.push({level:'warn', text:'免疫抑制剤との相互作用：グレープフルーツは血中濃度を変動させます。'});
      }
      if(/刺身|生|寿司/.test(foodName)){
        warnings.push({level:'caution', text:'免疫抑制剤服用中：生ものは感染リスク。新鮮なものを選び、加熱推奨。'});
      }
    }
    // 脾摘 × 生もの
    if(profile.hist.includes('splenectomy')){
      if(/刺身|生|寿司|生卵/.test(foodName)){
        warnings.push({level:'caution', text:'脾臓摘出後：生もの・生卵は感染リスクが上がります。'});
      }
    }
    return warnings;
  }
  // 運動強度の警告
  function getExerciseWarnings(profile, mets){
    if(!profile) return [];
    const warnings = [];
    if(mets >= 7 && hasCardioRiskFromTx(profile)){
      warnings.push({
        level:'warn',
        text:'⚠ アントラサイクリン系/胸部放射線/心機能歴あり：高強度運動（7METs以上）は<strong>主治医に相談</strong>してから。中強度（3〜6METs）から始めるのが安全です。'
      });
    }
    if(mets >= 5 && profile.tx.includes('bmt')){
      warnings.push({
        level:'caution',
        text:'造血幹細胞移植後：徐々に強度を上げ、息切れ・動悸が強い時は休止を。'
      });
    }
    return warnings;
  }

  // 行動変容ステージに応じたメッセージ
  function getStageMessage(profile){
    if(!profile?.stage) return null;
    const messages = {
      precontemplation: { tone:'gentle', text:'まずは <strong>「読むだけ」</strong> でOK。記録もスキップして大丈夫です。' },
      contemplation:    { tone:'gentle', text:'考え始めたあなたへ。<strong>1日1分</strong>から、無理なく試してみませんか？' },
      preparation:      { tone:'celebrate', text:'準備中ですね。<strong>明日から始める</strong>具体的な日時を決めてみよう。' },
      action:           { tone:'celebrate', text:'すでに行動しているあなた。<strong>続けるコツ</strong>を一緒に見つけよう。' },
      maintenance:      { tone:'celebrate', text:'維持期、本当にすごい。<strong>停滞しても大丈夫</strong>、それも継続の一部です。' },
    };
    return messages[profile.stage] || null;
  }

  // ========== モーダル重複防止 ==========
  // 同時表示中のモーダル数をカウントし、優先度の低いものは見送る
  function isAnyModalOpen(){
    const ids = ['crisis-modal','consent-modal','qol-modal','login-bonus-modal','weekly-modal','tutorial-modal','coach-modal','reflection-modal','char-backstory-modal','vision-modal','return-modal','story-modal'];
    return ids.some(id=>{
      const el = document.getElementById(id);
      return el && (getComputedStyle(el).display !== 'none') && el.offsetParent !== null;
    });
  }

  // ========== 自動ログアウト（30分の非アクティブで） ==========
  let _idleTimer = null;
  const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30分
  function resetIdleTimer(){
    if(_idleTimer) clearTimeout(_idleTimer);
    _idleTimer = setTimeout(()=>{
      // 設定でオフにできる
      if(localStorage.getItem('vt_no_auto_logout') === '1') return;
      const uid = localStorage.getItem('vitalia_uid_hint');
      if(!uid || uid === 'guest') return;
      if(confirm('30分間操作がありませんでした。セキュリティのためログアウトしますか？')){
        location.href = './game.html?logout=1';
      } else {
        resetIdleTimer();
      }
    }, IDLE_TIMEOUT_MS);
  }
  ['mousemove','touchstart','keydown','click'].forEach(ev=>{
    document.addEventListener(ev, resetIdleTimer, { passive:true, capture:true });
  });
  resetIdleTimer();

  // ========== タイムゾーン情報を全レコードに付与 ==========
  function getTimezoneInfo(){
    return {
      iso: new Date().toISOString(),
      local: new Date().toString(),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
      tzOffset: new Date().getTimezoneOffset(),
    };
  }

  // ========== 公開API ==========
  window.AppSafety = {
    detectCrisis,
    showCrisisModal,
    checkQolPattern,
    hasConsented,
    setConsented,
    showConsentModal,
    queueRecord,
    flushQueue,
    getQueueSize,
    requestBackgroundSync,
    logError,
    getExperimentArm,
    getAllAssignments,
    getResearchId,
    calcDropoutRisk,
    isAnyModalOpen,
    resetIdleTimer,
    getTimezoneInfo,
    getClinicalProfile,
    hasCardioRiskFromTx,
    getFoodInteractionWarnings,
    getExerciseWarnings,
    getStageMessage,
    consentVersion: CONSENT_VERSION,
    _onOnline: null, // 各ページで設定可能
  };
})();
