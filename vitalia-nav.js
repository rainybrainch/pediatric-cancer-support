(function(){
  "use strict";

  var labels = {
    home: "\u30db\u30fc\u30e0",
    exercise: "\u904b\u52d5",
    nutrition: "\u6804\u990a",
    adventure: "\u5192\u967a",
    settings: "\u8a2d\u5b9a"
  };

  var tabs = [
    { key:"home", href:"./game.html", label:labels.home },
    { key:"exercise", href:"./quest.html", label:labels.exercise },
    { key:"nutrition", href:"./nutrition.html", label:labels.nutrition },
    { key:"adventure", href:"./adventure.html", label:labels.adventure },
    { key:"settings", href:"./settings.html", label:labels.settings }
  ];

  function currentKey(){
    var path = location.pathname.split("/").pop() || "game.html";
    if(path === "quest.html") return "exercise";
    if(path === "nutrition.html") return "nutrition";
    if(path === "adventure.html" || path === "adventure-map.html") return "adventure";
    if(path === "settings.html") return "settings";
    return "home";
  }

  function pageName(){
    return (location.pathname.split("/").pop() || "game.html").replace(/\.html$/,"");
  }

  function addPageClass(){
    document.body.classList.add("vp-page-" + pageName());
  }

  function cleanupOldLinks(){
    document.querySelectorAll('a[href*="account.html"]').forEach(function(a){
      a.hidden = true;
      a.style.display = "none";
    });
    document.querySelectorAll('a[href*="party.html"]').forEach(function(a){
      a.hidden = true;
      a.style.display = "none";
    });
  }

  function isVisible(el){
    if(!el) return false;
    var cs = getComputedStyle(el);
    return cs.display !== "none" && cs.visibility !== "hidden" && !el.classList.contains("hidden");
  }

  function shouldHideOnLogin(){
    var path = location.pathname.split("/").pop() || "game.html";
    var login = document.getElementById("login-screen");
    var consent = document.getElementById("consent-modal");
    var main = document.getElementById("main-screen");
    if(path === "game.html") return !document.body.classList.contains("app-active");
    if(isVisible(consent) || isVisible(login)) return true;
    if(main && !isVisible(main)) return true;
    return false;
  }

  function syncVisibility(){
    var nav = document.getElementById("vitalia-common-nav");
    if(nav) nav.hidden = shouldHideOnLogin();
  }

  var visibilityTimer = 0;
  function requestSyncVisibility(){
    window.clearTimeout(visibilityTimer);
    visibilityTimer = window.setTimeout(syncVisibility, 80);
  }

  function install(){
    addPageClass();
    document.querySelectorAll(".bottom-nav").forEach(function(n){
      n.hidden = true;
      n.style.display = "none";
    });
    cleanupOldLinks();

    var old = document.getElementById("vitalia-common-nav");
    if(old) old.remove();

    var nav = document.createElement("nav");
    nav.id = "vitalia-common-nav";
    nav.setAttribute("aria-label","Vitalia navigation");

    var active = currentKey();
    tabs.forEach(function(tab){
      var a = document.createElement("a");
      a.className = "vcn-tab" + (tab.key === active ? " is-active" : "");
      a.dataset.tab = tab.key;
      a.href = tab.href;
      a.innerHTML = '<span class="vcn-mark" aria-hidden="true"></span><span class="vcn-label">'+tab.label+'</span>';
      nav.appendChild(a);
    });

    document.body.appendChild(nav);
    syncVisibility();

    var mo = new MutationObserver(requestSyncVisibility);
    mo.observe(document.body,{ attributes:true, attributeFilter:["class","style"], childList:true, subtree:true });
    [250, 900, 1800, 3200].forEach(function(ms){ setTimeout(syncVisibility, ms); });
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", install);
  }else{
    install();
  }
})();
