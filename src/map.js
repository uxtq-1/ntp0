// Leaflet map initialization
export function initMap() {
  const mapPlaceholder = document.getElementById('map-placeholder');

  if (!mapPlaceholder) {
    console.error('Error: Map placeholder element not found.');
    return;
  }

  if (mapPlaceholder._leaflet_id) {
    console.warn('Warning: Map already initialized.');
    return;
  }

  try {
    const map = L.map('map-placeholder').setView([51.505, -0.09], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.marker([51.505, -0.09]).addTo(map)
      .bindPopup('A default marker at [51.505, -0.09].')
      .openPopup();

    console.log('Map initialized successfully.');
  } catch (error) {
    console.error('Error: Error initializing Leaflet map: ' + error.message);
    mapPlaceholder.innerHTML = '<p style="color:red; text-align:center; font-weight:bold;">Map Error: Could not initialize the map. ' + error.message + '</p>';
  }
}
