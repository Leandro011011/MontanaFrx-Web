/* ========== Utilidades básicas ========== */
const $ = (s, scope=document) => scope.querySelector(s);
const $$ = (s, scope=document) => [...scope.querySelectorAll(s)];
const toast = (msg) => {
  const el = $('#toast');
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 2200);
};

/* ===== Navbar burger ===== */
(() => {
  const btn = $('.nav-toggle');
  const list = $('#nav-menu');
  if (!btn || !list) return;
  btn.addEventListener('click', () => {
    const open = list.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
})();

/* ===== Año en footer ===== */
(() => { const y = new Date().getFullYear(); $('#year').textContent = y; })();

/* ===== Typewriter del lema ===== */
(() => {
  const el = $('#typewriter');
  if (!el) return;
  const text = '“BIENVENIDOS A LOS M, UNANSE A LOS M”';
  let i = 0;
  const tick = () => {
    el.textContent = text.slice(0, i++);
    if (i <= text.length) setTimeout(tick, 40);
  };
  tick();
})();

/* ===== Schema.org Person ===== */
(() => {
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
  $('#schema-person').textContent = JSON.stringify(schema);
})();

/* ========== HORARIOS ========== */
/*
  Horario pedido:
  - Lunes 21:45–01:00 (UTC-5)
  - Martes, Miércoles, Jueves, Viernes y Domingo: igual que lunes
  - Sábado: descanso
*/
const SCHEDULE = [
  { day: 'Domingo',   start: '21:45', end: '01:00', active: true },
  { day: 'Lunes',     start: '21:45', end: '01:00', active: true },
  { day: 'Martes',    start: '21:45', end: '01:00', active: true },
  { day: 'Miércoles', start: '21:45', end: '01:00', active: true },
  { day: 'Jueves',    start: '21:45', end: '01:00', active: true },
  { day: 'Viernes',   start: '21:45', end: '01:00', active: true },
  { day: 'Sábado',    start: '—',     end: '',      active: false }
];

// Convierte "21:45" a minutos desde 0:00
const hmToMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

// ¿Está ahora “en directo”? Maneja rangos que cruzan medianoche.
const nowInRange = (startHM, endHM, utcOffset = -5) => {
  // Hora local del usuario (asumimos que el horario está en UTC-5)
  const now = new Date();
  // Ajustamos a UTC-5 creando una fecha basada en UTC y sumando offset
  const utc = now.getTime() + now.getTimezoneOffset()*60000;
  const localEcu = new Date(utc + (utcOffset*60*60000));

  const minutesNow = localEcu.getHours()*60 + localEcu.getMinutes();
  const start = hmToMin(startHM);
  const end   = hmToMin(endHM);

  if (startHM === '—') return false;

  // Caso normal mismo día
  if (end > start) return minutesNow >= start && minutesNow < end;

  // Cruza medianoche, ej: 21:45 -> 01:00
  return (minutesNow >= start && minutesNow <= 1439) || (minutesNow >= 0 && minutesNow < end);
};

const renderSchedule = () => {
  const tbody = $('#schedule-body');
  tbody.innerHTML = '';
  // Día de la semana en español (0=Domingo…6=Sábado) respecto a UTC-5
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset()*60000;
  const ecu = new Date(utc + (-5*60*60000));
  const ecuDay = ecu.getDay(); // 0..6

  SCHEDULE.forEach((row, idx) => {
    const tr = document.createElement('tr');
    let estado = 'Fuera de horario';
    let isLive = false;

    if (row.active) {
      isLive = nowInRange(row.start, row.end, -5) &&
               // Marca live si el día corresponde. Como el rango cruza 00:00,
               // también consideramos la madrugada del día siguiente.
               (idx === ecuDay || (idx === (ecuDay+6)%7 && hmToMin(row.end) > 0));
      estado = isLive ? 'En directo ahora' : 'Próximo';
    } else {
      estado = 'Descanso';
    }

    if (isLive) tr.classList.add('active');

    tr.innerHTML = `
      <td>${row.day}</td>
      <td>${row.active ? `${row.start} – ${row.end}` : '—'}</td>
      <td>${isLive ? '<span class="badge-live">En directo ahora</span>' : estado}</td>
    `;
    tbody.appendChild(tr);
  });
};
renderSchedule();
setInterval(renderSchedule, 60*1000); // refresca cada minuto

/* ========== CLIPS (CRUD con ventana externa) ========== */
const CLIPS_KEY = 'clips';
const defaultClips = [
  { id: crypto.randomUUID(), title: 'Clip: charlas con la comunidad', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumb: '', local:false, createdAt: Date.now() },
  { id: crypto.randomUUID(), title: 'IRL: paseo nocturno',            url: 'https://www.youtube.com/watch?v=oHg5SJYRHA0',   thumb: '', local:false, createdAt: Date.now() }
];

const getClips = () => {
  try {
    const raw = localStorage.getItem(CLIPS_KEY);
    if (!raw) {
      localStorage.setItem(CLIPS_KEY, JSON.stringify(defaultClips));
      return defaultClips;
    }
    return JSON.parse(raw);
  } catch { return defaultClips; }
};
const setClips = (arr) => localStorage.setItem(CLIPS_KEY, JSON.stringify(arr));

const clipCard = (clip) => {
  const isVideo = clip.url.startsWith('blob:') || clip.url.match(/\.(mp4|webm|mov)(\?|$)/i);
  const media = isVideo
    ? `<video class="thumb" src="${clip.url}" controls preload="metadata"></video>`
    : `<img class="thumb" src="https://img.youtube.com/vi/${ytId(clip.url)}/hqdefault.jpg" alt="Miniatura clip">`;

  const localBadge = clip.local ? ' <span class="badge-local" title="Solo en esta sesión">local</span>' : '';

  return `
    <article class="card" role="listitem" data-id="${clip.id}">
      ${media}
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(clip.title)}${localBadge}</h3>
        <div class="card-actions">
          <a class="btn btn-small" href="${clip.url}" target="_blank" rel="noopener">Ver clip</a>
          <button class="icon-btn js-edit" title="Editar">
            ${pencilSvg}
          </button>
          <button class="icon-btn js-delete" title="Eliminar">
            ${trashSvg}
          </button>
        </div>
      </div>
    </article>
  `;
};

const renderClips = () => {
  const grid = $('#clip-grid');
  const clips = getClips().sort((a,b)=>b.createdAt-a.createdAt);
  grid.innerHTML = clips.map(clipCard).join('') || `<p class="muted">Aún no hay clips. Agrega uno con el botón "➕ Agregar clip".</p>`;

  // acciones
  $$('#clip-grid .js-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.closest('[data-id]').dataset.id;
      openClipEditor('edit', id);
    });
  });
  $$('#clip-grid .js-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.closest('[data-id]').dataset.id;
      if (confirm('¿Seguro que quieres eliminar este clip?')) {
        const list = getClips().filter(c => c.id !== id);
        setClips(list);
        renderClips();
        toast('Clip eliminado');
      }
    });
  });
};
renderClips();

