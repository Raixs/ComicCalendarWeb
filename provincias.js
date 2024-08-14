const provincias = [
    "Albacete",
    "Alicante",
    "Almería",
    "Álava",
    "Asturias",
    "Ávila",
    "Badajoz",
    "Illes Balears",
    "Barcelona",
    "Bizkaia",
    "Burgos",
    "Cáceres",
    "Cádiz",
    "Cantabria",
    "Castellón",
    "Ciudad Real",
    "Córdoba",
    "A Coruña",
    "Cuenca",
    "Gipuzkoa",
    "Girona",
    "Granada",
    "Guadalajara",
    "Huelva",
    "Huesca",
    "Jaén",
    "León",
    "Lleida",
    "Lugo",
    "Madrid",
    "Málaga",
    "Murcia",
    "Navarra",
    "Ourense",
    "Palencia",
    "Las Palmas",
    "Pontevedra",
    "La Rioja",
    "Salamanca",
    "Santa Cruz de Tenerife",
    "Segovia",
    "Sevilla",
    "Soria",
    "Tarragona",
    "Teruel",
    "Toledo",
    "Valencia",
    "Valladolid",
    "Zamora",
    "Zaragoza",
    "Ceuta",
    "Melilla"
];

function populateProvincesList() {
    const provinceList = document.getElementById('province-list');
    provincias.forEach(province => {
        const option = document.createElement('option');
        option.value = province;
        provinceList.appendChild(option);
    });
}

document.addEventListener('DOMContentLoaded', populateProvincesList);
