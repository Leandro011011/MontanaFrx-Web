/* ===== Helpers ===== */
const $ = (s, scope=document) => scope.querySelector(s);
const $$ = (s, scope=document) => [...scope.querySelectorAll(s)];
const escapeHtml = s => s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast = (msg) => { const t=$('#toast'); t.textContent=msg; t.style.display='block'; setTimeout(()=>t.style.display='none', 2200); };

/* ===== Navbar burger ===== */
(() => {
  const btn = $('.nav-toggle'), list = $('#nav-menu');
  if(!btn || !list) return;
  btn.addEventListener('click', () => {
    const open=list.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
})();

/* ===== Año footer ===== */ (()=>$('#year').textContent=new Date().getFullYear())();

/* ===== Typewriter ===== */
(() => {
  const el=$('#typewriter'); if(!el) return;
  const text='“BIENVENIDOS A LOS M, UNANSE A LOS M”'; let i=0;
  (function tick(){ el.textContent=text.slice(0, i++); if(i<=text.length) setTimeout(tick, 40); })();
})();

/* ===== Schema Person ===== */
(() => {
  $('#schema-person').textContent = JSON.stringify({
    "@context":"https://schema.org","@type":"Person","name":"MontanaFrx",
    "url":"https://leandro011011.github.io/MontanaFrx-Web/","image":"monta.jpeg",
    "sameAs":[ "https://kick.com/montanafrx","https://www.instagram.com/montanafrx",
      "https://www.tiktok.com/@kick.montanafrx","https://x.com/Montanafrx","https://discord.gg/sxcJVwzK8Z" ]
  });
})();

/* ================= HORARIOS ================= */
const SCHEDULE = [
  { day:'Domingo',   start:'21:45', end:'01:00', active:true },
  { day:'Lunes',     start:'21:45', end:'01:00', active:true },
  { day:'Martes',    start:'21:45', end:'01:00', active:true },
  { day:'Miércoles', start:'21:45', end:'01:00', active:true },
  { day:'Jueves',    start:'21:45', end:'01:00', active:true },
  { day:'Viernes',   start:'21:45', end:'01:00', active:true },
  { day:'Sábado',    start:'—',     end:'',      active:false }
];
const hmToMin = s => { if(s==='—') return 0; const [h,m]=s.split(':').map(Number); return h*60+m; };

function ecuNow(){
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset()*60000;
  return new Date(utc + (-5*60*60000)); // UTC-5
}

function inRangeForDay(dayIdx, startHM, endHM){
  if(startHM==='—') return false;
  const now = ecuNow();
  const nowDay = now.getDay();          // 0..6 (Domingo..Sábado)
  const nm = now.getHours()*60 + now.getMinutes();
  const s = hmToMin(startHM), e = hmToMin(endHM);

  if (s < e) { // mismo día
    return (dayIdx === nowDay) && (nm >= s && nm < e);
  }
  // cruza medianoche: [s, 1440) pertenece a dayIdx; [0, e) a (dayIdx+1)%7
  const next = (dayIdx+1) % 7;
  const inLate = (dayIdx === nowDay) && (nm >= s && nm <= 1439);
  const inEarly = (next   === nowDay) && (nm >= 0 && nm < e);
  return inLate || inEarly;
}

function renderSchedule(){
  const tbody = $('#schedule-body'); tbody.innerHTML='';
  SCHEDULE.forEach((row, i) => {
    const live = row.active && inRangeForDay(i, row.start, row.end);
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

/* ================= CLIPS (CRUD con modal) ================= */
const CLIPS_KEY='clips';
const defaultClips=[{id:crypto.randomUUID(),title:'Clip: charlas con la comunidad',url:'https://www.youtube.com/watch?v=dQw4w9WgXcQ',local:false,createdAt:Date.now()}];

const getClips = () => {
  try{
    const raw=localStorage.getItem(CLIPS_KEY);
    if(!raw){ localStorage.setItem(CLIPS_KEY, JSON.stringify(defaultClips)); return defaultClips; }
    return JSON.parse(raw);
  }catch{ return defaultClips; }
};
const setClips = (arr) => localStorage.setItem(CLIPS_KEY, JSON.stringify(arr));

const isVideoFile = (url) => url.startsWith('blob:') || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
const ytId = (url) => { try{ const u=new URL(url); if(u.hostname.includes('youtu.be'))return u.pathname.slice(1); if(u.hostname.includes('youtube.com')) return u.searchParams.get('v')||''; }catch{} return ''; };

const pencilSvg = `<svg viewBox="0 0 24 24" fill="none"><path d="M4 20l4-1 9-9-3-3-9 9-1 4zM14 5l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const trashSvg  = `<svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V5h6v2M7 7l1 12h8l1-12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function clipCard(clip){
  const media = isVideoFile(clip.url)
    ? `<video class="thumb" src="${clip.url}" controls preload="metadata"></video>`
    : (ytId(clip.url)
        ? `<img class="thumb" src="https://img.youtube.com/vi/${ytId(clip.url)}/hqdefault.jpg" alt="Miniatura del clip">`
        : `<img class="thumb" src="monta.jpeg" alt="Miniatura del clip">`);
  const localBadge = clip.local ? ' <span class="badge-local">local</span>' : '';
  return `
    <article class="card" role="listitem" data-id="${clip.id}">
      ${media}
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(clip.title)}${localBadge}</h3>
        <div class="card-actions">
          <a class="btn btn-small" href="${clip.url}" target="_blank" rel="noopener">Ver clip</a>
          <button class="icon-btn js-edit" title="Editar">${pencilSvg}</button>
          <button class="icon-btn js-delete" title="Eliminar">${trashSvg}</button>
        </div>
      </div>
    </article>
  `;
}

function renderClips(){
  const grid = $('#clip-grid');
  const list = getClips().sort((a,b)=>b.createdAt-a.createdAt);
  grid.innerHTML = list.map(clipCard).join('') || `<p class="muted">Aún no hay clips. Agrega uno con “➕ Agregar clip”.</p>`;
  // bind acciones
  $$('#clip-grid .js-edit').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const id=e.currentTarget.closest('[data-id]').dataset.id;
      openClipModal('edit', id);
    });
  });
  $$('#clip-grid .js-delete').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const id=e.currentTarget.closest('[data-id]').dataset.id;
      if(confirm('¿Seguro que quieres eliminar este clip?')){
        setClips(getClips().filter(c=>c.id!==id));
        renderClips(); toast('Clip eliminado');
      }
    });
  });
}
renderClips();

