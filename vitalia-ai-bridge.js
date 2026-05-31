(function(){
  "use strict";

  var DIFY_URL = "https://udify.app/chat/KXoLEteQQnrlbz1P";
  var selectors = [
    "#coach-tile",
    "#sh-rec-luna",
    "#ch-card-luna",
    "[data-open-luna-ai]"
  ];
  // #hc-luna-card は onclick 属性で直接 openCoach() を呼ぶため除外

  function txt(s){
    return s;
  }

  function makeOverlay(){
    var old = document.getElementById("vitalia-ai-overlay");
    if(old) return old;

    var overlay = document.createElement("div");
    overlay.id = "vitalia-ai-overlay";
    overlay.setAttribute("aria-hidden","true");
    overlay.innerHTML =
      '<div class="vai-panel" role="dialog" aria-modal="true" aria-label="'+txt("\u30eb\u30ca\u306eAI\u30b3\u30fc\u30c1\u30f3\u30b0")+'">'+
        '<div class="vai-header">'+
          '<button type="button" class="vai-close" aria-label="'+txt("\u9589\u3058\u308b")+'">'+txt("\u2190 \u623b\u308b")+'</button>'+
          '<div class="vai-title">'+txt("\u2726 \u30eb\u30ca\u306eAI\u30b3\u30fc\u30c1\u30f3\u30b0")+'</div>'+
          '<a class="vai-open" href="'+DIFY_URL+'" target="_blank" rel="noopener">'+txt("\u5225\u753b\u9762")+'</a>'+
        '</div>'+
        '<iframe class="vai-frame" title="'+txt("\u30eb\u30caAI\u30c1\u30e3\u30c3\u30c8")+'" src="about:blank" allow="microphone"></iframe>'+
      '</div>';
    document.body.appendChild(overlay);

    overlay.querySelector(".vai-close").addEventListener("click", closeAI);
    overlay.addEventListener("click", function(e){
      if(e.target === overlay) closeAI();
    });
    document.addEventListener("keydown", function(e){
      if(e.key === "Escape") closeAI();
    });

    return overlay;
  }

  function openAI(e){
    if(e){
      e.preventDefault();
      e.stopPropagation();
      if(e.stopImmediatePropagation) e.stopImmediatePropagation();
    }
    if(typeof window.VitaliaLunaOpen === "function"){
      window.VitaliaLunaOpen();
      return;
    }
    if(typeof window.openCoach === "function"){
      window.openCoach();
      return;
    }
    var overlay = makeOverlay();
    var frame = overlay.querySelector(".vai-frame");
    if(frame && frame.src !== DIFY_URL) frame.src = DIFY_URL;
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden","false");
    document.body.classList.add("vitalia-ai-open");
  }

  function closeAI(){
    var overlay = document.getElementById("vitalia-ai-overlay");
    if(!overlay) return;
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden","true");
    document.body.classList.remove("vitalia-ai-open");
  }

  function bind(){
    selectors.forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el){
        if(el.dataset.vitaliaAiBound === "1") return;
        el.dataset.vitaliaAiBound = "1";
        el.addEventListener("click", openAI, true);
      });
    });
  }

  function init(){
    bind();
    var mo = new MutationObserver(bind);
    mo.observe(document.body,{ childList:true, subtree:true });
    window.VitaliaAI = { open:openAI, openDify:function(){
      var nativeOpen = window.VitaliaLunaOpen;
      window.VitaliaLunaOpen = null;
      openAI();
      window.VitaliaLunaOpen = nativeOpen;
    }, close:closeAI, url:DIFY_URL };
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  }else{
    init();
  }
})();
