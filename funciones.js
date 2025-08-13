/* ========= Helpers ========= */
const $ = (s, scope=document) => scope.querySelector(s);
const $$ = (s, scope=document) => [...scope.querySelectorAll(s)];
const toast = (msg) => {
  const el = $('#toast'); if(!el){ alert(msg); return; }
  el.textContent = msg; el.style.display = 'block';
  setTimeout(()=> el.style.display = 'none', 2200);
};

/* ========= Navbar burger ========= */
document.addEventListener('DOMContentLoaded', () => {
  const btn = $('#nav-toggle');
  const list = $('#nav-menu');
  if (btn && list) {
    btn.addEventListener('click', () => {
      const open = list.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
  }
});

/* ========= Año footer ========= */
document.addEventListener('DOMContentLoaded', () => {
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
});

/* ========= Typewriter del lema ========= */
document.addEventListener('DOMContentLoaded', () => {
  const el = $('#typewriter'); if (!el) return;
  const text = '“BIENVENIDOS A LOS M, UNANSE A LOS M”';
  let i = 0; el.textContent = '';
  const tick = () => { el.textContent = text.slice(0, i++); if (i <= text.length) setTimeout(tick, 40); };
  tick();
});

/* ========= Schema.org Person ========= */
document.addEventListener('DOMContentLoaded', () => {
  const node = $('#schema-person'); if (!node) return;
  node.textContent = JSON.stringify({
    "@context":"https://schema.org","@type":"Person","name":"MontanaFrx",
    "url":"https://leandro011011.github.io/MontanaFrx-Web/","image":"monta.jpeg",
    "sameAs":[
      "https://kick.com/montanafrx",
      "https://www.instagram.com/montanafrx",
      "https://www.tiktok.com/@kick.montanafrx",
      "https://x.com/Montanafrx",
      "https://discord.gg/sxcJVwzK8Z"
    ]
  });
});

/* ===================== HORARIOS ===================== */
/*
  - Lunes 21:45–01:00
  - Martes/Miércoles/Jueves/Viernes/Domingo = igual
  - Sábado = descanso
  - Zona: UTC-5 (Ecuador)
*/
const SCHEDULE = [
  { dayIndex: 0, day:'Domingo',   start:'21:45', end:'01:00', active:true  },
  { dayIndex: 1, day:'Lunes',     start:'21:45', end:'01:00', active:true  },
  { dayIndex: 2, day:'Martes',    start:'21:45', end:'01:00', active:true  },
  { dayIndex: 3, day:'Miércoles', start:'21:45', end:'01:00', active:true  },
  { dayIndex: 4, day:'Jueves',    start:'21:45', end:'01:00', active:true  },
  { dayIndex: 5, day:'Viernes',   start:'21:45', end:'01:00', active:true  },
  { dayIndex: 6, day:'Sábado',    start:'—',     end:'',      active:false }
];

const hmToMin = (hhmm) => {
  if (!hhmm || hhmm === '—') return 0;
  const [h, m] = hhmm.split(':').map(Number);
  return (h*60 + m) % (24*60);
};

// Hora “actual” convertida a UTC-5 sin depender del huso del navegador
function ecuNow(){
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset()*60000;
  return new Date(utcMs + (-5*60*60000)); // UTC-5
}

// Determina si AHORA cae dentro del bloque del día dado, manejando cruce de medianoche
function isLiveNowFor(dayIdx, startHM, endHM){
  if (!startHM || startHM === '—') return false;

  const now = ecuNow();
  const nowDay = now.getDay(); // 0..6 (Dom..Sáb)
  const nowMin = now.getHours()*60 + now.getMinutes();
  const s = hmToMin(startHM), e = hmToMin(endHM);

  if (s < e) {
    // Ej. 10:00–14:00 (mismo día)
    return (dayIdx === nowDay) && (nowMin >= s && nowMin < e);
  }
  // Cruza medianoche (ej. 21:45–01:00):
  // - Tramo tarde del mismo día: [s..1440) → día = dayIdx
  // - Tramo temprano del día siguiente: [0..e) → día = nextIdx
  const nextIdx = (dayIdx + 1) % 7;
  const inLate = (dayIdx === nowDay) && (nowMin >= s && nowMin <= 1439);
  const inEarly = (nextIdx === nowDay) && (nowMin >= 0 && nowMin < e);
  return inLate || inEarly;
}

function renderSchedule(){
  const tbody = $('#schedule-body'); if (!tbody) return;
  tbody.innerHTML = '';
  for (const row of SCHEDULE){
    const live = row.active && isLiveNowFor(row.dayIndex, row.start, row.end);
    const tr = document.createElement('tr');
    if (live) tr.classList.add('active');
    tr.innerHTML = `
      <td>${row.day}</td>
      <td>${row.active ? `${row.start} – ${row.end}` : '—'}</td>
      <td>${row.active ? (live ? '<span class="badge-live">En directo ahora</span>' : 'Próximo') : 'Descanso'}</td>
    `;
    tbody.appendChild(tr);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderSchedule();
  // Recalcula cada minuto
  setInterval(renderSchedule, 60*1000);
});

/* ===================== FORM CONTACTO ===================== */
document.addEventListener('DOMContentLoaded', () => {
  const form = $('#contact-form'); if (!form) return;
  const helper = $('#form-helper');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#name').value.trim();
    const email = $('#email').value.trim();
    const message = $('#message').value.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (name.length < 2){ helper.textContent = 'El nombre debe tener al menos 2 caracteres.'; return; }
    if (!emailOk){ helper.textContent = 'Ingresa un email válido.'; return; }
    if (message.length < 10){ helper.textContent = 'El mensaje debe tener al menos 10 caracteres.'; return; }

    helper.textContent = '';
    toast('Mensaje enviado ✔');
    form.reset();
  });
});
