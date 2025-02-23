document.addEventListener('DOMContentLoaded', () => {
    const provinces = [
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
        { name: "Melilla", community: "Melilla" },
        { name: "Nacional", community: "Nacional" }
    ];

    // Rellenar las opciones de provincia en los formularios de edición y subida de eventos
    const provinceSelects = document.querySelectorAll('#upload-province, #edit-province');
    const communityInputs = document.querySelectorAll('#upload-community, #edit-community');

    provinceSelects.forEach(select => {
        provinces.forEach(province => {
            const option = document.createElement('option');
            option.value = province.name;
            option.textContent = province.name;
            select.appendChild(option);
        });

        select.addEventListener('change', function() {
            const selectedProvince = provinces.find(prov => prov.name === this.value);
            if (selectedProvince) {
                communityInputs.forEach(input => {
                    input.value = selectedProvince.community;
                });
            }
        });
    });

    // Rellenar las opciones de provincia en el datalist del formulario de búsqueda
    const searchProvinceDatalist = document.getElementById('province-list');
    provinces.forEach(province => {
        const option = document.createElement('option');
        option.value = province.name;
        searchProvinceDatalist.appendChild(option);
    });

    // Rellenar las opciones de comunidad en el datalist del formulario de búsqueda
    const searchCommunityDatalist = document.getElementById('community-list');
    const uniqueCommunities = [...new Set(provinces.map(province => province.community))];

    uniqueCommunities.forEach(community => {
        const option = document.createElement('option');
        option.value = community;
        searchCommunityDatalist.appendChild(option);
    });
});
