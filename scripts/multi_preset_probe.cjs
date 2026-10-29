// Probe script to test 6 multi-region presets against live OSRM
const https = require('https');

const presets = [
  { id: 'P01', name: 'CP to Lajpat Nagar', group: 'Central Corridors', origin: { lat: 28.6315, lng: 77.2167 }, dest: { lat: 28.5700, lng: 77.2400 } },
  { id: 'P06', name: 'NDLS to Anand Vihar', group: 'Transit & Railway', origin: { lat: 28.6427, lng: 77.2195 }, dest: { lat: 28.6465, lng: 77.3150 } },
  { id: 'P08', name: 'AIIMS to Saket', group: 'South Delhi', origin: { lat: 28.5672, lng: 77.2100 }, dest: { lat: 28.5244, lng: 77.2167 } },
  { id: 'P11', name: 'CP to IGI Airport (T3)', group: 'Airport Connectors', origin: { lat: 28.6315, lng: 77.2167 }, dest: { lat: 28.5562, lng: 77.0999 } },
  { id: 'P14', name: 'Rohini to Punjabi Bagh', group: 'North & West', origin: { lat: 28.7166, lng: 77.1145 }, dest: { lat: 28.6690, lng: 77.1275 } },
  { id: 'P17', name: 'Akshardham to ITO', group: 'East Delhi', origin: { lat: 28.6127, lng: 77.2773 }, dest: { lat: 28.6304, lng: 77.2415 } },
];

function fetchOsrm(p) {
  return new Promise((resolve, reject) => {
    const coords = `${p.origin.lng},${p.origin.lat};${p.dest.lng},${p.dest.lat}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&alternatives=true&steps=false`;
    const t0 = Date.now();
    https.get(url, { headers: { 'User-Agent': 'JalRakshak-Audit/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const latencyMs = Date.now() - t0;
        try {
          const json = JSON.parse(data);
          resolve({ preset: p, status: res.statusCode, latencyMs, json });
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('--- Multi-Preset OSRM Live Endpoint Probes ---');
  for (const p of presets) {
    try {
      const res = await fetchOsrm(p);
      const routes = res.json.routes || [];
      console.log(`[${res.preset.id}] ${res.preset.name} (${res.preset.group})`);
      console.log(`  HTTP Status: ${res.status}, Latency: ${res.latencyMs}ms`);
      console.log(`  Routes returned: ${routes.length}`);
      routes.forEach((r, idx) => {
        const distKm = (r.distance / 1000).toFixed(2);
        const mins = Math.round(r.duration / 60);
        const ptCount = r.geometry?.coordinates?.length || 0;
        console.log(`    Route #${idx + 1}: ${distKm} km, ${mins} min, ${ptCount} waypoints`);
      });
    } catch (err) {
      console.error(`  FAILED: ${err.message}`);
    }
  }
}

main();
