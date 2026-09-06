function normalize(s) {
  return s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}
function isBizarreadas(artista, cancion) {
  const biz = ["meneaito", "bomba azul", "olvidame y pega", "mayonesa", "levantando las manos", "guapas", "mambr", "divinas", "aserej", "nunca me faltes", "esa malvada", "tonta comanche", "comanche", "el santo", "chocolate 2000", "el simbolo", "bandana", "patito", "ketchup", "gaby"];
  const txt = normalize(`${artista} ${cancion}`);
  return biz.some(b => txt.includes(b));
}

let allSongs = [];
let filtered = [];
let visible = 40;
let currentFilter = "Todos";

const listEl = document.getElementById("list");
const searchEl = document.getElementById("search");
const countEl = document.getElementById("count");
const moreBtn = document.getElementById("more");
const filtersEl = document.getElementById("filters");

async function load() {
  const res = await fetch("canciones.json");
  allSongs = await res.json();
  // marcar carta y bizarreadas
  allSongs = allSongs.map(s => ({
    ...s,
    _biz: isBizarreadas(s.artista, s.cancion),
    _norm: normalize(s.artista + " " + s.cancion)
  }));
  apply();
}

function apply() {
  const q = normalize(searchEl.value.trim());
  filtered = allSongs.filter(s => {
    const matchQ = !q || s._norm.includes(q);
    if (!matchQ) return false;
    if (currentFilter === "Todos") return true;
    if (currentFilter === "Carta") return s._carta;
    if (currentFilter === "Bizarreadas") return s._biz;
    return s.genero === currentFilter;
  });
  visible = 40;
  render();
}

const LELE_WHATSAPP = "5491166912294";

function render() {
  const slice = filtered.slice(0, visible);
  listEl.innerHTML = slice.map(s => `
    <div class="card">
      <div class="card-left">
        <div class="card-artist">${escapeHtml(s.artista)}</div>
        <div class="card-song">${escapeHtml(s.cancion)}</div>
        <div class="badges">
        </div>
        </div>
          <button onclick="askName(${s.id})">🎤 Cantar</button>
        </div>
        `).join("");
  countEl.textContent = `${filtered.length} canciones • ${allSongs.length} en total`;
  moreBtn.style.display = filtered.length > visible ? "block" : "none";
  if (filtered.length === 0) {
    listEl.innerHTML = `<div style="text-align:center;padding:30px;color:#666">No encontramos nada con "${escapeHtml(searchEl.value)}"<br>Probá con menos palabras</div>`;
  }
}
let currentSong = null;
let currentName = "";
let pendingSongId = null;

window.askName = function (id) {
  pendingSongId = id;
  document.getElementById("nameInput").value = currentName;
  document.getElementById("nameModal").classList.remove("hidden");
  document.getElementById("nameInput").focus();
}

document.getElementById("nameContinueBtn").onclick = () => {
  const nombre = document.getElementById("nameInput").value.trim();
  if (!nombre) {
    alert("Escribí tu nombre para continuar");
    return;
  }
  currentName = nombre;
  document.getElementById("nameModal").classList.add("hidden");
  openModal(pendingSongId);
};

document.getElementById("nameInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("nameContinueBtn").click();
});

document.getElementById("nameModalBg").onclick = () => {
  document.getElementById("nameModal").classList.add("hidden");
};

window.openModal = function (id) {
  const s = allSongs.find(x => x.id === id);
  if (!s) return;
  currentSong = s;
  document.getElementById("modalSong").textContent = `${s.artista} - ${s.cancion}`;
  document.getElementById("modalCode").textContent = `${s.cancion} - ${s.artista}`;
  document.getElementById("modal").classList.remove("hidden");
}

document.getElementById("copyBtn").onclick = () => {
  if (!currentSong || !currentName) return;
  const mensaje = `Hola Lele! Soy ${currentName} y quiero cantar: ${currentSong.cancion} - ${currentSong.artista}.`;
  const url = `https://wa.me/${LELE_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
};

function escapeHtml(t) { return t.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }

function closeModal() { document.getElementById("modal").classList.add("hidden"); }

document.getElementById("modalBg").onclick = closeModal;
document.getElementById("closeBtn").onclick = closeModal;

searchEl.addEventListener("input", () => { apply(); });
moreBtn.addEventListener("click", () => { visible += 40; render(); });
filtersEl.addEventListener("click", (e) => {
  if (e.target.tagName !== "BUTTON") return;
  filtersEl.querySelectorAll("button").forEach(b => b.classList.remove("active"));
  e.target.classList.add("active");
  currentFilter = e.target.dataset.f;
  apply();
});

function updateArrow() {
  const arrow = document.querySelector(".filters-arrow");
  if (!arrow) return;
  const atEnd = filtersEl.scrollLeft + filtersEl.clientWidth >= filtersEl.scrollWidth - 2;
  arrow.style.display = atEnd ? "none" : "flex";
}

document.querySelector(".filters-arrow").addEventListener("click", () => {
  filtersEl.scrollBy({ left: 150, behavior: "smooth" });
});

filtersEl.addEventListener("scroll", updateArrow);
window.addEventListener("load", updateArrow);
window.addEventListener("resize", updateArrow);


load();
