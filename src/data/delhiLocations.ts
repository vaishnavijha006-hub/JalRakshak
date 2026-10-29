// JalRakshak — Authoritative Delhi Locations & Commuter Route Presets
// Coordinates verified against official Survey of India / OpenStreetMap Delhi Geographic Data

import type { Coordinates } from './types';

export interface DelhiLocation {
  id: string;
  name: string;
  category: 'central' | 'transit' | 'south' | 'airport' | 'north_west' | 'east';
  description: string;
  coordinates: Coordinates;
}

export interface RoutePreset {
  id: string;
  title: string;
  group: 'Central Corridors' | 'Transit & Railway' | 'South Delhi' | 'Airport Connectors' | 'North & West' | 'East Delhi';
  originId: string;
  originName: string;
  destId: string;
  destName: string;
  description: string;
}

/**
 * 21 Authoritative Delhi Landmarks across all zones
 */
export const VERIFIED_DELHI_LOCATIONS: Record<string, DelhiLocation> = {
  'connaught_place': {
    id: 'connaught_place',
    name: 'Connaught Place',
    category: 'central',
    description: 'Central business and radial transit hub (Rajiv Chowk)',
    coordinates: { lat: 28.6315, lng: 77.2167 },
  },
  'india_gate': {
    id: 'india_gate',
    name: 'India Gate',
    category: 'central',
    description: 'C-Hexagon arterial junction and ceremonial boulevard',
    coordinates: { lat: 28.6129, lng: 77.2295 },
  },
  'ito': {
    id: 'ito',
    name: 'ITO Chowk',
    category: 'central',
    description: 'BSZ Marg / Vikas Marg governmental transit node',
    coordinates: { lat: 28.6304, lng: 77.2415 },
  },
  'karol_bagh': {
    id: 'karol_bagh',
    name: 'Karol Bagh',
    category: 'central',
    description: 'Central-West retail and residential center (Arya Samaj Rd)',
    coordinates: { lat: 28.6514, lng: 77.1907 },
  },
  'chandni_chowk': {
    id: 'chandni_chowk',
    name: 'Chandni Chowk',
    category: 'central',
    description: 'Old Delhi heritage node and Netaji Subhash Marg',
    coordinates: { lat: 28.6562, lng: 77.2304 },
  },
  'ndls': {
    id: 'ndls',
    name: 'New Delhi Railway Station (NDLS)',
    category: 'transit',
    description: 'Primary northern railway terminal (Pahar Ganj / Ajmeri Gate)',
    coordinates: { lat: 28.6427, lng: 77.2195 },
  },
  'kashmere_gate': {
    id: 'kashmere_gate',
    name: 'Kashmere Gate ISBT',
    category: 'transit',
    description: 'Maharana Pratap Inter-State Bus Terminus & Ring Rd junction',
    coordinates: { lat: 28.6675, lng: 77.2285 },
  },
  'nizamuddin': {
    id: 'nizamuddin',
    name: 'Hazrat Nizamuddin Railway Station',
    category: 'transit',
    description: 'Major South-bound train terminus and Mathura Rd connector',
    coordinates: { lat: 28.5893, lng: 77.2530 },
  },
  'anand_vihar': {
    id: 'anand_vihar',
    name: 'Anand Vihar ISBT',
    category: 'transit',
    description: 'Swami Vivekanand Trans-Yamuna Inter-State terminal',
    coordinates: { lat: 28.6465, lng: 77.3150 },
  },
  'lajpat_nagar': {
    id: 'lajpat_nagar',
    name: 'Lajpat Nagar',
    category: 'south',
    description: 'Ring Road / Central Market South Delhi commercial hub',
    coordinates: { lat: 28.5700, lng: 77.2400 },
  },
  'aiims': {
    id: 'aiims',
    name: 'AIIMS / Sri Aurobindo Marg',
    category: 'south',
    description: 'Apex medical corridor and Ring Road flyover junction',
    coordinates: { lat: 28.5672, lng: 77.2100 },
  },
  'nehru_place': {
    id: 'nehru_place',
    name: 'Nehru Place',
    category: 'south',
    description: 'South Delhi commercial / IT complex on Outer Ring Road',
    coordinates: { lat: 28.5494, lng: 77.2520 },
  },
  'saket': {
    id: 'saket',
    name: 'Saket District Centre',
    category: 'south',
    description: 'Press Enclave Road and South Delhi retail district',
    coordinates: { lat: 28.5244, lng: 77.2167 },
  },
  'dhaula_kuan': {
    id: 'dhaula_kuan',
    name: 'Dhaula Kuan',
    category: 'airport',
    description: 'NH-48 / Ring Road major multi-level interchange',
    coordinates: { lat: 28.5925, lng: 77.1605 },
  },
  'igi_airport': {
    id: 'igi_airport',
    name: 'IGI Airport (Terminal 3)',
    category: 'airport',
    description: 'Indira Gandhi International Airport international terminal',
    coordinates: { lat: 28.5562, lng: 77.0999 },
  },
  'dwarka_sec21': {
    id: 'dwarka_sec21',
    name: 'Dwarka Sector 21',
    category: 'airport',
    description: 'Southwest Delhi Airport Express metro gateway',
    coordinates: { lat: 28.5522, lng: 77.0583 },
  },
  'rohini_sec10': {
    id: 'rohini_sec10',
    name: 'Rohini Sector 10',
    category: 'north_west',
    description: 'North-West Delhi residential hub near Rithala',
    coordinates: { lat: 28.7166, lng: 77.1145 },
  },
  'mukherjee_nagar': {
    id: 'mukherjee_nagar',
    name: 'Mukherjee Nagar',
    category: 'north_west',
    description: 'North Delhi academic district near Delhi University North Campus',
    coordinates: { lat: 28.7065, lng: 77.2120 },
  },
  'punjabi_bagh': {
    id: 'punjabi_bagh',
    name: 'Punjabi Bagh',
    category: 'north_west',
    description: 'West Delhi junction of Ring Road and Rohtak Road',
    coordinates: { lat: 28.6690, lng: 77.1275 },
  },
  'akshardham': {
    id: 'akshardham',
    name: 'Akshardham Temple',
    category: 'east',
    description: 'NH-24 corridor and East Delhi Yamuna riverbank',
    coordinates: { lat: 28.6127, lng: 77.2773 },
  },
  'mayur_vihar': {
    id: 'mayur_vihar',
    name: 'Mayur Vihar Phase 1',
    category: 'east',
    description: 'DND / Noida link corridor in East Delhi',
    coordinates: { lat: 28.6045, lng: 77.2965 },
  },
};