$('#btn-add-clip')?.addEventListener('click', ()=>openClipModal('add'));

/* ===== Modal ===== */
const modal = $('#clip-modal');
const modalTitle = $('#clip-modal-title');
const modalClose = $('#clip-modal-close');
const modalCancel = $('#clip-cancel');
const form = $('#clip-form');
const fId = $('#clip-id'), fTitle = $('#clip-title'), fUrl = $('#clip-url'), fFile = $('#clip-file'), fPrev = $('#clip-preview');

function openClipModal(mode='add', id=null){
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';

  if(mode==='edit'){
    const clip = getClips().find(c=>c.id===id);
    modalTitle.textContent='Editar clip';
    fId.value = clip.id;
    fTitle.value = clip.title;
    fUrl.value = clip.url;
    renderPreview(clip.url);
  }else{
    modalTitle.textContent='Agregar clip';
    fId.value=''; fTitle.value=''; fUrl.value=''; fFile.value=''; fPrev.innerHTML='';
  }
  fTitle.focus();
}

function closeClipModal(){
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
  fPrev.innerHTML='';
}

modalClose?.addEventListener('click', closeClipModal);
modal.addEventListener('click', (e)=>{ if(e.target===modal) closeClipModal(); });
modalCancel?.addEventListener('click', closeClipModal);

function renderPreview(src){
  if(!src){ fPrev.innerHTML=''; return; }
  if(isVideoFile(src)) fPrev.innerHTML=`<video src="${src}" controls></video>`;
  else if(ytId(src))   fPrev.innerHTML=`<img src="https://img.youtube.com/vi/${ytId(src)}/hqdefault.jpg" alt="Miniatura">`;
  else                 fPrev.innerHTML=`<img src="monta.jpeg" alt="Miniatura">`;
}

let blobUrl='';
fFile.addEventListener('change', ()=>{
  const file = fFile.files?.[0];
  if(file){
    if(blobUrl) URL.revokeObjectURL(blobUrl);
    blobUrl = URL.createObjectURL(file);
    fUrl.value = blobUrl; // priorizamos archivo local
    renderPreview(blobUrl);
  }
});

form.addEventListener('submit', (e)=>{
  e.preventDefault();
  const id = fId.value.trim();
  const title = fTitle.value.trim();
  const url = fUrl.value.trim();

  if(!title){ toast('Pon un título'); fTitle.focus(); return; }
  if(!url){ toast('Pega una URL o selecciona un archivo'); return; }

  const list = getClips();
  if(id){ // editar
    const i = list.findIndex(c=>c.id===id);
    if(i>-1) list[i] = { ...list[i], title, url, local:url.startsWith('blob:'), updatedAt: Date.now() };
    toast('Clip actualizado');
  }else{ // agregar
    list.push({ id: crypto.randomUUID(), title, url, local:url.startsWith('blob:'), createdAt: Date.now() });
    toast('Clip agregado');
  }
  setClips(list);
  renderClips();
  closeClipModal();
});

/* ===== Contacto ===== */
(() => {
  const form = $('#contact-form'); if(!form) return;
  const helper = $('#form-helper');
  form.addEventListener('submit', e=>{
    e.preventDefault();
    const name=$('#name').value.trim(), email=$('#email').value.trim(), message=$('#message').value.trim();
    const emailOk=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if(name.length<2){ helper.textContent='El nombre debe tener al menos 2 caracteres.'; return; }
    if(!emailOk){ helper.textContent='Ingresa un email válido.'; return; }
    if(message.length<10){ helper.textContent='El mensaje debe tener al menos 10 caracteres.'; return; }
    helper.textContent=''; toast('Mensaje enviado ✔'); form.reset();
  });
})();
