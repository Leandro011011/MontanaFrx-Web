/* ===========================
   funciones.js — UI básica, horarios, accesibilidad
   =========================== */

// ---------- Utilidades ----------
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

function showToast(message = "Hecho") {
  const toast = $("#toast");
  if (!toast) return alert(message);
  toast.textContent = message;
  toast.style.display = "block";
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => (toast.style.display = "none"), 2200);
}

function formatTime(h, m = 0) {
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${hh}:${mm}`;
}

// ---------- Navbar móvil ----------
(function navToggleSetup() {
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
})();

// ---------- Typewriter del lema ----------
(function typewriter() {
  const el = $("#typewriter");
  if (!el) return;
  const text = '“BIENVENIDOS A LOS M, UNANSE A LOS M”';
  let i = 0;
  function step() {
    el.textContent = text.slice(0, i++);
    if (i <= text.length) {
      setTimeout(step, 30);
    } else {
      // Parpadeo sutil del cursor
      el.style.borderRight = "2px solid transparent";
      setTimeout(() => (el.style.borderRight = "2px solid var(--accent)"), 500);
    }
  }
  step();
})();

// ---------- Esquema Person ----------
(function schemaPerson() {
  const el = $("#schema-person");
  if (!el) return;
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "MontanaFrx",
    "url": "https://leandro011011.github.io/MontanaFrx-Web/",
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

// ---------- Formulario de contacto ----------
(function contactForm() {
  const form = $("#contact-form");
  if (!form) return;
  const helper = $("#form-helper");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#name").value.trim();
    const email = $("#email").value.trim();
    const message = $("#message").value.trim();

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (name.length < 2) return (helper.textContent = "El nombre debe tener al menos 2 caracteres.");
    if (!emailOk) return (helper.textContent = "Ingresa un email válido.");
    if (message.length < 10) return (helper.textContent = "El mensaje debe tener al menos 10 caracteres.");

    helper.textContent = "";
    form.reset();
    showToast("Mensaje enviado ✔");
  });
})();

// ---------- Horarios (UTC-5 Ecuador) ----------
// Reglas: Lunes, Martes, Miércoles, Jueves, Viernes y Domingo: 21:45–01:00 (del siguiente día).
// Sábado: Descanso.
(function schedule() {
  const tbody = $("#schedule-body");
  if (!tbody) return;

  const tz = "America/Guayaquil"; // UTC-5
  const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  // Definición de rango
  // h24:m -> objeto {start:{h,m}, end:{h,m}, off:boolean}
  const scheduleMap = {
    0: { start: { h: 21, m: 45 }, end: { h: 1, m: 0 }, off: false }, // Domingo
    1: { start: { h: 21, m: 45 }, end: { h: 1, m: 0 }, off: false }, // Lunes
    2: { start: { h: 21, m: 45 }, end: { h: 1, m: 0 }, off: false }, // Martes
    3: { start: { h: 21, m: 45 }, end: { h: 1, m: 0 }, off: false }, // Miércoles
    4: { start: { h: 21, m: 45 }, end: { h: 1, m: 0 }, off: false }, // Jueves
    5: { start: { h: 21, m: 45 }, end: { h: 1, m: 0 }, off: false }, // Viernes
    6: { start: null, end: null, off: true } // Sábado
  };

  function nowInTZ() {
    // Obtenemos hora local en la zona "America/Guayaquil"
    const fmt = new Intl.DateTimeFormat("es-EC", {
      timeZone: tz,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    const parts = Object.fromEntries(fmt.formatToParts(new Date()).map(p => [p.type, p.value]));
    // parts: {year, month, day, hour, minute, second}
    return {
      y: +parts.year, mo: +parts.month, d: +parts.day,
      h: +parts.hour, m: +parts.minute, s: +parts.second
    };
  }

  function isLiveAt(dow, now) {
    const rule = scheduleMap[dow];
    if (!rule || rule.off) return false;

    const start = rule.start; // {h,m}
    const end = rule.end;

    // Crear fechas en TZ (aproximación usando números)
    const startMins = start.h * 60 + start.m;
    const endMins = end.h * 60 + end.m;

    const nowMins = now.h * 60 + now.m;

    if (endMins <= startMins) {
      // Cruza medianoche (ej. 21:45 -> 01:00)
      // En el mismo día: desde start hasta 23:59
      // Y también desde 00:00 hasta end del día siguiente.
      // Caso A: hoy entre start y 23:59
      if (nowMins >= startMins) return true;
      // Caso B: después de medianoche, antes de end,
      // pero eso cuenta como "en vivo" del día anterior.
      // Para contemplarlo cuando hoy es el día SIGUIENTE al "dow":
      const prev = (dow + 6) % 7; // día anterior
      const prevRule = scheduleMap[prev];
      if (prevRule && !prevRule.off) {
        const prevEndMins = prevRule.end.h * 60 + prevRule.end.m;
        const prevStartMins = prevRule.start.h * 60 + prevRule.start.m;
        if (prevEndMins <= prevStartMins) {
          // El día anterior también cruza medianoche → válido
          if (nowMins < endMins) return true;
        }
      }
      return false;
    } else {
      // No cruza medianoche
      return nowMins >= startMins && nowMins < endMins;
    }
  }

  function render() {
    const now = nowInTZ();

    tbody.innerHTML = "";
    for (let i = 0; i < 7; i++) {
      const rule = scheduleMap[i];
      const tr = document.createElement("tr");

      const tdDay = document.createElement("td");
      tdDay.textContent = days[i];

      const tdTime = document.createElement("td");
      if (rule.off) {
        tdTime.textContent = "—";
      } else {
        tdTime.textContent = `${formatTime(rule.start.h, rule.start.m)} – ${formatTime(rule.end.h, rule.end.m)}`;
      }

      const tdState = document.createElement("td");
      if (rule.off) {
        tdState.textContent = "Descanso";
      } else {
        // estado relativo al DÍA mostrado
        let live = false;
        // Caso especial: si estamos en madrugada (00:00–01:00), el vivo corresponde al día anterior.
        // isLiveAt(i, now) ya contempla este cruce. Solo marcamos "En directo" en la fila del día actual o del anterior según corresponda visualmente.
        // Para simplificar experiencia, mostraremos "Próximo" excepto en el día actual cuando realmente esté en vivo.
        const fmtDow = new Intl.DateTimeFormat("es-EC", { timeZone: tz, weekday: "long" }).format(new Date()).toLowerCase();
        const todayIndex = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"].indexOf(fmtDow);
        if (i === todayIndex) {
          live = isLiveAt(i, now);
          if (live) tr.classList.add("active");
        }
        tdState.textContent = live ? "En directo ahora" : "Próximo";
      }

      tr.append(tdDay, tdTime, tdState);
      tbody.appendChild(tr);
    }
  }

  render();
  // Actualiza cada minuto
  setInterval(render, 60 * 1000);
})();
