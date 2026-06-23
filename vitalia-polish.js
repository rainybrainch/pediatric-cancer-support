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

  function normalizePageCopy(){
    var page = pageName();
    var titles = {
      game: "\u30f4\u30a3\u30bf\u30ea\u30a2\u8ee2\u751f\u9332",
      quest: "\u5065\u5eb7\u30af\u30a8\u30b9\u30c8",
      nutrition: "\u6804\u990a\u30af\u30a8\u30b9\u30c8",
      adventure: "\u5192\u967a\u306e\u66f8",
      settings: "\u8a2d\u5b9a"
    };

    document.querySelectorAll(".h-left > a, .g-logo .gold-text, header > a").forEach(function(el){
      if(!el) return;
      var href = el.getAttribute("href") || "";
      if(/game\.html|index\.html/.test(href) || /Vitalia|TENSEI|ヴィタリア|繝/.test(el.textContent || "")){
        el.textContent = titles.game;
      }
    });

    document.querySelectorAll(".h-title,.adv-title").forEach(function(el){
      if(titles[page]) el.textContent = titles[page];
    });

    document.querySelectorAll('a[href*="account.html"]').forEach(function(a){
      a.hidden = true;
      a.style.display = "none";
    });
    document.querySelectorAll('a[href*="settings.html"]').forEach(function(a){
      if(a.classList.contains("h-nav-btn") || a.classList.contains("g-btn") || a.classList.contains("back-btn")){
        a.textContent = titles.settings;
      }
    });
    document.querySelectorAll("#logout-btn").forEach(function(btn){ btn.textContent = "\u9000\u5834"; });
    document.querySelectorAll(".adv-back").forEach(function(a){ a.textContent = "\u2190 \u30db\u30fc\u30e0"; });
  }

  function simplifyQuestChrome(){
    document.querySelectorAll(".bottom-nav").forEach(function(n){
      n.hidden = true;
      n.style.display = "none";
    });
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
        '<img src="./image/sera-sabun%20(1).png" alt="\u30bb\u30e9">',
      '</div>',
      '<div class="qh-info">',
        '<div class="qh-role">Nutrition Quest · \u6804\u990a\u30af\u30a8\u30b9\u30c8</div>',
        '<div class="qh-name">\u30bb\u30e9 — \u98df\u4e8b\u30b5\u30dd\u30fc\u30c8</div>',
        '<div class="qh-bar-row">',
          '<span class="qh-bar-lbl">\u4eca\u9031</span>',
          '<div class="qh-bar"><div class="qh-bar-fill" id="clean-nutrition-fill" style="width:0%"></div></div>',
          '<span class="qh-bar-val"><span id="clean-nutrition-now">0</span>pt</span>',
        '</div>',
        '<div class="qh-week-lbl" id="clean-nutrition-lbl">\u98df\u4e8b\u8a18\u9332\u3092\u5165\u529b\u3057\u3066\u3001\u91ce\u83dc\u30fb\u9b5a\u30fb\u305f\u3093\u3071\u304f\u306e\u30d0\u30e9\u30f3\u30b9\u3092\u6574\u3048\u307e\u3057\u3087\u3046\u3002</div>',
      '</div>',
      '<div class="qh-stats">',
        '<div class="qh-stat">',
          '<div class="qh-stat-num" id="clean-nutrition-streak">0</div>',
          '<div class="qh-stat-lbl">\u9023\u7d9a\u9031</div>',
        '</div>',
        '<div class="qh-stat-div"></div>',
        '<div class="qh-stat">',
          '<div class="qh-stat-num" id="clean-nutrition-xp">0</div>',
          '<div class="qh-stat-lbl">\u4eca\u65e5XP</div>',
        '</div>',
      '</div>'
    ].join("");

    board.insertBefore(hero, board.firstElementChild);
  }

  function init(){
    addPageClass();
    if(["game","quest","nutrition","adventure","settings"].includes(pageName())) addForest();
    normalizePageCopy();
    simplifyQuestChrome();
    addNutritionHero();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  }else{
    init();
  }
})();
