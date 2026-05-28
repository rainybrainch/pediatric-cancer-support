(function(){
  "use strict";

  var tabIcons = {
    home:"⌂",
    exercise:"⚔",
    nutrition:"✦",
    adventure:"◆",
    settings:"⚙"
  };

  var cleanText = {
    user:"あなた",
    luna:"ルナ",
    welcome:"ようこそ、ヴィタリアへ。私はルナ、あなたの健康習慣を一緒に整理するAIコーチです。\n\n今週、どんな健康習慣を無理なく続けたいですか？",
    coachTitle:"✦ ルナのコーチング",
    coachName:"ルナ — 転生の女神",
    coachSub:"GROWモデル AIコーチ / Gemini連携",
    close:"← ホーム",
    reset:"↻",
    input:"ルナに相談する...",
    disclaimer:"ルナはGROWモデルで考えを整理するAIコーチです。診断・治療・服薬判断は行いません。",
    emergency:"体調・心の不調は #7119 / 緊急時は119 / 心の相談 0570-783-556",
    presets:"話したいことを選ぶ",
    presetGoal:"今週の運動目標を相談",
    presetFood:"食事バランスを相談",
    presetContinue:"続けるのが難しい",
    presetReport:"達成を報告",
    presetFatigue:"疲れている",
    presetRhythm:"生活リズムを整えたい"
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
      icon.textContent = tabIcons[tab.dataset.tab] || "•";
      tab.insertBefore(icon, tab.firstChild);
    });
  }

  function normalizeCoach(){
    var modal = document.getElementById("coach-modal");
    if(!modal) return;
    var set = function(sel, text){
      var el = modal.querySelector(sel);
      if(el) el.textContent = text;
    };
    set(".coach-hdr-title", cleanText.coachTitle);
    set("#coach-close", cleanText.close);
    set("#coach-reset", cleanText.reset);
    set(".coach-char-name", cleanText.coachName);
    set(".coach-char-sub", cleanText.coachSub);
    set(".coach-preset-lbl", cleanText.presets);
    set(".coach-disclaimer", cleanText.disclaimer);
    var emergency = modal.querySelector(".coach-emergency span:last-child");
    if(emergency) emergency.textContent = cleanText.emergency;
    var input = modal.querySelector("#coach-input");
    if(input) input.placeholder = cleanText.input;
    var labels = {G:"目標",R:"現状",O:"選択肢",W:"意志"};
    modal.querySelectorAll(".coach-grow-step").forEach(function(step){
      var key = step.dataset.step || "";
      var sub = step.querySelector(".gs-sub");
      if(sub && labels[key]) sub.textContent = labels[key];
    });
    var presets = [
      cleanText.presetGoal,
      cleanText.presetFood,
      cleanText.presetContinue,
      cleanText.presetReport,
      cleanText.presetFatigue,
      cleanText.presetRhythm
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
      if(label){
        label.textContent = bubble.classList.contains("coach-bubble-user") ? cleanText.user : cleanText.luna;
      }
      var txt = bubble.querySelector(".coach-bubble-txt");
      if(txt && /縺|繝|譁|蟆|逶|霆/.test(txt.textContent || "")){
        txt.textContent = cleanText.welcome;
      }
    });
  }

  function normalizeCopy(){
    document.querySelectorAll(".g-logo .gold-text").forEach(function(el){ el.textContent = "ヴィタリア転生録"; });
    document.querySelectorAll(".h-title").forEach(function(el){
      if(pageName() === "quest") el.textContent = "健康クエスト";
      if(pageName() === "nutrition") el.textContent = "栄養クエスト";
    });
    document.querySelectorAll(".adv-title").forEach(function(el){ el.textContent = "冒険の書"; });
    document.querySelectorAll(".page-title").forEach(function(el){
      if(pageName() === "settings") el.textContent = "設定";
    });
  }

  function sync(){
    decorateNav();
    normalizeCoach();
    patchCoachBubbles();
    normalizeCopy();
  }

  function init(){
    sync();
    [250, 900, 1800, 3200].forEach(function(ms){
      window.setTimeout(sync, ms);
    });
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  }else{
    init();
  }
})();
