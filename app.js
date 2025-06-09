// Main application logic will go here

// Ensure this function is in the global scope for Google Maps API callback
function initMap() {
  if (typeof google === 'object' && typeof google.maps === 'object') {
    const mapCanvas = document.getElementById('google-map-canvas');
    if (mapCanvas) {
      try {
        new google.maps.Map(mapCanvas, {
          center: { lat: -34.397, lng: 150.644 }, // Default: Sydney, Australia
          zoom: 8,
        });
        console.log("Google Map object created.");
      } catch (e) {
        console.error("Error creating Google Map:", e);
        mapCanvas.innerHTML = '<p style="padding:10px; text-align:center; color:red;">Error creating Google Map. ' + e.message + '</p>';
      }
    } else {
      console.error("Error: Map canvas element with ID 'google-map-canvas' not found.");
    }
  } else {
    console.warn("Google Maps API not loaded. This is expected if the API key is missing or invalid, or if there's no internet connection.");
    const mapCanvas = document.getElementById('google-map-canvas');
    if (mapCanvas) {
      mapCanvas.innerHTML = '<p style="padding:10px; text-align:center;">Google Maps could not be loaded. Please check the API key in index.html and ensure internet connectivity.</p>';
    }
  }
}

// If app.js is wrapped in DOMContentLoaded or another closure, explicitly expose initMap:
// For this project, app.js is linked with defer, and initMap is called directly by Google API,
// so it needs to be global. This check ensures it becomes global if not already.
if (typeof window.initMap === 'undefined') {
  window.initMap = initMap;
}
