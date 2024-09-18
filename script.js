// Definición de variables y constantes
const apiUrl = 'https://api.eventoscomic.com/v1';
let offset = 0;
const limit = 20; // Número de resultados por página
let totalEvents = 0; // Total de eventos retornados por la API
let isSearching = false; // Indica si estamos en modo búsqueda o no
let currentEventId = null;
let eventIdToDelete = null;

// Inicialización al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    checkAuthentication();
});

// Comprobar si hay un ID de evento en la URL y cargar sus detalles
document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');

    if (eventId) {
        // Realizar la búsqueda del evento con el ID proporcionado en la URL
        fetchEventById(eventId).then(event => {
            if (event) {
                showEventDetails(event);
            }
        }).catch(error => {
            console.error('Error al cargar el evento:', error);
        });
    }
});

// Función para obtener el evento por ID
async function fetchEventById(eventId) {
    try {
        const response = await fetch(`${apiUrl}/events/${eventId}`);
        if (!response.ok) throw new Error('Evento no encontrado');
        const event = await response.json();
        return event;
    } catch (error) {
        console.error(error);
        showInvalidEventMessage(); // Mostrar mensaje de error si no se encuentra el evento
        return null;
    }
}

function showInvalidEventMessage() {
    const eventsContainer = document.getElementById('events');
    eventsContainer.innerHTML = `
        <div class="alert alert-danger text-center" role="alert">
            El evento que buscas no existe o ha sido eliminado.
        </div>`;
}

// Función para verificar si el usuario está autenticado
async function checkAuthentication() {
    const token = localStorage.getItem('access_token');
    if (token) {
        try {
            const response = await fetch(`${apiUrl}/token/validate`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                document.getElementById('login-item').classList.add('d-none');
                document.getElementById('logout-item').classList.remove('d-none');
                document.getElementById('upload-item').classList.remove('d-none');
            } else {
                logout();
            }
        } catch (error) {
            console.error('Error validating token:', error);
            logout();
        }
    } else {
        document.getElementById('login-item').classList.remove('d-none');
        document.getElementById('logout-item').classList.add('d-none');
        document.getElementById('upload-item').classList.add('d-none');
    }
}

// Función para iniciar sesión
async function login(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${apiUrl}/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                username: username,
                password: password
            })
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('access_token', data.access_token);
            const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            loginModal.hide();
            checkAuthentication();
            showAlert('Sesión iniciada correctamente', 'success', 3000);
            
            // Recargar eventos para mostrar botones de edición
            loadEvents();
        } else {
            showAlert(data.detail || 'Error en la autenticación', 'danger');
        }
    } catch (error) {
        showAlert('Error de conexión', 'danger');
    }
}

// Función para cerrar sesión
function logout() {
    localStorage.removeItem('access_token');
    checkAuthentication();
    showAlert('Sesión cerrada', 'success');

    // Recargar eventos para actualizar la interfaz y ocultar los botones de edición
    loadEvents();
}

// Funciones auxiliares para manejo de fechas
function getLastDayOfMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

