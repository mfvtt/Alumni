let map = L.map('map').setView([46.5, 2.2], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let alumniData = [];
let markerClusterGroup = L.markerClusterGroup();
let listContainer = document.getElementById('alumniList');
map.addLayer(markerClusterGroup);


function populateFilters(data) {
  const promos = [...new Set(data.map(p => p.promo))].sort();
  const villes = [...new Set(data.map(p => p.ville))].sort();
  const etabs = [...new Set(data.map(p => p.établissement))].sort();
  const filieres = [...new Set(data.map(p => p.filière))].sort();

  fillSelect('filterPromo', promos);
  fillSelect('filterVille', villes);
  fillSelect('filterEtablissement', etabs);
  fillSelect('filterFiliere', filieres);
}

function fillSelect(id, options) {
  const select = document.getElementById(id);
  options.forEach(opt => {
    const o = document.createElement('option');
    o.value = opt;
    o.textContent = opt;
    select.appendChild(o);
  });
}

['filterPromo', 'filterVille', 'filterEtablissement', 'filterFiliere'].forEach(id => {
  document.getElementById(id).addEventListener('change', updateUI);
});
document.getElementById('searchInput').addEventListener('input', updateUI);

function updateUI() {
  const promo = document.getElementById('filterPromo').value.toLowerCase();
  const ville = document.getElementById('filterVille').value.toLowerCase();
  const etab = document.getElementById('filterEtablissement').value.toLowerCase();
  const filiere = document.getElementById('filterFiliere').value.toLowerCase();
  const search = document.getElementById('searchInput').value.toLowerCase();

  const filtered = alumniData.filter(a => {
    const matchFilters =
      (!promo || a.promo.toLowerCase() === promo) &&
      (!ville || a.ville.toLowerCase() === ville) &&
      (!etab || a.établissement.toLowerCase() === etab) &&
      (!filiere || a.filière.toLowerCase() === filiere);

    const searchText = [
      a.nom, a.ville, a.promo, a.établissement, a.filière
    ].join(' ').toLowerCase();

    return matchFilters && (!search || searchText.includes(search));
  });

  filtered.sort((a, b) => a.nom.localeCompare(b.nom));
  listContainer.innerHTML = '';
  markerClusterGroup.clearLayers();
  const locations = {};

  filtered.forEach(alum => {
    const li = document.createElement('li');
    li.className = 'alumni-item';
    li.innerHTML = `
      <strong>${alum.nom}${alum.nom === "Karl RICHARD" ? ' <span class="badge">Modérateur</span>' : ''}</strong> - <em>${alum.promo}</em>
      <div class="details">
        ${alum.ville ? `🏙️ ${alum.ville}<br>` : ''}
        ${alum.établissement ? `🏫 ${alum.établissement}<br>` : ''}
        ${alum.filière ? `🎯 ${alum.filière}<br>` : ''}
        ${alum.mail ? `📧 ${alum.mail}<br>` : ''}
        ${alum.instagram ? `📸 ${alum.instagram}<br>` : ''}
        ${alum.linkedin ? `🔗 <a href="${alum.linkedin}" target="_blank">LinkedIn</a><br>` : ''}
        ${alum.telephone ? `📞 ${alum.telephone}<br>` : ''}
      </div>
    `;
    li.addEventListener('click', () => {
      li.classList.toggle('expanded');
    });
    listContainer.appendChild(li);

    const key = `${alum.lat},${alum.lng}`;
    if (!locations[key]) locations[key] = [];
    locations[key].push(alum);
  });

  Object.entries(locations).forEach(([coords, people]) => {
    const [lat, lng] = coords.split(',').map(Number);
    const content = (() => {
      const preview = people.slice(0, 5).map(a => `<strong>${a.nom}</strong>`).join('<br>');
      const more = people.length > 5 ? '<br>...' : '';
      const header = `<em>${people[0].établissement}</em><hr>`;
      return header + preview + more;
    })();
    const marker = L.marker([lat, lng]).bindPopup(content);
    markerClusterGroup.addLayer(marker);
  });
}

document.getElementById('burger').addEventListener('click', () => {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('open');
  sidebar.classList.toggle('closed');
});

document.getElementById('helpButton').addEventListener('click', () => {
  document.getElementById('helpPopup').classList.remove('hidden');
});
document.getElementById('closeHelpPopup').addEventListener('click', () => {
  document.getElementById('helpPopup').classList.add('hidden');
});
document.getElementById('gotoKarl').addEventListener('click', () => {
  map.setView([44.80562, -0.604816], 14);
});

fetch("https://script.google.com/macros/s/AKfycbyaSx6xwd-SHbj6k1ux7kFatO4yldh-0x4LcOXP404-a3SuHR5yBnqMIpd11rBLXWRD/exec")
  .then(res => res.json())
  .then(data => {
    alumniData = data;
    populateFilters(data);
    updateUI();
  })
  .catch(err => console.error("Erreur chargement données Sheets :", err));

