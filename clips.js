/* ===========================
   clips.js — CRUD de clips con límite de 6
   =========================== */

const CLIPS_KEY = "montanafrx.clips.v1"; // almacenamiento local (URLs y metadatos)

const els = {
  grid: document.getElementById("clipsContainer"),
  addBtn: document.getElementById("addClipBtn"),
  modal: document.getElementById("clipModal"),
  modalTitle: document.getElementById("clipModalTitle"),
  closeBtn: document.getElementById("closeClipModal"),
  cancelBtn: document.getElementById("cancelClip"),
  form: document.getElementById("clipForm"),
  fieldId: document.getElementById("clipId"),
  fieldTitle: document.getElementById("clipTitle"),
  fieldUrl: document.getElementById("clipUrl"),
  fieldFile: document.getElementById("clipFile"),
  preview: document.getElementById("clipPreview")
};

let state = {
  clips: [],
  editingId: null,
  previewUrl: null // para revocar ObjectURL
};

function loadClips() {
  try {
    const raw = localStorage.getItem(CLIPS_KEY);
    state.clips = raw ? JSON.parse(raw) : [];
  } catch {
    state.clips = [];
  }
}

function saveClips() {
  localStorage.setItem(CLIPS_KEY, JSON.stringify(state.clips));
}

function openModal(mode = "add", clip = null) {
  els.modal.classList.remove("hidden");
  els.modal.setAttribute("aria-hidden", "false");
  els.modalTitle.textContent = mode === "add" ? "Agregar clip" : "Editar clip";
  els.form.reset();
  els.preview.innerHTML = "";
  if (state.previewUrl) {
    URL.revokeObjectURL(state.previewUrl);
    state.previewUrl = null;
  }
  state.editingId = null;
  els.fieldId.value = "";

  if (clip) {
    state.editingId = clip.id;
    els.fieldId.value = clip.id;
    els.fieldTitle.value = clip.title || "";
    els.fieldUrl.value = clip.url || "";
    // No cargamos archivo local en input file (por seguridad los navegadores no lo permiten).
    if (clip.localSrc) {
      // mostramos aviso de que es local
      const warn = document.createElement("div");
      warn.className = "muted";
      warn.textContent = "Este clip es local (de esta sesión). Puedes reemplazarlo subiendo otro archivo.";
      els.preview.appendChild(warn);
    }
  }
  els.fieldTitle.focus();
}

function closeModal() {
  els.modal.classList.add("hidden");
  els.modal.setAttribute("aria-hidden", "true");
}

function renderClips() {
  const grid = els.grid;
  grid.innerHTML = "";

  state.clips.forEach((c) => {
    const card = document.createElement("article");
    card.className = "card";
    card.setAttribute("role", "listitem");

    // Thumb
    const thumbWrap = document.createElement("div");
    const isLocalVideo = !!c.localSrc;
    if (isLocalVideo) {
      const vid = document.createElement("video");
      vid.className = "thumb";
      vid.src = c.localSrc;
      vid.controls = false;
      vid.muted = true;
      vid.playsInline = true;
      thumbWrap.appendChild(vid);
    } else {
      // No garantizamos thumb remota; usamos un fondo neutro con texto
      const ph = document.createElement("div");
      ph.className = "thumb";
      ph.style.display = "grid";
      ph.style.placeItems = "center";
      ph.style.background = "linear-gradient(180deg, rgba(0,255,136,.1), rgba(0,0,0,0))";
      ph.style.color = "var(--muted)";
      ph.style.fontWeight = "600";
      ph.textContent = "Clip";
      thumbWrap.appendChild(ph);
    }

    // Body
    const body = document.createElement("div");
    body.className = "card-body";
    const title = document.createElement("h3");
    title.className = "card-title";
    title.textContent = c.title || "Clip";

    const actions = document.createElement("div");
    actions.className = "card-actions";

    // Ver clip (abre en nueva pestaña si hay URL; si es local, abre el blob)
    const btnView = document.createElement("a");
    btnView.className = "btn";
    btnView.textContent = "Ver clip";
    btnView.target = "_blank";
    btnView.rel = "noopener";
    btnView.href = c.url ? c.url : (c.localSrc || "#");
    actions.appendChild(btnView);

    // Editar
    const btnEdit = document.createElement("button");
    btnEdit.className = "icon-btn";
    btnEdit.title = "Editar";
    btnEdit.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 20h4l10-10a2.5 2.5 0 0 0-4-4L4 16v4z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"></path>
      </svg>`;
    btnEdit.addEventListener("click", () => openModal("edit", c));
    actions.appendChild(btnEdit);

    // Eliminar
    const btnDel = document.createElement("button");
    btnDel.className = "icon-btn";
    btnDel.title = "Eliminar";
    btnDel.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 6h18M8 6l1-2h6l1 2m-1 0v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
      </svg>`;
    btnDel.addEventListener("click", () => {
      if (confirm("¿Seguro que deseas eliminar este clip?")) {
        state.clips = state.clips.filter((x) => x.id !== c.id);
        saveClips();
        renderClips();
        if (c.localSrc) URL.revokeObjectURL(c.localSrc);
        showToast("Clip eliminado");
      }
    });
    actions.appendChild(btnDel);

    body.append(title, actions);
    card.append(thumbWrap, body);
    grid.appendChild(card);
  });
}