function getMonthStartEnd(year, month) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${getLastDayOfMonth(year, month)}`;
    return { startDate, endDate };
}

function constructDateQuery(year, month, startDate, endDate) {
    const currentYear = new Date().getFullYear();
    let startDateQuery = startDate;
    let endDateQuery = endDate;

    if (month && !year) {
        ({ startDate: startDateQuery, endDate: endDateQuery } = getMonthStartEnd(currentYear, month));
    } else if (year && !month) {
        startDateQuery = `${year}-01-01`;
        endDateQuery = `${year}-12-31`;
    } else if (year && month) {
        ({ startDate: startDateQuery, endDate: endDateQuery } = getMonthStartEnd(year, month));
    }

    return { startDateQuery, endDateQuery };
}

// Construir los parámetros de consulta para la búsqueda
function buildQueryParams() {
    const year = document.getElementById('year').value;
    const month = document.getElementById('month').value;
    const province = document.getElementById('province').value;
    const community = document.getElementById('community').value;
    const city = document.getElementById('city').value;
    const type = document.getElementById('type').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    const { startDateQuery, endDateQuery } = constructDateQuery(year, month, startDate, endDate);

    let query = `?limit=${limit}&offset=${offset}`;
    if (startDateQuery) query += `&start_date=${startDateQuery}`;
    if (endDateQuery) query += `&end_date=${endDateQuery}`;
    if (province) query += `&province=${encodeURIComponent(province)}`;
    if (community) query += `&community=${encodeURIComponent(community)}`;
    if (city) query += `&city=${encodeURIComponent(city)}`;
    if (type) query += `&type=${encodeURIComponent(type)}`;

    return { query, searchCriteria: { startDateQuery, endDateQuery, province, community, city, type } };
}

// Actualizar la fecha de última actualización en el footer
function updateLastUpdatedDate(lastUpdated) {
    if (lastUpdated) {
        const lastUpdatedElement = document.getElementById('last-updated');
        const lastUpdatedDate = new Date(lastUpdated).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        lastUpdatedElement.textContent = lastUpdatedDate;
    }
}

// Función para cargar eventos iniciales
async function loadEvents() {
    try {
        showLoading();
        const response = await fetch(`${apiUrl}/events/?limit=${limit}&offset=${offset}`);
        const data = await response.json();
        const events = data.events;
        totalEvents = data.total;

        updateLastUpdatedDate(data.last_updated);

        displayEvents(events);
        hideLoading();
        // No mostrar información de paginación y botón "Mostrar más" en la carga inicial
        document.getElementById('pagination-info').style.display = 'none';
        document.getElementById('load-more').style.display = 'none';
    } catch (error) {
        showAlert('Error al cargar eventos: ' + error, 'danger');
    }
}

// Función para buscar eventos según los criterios del formulario
async function searchEvents(event) {
    event.preventDefault(); // Prevenir el comportamiento predeterminado del formulario
    offset = 0; // Reiniciar el offset cuando se realiza una nueva búsqueda
    isSearching = true; // Indicamos que estamos en modo búsqueda

    const { query, searchCriteria } = buildQueryParams();
    const fullQuery = `${apiUrl}/events/search/${query}`;

    try {
        showLoading();
        const response = await fetch(fullQuery);
        const data = await response.json();

        let searchCriteriaString = `
            Fecha: ${searchCriteria.startDateQuery || 'Cualquier fecha de inicio'} a ${searchCriteria.endDateQuery || 'Cualquier fecha de fin'}, 
            Provincia: ${searchCriteria.province || 'Cualquier provincia'}, 
            Comunidad: ${searchCriteria.community || 'Cualquier comunidad'}, 
            Ciudad: ${searchCriteria.city || 'Cualquier ciudad'}, 
            Tipo: ${searchCriteria.type || 'Cualquier tipo'}
        `;

        if (data.detail) {
            displayNoResults(data.detail);
            totalEvents = 0;
            showAlert(`No encontramos eventos para: \n\n${searchCriteriaString}`, 'warning', 0);
        } else {
            const events = data.events;
            totalEvents = data.total;
            updateLastUpdatedDate(data.last_updated);
            showAlert(`¡Listo! Encontramos ${totalEvents} evento(s) para: \n\n${searchCriteriaString}`, 'success', 7000);
            displayEvents(events);
        }

        hideLoading();
        // Actualizar información de paginación y botón "Mostrar más"
        updatePaginationInfo();
        toggleLoadMoreButton();
    } catch (error) {
        hideLoading();
        showAlert(`Ocurrió un error al buscar eventos: ${error.message}`, 'danger');
    }
}

// Función para cargar más eventos al hacer clic en "Mostrar más"
async function loadMoreEvents() {
    offset += limit; // Incrementar el offset para cargar la siguiente página de resultados

    const { query } = buildQueryParams();
    const fullQuery = `${apiUrl}/events/search/${query}`;

    try {
        showLoading();
        const response = await fetch(fullQuery);
        const data = await response.json();
        const events = data.events;
        displayEvents(events, true);
        hideLoading();

        // Actualizar información de paginación y botón "Mostrar más"
        updatePaginationInfo();
        toggleLoadMoreButton();
    } catch (error) {
        hideLoading();
        showAlert('Error al cargar más eventos: ' + error, 'danger');
    }
}

// Funciones para formatear fechas y horas
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function formatTime(dateString) {
    if (!dateString) return ''; // Verificamos que la fecha no sea nula o undefined
    const parts = dateString.split(' ');
    if (parts.length < 2) return ''; // Verificamos que la fecha tenga parte de hora
    const time = parts[1];
    const [hours, minutes] = time.split(':');
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function isAllDayEvent(startTime, endTime) {
    return (startTime === "00:00" && endTime === "23:59");
}

function formatDateToUTC(dateString) {
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth(); // 0-indexed
    const day = date.getUTCDate();
    return { year, month, day };
}

function formatEventDate(startDate, endDate) {
    const start = formatDateToUTC(startDate);
    const end = formatDateToUTC(endDate);

    const startDay = start.day;
    const startMonth = new Date(Date.UTC(start.year, start.month)).toLocaleDateString('es-ES', { month: 'long' });
    const startYear = start.year;

    const endDay = end.day;
    const endMonth = new Date(Date.UTC(end.year, end.month)).toLocaleDateString('es-ES', { month: 'long' });
    const endYear = end.year;

    if (startYear === endYear) {
        if (start.month === end.month) {
            if (startDay === endDay) {
                return `${startDay} de ${startMonth} de ${startYear}`;
            } else {
                return `${startDay} al ${endDay} de ${startMonth} de ${startYear}`;
            }
        } else {
            return `${startDay} de ${startMonth} al ${endDay} de ${endMonth} de ${startYear}`;
        }
    } else {
        return `${startDay} de ${startMonth} de ${startYear} al ${endDay} de ${endMonth} de ${endYear}`;
    }
}

// Función para mostrar los eventos en la página
function displayEvents(events, append = false) {
    const eventsContainer = document.getElementById('events');

    if (!append) {
        eventsContainer.innerHTML = '';
    }

    events.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = 'col';

        // Aseguramos que los enlaces en la descripción se abran en una nueva pestaña
        let descriptionWithLinks = event.description;
        if (descriptionWithLinks.includes('<a ')) {
            descriptionWithLinks = descriptionWithLinks.replace(/<a /g, '<a target="_blank" ');
        }

        // Formatear fechas y horas
        const startTimeFormatted = formatTime(event.start_date);
        const endTimeFormatted = formatTime(event.end_date);

        // Determinar si el evento es de todo el día
        const allDayEvent = isAllDayEvent(startTimeFormatted, endTimeFormatted);

        // Formatear la fecha del evento de manera más legible
        const dateDisplay = formatEventDate(event.start_date, event.end_date);
        const timeDisplay = allDayEvent ? '' : ` (${startTimeFormatted} a ${endTimeFormatted})`;

        // Crear la tarjeta de Bootstrap con diseño mejorado
        eventCard.innerHTML = `
            <div class="card h-100 event-card">
                <!-- Aquí puedes añadir una imagen destacada si está disponible -->
                <!-- <img src="${event.image_url || 'ruta/por/defecto.jpg'}" class="card-img-top" alt="${event.summary}"> -->
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
                    ${localStorage.getItem('access_token') ? `
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

        // Añadir evento de click a la tarjeta para mostrar el modal con los detalles del evento
        eventCard.addEventListener('click', function() {
            showEventDetails(event);
        });

        // Añadir evento de click al botón "Ver detalles"
        const viewDetailsBtn = eventCard.querySelector('.view-details-btn');
        viewDetailsBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            showEventDetails(event);
        });

        // Añadir evento de click al botón "Compartir"
        const shareBtn = eventCard.querySelector('.share-event-btn');
        shareBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            shareEvent(event);
        });

        // Añadir eventos de click a los botones de edición y eliminación
        if (localStorage.getItem('access_token')) {
            const editBtn = eventCard.querySelector('.edit-event-btn');
            const deleteBtn = eventCard.querySelector('.delete-event-btn');

            editBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                editEvent(event.id);
            });

            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                confirmDeleteEvent(event.id);
            });
        }

        if (event.description.length > 200) {
            eventCard.querySelector('.show-more').addEventListener('click', function (e) {
                e.preventDefault();
                const description = eventCard.querySelector('.event-description');
                description.classList.toggle('expanded');
                this.textContent = description.classList.contains('expanded') ? 'Mostrar menos' : 'Mostrar más';
            });
        }

        eventsContainer.appendChild(eventCard);
    });
}

// Función para editar un evento
async function editEvent(eventId) {
    currentEventId = eventId;

    // Ocultar el modal de detalles del evento si está abierto
    const eventDetailsModalElement = document.getElementById('eventDetailsModal');
    const eventDetailsModal = bootstrap.Modal.getInstance(eventDetailsModalElement);
    if (eventDetailsModal) {
        eventDetailsModal.hide();
    }

    try {
        const response = await fetch(`${apiUrl}/events/${eventId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const event = await response.json();

        // Rellenar el formulario con los datos del evento
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

        // Mostrar el modal de edición solo si todo está en orden
        const editModal = new bootstrap.Modal(document.getElementById('editEventModal'));
        editModal.show();
    } catch (error) {
        console.error('Error al cargar los detalles del evento:', error);
        showAlert('Error al cargar los detalles del evento', 'danger');
    }
}

