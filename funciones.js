/* ===========================
   funciones.js — UI, accesibilidad, horarios y helpers
   (ES Module: exporta db, storage, showToast, setCloudStatus, MAX_CLIPS)
   =========================== */

/* ===========================
   Firebase (App, Firestore, Storage)
   =========================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getStorage
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

/** REEMPLAZA POR TU CONFIG DE FIREBASE **/
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
  setCloudStatus("Error al conectar a la nube");
}

/* ===========================
   Exportaciones para clips.js
   =========================== */
export { db, storage };

/* ===========================
   Constantes & Helpers globales
   =========================== */
export const MAX_CLIPS = 6;

export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

export function setCloudStatus(text, kind = "info") {
  const el = $("#cloud-status");
  if (!el) return;
  el.textContent = text;
  el.style.color = kind === "error" ? "#ff6b6b" : "var(--muted)";
}

/* Toast accesible */
export function showToast(message = "Hecho") {
  const toast = $("#toast");
  if (!toast) {
    alert(message);
    return;
  }
  toast.textContent = message;
  toast.style.display = "block";
  toast.setAttribute("aria-live", "polite");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => (toast.style.display = "none"), 2400);
}

/* Throttle & Debounce (útiles para scroll/resize si los usas) */
export const throttle = (fn, wait = 200) => {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn(...args);
    }
  };
};
export const debounce = (fn, wait = 200) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
};

/* ===========================
   Navbar móvil accesible + scroll suave
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

  // Scroll suave en anclas
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
  // Si ya hay texto en HTML, lo usamos; si no, lo ponemos:
  const text = el.textContent.trim() || "“BIENVENIDOS A LOS M, UNANSE A LOS M”";
  el.textContent = "";
  let i = 0;
  function step() {
    el.textContent = text.slice(0, i++);
    if (i <= text.length) {
      setTimeout(step, 28);
    } else {
      // Parpadeo sutil del “cursor”
      el.style.borderRight = "2px solid transparent";
      setTimeout(() => (el.style.borderRight = "2px solid var(--accent)"), 500);
    }
  }
  step();
})();

/* ===========================
   Schema.org Person (SEO)
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
   Formulario de contacto (validación accesible)
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
    if (name.length < 2) {
      helper.textContent = "El nombre debe tener al menos 2 caracteres.";
      return;
    }
    if (!emailOk) {
      helper.textContent = "Ingresa un email válido.";
      return;
    }
    if (message.length < 10) {
      helper.textContent = "El mensaje debe tener al menos 10 caracteres.";
      return;
    }
    helper.textContent = "";
    form.reset();
    showToast("Mensaje enviado ✔");
  });
})();

/* ===========================
   Horarios (UTC-5 Ecuador) con cruce de medianoche
   Lunes, Martes, Miércoles, Jueves, Viernes y Domingo: 21:45–01:00
   Sábado: Descanso
   =========================== */
(function schedule() {
  const tbody = $("#schedule-body");
  if (!tbody) return;

  const TZ = "America/Guayaquil"; // UTC-5
  const days = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

  // Mapa por índice nativo JS (0 domingo … 6 sábado)
  const rules = {
    0: { start: { h: 21, m: 45 }, end: { h: 1, m: 0 }, off: false }, // domingo
    1: { start: { h: 21, m: 45 }, end: { h: 1, m: 0 }, off: false }, // lunes
    2: { start: { h: 21, m: 45 }, end: { h: 1, m: 0 }, off: false }, // martes
    3: { start: { h: 21, m: 45 }, end: { h: 1, m: 0 }, off: false }, // miércoles
    4: { start: { h: 21, m: 45 }, end: { h: 1, m: 0 }, off: false }, // jueves
    5: { start: { h: 21, m: 45 }, end: { h: 1, m: 0 }, off: false }, // viernes
    6: { start: null, end: null, off: true }                           // sábado (descanso)
  };

  function nowTZ() {
    // Convierte la hora “real” actual a componentes en la zona TZ
    const fmt = new Intl.DateTimeFormat("es-EC", {
      timeZone: TZ, hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      weekday: "long"
    });
    const parts = Object.fromEntries(fmt.formatToParts(new Date()).map(p => [p.type, p.value]));
    // normaliza índice del día actual
    const dowName = parts.weekday.toLowerCase();
    const dow = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"].indexOf(dowName);
    return {
      y: +parts.year, mo: +parts.month, d: +parts.day,
      h: +parts.hour, m: +parts.minute, s: +parts.second,
      dow
    };
  }

  function mins(h, m) { return h * 60 + m; }

  // ¿Está “en vivo” para el día N (0..6)?
  function isLiveForDay(dayIndex, now) {
    const rule = rules[dayIndex];
    if (!rule || rule.off) return false;

    const s = mins(rule.start.h, rule.start.m);
    const e = mins(rule.end.h, rule.end.m);
    const n = mins(now.h, now.m);

    if (e <= s) {
      // Cruza medianoche (ej: 21:45 → 01:00)
      // live si: n >= s (hoy)  ó  n < e (madrugada) y hoy es el día siguiente al “díaIndex”
      if (n >= s) return true;
      // madrugada: valida si el día anterior también cruza
      const prev = (dayIndex + 6) % 7;
      const pr = rules[prev];
      if (pr && !pr.off) {
        const ps = mins(pr.start.h, pr.start.m);
        const pe = mins(pr.end.h, pr.end.m);
        if (pe <= ps && n < e) {
          // hoy es el día siguiente del “previo”; durante 00:00–end sigue “en vivo” del día anterior
          return true;
        }
      }
      return false;
    } else {
      // No cruza medianoche
      return n >= s && n < e;
    }
  }

  function fmt(h, m = 0) {
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  function render() {
    const now = nowTZ();
    tbody.innerHTML = "";

    for (let i = 0; i < 7; i++) {
      const rule = rules[i];
      const tr = document.createElement("tr");

      const tdDay = document.createElement("td");
      tdDay.textContent = days[i][0].toUpperCase() + days[i].slice(1);

      const tdTime = document.createElement("td");
      if (rule.off) {
        tdTime.textContent = "Descanso";
      } else {
        tdTime.textContent = `${fmt(rule.start.h, rule.start.m)} - ${fmt(rule.end.h, rule.end.m)}`;
      }

      const tdState = document.createElement("td");
      let live = false;
      if (!rule.off) {
        // Resalta “en directo” SOLO en el día actual (visual)
        if (i === now.dow) {
          live = isLiveForDay(i, now);
        } else if (i === (now.dow + 6) % 7) {
          // si es madrugada y corresponde al día anterior (caso cruce medianoche)
          const currentRule = rules[now.dow];
          const crStart = currentRule?.start;
          const crEnd   = currentRule?.end;
          if (currentRule && crStart && crEnd) {
            const e = mins(crEnd.h, crEnd.m);
            const s = mins(crStart.h, crStart.m);
            const n = mins(now.h, now.m);
            if (e <= s && n < e) {
              // madrugada de hoy pero “live” pertenece a la fila de ayer.
              live = true;
            }
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
  // Actualiza cada minuto
  setInterval(render, 60 * 1000);
})();

/* ===========================
   Footer: año dinámico
   =========================== */
(function year() {
  const y = $("#year");
  if (y) y.textContent = new Date().getFullYear();
})();

/* ===========================
   Exponer helpers (opcional) en window por si necesitas debug
   =========================== */
window.__MF__ = {
  showToast, setCloudStatus, MAX_CLIPS
};
