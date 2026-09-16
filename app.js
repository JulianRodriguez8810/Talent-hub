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
const SUPABASE_KEY = 'sb_publishable_a7FGzWILNy95vPFvlk7CuA_v6HxSKMz';
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
    tarifaMin: 20,
    tarifaMax: 150
  }
};

// ---- TALENT DATA (FALLBACK & SEED) ----
VX.talents = [
  {
    id: 1, nombre: 'Mateo Rivas', rol: 'Cloud Architect', seniority: 'Senior',
    pais: 'Argentina', zona: 'GMT-3', disponibilidad: 'Inmediata',
    ingles: 'C1', tarifa: 85, experiencia: 8,
    stack: ['Azure', '.NET', 'DevOps', 'Terraform', 'Kubernetes'],
    certificaciones: ['AZ-900', 'AZ-104', 'AZ-305'],
    email: 'mateo.rivas@gmail.com', telefono: '+54 9 11 5555-1234',
    linkedin: 'linkedin.com/in/mateo-rivas-cloud',
    resumen: 'Cloud Architect con 8 años de experiencia en migraciones enterprise a Azure. Especializado en diseño de arquitecturas multi-región, FinOps y modernización de aplicaciones legacy.',
    proyectos: ['Migración Azure para Banco Galicia', 'DevOps Pipeline para Mercado Libre', 'Arquitectura multi-cloud para Rappi'],
    match: 97, asignacion: null, avatar: null, activo: true
  },
  {
    id: 2, nombre: 'Valentina Torres', rol: 'Full Stack Developer', seniority: 'Semi-Senior',
    pais: 'Colombia', zona: 'GMT-5', disponibilidad: 'Inmediata',
    ingles: 'B2', tarifa: 55, experiencia: 4,
    stack: ['React', 'Node.js', '.NET', 'PostgreSQL', 'Azure'],
    certificaciones: ['AZ-204'],
    email: 'val.torres@outlook.com', telefono: '+57 300 123 4567',
    linkedin: 'linkedin.com/in/valentina-torres-dev',
    resumen: 'Desarrolladora full stack con sólida experiencia en React y .NET. Ha liderado el frontend de 3 productos SaaS desde cero con enfoque en UX y performance.',
    proyectos: ['Portal B2B para TechCorp Colombia', 'E-commerce Falabella', 'App Bancaria Davivienda'],
    match: 89, asignacion: { cliente: 'Fintech Solutions LATAM', horas: 20 }, avatar: null, activo: true
  },
  {
    id: 3, nombre: 'Andrés Morales', rol: 'DevOps Engineer', seniority: 'Senior',
    pais: 'México', zona: 'GMT-6', disponibilidad: 'Parcial',
    ingles: 'C1', tarifa: 75, experiencia: 6,
    stack: ['DevOps', 'Kubernetes', 'Jenkins', 'Azure', 'Docker'],
    certificaciones: ['AZ-400', 'CKA'],
    email: 'amorales.devops@gmail.com', telefono: '+52 55 9876 5432',
    linkedin: 'linkedin.com/in/andres-morales-devops',
    resumen: 'DevOps Engineer senior con expertise en CI/CD pipelines y Kubernetes. Ha reducido tiempos de deployment en un 70% en proyectos enterprise de alta criticidad.',
    proyectos: ['CI/CD Pipeline BBVA México', 'K8s Migration OCC', 'Azure DevOps Telmex'],
    match: 93, asignacion: { cliente: 'Global Logistics Corp', horas: 30 }, avatar: null, activo: true
  },
  {
    id: 4, nombre: 'Sofía Mendoza', rol: 'Data Engineer', seniority: 'Senior',
    pais: 'Argentina', zona: 'GMT-3', disponibilidad: 'Inmediata',
    ingles: 'C1', tarifa: 80, experiencia: 7,
    stack: ['IA/ML', 'Python', 'Azure', 'Databricks', 'Spark'],
    certificaciones: ['DP-900', 'DP-203', 'DP-100'],
    email: 'sofia.mendoza.data@gmail.com', telefono: '+54 351 999 0011',
    linkedin: 'linkedin.com/in/sofia-mendoza-data',
    resumen: 'Data Engineer con foco en arquitecturas lakehouse y pipelines de IA. Experiencia en Databricks, Azure Synapse y modelos de ML en producción para empresas Fortune 500.',
    proyectos: ['Data Platform YPF', 'ML Pipeline MercadoLibre', 'Azure Synapse Santander'],
    match: 95, asignacion: null, avatar: null, activo: true
  },
  {
    id: 5, nombre: 'Lucas Ferreira', rol: 'Mobile Developer', seniority: 'Semi-Senior',
    pais: 'Uruguay', zona: 'GMT-3', disponibilidad: 'Inmediata',
    ingles: 'B1', tarifa: 50, experiencia: 3,
    stack: ['Mobile', 'React Native', 'Flutter', 'iOS', 'Android'],
    certificaciones: [],
    email: 'lucas.ferreira.mobile@gmail.com', telefono: '+598 99 123 456',
    linkedin: 'linkedin.com/in/lucas-ferreira-mobile',
    resumen: 'Desarrollador mobile multiplataforma con 3 apps publicadas en App Store y Play Store. Especializado en animaciones, performance y UX mobile nativa.',
    proyectos: ['App OCA Bank Uruguay', 'App Antel', 'E-commerce Tienda Inglesa'],
    match: 82, asignacion: null, avatar: null, activo: true
  },
  {
    id: 6, nombre: 'Camila Restrepo', rol: 'UX/UI Designer', seniority: 'Senior',
    pais: 'Colombia', zona: 'GMT-5', disponibilidad: 'Inmediata',
    ingles: 'C2', tarifa: 65, experiencia: 6,
    stack: ['UX/UI', 'Figma', 'Design Systems', 'Prototyping', 'CSS'],
    certificaciones: ['Google UX Design'],
    email: 'camila.restrepo.ux@gmail.com', telefono: '+57 314 222 3344',
    linkedin: 'linkedin.com/in/camila-restrepo-ux',
    resumen: 'UX/UI Designer senior con enfoque en design systems escalables y research centrado en usuario. Ha diseñado productos usados por más de 2M de usuarios en LATAM.',
    proyectos: ['Design System Bancolombia', 'App Rappi Redesign', 'Portal Claro Colombia'],
    match: 88, asignacion: { cliente: 'HealthTech Innovations', horas: 40 }, avatar: null, activo: true
  },
  {
    id: 7, nombre: 'Diego Álvarez', rol: 'QA Engineer', seniority: 'Semi-Senior',
    pais: 'Chile', zona: 'GMT-4', disponibilidad: 'Inmediata',
    ingles: 'B2', tarifa: 48, experiencia: 4,
    stack: ['QA', 'Selenium', 'Cypress', 'Playwright', 'Azure'],
    certificaciones: ['ISTQB Foundation'],
    email: 'diego.alvarez.qa@gmail.com', telefono: '+56 9 8765 4321',
    linkedin: 'linkedin.com/in/diego-alvarez-qa',
    resumen: 'QA Engineer con experiencia en automatización E2E y testing de APIs. Ha implementado pipelines de testing que redujeron bugs en producción en un 60%.',
    proyectos: ['QA Automation BCI Chile', 'Testing Pipeline Falabella', 'E2E Testing Cornershop'],
    match: 85, asignacion: null, avatar: null, activo: true
  },
  {
    id: 8, nombre: 'Isabella Vargas', rol: '.NET Backend Developer', seniority: 'Senior',
    pais: 'Argentina', zona: 'GMT-3', disponibilidad: 'Inmediata',
    ingles: 'C1', tarifa: 78, experiencia: 7,
    stack: ['.NET', 'Azure', 'Microservicios', 'SQL Server', 'RabbitMQ'],
    certificaciones: ['AZ-204', 'AZ-900'],
    email: 'isabella.vargas.net@gmail.com', telefono: '+54 11 4444 9999',
    linkedin: 'linkedin.com/in/isabella-vargas-dotnet',
    resumen: 'Backend developer .NET con especialización en microservicios y arquitecturas event-driven. Ha migrado monolitos a microservicios para empresas del sector financiero.',
    proyectos: ['Core Banking Supervielle', 'Microservicios ICBC', 'API Gateway Naranja X'],
    match: 96, asignacion: null, avatar: null, activo: true
  },
  {
    id: 9, nombre: 'Nicolás Pardo', rol: 'Salesforce Developer', seniority: 'Senior',
    pais: 'Colombia', zona: 'GMT-5', disponibilidad: 'Parcial',
    ingles: 'C1', tarifa: 90, experiencia: 8,
    stack: ['Salesforce', 'Apex', 'LWC', 'Azure', 'CRM'],
    certificaciones: ['Salesforce Admin', 'Salesforce Developer', 'Salesforce Architect'],
    email: 'nicolas.pardo.sf@gmail.com', telefono: '+57 310 555 6677',
    linkedin: 'linkedin.com/in/nicolas-pardo-salesforce',
    resumen: 'Salesforce Developer y Architect con 8 años implementando soluciones CRM enterprise. Certificado como Salesforce Architect con historial en proyectos de más de $1M.',
    proyectos: ['CRM Coltelecom', 'Salesforce CPQ Avianca', 'Service Cloud Bavaria'],
    match: 91, asignacion: { cliente: 'Global Logistics Corp', horas: 40 }, avatar: null, activo: true
  },
  {
    id: 10, nombre: 'Florencia Gimenez', rol: 'Project Manager', seniority: 'Senior',
    pais: 'Argentina', zona: 'GMT-3', disponibilidad: 'Inmediata',
    ingles: 'C2', tarifa: 70, experiencia: 9,
    stack: ['Azure', 'Scrum', 'Jira', 'PMP', 'Agile'],
    certificaciones: ['PMP', 'PSM I', 'AZ-900'],
    email: 'fgimenez.pm@gmail.com', telefono: '+54 11 3333 2222',
    linkedin: 'linkedin.com/in/florencia-gimenez-pm',
    resumen: 'Project Manager con certificación PMP y 9 años liderando proyectos IT en sectores financiero, retail y logística. Inglés fluido para gestión de stakeholders internacionales.',
    proyectos: ['Programa Digital BBVA Argentina', 'Transformación Ágil Naranja X', 'ERP SAP Arcor'],
    match: 87, asignacion: null, avatar: null, activo: true
  },
  {
    id: 11, nombre: 'Sebastián López', rol: 'Cybersecurity Specialist', seniority: 'Senior',
    pais: 'México', zona: 'GMT-6', disponibilidad: 'Inmediata',
    ingles: 'B2', tarifa: 88, experiencia: 7,
    stack: ['Azure', 'DevOps', 'Security', 'Pentesting', 'SIEM'],
    certificaciones: ['CISSP', 'AZ-500', 'CEH'],
    email: 'sebastian.lopez.sec@gmail.com', telefono: '+52 33 8765 4321',
    linkedin: 'linkedin.com/in/sebastian-lopez-security',
    resumen: 'Especialista en ciberseguridad con foco en Azure Security y arquitecturas Zero Trust. Certificado CISSP con experiencia en pentesting y respuesta a incidentes enterprise.',
    proyectos: ['Zero Trust Architecture Banamex', 'SOC Azure PEMEX', 'Seguridad M365 CFE'],
    match: 90, asignacion: null, avatar: null, activo: true
  },
  {
    id: 12, nombre: 'Ana Castillo', rol: 'React Frontend Developer', seniority: 'Junior',
    pais: 'Chile', zona: 'GMT-4', disponibilidad: 'Inmediata',
    ingles: 'B1', tarifa: 30, experiencia: 1.5,
    stack: ['React', 'JavaScript', 'CSS', 'Figma', 'Git'],
    certificaciones: [],
    email: 'ana.castillo.dev@gmail.com', telefono: '+56 9 7654 3210',
    linkedin: 'linkedin.com/in/ana-castillo-react',
    resumen: 'Frontend developer junior con pasión por UX y código limpio. Rápida aprendizaje, profiling en React hooks y estado global.',
    proyectos: ['Portal Clientes Banco Estado', 'Landing Pages Entel', 'App Interna Falabella'],
    match: 75, asignacion: null, avatar: null, activo: true
  },
  {
    id: 13, nombre: 'Pablo Herrera', rol: 'BI & Analytics Engineer', seniority: 'Semi-Senior',
    pais: 'Uruguay', zona: 'GMT-3', disponibilidad: 'Parcial',
    ingles: 'B2', tarifa: 60, experiencia: 5,
    stack: ['IA/ML', 'Power BI', 'Azure', 'Databricks', 'SQL'],
    certificaciones: ['PL-300', 'DP-900'],
    email: 'pablo.herrera.bi@gmail.com', telefono: '+598 91 234 5678',
    linkedin: 'linkedin.com/in/pablo-herrera-bi',
    resumen: 'Analytics engineer especializado en Power BI y Azure Synapse. Ha construido data warehouses para retailers con más de 500M de registros y dashboards en tiempo real.',
    proyectos: ['DWH Disco Uruguay', 'Power BI Platform BSE', 'Analytics Abitab'],
    match: 83, asignacion: null, avatar: null, activo: true
  },
  {
    id: 14, nombre: 'Mariana Silva', rol: 'Infrastructure Engineer', seniority: 'Lead',
    pais: 'Argentina', zona: 'GMT-3', disponibilidad: 'Inmediata',
    ingles: 'C1', tarifa: 95, experiencia: 10,
    stack: ['Azure', 'DevOps', 'Terraform', 'Kubernetes', '.NET'],
    certificaciones: ['AZ-104', 'AZ-305', 'AZ-400', 'CKA'],
    email: 'mariana.silva.infra@gmail.com', telefono: '+54 11 2222 8888',
    linkedin: 'linkedin.com/in/mariana-silva-infra',
    resumen: 'Infrastructure Lead con 10 años en arquitecturas cloud de alta disponibilidad. Ha diseñado plataformas que soportan más de 10M de transacciones diarias en producción.',
    proyectos: ['Infra Multi-Cloud MercadoPago', 'Azure Landing Zone Personal Pay', 'Kubernetes Platform DIA'],
    match: 98, asignacion: null, avatar: null, activo: true
  },
  {
    id: 15, nombre: 'Carlos Mendez', rol: 'iOS Developer', seniority: 'Semi-Senior',
    pais: 'México', zona: 'GMT-6', disponibilidad: 'Inmediata',
    ingles: 'B2', tarifa: 55, experiencia: 4,
    stack: ['Mobile', 'Swift', 'iOS', 'Xcode', 'Firebase'],
    certificaciones: ['Apple Developer'],
    email: 'carlos.mendez.ios@gmail.com', telefono: '+52 55 6677 8899',
    linkedin: 'linkedin.com/in/carlos-mendez-ios',
    resumen: 'iOS Developer con enfoque en SwiftUI y ARKit. Apps publicadas con más de 200K descargas. Experiencia en fintech y retail mobile.',
    proyectos: ['App Bancomer iOS', 'App Liverpool iOS', 'App Hey Banco'],
    match: 80, asignacion: null, avatar: null, activo: true
  },
  {
    id: 16, nombre: 'Jimena Castro', rol: 'Scrum Master', seniority: 'Senior',
    pais: 'Colombia', zona: 'GMT-5', disponibilidad: 'Inmediata',
    ingles: 'C1', tarifa: 65, experiencia: 6,
    stack: ['Scrum', 'Azure', 'Jira', 'SAFe', 'Agile'],
    certificaciones: ['CSM', 'SAFe 5', 'PSM II'],
    email: 'jimena.castro.sm@gmail.com', telefono: '+57 315 888 9900',
    linkedin: 'linkedin.com/in/jimena-castro-scrum',
    resumen: 'Scrum Master certificada con experiencia en transformaciones ágiles a escala. Ha facilitado la adopción de SAFe en organizaciones de más de 200 personas.',
    proyectos: ['Agile Transformation Ecopetrol', 'SAFe Implementation Bancolombia', 'Squads Setup Claro'],
    match: 86, asignacion: null, avatar: null, activo: true
  },
  {
    id: 17, nombre: 'Tomás Ruiz', rol: 'AI/ML Engineer', seniority: 'Senior',
    pais: 'Argentina', zona: 'GMT-3', disponibilidad: 'Inmediata',
    ingles: 'C1', tarifa: 92, experiencia: 7,
    stack: ['IA/ML', 'Python', 'Azure', 'LLM', 'TensorFlow'],
    certificaciones: ['AZ-900', 'DP-100', 'AI-900'],
    email: 'tomas.ruiz.ai@gmail.com', telefono: '+54 11 7777 6666',
    linkedin: 'linkedin.com/in/tomas-ruiz-ai',
    resumen: 'AI/ML Engineer especializado en LLMs y RAG para aplicaciones enterprise. Ha implementado soluciones de IA generativa en Azure OpenAI que ahorraron $2M anuales a clientes.',
    proyectos: ['LLM Platform Telecom Argentina', 'RAG System Banco Provincia', 'AI Analytics OCA'],
    match: 94, asignacion: null, avatar: null, activo: true
  },
  {
    id: 18, nombre: 'Lucía Fernández', rol: 'Backend Developer', seniority: 'Lead',
    pais: 'Chile', zona: 'GMT-4', disponibilidad: 'Parcial',
    ingles: 'C2', tarifa: 100, experiencia: 11,
    stack: ['.NET', 'Azure', 'Microservicios', 'IA/ML', 'DevOps'],
    certificaciones: ['AZ-204', 'AZ-305', 'AZ-400', 'DP-100'],
    email: 'lucia.fernandez.lead@gmail.com', telefono: '+56 9 5555 1111',
    linkedin: 'linkedin.com/in/lucia-fernandez-lead',
    resumen: 'Tech Lead con dominio de .NET y Azure. Ha liderado equipos de hasta 15 personas y arquitecturas para el sector financiero y utilities en toda LATAM. Inglés nativo.',
    proyectos: ['Core Platform Santander Chile', 'Arquitectura BancoEstado', 'Platform Engineering Enel'],
    match: 99, asignacion: null, avatar: null, activo: true
  }
];