/**
 * 20 Curated Commuter Route Presets across Delhi NCT
 */
export const DELHI_COMMUTER_PRESETS: RoutePreset[] = [
  // Group 1: Central Corridors
  {
    id: 'PRESET-01',
    title: 'CP to Lajpat Nagar',
    group: 'Central Corridors',
    originId: 'connaught_place',
    originName: 'Connaught Place',
    destId: 'lajpat_nagar',
    destName: 'Lajpat Nagar',
    description: 'Central to South arterial route via Mathura Rd / Janpath',
  },
  {
    id: 'PRESET-02',
    title: 'ITO to Connaught Place',
    group: 'Central Corridors',
    originId: 'ito',
    originName: 'ITO Chowk',
    destId: 'connaught_place',
    destName: 'Connaught Place',
    description: 'Key downtown connector via DDU Marg / Tilak Marg',
  },
  {
    id: 'PRESET-03',
    title: 'Karol Bagh to India Gate',
    group: 'Central Corridors',
    originId: 'karol_bagh',
    originName: 'Karol Bagh',
    destId: 'india_gate',
    destName: 'India Gate',
    description: 'West-Central to Central ceremonial corridor via Pusa Rd',
  },
  {
    id: 'PRESET-04',
    title: 'Chandni Chowk to CP',
    group: 'Central Corridors',
    originId: 'chandni_chowk',
    originName: 'Chandni Chowk',
    destId: 'connaught_place',
    destName: 'Connaught Place',
    description: 'Old Delhi to New Delhi core via Delhi Gate / JLN Marg',
  },

  // Group 2: Transit & Railway Connections
  {
    id: 'PRESET-05',
    title: 'NDLS to Nizamuddin Station',
    group: 'Transit & Railway',
    originId: 'ndls',
    originName: 'New Delhi Railway Station (NDLS)',
    destId: 'nizamuddin',
    destName: 'Hazrat Nizamuddin Railway Station',
    description: 'Inter-station link between Delhi two largest rail terminals',
  },
  {
    id: 'PRESET-06',
    title: 'Kashmere Gate to AIIMS',
    group: 'Transit & Railway',
    originId: 'kashmere_gate',
    originName: 'Kashmere Gate ISBT',
    destId: 'aiims',
    destName: 'AIIMS New Delhi',
    description: 'North-to-South spine traversing the entire central arterial corridor',
  },
  {
    id: 'PRESET-07',
    title: 'Anand Vihar to Connaught Place',
    group: 'Transit & Railway',
    originId: 'anand_vihar',
    originName: 'Anand Vihar ISBT',
    destId: 'connaught_place',
    destName: 'Connaught Place',
    description: 'Major Trans-Yamuna commuter route via Vikas Marg / ITO',
  },
  {
    id: 'PRESET-08',
    title: 'NDLS to Anand Vihar ISBT',
    group: 'Transit & Railway',
    originId: 'ndls',
    originName: 'New Delhi Railway Station (NDLS)',
    destId: 'anand_vihar',
    destName: 'Anand Vihar ISBT',
    description: 'Cross-city transit artery linking central rail to eastern bus hub',
  },

  // Group 3: South Delhi
  {
    id: 'PRESET-09',
    title: 'AIIMS to Nehru Place',
    group: 'South Delhi',
    originId: 'aiims',
    originName: 'AIIMS New Delhi',
    destId: 'nehru_place',
    destName: 'Nehru Place',
    description: 'South Delhi commercial artery via Ring Road / Lala Lajpat Rai Marg',
  },
  {
    id: 'PRESET-10',
    title: 'Lajpat Nagar to Saket',
    group: 'South Delhi',
    originId: 'lajpat_nagar',
    originName: 'Lajpat Nagar',
    destId: 'saket',
    destName: 'Saket District Centre',
    description: 'South arterial commute via BRT corridor / Press Enclave Rd',
  },
  {
    id: 'PRESET-11',
    title: 'Dhaula Kuan to Nehru Place',
    group: 'South Delhi',
    originId: 'dhaula_kuan',
    originName: 'Dhaula Kuan',
    destId: 'nehru_place',
    destName: 'Nehru Place',
    description: 'Entire southern Ring Road arc bypassing low-lying underpasses',
  },

  // Group 4: Airport Connectors
  {
    id: 'PRESET-12',
    title: 'CP to IGI Airport (T3)',
    group: 'Airport Connectors',
    originId: 'connaught_place',
    originName: 'Connaught Place',
    destId: 'igi_airport',
    destName: 'IGI Airport (Terminal 3)',
    description: 'Direct airport expressway corridor via Dhaula Kuan & NH-48',
  },
  {
    id: 'PRESET-13',
    title: 'Dhaula Kuan to IGI Airport (T3)',
    group: 'Airport Connectors',
    originId: 'dhaula_kuan',
    originName: 'Dhaula Kuan',
    destId: 'igi_airport',
    destName: 'IGI Airport (Terminal 3)',
    description: 'NH-48 airport approach corridor',
  },
  {
    id: 'PRESET-14',
    title: 'Nizamuddin Station to Airport',
    group: 'Airport Connectors',
    originId: 'nizamuddin',
    originName: 'Hazrat Nizamuddin Railway Station',
    destId: 'igi_airport',
    destName: 'IGI Airport (Terminal 3)',
    description: 'South Delhi cross-connector via Barapullah & Ring Road',
  },

  // Group 5: North & West Delhi
  {
    id: 'PRESET-15',
    title: 'Rohini to Connaught Place',
    group: 'North & West',
    originId: 'rohini_sec10',
    originName: 'Rohini Sector 10',
    destId: 'connaught_place',
    destName: 'Connaught Place',
    description: 'North-West commuter corridor via Pitampura & Azadpur',
  },
  {
    id: 'PRESET-16',
    title: 'Punjabi Bagh to Dhaula Kuan',
    group: 'North & West',
    originId: 'punjabi_bagh',
    originName: 'Punjabi Bagh',
    destId: 'dhaula_kuan',
    destName: 'Dhaula Kuan',
    description: 'Western Ring Road corridor through Naraina & Mayapuri',
  },
  {
    id: 'PRESET-17',
    title: 'Mukherjee Nagar to Kashmere Gate',
    group: 'North & West',
    originId: 'mukherjee_nagar',
    originName: 'Mukherjee Nagar',
    destId: 'kashmere_gate',
    destName: 'Kashmere Gate ISBT',
    description: 'North Campus radial corridor via Mall Road',
  },

  // Group 6: East Delhi (Trans-Yamuna)
  {
    id: 'PRESET-18',
    title: 'Akshardham to ITO',
    group: 'East Delhi',
    originId: 'akshardham',
    originName: 'Akshardham Temple',
    destId: 'ito',
    destName: 'ITO Chowk',
    description: 'Crucial monsoon flood crossing at Vikas Marg Yamuna bridge',
  },
  {
    id: 'PRESET-19',
    title: 'Mayur Vihar to Lajpat Nagar',
    group: 'East Delhi',
    originId: 'mayur_vihar',
    originName: 'Mayur Vihar Phase 1',
    destId: 'lajpat_nagar',
    destName: 'Lajpat Nagar',
    description: 'Trans-Yamuna to South Delhi connector via Barapullah link',
  },
  {
    id: 'PRESET-20',
    title: 'Anand Vihar to Akshardham',
    group: 'East Delhi',
    originId: 'anand_vihar',
    originName: 'Anand Vihar ISBT',
    destId: 'akshardham',
    destName: 'Akshardham Temple',
    description: 'East Delhi arterial corridor along NH-24 / Ghazipur',
  },
];
