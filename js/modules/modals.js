// Módulo de gestión de modales
import { CONFIG, APP_STATE } from '../config.js';
import { EventsManager } from './events.js';
import { AuthManager } from './auth.js';
import { AlertManager } from './ui.js';
import { DateUtils } from './utils.js';

/**
 * Gestor de modales
 */
export class ModalManager {
    static async loadModalTemplate(modalName) {
        try {
            const response = await fetch(`${CONFIG.TEMPLATES_BASE_URL}${modalName}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load template: ${modalName}`);
            }
            return await response.text();
        } catch (error) {
            console.error('Error loading modal template:', error);
            return null;
        }
    }

    static async injectModal(modalName, containerId = 'modal-container') {
        const template = await this.loadModalTemplate(modalName);
        if (!template) return false;

        let container = document.getElementById(containerId);
        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            document.body.appendChild(container);
        }

        container.insertAdjacentHTML('beforeend', template);
        return true;
    }

    static show(modalId) {
        const modalElement = document.getElementById(modalId);
        if (modalElement) {
            const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
            modal.show();
        }
    }

    static hide(modalId) {
        const modalElement = document.getElementById(modalId);
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();
        }
    }

    /**
     * Limpia el estado de todos los modales y backdrops
     */
    static cleanupModalState() {
        console.log('🧹 Limpiando estado global de modales...');
        
        // Limpiar clases y estilos del body
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('padding-right');
        
        // Eliminar todos los backdrops residuales
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => {
            console.log('🗑️ Eliminando backdrop residual');
            backdrop.remove();
        });
        
        // Asegurar que no hay modales con aria-hidden incorrectos
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.setAttribute('aria-hidden', 'true');
            modal.style.display = 'none';
        });
        
        console.log('✅ Estado de modales limpiado');
    }
}

/**
 * Gestor de eventos de modales específicos
 */
export class ModalEventHandlers {

    /**
     * Helper para transiciones seguras entre modales
     */
    static openModalWithDelay(modalId, delay = 150) {
        setTimeout(() => {
            try {
                ModalManager.show(modalId);
            } catch (error) {
                console.error(`Error abriendo modal ${modalId}:`, error);
            }
        }, delay);
    }

    /**
     * Helper para cerrar un modal y abrir otro después
     */
    static transitionBetweenModals(fromModalId, toModalId, callback = null) {
        const fromModal = document.getElementById(fromModalId);
        const modalInstance = bootstrap.Modal.getInstance(fromModal);
        
        if (modalInstance) {
            fromModal.addEventListener('hidden.bs.modal', () => {
                if (callback) callback();
                this.openModalWithDelay(toModalId);
            }, { once: true });

            modalInstance.hide();
        } else {
            if (callback) callback();
            this.openModalWithDelay(toModalId);
        }
    }

    static async handleEditEvent(eventId) {
        APP_STATE.currentEventId = eventId;

        // Cerrar modal de detalles y esperar a que se cierre completamente
        const detailsModal = document.getElementById(CONFIG.MODAL_IDS.EVENT_DETAILS);
        const modalInstance = bootstrap.Modal.getInstance(detailsModal);
        
        if (modalInstance) {
            // Escuchar cuando el modal se haya cerrado completamente
            detailsModal.addEventListener('hidden.bs.modal', async () => {
                try {
                    const response = await fetch(`${CONFIG.API_URL}/events/${eventId}`);
                    
                    if (!response.ok) {
                        throw new Error('Error al cargar evento');
                    }

                    const event = await response.json();

                    // Rellenar formulario
                    document.getElementById('edit-summary').value = event.summary;
                    document.getElementById('edit-start-date').value = event.start_date.split(' ')[0];
                    document.getElementById('edit-start-time').value = event.start_date.split(' ')[1].slice(0, 5);
                    document.getElementById('edit-end-date').value = event.end_date.split(' ')[0];
                    document.getElementById('edit-end-time').value = event.end_date.split(' ')[1].slice(0, 5);
                    document.getElementById('edit-province').value = event.province;
                    document.getElementById('edit-community').value = event.community;
                    document.getElementById('edit-city').value = event.city;
                    document.getElementById('edit-type').value = event.type;
                    document.getElementById('edit-address').value = event.address;
                    document.getElementById('edit-description').value = event.description;

                    // Pequeño delay para asegurar que Bootstrap termine sus operaciones
                    setTimeout(() => {
                        ModalManager.show(CONFIG.MODAL_IDS.EDIT_EVENT);
                    }, 150);
                } catch (error) {
                    console.error('Error al cargar los detalles del evento:', error);
                    AlertManager.error('Error al cargar los detalles del evento');
                }
            }, { once: true });

            // Cerrar el modal de detalles
            modalInstance.hide();
        } else {
            // Si no hay modal de detalles abierto, abrir directamente
            try {
                const response = await fetch(`${CONFIG.API_URL}/events/${eventId}`);
                
                if (!response.ok) {
                    throw new Error('Error al cargar evento');
                }

                const event = await response.json();

                // Rellenar formulario
                document.getElementById('edit-summary').value = event.summary;
                document.getElementById('edit-start-date').value = event.start_date.split(' ')[0];
                document.getElementById('edit-start-time').value = event.start_date.split(' ')[1].slice(0, 5);
                document.getElementById('edit-end-date').value = event.end_date.split(' ')[0];
                document.getElementById('edit-end-time').value = event.end_date.split(' ')[1].slice(0, 5);
                document.getElementById('edit-province').value = event.province;
                document.getElementById('edit-community').value = event.community;
                document.getElementById('edit-city').value = event.city;
                document.getElementById('edit-type').value = event.type;
                document.getElementById('edit-address').value = event.address;
                document.getElementById('edit-description').value = event.description;

                ModalManager.show(CONFIG.MODAL_IDS.EDIT_EVENT);
            } catch (error) {
                console.error('Error al cargar los detalles del evento:', error);
                AlertManager.error('Error al cargar los detalles del evento');
            }
        }
    }