// ---- CLIENT DATA ----
VX.clients = [
  {
    id: 1, nombre: 'Fintech Solutions LATAM', sector: 'Fintech',
    sede: 'Bogotá, Colombia & CDMX', zona: 'UTC-5', tier: 1,
    estado: 'Activo', contrato: 'MSA Vigente (2024-2026)', pago: 'Net 30',
    stakeholder: { nombre: 'Carolina Herrera', cargo: 'VP of Engineering', email: 'carolina.herrera@fintechlatam.io', telefono: '+57 300 123 4567' },
    necesidades: 'Equipo de desarrollo para plataforma de pagos P2P. Buscan: 2 Senior .NET Backend, 1 DevOps Azure, 1 QA Automation.',
    talentoAsignado: [2],
    calls: [
      { id: 1, fecha: '2026-09-10', hora: '10:00', plataforma: 'Teams', participantes: 'Carolina Herrera, Laura Méndez (VX)', link: 'https://teams.microsoft.com/l/meet/abc123', notas: 'Kickoff inicial. Confirmaron necesidad de 2 devs .NET para Q4. Presupuesto aprobado. Próxima call: demo de perfiles.' },
      { id: 2, fecha: '2026-09-15', hora: '14:00', plataforma: 'Teams', participantes: 'Carolina Herrera, Rodrigo López, Laura Méndez (VX)', link: 'https://teams.microsoft.com/l/meet/def456', notas: 'Presentación de 3 perfiles. Aprobaron a Valentina Torres. Revisarán propuesta de Mateo Rivas. Respuesta esperada el viernes.' }
    ]
  },
  {
    id: 2, nombre: 'Global Logistics Corp', sector: 'Logística',
    sede: 'Buenos Aires, Argentina & São Paulo, Brasil', zona: 'UTC-3', tier: 1,
    estado: 'Activo', contrato: 'SOW por proyecto', pago: 'Net 45',
    stakeholder: { nombre: 'Roberto Guzmán', cargo: 'CTO', email: 'roberto.guzman@globallogistics.com', telefono: '+54 11 9876 5432' },
    necesidades: 'Migración de sistemas legacy a Azure. Buscan: 1 Cloud Architect, 1 DevOps Senior, 1 Integration Specialist.',
    talentoAsignado: [3, 9],
    calls: [
      { id: 1, fecha: '2026-09-05', hora: '09:00', plataforma: 'Zoom', participantes: 'Roberto Guzmán, Ana Pérez (CIO), Laura Méndez (VX)', link: 'https://zoom.us/j/99887766', notas: 'Discovery de sistemas legacy. Tienen 12 aplicaciones on-premise a migrar. Timeline: 18 meses. Piden equipo estable de 3 personas.' }
    ]
  },
  {
    id: 3, nombre: 'HealthTech Innovations', sector: 'Healthcare IT',
    sede: 'Santiago, Chile', zona: 'UTC-4', tier: 2,
    estado: 'Activo', contrato: 'Tiempo y Materiales', pago: 'Net 30',
    stakeholder: { nombre: 'Martina Ríos', cargo: 'Head of Product', email: 'mrios@healthtech.cl', telefono: '+56 2 9988 7766' },
    necesidades: 'Rediseño de plataforma de telemedicina. Buscan: 1 UX/UI Senior, 1 React Developer, 1 Backend Python.',
    talentoAsignado: [6],
    calls: [
      { id: 1, fecha: '2026-09-12', hora: '11:30', plataforma: 'Google Meet', participantes: 'Martina Ríos, Laura Méndez (VX)', link: 'https://meet.google.com/abc-defg-hij', notas: 'Revisión de mockups previos. Necesitan alguien con experiencia en accesibilidad (WCAG 2.1). Camila Restrepo es la candidata perfecta. Enviar propuesta esta semana.' }
    ]
  },
  {
    id: 4, nombre: 'EduTech Ventures', sector: 'EdTech',
    sede: 'Ciudad de México', zona: 'UTC-6', tier: 2,
    estado: 'En negociación', contrato: 'Por definir', pago: 'Por definir',
    stakeholder: { nombre: 'Alejandro Mora', cargo: 'CEO & Founder', email: 'alejandro@edutech.mx', telefono: '+52 55 4444 3333' },
    necesidades: 'MVP de plataforma e-learning con IA. Buscan: 1 AI/ML Engineer, 1 Full Stack Developer, 1 UX Designer.',
    talentoAsignado: [],
    calls: [
      { id: 1, fecha: '2026-09-16', hora: '16:00', plataforma: 'Teams', participantes: 'Alejandro Mora, Laura Méndez (VX)', link: 'https://teams.microsoft.com/l/meet/ghi789', notas: 'Primera reunión. Startup en etapa seed con $500K de financiamiento. Quieren un MVP en 3 meses. Interesados en Tomás Ruiz para IA. Presupuesto limitado (~$40K).' }
    ]
  }
];

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

  // Render section
  if (section === 'talentos') renderTalentos();
  if (section === 'clientes') renderClientes();
  if (section === 'propuestas') renderPropuestas();
  if (section === 'reportes') renderReportes();
}