// Función para actualizar un evento
async function updateEvent(event) {
    event.preventDefault();
    
    const updatedEvent = {
        summary: document.getElementById('edit-summary').value,
        start_date: formatToStandardDateTime(
            document.getElementById('edit-start-date').value, 
            document.getElementById('edit-start-time').value
        ),
        end_date: formatToStandardDateTime(
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
        const response = await fetch(`${apiUrl}/events/${currentEventId}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify(updatedEvent)
        });

        if (response.ok) {
            const editModal = bootstrap.Modal.getInstance(document.getElementById('editEventModal'));
            editModal.hide();
            loadEvents();
            showAlert('Evento actualizado con éxito', 'success');
        } else {
            showAlert('Error al actualizar el evento', 'danger');
        }
    } catch (error) {
        showAlert('Error de conexión', 'danger');
    }
}

// Función para mostrar mensaje cuando no hay resultados
function displayNoResults(message) {
    const eventsContainer = document.getElementById('events');
    eventsContainer.innerHTML = `<div class="col-12"><p class="text-center text-muted">${message}</p></div>`;
}

// Función para actualizar la información de paginación
function updatePaginationInfo() {
    const paginationInfo = document.getElementById('pagination-info');
    if (isSearching && totalEvents > 0) {
        paginationInfo.textContent = `Mostrando ${Math.min(offset + limit, totalEvents)} de ${totalEvents} eventos`;
        paginationInfo.style.display = 'block';
    } else {
        paginationInfo.style.display = 'none';
    }
}

// Función para mostrar u ocultar el botón "Mostrar más"
function toggleLoadMoreButton() {
    const loadMoreButton = document.getElementById('load-more');
    if (isSearching && totalEvents > offset + limit) {
        loadMoreButton.style.display = 'block';
    } else {
        loadMoreButton.style.display = 'none';
    }
}

// Función para mostrar alertas en la interfaz
function showAlert(message, type = 'info', timeout = null) {
    const alertPlaceholder = document.getElementById('alert-placeholder');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    alertPlaceholder.appendChild(alert);

    // Determinar el tiempo de visualización en función del tipo de alerta si no se proporciona
    if (timeout === null) {
        if (type === 'danger') {
            timeout = 0; // Se queda fijo
        } else if (type === 'warning') {
            timeout = 5000; // 5 segundos
        } else {
            timeout = 1500; // 1.5 segundos por defecto para otros tipos
        }
    }

    // Si timeout es mayor que 0, programar el cierre automático
    if (timeout > 0) {
        setTimeout(() => {
            alert.classList.remove('show');
            alert.classList.add('hide');
            setTimeout(() => {
                alertPlaceholder.removeChild(alert);
            }, 500);
        }, timeout);
    }
}

// Funciones para mostrar y ocultar el indicador de carga
function showLoading() {
    document.getElementById('loading-indicator').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading-indicator').style.display = 'none';
}

// Función para confirmar la eliminación de un evento
function confirmDeleteEvent(eventId) {
    eventIdToDelete = eventId;

    // Ocultar el modal de detalles del evento si está abierto
    const eventDetailsModalElement = document.getElementById('eventDetailsModal');
    const eventDetailsModal = bootstrap.Modal.getInstance(eventDetailsModalElement);
    if (eventDetailsModal) {
        eventDetailsModal.hide();
    }

    const deleteModal = new bootstrap.Modal(document.getElementById('deleteEventModal'));
    deleteModal.show();
}

// Función para eliminar un evento
async function deleteEvent() {
    try {
        const response = await fetch(`${apiUrl}/events/${eventIdToDelete}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });

        if (response.ok) {
            const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteEventModal'));
            deleteModal.hide();
            loadEvents();
            showAlert('Evento eliminado con éxito', 'success');
        } else {
            showAlert('Error al eliminar el evento', 'danger');
        }
    } catch (error) {
        showAlert('Error de conexión', 'danger');
    }
}

