const apiUrl = 'https://album.hanspereira.com';

document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
});

async function loadEvents() {
    try {
        const response = await fetch(`${apiUrl}/events/?limit=10`);
        const events = await response.json();
        displayEvents(events);
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

async function searchEvents() {
    const date = document.getElementById('date').value;
    const province = document.getElementById('province').value;

    let query = `${apiUrl}/events/search/?`;
    if (date) query += `date=${date}&`;
    if (province) query += `province=${province}&`;

    try {
        const response = await fetch(query);
        const events = await response.json();
        displayEvents(events);
    } catch (error) {
        console.error('Error searching events:', error);
    }
}

function displayEvents(events) {
    const eventsContainer = document.getElementById('events');
    eventsContainer.innerHTML = '';

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
                showMore.textContent = eventDescription.classList.contains('expanded') ? 'Show less' : 'Show more';
            };
            eventCard.appendChild(showMore);
        }

        eventsContainer.appendChild(eventCard);
    });
}
