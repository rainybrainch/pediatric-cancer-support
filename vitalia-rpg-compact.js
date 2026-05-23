/* ============================================================
   Vitalia RPG — Compact Mode
   - quest.html / nutrition.html の長大な板状リストを
     横タブに集約して縦スクロールを大幅短縮
   ============================================================ */
(function(){
  'use strict';

  function init(){
    const page = detectPage();
    if(page === 'quest')     compactize('.quest-board, .food-board, #main-content, .main-content');
    if(page === 'nutrition') compactize('.food-board, .quest-board, .main-content');
  }

  function detectPage(){
    const path = location.pathname.split('/').pop() || '';
    if(/quest/.test(path)) return 'quest';
    if(/nutrition/.test(path)) return 'nutrition';
    return 'unknown';
  }

  function compactize(containerSels){
    // Find all .board-section in the page
    const sections = Array.from(document.querySelectorAll('.board-section'));
    if(sections.length < 3) return;

    // Group sections that share a parent — operate on the group with the most
    const groups = new Map();
    sections.forEach(s=>{
      const p = s.parentElement;
      if(!groups.has(p)) groups.set(p, []);
      groups.get(p).push(s);
    });
    let target = {parent:null, items:[]};
    groups.forEach((items, parent)=>{
      if(items.length > target.items.length) target = {parent, items};
    });
    if(!target.parent || target.items.length < 3) return;
    if(target.parent.dataset.vrpgTabbed) return;
    target.parent.dataset.vrpgTabbed = '1';

    // Build tab bar + content host
    const tabbar = document.createElement('div');
    tabbar.className = 'vrpg-cb-tabs';
    tabbar.setAttribute('role','tablist');

    target.items.forEach((s, idx)=>{
      const lbl  = s.querySelector('.section-label');
      const icon = s.querySelector('.section-icon');
      const note = s.querySelector('.section-note');
      const labelText = (lbl?.textContent || ('セクション ' + (idx+1))).trim();
      const iconHTML  = icon ? icon.innerHTML : '';
      const id = 'vrpg-tab-' + idx;
      s.dataset.vrpgTabId = id;
      const t = document.createElement('button');
      t.className = 'vrpg-cb-tab' + (idx===0?' is-active':'');
      t.type = 'button';
      t.setAttribute('role','tab');
      t.setAttribute('data-target', id);
      t.innerHTML = `<span class="vrpg-cb-tab-ic">${iconHTML}</span><span class="vrpg-cb-tab-lbl">${escapeHtml(labelText)}</span>`;
      tabbar.appendChild(t);
      if(idx !== 0) s.classList.add('vrpg-cb-hidden');
      // also remove the inline section-head since the tab bar shows it
      const head = s.querySelector('.section-head');
      if(head){
        // keep section-note as a top hint inside the panel
        const noteText = note?.textContent?.trim();
        if(noteText){
          const hint = document.createElement('div');
          hint.className = 'vrpg-cb-hint';
          hint.textContent = noteText;
          s.insertBefore(hint, head.nextSibling);
        }
        head.style.display = 'none';
      }
    });

    // Insert tab bar before first section
    target.parent.insertBefore(tabbar, target.items[0]);

    // Set sticky offset based on existing sticky header height
    const setStickyOffset = ()=>{
      const header = document.querySelector('.main-header, header[class*="header"], .adv-header');
      if(!header) return;
      const cs = getComputedStyle(header);
      if(cs.position === 'sticky' || cs.position === 'fixed'){
        document.documentElement.style.setProperty('--vrpg-stick-top', header.offsetHeight + 'px');
      }
    };
    setStickyOffset();
    window.addEventListener('resize', setStickyOffset);

    // Tab click handler
    tabbar.addEventListener('click', (e)=>{
      const t = e.target.closest('.vrpg-cb-tab');
      if(!t) return;
      const targetId = t.getAttribute('data-target');
      tabbar.querySelectorAll('.vrpg-cb-tab').forEach(x=>x.classList.toggle('is-active', x===t));
      target.items.forEach(s=>s.classList.toggle('vrpg-cb-hidden', s.dataset.vrpgTabId !== targetId));
      try{ sessionStorage.setItem('vrpg_cb_active', targetId); }catch(_){}
    });

    // Restore previous
    try{
      const saved = sessionStorage.getItem('vrpg_cb_active');
      if(saved){
        const t = tabbar.querySelector(`.vrpg-cb-tab[data-target="${saved}"]`);
        if(t) t.click();
      }
    }catch(_){}
  }

  function escapeHtml(s){
    return s.replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', ()=>{
      // run after page's own scripts populate boards
      setTimeout(init, 350);
    }, {once:true});
  } else {
    setTimeout(init, 350);
  }
})();
