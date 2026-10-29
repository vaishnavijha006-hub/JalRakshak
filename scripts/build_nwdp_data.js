import fs from 'node:fs';

const rawCsv = fs.readFileSync('src/data/rainfall_tel_hr_delhi_sw_gw_dl_2026_2030.csv', 'utf8');

const tsFileContent = `// JalRakshak — National Water Data Portal (NWDP / NWIC)
// Dataset: Rainfall Telemetry Hourly Delhi Surface Water Groundwater Department
// Dataset ID: c4fd33e4-73a9-47f7-ac61-e2053b9006e4
// Resource ID: f044fbd1-bac2-4897-8a54-6437ef4b0c6e (Active 2026-2030)
// Portal URL: https://www.nwdp.nwic.gov.in/dataset/rainfall-telemetry-hourly-delhi-surface-water-groundwater-department

export interface NwdpStationMeta {
  name: string;
  district: string;
  latitude: number;
  longitude: number;
  agency: string;
}

export const NWDP_STATIONS_REGISTRY: Record<string, NwdpStationMeta> = {
  'Alipur Store': {
    name: 'Alipur Store',
    district: 'North Delhi',
    latitude: 28.796799,
    longitude: 77.119038,
    agency: 'Delhi Surface Water Ground Water Department',
  },
  'Basaidarapur Office Complex': {
    name: 'Basaidarapur Office Complex',
    district: 'New Delhi / Central-West',
    latitude: 28.659050,
    longitude: 77.127142,
    agency: 'Delhi Surface Water Ground Water Department',
  },
  'Dhansa_1': {
    name: 'Dhansa_1',
    district: 'South-West Delhi',
    latitude: 28.535405,
    longitude: 76.869894,
    agency: 'Delhi Surface Water Ground Water Department',
  },
  'Kanjhawala Store': {
    name: 'Kanjhawala Store',
    district: 'North-West Delhi',
    latitude: 28.738260,
    longitude: 77.001355,
    agency: 'Delhi Surface Water Ground Water Department',
  },
  'L.M. Bund Office Complex': {
    name: 'L.M. Bund Office Complex',
    district: 'East Delhi / Yamuna Bund',
    latitude: 28.641608,
    longitude: 77.270206,
    agency: 'Delhi Surface Water Ground Water Department',
  },
  'Rohini Office Complex': {
    name: 'Rohini Office Complex',
    district: 'North / Rohini',
    latitude: 28.728831,
    longitude: 77.314040,
    agency: 'Delhi Surface Water Ground Water Department',
  },
};

export const NWDP_METADATA = {
  portal: 'National Water Data Portal (NWIC)',
  portalUrl: 'https://www.nwdp.nwic.gov.in/dataset/rainfall-telemetry-hourly-delhi-surface-water-groundwater-department',
  datasetId: 'c4fd33e4-73a9-47f7-ac61-e2053b9006e4',
  resourceId2026: 'f044fbd1-bac2-4897-8a54-6437ef4b0c6e',
  resourceId2021: '2297dc90-dce1-420e-98ab-4f8855dfade7',
  agency: 'Delhi Surface Water Ground Water Department',
  license: 'Government Open Data License - India (GODL)',
  temporalCoverage: '2026-2030 (Hourly telemetry)',
};

export const NWDP_DELHI_HOURLY_CSV: string = ${JSON.stringify(rawCsv)};
`;

fs.writeFileSync('src/data/nwdpDelhiRainfallData.ts', tsFileContent, 'utf8');
console.log('Successfully generated src/data/nwdpDelhiRainfallData.ts');
