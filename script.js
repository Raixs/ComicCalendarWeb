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
        const response = await fetch(`${apiUrl}/events/?limit=${limit}&offset=${offset}`);
        const data = await response.json();
        const events = data.events;
        totalEvents = data.total;
        displayEvents(events);

        // No mostrar información de paginación y botón "Mostrar más" en la carga inicial
        document.getElementById('pagination-info').style.display = 'none';
        document.getElementById('load-more').style.display = 'none';
    } catch (error) {
        console.error('Error loading events:', error);
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
    if (year) query += `&date=${year}`;
    if (month) query += `-${month}`;
    if (province) query += `&province=${province}`;

    try {
        const response = await fetch(query);
        const data = await response.json();

        if (data.detail) {
            displayNoResults(data.detail);
            totalEvents = 0;
        } else {
            const events = data.events;
            totalEvents = data.total;
            displayEvents(events);
        }

        // Actualizar información de paginación y botón "Mostrar más"
        updatePaginationInfo();
        toggleLoadMoreButton();
    } catch (error) {
        console.error('Error searching events:', error);
    }
}

async function loadMoreEvents() {
    offset += limit; // Incrementar el offset para cargar la siguiente página de resultados

    const year = document.getElementById('year').value;
    const month = document.getElementById('month').value;
    const province = document.getElementById('province').value;

    let query = `${apiUrl}/events/search/?limit=${limit}&offset=${offset}`;
    if (year) query += `&date=${year}`;
    if (month) query += `-${month}`;
    if (province) query += `&province=${province}`;

    try {
        const response = await fetch(query);
        const data = await response.json();
        const events = data.events;
        displayEvents(events, true);

        // Actualizar información de paginación y botón "Mostrar más"
        updatePaginationInfo();
        toggleLoadMoreButton();
    } catch (error) {
        console.error('Error loading more events:', error);
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
                    <p class="card-text"><strong>Fecha:</strong> ${event.start_date} - ${event.end_date}</p>
                    <p class="card-text"><strong>Provincia:</strong> ${event.province}</p>
                    <p class="card-text"><strong>Dirección:</strong> ${event.address}</p>
                    <p class="card-text event-description"><strong>Descripción:</strong> ${event.description}</p>
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
