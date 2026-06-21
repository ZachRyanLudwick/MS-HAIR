/* ============================================================
   Maddison Shepherd — interactions
   Vanilla JS. No build step. Lenis loaded from CDN with fallback.
   ============================================================ */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isCoarse = window.matchMedia("(pointer: coarse)").matches;

/* ---------- Image fallback (until real photos are dropped in) ---------- */
(function imageFallback() {
  const palettes = [
    ["#e7cbb4", "#b07d52"],
    ["#d8c3a5", "#8a6a45"],
    ["#f0dcc4", "#c79a6a"],
    ["#cdb18d", "#7c5a3a"],
  ];
  document.querySelectorAll("img").forEach((img, i) => {
    img.addEventListener("error", () => {
      const [a, b] = palettes[i % palettes.length];
      const ph = document.createElement("div");
      ph.className = "img-placeholder";
      ph.style.background = `linear-gradient(135deg, ${a}, ${b})`;
      ph.innerHTML = `<span>${(img.alt || "Photo").toUpperCase()}</span>`;
      img.replaceWith(ph);
    }, { once: true });
  });
})();

/* ---------- Year ---------- */
document.querySelectorAll("[data-year]").forEach((el) => {
  el.textContent = new Date().getFullYear();
});

/* ---------- Loader ---------- */
(function loader() {
  const el = document.querySelector("[data-loader]");
  const count = document.querySelector("[data-loader-count]");
  if (!el) return;
  if (prefersReduced) { el.remove(); start(); return; }

  const duration = 1900;
  const t0 = performance.now();
  let lastValue = -1;

  function easeLoader(t) {
    const eased = 1 - Math.pow(1 - t, 2.4);
    return (t * 0.28) + (eased * 0.72);
  }

  function tick(now) {
    const progress = Math.min(1, (now - t0) / duration);
    const value = Math.min(100, Math.round(easeLoader(progress) * 100));

    if (count && value !== lastValue) {
      count.textContent = value;
      lastValue = value;
    }

    if (progress < 1) {
      requestAnimationFrame(tick);
      return;
    }

    finish();
  }

  requestAnimationFrame(tick);

  function finish() {
    setTimeout(() => {
      el.classList.add("is-done");
      start();
      setTimeout(() => el.remove(), 1050);
    }, 260);
  }
})();

/* ---------- Smooth scroll (Lenis via CDN, graceful fallback) ---------- */
let lenis = null;
function initSmoothScroll() {
  if (prefersReduced) return;
  const s = document.createElement("script");
  s.src = "https://unpkg.com/lenis@1.1.13/dist/lenis.min.js";
  s.onload = () => {
    if (!window.Lenis) return;
    lenis = new window.Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    lenis.on("scroll", onScroll);
  };
  document.head.appendChild(s);
}

/* ---------- Anchor smooth scroll ---------- */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    else target.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });
  });
});

/* ---------- Custom cursor ---------- */
(function cursor() {
  const dot = document.querySelector("[data-cursor]");
  const label = document.querySelector("[data-cursor-label]");
  if (!dot || isCoarse) return;

  let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
  window.addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; });

  (function render() {
    cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
    dot.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
    requestAnimationFrame(render);
  })();

  document.querySelectorAll("[data-cursor-hover]").forEach((el) => {
    el.addEventListener("mouseenter", () => dot.classList.add("is-hover"));
    el.addEventListener("mouseleave", () => dot.classList.remove("is-hover"));
  });
  document.querySelectorAll("[data-cursor-text]").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      dot.classList.add("is-text");
      if (label) label.textContent = el.getAttribute("data-cursor-text");
    });
    el.addEventListener("mouseleave", () => {
      dot.classList.remove("is-text");
      if (label) label.textContent = "";
    });
  });
})();

