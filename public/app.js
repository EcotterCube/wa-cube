/* =========================================================
   Plan du Campus — Logique
   ========================================================= */

/* =========================================================
   ⚙️  CONFIGURATION — À ÉDITER ICI
   Coordonnées de téléportation par zone : WA.player.teleport(x, y).
   Modifiez simplement les paires [x, y] ci-dessous.
   ========================================================= */
const TELEPORT_COORDS = {
  staff:    [3200, 2850],
  campus:   [592,  2000],
  showroom: [300,  4000],
  event:    [5130, 3900],
  entry:    [1897, 1373],
};

/* =========================================================
   Données des zones
   id = clé partagée par le hotspot, le filtre et la carte.
   ========================================================= */
const ZONES = [
  {
    id: 'staff',
    name: 'Staff',
    tag: 'Équipe Cube',
    color: 'var(--c-staff)',
    desc: "Espace réservé à l’équipe pédagogique, mentors et support. Posez vos questions ou demandez de l’aide.",
    actions: ['Mentorat', 'Support', 'Questions'],
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  },
  {
    id: 'campus',
    name: 'Campus',
    tag: 'Cœur de formation',
    color: 'var(--c-campus)',
    desc: "Salles de cours, espaces d’apprentissage et ateliers en direct. Le bâtiment principal où tout se passe.",
    actions: ['Cours', 'Ateliers', 'Live'],
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V8l7-5 7 5v13"/><path d="M9 21v-6h6v6"/></svg>`,
  },
  {
    id: 'showroom',
    name: 'Showroom',
    tag: 'Projets & démos',
    color: 'var(--c-showroom)',
    desc: "Vitrine des projets d’apprenants, portfolios et démos en libre exploration. Inspiration garantie.",
    actions: ['Portfolios', 'Démos', 'Projets'],
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>`,
  },
  {
    id: 'event',
    name: 'Événement',
    tag: 'Conférences',
    color: 'var(--c-event)',
    desc: "Portes ouvertes, conférences, masterclasses et grands rendez-vous. Consultez l’agenda à l’entrée.",
    actions: ['Masterclass', 'Conférences', 'Rencontres'],
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>`,
  },
  {
    id: 'entry',
    name: 'Entrée · Bienvenue',
    tag: 'Onboarding',
    color: 'var(--c-entry)',
    desc: "Point d’arrivée des nouveaux visiteurs. Onboarding rapide pour découvrir les commandes et les zones.",
    actions: ['Tutoriel', 'Découverte', 'Premiers pas'],
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h12"/><path d="M9 6l-6 6 6 6"/><path d="M21 4v16"/></svg>`,
  },
];

/* Helpers DOM */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const legendEl = $('#legend');
const mapEl    = $('#map');
const detailEl = $('#detail');

let stickyZone = null; // zone "épinglée" par un clic

/* =========================================================
   Génération des cartes de la légende (carrousel)
   ========================================================= */
ZONES.forEach(zone => {
  const card = document.createElement('button');
  card.className = 'zone-card';
  card.dataset.zone = zone.id;
  card.style.setProperty('--c', zone.color);
  card.innerHTML = `
    <div class="head">
      <div class="ico" aria-hidden="true">${zone.icon}</div>
      <span class="tag">${zone.tag}</span>
    </div>
    <h3>${zone.name}</h3>
    <p>${zone.desc}</p>
    <div class="actions">${zone.actions.map(a => `<span>${a}</span>`).join('')}</div>
  `;
  card.addEventListener('mouseenter', () => highlight(zone.id));
  card.addEventListener('mouseleave', () => { if (!stickyZone) highlight(null); });
  card.addEventListener('focus',      () => highlight(zone.id));
  card.addEventListener('blur',       () => { if (!stickyZone) highlight(null); });
  card.addEventListener('click',      () => { selectZone(zone.id); openDetail(zone); });
  legendEl.appendChild(card);
});

/* =========================================================
   Navigation du carrousel
   ========================================================= */
const legPrev = $('#legendPrev');
const legNext = $('#legendNext');
const legendStep = () => legendEl.clientWidth * 0.8;