// ---- FILTERS ----
function applyFilters() {
  const f = VX.filters;
  const q = (VX.searchQuery || '').toLowerCase();

  VX.filteredTalents = VX.talents.filter(t => {
    if (t.activo === false) return false;

    const stackArr = Array.isArray(t.stack) ? t.stack : [];
    const certArr = Array.isArray(t.certificaciones) ? t.certificaciones : [];

    // Text search
    if (q) {
      const searchable = `${t.nombre || ''} ${t.rol || ''} ${t.seniority || ''} ${stackArr.join(' ')} ${t.pais || ''} ${t.resumen || ''} ${certArr.join(' ')}`.toLowerCase();
      if (!searchable.includes(q)) return false;
    }

    // Stack
    if (f.stack.length > 0 && !f.stack.some(s => stackArr.includes(s))) return false;
    // Inglés
    if (f.ingles.length > 0 && !f.ingles.includes(t.ingles)) return false;
    // Disponibilidad
    if (f.disponibilidad.length > 0 && !f.disponibilidad.includes(t.disponibilidad)) return false;
    // Seniority
    if (f.seniority.length > 0 && !f.seniority.includes(t.seniority)) return false;
    // País
    if (f.pais.length > 0 && !f.pais.includes(t.pais)) return false;
    // Tarifa
    if (t.tarifa && (t.tarifa < f.tarifaMin || t.tarifa > f.tarifaMax)) return false;

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
  VX.filters = { stack: [], ingles: [], disponibilidad: [], seniority: [], pais: [], tarifaMin: 20, tarifaMax: 150 };
  VX.searchQuery = '';
  const searchEl = document.getElementById('semanticSearch');
  if (searchEl) searchEl.value = '';
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
    total: VX.talents.filter(t => t.activo).length,
    bench: VX.talents.filter(t => t.disponibilidad === 'Inmediata' && t.activo).length,
    asignados: VX.talents.filter(t => t.asignacion && t.activo).length,
    matchAvg: Math.round(VX.talents.reduce((a, b) => a + b.match, 0) / VX.talents.length)
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
    const isSelected = VX.selectedTalents.has(t.id);
    const visibleStack = t.stack.slice(0, 3);
    const extraStack = t.stack.length - 3;

    return `
    <div class="group bg-surface-card rounded-xl border border-border-subtle hover:border-border-strong hover:shadow-[0_10px_15px_-3px_rgba(15,23,42,0.06)] transition-all duration-200 flex flex-col overflow-hidden ${isSelected ? 'ring-2 ring-primary border-primary' : ''}">
      <!-- Selection check -->
      <div class="px-4 pt-4 flex items-start justify-between gap-2">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleSelectTalent(${t.id}, this)" class="w-4 h-4 rounded border-border-strong accent-primary"/>
          <span class="text-label-sm font-label text-text-muted">Añadir a propuesta</span>
        </label>
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-label font-bold ${matchColor}">
          <span class="material-symbols-outlined text-[12px]">auto_awesome</span>
          ${t.match}%
        </span>
      </div>

      <!-- Avatar + info -->
      <div class="px-4 pt-3 pb-2 flex items-start gap-3">
        <div class="relative shrink-0">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-container to-primary flex items-center justify-center text-on-primary-container font-sans font-bold text-[18px]">
            ${getInitials(t.nombre)}
          </div>
          <span class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${status.dot} ring-2 ring-surface-card"></span>
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="text-headline-sm font-sans font-bold text-text-heading truncate">${t.nombre}</h3>
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
        <button onclick="openTalentModal(${t.id})" class="flex-1 text-label-md font-label font-bold text-primary hover:text-primary/80 text-center py-1.5 rounded-lg hover:bg-surface-container-low transition-all">Ver Ficha</button>
        <div class="w-px h-5 bg-border-subtle"></div>
        <button onclick="addTalentToProposal(${t.id})" class="flex-1 text-center py-1.5 px-3 rounded-lg bg-primary-container text-on-primary-container text-label-md font-label font-bold hover:bg-primary transition-all">+ Propuesta</button>
      </div>
    </div>`;
  }).join('');
}

