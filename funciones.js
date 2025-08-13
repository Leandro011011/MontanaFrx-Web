/* ========= Helpers ========= */
const $ = (s, scope=document) => scope.querySelector(s);
const $$ = (s, scope=document) => [...scope.querySelectorAll(s)];
const toast = (msg) => {
  const el = $('#toast');
  if (!el) return alert(msg);
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 2200);
};

/* ========= Navbar burger ========= */
(() => {
  const btn = $('#nav-toggle');
  const list = $('#nav-menu');
  if (!btn || !list) return;
  btn.addEventListener('click', () => {
    const open = list.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
})();

/* ========= Año en footer ========= */
(() => { const y = new Date().getFullYear(); $('#year') && ($('#year').textContent = y); })();

/* ========= Typewriter del lema ========= */
(() => {
  const el = $('#typewriter');
  if (!el) return;
  const text = '“BIENVENIDOS A LOS M, UNANSE A LOS M”';
  let i = 0;
  const tick = () => {
    el.textContent = text.slice(0, i++);
    if (i <= text.length) setTimeout(tick, 40);
  };
  // Si ya trae texto inicial, lo limpia antes del efecto
  el.textContent = '';
  tick();
})();

/* ========= Schema.org Person ========= */
(() => {
  const node = $('#schema-person');
  if (!node) return;
  const schema = {
    "@context":"https://schema.org",
    "@type":"Person",
    "name":"MontanaFrx",
    "url":"https://leandro011011.github.io/MontanaFrx-Web/",
    "image":"monta.jpeg",
    "sameAs":[
      "https://kick.com/montanafrx",
      "https://www.instagram.com/montanafrx",
      "https://www.tiktok.com/@kick.montanafrx",
      "https://x.com/Montanafrx",
      "https://discord.gg/sxcJVwzK8Z"
    ]
  };
  node.textContent = JSON.stringify(schema);
})();

/* ===================== HORARIOS ===================== */
/*
  Pedido:
  - Lunes 21:45–01:00 (UTC-5)
  - Martes, Miércoles, Jueves, Viernes y Domingo: igual que lunes
  - Sábado: descanso
*/
const SCHEDULE = [
  { day:'Domingo',   start:'21:45', end:'01:00', active:true },
  { day:'Lunes',     start:'21:45', end:'01:00', active:true },
  { day:'Martes',    start:'21:45', end:'01:00', active:true },
  { day:'Miércoles', start:'21:45', end:'01:00', active:true },
  { day:'Jueves',    start:'21:45', end:'01:00', active:true },
  { day:'Viernes',   start:'21:45', end:'01:00', active:true },
  { day:'Sábado',    start:'—',     end:'',      active:false }
];

const hmToMin = (hhmm) => {
  if (hhmm === '—') return 0;
  const [h, m] = hhmm.split(':').map(Number);
  return h*60 + m;
};

// Hora actual calculada para UTC-5 (Ecuador)
function ecuNow(){
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset()*60000;
  return new Date(utcMs + (-5*60*60000));
}

// ¿Ahora está dentro del rango de un día concreto (maneja medianoche)?
function inRangeForDay(dayIdx, startHM, endHM){
  if (startHM === '—') return false;
  const now = ecuNow();
  const nowDay = now.getDay(); // 0..6 = Dom..Sáb
  const nowMin = now.getHours()*60 + now.getMinutes();
  const s = hmToMin(startHM), e = hmToMin(endHM);

  if (s < e) { // no cruza medianoche
    return (dayIdx === nowDay) && (nowMin >= s && nowMin < e);
  }
  // cruza medianoche: [s..24h) pertenece a dayIdx; [0..e) a nextDay
  const nextDay = (dayIdx + 1) % 7;
  const late = (dayIdx === nowDay) && (nowMin >= s);
  const early = (nextDay === nowDay) && (nowMin < e);
  return late || early;
}

function renderSchedule(){
  const tbody = $('#schedule-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  SCHEDULE.forEach((row, idx) => {
    const live = row.active && inRangeForDay(idx, row.start, row.end);
    const tr = document.createElement('tr');
    if (live) tr.classList.add('active');
    tr.innerHTML = `
      <td>${row.day}</td>
      <td>${row.active ? `${row.start} – ${row.end}` : '—'}</td>
      <td>${row.active ? (live ? '<span class="badge-live">En directo ahora</span>' : 'Próximo') : 'Descanso'}</td>
    `;
    tbody.appendChild(tr);
  });
}
renderSchedule();
setInterval(renderSchedule, 60*1000);

/* ===================== FORM CONTACTO ===================== */
(() => {
  const form = $('#contact-form'); if (!form) return;
  const helper = $('#form-helper');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#name').value.trim();
    const email = $('#email').value.trim();
    const message = $('#message').value.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (name.length < 2) { helper.textContent = 'El nombre debe tener al menos 2 caracteres.'; return; }
    if (!emailOk) { helper.textContent = 'Ingresa un email válido.'; return; }
    if (message.length < 10) { helper.textContent = 'El mensaje debe tener al menos 10 caracteres.'; return; }

    helper.textContent = '';
    toast('Mensaje enviado ✔');
    form.reset();
  });
})();
