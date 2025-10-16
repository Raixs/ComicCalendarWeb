// Configuración global de la aplicación
export const CONFIG = {
    // API Configuration
    API_URL: 'https://api.comicplan.com/v1',
    GRAPHS_BASE_URL: 'https://api.comicplan.com',
    
    // Paginación
    EVENTS_LIMIT: 21,
    
    // Timeouts y delays
    ALERT_TIMEOUT: {
        SUCCESS: 3000,
        INFO: 5000,
        WARNING: 7000,
        DANGER: 10000
    },
    
    // Google Analytics
    GA_TRACKING_ID: 'G-WX8H3NJBFL',
    
    // URLs externas
    EXTERNAL_URLS: {
        GITHUB: 'https://github.com/malambra/comicCalendar',
        INSTAGRAM: 'https://www.instagram.com/comicplan',
        BLOG: 'https://blog.comicplan.com/',
        TELEGRAM_BOT: 'https://t.me/eventoscomic_bot',
        CONTACT_EMAIL: 'contacto@comicplan.com',
        GITHUB_REPO: 'https://github.com/Raixs/ComicCalendarWeb'
    },
    
    // Configuración de modales
    MODAL_IDS: {
        LOGIN: 'loginModal',
        EVENT_DETAILS: 'eventDetailsModal',
        EDIT_EVENT: 'editEventModal',
        DELETE_EVENT: 'deleteEventModal',
        UPLOAD_EVENT: 'uploadEventModal',
        CONTACT: 'contactModal',
        TELEGRAM_BOT: 'telegramBotModal',
        COOKIES_POLICY: 'cookieModal',
        GRAPHS: 'graficasModal',
        COOKIE_CONSENT: 'cookieconsent3'
    },
    
    // Selectores DOM frecuentes
    SELECTORS: {
        EVENTS_CONTAINER: '#events',
        LOADING_INDICATOR: '#loading-indicator',
        ALERT_PLACEHOLDER: '#alert-placeholder',
        PAGINATION_INFO: '#pagination-info',
        LOAD_MORE_BUTTON: '#load-more',
        LAST_UPDATED: '#last-updated'
    },
    
    // Clases CSS
    CSS_CLASSES: {
        HIDDEN: 'd-none',
        CARD: 'card h-100 event-card',
        ALERT_BASE: 'alert alert-dismissible fade show'
    },
    
    // Configuración de fechas
    DATE_CONFIG: {
        LOCALE: 'es-ES',
        TIMEZONE: 'Europe/Madrid',
        ALL_DAY_START: '00:00',
        ALL_DAY_END: '23:59'
    },
    
    // Templates
    TEMPLATES_BASE_URL: './templates/modals/'
};

// Estado global de la aplicación
export const APP_STATE = {
    // Estado de paginación y eventos
    offset: 0,
    totalEvents: 0,
    isSearching: false,
    
    // Estado de eventos
    currentEventId: null,
    eventIdToDelete: null,
    
    // Estado de autenticación
    isAuthenticated: false,
    isCheckingAuth: false,
    
    // Estado de loading para diferentes operaciones
    isLoading: false,
    isEventsLoading: false,
    
    // Estado de inicialización de módulos
    modules: {
        auth: false,
        events: false,
        search: false,
        modals: false,
        analytics: false,
        modalEventHandlers: false,
        graphsManager: false,
        authEventHandlers: false,
        searchEventHandlers: false,
        provinceManager: false
    },
    
    // Cache de eventos para optimización
    eventsCache: new Map(),
    lastUpdated: null
};