/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Acceso from './pages/Acceso';
import Admin from './pages/Admin';
import Ajustes from './pages/Ajustes';
import Almacen from './pages/Almacen';
import Calendario from './pages/Calendario';
import Cerveza from './pages/Cerveza';
import Chat from './pages/Chat';
import Concurso from './pages/Concurso';
import Cuentas from './pages/Cuentas';
import Inicio from './pages/Inicio';
import Integrantes from './pages/Integrantes';
import Memoria from './pages/Memoria';
import NotasPersonales from './pages/NotasPersonales';
import Notificaciones from './pages/Notificaciones';
import Obra from './pages/Obra';
import Perfil from './pages/Perfil';
import Resultados from './pages/Resultados';
import Sugerencias from './pages/Sugerencias';
import ToDo from './pages/ToDo';
import Votaciones from './pages/Votaciones';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Acceso": Acceso,
    "Admin": Admin,
    "Ajustes": Ajustes,
    "Almacen": Almacen,
    "Calendario": Calendario,
    "Cerveza": Cerveza,
    "Chat": Chat,
    "Concurso": Concurso,
    "Cuentas": Cuentas,
    "Inicio": Inicio,
    "Integrantes": Integrantes,
    "Memoria": Memoria,
    "NotasPersonales": NotasPersonales,
    "Notificaciones": Notificaciones,
    "Obra": Obra,
    "Perfil": Perfil,
    "Resultados": Resultados,
    "Sugerencias": Sugerencias,
    "ToDo": ToDo,
    "Votaciones": Votaciones,
}

export const pagesConfig = {
    mainPage: "Inicio",
    Pages: PAGES,
    Layout: __Layout,
};