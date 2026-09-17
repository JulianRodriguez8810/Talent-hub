// ==========================================
// VIRTUAL XPERT TALENT HUB — app.js
// ==========================================

// ---- AUTH CHECK ----
(function() {
  if (!sessionStorage.getItem('vx_user')) {
    window.location.href = 'index.html';
  }
})();

// ---- SUPABASE CLIENT ----
const SUPABASE_URL = 'https://nbyvtpiiyconbjqduyms.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ieXZ0cGlpeWNvbmJqcWR1eW1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1ODgxMDcsImV4cCI6MjEwNTE2NDEwN30.kS13oCNaxqHBjbVDUMFvceohQEE8Mqym0wpUjj8l6TQ';
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// ---- GLOBAL STATE ----
const VX = {
  currentSection: 'talentos',
  selectedTalents: new Set(),
  talents: [],
  clients: [],
  filteredTalents: [],
  activeclientId: null,
  proposals: [],
  searchQuery: '',
  filters: {
    stack: [],
    ingles: [],
    disponibilidad: [],
    seniority: [],
    pais: [],
    tarifaMin: 0,
    tarifaMax: 300
  }
};

// ---- TALENT DATA ----
VX.talents = [];

// ---- CLIENT DATA ----
VX.clients = [];

VX.filteredTalents = [...VX.talents];

// ---- HELPERS ----
function getUser() {
  return JSON.parse(sessionStorage.getItem('vx_user')) || { name: 'Admin', role: 'Staffing Lead' };
}

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function getStatusBadge(disponibilidad) {
  const map = {
    'Inmediata': { bg: 'bg-[#ECFDF5]', text: 'text-[#065F46]', dot: 'bg-status-available', label: 'Disponible' },
    'Parcial': { bg: 'bg-[#FFFBEB]', text: 'text-[#92400E]', dot: 'bg-status-interviewing', label: 'Parcial' },
    'Asignado': { bg: 'bg-[#EEF2FF]', text: 'text-[#3730A3]', dot: 'bg-status-placed', label: 'Asignado' }
  };
  return map[disponibilidad] || map['Parcial'];
}

function getInglesColor(nivel) {
  const map = { 'A2': 'bg-[#FEF3C7] text-[#92400E]', 'B1': 'bg-[#DBEAFE] text-[#1E40AF]', 'B2': 'bg-[#E0E7FF] text-[#3730A3]', 'C1': 'bg-[#D1FAE5] text-[#065F46]', 'C2': 'bg-[#ECFDF5] text-[#064E3B]' };
  return map[nivel] || 'bg-surface-container text-text-muted';
}

function getMatchColor(score) {
  if (score >= 95) return 'bg-[#D1FAE5] text-[#065F46]';
  if (score >= 85) return 'bg-[#DBEAFE] text-[#1E40AF]';
  if (score >= 75) return 'bg-[#EDE9FE] text-[#4C1D95]';
  return 'bg-surface-container text-text-muted';
}

function stackIcon(tech) {
  const icons = {
    'Azure': 'cloud', '.NET': 'code', 'DevOps': 'integration_instructions', 'React': 'web',
    'Node.js': 'terminal', 'Kubernetes': 'dns', 'Docker': 'inventory_2', 'Python': 'psychology',
    'IA/ML': 'smart_toy', 'Terraform': 'construction', 'Mobile': 'smartphone', 'UX/UI': 'palette',
    'QA': 'bug_report', 'Salesforce': 'support_agent', 'Scrum': 'groups', 'SQL': 'storage',
    'SAFe': 'account_tree', 'Figma': 'brush', 'Power BI': 'bar_chart', 'LLM': 'auto_awesome',
    'Microservicios': 'hub', 'Security': 'security', 'Swift': 'smartphone', 'iOS': 'smartphone',
    'Databricks': 'analytics', 'Spark': 'bolt'
  };
  return icons[tech] || 'check';
}

// ---- NAVIGATION ----
function navigate(section) {
  VX.currentSection = section;
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.remove('bg-primary-container', 'text-on-primary-container', 'font-bold');
    el.classList.add('text-on-surface-variant', 'hover:bg-surface-container-high');
  });
  const activeNav = document.querySelector(`[data-section="${section}"]`);
  if (activeNav) {
    activeNav.classList.add('bg-primary-container', 'text-on-primary-container', 'font-bold');
    activeNav.classList.remove('text-on-surface-variant', 'hover:bg-surface-container-high');
  }
  document.querySelectorAll('.section-content').forEach(el => el.classList.add('hidden'));
  const target = document.getElementById(`section-${section}`);
  if (target) target.classList.remove('hidden');

  // Toggle sidebar filters visibility
  const sidebarFilters = document.getElementById('sidebarFiltersSection');
  if (sidebarFilters) {
    if (section === 'talentos') {
      sidebarFilters.classList.remove('hidden');
    } else {
      sidebarFilters.classList.add('hidden');
    }
  }

  // Toggle sidebar client list visibility
  const sidebarClientListSection = document.getElementById('sidebarClientListSection');
  if (sidebarClientListSection) {
    if (section === 'clientes') {
      sidebarClientListSection.classList.remove('hidden');
    } else {
      sidebarClientListSection.classList.add('hidden');
    }
  }

  // Render section
  if (section === 'talentos') renderTalentos();
  if (section === 'clientes') renderClientes();
  if (section === 'propuestas') renderPropuestas();
  if (section === 'reportes') renderReportes();
}