    static async handleUpdateEvent(event) {
        event.preventDefault();
        
        const updatedEvent = {
            summary: document.getElementById('edit-summary').value,
            start_date: DateUtils.formatToStandardDateTime(
                document.getElementById('edit-start-date').value, 
                document.getElementById('edit-start-time').value
            ),
            end_date: DateUtils.formatToStandardDateTime(
                document.getElementById('edit-end-date').value, 
                document.getElementById('edit-end-time').value
            ),
            province: document.getElementById('edit-province').value,
            community: document.getElementById('edit-community').value,
            city: document.getElementById('edit-city').value,
            type: document.getElementById('edit-type').value,
            address: document.getElementById('edit-address').value,
            description: document.getElementById('edit-description').value
        };

        try {
            await EventsManager.updateEvent(APP_STATE.currentEventId, updatedEvent);
        } catch (error) {
            console.error('Error updating event:', error);
        }
    }

    static async handleUploadEvent(event) {
        event.preventDefault();
        
        const newEvent = {
            summary: document.getElementById('upload-summary').value,
            start_date: DateUtils.formatToStandardDateTime(
                document.getElementById('upload-start-date').value, 
                document.getElementById('upload-start-time').value
            ),
            end_date: DateUtils.formatToStandardDateTime(
                document.getElementById('upload-end-date').value, 
                document.getElementById('upload-end-time').value
            ),
            create_date: DateUtils.getCurrentCreateDate(),
            province: document.getElementById('upload-province').value,
            community: document.getElementById('upload-community').value,
            city: document.getElementById('upload-city').value,
            type: document.getElementById('upload-type').value,
            address: document.getElementById('upload-address').value,
            description: document.getElementById('upload-description').value
        };

        try {
            await EventsManager.uploadEvent(newEvent);
        } catch (error) {
            console.error('Error uploading event:', error);
        }
    }

    static handleConfirmDeleteEvent(eventId) {
        APP_STATE.eventIdToDelete = eventId;

        // Cerrar modal de detalles y esperar a que se cierre completamente
        const detailsModal = document.getElementById(CONFIG.MODAL_IDS.EVENT_DETAILS);
        const modalInstance = bootstrap.Modal.getInstance(detailsModal);
        
        if (modalInstance) {
            // Escuchar cuando el modal se haya cerrado completamente
            detailsModal.addEventListener('hidden.bs.modal', () => {
                // Pequeño delay para asegurar que Bootstrap termine sus operaciones
                setTimeout(() => {
                    ModalManager.show(CONFIG.MODAL_IDS.DELETE_EVENT);
                }, 150);
            }, { once: true });

            // Cerrar el modal de detalles
            modalInstance.hide();
        } else {
            // Si no hay modal de detalles abierto, abrir directamente
            ModalManager.show(CONFIG.MODAL_IDS.DELETE_EVENT);
        }
    }

