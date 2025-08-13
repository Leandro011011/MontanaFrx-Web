/* ===== Utilidades ===== */
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

/* ===== Navbar (burger + scroll suave) ===== */
(function setupNav(){
  const toggle = $('.nav-toggle');
  const menu = $('#nav-menu');
  toggle.addEventListener('click', ()=>{
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  $$('.nav-list a').forEach(a=>a.addEventListener('click', ()=>{
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded','false');
  }));
})();
$$('[href^="#"], [data-scroll]').forEach(el=>{
  el.addEventListener('click', (e)=>{
    const hash = el.getAttribute('href') || el.getAttribute('data-scroll');
    if(hash && hash.startsWith('#')){
      e.preventDefault();
      document.querySelector(hash)?.scrollIntoView({behavior:'smooth'});
    }
  });
});

/* ===== Typewriter del lema ===== */
(function typewriter(){
  const text = 'BIENVENIDOS A LOS M, UNANSE A LOS M';
  const el = $('#typewriter');
  let i = 0;
  function tick(){
    el.textContent = text.slice(0, i) + (i < text.length ? '|' : '');
    if(i < text.length){ i++; setTimeout(tick, 40); }
    else{ setTimeout(()=>{ el.textContent = text; }, 300); }
  }
  tick();
})();

/* ===== Horarios (UTC-5) ===== */
/* Edita aquí los horarios del canal */
const SCHEDULE = [
  { day: 'Lunes',     start: '20:00', end: '23:00' },
  { day: 'Martes',    start: '-',     end: '-'     },
  { day: 'Miércoles', start: '20:00', end: '23:00' },
  { day: 'Jueves',    start: '-',     end: '-'     },
  { day: 'Viernes',   start: '21:00', end: '00:00' },
  { day: 'Sábado',    start: '18:00', end: '22:00' },
  { day: 'Domingo',   start: '-',     end: '-'     },
];

function isNowWithinUTCMinus5Range(startStr, endStr){
  if(startStr==='-'||endStr==='-') return false;
  const now = new Date();
  // Hora actual en UTC-5:
  const utc = now.getTime() + (now.getTimezoneOffset()*60000);
  const nowUtcMinus5 = new Date(utc - 5*3600*1000);
  const [sh, sm] = startStr.split(':').map(Number);
  const [eh, em] = endStr.split(':').map(Number);
  const start = new Date(nowUtcMinus5); start.setHours(sh, sm, 0, 0);
  const end = new Date(nowUtcMinus5);
  // manejar cruce de medianoche
  if(eh < sh || (eh===sh && em < sm)){ end.setDate(end.getDate()+1); }
  end.setHours(eh, em, 0, 0);
  return nowUtcMinus5 >= start && nowUtcMinus5 <= end;
}

(function renderSchedule(){
  const tbody = $('#schedule-body');
  tbody.innerHTML = '';
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset()*60000);
  const nowUtcMinus5 = new Date(utc - 5*3600*1000);
  const weekday = nowUtcMinus5.getDay(); // 0=Domingo

  SCHEDULE.forEach((row)=>{
    const active = ( (weekday===0 && row.day==='Domingo') ||
                     (weekday===1 && row.day==='Lunes') ||
                     (weekday===2 && row.day==='Martes') ||
                     (weekday===3 && row.day==='Miércoles') ||
                     (weekday===4 && row.day==='Jueves') ||
                     (weekday===5 && row.day==='Viernes') ||
                     (weekday===6 && row.day==='Sábado') )
                    && isNowWithinUTCMinus5Range(row.start, row.end);

    const tr = document.createElement('tr');
    if(active) tr.classList.add('active');
    tr.innerHTML = `
      <td>${row.day}</td>
      <td>${row.start==='-' ? '—' : row.start} — ${row.end==='-' ? '—' : row.end}</td>
      <td>${active ? '<span class="badge-live">En directo ahora</span>' : '<span style="color:#9CA3AF">Fuera de horario</span>'}</td>
    `;
    tbody.appendChild(tr);
  });
})();

/* ===== Clips destacados ===== */
/* Reemplaza url con tus enlaces reales (Kick/YouTube) */
function neonThumb(text='CLIP'){
  const svg = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#00FF88'/><stop offset='1' stop-color='#31FFD5'/></linearGradient></defs>
    <rect width='800' height='450' fill='#0B0B0B'/>
    <rect x='12' y='12' width='776' height='426' rx='14' fill='#0f1115' stroke='#374151'/>
    <text x='50%' y='54%' font-family='Poppins,Arial' font-size='48' font-weight='700' fill='#00FF88' text-anchor='middle'>${text}</text>
  </svg>`);
  return `data:image/svg+xml;utf8,${svg}`;
}
const CLIPS = [
  { title:'Momentazo IRL en el centro',   thumb: neonThumb('IRL'),       url:'#' /* https://... */ },
  { title:'Clutch Among Us (impostor)',   thumb: neonThumb('AMONG US'),  url:'#' /* https://... */ },
  { title:'Reaccionando a nueva música',  thumb: neonThumb('MÚSICA'),    url:'#' /* https://... */ },
  { title:'Charla con la comunidad',      thumb: neonThumb('CHARLAS'),   url:'#' /* https://... */ },
  { title:'Setup tour edición 2025',      thumb: neonThumb('SETUP'),     url:'#' /* https://... */ },
  { title:'Fails y risas en stream',      thumb: neonThumb('FUN'),       url:'#' /* https://... */ },
];
(function renderClips(){
  const grid = $('#clip-grid');
  grid.innerHTML = '';
  CLIPS.forEach(c=>{
    const card = document.createElement('article');
    card.className = 'card';
    card.setAttribute('role','listitem');
    card.innerHTML = `
      <img class="thumb" src="${c.thumb}" alt="Thumbnail del clip: ${c.title}" loading="lazy" />
      <div class="card-body">
        <strong>${c.title}</strong>
        <div class="card-actions">
          <a class="btn-link" href="${c.url}" target="_blank" rel="noopener">Ver clip</a>
          <button class="btn glow" data-toast="Próximamente">Guardar</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
})();