// ---- HELPERS & UTILS ----
function removeAccents(str) {
  if (!str) return '';
  return String(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// ---- FILTERS ----
function applyFilters() {
  const f = VX.filters;
  const q = removeAccents(VX.searchQuery || '');

  VX.filteredTalents = VX.talents.filter(t => {
    if (t.activo === false) return false;

    const stackArr = Array.isArray(t.stack) ? t.stack : [];
    const certArr = Array.isArray(t.certificaciones) ? t.certificaciones : [];

    // Text search (accent insensitive)
    if (q) {
      const searchable = removeAccents(`${t.nombre || ''} ${t.rol || ''} ${t.seniority || ''} ${stackArr.join(' ')} ${t.pais || ''} ${t.resumen || ''} ${certArr.join(' ')}`);
      if (!searchable.includes(q)) return false;
    }

    // Stack — AND logic: talent must have ALL selected technologies
    if (f.stack.length > 0) {
      const normStack = stackArr.map(s => removeAccents(s));
      if (!f.stack.every(s => normStack.includes(removeAccents(s)))) return false;
    }
    // Inglés
    if (f.ingles.length > 0 && !f.ingles.some(i => removeAccents(i) === removeAccents(t.ingles))) return false;
    // Disponibilidad
    if (f.disponibilidad.length > 0 && !f.disponibilidad.some(d => removeAccents(d) === removeAccents(t.disponibilidad))) return false;
    // Seniority
    if (f.seniority.length > 0 && !f.seniority.some(s => removeAccents(s) === removeAccents(t.seniority))) return false;
    // País
    if (f.pais.length > 0 && !f.pais.some(p => removeAccents(p) === removeAccents(t.pais))) return false;
    // Tarifa
    if (t.tarifa !== undefined && t.tarifa !== null && Number(t.tarifa) > 0) {
      if (Number(t.tarifa) < f.tarifaMin || Number(t.tarifa) > f.tarifaMax) return false;
    }

    return true;
  });

  renderTalentGrid();
  const countEl = document.getElementById('resultCount');
  if (countEl) countEl.textContent = `${VX.filteredTalents.length} resultados`;

  const totalEl = document.getElementById('metricTotal');
  if (totalEl) totalEl.textContent = VX.talents.filter(t => t.activo !== false).length;

  const benchEl = document.getElementById('metricBench');
  if (benchEl) benchEl.textContent = VX.talents.filter(t => t.disponibilidad === 'Inmediata' && t.activo !== false).length;
}

function toggleFilter(type, value, el) {
  const arr = VX.filters[type];
  const idx = arr.indexOf(value);
  if (idx === -1) {
    arr.push(value);
    el.classList.add('bg-[#E0F2FE]', 'border-[#0284C7]', 'text-[#0369A1]');
    el.classList.remove('bg-surface-container', 'border-transparent', 'text-text-body');
  } else {
    arr.splice(idx, 1);
    el.classList.remove('bg-[#E0F2FE]', 'border-[#0284C7]', 'text-[#0369A1]');
    el.classList.add('bg-surface-container', 'border-transparent', 'text-text-body');
  }
  applyFilters();
}

function resetFilters() {
  VX.filters = { stack: [], ingles: [], disponibilidad: [], seniority: [], pais: [], tarifaMin: 0, tarifaMax: 300 };
  VX.searchQuery = '';
  const searchEl = document.getElementById('semanticSearch');
  if (searchEl) searchEl.value = '';
  const tarifaLabel = document.getElementById('tarifaLabel');
  if (tarifaLabel) tarifaLabel.textContent = '$0 – $300';
  document.querySelectorAll('.filter-chip').forEach(el => {
    el.classList.remove('bg-[#E0F2FE]', 'border-[#0284C7]', 'text-[#0369A1]');
    el.classList.add('bg-surface-container', 'border-transparent', 'text-text-body');
  });
  applyFilters();
}

// ---- RENDER TALENTS SECTION ----
function renderTalentos() {
  applyFilters();
}

function renderTalentGrid() {
  const grid = document.getElementById('talentGrid');
  if (!grid) return;

  const counts = {
    total: VX.talents.filter(t => t.activo !== false).length,
    bench: VX.talents.filter(t => t.disponibilidad === 'Inmediata' && t.activo !== false).length,
    asignados: VX.talents.filter(t => t.asignacion && t.activo !== false).length,
    matchAvg: Math.round(VX.talents.reduce((a, b) => a + (b.match || 80), 0) / (VX.talents.length || 1))
  };
  const totalEl = document.getElementById('metricTotal');
  const benchEl = document.getElementById('metricBench');
  const asigEl = document.getElementById('metricAsig');
  const matchEl = document.getElementById('metricMatch');
  if (totalEl) totalEl.textContent = counts.total;
  if (benchEl) benchEl.textContent = counts.bench;
  if (asigEl) asigEl.textContent = counts.asignados;
  if (matchEl) matchEl.textContent = `${counts.matchAvg}%`;

  if (VX.filteredTalents.length === 0) {
    grid.innerHTML = `
      <div class="col-span-3 flex flex-col items-center justify-center py-20 text-center">
        <span class="material-symbols-outlined text-[64px] text-text-muted/40 mb-4">person_search</span>
        <h3 class="text-headline-md font-sans font-bold text-text-heading mb-2">Sin resultados</h3>
        <p class="text-body-md font-sans text-text-muted mb-4">Intentá ajustar los filtros o la búsqueda</p>
        <button onclick="resetFilters()" class="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container text-label-lg font-label font-bold hover:bg-primary transition-all">Limpiar filtros</button>
      </div>`;
    return;
  }

  grid.innerHTML = VX.filteredTalents.map(t => {
    const status = getStatusBadge(t.disponibilidad);
    const matchColor = getMatchColor(t.match);
    const isSelected = VX.selectedTalents.has(String(t.id));
    const visibleStack = t.stack.slice(0, 3);
    const extraStack = t.stack.length - 3;

    return `
    <div class="group bg-surface-card rounded-xl border border-border-subtle hover:border-border-strong hover:shadow-[0_10px_15px_-3px_rgba(15,23,42,0.06)] transition-all duration-200 flex flex-col overflow-hidden ${isSelected ? 'ring-2 ring-primary border-primary' : ''}">
      <!-- Selection check -->
      <div class="px-4 pt-4 flex items-start justify-between gap-2">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleSelectTalent('${t.id}', this)" class="w-4 h-4 rounded border-border-strong accent-primary"/>
          <span class="text-label-sm font-label text-text-muted">Añadir a propuesta</span>
        </label>
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-label font-bold ${matchColor}">
          <span class="material-symbols-outlined text-[12px]">auto_awesome</span>
          ${t.match}%
        </span>
      </div>

      <!-- Avatar + info -->
      <div onclick="openTalentModal('${t.id}')" class="px-4 pt-3 pb-2 flex items-start gap-3 cursor-pointer group-hover:bg-surface-canvas/50 transition-colors" title="Ver ficha completa">
        <div class="relative shrink-0">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-container to-primary flex items-center justify-center text-on-primary-container font-sans font-bold text-[18px]">
            ${getInitials(t.nombre)}
          </div>
          <span class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${status.dot} ring-2 ring-surface-card"></span>
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="text-headline-sm font-sans font-bold text-text-heading truncate group-hover:text-primary transition-colors">${t.nombre}</h3>
          <p class="text-body-sm font-sans text-text-muted truncate">${t.rol} · ${t.seniority}</p>
          <div class="flex items-center gap-2 mt-1">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-label font-bold uppercase tracking-wider ${status.bg} ${status.text}">
              <span class="w-1.5 h-1.5 rounded-full ${status.dot}"></span>
              ${status.label}
            </span>
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-label font-bold ${getInglesColor(t.ingles)}">${t.ingles}</span>
          </div>
        </div>
      </div>

      <!-- Skills row -->
      <div class="px-4 py-2 flex flex-wrap gap-1.5">
        ${visibleStack.map(s => `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container text-text-body text-[11px] font-label font-semibold"><span class="material-symbols-outlined text-[12px] text-primary">${stackIcon(s)}</span>${s}</span>`).join('')}
        ${extraStack > 0 ? `<span class="px-2 py-0.5 rounded-full bg-surface-container-high text-text-muted text-[11px] font-label font-semibold">+${extraStack}</span>` : ''}
      </div>

      <!-- Metrics row -->
      <div class="px-4 py-2 grid grid-cols-3 gap-2 border-t border-border-subtle">
        <div class="flex flex-col items-center">
          <span class="text-label-lg font-label font-bold text-text-heading">$${t.tarifa}</span>
          <span class="text-[10px] font-label text-text-muted">por hora</span>
        </div>
        <div class="flex flex-col items-center border-x border-border-subtle">
          <span class="text-label-lg font-label font-bold text-text-heading">${t.experiencia}a</span>
          <span class="text-[10px] font-label text-text-muted">experiencia</span>
        </div>
        <div class="flex flex-col items-center">
          <span class="text-label-lg font-label font-bold text-text-heading">${t.zona}</span>
          <span class="text-[10px] font-label text-text-muted">${t.pais.slice(0, 3).toUpperCase()}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="px-4 py-3 flex items-center justify-between gap-2 bg-surface-canvas">
        <button onclick="openTalentModal('${t.id}')" class="flex-1 text-label-md font-label font-bold text-primary hover:text-primary/80 text-center py-1.5 rounded-lg hover:bg-surface-container-low transition-all">Ver Ficha</button>
        <div class="w-px h-5 bg-border-subtle"></div>
        <button onclick="addTalentToProposal('${t.id}')" class="flex-1 text-center py-1.5 px-3 rounded-lg bg-primary-container text-on-primary-container text-label-md font-label font-bold hover:bg-primary transition-all">+ Propuesta</button>
        <div class="w-px h-5 bg-border-subtle"></div>
        <button onclick="event.stopPropagation(); deleteTalentDirectly('${t.id}')" title="Eliminar de Supabase" class="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error-container/20 transition-all flex items-center justify-center">
          <span class="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
    </div>`;
  }).join('');
}

function toggleSelectTalent(id, checkbox) {
  if (checkbox.checked) {
    VX.selectedTalents.add(String(id));
  } else {
    VX.selectedTalents.delete(String(id));
  }
  updateSelectionBanner();
  renderTalentGrid();
}

function addTalentToProposal(id) {
  VX.selectedTalents.add(String(id));
  updateSelectionBanner();
  renderTalentGrid();
  showToast(`Talento añadido a propuesta (${VX.selectedTalents.size} seleccionados)`, 'success');
}

function updateSelectionBanner() {
  const banner = document.getElementById('selectionBanner');
  const count = document.getElementById('selectionCount');
  if (!banner) return;
  if (VX.selectedTalents.size > 0) {
    banner.classList.remove('hidden');
    count.textContent = VX.selectedTalents.size;
  } else {
    banner.classList.add('hidden');
  }
}

// ---- TALENT MODAL ----
function openTalentModal(id) {
  const t = VX.talents.find(x => String(x.id) === String(id));
  if (!t) return;
  const status = getStatusBadge(t.disponibilidad);
  const modal = document.getElementById('talentModal');
  const content = document.getElementById('talentModalContent');

  content.innerHTML = `
    <div class="flex items-start justify-between mb-6">
      <div class="flex items-center gap-4">
        <div class="relative">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-container to-primary flex items-center justify-center text-on-primary-container font-sans font-bold text-2xl">
            ${getInitials(t.nombre)}
          </div>
          <span class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${status.dot} ring-2 ring-surface-card"></span>
        </div>
        <div>
          <h2 class="text-headline-lg font-sans font-bold text-text-heading">${t.nombre}</h2>
          <p class="text-body-md font-sans text-text-muted">${t.rol} · ${t.seniority}</p>
          <div class="flex items-center gap-2 mt-1">
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-label font-bold ${status.bg} ${status.text}"><span class="w-1.5 h-1.5 rounded-full ${status.dot}"></span>${status.label}</span>
            <span class="inline-flex px-2.5 py-0.5 rounded-full text-label-sm font-label font-bold ${getInglesColor(t.ingles)}">${t.ingles} English</span>
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-label-sm font-label font-bold text-text-body"><span class="material-symbols-outlined text-[12px] text-primary">auto_awesome</span>${t.match}% Match</span>
          </div>
        </div>
      </div>
      <button onclick="closeTalentModal()" class="p-2 rounded-lg text-text-muted hover:text-text-heading hover:bg-surface-container transition-all">
        <span class="material-symbols-outlined text-[22px]">close</span>
      </button>
    </div>

    <!-- Contact row -->
    <div class="grid grid-cols-3 gap-3 mb-5">
      <a href="mailto:${t.email}" class="flex flex-col items-center gap-1 p-3 rounded-xl bg-surface-canvas border border-border-subtle hover:border-primary hover:bg-surface-container-low transition-all">
        <span class="material-symbols-outlined text-primary text-[20px]">mail</span>
        <span class="text-label-sm font-label text-text-muted text-center break-all">${t.email}</span>
      </a>
      <a href="tel:${t.telefono}" class="flex flex-col items-center gap-1 p-3 rounded-xl bg-surface-canvas border border-border-subtle hover:border-primary hover:bg-surface-container-low transition-all">
        <span class="material-symbols-outlined text-primary text-[20px]">phone_in_talk</span>
        <span class="text-label-sm font-label text-text-muted text-center">${t.telefono}</span>
      </a>
      <a href="https://${t.linkedin}" target="_blank" class="flex flex-col items-center gap-1 p-3 rounded-xl bg-surface-canvas border border-border-subtle hover:border-primary hover:bg-surface-container-low transition-all">
        <span class="material-symbols-outlined text-primary text-[20px]">link</span>
        <span class="text-label-sm font-label text-text-muted text-center">LinkedIn</span>
      </a>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-4 gap-3 mb-5">
      <div class="bg-surface-canvas rounded-xl p-3 text-center border border-border-subtle">
        <div class="text-headline-md font-sans font-bold text-text-heading">${t.experiencia}a</div>
        <div class="text-label-sm font-label text-text-muted">Experiencia</div>
      </div>
      <div class="bg-surface-canvas rounded-xl p-3 text-center border border-border-subtle">
        <div class="text-headline-md font-sans font-bold text-primary">$${t.tarifa}</div>
        <div class="text-label-sm font-label text-text-muted">por hora</div>
      </div>
      <div class="bg-surface-nasa rounded-xl p-3 text-center border border-border-subtle">
        <div class="text-headline-md font-sans font-bold text-text-heading">${t.zona}</div>
        <div class="text-label-sm font-label text-text-muted">Zona horaria</div>
      </div>
      <div class="bg-surface-nasa rounded-xl p-3 text-center border border-border-subtle">
        <div class="text-headline-md font-sans font-bold text-text-heading">${t.pais}</div>
        <div class="text-label-sm font-label text-text-muted">País</div>
      </div>
    </div>

    <!-- Resumen -->
    <div class="mb-5">
      <h4 class="text-label-lg font-label font-bold text-text-heading uppercase tracking-wider mb-2">Resumen Ejecutivo</h4>
      <p class="text-body-md font-sans text-text-body leading-relaxed">${t.resumen}</p>
    </div>

    <!-- Stack -->
    <div class="mb-5">
      <h4 class="text-label-lg font-label font-bold text-text-heading uppercase tracking-wider mb-2">Stack Tecnológico</h4>
      <div class="flex flex-wrap gap-2">
        ${t.stack.map(s => `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container border border-border-subtle text-text-body text-label-md font-label font-semibold"><span class="material-symbols-outlined text-[14px] text-primary">${stackIcon(s)}</span>${s}</span>`).join('')}
      </div>
    </div>

    <!-- Certificaciones -->
    ${t.certificaciones.length > 0 ? `
    <div class="mb-5">
      <h4 class="text-label-lg font-label font-bold text-text-heading uppercase tracking-wider mb-2">Certificaciones</h4>
      <div class="flex flex-wrap gap-2">
        ${t.certificaciones.map(c => `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] text-[#065F46] text-label-md font-label font-bold"><span class="material-symbols-outlined text-[14px]">verified</span>${c}</span>`).join('')}
      </div>
    </div>` : ''}

    <!-- Proyectos -->
    <div class="mb-5">
      <h4 class="text-label-lg font-label font-bold text-text-heading uppercase tracking-wider mb-2">Proyectos Destacados</h4>
      <div class="flex flex-col gap-2">
        ${t.proyectos.map(p => `<div class="flex items-center gap-2 p-3 rounded-xl bg-surface-canvas border border-border-subtle"><span class="material-symbols-outlined text-primary text-[18px] shrink-0">work_history</span><span class="text-body-md font-sans text-text-body">${p}</span></div>`).join('')}
      </div>
    </div>

    <!-- Asignación actual -->
    <div class="mb-6">
      <h4 class="text-label-lg font-label font-bold text-text-heading uppercase tracking-wider mb-2">Estado de Asignación</h4>
      ${t.asignacion ? `
        <div class="flex items-center gap-3 p-3 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE]">
          <span class="material-symbols-outlined text-status-placed text-[20px]">assignment</span>
          <div><div class="text-label-lg font-label font-bold text-[#3730A3]">Asignado a ${t.asignacion.cliente}</div>
          <div class="text-body-sm font-sans text-text-muted">${t.asignacion.horas}h semanales comprometidas</div></div>
        </div>` :
      `<div class="flex items-center gap-3 p-3 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0]">
          <span class="material-symbols-outlined text-status-available text-[20px]">check_circle</span>
          <div><div class="text-label-lg font-label font-bold text-[#065F46]">Disponible</div>
          <div class="text-body-sm font-sans text-text-muted">Listo para incorporación inmediata</div></div>
        </div>`}
    </div>

    ${t.cv_url ? `
    <div class="mb-5">
      <a href="${t.cv_url}" target="_blank" class="flex items-center gap-2 p-3 rounded-xl bg-surface-container-low border border-primary/20 text-primary hover:underline font-label font-bold text-label-md">
        <span class="material-symbols-outlined text-[20px]">description</span>Ver Documento CV Adjunto en Supabase
      </a>
    </div>` : ''}

    <!-- CTA -->
    <div class="flex gap-3">
      <button onclick="addTalentToProposal(${t.id}); closeTalentModal();" class="flex-1 py-2.5 rounded-lg bg-primary-container text-on-primary-container text-label-lg font-label font-bold hover:bg-primary transition-all flex items-center justify-center gap-2">
        <span class="material-symbols-outlined text-[18px]">co_present</span>Agregar a Propuesta
      </button>
      <button onclick="deleteTalentDirectly('${t.id}')" class="px-4 py-2.5 rounded-lg bg-error-container text-error text-label-lg font-label font-bold hover:bg-error/20 transition-all flex items-center gap-1">
        <span class="material-symbols-outlined text-[18px]">delete</span>Eliminar
      </button>
      <button onclick="closeTalentModal()" class="px-4 py-2.5 rounded-lg border border-border-strong text-text-heading text-label-lg font-label font-bold hover:bg-surface-container-low transition-all">Cerrar</button>
    </div>
  `;
  modal.classList.remove('hidden');
  setTimeout(() => modal.querySelector('.modal-panel').classList.add('translate-x-0'), 10);
}

function closeTalentModal() {
  const modal = document.getElementById('talentModal');
  modal.querySelector('.modal-panel').classList.remove('translate-x-0');
  setTimeout(() => modal.classList.add('hidden'), 300);
}

// ---- RENDER CLIENTS ----
function renderClientes() {
  renderClientList();
  if (VX.activeclientId) {
    renderClientDetail(VX.activeclientId);
  } else {
    renderClientDetail(VX.clients[0].id);
    VX.activeclientId = VX.clients[0].id;
  }
}

function renderClientes() {
  renderClientList();
  if (!VX.activeclientId && VX.clients.length > 0) {
    VX.activeclientId = VX.clients[0].id;
  }
  if (VX.activeclientId) {
    renderClientDetail(VX.activeclientId);
  }
}

function renderClientList() {
  const mainList = document.getElementById('clientList');
  const sidebarList = document.getElementById('sidebarClientList');

  const html = VX.clients.map(c => {
    const active = String(VX.activeclientId) === String(c.id);
    const isCompleted = c.estado === 'Completed' || c.estado === 'Completado';
    const statusColor = { 
      'Activo': 'bg-status-available', 
      'Completed': 'bg-status-available ring-2 ring-emerald-400',
      'Completado': 'bg-status-available ring-2 ring-emerald-400',
      'En negociación': 'bg-status-interviewing', 
      'Inactivo': 'bg-status-placed' 
    };
    return `
    <button onclick="selectClient('${c.id}')" class="w-full text-left px-3 py-2.5 rounded-xl border transition-all ${
      active 
        ? 'bg-primary-container text-on-primary-container border-primary/30 shadow-sm font-bold' 
        : 'bg-surface-card border-border-subtle hover:border-border-strong text-text-heading hover:bg-surface-container-low'
    }">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0 flex-1">
          <div class="text-label-md font-label truncate flex items-center gap-1.5 ${active ? 'text-on-primary-container' : 'text-text-heading'}">
            ${c.nombre}
            ${isCompleted ? '<span class="material-symbols-outlined text-[14px] text-emerald-400" title="Completed">verified</span>' : ''}
          </div>
          <div class="text-body-sm font-sans ${active ? 'text-on-primary-container/80' : 'text-text-muted'} truncate">${c.sector || 'Tech'} · Tier ${c.tier || 1}</div>
        </div>
        <span class="w-2 h-2 rounded-full shrink-0 ${statusColor[c.estado] || 'bg-status-available'}"></span>
      </div>
      <div class="mt-1 flex items-center gap-2">
        <span class="text-[10px] font-label font-bold ${active ? 'text-on-primary-container/80' : 'text-text-muted'} uppercase tracking-wider">${c.talentoAsignado?.length || 0} recurso${c.talentoAsignado?.length !== 1 ? 's' : ''}</span>
        <span class="opacity-50">·</span>
        <span class="text-[10px] font-label font-bold ${active ? 'text-on-primary-container/80' : 'text-text-muted'} uppercase tracking-wider">${c.calls?.length || 0} call${c.calls?.length !== 1 ? 's' : ''}</span>
      </div>
    </button>`;
  }).join('');

  if (mainList) mainList.innerHTML = html;
  if (sidebarList) sidebarList.innerHTML = html;
  renderTopClientSelector();
}

function renderTopClientSelector() {
  const container = document.getElementById('topClientSelector');
  if (!container) return;
  container.innerHTML = VX.clients.map(c => {
    const active = String(VX.activeclientId) === String(c.id);
    const isCompleted = c.estado === 'Completed' || c.estado === 'Completado';
    return `
      <button onclick="selectClient('${c.id}')" class="px-3 py-1.5 rounded-full text-label-md font-label font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
        active 
          ? 'bg-primary text-on-primary shadow-md' 
          : 'bg-surface-canvas text-text-heading hover:bg-surface-container border border-border-subtle hover:border-border-strong'
      }">
        <span class="w-2 h-2 rounded-full ${isCompleted ? 'bg-status-available' : (c.estado === 'Activo' ? 'bg-status-available' : 'bg-status-interviewing')}"></span>
        ${c.nombre}
        ${isCompleted ? '<span class="material-symbols-outlined text-[14px] text-emerald-300">verified</span>' : ''}
      </button>
    `;
  }).join('');
}

function selectClient(id) {
  VX.activeclientId = id;
  renderClientList();
  renderClientDetail(id);
}

function goToClient(id) {
  navigate('clientes');
  selectClient(id);
}

function removeFromProposal(id) {
  const strId = String(id);
  VX.selectedTalents.delete(strId);
  VX.selectedTalents.delete(Number(id));
  updateSelectionBanner();
  renderPropuestas();
  renderTalentGrid();
  showToast('Perfil quitado de la propuesta', 'info');
}

function renderClientDetail(id) {
  const c = VX.clients.find(x => String(x.id) === String(id));
  const detail = document.getElementById('clientDetail');
  if (!c || !detail) return;

  const assignedTalents = VX.talents.filter(t => (c.talentoAsignado || []).map(String).includes(String(t.id)));
  const isCompleted = c.estado === 'Completed' || c.estado === 'Completado';
  const statusColor = { 'Activo': '#10B981', 'Completed': '#10B981', 'Completado': '#10B981', 'En negociación': '#F59E0B', 'Inactivo': '#6366F1' };
  const platformIcon = { 'Teams': 'videocam', 'Zoom': 'video_call', 'Google Meet': 'duo' };

  detail.innerHTML = `
    <!-- Client header -->
    <div class="relative bg-surface-card rounded-xl p-6 shadow-sm mb-5 overflow-hidden border border-border-subtle">
      <div class="absolute -right-12 -bottom-12 w-56 h-56 bg-gradient-to-br from-primary-container/10 to-transparent rounded-full pointer-events-none"></div>
      <div class="grid grid-cols-1 md:grid-cols-12 gap-5 items-center relative z-10">
        <div class="md:col-span-5 flex items-start gap-4">
          <div class="w-16 h-16 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0 text-primary">
            <span class="material-symbols-outlined text-[32px]">domain</span>
          </div>
          <div>
            <div class="flex items-center gap-2 mb-0.5">
              <h2 class="text-headline-md font-sans font-bold text-text-heading">${c.nombre}</h2>
              <span class="px-2 py-0.5 rounded-full text-label-sm font-label font-semibold bg-surface-container text-primary">Tier ${c.tier || 1}</span>
            </div>
            <p class="text-body-sm font-sans text-text-muted">${c.sede || 'LATAM'} · ${c.zona || 'UTC-3'}</p>
            <div class="flex items-center gap-3 mt-2">
              <span class="text-label-sm font-label text-text-muted flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px] text-status-available">verified</span>${c.contrato || 'MSA Vigente'}
              </span>
              <span class="text-label-sm font-label text-text-muted flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px] text-primary">schedule</span>${c.pago || 'Net 30'}
              </span>
            </div>
          </div>
        </div>

        <div class="md:col-span-4 bg-surface-container-low rounded-xl p-4">
          <div class="text-label-sm font-label text-text-muted uppercase tracking-wider mb-2">Stakeholder Principal</div>
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-secondary-container to-secondary-fixed-dim flex items-center justify-center text-on-secondary-fixed font-sans font-bold">
              ${getInitials(c.stakeholder?.nombre || 'S H')}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-headline-sm font-sans font-bold text-text-heading truncate">${c.stakeholder?.nombre || '-'}</div>
              <div class="text-body-sm font-sans text-text-muted truncate">${c.stakeholder?.cargo || 'Contacto'}</div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              ${c.stakeholder?.telefono ? `<a href="tel:${c.stakeholder.telefono}" class="w-8 h-8 rounded-lg bg-surface-card hover:bg-surface-container text-primary flex items-center justify-center transition-all shadow-sm" title="Llamar"><span class="material-symbols-outlined text-[18px]">phone_in_talk</span></a>` : ''}
              ${c.stakeholder?.email ? `<a href="mailto:${c.stakeholder.email}" class="w-8 h-8 rounded-lg bg-surface-card hover:bg-surface-container text-primary flex items-center justify-center transition-all shadow-sm" title="Email"><span class="material-symbols-outlined text-[18px]">mail</span></a>` : ''}
            </div>
          </div>
        </div>

        <div class="md:col-span-3 flex flex-col gap-2">
          ${isCompleted ? `
            <div class="flex items-center gap-2 flex-wrap">
              <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-label-sm font-label font-bold bg-[#D1FAE5] text-[#065F46] self-start border border-[#A7F3D0]">
                <span class="material-symbols-outlined text-[16px]">verified</span>Completed / Trabajo Confirmado
              </span>
              <button onclick="unmarkClientCompleted('${c.id}')" class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-label-sm font-label text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-all" title="Revertir estado Completed (requiere doble confirmación)">
                <span class="material-symbols-outlined text-[14px]">undo</span>Revertir
              </button>
            </div>
          ` : `
            <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-label-sm font-label font-bold self-start" style="background:${statusColor[c.estado] || '#10B981'}20;color:${statusColor[c.estado] || '#10B981'}">
              <span class="w-2 h-2 rounded-full" style="background:${statusColor[c.estado] || '#10B981'}"></span>${c.estado || 'Activo'}
            </span>
          `}
          <div class="flex items-center gap-2 mt-1">
            <button onclick="openNewClientModal('${c.id}')" class="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-surface-card border border-border-subtle text-text-heading text-label-md font-label font-bold hover:bg-surface-container-low transition-all shadow-sm">
              <span class="material-symbols-outlined text-[16px] text-primary">edit</span>Editar
            </button>
            <button onclick="deleteClientDirectly('${c.id}')" class="flex items-center justify-center p-1.5 rounded-lg bg-error-container border border-error/20 text-error hover:bg-error/20 transition-all shadow-sm" title="Eliminar cliente">
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Implementación Requerida & Especificaciones -->
    <div class="bg-surface-card rounded-xl p-6 shadow-sm mb-5 border border-border-subtle">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-[22px]">architecture</span>
          <h3 class="text-headline-sm font-sans font-bold text-text-heading">Implementación Requerida & Requerimientos Técnicos</h3>
        </div>
        <label class="flex items-center gap-2 cursor-pointer text-label-sm font-label font-semibold text-text-heading bg-surface-canvas px-3 py-1.5 rounded-lg border border-border-subtle hover:bg-surface-container-low transition-all">
          <input type="checkbox" id="editNecToggle_${c.id}" onchange="toggleInlineEdit('${c.id}', 'necesidades')" class="w-4 h-4 rounded text-primary border-border-strong focus:ring-primary">
          <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px] text-primary">edit_note</span>Habilitar edición</span>
        </label>
      </div>

      <div id="viewNec_${c.id}" class="text-body-md font-sans text-text-body leading-relaxed whitespace-pre-wrap bg-surface-canvas p-4 rounded-xl border border-border-subtle min-h-[80px]">
        ${c.necesidades || 'Sin requerimientos de implementación registrados. Habilitá edición para pegar las especificaciones del proyecto.'}
      </div>

      <div id="editNecBox_${c.id}" class="hidden flex flex-col gap-3">
        <textarea id="textareaNec_${c.id}" class="w-full text-body-md font-sans text-text-heading bg-surface-canvas p-4 rounded-xl border border-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[140px]" placeholder="Escribí o pegá información de implementación...">${c.necesidades || ''}</textarea>
        <div class="flex justify-end">
          <button id="saveNecBtn_${c.id}" onclick="saveInlineClientField('${c.id}', 'necesidades')" class="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary font-label text-label-md font-bold hover:bg-primary-fixed-variant transition-all shadow-md">
            <span class="material-symbols-outlined text-[18px]">save</span>Guardar Cambios
          </button>
        </div>
      </div>
    </div>

    <!-- Notas de Reunión & Ideas -->
    <div class="bg-surface-card rounded-xl p-6 shadow-sm mb-5 border border-border-subtle">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-[22px]">notes</span>
          <h3 class="text-headline-sm font-sans font-bold text-text-heading">Notas de Reuniones, Ideas & Acuerdos</h3>
        </div>
        <label class="flex items-center gap-2 cursor-pointer text-label-sm font-label font-semibold text-text-heading bg-surface-canvas px-3 py-1.5 rounded-lg border border-border-subtle hover:bg-surface-container-low transition-all">
          <input type="checkbox" id="editNotasToggle_${c.id}" onchange="toggleInlineEdit('${c.id}', 'notas')" class="w-4 h-4 rounded text-primary border-border-strong focus:ring-primary">
          <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px] text-primary">edit_note</span>Habilitar edición</span>
        </label>
      </div>

      <div id="viewNotas_${c.id}" class="text-body-md font-sans text-text-body leading-relaxed whitespace-pre-wrap bg-surface-canvas p-4 rounded-xl border border-border-subtle min-h-[60px]">
        ${c.notas || 'Sin notas adicionales. Habilitá edición para pegar resúmenes de llamadas, ideas del cliente o fragmentos.'}
      </div>

      <div id="editNotasBox_${c.id}" class="hidden flex flex-col gap-3">
        <textarea id="textareaNotas_${c.id}" class="w-full text-body-md font-sans text-text-heading bg-surface-canvas p-4 rounded-xl border border-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px]" placeholder="Escribí o pegá notas de reuniones...">${c.notas || ''}</textarea>
        <div class="flex justify-end">
          <button id="saveNotasBtn_${c.id}" onclick="saveInlineClientField('${c.id}', 'notas')" class="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary font-label text-label-md font-bold hover:bg-primary-fixed-variant transition-all shadow-md">
            <span class="material-symbols-outlined text-[18px]">save</span>Guardar Cambios
          </button>
        </div>
      </div>
    </div>

    <!-- Propuesta del Cliente -->
    <div class="bg-surface-card rounded-xl p-6 shadow-sm mb-5 border border-border-subtle">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-[22px]">description</span>
          <h3 class="text-headline-sm font-sans font-bold text-text-heading">Propuesta para el Cliente</h3>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="navigate('propuestas'); selectProposalClient('${c.id}');" class="px-3 py-1.5 rounded-lg bg-surface-container-high text-primary text-label-sm font-label font-bold hover:bg-surface-container transition-all flex items-center gap-1">
            <span class="material-symbols-outlined text-[16px]">co_present</span>Ir a Propuestas Client-Ready
          </button>
          <label class="flex items-center gap-2 cursor-pointer text-label-sm font-label font-semibold text-text-heading bg-surface-canvas px-3 py-1.5 rounded-lg border border-border-subtle hover:bg-surface-container-low transition-all">
            <input type="checkbox" id="editPropuestaTextoToggle_${c.id}" onchange="toggleInlineEdit('${c.id}', 'propuestaTexto')" class="w-4 h-4 rounded text-primary border-border-strong focus:ring-primary">
            <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px] text-primary">edit_note</span>Habilitar edición</span>
          </label>
        </div>
      </div>

      <div id="viewPropuestaTexto_${c.id}" class="text-body-md font-sans text-text-body leading-relaxed whitespace-pre-wrap bg-surface-canvas p-4 rounded-xl border border-border-subtle min-h-[80px]">
        ${c.propuestaTexto || 'Sin propuesta escrita aún. Habilitá edición para redactar o pegar el texto de la propuesta comercial/técnica.'}
      </div>

      <div id="editPropuestaTextoBox_${c.id}" class="hidden flex flex-col gap-3">
        <textarea id="textareaPropuestaTexto_${c.id}" class="w-full text-body-md font-sans text-text-heading bg-surface-canvas p-4 rounded-xl border border-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[140px]" placeholder="Escribí o pegá la propuesta técnica o comercial...">${c.propuestaTexto || ''}</textarea>
        <div class="flex justify-end">
          <button id="savePropuestaTextoBtn_${c.id}" onclick="saveInlineClientField('${c.id}', 'propuestaTexto')" class="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary font-label text-label-md font-bold hover:bg-primary-fixed-variant transition-all shadow-md">
            <span class="material-symbols-outlined text-[18px]">save</span>Guardar Propuesta
          </button>
        </div>
      </div>
    </div>

    <!-- Archivos & Documentos Adjuntos -->
    <div class="bg-surface-card rounded-xl p-6 shadow-sm mb-5 border border-border-subtle">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-[22px]">folder_open</span>
          <h3 class="text-headline-sm font-sans font-bold text-text-heading">Archivos & Documentos Adjuntos</h3>
          <span class="px-2 py-0.5 rounded-full bg-surface-container text-primary text-label-sm font-label font-bold">${(c.archivos || []).length}</span>
        </div>
        <label class="cursor-pointer flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-container text-on-primary-container text-label-md font-label font-bold hover:bg-primary transition-all shadow-sm">
          <span class="material-symbols-outlined text-[18px]">upload_file</span>+ Subir Archivo
          <input type="file" class="hidden" onchange="handleClientFileUpload('${c.id}', this)" accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"/>
        </label>
      </div>

      <div class="flex flex-col gap-2">
        ${(!c.archivos || c.archivos.length === 0) ? `
          <div class="text-center py-6 text-text-muted text-body-sm bg-surface-canvas rounded-xl border border-dashed border-border-subtle">
            No hay archivos subidos aún para este cliente. Adjuntá propuestas en PDF, contratos o especificaciones requeridas.
          </div>` :
          c.archivos.map(f => `
            <div class="flex items-center justify-between p-3 rounded-xl bg-surface-canvas border border-border-subtle hover:border-primary/40 transition-all">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 rounded-lg bg-surface-container-high text-primary flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-[20px]">${f.nombre.endsWith('.pdf') ? 'picture_as_pdf' : 'description'}</span>
                </div>
                <div class="min-w-0">
                  <div class="text-label-md font-label font-bold text-text-heading truncate">${f.nombre}</div>
                  <div class="text-body-sm font-sans text-text-muted">${f.size || ''} · Subido ${f.fecha || 'Recientemente'}</div>
                </div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                ${f.url ? `<a href="${f.url}" target="_blank" class="px-2.5 py-1 rounded-lg bg-surface-card text-primary border border-border-subtle hover:bg-surface-container text-label-sm font-label font-bold flex items-center gap-1">
                  <span class="material-symbols-outlined text-[16px]">download</span>Abrir
                </a>` : ''}
                <button onclick="deleteClientFile('${c.id}', '${f.id}')" class="p-1 rounded-lg text-text-muted hover:text-error hover:bg-error-container transition-all" title="Eliminar archivo">
                  <span class="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          `).join('')
        }
      </div>
    </div>

    <!-- Assigned resources -->
    <div class="bg-surface-card rounded-xl p-5 shadow-sm mb-5 border border-border-subtle">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-[20px]">group</span>
          <h3 class="text-headline-sm font-sans font-bold text-text-heading">Recursos Asignados</h3>
          <span class="px-2 py-0.5 rounded-full bg-surface-container text-primary text-label-sm font-label font-bold">${assignedTalents.length}</span>
        </div>
        <button onclick="openAssignModal('${c.id}')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-container text-on-primary-container text-label-md font-label font-bold hover:bg-primary transition-all">
          <span class="material-symbols-outlined text-[16px]">person_add</span>Asignar Recurso
        </button>
      </div>
      ${assignedTalents.length === 0 ? `
        <div class="flex flex-col items-center py-8 text-center">
          <span class="material-symbols-outlined text-[48px] text-text-muted/30 mb-2">person_search</span>
          <p class="text-body-md font-sans text-text-muted">Sin recursos asignados. <button onclick="openAssignModal('${c.id}')" class="text-primary hover:underline font-bold">Asignar uno</button></p>
        </div>` :
        `<div class="flex flex-col gap-3">
          ${assignedTalents.map(t => {
            const status = getStatusBadge(t.disponibilidad);
            return `<div class="flex items-center gap-3 p-3 rounded-xl bg-surface-canvas border border-border-subtle hover:border-primary/50 transition-all">
              <div onclick="openTalentModal('${t.id}')" class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-container to-primary flex items-center justify-center text-on-primary-container font-sans font-bold text-[14px] shrink-0 cursor-pointer hover:opacity-90 transition-all" title="Ver ficha">${getInitials(t.nombre)}</div>
              <div onclick="openTalentModal('${t.id}')" class="flex-1 min-w-0 cursor-pointer" title="Ver ficha">
                <div class="text-label-lg font-label font-bold text-text-heading truncate hover:text-primary transition-colors">${t.nombre}</div>
                <div class="text-body-sm font-sans text-text-muted">${t.rol} · ${t.asignacion?.horas || 40}h/semana</div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <button onclick="openTalentModal('${t.id}')" class="px-2.5 py-1 rounded-lg text-label-sm font-label font-bold text-primary bg-surface-card hover:bg-surface-container border border-border-subtle transition-all" title="Ver ficha">Ver Ficha</button>
                <button onclick="unassignTalent('${c.id}', '${t.id}')" class="w-7 h-7 rounded-lg text-text-muted hover:text-error hover:bg-error-container transition-all flex items-center justify-center" title="Desasignar"><span class="material-symbols-outlined text-[16px]">person_remove</span></button>
              </div>
            </div>`;
          }).join('')}
        </div>`}
    </div>

    <!-- Calls log -->
    <div class="bg-surface-card rounded-xl p-5 shadow-sm border border-border-subtle">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-[20px]">videocam</span>
          <h3 class="text-headline-sm font-sans font-bold text-text-heading">Bitácora de Calls</h3>
          <span class="px-2 py-0.5 rounded-full bg-surface-container text-primary text-label-sm font-label font-bold">${c.calls?.length || 0}</span>
        </div>
        <button onclick="openNewCallModal('${c.id}')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-canvas border border-border-subtle text-text-heading text-label-md font-label font-bold hover:bg-surface-container-low transition-all shadow-sm">
          <span class="material-symbols-outlined text-[16px] text-primary">add</span>Nueva Call
        </button>
      </div>
      <div class="flex flex-col gap-4">
        ${(!c.calls || c.calls.length === 0) ? `
          <div class="text-center py-6 text-text-muted text-body-sm bg-surface-canvas rounded-xl border border-dashed border-border-subtle">
            Sin llamadas registradas. Registrá reuniones con clientes e incluí la transcripción de las mismas.
          </div>` :
          c.calls.map((call, i) => `
          <div class="relative flex gap-4">
            <div class="flex flex-col items-center">
              <div class="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-primary text-[18px]">${platformIcon[call.plataforma] || 'videocam'}</span>
              </div>
              ${i < c.calls.length - 1 ? '<div class="flex-1 w-px bg-border-subtle mt-2 ml-0.5"></div>' : ''}
            </div>
            <div class="flex-1 pb-4">
              <div class="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-label-lg font-label font-bold text-text-heading">${call.plataforma}</span>
                    <span class="px-2 py-0.5 rounded-full bg-surface-container text-text-muted text-[10px] font-label font-semibold uppercase tracking-wider">${call.fecha} · ${call.hora}</span>
                  </div>
                  <div class="text-body-sm font-sans text-text-muted mt-0.5">${call.participantes}</div>
                </div>
                ${call.link ? `<a href="${call.link}" target="_blank" class="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-container text-on-primary-container text-label-sm font-label font-bold hover:bg-primary transition-all">
                  <span class="material-symbols-outlined text-[14px]">open_in_new</span>Grabación
                </a>` : ''}
              </div>
              <div class="p-3 rounded-xl bg-surface-canvas border border-border-subtle">
                <p class="text-body-sm font-sans text-text-body leading-relaxed">${call.notas}</p>
                ${call.transcripcion ? `
                  <details class="mt-2 text-body-sm">
                    <summary class="font-label font-bold text-primary cursor-pointer flex items-center gap-1 select-none py-1">
                      <span class="material-symbols-outlined text-[16px]">description</span>Ver Transcripción Completa
                    </summary>
                    <div class="mt-2 text-text-body font-sans leading-relaxed whitespace-pre-wrap p-3 rounded-lg bg-surface-card border border-border-subtle">
                      ${call.transcripcion}
                    </div>
                  </details>
                ` : ''}
              </div>
            </div>
          </div>`).join('')
        }
      </div>
    </div>
  `;
}

function filterAssignList(query, clientId) {
  const c = VX.clients.find(x => String(x.id) === String(clientId));
  const container = document.getElementById('assignList');
  if (!c || !container) return;

  const q = removeAccents(query || '');
  const assigned = (c.talentoAsignado || []).map(String);
  const available = VX.talents.filter(t => {
    if (t.activo === false || assigned.includes(String(t.id))) return false;
    if (!q) return true;
    const searchable = removeAccents(`${t.nombre} ${t.rol} ${t.seniority} ${(t.stack||[]).join(' ')}`);
    return searchable.includes(q);
  });

  container.innerHTML = available.map(t => {
    const status = getStatusBadge(t.disponibilidad);
    return `<div class="flex items-center gap-3 p-3 rounded-xl bg-surface-canvas border border-border-subtle hover:border-primary transition-all cursor-pointer" onclick="assignTalent('${c.id}', '${t.id}')">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-container to-primary flex items-center justify-center text-on-primary-container font-sans font-bold text-[14px] shrink-0">${getInitials(t.nombre)}</div>
      <div class="flex-1 min-w-0">
        <div class="text-label-lg font-label font-bold text-text-heading">${t.nombre}</div>
        <div class="text-body-sm font-sans text-text-muted">${t.rol} · ${t.seniority} · $${t.tarifa}/h</div>
      </div>
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-label font-bold ${status.bg} ${status.text}"><span class="w-1.5 h-1.5 rounded-full ${status.dot}"></span>${status.label}</span>
    </div>`;
  }).join('');
}

function openAssignModal(clientId) {
  const modal = document.getElementById('assignModal');
  const content = document.getElementById('assignModalContent');
  const c = VX.clients.find(x => String(x.id) === String(clientId));
  if (!c || !modal || !content) return;

  const assigned = (c.talentoAsignado || []).map(String);
  const available = VX.talents.filter(t => t.activo !== false && !assigned.includes(String(t.id)));

  content.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-headline-sm font-sans font-bold text-text-heading">Asignar Recurso a ${c.nombre}</h3>
      <button onclick="document.getElementById('assignModal').classList.add('hidden')" class="p-1.5 rounded-lg text-text-muted hover:bg-surface-container transition-all"><span class="material-symbols-outlined text-[20px]">close</span></button>
    </div>
    <div class="mb-3">
      <input type="text" placeholder="Buscar talento por nombre, rol o skill..." class="w-full h-10 px-3 rounded-xl border border-border-strong bg-surface-card text-body-md font-sans focus:outline-none focus:border-primary" oninput="filterAssignList(this.value, '${c.id}')"/>
    </div>
    <div id="assignList" class="flex flex-col gap-2 max-h-80 overflow-y-auto">
      ${available.length === 0 ? '<div class="text-center py-6 text-text-muted text-body-sm">No hay más recursos disponibles para asignar.</div>' :
        available.map(t => {
          const status = getStatusBadge(t.disponibilidad);
          return `<div class="flex items-center gap-3 p-3 rounded-xl bg-surface-canvas border border-border-subtle hover:border-primary transition-all cursor-pointer" onclick="assignTalent('${c.id}', '${t.id}')">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-container to-primary flex items-center justify-center text-on-primary-container font-sans font-bold text-[14px] shrink-0">${getInitials(t.nombre)}</div>
            <div class="flex-1 min-w-0">
              <div class="text-label-lg font-label font-bold text-text-heading">${t.nombre}</div>
              <div class="text-body-sm font-sans text-text-muted">${t.rol} · ${t.seniority} · $${t.tarifa}/h</div>
            </div>
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-label font-bold ${status.bg} ${status.text}"><span class="w-1.5 h-1.5 rounded-full ${status.dot}"></span>${status.label}</span>
          </div>`;
        }).join('')
      }
    </div>
  `;
  modal.classList.remove('hidden');
}

async function assignTalent(clientId, talentId) {
  const c = VX.clients.find(x => String(x.id) === String(clientId));
  const t = VX.talents.find(x => String(x.id) === String(talentId));
  if (!c || !t) return;

  c.talentoAsignado = c.talentoAsignado || [];
  const strTid = String(t.id);
  if (!c.talentoAsignado.map(String).includes(strTid)) {
    c.talentoAsignado.push(t.id);
    t.asignacion = { cliente: c.nombre, horas: 40 };
    t.disponibilidad = 'Asignado';

    await updateClientInSupabase(c.id, { talentoAsignado: c.talentoAsignado });
    if (supabaseClient && t.id) {
      const dbTid = isNaN(Number(t.id)) ? t.id : Number(t.id);
      await supabaseClient.from('talents').update({
        disponibilidad: 'Asignado',
        asignacion: JSON.stringify(t.asignacion)
      }).eq('id', dbTid);
    }
  }

  const modal = document.getElementById('assignModal');
  if (modal) modal.classList.add('hidden');

  showToast(`${t.nombre} asignado a ${c.nombre} ✓`, 'success');
  renderClientList();
  if (VX.currentSection === 'clientes') renderClientDetail(c.id);
  if (VX.currentSection === 'propuestas') renderPropuestas();
}

async function unassignTalent(clientId, talentId) {
  const c = VX.clients.find(x => String(x.id) === String(clientId));
  const t = VX.talents.find(x => String(x.id) === String(talentId));
  if (!c || !t) return;

  c.talentoAsignado = (c.talentoAsignado || []).filter(id => String(id) !== String(talentId));
  t.asignacion = null;
  t.disponibilidad = 'Inmediata';

  await updateClientInSupabase(c.id, { talentoAsignado: c.talentoAsignado });
  if (supabaseClient && t.id) {
    const dbTid = isNaN(Number(t.id)) ? t.id : Number(t.id);
    await supabaseClient.from('talents').update({
      disponibilidad: 'Inmediata',
      asignacion: null
    }).eq('id', dbTid);
  }

  showToast(`${t.nombre} desasignado`, 'info');
  renderClientList();
  if (VX.currentSection === 'clientes') renderClientDetail(c.id);
  if (VX.currentSection === 'propuestas') renderPropuestas();
}

function openNewCallModal(clientId) {
  const modal = document.getElementById('callModal');
  const content = document.getElementById('callModalContent');
  if (!modal || !content) return;
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().slice(0, 5);

  content.innerHTML = `
    <div class="flex items-center justify-between mb-4 pb-3 border-b border-border-subtle">
      <h3 class="text-headline-sm font-sans font-bold text-text-heading flex items-center gap-2">
        <span class="material-symbols-outlined text-primary">videocam</span>Registrar Nueva Call
      </h3>
      <button onclick="document.getElementById('callModal').classList.add('hidden')" class="p-1 rounded-lg text-text-muted hover:text-text-heading">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>
    <div class="flex flex-col gap-4">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-label-sm font-label font-bold text-text-heading mb-1 block">Fecha</label>
          <input type="date" id="callFecha" value="${today}" class="w-full h-10 px-3 rounded-xl border border-border-strong bg-surface-card text-body-md font-sans focus:outline-none focus:border-primary"/>
        </div>
        <div>
          <label class="text-label-sm font-label font-bold text-text-heading mb-1 block">Hora</label>
          <input type="time" id="callHora" value="${now}" class="w-full h-10 px-3 rounded-xl border border-border-strong bg-surface-card text-body-md font-sans focus:outline-none focus:border-primary"/>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-label-sm font-label font-bold text-text-heading mb-1 block">Plataforma</label>
          <select id="callPlataforma" class="w-full h-10 px-3 rounded-xl border border-border-strong bg-surface-card text-body-md font-sans focus:outline-none focus:border-primary">
            <option>Teams</option><option>Zoom</option><option>Google Meet</option><option>Otra</option>
          </select>
        </div>
        <div>
          <label class="text-label-sm font-label font-bold text-text-heading mb-1 block">Participantes</label>
          <input type="text" id="callParticipantes" placeholder="ej: Juan Pérez (Cliente), Ana (VX)" class="w-full h-10 px-3 rounded-xl border border-border-strong bg-surface-card text-body-md font-sans focus:outline-none focus:border-primary"/>
        </div>
      </div>
      <div>
        <label class="text-label-sm font-label font-bold text-text-heading mb-1 block">Link a grabación (opcional)</label>
        <input type="url" id="callLink" placeholder="https://teams.microsoft.com/..." class="w-full h-10 px-3 rounded-xl border border-border-strong bg-surface-card text-body-md font-sans focus:outline-none focus:border-primary"/>
      </div>
      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="text-label-sm font-label font-bold text-text-heading block">Transcripción Completa de la Call</label>
          <button onclick="aiSummarizeCallTranscript()" type="button" class="text-label-sm font-label text-primary font-bold hover:underline flex items-center gap-1">
            <span class="material-symbols-outlined text-[16px]">auto_awesome</span>Extraer Resumen con IA
          </button>
        </div>
        <textarea id="callTranscripcion" rows="4" placeholder="Pegá la transcripción completa de la llamada aquí..." class="w-full p-3 rounded-xl border border-border-strong bg-surface-card text-body-md font-sans focus:outline-none focus:border-primary resize-y mb-2"></textarea>
      </div>
      <div>
        <label class="text-label-sm font-label font-bold text-text-heading mb-1 block">Notas / Resumen Ejecutivo</label>
        <textarea id="callNotas" rows="3" placeholder="Resumen de acuerdos, requerimientos solicitados y próximos pasos..." class="w-full p-3 rounded-xl border border-border-strong bg-surface-card text-body-md font-sans focus:outline-none focus:border-primary resize-y"></textarea>
      </div>
      <div class="flex justify-end gap-2 pt-3 border-t border-border-subtle">
        <button type="button" onclick="document.getElementById('callModal').classList.add('hidden')" class="px-4 py-2.5 rounded-xl border border-border-strong text-text-heading text-label-md font-label font-bold hover:bg-surface-container-low">Cancelar</button>
        <button type="button" onclick="saveCall('${clientId}')" class="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary-container text-label-md font-label font-bold hover:bg-primary transition-all flex items-center gap-1.5 shadow-sm">
          <span class="material-symbols-outlined text-[18px]">save</span>Guardar Call
        </button>
      </div>
    </div>
  `;
  modal.classList.remove('hidden');
}

function aiSummarizeCallTranscript() {
  const tr = document.getElementById('callTranscripcion')?.value || '';
  const notesEl = document.getElementById('callNotas');
  if (!tr.trim()) {
    showToast('Pegá primero una transcripción para resumir', 'info');
    return;
  }
  const lines = tr.split('\n').map(l => l.trim()).filter(Boolean);
  let summary = `📌 Resumen de la Call (IA):\n`;
  summary += `• ${lines[0] || 'Reunión de alineación de proyecto.'}\n`;
  if (lines.length > 2) {
    summary += `• Temas claves: ${lines.slice(1, 4).join(' / ').slice(0, 140)}...\n`;
  }
  summary += `• Próximos pasos: Definir propuesta técnica y asignación de recursos.`;

  if (notesEl) notesEl.value = summary;
  showToast('Resumen generado desde la transcripción ✨', 'success');
}

async function saveCall(clientId) {
  const c = VX.clients.find(x => String(x.id) === String(clientId));
  if (!c) return;
  const call = {
    id: Date.now(),
    fecha: document.getElementById('callFecha')?.value || new Date().toISOString().split('T')[0],
    hora: document.getElementById('callHora')?.value || '12:00',
    plataforma: document.getElementById('callPlataforma')?.value || 'Teams',
    participantes: document.getElementById('callParticipantes')?.value || 'Sin especificar',
    link: document.getElementById('callLink')?.value || null,
    transcripcion: document.getElementById('callTranscripcion')?.value || '',
    notas: document.getElementById('callNotas')?.value || 'Sin notas.'
  };
  c.calls = c.calls || [];
  c.calls.unshift(call);

  await updateClientInSupabase(c.id, { calls: c.calls });

  document.getElementById('callModal').classList.add('hidden');
  renderClientDetail(clientId);
  renderClientList();
  showToast('Call registrada correctamente ✓', 'success');
}

// ---- CV PARSER SECTION ----
function initCVParser() {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('cvFileInput');
  if (!dropZone || !fileInput) return;

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('border-primary', 'bg-surface-container-low');
  });
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('border-primary', 'bg-surface-container-low');
  });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-primary', 'bg-surface-container-low');
    const files = e.dataTransfer.files;
    if (files.length > 0) processCV(files[0]);
  });
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) processCV(e.target.files[0]);
  });
}

