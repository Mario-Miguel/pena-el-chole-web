import { Toaster } from "@/components/ui/toaster";
import { initAppConfig } from "./lib/appConfig";
initAppConfig();
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import PageNotFound from './lib/PageNotFound';

import Layout from './Layout';
import { prefetchAllPages, setupHoverPrefetch } from './lib/pagePrefetch';
import PageTransition from './components/layout/PageTransition';

// Eager load pages needed on first paint
import Inicio from './pages/Inicio';
import Acceso from './pages/Acceso';

// Lazy load the rest
const Admin = lazy(() => import('./pages/Admin'));
const Integrantes = lazy(() => import('./pages/Integrantes'));
const Calendario = lazy(() => import('./pages/Calendario'));
const Memoria = lazy(() => import('./pages/Memoria'));
const Cuentas = lazy(() => import('./pages/Cuentas'));
const Cerveza = lazy(() => import('./pages/Cerveza'));
const ToDo = lazy(() => import('./pages/ToDo'));
const Obra = lazy(() => import('./pages/Obra'));
const Almacen = lazy(() => import('./pages/Almacen'));
const Concurso = lazy(() => import('./pages/Concurso'));
const Resultados = lazy(() => import('./pages/Resultados'));
const Trofeos = lazy(() => import('./pages/Trofeos'));
const Desfile = lazy(() => import('./pages/Desfile'));
const Sugerencias = lazy(() => import('./pages/Sugerencias'));
const Votaciones = lazy(() => import('./pages/Votaciones'));
const Comunidad = lazy(() => import('./pages/Comunidad'));
const NotasPersonales = lazy(() => import('./pages/NotasPersonales'));
const Notificaciones = lazy(() => import('./pages/Notificaciones'));
const Chat = lazy(() => import('./pages/Chat'));
const Ajustes = lazy(() => import('./pages/Ajustes'));
const Perfil = lazy(() => import('./pages/Perfil'));
const PanelCargos = lazy(() => import('./pages/PanelCargos'));
const Ayuda = lazy(() => import('./pages/Ayuda'));
const Presupuesto = lazy(() => import('./pages/Presupuesto'));
const Cuotas = lazy(() => import('./pages/Cuotas'));
const Vehiculos = lazy(() => import('./pages/Vehiculos'));
const Enlaces = lazy(() => import('./pages/Enlaces'));
const GruposTrabajo = lazy(() => import('./pages/GruposTrabajo'));
const Organizacion = lazy(() => import('./pages/Organizacion'));
const TareasReunion = lazy(() => import('./pages/TareasReunion'));
const LibroCaja = lazy(() => import('./pages/LibroCaja'));
const GestionDocumental = lazy(() => import('./pages/GestionDocumental'));
const ActasReunion = lazy(() => import('./pages/ActasReunion'));
const Finanzas = lazy(() => import('./pages/Finanzas'));
const Secretaria = lazy(() => import('./pages/Secretaria'));
const Herramientas = lazy(() => import('./pages/Herramientas'));
const Actividades = lazy(() => import('./pages/Actividades'));
const Seguridad = lazy(() => import('./pages/Seguridad'));
const GestionCargos = lazy(() => import('./pages/GestionCargos'));
const Tesoreria = lazy(() => import('./pages/Tesoreria'));
const Loteria = lazy(() => import('./pages/Loteria'));
const Tickets = lazy(() => import('./pages/Tickets'));
const DatosPena = lazy(() => import('./pages/DatosPena'));
const Contabilidad = lazy(() => import('./pages/Contabilidad'));
const TourGuia = lazy(() => import('./pages/TourGuia'));
const Logros = lazy(() => import('./pages/Logros'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
    <div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const LayoutWrapper = ({ children, currentPageName }) => (
  <Layout currentPageName={currentPageName}>
    <PageTransition>{children}</PageTransition>
  </Layout>
);

const AppRoutes = () => {
  // Prefetch all lazy page chunks after initial load + hover/touch prefetch on nav links
  useEffect(() => {
    const timer = setTimeout(prefetchAllPages, 2000);
    const cleanupHover = setupHoverPrefetch();
    return () => {
      clearTimeout(timer);
      cleanupHover();
    };
  }, []);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Navigate to="/Inicio" replace />} />
        <Route path="/Acceso" element={<LayoutWrapper currentPageName="Acceso"><Acceso /></LayoutWrapper>} />
        <Route path="/Inicio" element={<LayoutWrapper currentPageName="Inicio"><Inicio /></LayoutWrapper>} />
        <Route path="/Admin" element={<LayoutWrapper currentPageName="Admin"><Admin /></LayoutWrapper>} />
        <Route path="/Integrantes" element={<LayoutWrapper currentPageName="Integrantes"><Integrantes /></LayoutWrapper>} />
        <Route path="/Calendario" element={<LayoutWrapper currentPageName="Calendario"><Calendario /></LayoutWrapper>} />
        <Route path="/Memoria" element={<LayoutWrapper currentPageName="Memoria"><Memoria /></LayoutWrapper>} />
        <Route path="/Cuentas" element={<Navigate to="/Almacen" replace />} />
        <Route path="/Cerveza" element={<LayoutWrapper currentPageName="Cerveza"><Cerveza /></LayoutWrapper>} />

        <Route path="/Obra" element={<Navigate to="/Desfile" replace />} />
        <Route path="/Almacen" element={<LayoutWrapper currentPageName="Almacen"><Almacen /></LayoutWrapper>} />
        <Route path="/Concurso" element={<Navigate to="/Desfile" replace />} />
        <Route path="/Resultados" element={<Navigate to="/Desfile" replace />} />
        <Route path="/Trofeos" element={<Navigate to="/Desfile" replace />} />
        <Route path="/Desfile" element={<LayoutWrapper currentPageName="Desfile"><Desfile /></LayoutWrapper>} />
        <Route path="/Sugerencias" element={<Navigate to="/Comunidad" replace />} />
        <Route path="/NotasPersonales" element={<LayoutWrapper currentPageName="NotasPersonales"><NotasPersonales /></LayoutWrapper>} />
        <Route path="/Notificaciones" element={<LayoutWrapper currentPageName="Notificaciones"><Notificaciones /></LayoutWrapper>} />
        <Route path="/Chat" element={<LayoutWrapper currentPageName="Chat"><Chat /></LayoutWrapper>} />
        <Route path="/Votaciones" element={<Navigate to="/Comunidad" replace />} />
        <Route path="/Comunidad" element={<LayoutWrapper currentPageName="Comunidad"><Comunidad /></LayoutWrapper>} />
        <Route path="/Ajustes" element={<LayoutWrapper currentPageName="Ajustes"><Ajustes /></LayoutWrapper>} />
        <Route path="/Perfil" element={<LayoutWrapper currentPageName="Perfil"><Perfil /></LayoutWrapper>} />
        <Route path="/PanelCargos" element={<Navigate to="/GestionCargos" replace />} />
        <Route path="/GestionCargos" element={<LayoutWrapper currentPageName="GestionCargos"><GestionCargos /></LayoutWrapper>} />
        <Route path="/Ayuda" element={<LayoutWrapper currentPageName="Ayuda"><Ayuda /></LayoutWrapper>} />

        <Route path="/Vehiculos" element={<LayoutWrapper currentPageName="Vehiculos"><Vehiculos /></LayoutWrapper>} />
        <Route path="/Enlaces" element={<LayoutWrapper currentPageName="Enlaces"><Enlaces /></LayoutWrapper>} />
        <Route path="/GruposTrabajo" element={<Navigate to="/Organizacion" replace />} />
        <Route path="/ToDo" element={<Navigate to="/Organizacion" replace />} />
        <Route path="/Organizacion" element={<LayoutWrapper currentPageName="Organizacion"><Organizacion /></LayoutWrapper>} />
        <Route path="/TareasReunion" element={<Navigate to="/Organizacion" replace />} />

        <Route path="/GestionDocumental" element={<Navigate to="/Secretaria" replace />} />
        <Route path="/ActasReunion" element={<Navigate to="/Secretaria" replace />} />
        <Route path="/LibroCaja" element={<Navigate to="/Finanzas" replace />} />
        <Route path="/Cuotas" element={<Navigate to="/Finanzas" replace />} />
        <Route path="/Presupuesto" element={<Navigate to="/Finanzas" replace />} />
        <Route path="/Finanzas" element={<LayoutWrapper currentPageName="Finanzas"><Finanzas /></LayoutWrapper>} />
        <Route path="/Secretaria" element={<Navigate to="/GestionCargos" replace />} />
        <Route path="/Herramientas" element={<LayoutWrapper currentPageName="Herramientas"><Herramientas /></LayoutWrapper>} />
        <Route path="/Actividades" element={<LayoutWrapper currentPageName="Actividades"><Actividades /></LayoutWrapper>} />
        <Route path="/Seguridad" element={<LayoutWrapper currentPageName="Seguridad"><Seguridad /></LayoutWrapper>} />
        <Route path="/Tesoreria" element={<LayoutWrapper currentPageName="Tesoreria"><Tesoreria /></LayoutWrapper>} />
        <Route path="/Loteria" element={<LayoutWrapper currentPageName="Loteria"><Loteria /></LayoutWrapper>} />
        <Route path="/Tickets" element={<LayoutWrapper currentPageName="Tickets"><Tickets /></LayoutWrapper>} />
        <Route path="/DatosPena" element={<LayoutWrapper currentPageName="DatosPena"><DatosPena /></LayoutWrapper>} />
        <Route path="/Contabilidad" element={<LayoutWrapper currentPageName="Contabilidad"><Contabilidad /></LayoutWrapper>} />
        <Route path="/TourGuia" element={<LayoutWrapper currentPageName="TourGuia"><TourGuia /></LayoutWrapper>} />
        <Route path="/Logros" element={<LayoutWrapper currentPageName="Logros"><Logros /></LayoutWrapper>} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppRoutes />
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;