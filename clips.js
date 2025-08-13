/*  CLIPS – CRUD con modal en la misma pestaña + localStorage
    Requiere en HTML:
    - Botón:   #btn-add-clip
    - Grid:    #clip-grid
    - Modal:   #clip-modal (con #clip-form, #clip-id, #clip-title, #clip-url, #clip-file, #clip-preview, #clip-modal-close, #clip-cancel)
    - Toast:   #toast (opcional; si no, usa alert)
*/
(function () {
  if (window.__clipsBound) return; // evita doble inicialización
  window.__clipsBound = true;

  const q  = (s, d=document)=> d.querySelector(s);
  const qa = (s, d=document)=> [...d.querySelectorAll(s)];
  const esc = (s)=> String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const toast = (msg)=>{ const t=q('#toast'); if(!t){ alert(msg); return; } t.textContent=msg; t.style.display='block'; setTimeout(()=>t.style.display='none',2200); };

  const CLIPS_KEY='clips';
  const defaultClips=[{id:crypto.randomUUID(), title:'Clip: charlas con la comunidad', url:'https://www.youtube.com/watch?v=dQw4w9WgXcQ', local:false, createdAt:Date.now()}];
  const getClips=()=>{ try{ const raw=localStorage.getItem(CLIPS_KEY); if(!raw){ localStorage.setItem(CLIPS_KEY, JSON.stringify(defaultClips)); return defaultClips; } return JSON.parse(raw);}catch{ return defaultClips; } };
  const setClips=(arr)=> localStorage.setItem(CLIPS_KEY, JSON.stringify(arr));

  const isVideoFile = (url)=> url.startsWith('blob:') || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
  const ytId = (url)=>{ try{ const u=new URL(url); if(u.hostname.includes('youtu.be')) return u.pathname.slice(1); if(u.hostname.includes('youtube.com')) return u.searchParams.get('v')||''; }catch{} return ''; };

  const pencilSvg = `<svg viewBox="0 0 24 24" fill="none"><path d="M4 20l4-1 9-9-3-3-9 9-1 4zM14 5l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const trashSvg  = `<svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V5h6v2M7 7l1 12h8l1-12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  // refs modal
  let modal, modalTitle, modalClose, modalCancel, form, fId, fTitle, fUrl, fFile, fPrev;
  let blobUrl='';

  function ensureModalRefs(){
    modal = q('#clip-modal');
    modalTitle = q('#clip-modal-title');
    modalClose = q('#clip-modal-close');
    modalCancel = q('#clip-cancel');
    form = q('#clip-form');
    fId = q('#clip-id');
    fTitle = q('#clip-title');
    fUrl = q('#clip-url');
    fFile = q('#clip-file');
    fPrev = q('#clip-preview');
    const all = [modal, modalTitle, modalClose, modalCancel, form, fId, fTitle, fUrl, fFile, fPrev];
    if (all.some(x=>!x)) console.warn('clips.js: faltan elementos del modal en el HTML');
  }

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
          <h3 class="card-title">${esc(clip.title)}${localBadge}</h3>
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
    const grid = q('#clip-grid'); if(!grid){ console.warn('No existe #clip-grid'); return; }
    const list = getClips().sort((a,b)=>b.createdAt-a.createdAt);
    grid.innerHTML = list.length ? list.map(clipCard).join('') : `<p class="muted">Aún no hay clips. Agrega uno con “➕ Agregar clip”.</p>`;

    qa('.js-edit', grid).forEach(btn=>{
      btn.addEventListener('click', e=>{
        const id = e.currentTarget.closest('[data-id]')?.dataset.id;
        if (id) openClipModal('edit', id);
      });
    });
    qa('.js-delete', grid).forEach(btn=>{
      btn.addEventListener('click', e=>{
        const id = e.currentTarget.closest('[data-id]')?.dataset.id;
        if (!id) return;
        if (confirm('¿Seguro que quieres eliminar este clip?')) {
          setClips(getClips().filter(c=>c.id!==id));
          renderClips();
          toast('Clip eliminado');
        }
      });
    });
  }

  function openClipModal(mode='add', id=null){
    ensureModalRefs();
    if (!modal) return;

    if (mode === 'edit') {
      const clip = getClips().find(c=>c.id===id); if(!clip) return;
      modalTitle.textContent = 'Editar clip';
      fId.value = clip.id; fTitle.value = clip.title; fUrl.value = clip.url;
      renderPreview(clip.url);
    } else {
      modalTitle.textContent = 'Agregar clip';
      fId.value=''; fTitle.value=''; fUrl.value=''; if(fFile) fFile.value=''; fPrev.innerHTML='';
    }

    document.body.style.overflow='hidden';
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden','false');
    fTitle.focus();
  }

  function closeClipModal(){
    if (blobUrl){ URL.revokeObjectURL(blobUrl); blobUrl=''; }
    document.body.style.overflow='';
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden','true');
    fPrev.innerHTML='';
  }

  function renderPreview(src){
    if (!src){ fPrev.innerHTML=''; return; }
    if (isVideoFile(src)) fPrev.innerHTML = `<video src="${src}" controls></video>`;
    else if (ytId(src))   fPrev.innerHTML = `<img src="https://img.youtube.com/vi/${ytId(src)}/hqdefault.jpg" alt="Miniatura">`;
    else                  fPrev.innerHTML = `<img src="monta.jpeg" alt="Miniatura">`;
  }

  function onFileChange(){
    const file = fFile.files?.[0];
    if (!file) return;
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    blobUrl = URL.createObjectURL(file);
    fUrl.value = blobUrl; // prioriza archivo local
    renderPreview(blobUrl);
  }

  function onSave(e){
    e.preventDefault();
    const id = fId.value.trim();
    const title = fTitle.value.trim();
    const url = fUrl.value.trim();

    if (!title){ toast('Pon un título'); fTitle.focus(); return; }
    if (!url){ toast('Pega una URL o selecciona un archivo'); return; }

    const list = getClips();
    if (id){
      const i = list.findIndex(c=>c.id===id);
      if (i>-1) list[i] = { ...list[i], title, url, local:url.startsWith('blob:'), updatedAt:Date.now() };
      toast('Clip actualizado');
    } else {
      list.push({ id: crypto.randomUUID(), title, url, local:url.startsWith('blob:'), createdAt:Date.now() });
      toast('Clip agregado');
    }
    setClips(list);
    renderClips();
    closeClipModal();
  }

  // Bind inicial al cargar el DOM
  document.addEventListener('DOMContentLoaded', () => {
    ensureModalRefs();
    // Botón agregar
    q('#btn-add-clip')?.addEventListener('click', ()=> openClipModal('add'));
    // Acciones modal
    q('#clip-modal-close')?.addEventListener('click', closeClipModal);
    q('#clip-cancel')?.addEventListener('click', closeClipModal);
    q('#clip-modal')?.addEventListener('click', (e)=>{ if (e.target.id === 'clip-modal') closeClipModal(); });
    fFile?.addEventListener('change', onFileChange);
    form?.addEventListener('submit', onSave);

    // Primer render
    renderClips();
  });
})();