function updateLegendNav(){
  legPrev.disabled = legendEl.scrollLeft <= 4;
  legNext.disabled = legendEl.scrollLeft + legendEl.clientWidth >= legendEl.scrollWidth - 4;
}
legPrev.addEventListener('click', () => legendEl.scrollBy({ left: -legendStep(), behavior: 'smooth' }));
legNext.addEventListener('click', () => legendEl.scrollBy({ left:  legendStep(), behavior: 'smooth' }));
legendEl.addEventListener('scroll', updateLegendNav, { passive: true });
window.addEventListener('resize', updateLegendNav);
updateLegendNav();

/* Fait défiler le carrousel pour rendre une carte visible */
function scrollCardIntoView(zoneId){
  const card = $(`.zone-card[data-zone="${zoneId}"]`);
  if (!card) return;
  const cardRect   = card.getBoundingClientRect();
  const listRect   = legendEl.getBoundingClientRect();
  const delta      = (cardRect.left - listRect.left) - 8; // align à gauche + padding
  legendEl.scrollBy({ left: delta, behavior: 'smooth' });
}

/* =========================================================
   Mise en évidence d'une zone (hover ou sélection épinglée)
   ========================================================= */
function highlight(zoneId){
  const targetId = zoneId ?? stickyZone;
  $$('.hotspot').forEach(h        => h.classList.toggle('is-on',  h.dataset.zone === targetId));
  $$('.zone-card').forEach(c      => c.classList.toggle('is-on',  c.dataset.zone === targetId));
  $$('.filter[data-zone]').forEach(f => f.classList.toggle('active', f.dataset.zone === targetId));
  mapEl.classList.toggle('is-focused', !!targetId);
}

function selectZone(zoneId){
  if (stickyZone === zoneId){
    stickyZone = null;
    highlight(null);
  } else {
    stickyZone = zoneId;
    highlight(zoneId);
    scrollCardIntoView(zoneId);
  }
}

/* =========================================================
   Hotspots sur la carte
   ========================================================= */
$$('.hotspot').forEach(hotspot => {
  const id = hotspot.dataset.zone;
  hotspot.addEventListener('mouseenter', () => highlight(id));
  hotspot.addEventListener('mouseleave', () => { if (!stickyZone) highlight(null); });
  hotspot.addEventListener('focus',      () => highlight(id));
  hotspot.addEventListener('blur',       () => { if (!stickyZone) highlight(null); });
  hotspot.addEventListener('click', () => {
    selectZone(id);
    openDetail(ZONES.find(z => z.id === id));
  });
});

/* =========================================================
   Filtres (pills)
   ========================================================= */
$$('.filter[data-zone]').forEach(filter => {
  const id = filter.dataset.zone;
  filter.addEventListener('mouseenter', () => highlight(id));
  filter.addEventListener('mouseleave', () => { if (!stickyZone) highlight(null); });
  filter.addEventListener('click',      () => selectZone(id));
});

/* =========================================================
   Panneau de détails
   ========================================================= */
function openDetail(zone){
  detailEl.style.setProperty('--c', zone.color);
  $('#dIco').innerHTML   = zone.icon;
  $('#dSub').textContent   = zone.tag;
  $('#dTitle').textContent = zone.name;
  $('#dDesc').textContent  = zone.desc;
  $('#dTp').onclick = () => teleport(zone);
  detailEl.classList.add('open');
}
function closeDetail(){ detailEl.classList.remove('open'); }
$('#detailClose').addEventListener('click', closeDetail);
$('#dDismiss').addEventListener('click', closeDetail);

/* =========================================================
   Workadventure — appels API (attendent WA.onInit)
   ========================================================= */
function withWA(fn){
  if (window.WA && WA.onInit) WA.onInit().then(fn).catch(fn);
  else fn();
}

function teleport(zone){
  const [x, y] = TELEPORT_COORDS[zone.id] || TELEPORT_COORDS.entry;
  withWA(() => {
    try { WA.player.teleport(x, y); } catch (e) { console.warn(e); }
    try { WA.ui.modal.closeModal(); } catch (e) { console.warn(e); }
  });
}

$('#closeBtn').addEventListener('click', () => {
  withWA(() => {
    try { WA.ui.modal.closeModal(); } catch (e) { console.warn(e); }
  });
});

/* =========================================================
   Raccourci clavier : Échap réinitialise la sélection
   ========================================================= */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape'){
    closeDetail();
    stickyZone = null;
    highlight(null);
  }
});
