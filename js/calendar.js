// calendar.js

var CalendarUtils = (function() {
    function addToCalendar(event) {
        // Crear el contenido del archivo .ics
        const icsContent = generateICS(event);

        // Crear un blob del contenido
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });

        // Crear una URL para el blob
        const url = URL.createObjectURL(blob);

        // Crear un enlace temporal para descargar el archivo
        const link = document.createElement('a');
        link.href = url;
        link.download = `${event.summary}.ics`;
        document.body.appendChild(link);
        link.click();

        // Limpiar
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function generateICS(event) {
        const isAllDayEvent = checkIfAllDayEvent(event.start_date, event.end_date);

        let dtstart, dtend;
        let dtstartProperty = 'DTSTART';
        let dtendProperty = 'DTEND';

        if (isAllDayEvent) {
            dtstart = formatDateToICSDate(new Date(event.start_date));
            dtend = formatDateToICSDate(addDays(new Date(event.end_date), 1)); // Añadir un día a DTEND
            dtstartProperty += ';VALUE=DATE';
            dtendProperty += ';VALUE=DATE';
        } else {
            dtstart = formatDateToICSTime(new Date(event.start_date));
            dtend = formatDateToICSTime(new Date(event.end_date));
            dtstartProperty += `;TZID=Europe/Madrid`;
            dtendProperty += `;TZID=Europe/Madrid`;
        }

        const summary = escapeICSString(event.summary);
        const description = escapeICSString(event.description); // Incluimos el HTML tal cual
        const location = escapeICSString(`${event.address}, ${event.city}, ${event.province}, España`);

        // Extraer el primer enlace de la descripción para el campo URL
        const eventUrl = extractFirstLink(event.description);

        const icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TuOrganizacion//TuAplicacion//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
${isAllDayEvent ? '' : getTimeZoneDefinition()}
BEGIN:VEVENT
UID:${event.id}@tudominio.com
DTSTAMP:${formatDateToICSTime(new Date())}
${dtstartProperty}:${dtstart}
${dtendProperty}:${dtend}
SUMMARY:${summary}
DESCRIPTION:${description}
LOCATION:${location}
${eventUrl ? `URL:${escapeICSString(eventUrl)}` : ''}
END:VEVENT
END:VCALENDAR
`.trim();

        return icsContent;
    }

    function checkIfAllDayEvent(startDateStr, endDateStr) {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        return startDate.getHours() === 0 && startDate.getMinutes() === 0 &&
               endDate.getHours() === 23 && endDate.getMinutes() === 59;
    }

    function formatDateToICSDate(date) {
        const year = date.getUTCFullYear();
        const month = ('0' + (date.getUTCMonth() + 1)).slice(-2);
        const day = ('0' + date.getUTCDate()).slice(-2);

        return `${year}${month}${day}`;
    }

    function formatDateToICSTime(date) {
        const year = date.getUTCFullYear();
        const month = ('0' + (date.getUTCMonth() + 1)).slice(-2);
        const day = ('0' + date.getUTCDate()).slice(-2);
        const hours = ('0' + date.getUTCHours()).slice(-2);
        const minutes = ('0' + date.getUTCMinutes()).slice(-2);
        const seconds = ('0' + date.getUTCSeconds()).slice(-2);

        return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
    }

    function escapeICSString(str) {
        if (!str) return '';
        return str.replace(/\\/g, '\\\\')
                  .replace(/\n/g, '\\n')
                  .replace(/\r/g, '\\n')
                  .replace(/,/g, '\\,')
                  .replace(/;/g, '\\;');
        // No eliminamos ni escapamos las etiquetas HTML
    }

    // Función para extraer el primer enlace de la descripción
    function extractFirstLink(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        const link = tmp.querySelector('a');
        return link ? link.href : '';
    }

    function addDays(date, days) {
        const result = new Date(date);
        result.setUTCDate(result.getUTCDate() + days);
        return result;
    }

    function getTimeZoneDefinition() {
        return `
BEGIN:VTIMEZONE
TZID:Europe/Madrid
X-LIC-LOCATION:Europe/Madrid
BEGIN:DAYLIGHT
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
TZNAME:CEST
DTSTART:19700329T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
TZNAME:CET
DTSTART:19701025T030000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
END:STANDARD
END:VTIMEZONE
`.trim();
    }

    // Exponer la función pública
    return {
        addToCalendar: addToCalendar
    };
})();
