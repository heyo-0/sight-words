/* Sight Words flashcard app.
   Words live in words.js (WORD_LEVELS). This file is only the interface. */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const card = $("card");
  const wordEl = $("word");
  const stage = $("stage");
  const progressEl = $("progress");
  const levelBtn = $("levelBtn");
  const shuffleBtn = $("shuffleBtn");
  const azBtn = $("azBtn");
  const speakBtn = $("speakBtn");
  const picker = $("picker");
  const levelList = $("levelList");
  const closePicker = $("closePicker");
  const toast = $("toast");
  const confettiCanvas = $("confetti");

  const MILESTONE = 25;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- persistence (only the last level and sort mode, nothing else) ----------
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); }
      catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
    },
  };

  // ---------- state ----------
  const state = {
    level: 0,      // index into WORD_LEVELS
    order: [],     // array of word indexes in display order
    pos: 0,        // position within order
    az: false,     // alphabetical instead of shuffled
  };

  function words() { return WORD_LEVELS[state.level].words; }

  function shuffle(arr) {
    // Fisher-Yates
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function buildOrder() {
    const idx = words().map((_, i) => i);
    if (state.az) {
      const w = words();
      idx.sort((a, b) => (w[a] < w[b] ? -1 : w[a] > w[b] ? 1 : 0));
    } else {
      shuffle(idx);
    }
    state.order = idx;
    state.pos = 0;
  }

  // ---------- rendering ----------
  function currentWord() {
    return words()[state.order[state.pos]];
  }

  function fitWord() {
    // Make the word as large as possible while fitting inside the card.
    const cardRect = card.getBoundingClientRect();
    const maxW = cardRect.width * 0.88;
    const maxH = cardRect.height * 0.6;
    let size = Math.min(maxH, 400);
    wordEl.style.setProperty("--word-size", size + "px");
    const w = wordEl.getBoundingClientRect().width;
    if (w > maxW) {
      size = Math.floor(size * (maxW / w));
      wordEl.style.setProperty("--word-size", size + "px");
    }
  }

  function render(direction) {
    const text = currentWord().toLowerCase();
    wordEl.textContent = text;
    fitWord();
    progressEl.textContent = (state.pos + 1) + " / " + state.order.length;

    card.classList.remove("in-left", "in-right", "snap", "dragging");
    card.style.transform = "";
    if (direction) {
      void card.offsetWidth; // restart the animation
      card.classList.add(direction === "next" ? "in-right" : "in-left");
    }
  }

  function applyLevelStyling() {
    const lvl = WORD_LEVELS[state.level];
    levelBtn.textContent = lvl.name.toLowerCase();
    levelBtn.style.background = lvl.colour;
    document.querySelector('meta[name="theme-color"]').setAttribute("content", "#fff7e6");
  }

  // ---------- navigation ----------
  function next() {
    const last = state.order.length - 1;
    if (state.pos >= last) {
      // End of the level: big celebration, then start again (a fresh mix unless in A to Z mode)
      if (state.az) state.pos = 0; else buildOrder();
      render("next");
      celebrate(true);
      showToast("hooray! all done!", true);
      return;
    }
    state.pos++;
    render("next");
    if ((state.pos) % MILESTONE === 0) {
      celebrate(false);
      showToast(["great reading!", "super!", "wow, keep going!", "you are a star!"][(state.pos / MILESTONE) % 4]);
    }
  }

  function prev() {
    state.pos = state.pos > 0 ? state.pos - 1 : state.order.length - 1;
    render("prev");
  }

  // ---------- touch: swipe (with the card following the finger) or tap ----------
  let touch = null;

  stage.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    const edge = 24;
    // Ignore touches that start right at the screen edge so iOS back/forward
    // swipes in Safari aren't confused with our card swipe.
    if (t.clientX < edge || t.clientX > window.innerWidth - edge) { touch = null; return; }
    touch = { x: t.clientX, y: t.clientY, t: Date.now(), dx: 0, dy: 0, moved: false };
    card.classList.remove("in-left", "in-right", "snap");
    card.classList.add("dragging");
  }, { passive: true });

  stage.addEventListener("touchmove", (e) => {
    if (!touch) return;
    const t = e.touches[0];
    touch.dx = t.clientX - touch.x;
    touch.dy = t.clientY - touch.y;
    if (!touch.moved && Math.abs(touch.dx) > 8 && Math.abs(touch.dx) > Math.abs(touch.dy)) touch.moved = true;
    if (touch.moved) {
      if (e.cancelable) e.preventDefault();
      const x = touch.dx * 0.6;
      card.style.transform = "translate3d(" + x + "px,0,0) rotate(" + (x / 40) + "deg)";
    }
  }, { passive: false });

  function endTouch(e) {
    if (!touch) return;
    const dt = Date.now() - touch.t;
    const dx = touch.dx;
    const velocity = Math.abs(dx) / Math.max(dt, 1);
    const swiped = touch.moved && (Math.abs(dx) > 45 || velocity > 0.35);
    card.classList.remove("dragging");

    if (swiped) {
      if (dx < 0) next(); else prev();
    } else if (!touch.moved && dt < 400) {
      // A tap: right half forwards, left half back.
      if (touch.x > window.innerWidth / 2) next(); else prev();
    } else {
      card.classList.add("snap");
      card.style.transform = "";
    }
    touch = null;
    if (e.cancelable) e.preventDefault(); // stop the follow-up synthetic click
  }
  stage.addEventListener("touchend", endTouch, { passive: false });
  stage.addEventListener("touchcancel", () => {
    if (!touch) return;
    touch = null;
    card.classList.remove("dragging");
    card.classList.add("snap");
    card.style.transform = "";
  });

  // Mouse / trackpad on desktop
  stage.addEventListener("click", (e) => {
    if (e.clientX > window.innerWidth / 2) next(); else prev();
  });

  // Keyboard on desktop
  window.addEventListener("keydown", (e) => {
    if (!picker.hidden) { if (e.key === "Escape") hidePicker(); return; }
    if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") { e.preventDefault(); next(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    else if (e.key.toLowerCase() === "s") { doShuffle(); }
  });

  // ---------- buttons ----------
  function doShuffle() {
    state.az = false;
    azBtn.setAttribute("aria-pressed", "false");
    store.set("az", false);
    buildOrder();
    render("next");
    shuffleBtn.classList.remove("wiggle");
    void shuffleBtn.offsetWidth;
    shuffleBtn.classList.add("wiggle");
    showToast("mixed up!");
  }
  shuffleBtn.addEventListener("click", doShuffle);

  azBtn.addEventListener("click", () => {
    state.az = !state.az;
    azBtn.setAttribute("aria-pressed", String(state.az));
    store.set("az", state.az);
    buildOrder();
    render("next");
    showToast(state.az ? "a to z" : "mixed up!");
  });

  // ---------- speech (opt-in, per tap) ----------
  let voice = null;
  function pickVoice() {
    if (!("speechSynthesis" in window)) return;
    const voices = speechSynthesis.getVoices();
    if (!voices.length) return;
    const score = (v) => {
      const lang = (v.lang || "").toLowerCase();
      let s = 0;
      if (lang === "en-au") s += 10;
      else if (lang.startsWith("en")) s += 5;
      if (/karen|catherine|lee|natural|premium|enhanced/i.test(v.name)) s += 1;
      if (v.localService) s += 1;
      return s;
    };
    voice = voices.slice().sort((a, b) => score(b) - score(a))[0] || null;
  }
  if ("speechSynthesis" in window) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  } else {
    speakBtn.hidden = true;
  }
  speakBtn.addEventListener("click", () => {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(currentWord());
    if (voice) u.voice = voice;
    u.lang = (voice && voice.lang) || "en-AU";
    u.rate = 0.85;
    u.pitch = 1.05;
    speechSynthesis.speak(u);
  });

  // ---------- level picker ----------
  function showPicker() {
    levelList.innerHTML = "";
    WORD_LEVELS.forEach((lvl, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "level-btn" + (i === state.level ? " current" : "");
      b.style.background = lvl.colour;
      b.style.color = "#1f2430";
      b.innerHTML = "<span></span><small></small>";
      b.firstChild.textContent = lvl.name.toLowerCase();
      b.lastChild.textContent = lvl.words.length + " words";
      b.addEventListener("click", () => {
        setLevel(i);
        hidePicker();
      });
      levelList.appendChild(b);
    });
    picker.hidden = false;
  }
  function hidePicker() { picker.hidden = true; }
  levelBtn.addEventListener("click", showPicker);
  closePicker.addEventListener("click", hidePicker);
  picker.addEventListener("click", (e) => { if (e.target === picker) hidePicker(); });

  function setLevel(i) {
    state.level = i;
    store.set("level", i);
    applyLevelStyling();
    buildOrder();
    render("next");
  }

  // ---------- toast ----------
  let toastTimer = null;
  function showToast(text, big) {
    toast.textContent = text;
    toast.classList.toggle("big", !!big);
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), big ? 2200 : 1300);
  }

  // ---------- confetti ----------
  const ctx = confettiCanvas.getContext("2d");
  let particles = [];
  let raf = null;
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    confettiCanvas.width = Math.floor(window.innerWidth * dpr);
    confettiCanvas.height = Math.floor(window.innerHeight * dpr);
    confettiCanvas.style.width = window.innerWidth + "px";
    confettiCanvas.style.height = window.innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const COLOURS = ["#ff6b6b", "#ffd166", "#06d6a0", "#4cc9f0", "#c77dff", "#ff8fab", "#ffb400"];
  function celebrate(big) {
    if (reduceMotion) return;
    resizeCanvas();
    const count = big ? 220 : 70;
    const W = window.innerWidth, H = window.innerHeight;
    for (let i = 0; i < count; i++) {
      const fromLeft = i % 2 === 0;
      // Big: two fountains from the bottom corners arcing across the screen.
      // Small: two gentle fountains that stay near the edges, away from the word.
      particles.push({
        x: fromLeft ? -10 : W + 10,
        y: big ? H * 0.7 : H * 0.85,
        vx: (fromLeft ? 1 : -1) * (big ? 4 + Math.random() * 9 : 1 + Math.random() * 2.5),
        vy: -(big ? 8 + Math.random() * 10 : 9 + Math.random() * 8),
        g: 0.35 + Math.random() * 0.15,
        w: 6 + Math.random() * 8,
        h: 8 + Math.random() * 8,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        c: COLOURS[i % COLOURS.length],
        shape: Math.random() < 0.3 ? "circle" : "rect",
        life: 0,
        max: 70 + Math.random() * 40,
      });
    }
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function tick() {
    const W = window.innerWidth, H = window.innerHeight;
    ctx.clearRect(0, 0, W, H);
    particles = particles.filter((p) => p.life < p.max && p.y < H + 40);
    for (const p of particles) {
      p.life++;
      p.vy += p.g;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.globalAlpha = Math.max(0, 1 - p.life / p.max);
      ctx.fillStyle = p.c;
      if (p.shape === "circle") { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill(); }
      else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (particles.length) raf = requestAnimationFrame(tick);
    else { raf = null; ctx.clearRect(0, 0, W, H); }
  }

  // ---------- misc guards ----------
  // Block pinch zoom / double-tap zoom gestures on iOS Safari.
  document.addEventListener("gesturestart", (e) => e.preventDefault());
  let lastTouchEnd = 0;
  document.addEventListener("touchend", (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300 && e.cancelable) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });
  document.addEventListener("contextmenu", (e) => e.preventDefault());

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { fitWord(); }, 80);
  });

  // ---------- start ----------
  state.level = Math.min(Math.max(store.get("level", 0), 0), WORD_LEVELS.length - 1);
  state.az = !!store.get("az", false);
  azBtn.setAttribute("aria-pressed", String(state.az));
  applyLevelStyling();
  buildOrder();
  render();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitWord);

  // Offline support
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
})();
