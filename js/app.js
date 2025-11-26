// Punto de entrada principal de la aplicación
import { CONFIG, APP_STATE } from './config.js';
import { AuthManager, AuthEventHandlers } from './modules/auth.js';
import { EventsManager, EventsRenderer } from './modules/events.js';
import { SearchEventHandlers, FilterUtils, ProvinceManager } from './modules/search.js';
import { ModalEventHandlers, GraphsManager, ModalManager } from './modules/modals.js';
import { ServicesInitializer } from './modules/analytics.js';
import { AlertManager } from './modules/ui.js';
import { URLUtils } from './modules/utils.js';
import { ShareUtils } from './modules/ui.js';

/**
 * Clase principal de la aplicación
 */
class ComicCalendarApp {
    constructor() {
        this.isInitialized = false;
    }

    /**
     * Inicializar la aplicación
     */
    async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('Inicializando Comic Calendar App...');

            // Cargar modales esenciales
            await this.loadEssentialModals();

            // Inicializar servicios de terceros
            ServicesInitializer.initializeAll();

            // Configurar event listeners
            this.setupEventListeners();

            // Verificar autenticación
            await AuthManager.checkAuthentication();

            // Cargar eventos iniciales
            await EventsManager.loadEvents();

            // Comprobar si hay un ID de evento en la URL
            await this.handleURLEventId();

            this.isInitialized = true;
            console.log('Comic Calendar App inicializada correctamente');

        } catch (error) {
            console.error('Error inicializando la aplicación:', error);
            AlertManager.error('Error al inicializar la aplicación');
        }
    }

    /**
     * Cargar modales esenciales
     */
    async loadEssentialModals() {
        const { ModalManager } = await import('./modules/modals.js');

        // Lista de todos los modales que se cargan al inicio
        const modalsToLoad = [
            'login',
            'event-details',
            'edit-event',
            'upload-event',
            'delete-confirm',
            'contact',
            'telegram-bot',
            'cookies-policy',
            'graphs'
        ];

        for (const modalName of modalsToLoad) {
            try {
                await ModalManager.injectModal(modalName);
                console.log(`✅ Modal ${modalName} cargado correctamente`);
            } catch (error) {
                console.warn(`⚠️ No se pudo cargar el modal ${modalName}:`, error);
            }
        }
    }

    /**
     * Configurar todos los event listeners
     */
    setupEventListeners() {
        // Autenticación
        AuthEventHandlers.setupAuthEventListeners();

        // Búsqueda
        SearchEventHandlers.setupSearchEventListeners();

        // Modales
        ModalEventHandlers.setupModalEventListeners();

        // Filtros de provincias
        FilterUtils.setupProvinceListeners();

        // Gráficas
        GraphsManager.setupGraphsListeners();

        // Navegación y UI general
        this.setupNavigationListeners();

        // Funciones globales para compatibilidad con HTML inline (solo las necesarias para contenido dinámico)
        this.exposeGlobalFunctions();
    }

    /**
     * Configurar listeners de navegación
     */
    setupNavigationListeners() {
        // Logo y enlace de inicio
        const reloadElements = ['navbar-logo', 'nav-home'];
        reloadElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.location.reload();
                });
            }
        });

        // Enlace de logout
        const logoutLink = document.getElementById('logout-link');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                AuthEventHandlers.handleLogout();
            });
        }
    }

    /**
     * Manejar ID de evento en la URL
     */
    async handleURLEventId() {
        const eventId = URLUtils.getQueryParam('id');
        if (eventId) {
            try {
                const event = await EventsManager.loadEventById(eventId);
                if (event) {
                    EventsRenderer.showEventDetails(event);
                }
            } catch (error) {
                console.error('Error loading event from URL:', error);
                EventsRenderer.showInvalidEventMessage();
            }
        }
    }

    /**
     * Exponer funciones globalmente para compatibilidad con HTML inline
     * NOTA: Se mantienen solo las necesarias para contenido generado dinámicamente (modales, tarjetas)
     */
    exposeGlobalFunctions() {
        // Funciones principales (usadas por search.js o para debugging)
        window.loadEvents = () => EventsManager.loadEvents();

        // Funciones de eventos (usadas en botones de tarjetas generadas dinámicamente)
        window.editEvent = (eventId) => ModalEventHandlers.handleEditEvent(eventId);
        window.updateEvent = (event) => ModalEventHandlers.handleUpdateEvent(event);
        window.uploadEvent = (event) => ModalEventHandlers.handleUploadEvent(event);
        window.confirmDeleteEvent = (eventId) => ModalEventHandlers.handleConfirmDeleteEvent(eventId);
        window.deleteEvent = () => ModalEventHandlers.handleDeleteEvent();

        // Funciones de autenticación
        window.login = (event) => AuthEventHandlers.handleLogin(event);
        // window.logout eliminado, ahora se maneja con event listener

        // Funciones de utilidad (usadas en tarjetas)
        window.shareEvent = (event) => ShareUtils.shareEvent(event);
        window.getDirections = (event) => ShareUtils.getDirections(event);

        // Funciones de gráficas
        window.loadGraph = (type) => GraphsManager.loadGraph(type);

        // Función para obtener evento por ID (utility)
        window.fetchEventById = (eventId) => EventsManager.loadEventById(eventId);

        // Función de limpieza de modales (utility)
        window.cleanupModals = () => ModalManager.cleanupModalState();

        // Estado de la aplicación accesible globalmente para debugging
        window.APP_STATE = APP_STATE;
        window.CONFIG = CONFIG;

        // Exponer gestores para auth.js y otros módulos que puedan necesitarlos
        if (!window.ComicCalendarApp) window.ComicCalendarApp = {};
        window.ComicCalendarApp.ProvinceManager = ProvinceManager;
        window.ComicCalendarApp.EventsManager = EventsManager;
    }

    /**
     * Método para recargar la aplicación (útil para desarrollo)
     */
    reload() {
        window.location.reload();
    }

    /**
     * Método para obtener información de estado
     */
    getAppInfo() {
        return {
            initialized: this.isInitialized,
            authenticated: AuthManager.isAuthenticated(),
            totalEvents: APP_STATE.totalEvents,
            isSearching: APP_STATE.isSearching,
            offset: APP_STATE.offset
        };
    }
}

/**
 * Función de inicialización cuando el DOM está listo
 */
function initializeApp() {
    // Prevenir múltiples inicializaciones
    if (window.ComicCalendarApp && window.ComicCalendarApp.isInitialized) {
        console.log('⚠️ App ya inicializada, saltando inicialización duplicada');
        return;
    }

    const app = new ComicCalendarApp();

    // Exponer instancia de la app globalmente para debugging
    window.ComicCalendarApp = app;

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => app.initialize());
    } else {
        app.initialize();
    }
}

// Inicializar la aplicación solo si no se ha hecho antes
if (!window.ComicCalendarApp) {
    initializeApp();
}

// Exportar para uso en otros módulos si es necesario
export default ComicCalendarApp;