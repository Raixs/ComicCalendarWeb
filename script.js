const apiUrl = 'https://eventoscomic.com';
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

        // Mostrar información de paginación solo si es una búsqueda
        if (isSearching) {
            updatePaginationInfo();

            // Mostrar el botón "Mostrar más" si hay más eventos para cargar
            if (totalEvents > offset + limit) {
                document.getElementById('load-more').style.display = 'block';
            } else {
                document.getElementById('load-more').style.display = 'none';
            }
        } else {
            document.getElementById('load-more').style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

async function searchEvents(event) {
    event.preventDefault(); // Prevenir el comportamiento predeterminado del formulario

    offset = 0; // Reiniciar el offset cuando se realiza una nueva búsqueda
    isSearching = true; // Indicamos que estamos en modo búsqueda

    const date = document.getElementById('date').value;
    const province = document.getElementById('province').value;

    let query = `${apiUrl}/events/search/?limit=${limit}&offset=${offset}`;
    if (date) query += `&date=${date}`;
    if (province) query += `&province=${province}`;

    try {
        const response = await fetch(query);
        const data = await response.json();
        const events = data.events;
        totalEvents = data.total;
        displayEvents(events);

        // Mostrar información de paginación
        updatePaginationInfo();

        // Mostrar el botón "Mostrar más" si hay más eventos para cargar
        if (totalEvents > offset + limit) {
            document.getElementById('load-more').style.display = 'block';
        } else {
            document.getElementById('load-more').style.display = 'none';
        }
    } catch (error) {
        console.error('Error searching events:', error);
    }
}

async function loadMoreEvents() {
    offset += limit; // Incrementar el offset para cargar la siguiente página de resultados

    const date = document.getElementById('date').value;
    const province = document.getElementById('province').value;

    let query = `${apiUrl}/events/search/?limit=${limit}&offset=${offset}`;
    if (date) query += `&date=${date}`;
    if (province) query += `&province=${province}`;

    try {
        const response = await fetch(query);
        const data = await response.json();
        const events = data.events;
        displayEvents(events, true);

        // Mostrar información de paginación
        updatePaginationInfo();

        // Ocultar el botón "Mostrar más" si no hay más eventos para cargar
        if (totalEvents <= offset + limit) {
            document.getElementById('load-more').style.display = 'none';
        }
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

function updatePaginationInfo() {
    const paginationInfo = document.getElementById('pagination-info');
    paginationInfo.textContent = `Mostrando ${Math.min(offset + limit, totalEvents)} de ${totalEvents} eventos`;
}
