const apiUrl = 'https://eventoscomic.com';
let offset = 0;
const limit = 20; // Número de resultados por página
let totalEvents = 0; // Total de eventos retornados por la API
let isSearching = false; // Indica si estamos en modo búsqueda o no

document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
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
        eventCard.className = 'event-card';

        const eventTitle = document.createElement('h2');
        eventTitle.textContent = event.summary;
        eventCard.appendChild(eventTitle);

        const eventDate = document.createElement('p');
        eventDate.textContent = `Fecha: ${event.start_date} - ${event.end_date}`;
        eventCard.appendChild(eventDate);

        const eventProvince = document.createElement('p');
        eventProvince.textContent = `Provincia: ${event.province}`;
        eventCard.appendChild(eventProvince);

        const eventAddress = document.createElement('p');
        eventAddress.textContent = `Dirección: ${event.address}`;
        eventCard.appendChild(eventAddress);

        const eventDescription = document.createElement('p');
        eventDescription.className = 'event-description';
        eventDescription.innerHTML = `Descripción: ${event.description}`;
        eventCard.appendChild(eventDescription);

        if (event.description.length > 200) { // ajustar el límite de caracteres según sea necesario
            const showMore = document.createElement('span');
            showMore.className = 'show-more';
            showMore.textContent = 'Mostrar más';
            showMore.onclick = () => {
                eventDescription.classList.toggle('expanded');
                showMore.textContent = eventDescription.classList.contains('expanded') ? 'Mostrar menos' : 'Mostrar más';
            };
            eventCard.appendChild(showMore);
        }

        eventsContainer.appendChild(eventCard);
    });
}

function updatePaginationInfo() {
    const paginationInfo = document.getElementById('pagination-info');
    paginationInfo.textContent = `Mostrando ${Math.min(offset + limit, totalEvents)} de ${totalEvents} eventos`;
}
