/* ===========================
   funciones.js — UI, accesibilidad, horarios y helpers
   =========================== */

/* ---- Helpers PRIMERO (evita TDZ) ---- */
export const $  = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

export function setCloudStatus(text, kind = "info") {
  // No dependas de $ aquí para evitar TDZ si cambias el orden
  const el = document.getElementById("cloud-status");
  if (!el) return;
  el.textContent = text;
  el.style.color = kind === "error" ? "#ff6b6b" : "var(--muted)";
}

export function showToast(message = "Hecho") {
  const toast = document.getElementById("toast");
  if (!toast) { alert(message); return; }
  toast.textContent = message;
  toast.style.display = "block";
  toast.setAttribute("aria-live", "polite");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => (toast.style.display = "none"), 2400);
}

export const MAX_CLIPS = 6;

/* ===========================
   Firebase (App, Firestore, Storage)
   =========================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

/** 🔧 REEMPLAZA POR TU CONFIG DE FIREBASE **/
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROJECT_ID.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROJECT_ID.appspot.com",
  messagingSenderId: "XXXXX",
  appId: "TU_APP_ID"
};

let app, db, storage;
try {
  setCloudStatus("Conectando a la nube…");
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);
  setCloudStatus("Conectado ✔");
} catch (err) {
  console.error("Firebase init error:", err);
  setCloudStatus("Error al conectar a la nube", "error");
}

export { db, storage };

/* ===========================
   Navbar móvil + scroll suave
   =========================== */
(function navSetup() {
  const btn = $(".nav-toggle");
  const list = $("#nav-menu");
  if (!btn || !list) return;

  btn.addEventListener("click", () => {
    const open = list.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });

  list.addEventListener("click", (e) => {
    if (e.target.matches("a")) {
      list.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    }
  });

  $$('a[href^="#"]').forEach(a => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = id && id !== "#" ? $(id) : null;
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
})();

/* ===========================
   Typewriter del lema
   =========================== */
(function typewriter() {
  const el = $("#typewriter");
  if (!el) return;
  const text = el.textContent.trim() || "“BIENVENIDOS A LOS M, UNANSE A LOS M”";
  el.textContent = "";
  let i = 0;
  (function step(){
    el.textContent = text.slice(0, i++);
    if (i <= text.length) setTimeout(step, 28);
  })();
})();

/* ===========================
   Schema.org Person
   =========================== */
(function schemaPerson() {
  const el = $("#schema-person");
  if (!el) return;
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "MontanaFrx",
    "url": location.origin,
    "sameAs": [
      "https://kick.com/montanafrx",
      "https://www.instagram.com/montanafrx",
      "https://www.tiktok.com/@kick.montanafrx",
      "https://x.com/Montanafrx",
      "https://discord.gg/sxcJVwzK8Z"
    ]
  };
  el.textContent = JSON.stringify(data);
})();

/* ===========================
   Formulario de contacto
   =========================== */
(function contactForm() {
  const form = $("#contact-form");
  if (!form) return;
  const helper = $("#form-helper");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#name")?.value?.trim() ?? "";
    const email = $("#email")?.value?.trim() ?? "";
    const message = $("#message")?.value?.trim() ?? "";

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (name.length < 2) { helper.textContent = "El nombre debe tener al menos 2 caracteres."; return; }
    if (!emailOk)       { helper.textContent = "Ingresa un email válido."; return; }
    if (message.length < 10) { helper.textContent = "El mensaje debe tener al menos 10 caracteres."; return; }

    helper.textContent = "";
    form.reset();
    showToast("Mensaje enviado ✔");
  });
})();

/* ===========================
   Horarios (UTC-5, cruce medianoche)
   L-M-Mi-J-V-D: 21:45–01:00, Sábado: descanso
   =========================== */
(function schedule() {
  const tbody = $("#schedule-body");
  if (!tbody) return;

  const TZ = "America/Guayaquil";
  const days = ["domingo", "lunes", "miércoles","martes", "jueves", "viernes", "sábado"]; // <- ojo: corrige al tuyo si cambias
  // Mejor mantener orden normal:
  const dayNames = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];

  const rules = {
    0: { start: { h: 21, m: 45 }, end: { h: 1, m: 0 }, off: false }, // domingo
    1: { start: { h: 21, m: 45 }, end: { h: 1, m: 0 }, off: false }, // lunes
    2: { start: { h: 21, m: 45 }, end: { h: 1, m: 0 }, off: false }, // martes
    3: { start: { h: 21, m: 45 }, end: { h: 1, m: 0 }, off: false }, // miércoles
    4: { start: { h: 21, m: 45 }, end: { h: 1, m: 0 }, off: false }, // jueves
    5: { start: { h: 21, m: 45 }, end: { h: 1, m: 0 }, off: false }, // viernes
    6: { start: null, end: null, off: true }                           // sábado
  };

  const mins = (h, m) => h * 60 + m;

  function nowTZ() {
    const fmt = new Intl.DateTimeFormat("es-EC", {
      timeZone: TZ, hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      weekday: "long"
    });
    const parts = Object.fromEntries(fmt.formatToParts(new Date()).map(p => [p.type, p.value]));
    const dow = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"]
      .indexOf(parts.weekday.toLowerCase());
    return { h:+parts.hour, m:+parts.minute, dow };
  }

  function isLiveForDay(dayIndex, now) {
    const rule = rules[dayIndex];
    if (!rule || rule.off) return false;
    const s = mins(rule.start.h, rule.start.m);
    const e = mins(rule.end.h, rule.end.m);
    const n = mins(now.h, now.m);
    if (e <= s) { // cruza medianoche
      if (n >= s) return true; // noche del mismo día
      const prev = (dayIndex + 6) % 7;
      const pr = rules[prev];
      if (pr && !pr.off) {
        const pe = mins(pr.end.h, pr.end.m);
        const ps = mins(pr.start.h, pr.start.m);
        if (pe <= ps && n < e) return true;
      }
      return false;
    } else {
      return n >= s && n < e;
    }
  }

  const fmt = (h, m=0) => `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;

  function render() {
    const now = nowTZ();
    tbody.innerHTML = "";
    for (let i = 0; i < 7; i++) {
      const rule = rules[i];
      const tr = document.createElement("tr");

      const tdDay = document.createElement("td");
      const name = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"][i];
      tdDay.textContent = name[0].toUpperCase() + name.slice(1);

      const tdTime = document.createElement("td");
      tdTime.textContent = rule.off ? "Descanso" : `${fmt(rule.start.h, rule.start.m)} - ${fmt(rule.end.h, rule.end.m)}`;

      const tdState = document.createElement("td");
      let live = false;
      if (!rule.off) {
        if (i === now.dow) {
          live = isLiveForDay(i, now);
        } else if (i === (now.dow + 6) % 7) {
          const curr = rules[now.dow];
          if (curr && !curr.off) {
            const ce = mins(curr.end.h, curr.end.m);
            const cs = mins(curr.start.h, curr.start.m);
            const n  = mins(now.h, now.m);
            if (ce <= cs && n < ce) live = true;
          }
        }
      }
      tdState.innerHTML = live ? `<span class="badge-live">En directo ahora</span>` : "—";
      if (live) tr.classList.add("active");

      tr.append(tdDay, tdTime, tdState);
      tbody.appendChild(tr);
    }
  }

  render();
  setInterval(render, 60 * 1000);
})();

/* ===========================
   Año dinámico
   =========================== */
(function year() {
  const y = $("#year");
  if (y) y.textContent = new Date().getFullYear();
})();
