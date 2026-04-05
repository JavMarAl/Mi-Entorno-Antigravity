import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, FlaskConical, GitBranch, Monitor, Package, FileCheck, BarChart3, Search, Bell, ClipboardCheck, Link2, HeartPulse } from 'lucide-react';
import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import FormularioQC from './pages/FormularioQC';
import DetalleLote from './pages/DetalleLote';
import Workflow from './pages/Workflow';
import MonitorPage from './pages/Monitor';
import Inventario from './pages/Inventario';
import FirmaElectronica from './pages/FirmaElectronica';
import Analiticas from './pages/Analiticas';
import QCRelease from './pages/QCRelease';
import CadenaIdentidad from './pages/CadenaIdentidad';
import MonitorPostInfusion from './pages/MonitorPostInfusion';
import AIChatDialog from './components/AIChatDialog';

const API = 'http://localhost:3001/api';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/formulario', icon: FlaskConical, label: 'Formulario QC' },
  { to: '/workflow', icon: GitBranch, label: 'Workflow' },
  { to: '/monitor', icon: Monitor, label: 'Monitor' },
  { to: '/inventario', icon: Package, label: 'Inventario' },
  { to: '/firmas', icon: FileCheck, label: 'Firmas' },
  { to: '/analiticas', icon: BarChart3, label: 'Analíticas' },
  { to: '/qc-release', icon: ClipboardCheck, label: 'QC Release' },
  { to: '/coi', icon: Link2, label: 'Cadena Identidad' },
  { to: '/post-infusion', icon: HeartPulse, label: 'Post-Infusión' },
];

const pageTitles = {
  '/': 'Dashboard CAR-T',
  '/formulario': 'Formulario QC',
  '/workflow': 'Workflow CAR-T',
  '/monitor': 'Monitor de Sistema',
  '/inventario': 'Inventario de Reactivos',
  '/firmas': 'Firma Electrónica',
  '/analiticas': 'Analíticas QC',
  '/qc-release': 'QC Release Panel',
  '/coi': 'Cadena de Identidad y Custodia',
  '/post-infusion': 'Monitor Post-Infusión',
};

// Mapa de rutas → contexto del asistente ARIA
const routeToContext = {
  '/': 'dashboard',
  '/formulario': 'formulario-qc',
  '/workflow': 'workflow',
  '/monitor': 'monitor',
  '/inventario': 'inventario',
  '/firmas': 'firmas',
  '/analiticas': 'analiticas',
  '/qc-release': 'qc-release',
  '/coi': 'cadena-identidad',
  '/post-infusion': 'post-infusion',
};

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">CT</div>
      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} title={label}>
            <Icon size={20} />
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

function TopBar({ alertCount }) {
  const location = useLocation();
  const basePath = '/' + location.pathname.split('/')[1];
  const title = pageTitles[basePath] || pageTitles[location.pathname] || 'CAR-T Lab';

  return (
    <header className="topbar">
      <h1 className="topbar-title">{title}</h1>
      <div className="search-wrapper">
        <Search size={14} />
        <input className="topbar-search" placeholder="Buscar lotes, pacientes..." />
      </div>
      <div className="topbar-badge">
        <Bell size={20} />
        {alertCount > 0 && <span className="badge-count">{alertCount}</span>}
      </div>
    </header>
  );
}

function AppInner({ alertCount }) {
  const location = useLocation();
  const basePath = '/' + location.pathname.split('/')[1];
  const pageContext = routeToContext[basePath] || 'general';

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <TopBar alertCount={alertCount} />
        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/formulario" element={<FormularioQC />} />
            <Route path="/lote/:id" element={<DetalleLote />} />
            <Route path="/workflow" element={<Workflow />} />
            <Route path="/monitor" element={<MonitorPage />} />
            <Route path="/inventario" element={<Inventario />} />
            <Route path="/firmas" element={<FirmaElectronica />} />
            <Route path="/analiticas" element={<Analiticas />} />
            <Route path="/qc-release" element={<QCRelease />} />
            <Route path="/coi" element={<CadenaIdentidad />} />
            <Route path="/post-infusion" element={<MonitorPostInfusion />} />
          </Routes>
        </main>
      </div>
      {/* Asistente ARIA — disponible en todas las pantallas */}
      <AIChatDialog pageContext={pageContext} />
    </div>
  );
}

function App() {
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    fetch(`${API}/dashboard`)
      .then(r => r.json())
      .then(d => setAlertCount(d.stats?.alertasActivas || 0))
      .catch(() => { });
  }, []);

  return (
    <BrowserRouter>
      <AppInner alertCount={alertCount} />
    </BrowserRouter>
  );
}

export default App;
