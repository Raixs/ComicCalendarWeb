# Comic Calendar Web

**Comic Calendar Web** es el frontend de la aplicación **Comic Calendar**, una herramienta diseñada para listar y buscar eventos relacionados con el mundo del cómic en España. El proyecto se divide en dos partes principales:

- **Frontend**: Desarrollado con HTML, CSS, y JavaScript Vanilla. Este repositorio contiene todo el código relacionado con la interfaz de usuario.
- **Backend**: Desarrollado con FastAPI. La API gestiona y proporciona los datos de los eventos. Puedes encontrar el código del backend en el repositorio [ComicCalendar](https://github.com/malambra/comicCalendar).

### Frontend

- **Repositorio GitHub**: [ComicCalendarWeb](https://github.com/Raixs/ComicCalendarWeb)
- **URL en Producción**: [eventoscomic.com](https://eventoscomic.com)

### Backend

- **Repositorio GitHub**: [ComicCalendar](https://github.com/malambra/comicCalendar)
- **URL de la API**: [api.eventoscomic.com](https://api.eventoscomic.com)
- **Documentación de la API**: [api.eventoscomic.com/docs](https://api.eventoscomic.com/docs)

## Características

El frontend de **Comic Calendar** proporciona las siguientes funcionalidades:

- **Listado de Eventos**: Muestra los eventos de cómics más recientes en España.
- **Búsqueda por Fecha y Provincia**: Permite a los usuarios filtrar eventos según la fecha (mes y año) y la provincia.
- **Mostrar Más Eventos**: Carga más eventos utilizando paginación cuando se realiza una búsqueda.
- **Descripciones Expandibles**: Los textos largos en las descripciones de eventos se pueden expandir con la opción "Mostrar más".
- **Diseño Responsivo y Moderno**: La interfaz está diseñada para ser sencilla y accesible en dispositivos móviles y de escritorio.

## Tecnologías Utilizadas

- **HTML**: Estructura de la página.
- **CSS**: Estilos y diseño visual.
- **Bootstrap 4**: Framework CSS para un diseño responsivo.
- **JavaScript Vanilla**: Manejo de la lógica de la aplicación.

## Uso

1. **Visualización Inicial**: Al abrir la página, se listan automáticamente los eventos más recientes.
2. **Búsqueda de Eventos**: Utiliza el formulario en la parte superior para buscar eventos por fecha (mes y año) y/o provincia.
3. **Paginación**: Si hay más eventos disponibles, se muestra un botón "Mostrar más" para cargar más resultados.
4. **Expansión de Descripciones**: Haz clic en "Mostrar más" dentro de una descripción para ver el contenido completo.

## Estructura del Proyecto

- **`index.html`**: La página principal que contiene la estructura de la aplicación.
- **`styles.css`**: Archivo de estilos para la página.
- **`script.js`**: Lógica de la aplicación escrita en JavaScript.
- **`README.md`**: Documentación del proyecto.

## Contribuciones

¡Las contribuciones son bienvenidas! Si deseas contribuir al proyecto:

1. Realiza un fork del proyecto.
2. Crea una nueva rama (`git checkout -b feature/nueva-funcionalidad`).
3. Realiza tus cambios y haz commit (`git commit -am 'Agrega nueva funcionalidad'`).
4. Haz push a la rama (`git push origin feature/nueva-funcionalidad`).
5. Abre un Pull Request en GitHub.

## Tareas Pendientes

- [ ]  **Detalles de Eventos**: Crear una página o modal para mostrar los detalles completos de un evento al hacer clic en él.
- [ ]  **Integración de Mapas**: Mostrar la ubicación de los eventos en un mapa (ej. Google Maps).
- [ ]  **Compartir en Redes Sociales**: Añadir botones para compartir eventos en redes sociales.
- [ ]  **Modo Claro/Oscuro**: Añadir un interruptor para cambiar entre modo claro y oscuro.

## Agradecimientos

- **Asociación de Autores de Cómic**: Agradecimientos especiales a la [Asociación de Autores de Cómic](https://www.autoresdecomic.com/) por proporcionar los datos utilizados en este proyecto.
- **Desarrolladores**: Proyecto desarrollado por [@raixs](https://github.com/Raixs) y [@malambra](https://github.com/malambra).
