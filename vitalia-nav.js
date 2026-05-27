(function(){
  const tabs = [
    {key:'home', href:'./game.html', icon:'🏠', label:'ホーム', match:['game.html','']},
    {key:'quest', href:'./quest.html', icon:'⚔', label:'運動', match:['quest.html']},
    {key:'nutrition', href:'./nutrition.html', icon:'🌿', label:'栄養', match:['nutrition.html']},
    {key:'adventure', href:'./adventure.html', icon:'🗺', label:'冒険', match:['adventure.html','adventure-map.html']},
    {key:'settings', href:'./settings.html', icon:'⚙', label:'設定', match:['settings.html','account.html','rulebook.html','support.html','privacy.html']}
  ];

  function currentFile(){
    const file = decodeURIComponent(location.pathname.split('/').pop() || '');
    return file || 'game.html';
  }

  function activeKey(){
    const file = currentFile();
    const tab = tabs.find(t => t.match.includes(file));
    return tab ? tab.key : '';
  }

  function shouldHideForLogin(){
    const login = document.getElementById('login-screen');
    const main = document.getElementById('main-screen');
    if(!login || !main) return false;
    const loginVisible = getComputedStyle(login).display !== 'none';
    const mainVisible = getComputedStyle(main).display !== 'none';
    return loginVisible && !mainVisible;
  }

  function buildNav(){
    document.querySelectorAll('.bottom-nav').forEach(nav => nav.remove());
    const nav = document.createElement('nav');
    nav.className = 'bottom-nav';
    nav.id = 'bottom-nav';
    nav.setAttribute('aria-label', '主要ナビゲーション');
    const active = activeKey();
    nav.innerHTML = tabs.map(t => `
      <a href="${t.href}" class="bn-tab${t.key===active ? ' active' : ''}" data-tab="${t.key}">
        <span class="bn-icon">${t.icon}</span>
        <span class="bn-label">${t.label}</span>
      </a>
    `).join('');
    document.body.appendChild(nav);
    syncVisibility();
  }

  function syncVisibility(){
    const nav = document.getElementById('bottom-nav');
    if(!nav) return;
    nav.style.display = shouldHideForLogin() ? 'none' : 'flex';
  }

  function init(){
    document.body.classList.add('vrpg-on');
    buildNav();
    const observer = new MutationObserver(syncVisibility);
    observer.observe(document.body, {subtree:true, attributes:true, attributeFilter:['style','class']});
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init, {once:true});
  }else{
    init();
  }
})();
