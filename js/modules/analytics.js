// Módulo de Google Analytics y gestión de cookies
import { CONFIG, APP_STATE } from '../config.js';

export class AnalyticsManager {
    static TRACKING_ID = 'G-WX8H3NJBFL';

    static async initialize() {
        if (APP_STATE.modules.analytics) return;

        try {
            // Cargar script de Google Analytics dinámicamente
            await this.loadGoogleAnalytics();
            
            // Configurar consentimiento inicial
            if (typeof window.gtag !== 'undefined') {
                window.gtag('consent', 'default', {
                    'analytics_storage': 'denied'
                });
            }
            
            APP_STATE.modules.analytics = true;
            console.log('✅ Google Analytics inicializado correctamente');
        } catch (error) {
            console.error('❌ Error inicializando Google Analytics:', error);
        }
    }

    static async loadGoogleAnalytics() {
        return new Promise((resolve, reject) => {
            // Crear dataLayer si no existe
            window.dataLayer = window.dataLayer || [];
            
            // Crear función gtag si no existe
            window.gtag = window.gtag || function() {
                window.dataLayer.push(arguments);
            };
            
            // Configurar gtag con fecha actual
            window.gtag('js', new Date());
            window.gtag('config', this.TRACKING_ID);

            // Cargar script de Google Analytics
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${this.TRACKING_ID}`;
            
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Error cargando Google Analytics'));
            
            document.head.appendChild(script);
        });
    }

    static enableAnalytics() {
        if (typeof window.gtag !== 'undefined') {
            console.log("Cookies analíticas activadas.");
            window.gtag('consent', 'update', {
                'analytics_storage': 'granted'
            });
        }
    }

    static trackEvent(eventName, parameters = {}) {
        if (typeof window.gtag !== 'undefined') {
            window.gtag('event', eventName, parameters);
        }
    }

    static trackPageView(pagePath) {
        if (typeof gtag !== 'undefined') {
            gtag('config', this.TRACKING_ID, {
                page_path: pagePath
            });
        }
    }
}

/**
 * Gestor de consentimiento de cookies
 */
export class CookieConsentManager {
    static initialize() {
        // Verificar si ya se aceptaron las cookies
        if (!localStorage.getItem("cookieConsent")) {
            this.showConsentModal();
        } else {
            const consentType = localStorage.getItem("cookieConsent");
            if (consentType === "all") {
                AnalyticsManager.enableAnalytics();
            }
        }
    }

    static showConsentModal() {
        try {
            if (!CONFIG || !CONFIG.MODAL_IDS || !CONFIG.MODAL_IDS.COOKIE_CONSENT) {
                console.error('CONFIG no está disponible para modal de cookies');
                return;
            }
            
            const modalElement = document.getElementById(CONFIG.MODAL_IDS.COOKIE_CONSENT);
            if (!modalElement) {
                console.error(`Modal de cookies no encontrado: ${CONFIG.MODAL_IDS.COOKIE_CONSENT}`);
                return;
            }
            
            const cookieModal = new bootstrap.Modal(modalElement);
            cookieModal.show();
        } catch (error) {
            console.error('Error mostrando modal de consentimiento:', error);
        }
    }

    static setCookieConsent(consentType) {
        localStorage.setItem("cookieConsent", consentType);
        this.hideConsentModal();
        
        if (consentType === "all") {
            AnalyticsManager.enableAnalytics();
        }
    }

    static hideConsentModal() {
        try {
            if (!CONFIG || !CONFIG.MODAL_IDS || !CONFIG.MODAL_IDS.COOKIE_CONSENT) {
                console.error('CONFIG no está disponible para ocultar modal de cookies');
                return;
            }
            
            const modalElement = document.getElementById(CONFIG.MODAL_IDS.COOKIE_CONSENT);
            if (!modalElement) {
                console.error(`Modal de cookies no encontrado: ${CONFIG.MODAL_IDS.COOKIE_CONSENT}`);
                return;
            }
            
            const cookieModal = bootstrap.Modal.getInstance(modalElement);
            if (cookieModal) {
                cookieModal.hide();
            }
        } catch (error) {
            console.error('Error al ocultar modal de consentimiento de cookies:', error);
        }
    }

    static setupEventListeners() {
        // Event listeners para los botones de consentimiento
        const acceptNecessaryBtn = document.querySelector(".btn-accept-necessary");
        const acceptAllBtn = document.querySelector(".btn-accept-all");

        if (acceptNecessaryBtn) {
            acceptNecessaryBtn.addEventListener("click", () => {
                this.setCookieConsent("necessary");
            });
        }

        if (acceptAllBtn) {
            acceptAllBtn.addEventListener("click", () => {
                this.setCookieConsent("all");
            });
        }
    }
}

/**
 * Gestor de funcionalidades adicionales web
 */
export class WebFeaturesManager {
    static setupCalendarIntegration() {
        // Cargar script de "Add to Calendar" si no está cargado
        if (typeof atcb_action === 'undefined') {
            this.loadCalendarScript();
        }
    }

    static loadCalendarScript() {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/add-to-calendar-button@2';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }

    static initializeThirdPartyServices() {
        this.setupCalendarIntegration();
        // Aquí se pueden añadir otras integraciones de terceros
    }
}

/**
 * Inicializador de servicios
 */
export class ServicesInitializer {
    static initializeAll() {
        AnalyticsManager.initialize();
        CookieConsentManager.initialize();
        CookieConsentManager.setupEventListeners();
        WebFeaturesManager.initializeThirdPartyServices();
    }
}