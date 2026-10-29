const origin = { lat: 28.6675, lng: 77.2285 }; // Kashmere Gate ISBT
const dest = { lat: 28.5672, lng: 77.2100 }; // AIIMS New Delhi

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
      });
    }
  })
  .catch(err => console.error('Live test error:', err.message));
