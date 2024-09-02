const apiUrl = 'https://api.eventoscomic.com/v1';
let offset = 0;
const limit = 20; // Número de resultados por página
let totalEvents = 0; // Total de eventos retornados por la API
let isSearching = false; // Indica si estamos en modo búsqueda o no
let currentEventId = null;
let eventIdToDelete = null;

document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    checkAuthentication();
});

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
            $('#loginModal').modal('hide');
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

function logout() {
    localStorage.removeItem('access_token');
    checkAuthentication();
    showAlert('Sesión cerrada', 'success');

    // Recargar eventos para actualizar la interfaz y ocultar los botones de edición
    loadEvents();
}

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
    if (province) query += `&province=${province}`;
    if (community) query += `&community=${community}`;
    if (city) query += `&city=${city}`;
    if (type) query += `&type=${type}`;

    return { query, searchCriteria: { startDateQuery, endDateQuery, province, community, city, type } };
}

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
        showAlert('Error loading events: ' + error, 'danger');
    }
}

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
        showAlert('Error loading more events: ' + error, 'danger');
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function formatTime(dateString) {
    const [date, time] = dateString.split(' ');
    const [hours, minutes] = time.split(':');
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function isAllDayEvent(startTime, endTime) {
    return (startTime === "00:00" && endTime === "23:59");
}

function formatEventDate(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const startDay = start.getDate();
    const startMonth = start.toLocaleDateString('es-ES', { month: 'long' });
    const startYear = start.getFullYear();

    const endDay = end.getDate();
    const endMonth = end.toLocaleDateString('es-ES', { month: 'long' });
    const endYear = end.getFullYear();

    if (startYear === endYear) {
        if (startMonth === endMonth) {
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

function displayEvents(events, append = false) {
    const eventsContainer = document.getElementById('events');

    if (!append) {
        eventsContainer.innerHTML = '';
    }

    events.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = 'col-md-4 mb-4';

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

        // Crear la tarjeta de Bootstrap
        eventCard.innerHTML = `
            <div class="card h-100 shadow-sm">
                <div class="card-body">
                    <h5 class="card-title">${event.summary}</h5>
                    <p class="card-text"><i class="fas fa-calendar-alt"></i> <strong>Fecha:</strong> ${dateDisplay}${timeDisplay}</p>
                    <p class="card-text"><i class="fas fa-map-marker-alt"></i> <strong>Ciudad:</strong> ${event.city}, ${event.community}</p>
                    <p class="card-text"><i class="fas fa-map-marker-alt"></i> <strong>Provincia:</strong> ${event.province}</p>
                    <p class="card-text"><i class="fas fa-tag"></i> <strong>Tipo:</strong> ${event.type}</p>
                    <p class="card-text"><i class="fas fa-map-pin"></i> <strong>Dirección:</strong> ${event.address}</p>
                    <p class="card-text event-description"><i class="fas fa-info-circle"></i> <strong>Descripción:</strong> ${descriptionWithLinks}</p>
                    ${event.description.length > 200 ? `<a href="#" class="btn btn-link show-more">Mostrar más</a>` : ''}
                    ${localStorage.getItem('access_token') ? `
                        <button class="btn btn-warning mt-2" onclick="editEvent(${event.id})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-danger mt-2" onclick="confirmDeleteEvent(${event.id})">
                            <i class="fas fa-trash-alt"></i> Eliminar
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

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

async function editEvent(eventId) {
    currentEventId = eventId;

    try {
        const response = await fetch(`${apiUrl}/events/${eventId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const event = await response.json();

        // Comprobamos y asignamos valores solo si los elementos existen en el DOM
        const summaryElement = document.getElementById('edit-summary');
        const startDateElement = document.getElementById('edit-start-date');
        const startTimeElement = document.getElementById('edit-start-time');
        const endDateElement = document.getElementById('edit-end-date');
        const endTimeElement = document.getElementById('edit-end-time');
        const provinceElement = document.getElementById('edit-province');
        const communityElement = document.getElementById('edit-community');
        const cityElement = document.getElementById('edit-city');
        const typeElement = document.getElementById('edit-type');
        const addressElement = document.getElementById('edit-address');
        const descriptionElement = document.getElementById('edit-description');

        if (summaryElement) summaryElement.value = event.summary;
        if (startDateElement) startDateElement.value = event.start_date.split(' ')[0];
        if (startTimeElement) startTimeElement.value = event.start_date.split(' ')[1].slice(0, 5); // Formato HH:MM
        if (endDateElement) endDateElement.value = event.end_date.split(' ')[0];
        if (endTimeElement) endTimeElement.value = event.end_date.split(' ')[1].slice(0, 5); // Formato HH:MM
        if (provinceElement) provinceElement.value = event.province;
        if (communityElement) communityElement.value = event.community;
        if (cityElement) cityElement.value = event.city;
        if (typeElement) typeElement.value = event.type;
        if (addressElement) addressElement.value = event.address;
        if (descriptionElement) descriptionElement.value = event.description;

        // Mostrar el modal de edición solo si todo está en orden
        $('#editEventModal').modal('show');
    } catch (error) {
        console.error('Error al cargar los detalles del evento:', error);
        showAlert('Error al cargar los detalles del evento', 'danger');
    }
}

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
            $('#editEventModal').modal('hide');
            loadEvents();
            showAlert('Evento actualizado con éxito', 'success');
        } else {
            showAlert('Error al actualizar el evento', 'danger');
        }
    } catch (error) {
        showAlert('Error de conexión', 'danger');
    }
}

function displayNoResults(message) {
    const eventsContainer = document.getElementById('events');
    eventsContainer.innerHTML = `<div class="col-12"><p class="text-center text-muted">${message}</p></div>`;
}

function updatePaginationInfo() {
    const paginationInfo = document.getElementById('pagination-info');
    if (isSearching && totalEvents > 0) {
        paginationInfo.textContent = `Mostrando ${Math.min(offset + limit, totalEvents)} de ${totalEvents} eventos`;
        paginationInfo.style.display = 'block';
    } else {
        paginationInfo.style.display = 'none';
    }
}

function toggleLoadMoreButton() {
    const loadMoreButton = document.getElementById('load-more');
    if (isSearching && totalEvents > offset + limit) {
        loadMoreButton.style.display = 'block';
    } else {
        loadMoreButton.style.display = 'none';
    }
}

function showAlert(message, type = 'info', timeout = null) {
    const alertPlaceholder = document.getElementById('alert-placeholder');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
    alert.innerHTML = `
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
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
            $(alert).alert('close');
        }, timeout);
    }
}

function showLoading() {
    document.getElementById('loading-indicator').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading-indicator').style.display = 'none';
}

function confirmDeleteEvent(eventId) {
    eventIdToDelete = eventId;
    $('#deleteEventModal').modal('show');
}

async function deleteEvent() {
    try {
        const response = await fetch(`${apiUrl}/events/${eventIdToDelete}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });

        if (response.ok) {
            $('#deleteEventModal').modal('hide');
            loadEvents();
            showAlert('Evento eliminado con éxito', 'success');
        } else {
            showAlert('Error al eliminar el evento', 'danger');
        }
    } catch (error) {
        showAlert('Error de conexión', 'danger');
    }
}

function formatToStandardDateTime(date, time) {
    // Asegura que la fecha y hora sigan el formato: "YYYY-MM-DD HH:MM:SS+00:00"
    return `${date} ${time}:00+00:00`;
}

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
            $('#uploadEventModal').modal('hide');
            loadEvents();
            showAlert('Evento subido con éxito', 'success');
        } else {
            showAlert('Error al subir el evento', 'danger');
        }
    } catch (error) {
        showAlert('Error de conexión', 'danger');
    }
}

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
