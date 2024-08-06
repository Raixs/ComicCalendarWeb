const apiUrl = 'http://comiccalendar.duckdns.org';

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
        eventDate.textContent = `Date: ${event.start_date} - ${event.end_date}`;
        eventCard.appendChild(eventDate);

        const eventProvince = document.createElement('p');
        eventProvince.textContent = `Province: ${event.province}`;
        eventCard.appendChild(eventProvince);

        const eventAddress = document.createElement('p');
        eventAddress.textContent = `Address: ${event.address}`;
        eventCard.appendChild(eventAddress);

        const eventDescription = document.createElement('p');
        eventDescription.textContent = `Description: ${event.description}`;
        eventCard.appendChild(eventDescription);

        eventsContainer.appendChild(eventCard);
    });
}
