/* ===========================
   clips.js — CRUD Clips (Firebase) + Límite 6 + Tiempo real
   Compatible con IDs de tu index.html actual
   =========================== */

import { db, storage, showToast, setCloudStatus, MAX_CLIPS, $, $$ } from "./funciones.js";
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc,
  getDocs, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

/* ---------- Elementos del DOM (IDs EXACTOS del HTML) ---------- */
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
  preview: document.getElementById("clipPreview"),
};

const clipsRef = collection(db, "clips");

/* ---------- Estado ---------- */
let state = {
  editingId: null,
  currentCount: 0,
  previewBlobUrl: null,
  // cache del snapshot actual para conocer storagePath previo al editar
  cache: new Map(), // id -> data
};

/* ---------- Utilidades UI ---------- */
function btnAddSetDisabled(disabled) {
  if (!els.addBtn) return;
  els.addBtn.disabled = disabled;
  els.addBtn.classList.toggle("is-disabled", !!disabled);
  els.grid?.classList.toggle("max-reached", !!disabled);
}

function openModal(mode = "add", data = null) {
  els.modal.classList.remove("hidden");
  els.modal.setAttribute("aria-hidden", "false");
  els.modalTitle.textContent = mode === "edit" ? "Editar clip" : "Agregar clip";
  els.form.reset();
  els.preview.innerHTML = "";
  if (state.previewBlobUrl) {
    try { URL.revokeObjectURL(state.previewBlobUrl); } catch {}
    state.previewBlobUrl = null;
  }
  state.editingId = null;
  els.fieldId.value = "";

  if (data) {
    state.editingId = data.id;
    els.fieldId.value = data.id;
    els.fieldTitle.value = data.title || "";
    els.fieldUrl.value = data.url || "";

    // Previsualiza si es un video reproducible directo
    if (data.url) {
      const isVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(data.url) || data.url.startsWith("https://firebasestorage.googleapis.com/");
      if (isVideo) {
        const vid = document.createElement("video");
        vid.controls = true;
        vid.src = data.url;
        vid.style.width = "100%";
        els.preview.appendChild(vid);
      }
    }
  }

  els.fieldTitle.focus();
}

function closeModal() {
  els.modal.classList.add("hidden");
  els.modal.setAttribute("aria-hidden", "true");
}

