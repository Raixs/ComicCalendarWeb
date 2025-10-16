// Archivo de provincias y comunidades autónomas de España
// Se carga al inicio para poblar selectores y datalists

// Definir provincias y comunidades autónomas
const provincesData = [
    { name: "Nacional", community: "Nacional" },
    { name: "Albacete", community: "Castilla-La Mancha" },
    { name: "Alicante", community: "Comunidad Valenciana" },
    { name: "Almería", community: "Andalucía" },
    { name: "Álava", community: "País Vasco" },
    { name: "Asturias", community: "Principado de Asturias" },
    { name: "Ávila", community: "Castilla y León" },
    { name: "Badajoz", community: "Extremadura" },
    { name: "Illes Balears", community: "Illes Balears" },
    { name: "Barcelona", community: "Cataluña" },
    { name: "Bizkaia", community: "País Vasco" },
    { name: "Burgos", community: "Castilla y León" },
    { name: "Cáceres", community: "Extremadura" },
    { name: "Cádiz", community: "Andalucía" },
    { name: "Cantabria", community: "Cantabria" },
    { name: "Castellón", community: "Comunidad Valenciana" },
    { name: "Ciudad Real", community: "Castilla-La Mancha" },
    { name: "Córdoba", community: "Andalucía" },
    { name: "A Coruña", community: "Galicia" },
    { name: "Cuenca", community: "Castilla-La Mancha" },
    { name: "Gipuzkoa", community: "País Vasco" },
    { name: "Girona", community: "Cataluña" },
    { name: "Granada", community: "Andalucía" },
    { name: "Guadalajara", community: "Castilla-La Mancha" },
    { name: "Huelva", community: "Andalucía" },
    { name: "Huesca", community: "Aragón" },
    { name: "Jaén", community: "Andalucía" },
    { name: "León", community: "Castilla y León" },
    { name: "Lleida", community: "Cataluña" },
    { name: "Lugo", community: "Galicia" },
    { name: "Madrid", community: "Comunidad de Madrid" },
    { name: "Málaga", community: "Andalucía" },
    { name: "Murcia", community: "Región de Murcia" },
    { name: "Navarra", community: "Comunidad Foral de Navarra" },
    { name: "Ourense", community: "Galicia" },
    { name: "Palencia", community: "Castilla y León" },
    { name: "Las Palmas", community: "Canarias" },
    { name: "Pontevedra", community: "Galicia" },
    { name: "La Rioja", community: "La Rioja" },
    { name: "Salamanca", community: "Castilla y León" },
    { name: "Santa Cruz de Tenerife", community: "Canarias" },
    { name: "Segovia", community: "Castilla y León" },
    { name: "Sevilla", community: "Andalucía" },
    { name: "Soria", community: "Castilla y León" },
    { name: "Tarragona", community: "Cataluña" },
    { name: "Teruel", community: "Aragón" },
    { name: "Toledo", community: "Castilla-La Mancha" },
    { name: "Valencia", community: "Comunidad Valenciana" },
    { name: "Valladolid", community: "Castilla y León" },
    { name: "Zamora", community: "Castilla y León" },
    { name: "Zaragoza", community: "Aragón" },
    { name: "Ceuta", community: "Ceuta" },
    { name: "Melilla", community: "Melilla" }
    ];

// Exponer provinces globalmente para que los módulos ES6 puedan acceder
window.provinces = provincesData;

// Crear el diccionario para compatibilidad con código existente
const provincesAndCommunities = {};
provincesData.forEach(province => {
    provincesAndCommunities[province.name] = province.community;
});
window.provincesAndCommunities = provincesAndCommunities;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('Provincias cargadas:', provincesData.length);
    
    // Intentar inicializar el ProvinceManager si ya está disponible
    if (window.ComicCalendarApp && window.ComicCalendarApp.ProvinceManager) {
        window.ComicCalendarApp.ProvinceManager.initialize();
    }
    
    // También intentar de nuevo después de un breve delay para asegurar que los módulos ES6 se hayan cargado
    setTimeout(() => {
        if (window.ComicCalendarApp && window.ComicCalendarApp.ProvinceManager) {
            window.ComicCalendarApp.ProvinceManager.initialize();
        }
    }, 500);
});