function ensureMaxBeforeAdd() {
  if (state.clips.length >= 6) {
    showToast("Solo se permite un máximo de 6 clips. Elimine uno para agregar otro.");
    return false;
  }
  return true;
}

function createId() {
  return "c_" + Math.random().toString(36).slice(2, 9);
}

function handleFilePreview() {
  els.preview.innerHTML = "";
  if (state.previewUrl) {
    URL.revokeObjectURL(state.previewUrl);
    state.previewUrl = null;
  }
  const f = els.fieldFile.files?.[0];
  if (!f) return;
  const url = URL.createObjectURL(f);
  state.previewUrl = url;
  const vid = document.createElement("video");
  vid.src = url;
  vid.controls = true;
  vid.style.width = "100%";
  vid.style.borderRadius = "12px";
  els.preview.appendChild(vid);
}

// ---------- Eventos ----------
loadClips();
renderClips();

if (els.addBtn) {
  els.addBtn.addEventListener("click", () => {
    if (!ensureMaxBeforeAdd()) return;
    openModal("add");
  });
}

if (els.closeBtn) els.closeBtn.addEventListener("click", closeModal);
if (els.cancelBtn) els.cancelBtn.addEventListener("click", closeModal);
if (els.modal) {
  els.modal.addEventListener("click", (e) => {
    if (e.target === els.modal) closeModal();
  });
}

if (els.fieldFile) els.fieldFile.addEventListener("change", handleFilePreview);

if (els.form) {
  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = els.fieldTitle.value.trim();
    const url = els.fieldUrl.value.trim();
    const file = els.fieldFile.files?.[0];

    if (!title) return showToast("El título es obligatorio.");

    // Si estamos agregando, revisa límite
    const isEditing = !!state.editingId;
    if (!isEditing && state.clips.length >= 6) {
      showToast("Solo se permite un máximo de 6 clips. Elimine uno para agregar otro.");
      return;
    }

    // Construir clip
    const data = {
      id: isEditing ? state.editingId : createId(),
      title,
      url: url || "",
      // localSrc: solo si se sube archivo
      localSrc: null
    };

    if (file) {
      // Blob local: persistirá solo en esta sesión
      const blobUrl = state.previewUrl || URL.createObjectURL(file);
      data.localSrc = blobUrl;
    }

    if (isEditing) {
      const idx = state.clips.findIndex((x) => x.id === state.editingId);
      if (idx >= 0) {
        // Revocar antiguo localSrc si se reemplazó por nuevo archivo
        if (state.clips[idx].localSrc && data.localSrc && state.clips[idx].localSrc !== data.localSrc) {
          try { URL.revokeObjectURL(state.clips[idx].localSrc); } catch {}
        }
        state.clips[idx] = data;
      }
      showToast("Clip actualizado");
    } else {
      state.clips.unshift(data);
      showToast("Clip agregado");
    }

    saveClips();
    renderClips();
    closeModal();
  });
}
