const origin = { lat: 28.6315, lng: 77.2167 }; // Connaught Place
const dest = { lat: 28.5700, lng: 77.2400 }; // Lajpat Nagar

const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson&alternatives=true`;

console.log('Fetching:', url);

fetch(url, { headers: { 'User-Agent': 'JalRakshak-Delhi-Audit/1.0' } })
  .then(res => {
    console.log('Status:', res.status, res.statusText);
    return res.json();
  })
  .then(data => {
    console.log('Code:', data.code);
    if (data.routes) {
      console.log('Routes returned count:', data.routes.length);
      data.routes.forEach((r, idx) => {
        console.log(`Route ${idx + 1}:`);
        console.log('  Distance (m):', r.distance, 'km:', (r.distance / 1000).toFixed(2));
        console.log('  Duration (s):', r.duration, 'min:', (r.duration / 60).toFixed(1));
        console.log('  Geometry type:', r.geometry.type);
        console.log('  Coordinate points count:', r.geometry.coordinates.length);
        console.log('  First point [lng, lat]:', r.geometry.coordinates[0]);
        console.log('  Last point [lng, lat]:', r.geometry.coordinates[r.geometry.coordinates.length - 1]);
      });
    }
  })
  .catch(err => console.error('Fetch error:', err.message));