/* ---------- Reveal on scroll (IntersectionObserver) ---------- */
function initReveals() {
  const items = document.querySelectorAll("[data-reveal], [data-reveal-line], [data-reveal-char]");
  if (prefersReduced) { items.forEach((i) => i.classList.add("is-in")); return; }

  // wrap reveal-line text so we can translate inner span
  document.querySelectorAll("[data-reveal-line]").forEach((line) => {
    if (line.children.length === 0) {
      const span = document.createElement("span");
      span.textContent = line.textContent;
      line.textContent = "";
      line.appendChild(span);
    }
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const lines = el.querySelectorAll("[data-reveal-line]");
      if (lines.length) {
        lines.forEach((l, i) => {
          const inner = l.firstElementChild || l;
          inner.style.transitionDelay = `${i * 0.09}s`;
        });
        el.classList.add("is-in");
      } else {
        el.classList.add("is-in");
      }
      io.unobserve(el);
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });

  document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
  document.querySelectorAll(".intro__lead, .about__title, .book__title").forEach((el) => io.observe(el));
  document.querySelectorAll("[data-reveal-char]").forEach((el) => io.observe(el));
}

/* hero title chars reveal immediately after load */
function revealHero() {
  if (prefersReduced) { document.querySelectorAll("[data-reveal-char]").forEach((c) => c.classList.add("is-in")); return; }
  const chars = document.querySelectorAll(".hero [data-reveal-char]");
  chars.forEach((c, i) => {
    c.style.transitionDelay = `${0.15 + i * 0.08}s`;
    requestAnimationFrame(() => c.classList.add("is-in"));
  });
  document.querySelectorAll(".hero [data-reveal]").forEach((el, i) => {
    el.style.transitionDelay = `${0.4 + i * 0.1}s`;
    el.classList.add("is-in");
  });
}

/* ---------- Parallax + scroll-driven effects ---------- */
const parallaxEls = [];
function collectParallax() {
  document.querySelectorAll("[data-parallax]").forEach((el) => {
    parallaxEls.push({ el, speed: parseFloat(el.dataset.speed || "0.1") });
  });
}

const progressBar = document.querySelector("[data-progress]");
const nav = document.querySelector("[data-nav]");
let lastScroll = 0;

function onScroll() {
  const y = window.scrollY || window.pageYOffset;
  const h = document.documentElement.scrollHeight - innerHeight;

  if (progressBar) progressBar.style.transform = `scaleX(${h > 0 ? y / h : 0})`;

  if (nav) {
    if (y > lastScroll && y > 200) nav.classList.add("is-hidden");
    else nav.classList.remove("is-hidden");
  }
  lastScroll = y;

  if (prefersReduced) return;
  const vh = innerHeight;
  parallaxEls.forEach(({ el, speed }) => {
    const rect = el.getBoundingClientRect();
    if (rect.bottom < -200 || rect.top > vh + 200) return;
    const offset = (rect.top + rect.height / 2 - vh / 2) * speed;
    el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
  });
}

/* ---------- Marquee drift ---------- */
function initMarquee() {
  const track = document.querySelector("[data-marquee]");
  if (!track || prefersReduced) return;
  let offset = 0;
  const half = track.scrollWidth / 2;
  let velocity = 0.5;
  let scrollBoost = 0;

  window.addEventListener("wheel", (e) => { scrollBoost = Math.max(-6, Math.min(6, e.deltaY * 0.04)); }, { passive: true });

  (function loop() {
    scrollBoost *= 0.92;
    offset -= velocity + scrollBoost;
    if (Math.abs(offset) >= half) offset = 0;
    track.style.transform = `translate3d(${offset}px, 0, 0)`;
    requestAnimationFrame(loop);
  })();
}

/* ---------- Animated counters ---------- */
function initCounters() {
  const nums = document.querySelectorAll("[data-count]");
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      if (prefersReduced) { el.textContent = target; io.unobserve(el); return; }
      const dur = 1600; const t0 = performance.now();
      (function step(now) {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased);
        if (p < 1) requestAnimationFrame(step);
      })(t0);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });
  nums.forEach((n) => io.observe(n));
}

/* ---------- Hero feature tilt ---------- */
function initTilt() {
  const el = document.querySelector("[data-tilt]");
  if (!el || isCoarse || prefersReduced) return;
  el.addEventListener("mousemove", (e) => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1000px) rotateY(${px * 5}deg) rotateX(${-py * 5}deg)`;
  });
  el.addEventListener("mouseleave", () => { el.style.transform = ""; });
}

/* ---------- Boot ---------- */
let started = false;
function start() {
  if (started) return;
  started = true;
  collectParallax();
  initSmoothScroll();
  initReveals();
  revealHero();
  initMarquee();
  initCounters();
  initTilt();
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}
