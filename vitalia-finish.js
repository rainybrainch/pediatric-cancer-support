(function(){
  "use strict";

  var tabIcons = {
    home:"\u2302",
    exercise:"\u2694",
    nutrition:"\u2726",
    adventure:"\u25c6",
    settings:"\u2699"
  };

  var copy = {
    user:"\u3042\u306a\u305f",
    luna:"\u30eb\u30ca",
    welcome:"\u3088\u3046\u3053\u305d\u3001\u30f4\u30a3\u30bf\u30ea\u30a2\u3078\u3002\u79c1\u306f\u30eb\u30ca\u3001\u3042\u306a\u305f\u306e\u5065\u5eb7\u7fd2\u6163\u3092\u4e00\u7dd2\u306b\u6574\u7406\u3059\u308bAI\u30b3\u30fc\u30c1\u3067\u3059\u3002\n\n\u4eca\u9031\u3001\u3069\u3093\u306a\u5065\u5eb7\u7fd2\u6163\u3092\u7121\u7406\u306a\u304f\u7d9a\u3051\u305f\u3044\u3067\u3059\u304b\uff1f",
    coachTitle:"\u2726 \u30eb\u30ca\u306e\u30b3\u30fc\u30c1\u30f3\u30b0",
    coachName:"\u30eb\u30ca - \u8ee2\u751f\u306e\u5973\u795e",
    coachSub:"GROW\u30e2\u30c7\u30eb AI\u30b3\u30fc\u30c1 / Gemini\u9023\u643a",
    close:"\u2190 \u30db\u30fc\u30e0",
    reset:"\u21bb",
    input:"\u30eb\u30ca\u306b\u76f8\u8ac7\u3059\u308b...",
    disclaimer:"\u30eb\u30ca\u306fGROW\u30e2\u30c7\u30eb\u3067\u8003\u3048\u3092\u6574\u7406\u3059\u308bAI\u30b3\u30fc\u30c1\u3067\u3059\u3002\u8a3a\u65ad\u30fb\u6cbb\u7642\u30fb\u670d\u85ac\u5224\u65ad\u306f\u884c\u3044\u307e\u305b\u3093\u3002",
    emergency:"\u4f53\u8abf\u30fb\u5fc3\u306e\u4e0d\u8abf\u306f #7119 / \u7dca\u6025\u6642\u306f119 / \u5fc3\u306e\u76f8\u8ac7 0570-783-556",
    presets:"\u8a71\u3057\u305f\u3044\u3053\u3068\u3092\u9078\u3076",
    presetGoal:"\u4eca\u9031\u306e\u904b\u52d5\u76ee\u6a19\u3092\u76f8\u8ac7",
    presetFood:"\u98df\u4e8b\u30d0\u30e9\u30f3\u30b9\u3092\u76f8\u8ac7",
    presetContinue:"\u7d9a\u3051\u308b\u306e\u304c\u96e3\u3057\u3044",
    presetReport:"\u9031\u9593\u306e\u632f\u308a\u8fd4\u308a",
    presetFatigue:"\u75b2\u308c\u3066\u3044\u308b",
    presetRhythm:"\u751f\u6d3b\u30ea\u30ba\u30e0\u3092\u6574\u3048\u305f\u3044",
    homeTitle:"\u30f4\u30a3\u30bf\u30ea\u30a2\u8ee2\u751f\u9332",
    questTitle:"\u5065\u5eb7\u30af\u30a8\u30b9\u30c8",
    nutritionTitle:"\u6804\u990a\u30af\u30a8\u30b9\u30c8",
    adventureTitle:"\u5192\u967a\u306e\u66f8",
    settingsTitle:"\u8a2d\u5b9a"
  };

  function pageName(){
    return (location.pathname.split("/").pop() || "game.html").replace(/\.html$/,"");
  }

  function decorateNav(){
    document.querySelectorAll("#vitalia-common-nav .vcn-tab").forEach(function(tab){
      if(tab.querySelector(".vcn-icon")) return;
      var icon = document.createElement("span");
      icon.className = "vcn-icon";
      icon.setAttribute("aria-hidden","true");
      icon.textContent = tabIcons[tab.dataset.tab] || "\u2022";
      tab.insertBefore(icon, tab.firstChild);
    });
  }

  function setText(root, selector, text){
    var el = root.querySelector(selector);
    if(el) el.textContent = text;
  }

  function normalizeCoach(){
    var modal = document.getElementById("coach-modal");
    if(!modal) return;

    setText(modal, ".coach-hdr-title", copy.coachTitle);
    setText(modal, "#coach-close", copy.close);
    setText(modal, "#coach-reset", copy.reset);
    setText(modal, ".coach-char-name", copy.coachName);
    setText(modal, ".coach-char-sub", copy.coachSub);
    setText(modal, ".coach-preset-lbl", copy.presets);
    setText(modal, ".coach-disclaimer", copy.disclaimer);

    var emergency = modal.querySelector(".coach-emergency span:last-child");
    if(emergency) emergency.textContent = copy.emergency;

    var input = modal.querySelector("#coach-input");
    if(input) input.placeholder = copy.input;

    var labels = { G:"\u76ee\u6a19", R:"\u73fe\u72b6", O:"\u9078\u629e\u80a2", W:"\u610f\u5fd7" };
    modal.querySelectorAll(".coach-grow-step").forEach(function(step){
      var key = step.dataset.step || "";
      var sub = step.querySelector(".gs-sub");
      if(sub && labels[key]) sub.textContent = labels[key];
    });

    var presets = [
      copy.presetGoal,
      copy.presetFood,
      copy.presetContinue,
      copy.presetReport,
      copy.presetFatigue,
      copy.presetRhythm
    ];
    modal.querySelectorAll(".coach-preset").forEach(function(btn, i){
      if(presets[i]){
        btn.textContent = presets[i];
        btn.dataset.preset = presets[i];
      }
    });
  }

  function patchCoachBubbles(){
    var body = document.getElementById("coach-body");
    if(!body) return;
    body.querySelectorAll(".coach-bubble").forEach(function(bubble){
      var label = bubble.querySelector(".coach-bubble-lbl");
      if(label) label.textContent = bubble.classList.contains("coach-bubble-user") ? copy.user : copy.luna;

      var txt = bubble.querySelector(".coach-bubble-txt");
      if(!txt) return;
      txt.textContent = (txt.textContent || "").replace(/\[STEP:[A-Z]\]\s*/g, "");
      if(/邵ｺ|郢|隴|騾|髴|繝|繧|縺|譬|蛛|蠎|邯/.test(txt.textContent)){
        txt.textContent = copy.welcome;
      }
    });
  }

  function normalizeCopy(){
    document.querySelectorAll(".g-logo .gold-text").forEach(function(el){ el.textContent = copy.homeTitle; });
    document.querySelectorAll(".h-title").forEach(function(el){
      if(pageName() === "quest") el.textContent = copy.questTitle;
      if(pageName() === "nutrition") el.textContent = copy.nutritionTitle;
    });
    document.querySelectorAll(".adv-title").forEach(function(el){ el.textContent = copy.adventureTitle; });
    document.querySelectorAll(".page-title").forEach(function(el){
      if(pageName() === "settings") el.textContent = copy.settingsTitle;
    });
  }

  function hideNoisyHomeBlocks(){
    [
      "#sh-rec-qol",
      ".rec-qol",
      ".qol-trend-card",
      ".qol-card",
      "#battle-card",
      ".battle-card",
      ".history-card",
      "#boss-tap-wrap",
      "#boss-tap-btn",
      "#_toast",
      ".bonus-toast",
      "#save-toast",
      "#lv-toast"
    ].forEach(function(selector){
      document.querySelectorAll(selector).forEach(function(el){
        if(!el.hidden) el.hidden = true;
        if(el.style.getPropertyValue("display") !== "none" || el.style.getPropertyPriority("display") !== "important"){
          el.style.setProperty("display", "none", "important");
        }
      });
    });
  }

  function hideSettingsNotificationSection(){
    if(pageName() !== "settings") return;
    document.querySelectorAll(".section").forEach(function(section){
      if(/通知設定|Notification|通知を/.test(section.textContent || "")){
        section.hidden = true;
        section.style.setProperty("display", "none", "important");
      }
    });
  }

  function simplifySidePanels(){
    if(pageName() !== "quest" && pageName() !== "nutrition") return;
    var noisy = /討伐|敵HP|与ダメージ|実績|連続記録|過去の記録|歩数計|毒素|ボーナス|魔力記録|冒険記録/;
    document.querySelectorAll(".quest-side > *").forEach(function(panel){
      if(noisy.test(panel.textContent || "")){
        panel.hidden = true;
        panel.style.setProperty("display", "none", "important");
      }
    });
  }

  function softenAdventureCopy(){
    if(pageName() !== "adventure") return;
    document.querySelectorAll("#history-count, #enemy-hp-text, #atk-ex, #atk-nu, #atk-co").forEach(function(el){
      el.textContent = "";
    });
    document.querySelectorAll(".global-progress, .chapter-card").forEach(function(el){
      el.innerHTML = el.innerHTML
        .replace(/戦 制覇/g, "章 進行")
        .replace(/累計 [^<\\n]*与ダメージ/g, "累計記録を反映")
        .replace(/与ダメージ/g, "記録")
        .replace(/戦闘中/g, "進行中")
        .replace(/直接攻撃モード（1日1回）/g, "")
        .replace(/敵HP/g, "進捗");
    });
  }

  function sync(){
    decorateNav();
    normalizeCoach();
    patchCoachBubbles();
    normalizeCopy();
    hideNoisyHomeBlocks();
    hideSettingsNotificationSection();
    simplifySidePanels();
    softenAdventureCopy();
  }

  var syncTimer = 0;
  function requestSync(){
    window.clearTimeout(syncTimer);
    syncTimer = window.setTimeout(sync, 90);
  }

  function init(){
    sync();
    [250, 900, 1800, 3200].forEach(function(ms){
      window.setTimeout(sync, ms);
    });
    var target = document.getElementById("main-screen") || document.body;
    if(target && window.MutationObserver){
      new MutationObserver(requestSync).observe(target, {
        attributes:true,
        attributeFilter:["class","style","hidden"],
        childList:true,
        subtree:true
      });
    }
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  }else{
    init();
  }
})();
