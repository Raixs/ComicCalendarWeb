const apiUrl = 'https://api.eventoscomic.com/v1';
let offset = 0;
const limit = 20; // Número de resultados por página
let totalEvents = 0; // Total de eventos retornados por la API
let isSearching = false; // Indica si estamos en modo búsqueda o no

document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    document.getElementById('current-year').textContent = new Date().getFullYear();
});

async function loadEvents() {
    try {
        showLoading();
        const response = await fetch(`${apiUrl}/events/?limit=${limit}&offset=${offset}`);
        const data = await response.json();
        const events = data.events;
        totalEvents = data.total;
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

    const year = document.getElementById('year').value;
    const month = document.getElementById('month').value;
    const province = document.getElementById('province').value;

    let query = `${apiUrl}/events/search/?limit=${limit}&offset=${offset}`;

    // Si el mes está seleccionado pero no el año, usa el año actual
    const currentYear = new Date().getFullYear();
    if (month && !year) {
        query += `&date=${currentYear}-${month}`;
    } else if (year) {
        query += `&date=${year}`;
        if (month) {
            query += `-${month}`;
        }
    }

    if (province) query += `&province=${province}`;

    try {
        showLoading();
        const response = await fetch(query);
        const data = await response.json();

        if (data.detail) {
            displayNoResults(data.detail);
            totalEvents = 0;
            showAlert('No se encontraron eventos para los criterios dados', 'warning');
        } else {
            const events = data.events;
            totalEvents = data.total;
            displayEvents(events);
            showAlert('Eventos cargados correctamente', 'success');
        }

        hideLoading();
        // Actualizar información de paginación y botón "Mostrar más"
        updatePaginationInfo();
        toggleLoadMoreButton();
    } catch (error) {
        hideLoading();
        showAlert('Error searching events: ' + error, 'danger');
    }
}

async function loadMoreEvents() {
    offset += limit; // Incrementar el offset para cargar la siguiente página de resultados

    const year = document.getElementById('year').value;
    const month = document.getElementById('month').value;
    const province = document.getElementById('province').value;

    let query = `${apiUrl}/events/search/?limit=${limit}&offset=${offset}`;

    // Si el mes está seleccionado pero no el año, usa el año actual
    const currentYear = new Date().getFullYear();
    if (month && !year) {
        query += `&date=${currentYear}-${month}`;
    } else if (year) {
        query += `&date=${year}`;
        if (month) {
            query += `-${month}`;
        }
    }

    if (province) query += `&province=${province}`;

    try {
        showLoading();
        const response = await fetch(query);
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

function displayEvents(events, append = false) {
    const eventsContainer = document.getElementById('events');

    if (!append) {
        eventsContainer.innerHTML = '';
    }

    events.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = 'col-md-4 mb-4';

        eventCard.innerHTML = `
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${event.summary}</h5>
                    <p class="card-text"><i class="fas fa-calendar-alt"></i> <strong>Fecha:</strong> ${event.start_date} - ${event.end_date}</p>
                    <p class="card-text"><i class="fas fa-map-marker-alt"></i> <strong>Provincia:</strong> ${event.province}</p>
                    <p class="card-text"><i class="fas fa-map-pin"></i> <strong>Dirección:</strong> ${event.address}</p>
                    <p class="card-text event-description"><i class="fas fa-info-circle"></i> <strong>Descripción:</strong> ${event.description}</p>
                    ${event.description.length > 200 ? `<span class="show-more">Mostrar más</span>` : ''}
                </div>
            </div>
        `;

        if (event.description.length > 200) {
            eventCard.querySelector('.show-more').addEventListener('click', function() {
                const description = eventCard.querySelector('.event-description');
                description.classList.toggle('expanded');
                this.textContent = description.classList.contains('expanded') ? 'Mostrar menos' : 'Mostrar más';
            });
        }

        eventsContainer.appendChild(eventCard);
    });
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

function showAlert(message, type = 'info') {
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

    setTimeout(() => {
        $(alert).alert('close');
    }, 3000); // El mensaje desaparecerá después de 3 segundos
}

function showLoading() {
    document.getElementById('loading-indicator').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading-indicator').style.display = 'none';
}