// Función para formatear fecha y hora al formato estándar
function formatToStandardDateTime(date, time) {
    // Asegura que la fecha y hora sigan el formato: "YYYY-MM-DD HH:MM:SS+00:00"
    return `${date} ${time}:00+00:00`;
}

// Función para subir un nuevo evento
async function uploadEvent(event) {
    event.preventDefault();
    
    const newEvent = {
        summary: document.getElementById('upload-summary').value,
        start_date: formatToStandardDateTime(
            document.getElementById('upload-start-date').value, 
            document.getElementById('upload-start-time').value
        ),
        end_date: formatToStandardDateTime(
            document.getElementById('upload-end-date').value, 
            document.getElementById('upload-end-time').value
        ),
        province: document.getElementById('upload-province').value,
        community: document.getElementById('upload-community').value,
        city: document.getElementById('upload-city').value,
        type: document.getElementById('upload-type').value,
        address: document.getElementById('upload-address').value,
        description: document.getElementById('upload-description').value
    };

    try {
        const response = await fetch(`${apiUrl}/events/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify(newEvent)
        });

        if (response.ok) {
            const uploadModal = bootstrap.Modal.getInstance(document.getElementById('uploadEventModal'));
            uploadModal.hide();
            loadEvents();
            showAlert('Evento subido con éxito', 'success');
        } else {
            showAlert('Error al subir el evento', 'danger');
        }
    } catch (error) {
        showAlert('Error de conexión', 'danger');
    }
}

// Función para alternar la visualización de la búsqueda avanzada
function toggleAdvancedSearch() {
    const advancedSearchDiv = document.getElementById('advanced-search');
    const toggleButton = document.getElementById('toggle-advanced-search');

    if (advancedSearchDiv.style.display === 'none') {
        advancedSearchDiv.style.display = 'block';
        toggleButton.textContent = 'Ocultar búsqueda avanzada';
    } else {
        advancedSearchDiv.style.display = 'none';
        toggleButton.textContent = 'Búsqueda avanzada';
    }
}

// Función para mostrar los detalles de un evento en un modal
function showEventDetails(event) {
    // Cambiar el título del modal al nombre del evento
    document.getElementById('eventDetailsModalLabel').textContent = event.summary;

    // Formatear la fecha y hora del evento
    const startTimeFormatted = formatTime(event.start_date);
    const endTimeFormatted = formatTime(event.end_date);
    const allDayEvent = isAllDayEvent(startTimeFormatted, endTimeFormatted);
    const dateDisplay = formatEventDate(event.start_date, event.end_date);
    const timeDisplay = allDayEvent ? 'Todo el día' : `${startTimeFormatted} a ${endTimeFormatted}`;

    // Rellenar los campos del modal con la información del evento
    document.getElementById('modalEventDate').textContent = dateDisplay;
    document.getElementById('modalEventTime').textContent = timeDisplay;
    document.getElementById('modalEventCity').textContent = `${event.city}, ${event.community}`;
    document.getElementById('modalEventProvince').textContent = event.province;
    document.getElementById('modalEventAddress').textContent = event.address;
    document.getElementById('modalEventType').textContent = event.type;
    document.getElementById('modalEventDescription').innerHTML = event.description;

    // Mostrar botones de administrador si el usuario está autenticado
    if (localStorage.getItem('access_token')) {
        document.getElementById('adminButtons').classList.remove('d-none');

        // Asignar eventos a los botones de editar y eliminar
        document.getElementById('editEventModalBtn').onclick = function() {
            editEvent(event.id);
        };
        document.getElementById('deleteEventModalBtn').onclick = function() {
            confirmDeleteEvent(event.id);
        };
    } else {
        document.getElementById('adminButtons').classList.add('d-none');
    }

    // Preparar botones de acción
    document.getElementById('addToCalendarBtn').onclick = function() {
        const currentEvent = event; // Capturamos el objeto event
        loadCalendarScript(function() {
            CalendarUtils.addToCalendar(currentEvent);
        });
    };

    document.getElementById('getDirectionsBtn').onclick = function() {
        getDirections(event);
    };

    document.getElementById('shareEventBtn').onclick = function() {
        shareEvent(event);
    };

    // Actualizar la URL para incluir el ID del evento
    history.pushState(null, '', `?id=${event.id}`);

    // Actualizar meta tags
    updateMetaTags(event);

    // Mostrar el modal
    const eventDetailsModal = new bootstrap.Modal(document.getElementById('eventDetailsModal'));
    eventDetailsModal.show();
}

// Evento cuando se cierra el modal de detalles del evento
document.getElementById('eventDetailsModal').addEventListener('hidden.bs.modal', function () {
    // Restablecer la URL original cuando se cierra el modal
    history.replaceState(null, '', window.location.pathname);
});

// Función para actualizar las meta etiquetas de la página
function updateMetaTags(event) {
    // Cambiar el título de la página al nombre del evento
    document.title = `${event.summary} | Eventos Comic`;

    // Actualizar la meta descripción
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = "description";
        document.head.appendChild(metaDescription);
    }
    metaDescription.content = `${event.summary} en ${event.city}, ${event.community} el ${formatEventDate(event.start_date, event.end_date)}.`;

    // Actualizar las meta etiquetas Open Graph
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
    }
    ogTitle.content = event.summary;

    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
        ogDescription = document.createElement('meta');
        ogDescription.setAttribute('property', 'og:description');
        document.head.appendChild(ogDescription);
    }
    ogDescription.content = `${event.summary} en ${event.city}, ${event.community}.`;

    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
        ogUrl = document.createElement('meta');
        ogUrl.setAttribute('property', 'og:url');
        document.head.appendChild(ogUrl);
    }
    ogUrl.content = window.location.href;
}

// Evento para actualizar la comunidad autónoma al seleccionar una provincia
document.getElementById('upload-province').addEventListener('change', function() {
    const province = this.value;
    const community = provincesAndCommunities[province];
    document.getElementById('upload-community').value = community || '';
});

document.getElementById('edit-province').addEventListener('change', function() {
    const province = this.value;
    const community = provincesAndCommunities[province];
    document.getElementById('edit-community').value = community || '';
});

function shareEvent(event) {
    const eventUrl = `${window.location.origin}?id=${event.id}`;
    const shareData = {
        title: event.summary,
        text: `${event.summary} - ${formatEventDate(event.start_date, event.end_date)} en ${event.city}, ${event.province}.`,
        url: eventUrl
    };

    if (navigator.share) {
        navigator.share(shareData)
            .then(() => {
                console.log('Evento compartido exitosamente');
            })
            .catch((error) => {
                console.error('Error al compartir el evento:', error);
            });
    } else {
        // Si la Web Share API no está disponible, copiar al portapapeles
        copyToClipboard(eventUrl);
        showAlert('El enlace del evento se ha copiado al portapapeles.', 'info', 3000);
    }
}

// Función para copiar texto al portapapeles
function copyToClipboard(text) {
    const tempInput = document.createElement('input');
    tempInput.style.position = 'fixed';
    tempInput.style.opacity = '0';
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
}

function loadCalendarScript(callback) {
    if (typeof CalendarUtils !== 'undefined') {
        // El script ya está cargado
        callback();
    } else {
        var script = document.createElement('script');
        script.src = 'js/calendar.js';
        script.onload = function() {
            callback();
        };
        script.onerror = function() {
            showAlert('Error al cargar la funcionalidad del calendario.', 'danger');
        };
        document.head.appendChild(script);
    }
}

function getDirections(event) {
    // Implementar la funcionalidad para obtener direcciones
    const address = encodeURIComponent(`${event.address}, ${event.city}, ${event.province}, España`);
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${address}`;
    window.open(mapsUrl, '_blank');
}
