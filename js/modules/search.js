// Módulo de gestión de búsqueda
import { CONFIG, APP_STATE } from '../config.js';
import { EventsAPI, EventsRenderer } from './events.js';
import { AlertManager, LoadingManager } from './ui.js';
import { DateUtils, URLUtils } from './utils.js';

/**
 * Gestor de búsqueda de eventos
 */
export class SearchManager {
    
    static buildQueryParams() {
        const eventName = document.getElementById('event-name')?.value || '';
        const month = document.getElementById('month')?.value || '';
        
        // Usar campos unificados - provincia siempre del campo básico
        const province = document.getElementById('province')?.value || '';
        
        // Campos específicos de búsqueda avanzada
        const community = document.getElementById('adv-community')?.value || '';
        const city = document.getElementById('adv-city')?.value || '';
        const type = document.getElementById('adv-type')?.value || '';
        
        const startDate = document.getElementById('start-date')?.value || '';
        const endDate = document.getElementById('end-date')?.value || '';
        const year = document.getElementById('year')?.value || '';

        const { startDateQuery, endDateQuery } = DateUtils.constructDateQuery(year, month, startDate, endDate);

        let query = `?limit=${CONFIG.EVENTS_LIMIT}&offset=${APP_STATE.offset}`;
        if (eventName) query += `&summary=${URLUtils.encodeForURL(eventName)}`;
        if (startDateQuery) query += `&start_date=${startDateQuery}`;
        if (endDateQuery) query += `&end_date=${endDateQuery}`;
        if (province) query += `&province=${URLUtils.encodeForURL(province)}`;
        if (community) query += `&community=${URLUtils.encodeForURL(community)}`;
        if (city) query += `&city=${URLUtils.encodeForURL(city)}`;
        if (type) query += `&type=${URLUtils.encodeForURL(type)}`;

        return { 
            query, 
            searchCriteria: { 
                summary: eventName || 'Cualquier nombre',
                startDateQuery, 
                endDateQuery, 
                province: province || 'Cualquier provincia', 
                community: community || 'Cualquier comunidad', 
                city: city || 'Cualquier ciudad', 
                type: type || 'Cualquier tipo'
            } 
        };
    }

    static async searchEvents() {
        // Prevenir múltiples búsquedas concurrentes
        if (APP_STATE.isSearching) {
            console.log('⚠️ Ya se está ejecutando una búsqueda, saltando búsqueda duplicada');
            return;
        }
        
        APP_STATE.offset = 0; // Reiniciar offset en nueva búsqueda
        APP_STATE.isSearching = true;

        const { query, searchCriteria } = this.buildQueryParams();

        try {
            LoadingManager.show();
            
            const data = await EventsAPI.fetchEvents(query);

            let searchCriteriaString = `
                Fecha: ${searchCriteria.startDateQuery || 'Cualquier fecha de inicio'} a ${searchCriteria.endDateQuery || 'Cualquier fecha de fin'}, 
                Provincia: ${searchCriteria.province}, 
                Comunidad: ${searchCriteria.community}, 
                Ciudad: ${searchCriteria.city}, 
                Tipo: ${searchCriteria.type}
            `;

            if (data.detail) {
                EventsRenderer.displayNoResults(data.detail);
                APP_STATE.totalEvents = 0;
                AlertManager.warning(`No encontramos eventos para: \n\n${searchCriteriaString}`, 0);
            } else {
                const events = data.events;
                APP_STATE.totalEvents = data.total;
                
                AlertManager.success(`¡Listo! Encontramos ${APP_STATE.totalEvents} evento(s) para: \n\n${searchCriteriaString}`, 7000);
                EventsRenderer.displayEvents(events);
            }

            LoadingManager.hide();
            
            // Actualizar información de paginación y botón "Mostrar más"
            EventsRenderer.updatePaginationInfo();
            EventsRenderer.toggleLoadMoreButton();
            
        } catch (error) {
            LoadingManager.hide();
            AlertManager.error(`Ocurrió un error al buscar eventos: ${error.message}`);
        } finally {
            APP_STATE.isSearching = false;
        }
    }

    static resetSearch() {
        // Limpiar formularios
        document.getElementById('search-form-basic')?.reset();
        document.getElementById('search-form-advanced')?.reset();
        
        // Resetear estado
        APP_STATE.offset = 0;
        APP_STATE.isSearching = false;
        
        // Recargar eventos iniciales
        import('./events.js').then(({ EventsManager }) => {
            EventsManager.loadEvents();
        });
    }

    static toggleAdvancedSearch() {
        const basicSearch = document.querySelector('.basic-search');
        const advancedSearch = document.querySelector('.advanced-search');
        const toggleButton = document.getElementById('toggleAdvancedSearch');
        
        if (basicSearch && advancedSearch && toggleButton) {
            if (advancedSearch.style.display === 'none' || !advancedSearch.style.display) {
                basicSearch.style.display = 'none';
                advancedSearch.style.display = 'block';
                toggleButton.innerHTML = '<i class="fas fa-search-minus"></i> Búsqueda Simple';
            } else {
                basicSearch.style.display = 'block';
                advancedSearch.style.display = 'none';
                toggleButton.innerHTML = '<i class="fas fa-search-plus"></i> Búsqueda Avanzada';
            }
        }
    }
}