/* ===== Contacto: validación + toast ===== */
function showToast(msg='Hecho'){
  const t = $('#toast');
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(()=>{ t.style.display = 'none'; }, 1800);
}
$('#contact-form').addEventListener('submit', e=>{
  e.preventDefault();
  const name = $('#name').value.trim();
  const email = $('#email').value.trim();
  const message = $('#message').value.trim();
  const helper = $('#form-helper');

  if(name.length < 2){ helper.textContent = 'El nombre debe tener al menos 2 caracteres.'; return; }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ helper.textContent = 'Ingrese un email válido.'; return; }
  if(message.length < 10){ helper.textContent = 'El mensaje debe tener al menos 10 caracteres.'; return; }
  helper.textContent = '¡Gracias! Responderemos pronto.';
  showToast('Mensaje enviado ✔');
  e.target.reset();
});

/* Delegación para botones con data-toast */
document.body.addEventListener('click', (e)=>{
  const btn = e.target.closest('[data-toast]');
  if(btn){ showToast(btn.getAttribute('data-toast')); }
});

/* ===== Footer: año actual ===== */
$('#year').textContent = new Date().getFullYear();

/* ===== Schema.org Person ===== */
(function injectSchema(){
  const json = {
    "@context":"https://schema.org",
    "@type":"Person",
    "name":"MontanaFrx",
    "description":"Streamer IRL y setup. Charlas, música y Among Us.",
    "image": "img/profile.jpg",
    "url":"https://kick.com/montanafrx",
    "sameAs":[
      "https://kick.com/montanafrx",
      "https://www.instagram.com/montanafrx?igsh=MXg0N2lhaGZkbXU4eA==",
      "https://www.tiktok.com/@kick.montanafrx",
      "https://x.com/Montanafrx?t=rWYu6o3qkm0tucrV5BC4kw&s=09",
      "https://discord.gg/sxcJVwzK8Z"
    ]
  };
  $('#schema-person').textContent = JSON.stringify(json);
})();
