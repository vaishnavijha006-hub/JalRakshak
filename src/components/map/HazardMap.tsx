import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Incident, HiddenHazard } from '../../data/types';
import { getCategoryMarkerColor, getSeverityColor } from '../../utils/format';

interface HazardMapProps {
  incidents: Incident[];
  hiddenHazards?: HiddenHazard[];
  selectedId?: string | null;
  onSelectIncident?: (id: string) => void;
  onSelectHiddenHazard?: (id: string) => void;
  center?: [number, number];
  zoom?: number;
  className?: string;
  showLegend?: boolean;
  routeWaypoints?: Array<{ points: [number, number][]; color: string; label: string }>;
}

function createSvgIcon(color: string, size: number, isHidden = false, isCritical = false): L.DivIcon {
  const pulseClass = isCritical ? 'hazard-marker-critical' : '';
  const innerIcon = isHidden
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" width="12" height="12">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" width="10" height="10">
        <circle cx="12" cy="12" r="3"/>
      </svg>`;

  return L.divIcon({
    className: `${pulseClass}`,
    html: `<div style="
      width: ${size}px; height: ${size}px;
      background: ${color};
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: ${isHidden ? '4px' : '50%'};
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 8px ${color}88, 0 0 0 3px ${color}33;
      cursor: pointer;
      transform: rotate(${isHidden ? '0deg' : '0deg'});
    ">${innerIcon}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export function HazardMap({
  incidents,
  hiddenHazards = [],
  selectedId,
  onSelectIncident,
  onSelectHiddenHazard,
  center = [28.6139, 77.2090],
  zoom = 12,
  className = '',
  showLegend = true,
  routeWaypoints = [],
}: HazardMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const routesRef = useRef<L.LayerGroup | null>(null);
  const [mapError, setMapError] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    try {
      const map = L.map(mapRef.current, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      // Graceful error tracking for tile loading
      let errorCount = 0;
      map.on('tileerror', () => {
        errorCount++;
        if (errorCount > 8) {
          setMapError(true);
        }
      });

      markersRef.current = L.layerGroup().addTo(map);
      routesRef.current = L.layerGroup().addTo(map);
      mapInstance.current = map;

      // Force resize after mount
      setTimeout(() => map.invalidateSize(), 100);
    } catch {
      setMapError(true);
    }

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers
  useEffect(() => {
    if (!markersRef.current) return;
    markersRef.current.clearLayers();

    // Add incident markers
    incidents.forEach(inc => {
      const color = getCategoryMarkerColor(inc.category);
      const size = inc.severity === 'critical' ? 28 : inc.severity === 'high' ? 24 : 20;
      const icon = createSvgIcon(color, size, false, inc.severity === 'critical');

      const marker = L.marker([inc.location.coordinates.lat, inc.location.coordinates.lng], { icon });
      marker.on('click', () => onSelectIncident?.(inc.id));

      const popupContent = `
        <div style="min-width: 180px; font-family: Inter, sans-serif;">
          <div style="font-size: 11px; font-weight: 600; color: #E5E7EB; margin-bottom: 4px;">${inc.title}</div>
          <div style="display: flex; gap: 6px; margin-bottom: 4px;">
            <span style="font-size: 10px; padding: 1px 6px; border-radius: 4px; background: ${color}33; color: ${color}; border: 1px solid ${color}44;">
              ${inc.category.replace('_', ' ')}
            </span>
            <span style="font-size: 10px; padding: 1px 6px; border-radius: 4px; background: ${getSeverityColor(inc.severity)}33; color: ${getSeverityColor(inc.severity)}; border: 1px solid ${getSeverityColor(inc.severity)}44;">
              ${inc.severity}
            </span>
          </div>
          <div style="font-size: 10px; color: #9CA3AF;">${inc.location.road}, ${inc.location.area}</div>
        </div>
      `;
      marker.bindPopup(popupContent, { className: 'dark-popup' });
      markersRef.current!.addLayer(marker);
    });

    // Add hidden hazard markers
    hiddenHazards.forEach(hh => {
      const icon = createSvgIcon('#EF4444', 30, true, true);
      const marker = L.marker([hh.location.coordinates.lat, hh.location.coordinates.lng], { icon });
      marker.on('click', () => onSelectHiddenHazard?.(hh.id));

      const popupContent = `
        <div style="min-width: 200px; font-family: Inter, sans-serif;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
            <span style="font-size: 10px; padding: 2px 8px; border-radius: 4px; background: #EF444433; color: #EF4444; border: 1px solid #EF444444; font-weight: 600;">
              ⚠ HIDDEN HAZARD
            </span>
          </div>
          <div style="font-size: 11px; font-weight: 600; color: #E5E7EB; margin-bottom: 4px;">
            ${hh.historicalDefectType.replace('_', ' ')} beneath waterlogging
          </div>
          <div style="font-size: 10px; color: #9CA3AF; margin-bottom: 4px;">${hh.location.road}, ${hh.location.area}</div>
          <div style="font-size: 10px; color: #F59E0B;">Confidence: ${hh.confidence}% — ${hh.confidenceLabel}</div>
          <div style="font-size: 9px; color: #6B7280; margin-top: 4px; font-style: italic;">
            ⚠ Inferred hazard, not directly confirmed
          </div>
        </div>
      `;
      marker.bindPopup(popupContent, { className: 'dark-popup' });
      markersRef.current!.addLayer(marker);
    });
  }, [incidents, hiddenHazards, onSelectIncident, onSelectHiddenHazard]);

  // Update routes
  useEffect(() => {
    if (!routesRef.current) return;
    routesRef.current.clearLayers();

    routeWaypoints.forEach(route => {
      const polyline = L.polyline(route.points, {
        color: route.color,
        weight: 4,
        opacity: 0.8,
        dashArray: route.color === '#10B981' ? undefined : '8 6',
      });
      polyline.bindTooltip(route.label, {
        permanent: false,
        className: 'dark-tooltip',
      });
      routesRef.current!.addLayer(polyline);
    });
  }, [routeWaypoints]);

  // Handle selected marker
  useEffect(() => {
    if (!mapInstance.current || !selectedId) return;

    const incident = incidents.find(i => i.id === selectedId);
    const hh = hiddenHazards.find(h => h.id === selectedId);
    const coords = incident?.location.coordinates || hh?.location.coordinates;

    if (coords) {
      mapInstance.current.setView([coords.lat, coords.lng], 15, { animate: true });
    }
  }, [selectedId, incidents, hiddenHazards]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full rounded-xl" />

      {mapError && (
        <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-900/90 border border-amber-500/30 text-amber-300 text-xs shadow-lg backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <span>Offline Tile Fallback Active · Markers & Vectors Live</span>
        </div>
      )}

      {showLegend && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-navy-800/95 backdrop-blur-sm border border-navy-700/50 rounded-lg p-3 max-w-48">
          <h4 className="text-[10px] font-semibold text-navy-300 uppercase tracking-wider mb-2">Legend</h4>
          <div className="space-y-1.5">
            {[
              { color: '#F97316', label: 'Pothole' },
              { color: '#EF4444', label: 'Open Manhole' },
              { color: '#06B6D4', label: 'Waterlogging' },
              { color: '#F59E0B', label: 'Damaged Road' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border border-white/20" style={{ background: item.color }} />
                <span className="text-[10px] text-navy-300">{item.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-1 border-t border-navy-700/50">
              <div className="w-3 h-3 rounded border border-white/20 bg-red-500 flex items-center justify-center">
                <span className="text-[7px] text-white font-bold">!</span>
              </div>
              <span className="text-[10px] text-red-400 font-medium">Hidden Hazard</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