async function processCV(file) {
  currentUploadedCVFile = file;
  const dropZone = document.getElementById('dropZone');
  const parsePanel = document.getElementById('cvParsePanel');
  const progressBar = document.getElementById('cvProgress');
  const progressText = document.getElementById('cvProgressText');
  const fileInfo = document.getElementById('cvFileInfo');
  const fileName = document.getElementById('cvFileName');
  const fileSize = document.getElementById('cvFileSize');

  if (!file.name.match(/\.(pdf|docx|doc|txt)$/i)) {
    showToast('Formato no soportado. Usá PDF, DOCX o TXT.', 'error');
    return;
  }

  fileInfo.classList.remove('hidden');
  fileName.textContent = file.name;
  fileSize.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
  dropZone.classList.add('border-primary');

  progressBar.style.width = '20%';
  progressText.textContent = 'Extrayendo texto del documento...';

  const rawText = await extractTextFromFile(file);

  progressBar.style.width = '65%';
  progressText.textContent = 'Analizando habilidades, datos de contacto y experiencia...';

  setTimeout(() => {
    progressBar.style.width = '100%';
    progressText.textContent = '¡Extracción completa! Revisá los datos.';
    fillRealDataFromCV(rawText, file.name);
    parsePanel.classList.remove('hidden');
  }, 400);
}