/**
 * Manejadores de eventos de búsqueda
 */
export class SearchEventHandlers {

    static handleSearchEvents(event) {
        if (event) event.preventDefault();
        SearchManager.searchEvents();
    }

    static handleLoadMoreEvents() {
        // Importación dinámica para evitar dependencias circulares
        import('./events.js').then(({ EventsManager }) => {
            EventsManager.loadMoreEvents();
        });
    }

    static handleToggleAdvancedSearch() {
        SearchManager.toggleAdvancedSearch();
    }

    static handleResetSearch() {
        SearchManager.resetSearch();
    }

    static setupSearchEventListeners() {
        // Prevenir inicialización múltiple
        if (APP_STATE.modules.searchEventHandlers) return;
        
        // Formularios de búsqueda
        const basicForm = document.getElementById('search-form-basic');
        const advancedForm = document.getElementById('search-form-advanced');
        
        if (basicForm) {
            basicForm.addEventListener('submit', this.handleSearchEvents);
        }
        
        if (advancedForm) {
            advancedForm.addEventListener('submit', this.handleSearchEvents);
        }

        // Botón "Mostrar más"
        const loadMoreButton = document.querySelector(CONFIG.SELECTORS.LOAD_MORE_BUTTON);
        if (loadMoreButton) {
            loadMoreButton.addEventListener('click', this.handleLoadMoreEvents);
        }

        // Exponer funciones globalmente para compatibilidad con HTML inline
        window.searchEvents = this.handleSearchEvents;
        window.loadMoreEvents = this.handleLoadMoreEvents;
        window.toggleAdvancedSearch = this.handleToggleAdvancedSearch;
        
        APP_STATE.modules.searchEventHandlers = true;
    }
}

/**
 * Gestor unificado de provincias y comunidades
 */
export class ProvinceManager {
    
    /**
     * Poblar datalist de comunidades para búsqueda avanzada
     */
    static populateCommunityDatalist() {
        if (!window.provinces) return;
        
        const communityList = document.getElementById('community-list');
        
        if (communityList) {
            // Limpiar opciones existentes
            communityList.innerHTML = '';
            
            // Obtener comunidades únicas
            const uniqueCommunities = [...new Set(window.provinces.map(province => province.community))];
            
            // Añadir comunidades
            uniqueCommunities.forEach(community => {
                const option = document.createElement('option');
                option.value = community;
                communityList.appendChild(option);
            });
        }
    }
    
    /**
     * Poblar select de provincia en búsqueda básica
     */
    static populateBasicSearchSelect() {
        if (!window.provinces) return;
        
        const provinceSelect = document.getElementById('province');
        if (provinceSelect) {
            // Limpiar opciones existentes (mantener la primera que suele ser placeholder)
            while (provinceSelect.children.length > 1) {
                provinceSelect.removeChild(provinceSelect.lastChild);
            }
            
            // Añadir provincias
            window.provinces.forEach(province => {
                const option = document.createElement('option');
                option.value = province.name;
                option.textContent = province.name;
                provinceSelect.appendChild(option);
            });
        }
    }
    
    /**
     * Poblar selects de provincias en modales
     */
    static populateProvinceSelects() {
        if (!window.provinces) return;
        
        const selectIds = ['upload-province', 'edit-province'];
        
        selectIds.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                // Limpiar opciones existentes (mantener la primera que suele ser placeholder)
                while (select.children.length > 1) {
                    select.removeChild(select.lastChild);
                }
                
                // Añadir provincias
                window.provinces.forEach(province => {
                    const option = document.createElement('option');
                    option.value = province.name;
                    option.textContent = province.name;
                    select.appendChild(option);
                });
            }
        });
    }
    
    /**
     * Configurar auto-actualización de comunidad basada en provincia seleccionada
     */
    static setupCommunityAutoUpdate(provinceSelectId, communityInputId) {
        const provinceSelect = document.getElementById(provinceSelectId);
        const communityInput = document.getElementById(communityInputId);
        
        if (!provinceSelect || !communityInput || !window.provinces) return;
        
        provinceSelect.addEventListener('change', function() {
            const selectedProvince = this.value;
            const province = window.provinces.find(p => p.name === selectedProvince);
            communityInput.value = province ? province.community : '';
        });
    }
    
    /**
     * Inicializar todo el sistema de provincias
     */
    static initialize() {
        // Prevenir inicialización múltiple
        if (APP_STATE.modules.provinceManager) return;
        
        // Poblar select de búsqueda básica
        this.populateBasicSearchSelect();
        
        // Poblar datalist de comunidades para búsqueda avanzada
        this.populateCommunityDatalist();
        
        // Poblar selects de modales
        this.populateProvinceSelects();
        
        // Configurar auto-actualización de comunidades en modales
        this.setupCommunityAutoUpdate('upload-province', 'upload-community');
        this.setupCommunityAutoUpdate('edit-province', 'edit-community');
        
        APP_STATE.modules.provinceManager = true;
    }
}

/**
 * Mantener FilterUtils para compatibilidad con código existente
 */
export class FilterUtils {
    static setupProvinceListeners() {
        ProvinceManager.initialize();
    }
}