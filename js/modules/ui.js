// Módulo de gestión de UI y alertas
import { CONFIG } from '../config.js';
import { DOMUtils } from './utils.js';

/**
 * Gestor de alertas y notificaciones
 */
export class AlertManager {
    static show(message, type = 'info', timeout = null) {
        const alertPlaceholder = document.querySelector(CONFIG.SELECTORS.ALERT_PLACEHOLDER);
        if (!alertPlaceholder) return;

        const alert = DOMUtils.createElement('div', `${CONFIG.CSS_CLASSES.ALERT_BASE} alert-${type}`);
        alert.setAttribute('role', 'alert');
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        alertPlaceholder.appendChild(alert);

        // Determinar timeout basado en tipo si no se proporciona
        if (timeout === null) {
            timeout = CONFIG.ALERT_TIMEOUT[type.toUpperCase()] || CONFIG.ALERT_TIMEOUT.INFO;
        }

        // Auto-close si timeout > 0
        if (timeout > 0) {
            setTimeout(() => {
                if (alert && alert.parentNode) {
                    const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
                    bsAlert.close();
                }
            }, timeout);
        }
    }

    static success(message, timeout = null) {
        this.show(message, 'success', timeout);
    }

    static error(message, timeout = null) {
        this.show(message, 'danger', timeout);
    }

    static warning(message, timeout = null) {
        this.show(message, 'warning', timeout);
    }

    static info(message, timeout = null) {
        this.show(message, 'info', timeout);
    }
}

/**
 * Gestor de loading indicators
 */
export class LoadingManager {
    static show() {
        DOMUtils.show(CONFIG.SELECTORS.LOADING_INDICATOR);
    }

    static hide() {
        DOMUtils.hide(CONFIG.SELECTORS.LOADING_INDICATOR);
    }
}

/**
 * Gestor de paginación
 */
export class PaginationManager {
    static updateInfo(offset, limit, totalEvents, isSearching) {
        const paginationInfo = document.querySelector(CONFIG.SELECTORS.PAGINATION_INFO);
        if (!paginationInfo) return;

        if (isSearching && totalEvents > 0) {
            paginationInfo.textContent = `Mostrando ${Math.min(offset + limit, totalEvents)} de ${totalEvents} eventos`;
            DOMUtils.show(paginationInfo);
        } else {
            DOMUtils.hide(paginationInfo);
        }
    }

    static toggleLoadMoreButton(offset, limit, totalEvents, isSearching) {
        const loadMoreButton = document.querySelector(CONFIG.SELECTORS.LOAD_MORE_BUTTON);
        if (!loadMoreButton) return;

        if (isSearching && totalEvents > offset + limit) {
            DOMUtils.show(loadMoreButton);
        } else {
            DOMUtils.hide(loadMoreButton);
        }
    }
}

/**
 * Gestor de metadatos y SEO
 */
export class MetaManager {
    static updateForEvent(event) {
        // Cambiar título de la página
        document.title = `${event.summary} | Eventos Comic`;

        // Actualizar meta descripción
        this.updateMetaTag('name', 'description', 
            `${event.summary} en ${event.city}, ${event.community} el ${event.formattedDate}.`);

        // Actualizar Open Graph tags
        this.updateMetaTag('property', 'og:title', event.summary);
        this.updateMetaTag('property', 'og:description', 
            `${event.summary} en ${event.city}, ${event.community}.`);
        this.updateMetaTag('property', 'og:url', window.location.href);
    }

    static updateMetaTag(attribute, name, content) {
        let metaTag = document.querySelector(`meta[${attribute}="${name}"]`);
        if (!metaTag) {
            metaTag = document.createElement('meta');
            metaTag.setAttribute(attribute, name);
            document.head.appendChild(metaTag);
        }
        metaTag.content = content;
    }

    static resetMeta() {
        document.title = 'Eventos de Cómic en España';
        this.updateMetaTag('name', 'description', 
            'Encuentra y busca eventos de cómics en España. Descubre los eventos más recientes y sus detalles, incluyendo fecha, provincia, dirección y descripción.');
    }
}

/**
 * Gestor de última actualización
 */
export class LastUpdatedManager {
    static update(lastUpdated) {
        if (!lastUpdated) return;
        
        const lastUpdatedElement = document.querySelector(CONFIG.SELECTORS.LAST_UPDATED);
        if (!lastUpdatedElement) return;

        const lastUpdatedDate = new Date(lastUpdated).toLocaleDateString(CONFIG.DATE_CONFIG.LOCALE, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        lastUpdatedElement.textContent = lastUpdatedDate;
    }
}

/**
 * Gestor de navegación y menús
 */
export class NavigationManager {
    static updateAuthenticationUI(isAuthenticated) {
        console.log(`🔄 Actualizando UI de autenticación: ${isAuthenticated ? 'autenticado' : 'no autenticado'}`);
        
        const loginItem = document.getElementById('login-item');
        const logoutItem = document.getElementById('logout-item');
        const uploadItem = document.getElementById('upload-item');

        if (!loginItem || !logoutItem || !uploadItem) {
            console.error('❌ No se encontraron elementos de navegación de autenticación');
            return;
        }

        if (isAuthenticated) {
            DOMUtils.addClass(loginItem, CONFIG.CSS_CLASSES.HIDDEN);
            DOMUtils.removeClass(logoutItem, CONFIG.CSS_CLASSES.HIDDEN);
            DOMUtils.removeClass(uploadItem, CONFIG.CSS_CLASSES.HIDDEN);
            console.log('✅ UI actualizada: mostrar logout y upload, ocultar login');
        } else {
            DOMUtils.removeClass(loginItem, CONFIG.CSS_CLASSES.HIDDEN);
            DOMUtils.addClass(logoutItem, CONFIG.CSS_CLASSES.HIDDEN);
            DOMUtils.addClass(uploadItem, CONFIG.CSS_CLASSES.HIDDEN);
            console.log('✅ UI actualizada: mostrar login, ocultar logout y upload');
        }
    }
}

/**
 * Utilidades de compartir
 */
export class ShareUtils {
    static async copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return await navigator.clipboard.writeText(text);
        }

        // Método de respaldo para navegadores más antiguos
        return new Promise((resolve, reject) => {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                textArea.remove();
                resolve();
            } catch (err) {
                textArea.remove();
                reject(err);
            }
        });
    }

    static async shareEvent(event) {
        const eventUrl = `${window.location.origin}?id=${event.id}`;
        const shareData = {
            title: event.summary,
            text: `${event.summary} - ${event.formattedDate} en ${event.city}, ${event.province}.`,
            url: eventUrl
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            // Fallback: copiar al portapapeles
            try {
                await this.copyToClipboard(eventUrl);
                AlertManager.success('Enlace copiado al portapapeles');
            } catch (err) {
                AlertManager.error('No se pudo compartir el evento');
            }
        }
    }

    static getDirections(event) {
        const address = encodeURIComponent(`${event.address}, ${event.city}, ${event.province}, España`);
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${address}`;
        window.open(mapsUrl, '_blank');
    }
}