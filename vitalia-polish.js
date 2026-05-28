(function(){
  "use strict";

  function pageName(){
    return (location.pathname.split("/").pop() || "game.html").replace(/\.html$/,"");
  }

  function addPageClass(){
    document.body.classList.add("vp-page-" + pageName());
  }

  function addForest(){
    if(document.getElementById("vitalia-forest-bg")) return;
    var video = document.createElement("video");
    video.id = "vitalia-forest-bg";
    video.src = "./image/\u80cc\u666f\u68ee.mp4";
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute("aria-hidden","true");
    video.addEventListener("canplay", function(){
      document.body.classList.add("vp-forest-ready");
    });
    document.body.prepend(video);
  }

  function simplifyQuestChrome(){
    document.querySelectorAll(".bottom-nav").forEach(function(n){ n.remove(); });
    document.querySelectorAll(".photo-cta,.sera-recipe-banner,.menu-board-section,.quick-note,.daily-note,.guide-note").forEach(function(el){
      el.hidden = true;
    });
  }

  function init(){
    addPageClass();
    if(["game","quest","nutrition","adventure"].includes(pageName())) addForest();
    simplifyQuestChrome();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  }else{
    init();
  }
})();
