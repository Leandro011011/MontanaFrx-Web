/* ===========================
   clips.js — Gestión de clips
   =========================== */

import { 
  db, storage, showToast, setCloudStatus, MAX_CLIPS, $, $$ 
} from './funciones.js';

import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// Colección de clips en Firestore
const clipsCol = collection(db, "clips");

// Elementos del DOM
const clipsList = $("#clips-list");
const modal = $("#clip-modal");
const modalTitle = $("#modal-title");
const clipForm = $("#clip-form");
const clipName = $("#clip-name");
const clipFile = $("#clip-file");
const saveBtn = $("#save-clip");
let editingId = null;

/* ===========================
   Función para renderizar un clip
   =========================== */
function renderClip(id, data) {
  const li = document.createElement("li");
  li.className = "clip-item";
  li.dataset.id = id;

  li.innerHTML = `
    <video src="${data.url}" controls></video>
    <p>${data.name}</p>
    <div class="clip-actions">
      <button class="edit-clip" aria-label="Editar clip">
        <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" width="18" height="18"><path d="M4 21v-4.586l11.293-11.293 4.586 4.586L8.586 21H4zm2-2h1.586l8.707-8.707-1.586-1.586L6 17.414V19zm12.707-12.707l-2-2L18.586 2l2 2-1.879 1.879z"/></svg>
      </button>
      <button class="delete-clip" aria-label="Eliminar clip">
        <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" width="18" height="18"><path d="M6 19c0 1.105.895 2 2 2h8c1.105 0 2-.895 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
      </button>
    </div>
  `;

  // Eventos
  li.querySelector(".edit-clip").addEventListener("click", () => openModal(id, data));
  li.querySelector(".delete-clip").addEventListener("click", () => confirmDelete(id, data));

  return li;
}

/* ===========================
   Escuchar cambios en tiempo real
   =========================== */
onSnapshot(clipsCol, snapshot => {
  clipsList.innerHTML = "";
  snapshot.forEach(docSnap => {
    const li = renderClip(docSnap.id, docSnap.data());
    clipsList.appendChild(li);
  });
});

/* ===========================
   Abrir modal
   =========================== */
function openModal(id = null, data = null) {
  editingId = id;
  if (id && data) {
    modalTitle.textContent = "Editar clip";
    clipName.value = data.name;
  } else {
    modalTitle.textContent = "Agregar clip";
    clipName.value = "";
  }
  clipFile.value = "";
  modal.style.display = "block";
}

/* ===========================
   Cerrar modal
   =========================== */
function closeModal() {
  modal.style.display = "none";
}

/* ===========================
   Confirmar eliminación de clip
   =========================== */
async function confirmDelete(id, data) {
  if (!confirm("¿Seguro que deseas eliminar este clip?")) return;
  try {
    // Eliminar archivo del storage
    if (data.storagePath) {
      const clipRef = ref(storage, data.storagePath);
      await deleteObject(clipRef);
    }
    // Eliminar registro en Firestore
    await deleteDoc(doc(db, "clips", id));
    showToast("Clip eliminado");
  } catch (err) {
    console.error(err);
    showToast("Error eliminando clip");
  }
}

/* ===========================
   Guardar clip
   =========================== */
clipForm.addEventListener("submit", async e => {
  e.preventDefault();

  const name = clipName.value.trim();
  const file = clipFile.files[0];

  if (!name) {
    showToast("El nombre es obligatorio");
    return;
  }

  try {
    setCloudStatus("Guardando clip…");

    // Limitar máximo de clips
    if (!editingId) {
      const existing = await getDocs(clipsCol);
      if (existing.size >= MAX_CLIPS) {
        showToast(`Solo se permiten ${MAX_CLIPS} clips. Elimina uno para agregar otro.`);
        setCloudStatus("Listo");
        return;
      }
    }

    let url = null;
    let storagePath = null;

    // Si se sube un archivo
    if (file) {
      storagePath = `clips/${Date.now()}_${file.name}`;
      const fileRef = ref(storage, storagePath);
      await uploadBytes(fileRef, file);
      url = await getDownloadURL(fileRef);
    }

    if (editingId) {
      const updateData = { name };
      if (url) {
        updateData.url = url;
        updateData.storagePath = storagePath;
      }
      await updateDoc(doc(db, "clips", editingId), updateData);
      showToast("Clip actualizado");
    } else {
      await addDoc(clipsCol, {
        name,
        url,
        storagePath
      });
      showToast("Clip agregado");
    }

    closeModal();
    setCloudStatus("Listo");
  } catch (err) {
    console.error(err);
    showToast("Error guardando clip");
    setCloudStatus("Error", "error");
  }
});

/* ===========================
   Eventos de UI
   =========================== */
$("#add-clip").addEventListener("click", () => openModal());
$("#close-modal").addEventListener("click", closeModal);
window.addEventListener("click", e => {
  if (e.target === modal) closeModal();
});
