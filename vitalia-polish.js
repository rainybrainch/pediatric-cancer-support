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

  function addNutritionHero(){
    if(pageName() !== "nutrition") return;
    var board = document.querySelector(".food-board");
    if(!board || board.querySelector(".quest-hero")) return;

    var hero = document.createElement("div");
    hero.className = "quest-hero clean-nutrition-hero";
    hero.innerHTML = [
      '<div class="qh-char">',
        '<img src="./image/sera-sabun%20(1).png" alt="セラ">',
      '</div>',
      '<div class="qh-info">',
        '<div class="qh-role">Nutrition Quest — 栄養クエスト</div>',
        '<div class="qh-name">セラ — 栄養の巫女</div>',
        '<div class="qh-bar-row">',
          '<span class="qh-bar-lbl">今週</span>',
          '<div class="qh-bar"><div class="qh-bar-fill" id="clean-nutrition-fill" style="width:0%"></div></div>',
          '<span class="qh-bar-val"><span id="clean-nutrition-now">0</span>pt</span>',
        '</div>',
        '<div class="qh-week-lbl" id="clean-nutrition-lbl">食事記録を入力して、栄養バランスを整えよう</div>',
      '</div>',
      '<div class="qh-stats">',
        '<div class="qh-stat">',
          '<div class="qh-stat-num" id="clean-nutrition-streak">0</div>',
          '<div class="qh-stat-lbl">連続週</div>',
        '</div>',
        '<div class="qh-stat-div"></div>',
        '<div class="qh-stat">',
          '<div class="qh-stat-num" id="clean-nutrition-xp">0</div>',
          '<div class="qh-stat-lbl">今日XP</div>',
        '</div>',
      '</div>'
    ].join("");

    board.insertBefore(hero, board.firstElementChild);
  }

  function init(){
    addPageClass();
    if(["game","adventure"].includes(pageName())) addForest();
    simplifyQuestChrome();
    addNutritionHero();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  }else{
    init();
  }
})();