async function extractTextFromFile(file) {
  let text = "";
  try {
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map(item => item.str).join(" ");
          text += pageText + "\n";
        }
      }
    } else {
      text = await file.text();
    }
  } catch (err) {
    console.error("Error leyendo texto del archivo:", err);
  }
  return text;
}

function fillRealDataFromCV(rawText, filename) {
  const parsed = parseCVContent(rawText, filename);

  for (const [id, val] of Object.entries(parsed)) {
    if (id === 'skills') continue;
    const el = document.getElementById(id);
    if (el) el.value = val;
  }

  const skillsContainer = document.getElementById('parsedSkillsContainer');
  if (skillsContainer && parsed.skills) {
    skillsContainer.innerHTML = parsed.skills.map(s => `
      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container border border-border-subtle text-text-body text-label-md font-label font-semibold">
        <span class="material-symbols-outlined text-[12px] text-primary">${stackIcon(s)}</span>${s}
        <button onclick="this.parentElement.remove()" class="ml-0.5 text-text-muted hover:text-error"><span class="material-symbols-outlined text-[14px]">close</span></button>
      </span>`).join('');
  }
}

function cleanPersonName(rawStr) {
  if (!rawStr) return "Candidato IT";
  let str = rawStr
    .replace(/\.[^/.]+$/, "") // Eliminar extensiones (.pdf, .docx)
    .replace(/\(\d+\)/g, "")  // Eliminar sufijos de copia (1), (2)
    .replace(/[-_]/g, " ")     // Guiones a espacios
    .replace(/\b(cv|resume|curriculum|vitae|v\d+|\d+)\b/gi, "") // Remover palabras clave y números aislados
    .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, " ") // Remover caracteres especiales
    .replace(/\s+/g, " ")
    .trim();
  if (str.length > 2) {
    return str.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  }
  return "Candidato IT";
}