$('#btn-add-clip')?.addEventListener('click', () => openClipEditor('add'));

// Abre una nueva ventana con un formulario de agregar/editar.
// En GH Pages no hay backend: si se sube un archivo local, se usa URL.createObjectURL (solo sesión actual).
function openClipEditor(mode='add', id=null){
  const clip = mode==='edit' ? getClips().find(c=>c.id===id) : {title:'',url:'',thumb:'',local:false};
  const w = window.open('', '_blank', 'width=520,height=640');
  if (!w) return alert('El bloqueador de ventanas impidió abrir el editor.');

  w.document.title = (mode==='add'?'Agregar':'Editar') + ' clip';
  w.document.body.style = 'margin:0;font-family:Inter,system-ui,Segoe UI,Roboto,Arial,sans-serif;background:#0B0B0B;color:#F3F4F6';

  w.document.body.innerHTML = `
    <div style="padding:16px">
      <h2 style="font-family:Poppins;margin:0 0 10px">${mode==='add'?'Agregar':'Editar'} clip</h2>
      <p style="color:#9CA3AF;margin-top:0">Puedes pegar una URL (Kick/YouTube) o seleccionar un video local para esta sesión.</p>

      <label>Título</label>
      <input id="f-title" type="text" value="${escapeAttr(clip?.title||'')}" style="width:100%;padding:10px;border-radius:10px;border:1px solid #374151;background:#111317;color:#F3F4F6;margin:6px 0 12px" />

      <label>URL del clip</label>
      <input id="f-url" type="url" placeholder="https://…" value="${escapeAttr(clip?.url||'')}" style="width:100%;padding:10px;border-radius:10px;border:1px solid #374151;background:#111317;color:#F3F4F6;margin:6px 0 12px" />

      <div style="margin:8px 0 14px">
        <label>o seleccionar video local</label><br/>
        <input id="f-file" type="file" accept="video/*" style="margin-top:6px"/>
        <div id="preview" style="margin-top:10px"></div>
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button id="btn-save" style="padding:10px 14px;border-radius:10px;border:1px solid #374151;background:#12141a;color:#F3F4F6;cursor:pointer">Guardar</button>
        <button id="btn-cancel" style="padding:10px 14px;border-radius:10px;border:1px solid #374151;background:#111317;color:#9CA3AF;cursor:pointer">Cancelar</button>
      </div>
      <p style="color:#9CA3AF;margin-top:10px;font-size:.9rem">Nota: los videos locales usan URL <code>blob:</code> y no persisten tras recargar.</p>
    </div>
  `;

  const fTitle = w.document.getElementById('f-title');
  const fUrl   = w.document.getElementById('f-url');
  const fFile  = w.document.getElementById('f-file');
  const prev   = w.document.getElementById('preview');

  const renderPreview = (src) => {
    prev.innerHTML = src ? `<video src="${src}" controls style="width:100%;border-radius:10px;border:1px solid #374151"></video>` : '';
  };
  if (clip && (clip.url.startsWith('blob:') || /\.(mp4|webm|mov)(\?|$)/i.test(clip.url))) {
    renderPreview(clip.url);
  }

  let blobUrl = '';
  fFile.addEventListener('change', () => {
    const file = fFile.files?.[0];
    if (file) {
      blobUrl = URL.createObjectURL(file);
      renderPreview(blobUrl);
      fUrl.value = blobUrl; // priorizamos el video local en esta sesión
    }
  });

  w.document.getElementById('btn-cancel').onclick = () => w.close();

  w.document.getElementById('btn-save').onclick = () => {
    const title = fTitle.value.trim();
    const url = fUrl.value.trim();

    if (!title) { alert('Pon un título'); return; }
    if (!url)   { alert('Proporciona una URL o elige un archivo'); return; }

    const all = getClips();
    if (mode==='add') {
      all.push({ id: crypto.randomUUID(), title, url, thumb:'', local:url.startsWith('blob:'), createdAt: Date.now() });
    } else {
      const idx = all.findIndex(c=>c.id===id);
      if (idx>-1){
        all[idx] = { ...all[idx], title, url, local:url.startsWith('blob:'), updatedAt: Date.now() };
      }
    }
    setClips(all);
    renderClips();
    toast(mode==='add'?'Clip agregado':'Clip actualizado');
    w.close();
  };
}

/* ===== Helpers ===== */
function ytId(url){
  try{
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v') || '';
  }catch{}
  return '';
}
function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function escapeAttr(s){return escapeHtml(String(s)).replace(/"/g,'&quot;')}

const pencilSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M4 20l4-1 9-9-3-3-9 9-1 4zM14 5l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const trashSvg  = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V5h6v2M7 7l1 12h8l1-12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/* ========== Formulario de contacto (validación simple) ========== */
(() => {
  const form = $('#contact-form');
  if (!form) return;
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
})();