/* ---------- Render ---------- */
function renderClips(docs) {
  const grid = els.grid;
  grid.innerHTML = "";

  docs.forEach((snap) => {
    const data = snap.data();
    const id = snap.id;

    // cache para edición y borrado
    state.cache.set(id, data);

    const card = document.createElement("article");
    card.className = "card";
    card.setAttribute("role", "listitem");

    // THUMB
    const thumbWrap = document.createElement("div");
    if (data.url) {
      const isVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(data.url) || data.url.startsWith("https://firebasestorage.googleapis.com/");
      if (isVideo) {
        const vid = document.createElement("video");
        vid.className = "thumb";
        vid.src = data.url;
        vid.muted = true;
        vid.playsInline = true;
        vid.controls = true;
        thumbWrap.appendChild(vid);
      } else {
        const ph = document.createElement("div");
        ph.className = "thumb";
        ph.style.display = "grid";
        ph.style.placeItems = "center";
        ph.style.background = "linear-gradient(180deg, rgba(0,255,136,.1), rgba(0,0,0,0))";
        ph.style.color = "var(--muted)";
        ph.style.fontWeight = "600";
        ph.textContent = "Clip (enlace)";
        thumbWrap.appendChild(ph);
      }
    } else {
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

    // BODY
    const body = document.createElement("div");
    body.className = "card-body";

    const title = document.createElement("h3");
    title.className = "card-title";
    title.textContent = data.title || "Clip";

    const actions = document.createElement("div");
    actions.className = "card-actions";

    // Ver (abre en nueva pestaña para enlaces)
    const btnView = document.createElement("a");
    btnView.className = "btn";
    btnView.textContent = "Ver clip";
    btnView.target = "_blank";
    btnView.rel = "noopener";
    btnView.href = data.url || "#";
    actions.appendChild(btnView);

    // Editar
    const btnEdit = document.createElement("button");
    btnEdit.className = "icon-btn";
    btnEdit.title = "Editar";
    btnEdit.setAttribute("aria-label", "Editar clip");
    btnEdit.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 20h4l10-10a2.5 2.5 0 0 0-4-4L4 16v4z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"></path>
      </svg>`;
    btnEdit.addEventListener("click", () => openModal("edit", { id, ...data }));
    actions.appendChild(btnEdit);

    // Eliminar
    const btnDel = document.createElement("button");
    btnDel.className = "icon-btn";
    btnDel.title = "Eliminar";
    btnDel.setAttribute("aria-label", "Eliminar clip");
    btnDel.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 6h18M8 6l1-2h6l1 2m-1 0v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
      </svg>`;
    btnDel.addEventListener("click", async () => {
      if (!confirm("¿Seguro que deseas eliminar este clip?")) return;
      try {
        // Borrar archivo del Storage si existe
        if (data.storagePath) {
          try { await deleteObject(ref(storage, data.storagePath)); } catch (e) { console.warn("No se pudo borrar de Storage:", e); }
        }
        await deleteDoc(doc(db, "clips", id));
        showToast("Clip eliminado");
      } catch (e) {
        console.error(e);
        showToast("Error al eliminar el clip");
      }
    });
    actions.appendChild(btnDel);

    body.append(title, actions);
    card.append(thumbWrap, body);
    grid.appendChild(card);
  });
}

/* ---------- Snapshot en tiempo real + límite ---------- */
const qClips = query(clipsRef, orderBy("createdAt", "desc"));
onSnapshot(qClips, (snapshot) => {
  const docs = snapshot.docs;
  state.currentCount = docs.length;

  // Límite y UI
  const reached = state.currentCount >= MAX_CLIPS;
  btnAddSetDisabled(reached);

  // Render
  renderClips(docs);
}, (err) => {
  console.error("onSnapshot error:", err);
  setCloudStatus("Error de sincronización", "error");
});

/* ---------- Abrir/Cerrar modal ---------- */
els.addBtn?.addEventListener("click", () => {
  if (state.currentCount >= MAX_CLIPS) {
    showToast(`Solo se permiten ${MAX_CLIPS} clips. Elimina uno para agregar otro.`);
    return;
  }
  openModal("add");
});

els.closeBtn?.addEventListener("click", closeModal);
els.cancelBtn?.addEventListener("click", closeModal);
// Cerrar al click fuera del contenido
els.modal?.addEventListener("click", (e) => {
  if (e.target === els.modal) closeModal();
});

/* ---------- Vista previa de archivo local ---------- */
els.fieldFile?.addEventListener("change", () => {
  els.preview.innerHTML = "";
  if (state.previewBlobUrl) {
    try { URL.revokeObjectURL(state.previewBlobUrl); } catch {}
    state.previewBlobUrl = null;
  }
  const f = els.fieldFile.files?.[0];
  if (!f) return;
  const url = URL.createObjectURL(f);
  state.previewBlobUrl = url;
  const vid = document.createElement("video");
  vid.controls = true;
  vid.src = url;
  vid.style.width = "100%";
  els.preview.appendChild(vid);
});

/* ---------- Guardar (Agregar/Editar) ---------- */
els.form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = els.fieldTitle.value.trim();
  let url = els.fieldUrl.value.trim();
  const file = els.fieldFile.files?.[0];

  if (!title) {
    showToast("El título es obligatorio.");
    return;
  }

  // Límite al agregar (no bloquea edición)
  if (!state.editingId && state.currentCount >= MAX_CLIPS) {
    showToast(`Solo se permiten ${MAX_CLIPS} clips. Elimina uno para agregar otro.`);
    return;
  }

  setCloudStatus("Guardando clip…");

  // Subida a Storage si hay archivo
  let storagePath = null;
  if (file) {
    try {
      storagePath = `clips/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      url = await getDownloadURL(storageRef);
    } catch (err) {
      console.error(err);
      showToast("Error al subir el archivo");
      setCloudStatus("Error", "error");
      return;
    }
  }

  try {
    if (state.editingId) {
      const id = state.editingId;
      const prev = state.cache.get(id) || {};

      // Si reemplazamos por un nuevo archivo, borra el anterior del Storage
      if (storagePath && prev.storagePath && prev.storagePath !== storagePath) {
        try { await deleteObject(ref(storage, prev.storagePath)); } catch (e) { console.warn("No se pudo borrar previo:", e); }
      }

      const payload = { title };
      if (typeof url === "string" && url.length) payload.url = url;
      if (storagePath) payload.storagePath = storagePath;

      await updateDoc(doc(db, "clips", id), payload);
      showToast("Clip actualizado");
    } else {
      await addDoc(clipsRef, {
        title,
        url: url || "",
        storagePath: storagePath || null,
        createdAt: serverTimestamp()
      });
      showToast("Clip agregado");
    }

    closeModal();
    setCloudStatus("Listo");
  } catch (err) {
    console.error(err);
    showToast("Error al guardar el clip");
    setCloudStatus("Error", "error");
  }
});