function normalizeCountry(rawText) {
  if (!rawText) return "Argentina";
  const t = rawText.toLowerCase();

  if (/\b(arg|argentina|argentino|argentina|bs as|buenos aires|caba)\b/i.test(t)) return "Argentina";
  if (/\b(col|colombia|colombiano|bogota|medellin)\b/i.test(t)) return "Colombia";
  if (/\b(mex|méxico|mexico|mexicano|cdmx|guadalajara)\b/i.test(t)) return "México";
  if (/\b(cl|chile|chileno|santiago)\b/i.test(t)) return "Chile";
  if (/\b(uy|uruguay|uruguayo|montevideo)\b/i.test(t)) return "Uruguay";
  if (/\b(pe|perú|peru|peruano|lima)\b/i.test(t)) return "Perú";
  return "Argentina";
}

function parseCVContent(text, filename) {
  let cleanFileName = cleanPersonName(filename || '');

  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : "";

  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);
  const telefono = phoneMatch ? phoneMatch[0] : "";

  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  const linkedin = linkedinMatch ? linkedinMatch[0].replace(/^https?:\/\//, '') : "";

  let nombre = cleanFileName;
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 2 && !l.includes("@") && !l.toLowerCase().includes("curriculum"));
  if (lines.length > 0 && lines[0].length < 40 && !/\d/.test(lines[0])) {
    const candidateName = cleanPersonName(lines[0]);
    if (candidateName !== "Candidato IT") nombre = candidateName;
  }

  const knownTechs = [
    "Azure", ".NET", "React", "Node.js", "Python", "SQL", "PostgreSQL", "Kubernetes", "Docker",
    "DevOps", "Terraform", "Jenkins", "JavaScript", "TypeScript", "C#", "Java", "AWS", "GCP",
    "Databricks", "Spark", "IA/ML", "Figma", "UX/UI", "QA", "Cypress", "Selenium", "Salesforce",
    "Scrum", "SAFe", "Power BI", "LLM", "Microservicios", "Security", "Swift", "iOS", "Flutter",
    "React Native", "Android", "MongoDB", "Angular", "Vue", "RabbitMQ", "Redis"
  ];
  const foundSkills = knownTechs.filter(tech => {
    const escaped = tech.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(text);
  });

  const rolesMap = {
    'Cloud Architect': /cloud architect|arquitecto cloud|azure architect/i,
    'DevOps Engineer': /devops|site reliability|sre|ci\/cd/i,
    'Full Stack Developer': /full stack|fullstack|full-stack/i,
    'Data Engineer': /data engineer|ingeniero de datos|databricks|spark/i,
    'Backend Developer': /backend|\.net developer|python developer|java developer|node developer/i,
    'Frontend Developer': /frontend|react developer|angular developer|vue developer/i,
    'Mobile Developer': /mobile|ios developer|android developer|flutter|react native/i,
    'UX/UI Designer': /ux|ui|designer|diseñador|figma/i,
    'QA Engineer': /qa|quality assurance|testing|tester|automation/i,
    'AI/ML Engineer': /ai engineer|ml engineer|machine learning|inteligencia artificial/i,
    'Scrum Master': /scrum master|agile coach/i,
    'Project Manager': /project manager|pmp|lider de proyecto/i
  };

  let detectedRol = "Software Engineer";
  for (const [rolName, regex] of Object.entries(rolesMap)) {
    if (regex.test(text) || regex.test(filename)) {
      detectedRol = rolName;
      break;
    }
  }

  let seniority = "Senior";
  if (/lead|principal|head|director/i.test(text)) seniority = "Lead";
  else if (/semi-senior|ssr|semi senior/i.test(text)) seniority = "Semi-Senior";
  else if (/junior|jr/i.test(text)) seniority = "Junior";
  else if (/senior|sr/i.test(text)) seniority = "Senior";

  const expMatch = text.match(/(\d{1,2})\s*(?:\+)?\s*(?:años|years|yrs)/i);
  const experiencia = expMatch ? parseFloat(expMatch[1]) : 5;

  const pais = normalizeCountry(text);

  let ingles = "C1";
  if (/c2|native|nativo/i.test(text)) ingles = "C2";
  else if (/c1|advanced|avanzado/i.test(text)) ingles = "C1";
  else if (/b2|upper intermediate/i.test(text)) ingles = "B2";
  else if (/b1|intermediate|intermedio/i.test(text)) ingles = "B1";

  let resumen = "Profesional IT con sólida experiencia en desarrollo de software y soluciones tecnológicas.";
  if (text.length > 50) {
    const cleanSnippet = text.replace(/[\r\n]+/g, ' ').slice(0, 300).trim();
    resumen = cleanSnippet.length > 60 ? cleanSnippet + "..." : resumen;
  }

  return {
    parsedNombre: nombre,
    parsedRol: detectedRol,
    parsedEmail: email,
    parsedTelefono: telefono,
    parsedLinkedin: linkedin,
    parsedExperiencia: experiencia,
    parsedTarifa: Math.max(30, experiencia * 10),
    parsedPais: pais,
    parsedIngles: ingles,
    parsedSeniority: seniority,
    parsedResumen: resumen,
    skills: foundSkills.length > 0 ? foundSkills : [detectedRol.includes("Architect") ? "Azure" : "JavaScript", "SQL"]
  };
}

function addSkillChip() {
  const input = document.getElementById('newSkillInput');
  if (!input || !input.value.trim()) return;
  const container = document.getElementById('parsedSkillsContainer');
  const s = input.value.trim();
  const chip = document.createElement('span');
  chip.className = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container border border-border-subtle text-text-body text-label-md font-label font-semibold';
  chip.innerHTML = `<span class="material-symbols-outlined text-[12px] text-primary">${stackIcon(s)}</span>${s}<button onclick="this.parentElement.remove()" class="ml-0.5 text-text-muted hover:text-error"><span class="material-symbols-outlined text-[14px]">close</span></button>`;
  container.appendChild(chip);
  input.value = '';
}

function openManualTalentForm() {
  currentUploadedCVFile = null;
  const fields = ['parsedNombre', 'parsedEmail', 'parsedTelefono', 'parsedLinkedin', 'parsedRol', 'parsedExperiencia', 'parsedTarifa', 'parsedResumen'];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const skillsContainer = document.getElementById('parsedSkillsContainer');
  if (skillsContainer) skillsContainer.innerHTML = '';
  const fileInfo = document.getElementById('cvFileInfo');
  if (fileInfo) fileInfo.classList.add('hidden');
  const parsePanel = document.getElementById('cvParsePanel');
  if (parsePanel) {
    parsePanel.classList.remove('hidden');
    parsePanel.style.display = 'block';
  }
  navigate('cargar-cv');
  showToast('Completá los datos que tengas disponibles. Ningún campo es obligatorio.', 'info');
}

async function confirmCVAndAdd() {
  const nombre = document.getElementById('parsedNombre')?.value?.trim() || 'Candidato IT';
  const rol = document.getElementById('parsedRol')?.value?.trim() || 'Software Engineer';
  const email = document.getElementById('parsedEmail')?.value?.trim() || '';
  const telefono = document.getElementById('parsedTelefono')?.value?.trim() || '';
  const linkedin = document.getElementById('parsedLinkedin')?.value?.trim() || '';
  const experiencia = parseFloat(document.getElementById('parsedExperiencia')?.value) || 0;
  const tarifa = parseInt(document.getElementById('parsedTarifa')?.value) || 0;
  const pais = document.getElementById('parsedPais')?.value || 'Argentina';
  const ingles = document.getElementById('parsedIngles')?.value || 'B2';
  const senioryVal = document.getElementById('parsedSeniority')?.value || 'Senior';
  const resumen = document.getElementById('parsedResumen')?.value?.trim() || 'Perfil cargado en Talent Hub.';

  // High rate warning check
  if (tarifa >= 150) {
    showToast(`⚠️ Advertencia: Tarifa elevada detectada ($${tarifa} USD/h). Se guardará normalmente en Supabase.`, 'info');
    if (tarifa > VX.filters.tarifaMax) {
      VX.filters.tarifaMax = tarifa;
      const tLabel = document.getElementById('tarifaLabel');
      if (tLabel) tLabel.textContent = `$0 – $${tarifa}`;
    }
  }

  // Collect skills
  const skillEls = document.querySelectorAll('#parsedSkillsContainer span');
  const skills = [];
  skillEls.forEach(el => {
    const text = el.childNodes[1]?.textContent?.trim();
    if (text) skills.push(text);
  });

  const zonaMap = { 'Argentina': 'GMT-3', 'Colombia': 'GMT-5', 'México': 'GMT-6', 'Chile': 'GMT-4', 'Uruguay': 'GMT-3' };

  let cv_url = null;
  if (currentUploadedCVFile) {
    showToast('Subiendo archivo CV a Supabase Storage...', 'info');
    cv_url = await uploadCVFileToSupabase(currentUploadedCVFile);
  }

  const newTalent = {
    nombre, rol, seniority: senioryVal, pais,
    zona: zonaMap[pais] || 'GMT-3', disponibilidad: 'Inmediata',
    ingles, tarifa, experiencia,
    stack: skills.length > 0 ? skills : ['General IT'],
    certificaciones: [],
    email, telefono: telefono || '', linkedin: linkedin || '',
    resumen: resumen || '',
    proyectos: [],
    match: Math.floor(70 + Math.random() * 30),
    asignacion: null, avatar: null,
    cv_url: cv_url,
    activo: true
  };

  if (supabaseClient) {
    const insertedId = await insertTalentToSupabase(newTalent);
    if (insertedId) {
      newTalent.id = insertedId;
    } else {
      showToast('Guardado en vista local (Verificar tablas en Supabase)', 'info');
    }
  }

  if (!newTalent.id) newTalent.id = Date.now();

  VX.talents.unshift(newTalent);
  
  // Reset parser
  currentUploadedCVFile = null;
  const parsePanel = document.getElementById('cvParsePanel');
  const fileInfo = document.getElementById('cvFileInfo');
  const progress = document.getElementById('cvProgress');
  const progressTxt = document.getElementById('cvProgressText');
  const dropZone = document.getElementById('dropZone');

  if (parsePanel) parsePanel.classList.add('hidden');
  if (fileInfo) fileInfo.classList.add('hidden');
  if (progress) progress.style.width = '0%';
  if (progressTxt) progressTxt.textContent = 'Iniciando análisis...';
  if (dropZone) dropZone.classList.remove('border-primary', 'bg-surface-container-low');

  showToast(`${nombre} guardado y visible en el pool de talentos ✓`, 'success');
  
  // Reset filters to ensure the new candidate is not filtered out
  resetFilters();
  navigate('talentos');
}

// ---- PROPOSALS CLIENT-READY ----
function selectProposalClient(clientId) {
  VX.activeclientId = clientId;
  renderPropuestas();
}

