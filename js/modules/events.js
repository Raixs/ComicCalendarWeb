// Módulo de gestión de eventos
import { CONFIG, APP_STATE } from '../config.js';
import { AuthManager } from './auth.js';
import { AlertManager, LoadingManager, LastUpdatedManager, MetaManager } from './ui.js';
import { DateUtils, URLUtils } from './utils.js';

/**
 * Gestor de eventos - API calls
 */
export class EventsAPI {
    static async fetchEvents(query = '') {
        const url = query ? `${CONFIG.API_URL}/events/search/${query}` : `${CONFIG.API_URL}/events/?limit=${CONFIG.EVENTS_LIMIT}&offset=${APP_STATE.offset}`;

        try {
            const response = await fetch(url);

            // Si es 404, intentamos devolver el cuerpo de la respuesta porque puede contener "No events found"
            if (response.status === 404) {
                try {
                    return await response.json();
                } catch (e) {
                    // Si no se puede parsear JSON, lanzamos el error estándar
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching events:', error);
            throw error;
        }
    }

    static async fetchEventById(eventId) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/events/${eventId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching event by ID:', error);
            throw error;
        }
    }

    static async createEvent(eventData) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/events/`, {
                method: 'POST',
                headers: AuthManager.getAuthHeaders(),
                body: JSON.stringify(eventData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Error al crear evento');
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating event:', error);
            throw error;
        }
    }

    static async updateEvent(eventId, eventData) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/events/${eventId}/`, {
                method: 'PUT',
                headers: AuthManager.getAuthHeaders(),
                body: JSON.stringify(eventData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Error al actualizar evento');
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating event:', error);
            throw error;
        }
    }

    static async deleteEvent(eventId) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/events/${eventId}`, {
                method: 'DELETE',
                headers: AuthManager.getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Error al eliminar evento');
            }

            return true;
        } catch (error) {
            console.error('Error deleting event:', error);
            throw error;
        }
    }
}

/**
 * Gestor de eventos - Business Logic
 */
export class EventsManager {
    static async loadEvents() {
        console.log('📅 Cargando eventos...');

        // Prevenir múltiples cargas concurrentes
        if (APP_STATE.isEventsLoading) {
            console.log('⚠️ Ya se están cargando eventos, saltando llamada duplicada');
            return;
        }

        APP_STATE.isEventsLoading = true;

        try {
            LoadingManager.show();

            const data = await EventsAPI.fetchEvents();
            const events = data.events;
            APP_STATE.totalEvents = data.total;

            LastUpdatedManager.update(data.last_updated);

            EventsRenderer.displayEvents(events);
            LoadingManager.hide();

            // Ocultar paginación en carga inicial
            document.querySelector(CONFIG.SELECTORS.PAGINATION_INFO).style.display = 'none';
            document.querySelector(CONFIG.SELECTORS.LOAD_MORE_BUTTON).style.display = 'none';

        } catch (error) {
            LoadingManager.hide();
            AlertManager.error('Error al cargar eventos: ' + error.message);
        } finally {
            APP_STATE.isEventsLoading = false;
        }
    }

    static async loadEventById(eventId) {
        try {
            const event = await EventsAPI.fetchEventById(eventId);
            EventsRenderer.showEventDetails(event);
            return event;
        } catch (error) {
            EventsRenderer.showInvalidEventMessage();
            return null;
        }
    }

    static async loadMoreEvents() {
        APP_STATE.offset += CONFIG.EVENTS_LIMIT;

        try {
            LoadingManager.show();

            // Importación dinámica para evitar dependencias circulares
            const { SearchManager } = await import('./search.js');
            const { query } = SearchManager.buildQueryParams();
            const data = await EventsAPI.fetchEvents(query);
            const events = data.events;

            EventsRenderer.displayEvents(events, true);
            LoadingManager.hide();

            EventsRenderer.updatePaginationInfo();
            EventsRenderer.toggleLoadMoreButton();

        } catch (error) {
            LoadingManager.hide();
            AlertManager.error('Error al cargar más eventos: ' + error.message);
        }
    }

    static async uploadEvent(eventData) {
        try {
            const result = await EventsAPI.createEvent(eventData);

            // Cerrar modal
            const uploadModal = bootstrap.Modal.getInstance(document.getElementById(CONFIG.MODAL_IDS.UPLOAD_EVENT));
            if (uploadModal) uploadModal.hide();

            AlertManager.success('Evento creado exitosamente');

            // Recargar eventos
            APP_STATE.offset = 0;
            this.loadEvents();

            return result;
        } catch (error) {
            AlertManager.error(error.message);
            throw error;
        }
    }

    static async updateEvent(eventId, eventData) {
        try {
            const result = await EventsAPI.updateEvent(eventId, eventData);

            // Cerrar modal
            const editModal = bootstrap.Modal.getInstance(document.getElementById(CONFIG.MODAL_IDS.EDIT_EVENT));
            if (editModal) editModal.hide();

            AlertManager.success('Evento actualizado exitosamente');

            // Recargar eventos
            this.loadEvents();

            return result;
        } catch (error) {
            AlertManager.error(error.message);
            throw error;
        }
    }

    static async deleteEvent(eventId) {
        try {
            await EventsAPI.deleteEvent(eventId);

            // Cerrar modal
            const deleteModal = bootstrap.Modal.getInstance(document.getElementById(CONFIG.MODAL_IDS.DELETE_EVENT));
            if (deleteModal) deleteModal.hide();

            AlertManager.success('Evento eliminado exitosamente');

            // Recargar eventos
            this.loadEvents();

        } catch (error) {
            AlertManager.error(error.message);
            throw error;
        }
    }
}

/**
 * Renderizador de eventos
 */
export class EventsRenderer {
    static displayEvents(events, append = false) {
        const eventsContainer = document.querySelector(CONFIG.SELECTORS.EVENTS_CONTAINER);
        if (!eventsContainer) return;

        if (!append) {
            eventsContainer.innerHTML = '';
        }

        events.forEach(event => {
            const eventCard = this.createEventCard(event);
            eventsContainer.appendChild(eventCard);
        });
    }

    static createEventCard(event) {
        const eventCard = document.createElement('div');
        eventCard.className = 'col';

        // Procesar descripción para enlaces
        let descriptionWithLinks = event.description;
        if (descriptionWithLinks.includes('<a ')) {
            descriptionWithLinks = descriptionWithLinks.replace(/<a /g, '<a target="_blank" ');
        }

        // Formatear fechas y horas
        const startTimeFormatted = DateUtils.formatTime(event.start_date);
        const endTimeFormatted = DateUtils.formatTime(event.end_date);
        const allDayEvent = DateUtils.isAllDayEvent(startTimeFormatted, endTimeFormatted);
        const dateDisplay = DateUtils.formatEventDate(event.start_date, event.end_date);
        const timeDisplay = allDayEvent ? '' : ` (${startTimeFormatted} a ${endTimeFormatted})`;

        eventCard.innerHTML = `
            <div class="${CONFIG.CSS_CLASSES.CARD}">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${event.summary}</h5>
                    <p class="card-text"><i class="fas fa-calendar-alt"></i> <strong>Fecha:</strong> ${dateDisplay}${timeDisplay}</p>
                    <p class="card-text"><i class="fas fa-map-marker-alt"></i> <strong>Ciudad:</strong> ${event.city}, ${event.community}</p>
                    <p class="card-text"><i class="fas fa-map-marker-alt"></i> <strong>Provincia:</strong> ${event.province}</p>
                    <p class="card-text"><i class="fas fa-tag"></i> <strong>Tipo:</strong> ${event.type}</p>
                    <p class="card-text event-description"><i class="fas fa-info-circle"></i> <strong>Información:</strong> ${descriptionWithLinks}</p>
                    ${event.description.length > 200 ? `<a href="#" class="show-more mt-auto">Mostrar más</a>` : ''}
                </div>
                <div class="card-footer d-flex justify-content-between align-items-center">
                    <div>
                        <button class="btn btn-primary btn-sm view-details-btn">
                            <i class="fas fa-info-circle"></i> Ver detalles
                        </button>
                        <button class="btn btn-secondary btn-sm share-event-btn">
                            <i class="fas fa-share-alt"></i> Compartir
                        </button>
                    </div>
                    ${AuthManager.isAuthenticated() ? `
                        <div>
                            <button class="btn btn-warning btn-sm me-2 edit-event-btn">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger btn-sm delete-event-btn">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Añadir event listeners
        this.attachEventCardListeners(eventCard, event);

        return eventCard;
    }

    static attachEventCardListeners(eventCard, event) {
        // Click en la tarjeta para mostrar detalles
        eventCard.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                this.showEventDetails(event);
            }
        });

        // Botón ver detalles
        const viewDetailsBtn = eventCard.querySelector('.view-details-btn');
        viewDetailsBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showEventDetails(event);
        });

        // Botón compartir
        const shareBtn = eventCard.querySelector('.share-event-btn');
        shareBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            window.shareEvent(event);
        });

        // Botones de administración
        if (AuthManager.isAuthenticated()) {
            const editBtn = eventCard.querySelector('.edit-event-btn');
            editBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                window.editEvent(event.id);
            });

            const deleteBtn = eventCard.querySelector('.delete-event-btn');
            deleteBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                window.confirmDeleteEvent(event.id);
            });
        }

        // Botón "Mostrar más" en descripción
        if (event.description.length > 200) {
            const showMoreBtn = eventCard.querySelector('.show-more');
            showMoreBtn?.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showEventDetails(event);
            });
        }
    }

    static showEventDetails(event) {
        // Preparar datos del evento
        const startTimeFormatted = DateUtils.formatTime(event.start_date);
        const endTimeFormatted = DateUtils.formatTime(event.end_date);
        const allDayEvent = DateUtils.isAllDayEvent(startTimeFormatted, endTimeFormatted);
        const dateDisplay = DateUtils.formatEventDate(event.start_date, event.end_date);
        const timeDisplay = allDayEvent ? 'Todo el día' : `${startTimeFormatted} a ${endTimeFormatted}`;

        // Actualizar modal
        document.getElementById('eventDetailsModalLabel').textContent = event.summary;
        document.getElementById('modalEventDate').textContent = dateDisplay;
        document.getElementById('modalEventTime').textContent = timeDisplay;
        document.getElementById('modalEventCity').textContent = `${event.city}, ${event.community}`;
        document.getElementById('modalEventProvince').textContent = event.province;
        document.getElementById('modalEventAddress').textContent = event.address;
        document.getElementById('modalEventType').textContent = event.type;
        document.getElementById('modalEventDescription').innerHTML = event.description;

        // Fecha de actualización
        const modalEventUpdateDate = document.getElementById('modalEventUpdateDate');
        const modalEventUpdateDateText = document.getElementById('modalEventUpdateDateText');
        if (event.update_date && event.update_date !== "1970-01-01 00:00:00") {
            const updateDateFormatted = DateUtils.formatUpdateDate(event.update_date);
            modalEventUpdateDateText.textContent = updateDateFormatted;
            modalEventUpdateDate.style.display = 'block';
        } else {
            modalEventUpdateDate.style.display = 'none';
        }

        // Botones de administración
        const adminButtons = document.getElementById('adminButtons');
        if (AuthManager.isAuthenticated()) {
            adminButtons.classList.remove(CONFIG.CSS_CLASSES.HIDDEN);
        } else {
            adminButtons.classList.add(CONFIG.CSS_CLASSES.HIDDEN);
        }

        // Configurar botones del modal
        this.setupModalButtons(event);

        // Actualizar URL y meta tags
        URLUtils.updateURL(event.id);
        MetaManager.updateForEvent({
            ...event,
            formattedDate: dateDisplay
        });

        // Mostrar modal
        const modalElement = document.getElementById(CONFIG.MODAL_IDS.EVENT_DETAILS);

        // Verificar si ya existe una instancia del modal y dispose si es necesario
        const existingModal = bootstrap.Modal.getInstance(modalElement);
        if (existingModal) {
            console.log('🔄 Eliminando instancia existente del modal');
            existingModal.dispose();
        }

        // Crear nueva instancia del modal
        const eventDetailsModal = new bootstrap.Modal(modalElement, {
            backdrop: true,
            keyboard: true,
            focus: true
        });

        console.log('🎯 Mostrando modal de detalles del evento');
        eventDetailsModal.show();
    }

    static setupModalButtons(event) {
        // Botón "Añadir al calendario"
        const addToCalendarBtn = document.getElementById('addToCalendarBtn');
        const atcbData = {
            name: event.summary,
            description: event.description.replace(/<[^>]*>/g, ''),
            startDate: DateUtils.datePart(event.start_date),
            endDate: DateUtils.datePart(event.end_date),
            options: ['Google', 'Outlook.com', 'Apple', 'iCal'],
            timeZone: CONFIG.DATE_CONFIG.TIMEZONE
        };

        const startTime = DateUtils.formatTime(event.start_date);
        const endTime = DateUtils.formatTime(event.end_date);
        if (!DateUtils.isAllDayEvent(startTime, endTime)) {
            atcbData.startTime = startTime;
            atcbData.endTime = endTime;
        }

        if (typeof atcb_action === 'function') {
            addToCalendarBtn.onclick = () => atcb_action(atcbData);
        } else {
            addToCalendarBtn.onclick = () => {
                console.warn('Add to Calendar library not loaded');
                AlertManager.warning('Función de calendario no disponible');
            };
        }

        // Botón de direcciones
        document.getElementById('getDirectionsBtn').onclick = () => {
            window.getDirections(event);
        };

        // Botón de compartir
        document.getElementById('shareEventBtn').onclick = () => {
            window.shareEvent(event);
        };

        // Botones de administración en el modal
        if (AuthManager.isAuthenticated()) {
            const editEventBtn = document.getElementById('editEventBtn');
            const deleteEventBtn = document.getElementById('deleteEventBtn');

            if (editEventBtn) {
                editEventBtn.onclick = () => window.editEvent(event.id);
            }

            if (deleteEventBtn) {
                deleteEventBtn.onclick = () => window.confirmDeleteEvent(event.id);
            }
        }
    }

    static showInvalidEventMessage() {
        const eventsContainer = document.querySelector(CONFIG.SELECTORS.EVENTS_CONTAINER);
        if (!eventsContainer) return;

        eventsContainer.innerHTML = `
            <div class="alert alert-danger text-center" role="alert">
                El evento que buscas no existe o ha sido eliminado.
            </div>`;
    }

    static displayNoResults(message) {
        const eventsContainer = document.querySelector(CONFIG.SELECTORS.EVENTS_CONTAINER);
        if (!eventsContainer) return;

        eventsContainer.innerHTML = `<div class="col-12"><p class="text-center text-muted">${message}</p></div>`;
    }

    static updatePaginationInfo() {
        const paginationInfo = document.querySelector(CONFIG.SELECTORS.PAGINATION_INFO);
        if (!paginationInfo) return;

        if (APP_STATE.isSearching && APP_STATE.totalEvents > 0) {
            paginationInfo.textContent = `Mostrando ${Math.min(APP_STATE.offset + CONFIG.EVENTS_LIMIT, APP_STATE.totalEvents)} de ${APP_STATE.totalEvents} eventos`;
            paginationInfo.style.display = 'block';
        } else {
            paginationInfo.style.display = 'none';
        }
    }

    static toggleLoadMoreButton() {
        const loadMoreButton = document.querySelector(CONFIG.SELECTORS.LOAD_MORE_BUTTON);
        if (!loadMoreButton) return;

        if (APP_STATE.isSearching && APP_STATE.totalEvents > APP_STATE.offset + CONFIG.EVENTS_LIMIT) {
            loadMoreButton.style.display = 'block';
        } else {
            loadMoreButton.style.display = 'none';
        }
    }
}