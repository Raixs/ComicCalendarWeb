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

        // Funciones globales para compatibilidad con HTML inline
        this.exposeGlobalFunctions();
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
     */
    exposeGlobalFunctions() {
        // Funciones principales
        window.loadEvents = () => EventsManager.loadEvents();
        window.loadMoreEvents = () => EventsManager.loadMoreEvents();
        window.searchEvents = (event) => SearchEventHandlers.handleSearchEvents(event);
        
        // Funciones de eventos
        window.editEvent = (eventId) => ModalEventHandlers.handleEditEvent(eventId);
        window.updateEvent = (event) => ModalEventHandlers.handleUpdateEvent(event);
        window.uploadEvent = (event) => ModalEventHandlers.handleUploadEvent(event);
        window.confirmDeleteEvent = (eventId) => ModalEventHandlers.handleConfirmDeleteEvent(eventId);
        window.deleteEvent = () => ModalEventHandlers.handleDeleteEvent();
        
        // Funciones de autenticación
        window.login = (event) => AuthEventHandlers.handleLogin(event);
        window.logout = () => AuthEventHandlers.handleLogout();
        
        // Funciones de utilidad
        window.shareEvent = (event) => ShareUtils.shareEvent(event);
        window.getDirections = (event) => ShareUtils.getDirections(event);
        window.toggleAdvancedSearch = () => SearchEventHandlers.handleToggleAdvancedSearch();
        
        // Funciones de gráficas
        window.loadGraph = (type) => GraphsManager.loadGraph(type);

        // Función para obtener evento por ID (utility)
        window.fetchEventById = (eventId) => EventsManager.loadEventById(eventId);

        // Función de limpieza de modales (utility)
        window.cleanupModals = () => ModalManager.cleanupModalState();

        // Estado de la aplicación accesible globalmente para debugging
        window.APP_STATE = APP_STATE;
        window.CONFIG = CONFIG;
        
        // Exponer gestores para provincias.js y auth.js
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