function renderPropuestas() {
  const section = document.getElementById('section-propuestas');
  if (!section) return;

  const content = section.querySelector('.proposals-content');
  if (!content) return;

  if (VX.clients.length === 0) {
    content.innerHTML = `
      <div class="flex flex-col items-center justify-center py-20 text-center">
        <span class="material-symbols-outlined text-[64px] text-text-muted/30 mb-3">domain</span>
        <h3 class="text-headline-lg font-sans font-bold text-text-heading mb-2">No hay clientes registrados</h3>
        <p class="text-body-md font-sans text-text-muted mb-4 max-w-sm">Creá primero un cliente para asociarle perfiles y armar su propuesta.</p>
        <button onclick="openNewClientModal()" class="px-4 py-2 rounded-xl bg-primary-container text-on-primary-container text-label-md font-label font-bold">
          + Crear Cliente
        </button>
      </div>`;
    return;
  }

  const activeClient = VX.clients.find(x => String(x.id) === String(VX.activeclientId)) || VX.clients[0];
  VX.activeclientId = activeClient.id;

  // Selected talents for this client proposal (or from global selected set)
  const assignedTalents = VX.talents.filter(t => (activeClient.talentoAsignado || []).map(String).includes(String(t.id)));
  const globalSelected = VX.talents.filter(t => VX.selectedTalents.has(String(t.id)));
  
  // Combine unique talents
  const combinedTalentsMap = new Map();
  [...assignedTalents, ...globalSelected].forEach(t => combinedTalentsMap.set(String(t.id), t));
  const activeTalents = Array.from(combinedTalentsMap.values());

  const isCompleted = activeClient.estado === 'Completed' || activeClient.estado === 'Completado';

  content.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Config Panel -->
      <div class="lg:col-span-5 flex flex-col gap-4">
        <!-- Client & Proposal Settings -->
        <div class="bg-surface-card rounded-xl p-5 shadow-sm border border-border-subtle">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-headline-sm font-sans font-bold text-text-heading flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">co_present</span>Armar Propuesta Client-Ready
            </h3>
            ${isCompleted ? `
              <span class="px-2.5 py-0.5 rounded-full text-label-sm font-label font-bold bg-[#D1FAE5] text-[#065F46] flex items-center gap-1 border border-[#A7F3D0]">
                <span class="material-symbols-outlined text-[14px]">verified</span>Completed
              </span>` : ''}
          </div>

          <div class="flex flex-col gap-4">
            <!-- Client selector -->
            <div>
              <label class="text-label-sm font-label font-bold text-text-heading mb-1 block">Seleccionar Cliente B2B</label>
              <select id="proposalClientSelect" onchange="selectProposalClient(this.value)" class="w-full h-10 px-3 rounded-xl border border-border-strong bg-surface-card text-body-md font-sans focus:outline-none focus:border-primary font-bold">
                ${VX.clients.map(c => `
                  <option value="${c.id}" ${String(c.id) === String(activeClient.id) ? 'selected' : ''}>
                    ${c.nombre} ${c.estado === 'Completed' ? '✓ (Completed)' : ''}
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- Proposal Title -->
            <div>
              <label class="text-label-sm font-label font-bold text-text-heading mb-1 block">Nombre / Título de la Propuesta</label>
              <input type="text" id="propTitulo" value="Propuesta de Perfiles IT para ${activeClient.nombre}" class="w-full h-10 px-3 rounded-xl border border-border-strong bg-surface-card text-body-md font-sans focus:outline-none focus:border-primary" oninput="document.getElementById('previewTitulo').textContent = this.value"/>
            </div>

            <!-- Proposal Text -->
            <div>
              <label class="text-label-sm font-label font-bold text-text-heading mb-1 block">Texto / Especificación de la Propuesta</label>
              <textarea id="propTextoArea" rows="5" placeholder="Escribí o pegá aquí los detalles de la propuesta comercial/técnica..." class="w-full p-3 rounded-xl border border-border-strong bg-surface-card text-body-md font-sans focus:outline-none focus:border-primary resize-y" oninput="activeClient.propuestaTexto = this.value; document.getElementById('previewPropTexto').textContent = this.value;">${activeClient.propuestaTexto || activeClient.necesidades || ''}</textarea>
            </div>

            <!-- Action buttons -->
            <div class="flex flex-col gap-2 pt-2 border-t border-border-subtle">
              <button onclick="exportPDF()" class="w-full py-3 rounded-xl bg-primary-container text-on-primary-container text-label-lg font-label font-bold hover:bg-primary transition-all flex items-center justify-center gap-2 shadow-sm">
                <span class="material-symbols-outlined text-[20px]">picture_as_pdf</span>Exportar PDF Client-Ready
              </button>
              
              <button onclick="markClientCompleted('${activeClient.id}')" class="w-full py-3 rounded-xl bg-[#065F46] text-white text-label-lg font-label font-bold hover:bg-[#044E39] transition-all flex items-center justify-center gap-2 shadow-sm">
                <span class="material-symbols-outlined text-[20px]">check_circle</span>Confirmar Trabajo & Marcar COMPLETADO
              </button>
            </div>
          </div>
        </div>

        <!-- Resources Selection -->
        <div class="bg-surface-card rounded-xl p-5 shadow-sm border border-border-subtle">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-label-lg font-label font-bold text-text-heading flex items-center gap-1.5">
              <span class="material-symbols-outlined text-primary text-[18px]">group</span>Recursos para la Propuesta (${activeTalents.length})
            </h4>
            <button onclick="openAssignModal('${activeClient.id}')" class="text-label-sm font-label text-primary font-bold hover:underline">+ Agregar Recurso</button>
          </div>

          <div class="flex flex-col gap-2 max-h-60 overflow-y-auto">
            ${activeTalents.length === 0 ? `
              <div class="text-center py-4 text-text-muted text-body-sm">
                Sin recursos asignados a esta propuesta. Usá "+ Agregar Recurso" o seleccioná del directorio.
              </div>` :
              activeTalents.map(t => `
                <div class="flex items-center justify-between p-2.5 rounded-xl bg-surface-canvas border border-border-subtle hover:border-primary/40 transition-all">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-container to-primary flex items-center justify-center text-on-primary-container font-sans font-bold text-[12px] shrink-0">${getInitials(t.nombre)}</div>
                    <div class="min-w-0">
                      <div class="text-label-md font-label font-bold text-text-heading truncate">${t.nombre}</div>
                      <div class="text-body-sm font-sans text-text-muted">${t.rol} · $${t.tarifa}/h</div>
                    </div>
                  </div>
                  <span class="px-2 py-0.5 rounded-full bg-surface-container text-primary text-[11px] font-label font-bold">${t.seniority}</span>
                </div>
              `).join('')
            }
          </div>
        </div>
      </div>

      <!-- Live PDF Preview -->
      <div class="lg:col-span-7">
        <div id="proposalPreview" class="bg-surface-card rounded-2xl shadow-lg border border-border-subtle overflow-hidden">
          <!-- Header branding -->
          <div class="bg-gradient-to-r from-legacy-brand-navy to-primary p-6 text-on-primary relative">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                  <span class="material-symbols-outlined text-tertiary-fixed text-[24px]">hub</span>
                </div>
                <span class="text-headline-sm font-sans font-bold tracking-tight">Virtual Xpert</span>
              </div>
              <span class="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-label-sm font-label uppercase font-bold tracking-wider text-tertiary-fixed">Propuesta Client-Ready</span>
            </div>
            <h2 id="previewTitulo" class="text-headline-lg font-sans font-bold">Propuesta de Perfiles IT para ${activeClient.nombre}</h2>
            <p class="text-body-sm font-sans opacity-80 mt-1 flex items-center gap-2">
              <span>Cliente: <b>${activeClient.nombre}</b></span> · 
              <span>Fecha: ${new Date().toLocaleDateString('es-AR', { day:'2-digit', month:'long', year:'numeric' })}</span>
            </p>
          </div>

          <!-- Proposal Body -->
          <div class="p-6 flex flex-col gap-6">
            <!-- Proposal Specs / Scope -->
            <div class="bg-surface-canvas p-4 rounded-xl border border-border-subtle">
              <h4 class="text-label-lg font-label font-bold text-text-heading mb-1.5 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-primary text-[18px]">architecture</span>Alcance & Especificaciones del Proyecto
              </h4>
              <p id="previewPropTexto" class="text-body-md font-sans text-text-body leading-relaxed whitespace-pre-wrap">${activeClient.propuestaTexto || activeClient.necesidades || 'Propuesta técnica en proceso de asignación.'}</p>
            </div>

            <!-- Resources Cards -->
            <div class="flex flex-col gap-4">
              <h4 class="text-label-lg font-label font-bold text-text-heading flex items-center gap-1.5">
                <span class="material-symbols-outlined text-primary text-[18px]">badge</span>Perfil Solicitado / Recurso Asignado
              </h4>
              ${activeTalents.length === 0 ? `
                <div class="p-6 rounded-xl border border-dashed border-border-subtle text-center text-text-muted text-body-sm">
                  Sin recurso asignado a esta propuesta. Seleccioná un talento del panel izquierdo.
                </div>` :
                activeTalents.map(t => `
                  <div class="border border-border-subtle rounded-xl p-5 bg-surface-card">
                    <div class="flex items-start gap-4 mb-4">
                      <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-container to-primary flex items-center justify-center text-on-primary-container font-sans font-bold text-lg shrink-0">${getInitials(t.nombre)}</div>
                      <div class="flex-1">
                        <div class="flex items-start justify-between gap-2">
                          <div>
                            <h3 class="text-headline-sm font-sans font-bold text-text-heading">${t.nombre}</h3>
                            <p class="text-body-md font-sans text-text-muted">${t.rol} · ${t.seniority} · ${t.pais} (${t.zona})</p>
                          </div>
                          <span class="px-2.5 py-1 rounded-full bg-[#D1FAE5] text-[#065F46] text-label-sm font-label font-bold">${t.match || 90}% Match</span>
                        </div>
                      </div>
                    </div>

                    <p class="text-body-sm font-sans text-text-body leading-relaxed mb-4">${t.resumen}</p>

                    <div class="grid grid-cols-3 gap-3 mb-4">
                      <div class="bg-surface-canvas rounded-xl p-2.5 text-center border border-border-subtle">
                        <div class="text-label-lg font-label font-bold text-primary">$${t.tarifa}/h</div>
                        <div class="text-[11px] font-sans text-text-muted">Tarifa</div>
                      </div>
                      <div class="bg-surface-canvas rounded-xl p-2.5 text-center border border-border-subtle">
                        <div class="text-label-lg font-label font-bold text-text-heading">${t.experiencia} años</div>
                        <div class="text-[11px] font-sans text-text-muted">Experiencia</div>
                      </div>
                      <div class="bg-surface-canvas rounded-xl p-2.5 text-center border border-border-subtle">
                        <div class="text-label-lg font-label font-bold text-text-heading">${t.ingles}</div>
                        <div class="text-[11px] font-sans text-text-muted">Inglés</div>
                      </div>
                    </div>

                    <div class="flex flex-wrap gap-1.5">
                      ${(t.stack || []).map(s => `<span class="px-2.5 py-0.5 rounded-full bg-surface-container text-text-body text-[11px] font-label font-semibold">${s}</span>`).join('')}
                    </div>
                  </div>
                `).join('')
              }
            </div>

            <!-- Footer terms -->
            <div class="mt-2 p-4 rounded-xl bg-surface-container-low border border-border-subtle text-center">
              <p class="text-body-sm font-sans text-text-muted">© ${new Date().getFullYear()} Virtual Xpert · Documento Confidencial Client-Ready · <a href="https://virtual-xpert.net" class="text-primary hover:underline">virtual-xpert.net</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function exportPDF() {
  window.print();
}

function copyProposalLink() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    showToast('Enlace copiado al portapapeles', 'success');
  });
}

// ---- REPORTS ----
function renderReportes() {
  const stackCounts = {};
  VX.talents.forEach(t => t.stack.forEach(s => { stackCounts[s] = (stackCounts[s] || 0) + 1; }));
  const topStack = Object.entries(stackCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxCount = topStack[0]?.[1] || 1;

  const dispCounts = {
    'Inmediata': VX.talents.filter(t => t.disponibilidad === 'Inmediata' && t.activo).length,
    'Parcial': VX.talents.filter(t => t.disponibilidad === 'Parcial' && t.activo).length,
    'Asignado': VX.talents.filter(t => t.disponibilidad === 'Asignado' && t.activo).length
  };

  const topTalents = [...VX.talents].sort((a, b) => b.match - a.match).slice(0, 5);

  const reportEl = document.getElementById('reportsContent');
  if (!reportEl) return;

  reportEl.innerHTML = `
    <!-- KPI Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-surface-card rounded-xl p-5 shadow-sm border border-border-subtle">
        <div class="flex items-center justify-between mb-3">
          <span class="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center"><span class="material-symbols-outlined text-primary text-[20px]">group</span></span>
          <span class="text-label-sm font-label font-bold text-status-available">+12% este mes</span>
        </div>
        <div class="text-[36px] font-sans font-bold text-text-heading leading-tight">${VX.talents.filter(t=>t.activo).length}</div>
        <div class="text-body-md font-sans text-text-muted">Total Pool</div>
      </div>
      <div class="bg-surface-card rounded-xl p-5 shadow-sm border border-border-subtle">
        <div class="flex items-center justify-between mb-3">
          <span class="w-10 h-10 rounded-xl bg-[#ECFDF5] flex items-center justify-center"><span class="material-symbols-outlined text-status-available text-[20px]">check_circle</span></span>
          <span class="text-label-sm font-label font-bold text-status-available">Inmediatos</span>
        </div>
        <div class="text-[36px] font-sans font-bold text-status-available leading-tight">${dispCounts['Inmediata']}</div>
        <div class="text-body-md font-sans text-text-muted">En Bench</div>
      </div>
      <div class="bg-surface-card rounded-xl p-5 shadow-sm border border-border-subtle">
        <div class="flex items-center justify-between mb-3">
          <span class="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center"><span class="material-symbols-outlined text-status-placed text-[20px]">assignment</span></span>
          <span class="text-label-sm font-label font-bold text-status-placed">En proyectos</span>
        </div>
        <div class="text-[36px] font-sans font-bold text-status-placed leading-tight">${dispCounts['Asignado']}</div>
        <div class="text-body-md font-sans text-text-muted">Asignados</div>
      </div>
      <div class="bg-surface-card rounded-xl p-5 shadow-sm border border-border-subtle">
        <div class="flex items-center justify-between mb-3">
          <span class="w-10 h-10 rounded-xl bg-[#DBEAFE] flex items-center justify-center"><span class="material-symbols-outlined text-primary text-[20px]">auto_awesome</span></span>
          <span class="text-label-sm font-label font-bold text-primary">Promedio</span>
        </div>
        <div class="text-[36px] font-sans font-bold text-primary leading-tight">${Math.round(VX.talents.reduce((a,b)=>a+b.match,0)/VX.talents.length)}%</div>
        <div class="text-body-md font-sans text-text-muted">Match Score</div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <!-- Stack chart -->
      <div class="lg:col-span-7 bg-surface-card rounded-xl p-5 shadow-sm border border-border-subtle">
        <h3 class="text-headline-sm font-sans font-bold text-text-heading mb-4">Distribución por Stack Tecnológico</h3>
        <div class="flex flex-col gap-3">
          ${topStack.map(([tech, count]) => `
            <div class="flex items-center gap-3">
              <div class="w-24 text-label-md font-label font-semibold text-text-body text-right shrink-0">${tech}</div>
              <div class="flex-1 h-7 bg-surface-container rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-primary-container to-primary rounded-full flex items-center justify-end pr-2 transition-all duration-500" style="width:${Math.round(count/maxCount*100)}%">
                  <span class="text-on-primary-container text-label-sm font-label font-bold">${count}</span>
                </div>
              </div>
            </div>`).join('')}
        </div>
      </div>

      <!-- Availability donut + Top talents -->
      <div class="lg:col-span-5 flex flex-col gap-4">
        <div class="bg-surface-card rounded-xl p-5 shadow-sm border border-border-subtle">
          <h3 class="text-headline-sm font-sans font-bold text-text-heading mb-4">Disponibilidad</h3>
          <div class="flex items-center justify-around">
            <div class="relative w-28 h-28">
              <svg viewBox="0 0 36 36" class="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#E2E8F0" stroke-width="3.5"/>
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#10B981" stroke-width="3.5" stroke-dasharray="${Math.round(dispCounts['Inmediata']/VX.talents.filter(t=>t.activo).length*100)} 100" stroke-linecap="round"/>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-[20px] font-sans font-bold text-text-heading">${dispCounts['Inmediata']}</span>
                <span class="text-[10px] font-label text-text-muted">bench</span>
              </div>
            </div>
            <div class="flex flex-col gap-3">
              <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-status-available shrink-0"></span><span class="text-body-md font-sans text-text-body">Inmediata: <b>${dispCounts['Inmediata']}</b></span></div>
              <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-status-interviewing shrink-0"></span><span class="text-body-md font-sans text-text-body">Parcial: <b>${dispCounts['Parcial']}</b></span></div>
              <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-status-placed shrink-0"></span><span class="text-body-md font-sans text-text-body">Asignado: <b>${dispCounts['Asignado']}</b></span></div>
            </div>
          </div>
        </div>

        <div class="bg-surface-card rounded-xl p-5 shadow-sm border border-border-subtle flex-1">
          <h3 class="text-headline-sm font-sans font-bold text-text-heading mb-4">Top Perfiles por Match</h3>
          <div class="flex flex-col gap-2">
            ${topTalents.map((t, i) => `
              <div onclick="openTalentModal('${t.id}')" class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-container-low transition-all cursor-pointer border border-transparent hover:border-primary/20 group">
                <span class="text-label-sm font-label font-bold text-text-muted w-4 text-center group-hover:text-primary">${i+1}</span>
                <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-container to-primary flex items-center justify-center text-on-primary-container font-sans font-bold text-[12px] shrink-0">${getInitials(t.nombre)}</div>
                <div class="flex-1 min-w-0">
                  <div class="text-label-md font-label font-bold text-text-heading truncate group-hover:text-primary transition-colors">${t.nombre}</div>
                  <div class="text-body-sm font-sans text-text-muted truncate">${t.rol} · ${t.pais}</div>
                </div>
                <span class="text-label-lg font-label font-bold text-primary shrink-0 flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">auto_awesome</span>${t.match}%</span>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

// ---- TOAST ----
function showToast(msg, type = 'info') {
  const icons = { success: 'check_circle', error: 'error', info: 'info' };
  const colors = { success: 'bg-[#065F46] text-white', error: 'bg-error text-white', info: 'bg-inverse-surface text-inverse-on-surface' };
  const toast = document.createElement('div');
  toast.className = `fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-label-lg font-label font-bold max-w-sm ${colors[type]} transition-all duration-300 translate-y-0`;
  toast.innerHTML = `<span class="material-symbols-outlined text-[20px]">${icons[type]}</span>${msg}`;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(10px)'; }, 2800);
  setTimeout(() => toast.remove(), 3200);
}

// ---- LOGOUT ----
function logout() {
  sessionStorage.removeItem('vx_user');
  window.location.href = 'index.html';
}

// ---- GLOBAL SEARCH ----
function globalSearch(q) {
  VX.searchQuery = q;
  if (VX.currentSection === 'talentos') {
    applyFilters();
  }
}

// ---- SUPABASE DATA SYNC & DIRECT DELETE ----
async function insertTalentToSupabase(talentObj) {
  if (!supabaseClient) return null;
  
  let payload = { ...talentObj };
  
  // Try direct insert with JS arrays/objects
  let { data, error } = await supabaseClient.from('talents').insert([payload]).select();
  
  // If error occurs, fallback with JSON strings for PostgreSQL text columns
  if (error) {
    console.warn("Reintentando inserción en Supabase serializando JSON:", error.message);
    const textPayload = {
      ...talentObj,
      stack: JSON.stringify(talentObj.stack || []),
      certificaciones: JSON.stringify(talentObj.certificaciones || []),
      proyectos: JSON.stringify(talentObj.proyectos || []),
      asignacion: talentObj.asignacion ? JSON.stringify(talentObj.asignacion) : null
    };
    const retry = await supabaseClient.from('talents').insert([textPayload]).select();
    data = retry.data;
    error = retry.error;
  }
  
  if (error) {
    console.error("Error al insertar en Supabase:", error);
    return null;
  }
  return data && data.length > 0 ? data[0].id : null;
}

async function fetchFromSupabase() {
  if (!supabaseClient) return;
  try {
    const { data: talentsData, error: tErr } = await supabaseClient.from('talents').select('*').order('id', { ascending: false });
    if (!tErr && talentsData && talentsData.length > 0) {
      const dbTalents = talentsData.map(t => {
        let parsedStack = [];
        try { parsedStack = Array.isArray(t.stack) ? t.stack : JSON.parse(t.stack || '[]'); } catch(e) { parsedStack = ['IT']; }

        let parsedCerts = [];
        try { parsedCerts = Array.isArray(t.certificaciones) ? t.certificaciones : JSON.parse(t.certificaciones || '[]'); } catch(e) { parsedCerts = []; }

        let parsedProjs = [];
        try { parsedProjs = Array.isArray(t.proyectos) ? t.proyectos : JSON.parse(t.proyectos || '[]'); } catch(e) { parsedProjs = []; }

        let parsedAsig = null;
        try { parsedAsig = typeof t.asignacion === 'string' ? JSON.parse(t.asignacion) : t.asignacion; } catch(e) { parsedAsig = null; }

        return {
          id: t.id,
          nombre: t.nombre || 'Candidato IT',
          rol: t.rol || 'Software Engineer',
          seniority: t.seniority || 'Senior',
          pais: t.pais || 'Argentina',
          zona: t.zona || 'GMT-3',
          disponibilidad: t.disponibilidad || 'Inmediata',
          ingles: t.ingles || 'C1',
          tarifa: Number(t.tarifa) || 50,
          experiencia: Number(t.experiencia) || 3,
          stack: parsedStack.length > 0 ? parsedStack : ['IT'],
          certificaciones: parsedCerts,
          email: t.email || '',
          telefono: t.telefono || '',
          linkedin: t.linkedin || '',
          resumen: t.resumen || 'Sin resumen registrado.',
          proyectos: parsedProjs,
          match: Number(t.match) || 85,
          asignacion: parsedAsig,
          avatar: t.avatar || null,
          cv_url: t.cv_url || null,
          activo: t.activo !== false
        };
      });

      VX.talents = dbTalents;
      applyFilters();
    }

    const { data: clientsData, error: cErr } = await supabaseClient.from('clients').select('*').order('id', { ascending: true });
    if (!cErr && clientsData && clientsData.length > 0) {
      VX.clients = clientsData.map(c => {
        let rawNotas = c.notas || '';
        let rawNec = c.necesidades || '';

        // Extract embedded archivos from notas fallback
        let extractedArchivos = Array.isArray(c.archivos) ? c.archivos : [];
        if (extractedArchivos.length === 0 && typeof rawNotas === 'string' && rawNotas.includes('[ARCHIVOS]')) {
          const m = rawNotas.match(/\[ARCHIVOS\](.*?)\[\/ARCHIVOS\]/s);
          if (m?.[1]) { try { extractedArchivos = JSON.parse(m[1]); } catch(e){} }
        }

        // Extract embedded calls from notas fallback
        let extractedCalls = [];
        try {
          extractedCalls = Array.isArray(c.calls) ? c.calls : (typeof c.calls === 'string' ? JSON.parse(c.calls || '[]') : []);
        } catch(e) {}
        if (extractedCalls.length === 0 && typeof rawNotas === 'string' && rawNotas.includes('[CALLS]')) {
          const m = rawNotas.match(/\[CALLS\](.*?)\[\/CALLS\]/s);
          if (m?.[1]) { try { extractedCalls = JSON.parse(m[1]); } catch(e){} }
        }

        const cleanNotas = typeof rawNotas === 'string'
          ? rawNotas.replace(/\[ARCHIVOS\].*?\[\/ARCHIVOS\]/s, '').replace(/\[CALLS\].*?\[\/CALLS\]/s, '').trim()
          : rawNotas;

        // Extract embedded propuestaTexto from necesidades fallback
        let extractedPropuesta = c.propuestaTexto || c.propuesta_texto || '';
        if (!extractedPropuesta && typeof rawNec === 'string' && rawNec.includes('[PROPUESTA]')) {
          const m = rawNec.match(/\[PROPUESTA\](.*?)\[\/PROPUESTA\]/s);
          if (m?.[1]) extractedPropuesta = m[1];
        }

        // Extract embedded talentoAsignado from necesidades fallback
        let parsedTalentoAsignado = [];
        try {
          parsedTalentoAsignado = Array.isArray(c.talentoAsignado) ? c.talentoAsignado : (typeof c.talentoAsignado === 'string' ? JSON.parse(c.talentoAsignado || '[]') : []);
        } catch(e) {}
        if (parsedTalentoAsignado.length === 0 && typeof rawNec === 'string' && rawNec.includes('[TALENTO]')) {
          const m = rawNec.match(/\[TALENTO\](.*?)\[\/TALENTO\]/s);
          if (m?.[1]) { try { parsedTalentoAsignado = JSON.parse(m[1]); } catch(e){} }
        }

        const cleanNec = typeof rawNec === 'string'
          ? rawNec.replace(/\[PROPUESTA\].*?\[\/PROPUESTA\]/s, '').replace(/\[TALENTO\].*?\[\/TALENTO\]/s, '').trim()
          : rawNec;

        const parsedCalls = extractedCalls;

        return {
          id: c.id,
          nombre: c.nombre || c.empresa || 'Cliente B2B',
          sector: c.industria || 'Tech',
          sede: c.pais || 'LATAM',
          zona: 'UTC-3',
          tier: 1,
          estado: c.estado || 'Activo',
          contrato: 'MSA Vigente',
          pago: 'Net 30',
          stakeholder: {
            nombre: c.contacto_principal || 'Contacto Principal',
            cargo: 'Lead Contact',
            email: c.email || '',
            telefono: c.telefono || ''
          },
          necesidades: cleanNec,
          notas: cleanNotas,
          propuestaTexto: extractedPropuesta,
          archivos: extractedArchivos,
          talentoAsignado: parsedTalentoAsignado,
          calls: extractedCalls
        };
      });
      if (!VX.activeclientId && VX.clients.length > 0) VX.activeclientId = VX.clients[0].id;
      if (VX.currentSection === 'clientes') renderClientes();
    }
  } catch (err) {
    console.error('Error sincronizando con Supabase:', err);
  }
}

function openNewClientModal(id = null) {
  const modal = document.getElementById('clientModal');
  if (!modal) return;
  
  const title = document.getElementById('clientModalTitle');
  const idInput = document.getElementById('clientFormId');
  const nameInput = document.getElementById('clientNombre');
  const indInput = document.getElementById('clientIndustria');
  const paisInput = document.getElementById('clientPais');
  const contactInput = document.getElementById('clientContacto');
  const telInput = document.getElementById('clientTelefono');
  const emailInput = document.getElementById('clientEmail');
  const necInput = document.getElementById('clientNecesidades');
  const notasInput = document.getElementById('clientNotas');

  if (id) {
    const c = VX.clients.find(x => String(x.id) === String(id));
    if (c) {
      if (title) title.textContent = 'Editar Cliente B2B';
      if (idInput) idInput.value = c.id;
      if (nameInput) nameInput.value = c.nombre || '';
      if (indInput) indInput.value = c.sector || '';
      if (paisInput) paisInput.value = c.sede || '';
      if (contactInput) contactInput.value = c.stakeholder?.nombre || '';
      if (telInput) telInput.value = c.stakeholder?.telefono || '';
      if (emailInput) emailInput.value = c.stakeholder?.email || '';
      if (necInput) necInput.value = c.necesidades || '';
      if (notasInput) notasInput.value = c.notas || '';
    }
  } else {
    if (title) title.textContent = 'Nuevo Cliente B2B';
    if (idInput) idInput.value = '';
    if (nameInput) nameInput.value = '';
    if (indInput) indInput.value = '';
    if (paisInput) paisInput.value = '';
    if (contactInput) contactInput.value = '';
    if (telInput) telInput.value = '';
    if (emailInput) emailInput.value = '';
    if (necInput) necInput.value = '';
    if (notasInput) notasInput.value = '';
  }

  modal.classList.remove('hidden');
}

function closeClientModal() {
  const modal = document.getElementById('clientModal');
  if (modal) modal.classList.add('hidden');
}

async function saveClientToSupabase(e) {
  if (e) e.preventDefault();
  
  const id = document.getElementById('clientFormId')?.value;
  const nombre = document.getElementById('clientNombre')?.value?.trim();
  const industria = document.getElementById('clientIndustria')?.value?.trim() || 'Tech';
  const pais = document.getElementById('clientPais')?.value?.trim() || 'LATAM';
  const contacto = document.getElementById('clientContacto')?.value?.trim() || 'Contacto';
  const telefono = document.getElementById('clientTelefono')?.value?.trim() || '';
  const email = document.getElementById('clientEmail')?.value?.trim() || '';
  const necesidades = document.getElementById('clientNecesidades')?.value?.trim() || '';
  const notas = document.getElementById('clientNotas')?.value?.trim() || '';

  if (!nombre) { showToast('El nombre del cliente es requerido', 'error'); return; }

  // Columns confirmed to exist: id, nombre, empresa, industria, pais, email, telefono,
  // contacto_principal, logo, created_at, estado, calls, talentoAsignado, archivos, propuestaTexto
  // notas + necesidades added via SQL migration
  const payload = {
    nombre,
    empresa: nombre,
    industria,
    pais,
    contacto_principal: contacto,
    telefono,
    email,
    estado: 'Activo'
  };

  // Add notas/necesidades only if they exist (after migration)
  if (necesidades) payload.necesidades = necesidades;
  if (notas) payload.notas = notas;

  if (supabaseClient) {
    if (id) {
      const { error } = await supabaseClient.from('clients').update(payload).eq('id', id);
      if (error) {
        console.error('Error actualizando cliente:', error);
        showToast(`Error: ${error.message}`, 'error');
        return;
      }
    } else {
      let { data, error } = await supabaseClient.from('clients').insert([payload]).select();
      if (error) {
        // Retry with only guaranteed columns
        console.warn('Insert falló, reintentando sin notas/necesidades:', error.message);
        const safe = { nombre, empresa: nombre, industria, pais, contacto_principal: contacto, telefono, email, estado: 'Activo' };
        const retry = await supabaseClient.from('clients').insert([safe]).select();
        if (retry.error) {
          console.error('Error al insertar cliente:', retry.error);
          showToast(`Error Supabase: ${retry.error.message}`, 'error');
          return;
        }
        data = retry.data;
      }
      if (data && data.length > 0) payload.id = data[0].id;
    }
  }

  closeClientModal();
  showToast('Cliente guardado correctamente ✓', 'success');
  await fetchFromSupabase();
}


async function deleteTalentDirectly(id) {
  if (!confirm('¿Seguro que querés eliminar este talento de Supabase?')) return;
  
  const talent = VX.talents.find(t => t.id === id);
  if (talent && talent.cv_url && supabaseClient) {
    try {
      const fileName = talent.cv_url.split('/').pop();
      if (fileName) {
        await supabaseClient.storage.from('cvs').remove([fileName]);
      }
    } catch(e) { console.error('Error eliminando archivo CV:', e); }
  }

  if (supabaseClient) {
    const { error } = await supabaseClient.from('talents').delete().eq('id', id);
    if (error) {
      showToast('Error al eliminar talento de Supabase', 'error');
      return;
    }
  }

  VX.talents = VX.talents.filter(t => t.id !== id);
  VX.filteredTalents = VX.filteredTalents.filter(t => t.id !== id);
  VX.selectedTalents.delete(id);
  closeTalentModal();
  showToast('Talento eliminado correctamente de Supabase', 'success');
  renderTalentGrid();
}

async function deleteClientDirectly(id) {
  if (!confirm('¿Seguro que querés eliminar este cliente de Supabase? Se borrarán sus propuestas vinculadas.')) return;

  if (supabaseClient) {
    const { error } = await supabaseClient.from('clients').delete().eq('id', id);
    if (error) {
      showToast('Error al eliminar cliente de Supabase', 'error');
      return;
    }
  }

  VX.clients = VX.clients.filter(c => String(c.id) !== String(id));
  VX.activeclientId = VX.clients[0]?.id || null;
  showToast('Cliente eliminado correctamente de Supabase', 'success');
  renderClientes();
}

function toggleInlineEdit(clientId, field) {
  const map = { necesidades: 'Nec', notas: 'Notas', propuestaTexto: 'PropuestaTexto' };
  const tag = map[field] || 'Nec';
  const toggle = document.getElementById(`edit${tag}Toggle_${clientId}`);
  const viewEl = document.getElementById(`view${tag}_${clientId}`);
  const editBox = document.getElementById(`edit${tag}Box_${clientId}`);

  if (!toggle || !viewEl || !editBox) return;

  if (toggle.checked) {
    viewEl.classList.add('hidden');
    editBox.classList.remove('hidden');
  } else {
    viewEl.classList.remove('hidden');
    editBox.classList.add('hidden');
  }
}

async function updateClientInSupabase(clientId, payload) {
  if (!supabaseClient || !clientId) return true;
  const dbId = isNaN(Number(clientId)) ? clientId : Number(clientId);

  // Only send fields that actually exist in the clients table
  const KNOWN_COLUMNS = new Set([
    'nombre','empresa','industria','pais','email','telefono','contacto_principal',
    'logo','estado','calls','talentoAsignado','archivos','propuestaTexto','notas','necesidades'
  ]);

  const updateObj = {};
  for (const [k, v] of Object.entries(payload)) {
    if (KNOWN_COLUMNS.has(k)) updateObj[k] = v;
    else console.warn('Campo ignorado (no existe en tabla clients):', k);
  }

  if (Object.keys(updateObj).length === 0) return true;

  const { error } = await supabaseClient.from('clients').update(updateObj).eq('id', dbId);
  if (error) {
    console.error('Error actualizando cliente en Supabase:', error.message);
    return false;
  }
  return true;
}


async function saveInlineClientField(clientId, field) {
  const c = VX.clients.find(x => String(x.id) === String(clientId));
  if (!c) return;

  const map = { necesidades: 'Nec', notas: 'Notas', propuestaTexto: 'PropuestaTexto' };
  const tag = map[field] || 'Nec';

  const textarea = document.getElementById(`textarea${tag}_${clientId}`);
  const viewEl = document.getElementById(`view${tag}_${clientId}`);
  const editBox = document.getElementById(`edit${tag}Box_${clientId}`);
  const toggle = document.getElementById(`edit${tag}Toggle_${clientId}`);

  if (!textarea) return;

  const newValue = textarea.value.trim();
  c[field] = newValue;

  const ok = await updateClientInSupabase(c.id, { [field]: newValue });

  if (ok) {
    showToast('Cambios guardados correctamente ✓', 'success');
  } else {
    showToast('Cambios guardados localmente ✓', 'info');
  }

  if (viewEl) {
    viewEl.textContent = newValue || 'Sin información registrada. Habilitá edición para agregar texto.';
    viewEl.classList.remove('hidden');
  }

  if (toggle) toggle.checked = false;
  if (editBox) editBox.classList.add('hidden');
}

async function handleClientFileUpload(clientId, inputEl) {
  const c = VX.clients.find(x => String(x.id) === String(clientId));
  if (!c || !inputEl.files || inputEl.files.length === 0) return;

  const file = inputEl.files[0];
  showToast('Subiendo archivo de cliente...', 'info');

  let fileUrl = null;
  if (supabaseClient) {
    fileUrl = await uploadCVFileToSupabase(file);
  }

  c.archivos = c.archivos || [];
  const fileObj = {
    id: String(Date.now()),
    nombre: file.name,
    size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    fecha: new Date().toLocaleDateString('es-AR'),
    url: fileUrl
  };
  c.archivos.push(fileObj);

  await updateClientInSupabase(c.id, { archivos: c.archivos });

  showToast(`Archivo "${file.name}" subido correctamente ✓`, 'success');
  renderClientDetail(clientId);
}

async function deleteClientFile(clientId, fileId) {
  const c = VX.clients.find(x => String(x.id) === String(clientId));
  if (!c) return;

  c.archivos = (c.archivos || []).filter(f => String(f.id) !== String(fileId));

  await updateClientInSupabase(c.id, { archivos: c.archivos });

  showToast('Archivo eliminado', 'info');
  renderClientDetail(clientId);
}

async function markClientCompleted(clientId) {
  const c = VX.clients.find(x => String(x.id) === String(clientId));
  if (!c) return;

  c.estado = 'Completed';

  // Mark assigned talents in talents pool
  (c.talentoAsignado || []).forEach(tid => {
    const t = VX.talents.find(x => String(x.id) === String(tid));
    if (t) {
      t.disponibilidad = 'Asignado';
      t.asignacion = { cliente: c.nombre, horas: 40 };
    }
  });

  await updateClientInSupabase(c.id, {
    estado: 'Completed',
    talentoAsignado: c.talentoAsignado,
    propuestaTexto: c.propuestaTexto || ''
  });

  showToast(`Cliente "${c.nombre}" marcado como COMPLETED ✓ Propuesta finalizada.`, 'success');
  renderClientList();
  if (VX.currentSection === 'clientes') renderClientDetail(clientId);
  if (VX.currentSection === 'propuestas') renderPropuestas();
}

async function unmarkClientCompleted(clientId) {
  const c = VX.clients.find(x => String(x.id) === String(clientId));
  if (!c) return;

  const ok1 = confirm(`¿Querés quitar el estado COMPLETED de "${c.nombre}"?\n\nEsto es una acción poco común. Asegurate de que realmente necesitás revertir el estado.`);
  if (!ok1) return;

  const ok2 = confirm(`Segunda confirmación: ¿Seguro que querés revertir "${c.nombre}" a estado Activo?`);
  if (!ok2) return;

  c.estado = 'Activo';

  await updateClientInSupabase(c.id, { estado: 'Activo' });

  showToast(`Estado de "${c.nombre}" revertido a Activo.`, 'info');
  renderClientList();
  if (VX.currentSection === 'clientes') renderClientDetail(clientId);
  if (VX.currentSection === 'propuestas') renderPropuestas();
}

async function uploadCVFileToSupabase(file) {
  if (!supabaseClient || !file) return null;
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
  
  const { data, error } = await supabaseClient.storage.from('cvs').upload(fileName, file);
  if (error) {
    console.error('Error subiendo CV a Supabase Storage:', error);
    return null;
  }
  const { data: publicData } = supabaseClient.storage.from('cvs').getPublicUrl(fileName);
  return publicData?.publicUrl || null;
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  // Set user info
  const user = getUser();
  const userNameEl = document.getElementById('userName');
  const userRoleEl = document.getElementById('userRole');
  const userInitialsEl = document.getElementById('userInitials');
  if (userNameEl) userNameEl.textContent = user.name;
  if (userRoleEl) userRoleEl.textContent = user.role || 'Staffing Lead';
  if (userInitialsEl) userInitialsEl.textContent = getInitials(user.name || 'Admin');

  // Init sections & Supabase
  navigate('talentos');
  initCVParser();
  fetchFromSupabase().then(() => initRealtimeSubscriptions());
});

// ---- SUPABASE REALTIME ----
function initRealtimeSubscriptions() {
  if (!supabaseClient) return;

  // ---- TALENTS ----
  supabaseClient
    .channel('realtime:talents')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'talents' }, (payload) => {
      const { eventType, new: newRow, old: oldRow } = payload;

      if (eventType === 'DELETE') {
        VX.talents = VX.talents.filter(t => String(t.id) !== String(oldRow.id));
      } else if (eventType === 'INSERT') {
        // Only add if not already present
        if (!VX.talents.find(t => String(t.id) === String(newRow.id))) {
          VX.talents.unshift(mapTalentRow(newRow));
        }
      } else if (eventType === 'UPDATE') {
        const idx = VX.talents.findIndex(t => String(t.id) === String(newRow.id));
        if (idx !== -1) VX.talents[idx] = mapTalentRow(newRow);
        else VX.talents.unshift(mapTalentRow(newRow));
      }

      applyFilters();
    })
    .subscribe();

  // ---- CLIENTS ----
  supabaseClient
    .channel('realtime:clients')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, (payload) => {
      const { eventType, new: newRow, old: oldRow } = payload;

      if (eventType === 'DELETE') {
        VX.clients = VX.clients.filter(c => String(c.id) !== String(oldRow.id));
        if (String(VX.activeclientId) === String(oldRow.id)) {
          VX.activeclientId = VX.clients[0]?.id || null;
        }
      } else if (eventType === 'INSERT') {
        if (!VX.clients.find(c => String(c.id) === String(newRow.id))) {
          VX.clients.push(mapClientRow(newRow));
        }
      } else if (eventType === 'UPDATE') {
        const idx = VX.clients.findIndex(c => String(c.id) === String(newRow.id));
        const mapped = mapClientRow(newRow);
        if (idx !== -1) VX.clients[idx] = mapped;
        else VX.clients.push(mapped);
      }

      renderClientList();
      if (VX.currentSection === 'clientes' && VX.activeclientId) {
        renderClientDetail(VX.activeclientId);
      }
      if (VX.currentSection === 'propuestas') renderPropuestas();
    })
    .subscribe();

  console.log('✓ Supabase Realtime activo para talents y clients');
}

// Maps a raw Supabase talents row to the VX.talents format
function mapTalentRow(t) {
  let parsedStack = [];
  try { parsedStack = Array.isArray(t.stack) ? t.stack : JSON.parse(t.stack || '[]'); } catch(e) { parsedStack = ['IT']; }
  let parsedCerts = [];
  try { parsedCerts = Array.isArray(t.certificaciones) ? t.certificaciones : JSON.parse(t.certificaciones || '[]'); } catch(e) {}
  let parsedProjs = [];
  try { parsedProjs = Array.isArray(t.proyectos) ? t.proyectos : JSON.parse(t.proyectos || '[]'); } catch(e) {}
  let parsedAsig = null;
  try { parsedAsig = typeof t.asignacion === 'string' ? JSON.parse(t.asignacion) : t.asignacion; } catch(e) {}

  return {
    id: t.id, nombre: t.nombre || 'Candidato IT', rol: t.rol || 'Software Engineer',
    seniority: t.seniority || 'Senior', pais: t.pais || 'Argentina', zona: t.zona || 'GMT-3',
    disponibilidad: t.disponibilidad || 'Inmediata', ingles: t.ingles || 'C1',
    tarifa: Number(t.tarifa) || 50, experiencia: Number(t.experiencia) || 3,
    stack: parsedStack.length > 0 ? parsedStack : ['IT'], certificaciones: parsedCerts,
    email: t.email || '', telefono: t.telefono || '', linkedin: t.linkedin || '',
    resumen: t.resumen || 'Sin resumen registrado.', proyectos: parsedProjs,
    match: Number(t.match) || 85, asignacion: parsedAsig,
    avatar: t.avatar || null, cv_url: t.cv_url || null, activo: t.activo !== false
  };
}

// Maps a raw Supabase clients row to the VX.clients format
function mapClientRow(c) {
  let calls = [];
  try { calls = Array.isArray(c.calls) ? c.calls : JSON.parse(c.calls || '[]'); } catch(e) {}
  let talentoAsignado = [];
  try { talentoAsignado = Array.isArray(c.talentoAsignado) ? c.talentoAsignado : JSON.parse(c.talentoAsignado || '[]'); } catch(e) {}
  let archivos = [];
  try { archivos = Array.isArray(c.archivos) ? c.archivos : JSON.parse(c.archivos || '[]'); } catch(e) {}

  return {
    id: c.id,
    nombre: c.nombre || c.empresa || 'Cliente B2B',
    sector: c.industria || 'Tech',
    sede: c.pais || 'LATAM',
    zona: 'UTC-3', tier: 1,
    estado: c.estado || 'Activo',
    contrato: 'MSA Vigente', pago: 'Net 30',
    stakeholder: { nombre: c.contacto_principal || 'Contacto', cargo: 'Lead Contact', email: c.email || '', telefono: c.telefono || '' },
    necesidades: c.necesidades || '',
    notas: c.notas || '',
    propuestaTexto: c.propuestaTexto || '',
    archivos,
    talentoAsignado,
    calls
  };
}

