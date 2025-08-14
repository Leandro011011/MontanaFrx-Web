/* ===========================
   funciones.js — UI, accesibilidad, horarios, helpers y Firebase
   (ES Module: exporta db, storage, showToast, setCloudStatus, MAX_CLIPS, $, $$)
   =========================== */

/* ===========================
   Firebase (App, Firestore, Storage) - SDK modular
   =========================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getStorage,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

/** 🔧 PEGAR TU CONFIGURACIÓN REAL AQUÍ
 *  Copia y pega el objeto que te dio Firebase:
 *  {
 *    apiKey: "...",
 *    authDomain: "...",
 *    projectId: "...",
 *    storageBucket: "...",
 *    messagingSenderId: "...",
 *    appId: "...",
 *    measurementId: "..." // opcional
 *  }
 */
const firebaseConfig = {
  apiKey: "AIzaSyC7Fr7q7se_z4ZczzEoIEAQxqo6oQvAK",
  authDomain: "montanafrxweb.firebaseapp.com",
  projectId: "montanafrxweb",
  storageBucket: "montanafrxweb.appspot.com",
  messagingSenderId: "78301769428",
  appId: "1:78301769428:web:431b21462215a9c2cffa21",
  measurementId: "G-06CLX7EX8H"
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

/* Throttle & Debounce (utilidades opcionales) */
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
   Reglas:
   - Lunes, Martes, Miércoles, Jueves, Viernes y Domingo: 21:45–01:00
   - Sábado: Descanso
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
    // Hora/fecha actual en la zona TZ como componentes
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

  const mins = (h, m) => h * 60 + m;

  // ¿Está “en vivo” para el día N (0..6)?
  function isLiveForDay(dayIndex, now) {
    const rule = rules[dayIndex];
    if (!rule || rule.off) return false;

    const s = mins(rule.start.h, rule.start.m);
    const e = mins(rule.end.h, rule.end.m);
    const n = mins(now.h, now.m);

    if (e <= s) {
      // Cruza medianoche (21:45 → 01:00)
      if (n >= s) return true; // de 21:45 a 23:59 del mismo día
      // madrugada del día siguiente: sigue “en vivo” del día anterior hasta 01:00
      const prev = (dayIndex + 6) % 7;
      const pr = rules[prev];
      if (pr && !pr.off) {
        const ps = mins(pr.start.h, pr.start.m);
        const pe = mins(pr.end.h, pr.end.m);
        if (pe <= ps && n < e) return true;
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
        // Resalta “en directo” SOLO en el día actual (visual principal)
        if (i === now.dow) {
          live = isLiveForDay(i, now);
        } else if (i === (now.dow + 6) % 7) {
          // madrugada: el “en vivo” pertenece al día anterior
          const currRule = rules[now.dow];
          if (currRule && !currRule.off) {
            const ce = mins(currRule.end.h, currRule.end.m);
            const cs = mins(currRule.start.h, currRule.start.m);
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
   Exponer helpers (debug opcional)
   =========================== */
window.__MF__ = { showToast, setCloudStatus, MAX_CLIPS };