    static async handleDeleteEvent() {
        if (!APP_STATE.eventIdToDelete) return;

        try {
            await EventsManager.deleteEvent(APP_STATE.eventIdToDelete);
            APP_STATE.eventIdToDelete = null;
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    }

    static setupModalEventListeners() {
        // Prevenir inicialización múltiple
        if (APP_STATE.modules.modalEventHandlers) return;
        
        // Event listener para formulario de edición
        const editForm = document.getElementById('edit-event-form');
        if (editForm) {
            editForm.addEventListener('submit', this.handleUpdateEvent);
        }

        // Event listener para formulario de subida
        const uploadForm = document.getElementById('upload-event-form');
        if (uploadForm) {
            uploadForm.addEventListener('submit', this.handleUploadEvent);
        }

        // Event listener para modal de detalles cuando se cierra
        const eventDetailsModal = document.getElementById(CONFIG.MODAL_IDS.EVENT_DETAILS);
        if (eventDetailsModal) {
            // Listener para cuando se cierra el modal
            eventDetailsModal.addEventListener('hidden.bs.modal', function () {
                console.log('🔄 Modal cerrado - limpiando estado...');
                
                // Restablecer URL cuando se cierra el modal
                history.replaceState(null, '', window.location.pathname);
                
                // Usar el método de limpieza centralizado con pequeño delay
                setTimeout(() => {
                    ModalManager.cleanupModalState();
                }, 100);
            });

            // Listener adicional para casos donde el modal se oculta sin activar hidden.bs.modal
            eventDetailsModal.addEventListener('hide.bs.modal', function () {
                console.log('🔄 Modal ocultándose...');
            });
        }

        // Event listener global para ESC y clicks fuera del modal
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                // Dar tiempo a Bootstrap para procesar el ESC, luego limpiar
                setTimeout(() => {
                    const openModals = document.querySelectorAll('.modal.show');
                    if (openModals.length === 0) {
                        ModalManager.cleanupModalState();
                    }
                }, 200);
            }
        });

        // Exponer funciones globalmente para compatibilidad con HTML
        window.editEvent = this.handleEditEvent;
        window.updateEvent = this.handleUpdateEvent;
        window.uploadEvent = this.handleUploadEvent;
        window.confirmDeleteEvent = this.handleConfirmDeleteEvent;
        window.deleteEvent = this.handleDeleteEvent;
        
        // Exponer helpers de transición de modales
        window.openModalWithDelay = this.openModalWithDelay;
        window.transitionBetweenModals = this.transitionBetweenModals;
        
        APP_STATE.modules.modalEventHandlers = true;
    }
}

/**
 * Gestor de gráficas (funcionalidad específica del modal de gráficas)
 */
export class GraphsManager {

    static async loadGraph(type) {
        const frame = document.getElementById('graph-frame');
        const errorMessage = document.getElementById('error-message');
        let url = '';

        console.log(`🎯 loadGraph() llamado con tipo: ${type}`);

        if (type === 'year') {
            const year = document.getElementById('year-select')?.value;
            if (year) {
                url = `${CONFIG.GRAPHS_BASE_URL}/static/graphs/graficas_eventos_${year}.html`;
            }
        } else if (type === 'comunidad_eventos') {
            url = `${CONFIG.GRAPHS_BASE_URL}/static/graphs/evolucion_eventos_comunidad.html`;
        } else if (type === 'provincia_eventos') {
            url = `${CONFIG.GRAPHS_BASE_URL}/static/graphs/evolucion_eventos_provincia.html`;
        } else if (type === 'comunidad_totales') {
            url = `${CONFIG.GRAPHS_BASE_URL}/static/graphs/evolucion_eventos_totales_comunidad.html`;
        } else if (type === 'provincia_totales') {
            url = `${CONFIG.GRAPHS_BASE_URL}/static/graphs/evolucion_eventos_totales_provincia.html`;
        } else if (type === 'comunidad_firmas') {
            url = `${CONFIG.GRAPHS_BASE_URL}/static/graphs/evolucion_firmas_comunidad.html`;
        } else if (type === 'provincia_firmas') {
            url = `${CONFIG.GRAPHS_BASE_URL}/static/graphs/evolucion_firmas_provincia.html`;
        }

        console.log(`🔗 URL de gráfica generada: ${url}`);

        if (url) {
            fetch(url, { method: 'HEAD' })
                .then(response => {
                    console.log(`📊 Respuesta de gráfica: ${response.status} - ${response.ok ? 'OK' : 'ERROR'}`);
                    if (response.ok) {
                        frame.src = url;
                        frame.style.display = 'block';
                        errorMessage.style.display = 'none';
                    } else {
                        frame.src = '';
                        frame.style.display = 'none';
                        errorMessage.textContent = 'Lo sentimos, aún no hay disponibles gráficas para el año seleccionado.';
                        errorMessage.style.display = 'block';
                    }
                })
                .catch((error) => {
                    console.error(`❌ Error al cargar gráfica:`, error);
                    frame.src = '';
                    frame.style.display = 'none';
                    errorMessage.textContent = 'Lo sentimos, aún no hay disponibles gráficas para el año seleccionado.';
                    errorMessage.style.display = 'block';
                });
        } else {
            console.warn(`⚠️ No se pudo generar URL para el tipo: ${type}`);
            frame.src = '';
            frame.style.display = 'none';
            errorMessage.textContent = 'Lo sentimos, aún no hay disponibles gráficas para el año seleccionado.';
            errorMessage.style.display = 'block';
        }
    }

    static setupGraphsListeners() {
        // Prevenir inicialización múltiple
        if (APP_STATE.modules.graphsManager) return;
        
        // Exponer función globalmente
        window.loadGraph = this.loadGraph;
        
        APP_STATE.modules.graphsManager = true;
    }
}