function toggleSelectTalent(id, checkbox) {
  if (checkbox.checked) {
    VX.selectedTalents.add(id);
  } else {
    VX.selectedTalents.delete(id);
  }
  updateSelectionBanner();
  renderTalentGrid();
}

function addTalentToProposal(id) {
  VX.selectedTalents.add(id);
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
  const t = VX.talents.find(x => x.id === id);
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
      <button onclick="deleteTalentDirectly(${t.id})" class="px-4 py-2.5 rounded-lg bg-error-container text-error text-label-lg font-label font-bold hover:bg-error/20 transition-all flex items-center gap-1">
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

function renderClientList() {
  const list = document.getElementById('clientList');
  if (!list) return;
  list.innerHTML = VX.clients.map(c => {
    const active = VX.activeclientId === c.id;
    const statusColor = { 'Activo': 'bg-status-available', 'En negociación': 'bg-status-interviewing', 'Inactivo': 'bg-status-placed' };
    return `
    <button onclick="selectClient(${c.id})" class="w-full text-left px-3 py-3 rounded-xl border transition-all ${active ? 'bg-primary-container border-primary/30 shadow-sm' : 'bg-surface-card border-border-subtle hover:border-border-strong hover:shadow-sm'}">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <div class="text-label-lg font-label font-bold ${active ? 'text-on-primary-container' : 'text-text-heading'} truncate">${c.nombre}</div>
          <div class="text-body-sm font-sans ${active ? 'text-on-primary-container/70' : 'text-text-muted'}">${c.sector} · Tier ${c.tier}</div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <span class="w-2 h-2 rounded-full ${statusColor[c.estado] || 'bg-secondary'}"></span>
        </div>
      </div>
      <div class="mt-1.5 flex items-center gap-2">
        <span class="text-[10px] font-label font-bold ${active ? 'text-on-primary-container/70' : 'text-text-muted'} uppercase tracking-wider">${c.talentoAsignado.length} recurso${c.talentoAsignado.length !== 1 ? 's' : ''}</span>
        <span class="text-text-muted">·</span>
        <span class="text-[10px] font-label font-bold ${active ? 'text-on-primary-container/70' : 'text-text-muted'} uppercase tracking-wider">${c.calls.length} call${c.calls.length !== 1 ? 's' : ''}</span>
      </div>
    </button>`;
  }).join('');
}

function selectClient(id) {
  VX.activeclientId = id;
  renderClientList();
  renderClientDetail(id);
}

function renderClientDetail(id) {
  const c = VX.clients.find(x => x.id === id);
  const detail = document.getElementById('clientDetail');
  if (!c || !detail) return;

  const assignedTalents = VX.talents.filter(t => c.talentoAsignado.includes(t.id));
  const statusColor = { 'Activo': '#10B981', 'En negociación': '#F59E0B', 'Inactivo': '#6366F1' };
  const platformIcon = { 'Teams': 'videocam', 'Zoom': 'video_call', 'Google Meet': 'duo' };

  detail.innerHTML = `
    <!-- Client header -->
    <div class="relative bg-surface-card rounded-xl p-6 shadow-sm mb-5 overflow-hidden">
      <div class="absolute -right-12 -bottom-12 w-56 h-56 bg-gradient-to-br from-primary-container/10 to-transparent rounded-full pointer-events-none"></div>
      <div class="grid grid-cols-1 md:grid-cols-12 gap-5 items-center relative z-10">
        <div class="md:col-span-5 flex items-start gap-4">
          <div class="w-16 h-16 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-primary text-[32px]">account_balance</span>
          </div>
          <div>
            <div class="flex items-center gap-2 mb-0.5">
              <h2 class="text-headline-md font-sans font-bold text-text-heading">${c.nombre}</h2>
              <span class="px-2 py-0.5 rounded-full text-label-sm font-label font-semibold bg-surface-container text-primary">Tier ${c.tier}</span>
            </div>
            <p class="text-body-sm font-sans text-text-muted">${c.sede} · ${c.zona}</p>
            <div class="flex items-center gap-3 mt-2">
              <span class="text-label-sm font-label text-text-muted flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px] text-status-available">verified</span>${c.contrato}
              </span>
              <span class="text-label-sm font-label text-text-muted flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px] text-primary">schedule</span>${c.pago}
              </span>
            </div>
          </div>
        </div>

        <div class="md:col-span-4 bg-surface-container-low rounded-xl p-4">
          <div class="text-label-sm font-label text-text-muted uppercase tracking-wider mb-2">Stakeholder Principal</div>
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-secondary-container to-secondary-fixed-dim flex items-center justify-center text-on-secondary-fixed font-sans font-bold">
              ${getInitials(c.stakeholder.nombre)}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-headline-sm font-sans font-bold text-text-heading truncate">${c.stakeholder.nombre}</div>
              <div class="text-body-sm font-sans text-text-muted truncate">${c.stakeholder.cargo}</div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <a href="tel:${c.stakeholder.telefono}" class="w-8 h-8 rounded-lg bg-surface-card hover:bg-surface-container text-primary flex items-center justify-center transition-all shadow-sm" title="Llamar"><span class="material-symbols-outlined text-[18px]">phone_in_talk</span></a>
              <a href="mailto:${c.stakeholder.email}" class="w-8 h-8 rounded-lg bg-surface-card hover:bg-surface-container text-primary flex items-center justify-center transition-all shadow-sm" title="Email"><span class="material-symbols-outlined text-[18px]">mail</span></a>
            </div>
          </div>
        </div>

        <div class="md:col-span-3 flex flex-col gap-2">
          <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-label-sm font-label font-bold self-start" style="background:${statusColor[c.estado]}20;color:${statusColor[c.estado]}">
            <span class="w-2 h-2 rounded-full" style="background:${statusColor[c.estado]}"></span>${c.estado}
          </span>
          <button onclick="openNewClientModal()" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-card border border-border-subtle text-text-heading text-label-md font-label font-bold hover:bg-surface-container-low transition-all shadow-sm">
            <span class="material-symbols-outlined text-[16px] text-primary">edit</span>Editar cliente
          </button>
          <button onclick="deleteClientDirectly(${c.id})" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-error-container border border-error/20 text-error text-label-md font-label font-bold hover:bg-error/20 transition-all shadow-sm">
            <span class="material-symbols-outlined text-[16px]">delete</span>Eliminar cliente
          </button>
        </div>
      </div>
    </div>

    <!-- Needs -->
    <div class="bg-surface-card rounded-xl p-5 shadow-sm mb-5">
      <div class="flex items-center gap-2 mb-3">
        <span class="material-symbols-outlined text-primary text-[20px]">checklist</span>
        <h3 class="text-headline-sm font-sans font-bold text-text-heading">Necesidades & Requerimientos</h3>
      </div>
      <p class="text-body-md font-sans text-text-body leading-relaxed">${c.necesidades}</p>
    </div>

    <!-- Assigned resources -->
    <div class="bg-surface-card rounded-xl p-5 shadow-sm mb-5">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-[20px]">group</span>
          <h3 class="text-headline-sm font-sans font-bold text-text-heading">Recursos Asignados</h3>
          <span class="px-2 py-0.5 rounded-full bg-surface-container text-primary text-label-sm font-label font-bold">${assignedTalents.length}</span>
        </div>
        <button onclick="openAssignModal(${c.id})" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-container text-on-primary-container text-label-md font-label font-bold hover:bg-primary transition-all">
          <span class="material-symbols-outlined text-[16px]">person_add</span>Asignar Recurso
        </button>
      </div>
      ${assignedTalents.length === 0 ? `
        <div class="flex flex-col items-center py-8 text-center">
          <span class="material-symbols-outlined text-[48px] text-text-muted/30 mb-2">person_search</span>
          <p class="text-body-md font-sans text-text-muted">Sin recursos asignados. <button onclick="openAssignModal(${c.id})" class="text-primary hover:underline font-bold">Asignar uno</button></p>
        </div>` :
        `<div class="flex flex-col gap-3">
          ${assignedTalents.map(t => {
            const status = getStatusBadge(t.disponibilidad);
            return `<div class="flex items-center gap-3 p-3 rounded-xl bg-surface-canvas border border-border-subtle">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-container to-primary flex items-center justify-center text-on-primary-container font-sans font-bold text-[14px] shrink-0">${getInitials(t.nombre)}</div>
              <div class="flex-1 min-w-0">
                <div class="text-label-lg font-label font-bold text-text-heading truncate">${t.nombre}</div>
                <div class="text-body-sm font-sans text-text-muted">${t.rol} · ${t.asignacion?.horas || 40}h/semana</div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-label font-bold bg-[#EEF2FF] text-[#3730A3]"><span class="w-1.5 h-1.5 rounded-full bg-status-placed"></span>Asignado</span>
                <button onclick="unassignTalent(${c.id}, ${t.id})" class="w-7 h-7 rounded-lg text-text-muted hover:text-error hover:bg-error-container transition-all flex items-center justify-center" title="Desasignar"><span class="material-symbols-outlined text-[16px]">person_remove</span></button>
              </div>
            </div>`;
          }).join('')}
        </div>`}
    </div>

    <!-- Calls log -->
    <div class="bg-surface-card rounded-xl p-5 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-[20px]">videocam</span>
          <h3 class="text-headline-sm font-sans font-bold text-text-heading">Bitácora de Calls</h3>
          <span class="px-2 py-0.5 rounded-full bg-surface-container text-primary text-label-sm font-label font-bold">${c.calls.length}</span>
        </div>
        <button onclick="openNewCallModal(${c.id})" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-canvas border border-border-subtle text-text-heading text-label-md font-label font-bold hover:bg-surface-container-low transition-all shadow-sm">
          <span class="material-symbols-outlined text-[16px] text-primary">add</span>Nueva Call
        </button>
      </div>
      <div class="flex flex-col gap-4">
        ${c.calls.map((call, i) => `
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
            </div>
          </div>
        </div>`).join('')}
      </div>
    </div>
  `;
}

function openAssignModal(clientId) {
  const modal = document.getElementById('assignModal');
  const content = document.getElementById('assignModalContent');
  const c = VX.clients.find(x => x.id === clientId);

  const available = VX.talents.filter(t => t.activo && !c.talentoAsignado.includes(t.id));

  content.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-headline-sm font-sans font-bold text-text-heading">Asignar Recurso a ${c.nombre}</h3>
      <button onclick="document.getElementById('assignModal').classList.add('hidden')" class="p-1.5 rounded-lg text-text-muted hover:bg-surface-container transition-all"><span class="material-symbols-outlined text-[20px]">close</span></button>
    </div>
    <div class="mb-3">
      <input type="text" placeholder="Buscar talento..." class="w-full h-10 px-3 rounded-lg border border-border-strong bg-surface-card text-body-md font-sans focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,120,212,0.15)]" oninput="filterAssignList(this.value, ${clientId})"/>
    </div>
    <div id="assignList" class="flex flex-col gap-2 max-h-80 overflow-y-auto">
      ${available.map(t => {
        const status = getStatusBadge(t.disponibilidad);
        return `<div class="flex items-center gap-3 p-3 rounded-xl bg-surface-canvas border border-border-subtle hover:border-primary transition-all cursor-pointer" onclick="assignTalent(${clientId}, ${t.id})">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-container to-primary flex items-center justify-center text-on-primary-container font-sans font-bold text-[14px] shrink-0">${getInitials(t.nombre)}</div>
          <div class="flex-1 min-w-0">
            <div class="text-label-lg font-label font-bold text-text-heading">${t.nombre}</div>
            <div class="text-body-sm font-sans text-text-muted">${t.rol} · ${t.seniority} · $${t.tarifa}/h</div>
          </div>
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-label font-bold ${status.bg} ${status.text}"><span class="w-1.5 h-1.5 rounded-full ${status.dot}"></span>${status.label}</span>
        </div>`;
      }).join('')}
    </div>
  `;
  modal.classList.remove('hidden');
}

function assignTalent(clientId, talentId) {
  const c = VX.clients.find(x => x.id === clientId);
  const t = VX.talents.find(x => x.id === talentId);
  if (!c || !t) return;
  if (!c.talentoAsignado.includes(talentId)) {
    c.talentoAsignado.push(talentId);
    t.asignacion = { cliente: c.nombre, horas: 40 };
    t.disponibilidad = 'Asignado';
  }
  document.getElementById('assignModal').classList.add('hidden');
  renderClientDetail(clientId);
  renderClientList();
  showToast(`${t.nombre} asignado a ${c.nombre}`, 'success');
}

function unassignTalent(clientId, talentId) {
  const c = VX.clients.find(x => x.id === clientId);
  const t = VX.talents.find(x => x.id === talentId);
  if (!c || !t) return;
  c.talentoAsignado = c.talentoAsignado.filter(id => id !== talentId);
  t.asignacion = null;
  t.disponibilidad = 'Inmediata';
  renderClientDetail(clientId);
  renderClientList();
  showToast(`${t.nombre} desasignado`, 'info');
}

function openNewCallModal(clientId) {
  const modal = document.getElementById('callModal');
  const content = document.getElementById('callModalContent');
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().slice(0, 5);

  content.innerHTML = `
    <div class="flex items-center justify-between mb-5">
      <h3 class="text-headline-sm font-sans font-bold text-text-heading">Registrar Nueva Call</h3>
      <button onclick="document.getElementById('callModal').classList.add('hidden')" class="p-1.5 rounded-lg text-text-muted hover:bg-surface-container transition-all"><span class="material-symbols-outlined text-[20px]">close</span></button>
    </div>
    <div class="flex flex-col gap-4">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-label-lg font-label font-bold text-text-heading mb-1.5 block">Fecha</label>
          <input type="date" id="callFecha" value="${today}" class="w-full h-10 px-3 rounded-lg border border-border-strong bg-surface-card text-body-md font-sans focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,120,212,0.15)]"/>
        </div>
        <div>
          <label class="text-label-lg font-label font-bold text-text-heading mb-1.5 block">Hora</label>
          <input type="time" id="callHora" value="${now}" class="w-full h-10 px-3 rounded-lg border border-border-strong bg-surface-card text-body-md font-sans focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,120,212,0.15)]"/>
        </div>
      </div>
      <div>
        <label class="text-label-lg font-label font-bold text-text-heading mb-1.5 block">Plataforma</label>
        <select id="callPlataforma" class="w-full h-10 px-3 rounded-lg border border-border-strong bg-surface-card text-body-md font-sans focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,120,212,0.15)]">
          <option>Teams</option><option>Zoom</option><option>Google Meet</option><option>Otra</option>
        </select>
      </div>
      <div>
        <label class="text-label-lg font-label font-bold text-text-heading mb-1.5 block">Participantes</label>
        <input type="text" id="callParticipantes" placeholder="ej: Carolina Herrera, Laura Méndez (VX)" class="w-full h-10 px-3 rounded-lg border border-border-strong bg-surface-card text-body-md font-sans focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,120,212,0.15)]"/>
      </div>
      <div>
        <label class="text-label-lg font-label font-bold text-text-heading mb-1.5 block">Link a grabación (opcional)</label>
        <input type="url" id="callLink" placeholder="https://teams.microsoft.com/..." class="w-full h-10 px-3 rounded-lg border border-border-strong bg-surface-card text-body-md font-sans focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,120,212,0.15)]"/>
      </div>
      <div>
        <label class="text-label-lg font-label font-bold text-text-heading mb-1.5 block">Notas / Resumen</label>
        <textarea id="callNotas" rows="4" placeholder="Resumen de lo hablado, acuerdos, próximos pasos..." class="w-full px-3 py-2 rounded-lg border border-border-strong bg-surface-card text-body-md font-sans focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,120,212,0.15)] resize-none"></textarea>
      </div>
      <div class="flex gap-3">
        <button onclick="saveCall(${clientId})" class="flex-1 py-2.5 rounded-lg bg-primary-container text-on-primary-container text-label-lg font-label font-bold hover:bg-primary transition-all">Guardar Call</button>
        <button onclick="document.getElementById('callModal').classList.add('hidden')" class="px-4 py-2.5 rounded-lg border border-border-strong text-text-heading text-label-lg font-label font-bold hover:bg-surface-container-low transition-all">Cancelar</button>
      </div>
    </div>
  `;
  modal.classList.remove('hidden');
}

function saveCall(clientId) {
  const c = VX.clients.find(x => x.id === clientId);
  if (!c) return;
  const call = {
    id: Date.now(),
    fecha: document.getElementById('callFecha').value,
    hora: document.getElementById('callHora').value,
    plataforma: document.getElementById('callPlataforma').value,
    participantes: document.getElementById('callParticipantes').value || 'Sin especificar',
    link: document.getElementById('callLink').value || null,
    notas: document.getElementById('callNotas').value || 'Sin notas.'
  };
  c.calls.unshift(call);
  document.getElementById('callModal').classList.add('hidden');
  renderClientDetail(clientId);
  showToast('Call registrada correctamente', 'success');
}

function openNewClientModal() {
  showToast('Editor de cliente disponible en la próxima versión', 'info');
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

function parseCVContent(text, filename) {
  let cleanFileName = filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").replace(/\b(cv|resume|curriculum|vitae)\b/gi, "").trim();
  cleanFileName = cleanFileName.replace(/\s+/g, " ");
  if (cleanFileName.length > 2) {
    cleanFileName = cleanFileName.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  } else {
    cleanFileName = "Candidato IT";
  }

  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : `${cleanFileName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`;

  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);
  const telefono = phoneMatch ? phoneMatch[0] : "";

  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  const linkedin = linkedinMatch ? linkedinMatch[0].replace(/^https?:\/\//, '') : `linkedin.com/in/${cleanFileName.toLowerCase().replace(/\s+/g, '-')}`;

  let nombre = cleanFileName;
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 2 && !l.includes("@") && !l.toLowerCase().includes("curriculum"));
  if (lines.length > 0 && lines[0].length < 40 && !/\d/.test(lines[0])) {
    nombre = lines[0];
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

  const countries = ['Argentina', 'Colombia', 'México', 'Chile', 'Uruguay', 'Perú'];
  let pais = "Argentina";
  for (const c of countries) {
    if (new RegExp(`\\b${c}\\b`, 'i').test(text)) {
      pais = c;
      break;
    }
  }

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

async function confirmCVAndAdd() {
  const nombre = document.getElementById('parsedNombre')?.value;
  const rol = document.getElementById('parsedRol')?.value;
  const email = document.getElementById('parsedEmail')?.value;
  const telefono = document.getElementById('parsedTelefono')?.value;
  const linkedin = document.getElementById('parsedLinkedin')?.value;
  const experiencia = parseFloat(document.getElementById('parsedExperiencia')?.value) || 1;
  const tarifa = parseInt(document.getElementById('parsedTarifa')?.value) || 40;
  const pais = document.getElementById('parsedPais')?.value;
  const ingles = document.getElementById('parsedIngles')?.value;
  const senioryVal = document.getElementById('parsedSeniority')?.value;
  const resumen = document.getElementById('parsedResumen')?.value;

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
    stack: skills.length > 0 ? skills : ['Sin especificar'],
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
    const { data, error } = await supabaseClient.from('talents').insert([newTalent]).select();
    if (error) {
      console.error('Error insertando talento en Supabase:', error);
      showToast('Error al guardar en Supabase DB', 'error');
    } else if (data && data.length > 0) {
      newTalent.id = data[0].id;
    }
  }

  if (!newTalent.id) newTalent.id = Date.now();

  VX.talents.unshift(newTalent);
  VX.filteredTalents = [...VX.talents];

  // Reset parser
  currentUploadedCVFile = null;
  document.getElementById('cvParsePanel').classList.add('hidden');
  document.getElementById('cvFileInfo').classList.add('hidden');
  document.getElementById('cvProgress').style.width = '0%';
  document.getElementById('cvProgressText').textContent = 'Iniciando análisis...';
  document.getElementById('dropZone').classList.remove('border-primary', 'bg-surface-container-low');

  showToast(`${nombre} guardado en Supabase y pool de talentos ✓`, 'success');
  setTimeout(() => navigate('talentos'), 1200);
}

// ---- PROPOSALS ----
function renderPropuestas() {
  const section = document.getElementById('section-propuestas');
  if (!section) return;

  const selected = VX.talents.filter(t => VX.selectedTalents.has(t.id));

  const content = section.querySelector('.proposals-content');
  if (!content) return;

  if (selected.length === 0) {
    content.innerHTML = `
      <div class="flex flex-col items-center justify-center py-24 text-center">
        <span class="material-symbols-outlined text-[80px] text-text-muted/30 mb-4">co_present</span>
        <h3 class="text-headline-lg font-sans font-bold text-text-heading mb-2">Sin talentos seleccionados</h3>
        <p class="text-body-md font-sans text-text-muted mb-5 max-w-sm">Andá a "Talentos & Match" y seleccioná los perfiles que querés incluir en la propuesta.</p>
        <button onclick="navigate('talentos')" class="px-5 py-2.5 rounded-lg bg-primary-container text-on-primary-container text-label-lg font-label font-bold hover:bg-primary transition-all flex items-center gap-2">
          <span class="material-symbols-outlined text-[18px]">group</span>Ir al Directorio
        </button>
      </div>`;
    return;
  }

  content.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Config panel -->
      <div class="lg:col-span-4 flex flex-col gap-4">
        <div class="bg-surface-card rounded-xl p-5 shadow-sm border border-border-subtle">
          <h3 class="text-headline-sm font-sans font-bold text-text-heading mb-4">Configurar Propuesta</h3>
          <div class="flex flex-col gap-4">
            <div>
              <label class="text-label-lg font-label font-bold text-text-heading mb-1.5 block">Cliente destino</label>
              <select id="propClienteId" class="w-full h-10 px-3 rounded-lg border border-border-strong bg-surface-card text-body-md font-sans focus:outline-none focus:border-primary">
                ${VX.clients.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('')}
                <option value="0">Otro / Por definir</option>
              </select>
            </div>
            <div>
              <label class="text-label-lg font-label font-bold text-text-heading mb-1.5 block">Título de la propuesta</label>
              <input type="text" id="propTitulo" value="Propuesta de Perfiles IT — Virtual Xpert" class="w-full h-10 px-3 rounded-lg border border-border-strong bg-surface-card text-body-md font-sans focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,120,212,0.15)]"/>
            </div>
            <div>
              <label class="text-label-lg font-label font-bold text-text-heading mb-1.5 block">Modo de exportación</label>
              <div class="flex flex-col gap-2">
                <label class="flex items-center gap-3 p-3 rounded-xl border border-border-subtle cursor-pointer hover:bg-surface-container-low transition-all">
                  <input type="radio" name="propMode" value="completo" checked class="accent-primary"/> 
                  <div><div class="text-label-lg font-label font-bold text-text-heading">Con nombre y foto</div><div class="text-body-sm font-sans text-text-muted">Propuesta completa con datos del perfil</div></div>
                </label>
                <label class="flex items-center gap-3 p-3 rounded-xl border border-border-subtle cursor-pointer hover:bg-surface-container-low transition-all">
                  <input type="radio" name="propMode" value="anonimo" class="accent-primary"/>
                  <div><div class="text-label-lg font-label font-bold text-text-heading">Anónimo (White Label)</div><div class="text-body-sm font-sans text-text-muted">Perfil sin nombre, solo skills y experiencia</div></div>
                </label>
              </div>
            </div>
            <div class="flex flex-col gap-2">
              <button onclick="exportPDF()" class="w-full py-2.5 rounded-lg bg-primary-container text-on-primary-container text-label-lg font-label font-bold hover:bg-primary transition-all flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-[18px]">picture_as_pdf</span>Exportar PDF
              </button>
              <button onclick="copyProposalLink()" class="w-full py-2.5 rounded-lg border border-border-strong text-text-heading text-label-lg font-label font-bold hover:bg-surface-container-low transition-all flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-primary">link</span>Copiar Enlace
              </button>
            </div>
          </div>
        </div>

        <!-- Selected list -->
        <div class="bg-surface-card rounded-xl p-5 shadow-sm border border-border-subtle">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-label-lg font-label font-bold text-text-heading">Perfiles (${selected.length})</h4>
            <button onclick="VX.selectedTalents.clear(); renderPropuestas();" class="text-label-sm font-label text-error hover:underline">Limpiar todo</button>
          </div>
          <div class="flex flex-col gap-2">
            ${selected.map(t => `
              <div class="flex items-center gap-2 p-2 rounded-lg bg-surface-canvas border border-border-subtle">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-container to-primary flex items-center justify-center text-on-primary-container font-sans font-bold text-[12px] shrink-0">${getInitials(t.nombre)}</div>
                <div class="flex-1 min-w-0"><div class="text-label-md font-label font-bold text-text-heading truncate">${t.nombre}</div><div class="text-body-sm font-sans text-text-muted">${t.rol}</div></div>
                <button onclick="VX.selectedTalents.delete(${t.id}); renderPropuestas(); renderTalentGrid();" class="text-text-muted hover:text-error"><span class="material-symbols-outlined text-[16px]">close</span></button>
              </div>`).join('')}
          </div>
        </div>
      </div>

      <!-- Preview -->
      <div class="lg:col-span-8">
        <div id="proposalPreview" class="bg-surface-card rounded-xl shadow-sm border border-border-subtle overflow-hidden">
          <!-- Header preview -->
          <div class="bg-gradient-to-r from-legacy-brand-navy to-primary p-6 text-on-primary">
            <div class="flex items-center gap-3 mb-2">
              <span class="material-symbols-outlined text-tertiary-fixed text-[24px]">hub</span>
              <span class="text-label-lg font-label font-bold uppercase tracking-wider opacity-80">Virtual Xpert · Talent Hub</span>
            </div>
            <h2 id="previewTitulo" class="text-headline-lg font-sans font-bold">Propuesta de Perfiles IT — Virtual Xpert</h2>
            <p class="text-body-md font-sans opacity-70 mt-1">Fecha: ${new Date().toLocaleDateString('es-AR', { day:'2-digit', month:'long', year:'numeric' })}</p>
          </div>
          <!-- Profiles -->
          <div class="p-6 flex flex-col gap-5">
            ${selected.map((t, i) => {
              const anon = false; // will be controlled by radio
              const status = getStatusBadge(t.disponibilidad);
              return `
              <div class="border border-border-subtle rounded-xl overflow-hidden">
                <div class="p-5">
                  <div class="flex items-start gap-4 mb-4">
                    <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-container to-primary flex items-center justify-center text-on-primary-container font-sans font-bold text-xl shrink-0">${getInitials(t.nombre)}</div>
                    <div class="flex-1">
                      <div class="flex items-start justify-between gap-2">
                        <div>
                          <h3 class="text-headline-sm font-sans font-bold text-text-heading">${t.nombre}</h3>
                          <p class="text-body-md font-sans text-text-muted">${t.rol} · ${t.seniority} · ${t.pais} (${t.zona})</p>
                        </div>
                        <span class="px-2.5 py-1 rounded-full bg-[#D1FAE5] text-[#065F46] text-label-sm font-label font-bold whitespace-nowrap">${t.match}% Match</span>
                      </div>
                    </div>
                  </div>
                  <p class="text-body-md font-sans text-text-body leading-relaxed mb-4">${t.resumen}</p>
                  <div class="grid grid-cols-3 gap-3 mb-4">
                    <div class="bg-surface-canvas rounded-xl p-3 text-center border border-border-subtle"><div class="text-label-lg font-label font-bold text-primary">$${t.tarifa}/h</div><div class="text-body-sm font-sans text-text-muted">Tarifa</div></div>
                    <div class="bg-surface-nasa rounded-xl p-3 text-center border border-border-subtle"><div class="text-label-lg font-label font-bold text-text-heading">${t.experiencia}a</div><div class="text-body-sm font-sans text-text-muted">Experiencia</div></div>
                    <div class="bg-surface-nasa rounded-xl p-3 text-center border border-border-subtle"><div class="text-label-lg font-label font-bold text-text-heading">${t.ingles}</div><div class="text-body-sm font-sans text-text-muted">Inglés</div></div>
                  </div>
                  <div class="flex flex-wrap gap-1.5">
                    ${t.stack.map(s => `<span class="px-2.5 py-1 rounded-full bg-surface-container text-text-body text-label-md font-label font-semibold">${s}</span>`).join('')}
                  </div>
                </div>
              </div>`;
            }).join('')}
            <div class="mt-2 p-4 rounded-xl bg-surface-container-low border border-border-subtle text-center">
              <p class="text-body-sm font-sans text-text-muted">© ${new Date().getFullYear()} Virtual Xpert · <a href="https://virtual-xpert.net" class="text-primary hover:underline">virtual-xpert.net</a> · Documento confidencial</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Sync title input
  document.getElementById('propTitulo')?.addEventListener('input', (e) => {
    const el = document.getElementById('previewTitulo');
    if (el) el.textContent = e.target.value;
  });
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
              <div class="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-canvas transition-all">
                <span class="text-label-sm font-label font-bold text-text-muted w-4 text-center">${i+1}</span>
                <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-container to-primary flex items-center justify-center text-on-primary-container font-sans font-bold text-[11px] shrink-0">${getInitials(t.nombre)}</div>
                <div class="flex-1 min-w-0">
                  <div class="text-label-md font-label font-bold text-text-heading truncate">${t.nombre}</div>
                  <div class="text-body-sm font-sans text-text-muted truncate">${t.rol}</div>
                </div>
                <span class="text-label-lg font-label font-bold text-primary shrink-0">${t.match}%</span>
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
let currentUploadedCVFile = null;

async function fetchFromSupabase() {
  if (!supabaseClient) return;
  try {
    const { data: talentsData, error: tErr } = await supabaseClient.from('talents').select('*').order('id', { ascending: false });
    if (!tErr && talentsData && talentsData.length > 0) {
      VX.talents = talentsData.map(t => ({
        ...t,
        stack: Array.isArray(t.stack) ? t.stack : [],
        certificaciones: Array.isArray(t.certificaciones) ? t.certificaciones : [],
        proyectos: Array.isArray(t.proyectos) ? t.proyectos : []
      }));
      VX.filteredTalents = [...VX.talents];
      if (VX.currentSection === 'talentos') renderTalentos();
    }

    const { data: clientsData, error: cErr } = await supabaseClient.from('clients').select('*').order('id', { ascending: true });
    if (!cErr && clientsData && clientsData.length > 0) {
      VX.clients = clientsData.map(c => ({
        ...c,
        talentoAsignado: Array.isArray(c.talentoAsignado) ? c.talentoAsignado : [],
        calls: Array.isArray(c.calls) ? c.calls : [],
        stakeholder: c.stakeholder || { nombre: c.contacto_principal || 'Contacto', cargo: 'Lead', email: c.email || '', telefono: c.telefono || '' }
      }));
      if (!VX.activeclientId && VX.clients.length > 0) VX.activeclientId = VX.clients[0].id;
      if (VX.currentSection === 'clientes') renderClientes();
    }
  } catch (err) {
    console.error('Error sincronizando con Supabase:', err);
  }
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

  VX.clients = VX.clients.filter(c => c.id !== id);
  VX.activeclientId = VX.clients[0]?.id || null;
  showToast('Cliente eliminado correctamente de Supabase', 'success');
  renderClientes();
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
  fetchFromSupabase();
});
