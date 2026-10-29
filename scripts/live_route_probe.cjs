const origin = { lat: 28.6315, lng: 77.2167 }; // Connaught Place
const dest = { lat: 28.5700, lng: 77.2400 }; // Lajpat Nagar

const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson&alternatives=true`;

console.log('Sending live request to:', url);

fetch(url, { headers: { 'User-Agent': 'JalRakshak-Audit/1.0' } })
  .then(res => {
    console.log('HTTP Status:', res.status, res.statusText);
    return res.json();
  })
  .then(data => {
    console.log('OSRM Response Code:', data.code);
    console.log('Alternatives count:', data.routes ? data.routes.length : 0);
    if (data.routes) {
      data.routes.forEach((r, idx) => {
        console.log(`Alternative ${idx + 1}:`);
        console.log('  Distance:', (r.distance / 1000).toFixed(2), 'km');
        console.log('  Duration:', (r.duration / 60).toFixed(1), 'minutes');
        console.log('  Geometry Type:', r.geometry.type);
        console.log('  Waypoint count:', r.geometry.coordinates.length);
        console.log('  Start coord [lng, lat]:', r.geometry.coordinates[0]);
        console.log('  End coord [lng, lat]:', r.geometry.coordinates[r.geometry.coordinates.length - 1]);
      });
    }
  })
  .catch(err => console.error('Live test error:', err.message));
