import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Incident, HiddenHazard } from '../../data/types';
import { getCategoryMarkerColor, getSeverityColor } from '../../utils/format';
import { getStationSummaries } from '../../services/rainfallService';

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
  routeWaypoints?: Array<{ points: [number, number][]; color: string; label: string; active?: boolean }>;
  showRainfallLayer?: boolean;
  originCoords?: { lat: number; lng: number; label?: string } | null;
  destCoords?: { lat: number; lng: number; label?: string } | null;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
}

function createEndpointIcon(color: string, label: string): L.DivIcon {
  return L.divIcon({
    className: 'endpoint-marker',
    html: `<div style="
      width: 28px; height: 28px;
      background: ${color};
      color: #050507;
      border: 2.5px solid #FFFFFF;
      border-radius: 50%;
      font-weight: 900;
      font-size: 13px;
      font-family: sans-serif;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 14px ${color}, 0 2px 6px rgba(0,0,0,0.7);
    ">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function createRainfallStationIcon(rainfallMm: number): L.DivIcon {
  const size = 32;
  const isRaining = rainfallMm > 0;
  const badgeColor = isRaining ? '#00F5FF' : '#71717A';

  return L.divIcon({
    className: 'nwdp-station-marker',
    html: `<div style="
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      cursor: pointer;
    ">
      <div style="
        width: ${size}px; height: ${size}px;
        background: #0B0B10;
        border: 2px solid ${badgeColor};
        border-radius: 8px;
        box-shadow: 0 0 12px ${badgeColor}66;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        color: white; font-family: monospace; font-size: 10px; font-weight: bold;
      ">
        <svg viewBox="0 0 24 24" fill="none" stroke="${badgeColor}" stroke-width="2.5" width="12" height="12">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
        </svg>
        <span style="font-size: 8px; color: ${badgeColor}; line-height: 1;">${rainfallMm}m</span>
      </div>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function createSvgIcon(color: string, size: number, isHidden = false, isCritical = false): L.DivIcon {
  const pulseClass = isCritical ? 'hazard-marker-critical' : '';
  const innerIcon = isHidden
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="#00F5FF" stroke-width="2.5" width="12" height="12">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" width="10" height="10">
        <circle cx="12" cy="12" r="3"/>
      </svg>`;

  const bgStyle = isHidden
    ? 'background: #0B0B10; border: 2px solid #00F5FF; box-shadow: 0 0 14px rgba(0, 245, 255, 0.6), 0 0 6px rgba(139, 92, 246, 0.4);'
    : `background: ${color}; border: 1.5px solid rgba(255, 255, 255, 0.4); box-shadow: 0 0 10px ${color}88, 0 0 0 2px rgba(11, 11, 16, 0.8);`;

  return L.divIcon({
    className: `${pulseClass}`,
    html: `<div style="
      width: ${size}px; height: ${size}px;
      ${bgStyle}
      border-radius: ${isHidden ? '4px' : '50%'};
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      transform: rotate(${isHidden ? '45deg' : '0deg'});
    "><div style="transform: rotate(${isHidden ? '-45deg' : '0deg'}); display: flex; align-items: center; justify-content: center;">${innerIcon}</div></div>`,
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
  showRainfallLayer = true,
  originCoords,
  destCoords,
  onMapClick,
}: HazardMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const routesRef = useRef<L.LayerGroup | null>(null);
  const rainfallRef = useRef<L.LayerGroup | null>(null);
  const endpointsRef = useRef<L.LayerGroup | null>(null);
  const [mapError, setMapError] = useState(false);
  const [enableRainfallLayer, setEnableRainfallLayer] = useState<boolean>(showRainfallLayer);

  const rainfallStations = useMemo(() => getStationSummaries(), []);

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
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
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
      rainfallRef.current = L.layerGroup().addTo(map);
      endpointsRef.current = L.layerGroup().addTo(map);
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
      const icon = createSvgIcon('#FF4D6D', 30, true, true);
      const marker = L.marker([hh.location.coordinates.lat, hh.location.coordinates.lng], { icon });
      marker.on('click', () => onSelectHiddenHazard?.(hh.id));

      const popupContent = `
        <div style="min-width: 200px; font-family: Inter, sans-serif;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
            <span style="font-size: 10px; padding: 2px 8px; border-radius: 4px; background: rgba(255,77,109,0.15); color: #FF4D6D; border: 1px solid rgba(255,77,109,0.35); font-weight: 700;">
              ⚡ HIDDEN HAZARD
            </span>
          </div>
          <div style="font-size: 11px; font-weight: 600; color: #F3F4F6; margin-bottom: 4px;">
            ${hh.historicalDefectType.replace('_', ' ')} beneath waterlogging
          </div>
          <div style="font-size: 10px; color: #9CA3AF; margin-bottom: 4px;">${hh.location.road}, ${hh.location.area}</div>
          <div style="font-size: 10px; color: #FFD166; font-weight: 600;">Confidence: ${hh.confidence}% — ${hh.confidenceLabel}</div>
          <div style="font-size: 9px; color: #C4B5FD; margin-top: 4px; font-style: italic;">
            ⚠ Inferred hazard, not directly confirmed
          </div>
        </div>
      `;
      marker.bindPopup(popupContent, { className: 'dark-popup' });
      markersRef.current!.addLayer(marker);
    });
  }, [incidents, hiddenHazards, onSelectIncident, onSelectHiddenHazard]);

  // Update NWDP Rainfall Telemetry Markers
  useEffect(() => {
    if (!rainfallRef.current) return;
    rainfallRef.current.clearLayers();

    if (!enableRainfallLayer) return;

    rainfallStations.forEach(stn => {
      const icon = createRainfallStationIcon(stn.latestRainfallMm);
      const marker = L.marker([stn.latitude, stn.longitude], { icon });

      const popupContent = `
        <div style="min-width: 210px; font-family: Inter, sans-serif;">
          <div style="display: flex; items-center; justify-content: space-between; gap: 6px; margin-bottom: 4px;">
            <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: rgba(0,245,255,0.15); color: #00F5FF; border: 1px solid rgba(0,245,255,0.3); font-weight: 700;">
              NWDP TELEMETRY STATION
            </span>
            <span style="font-size: 10px; color: #9CA3AF;">${stn.district}</span>
          </div>
          <div style="font-size: 12px; font-weight: 700; color: #FFFFFF; margin-bottom: 4px;">
            ${stn.station}
          </div>
          <div style="font-size: 11px; color: #00F5FF; font-weight: 600; margin-bottom: 4px;">
            Rainfall Recorded: ${stn.latestRainfallMm} mm (${stn.intensity})
          </div>
          <div style="font-size: 10px; color: #9CA3AF;">
            Acquired: ${stn.latestAcquisitionTime}
          </div>
          <div style="font-size: 9px; color: #8B5CF6; margin-top: 6px; padding-top: 4px; border-top: 1px solid #1C1C28;">
            Source: National Water Data Portal (NWIC) &middot; Delhi SW GW
          </div>
        </div>
      `;
      marker.bindPopup(popupContent, { className: 'dark-popup' });
      rainfallRef.current!.addLayer(marker);
    });
  }, [rainfallStations, enableRainfallLayer]);

  // Update routes and auto-fit bounds
  useEffect(() => {
    if (!routesRef.current) return;
    routesRef.current.clearLayers();

    routeWaypoints.forEach(route => {
      const isPrimary = route.color === '#00F5FF';
      const polyline = L.polyline(route.points, {
        color: route.color,
        weight: isPrimary ? 5 : 4,
        opacity: isPrimary ? 0.95 : 0.75,
        dashArray: isPrimary ? undefined : '8 6',
      });
      polyline.bindTooltip(route.label, {
        permanent: false,
        className: 'dark-tooltip',
      });
      routesRef.current!.addLayer(polyline);
    });

    // Auto-fit map to show complete route geometry
    const allRoutePoints = routeWaypoints.flatMap(r => r.points);
    if (allRoutePoints.length > 0 && mapInstance.current) {
      try {
        const bounds = L.latLngBounds(allRoutePoints);
        mapInstance.current.fitBounds(bounds, {
          padding: [45, 45],
          maxZoom: 14,
          animate: true,
        });
      } catch {
        // Bounds fitting safety
      }
    }
  }, [routeWaypoints]);

  // Update Endpoint Markers (Origin A & Destination B)
  useEffect(() => {
    if (!endpointsRef.current) return;
    endpointsRef.current.clearLayers();

    if (originCoords) {
      const iconA = createEndpointIcon('#35D07F', 'A');
      const markerA = L.marker([originCoords.lat, originCoords.lng], { icon: iconA });
      markerA.bindTooltip(`Origin: ${originCoords.label || 'Start Point'}`, { permanent: false, className: 'dark-tooltip' });
      endpointsRef.current.addLayer(markerA);
    }

    if (destCoords) {
      const iconB = createEndpointIcon('#FF4D6D', 'B');
      const markerB = L.marker([destCoords.lat, destCoords.lng], { icon: iconB });
      markerB.bindTooltip(`Destination: ${destCoords.label || 'End Point'}`, { permanent: false, className: 'dark-tooltip' });
      endpointsRef.current.addLayer(markerB);
    }
  }, [originCoords, destCoords]);

  // Map Click Listener
  useEffect(() => {
    if (!mapInstance.current || !onMapClick) return;
    const map = mapInstance.current;
    const clickHandler = (e: L.LeafletMouseEvent) => {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    };
    map.on('click', clickHandler);
    return () => {
      map.off('click', clickHandler);
    };
  }, [onMapClick]);

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

      {/* Layer Toggle Control */}
      <div className="absolute top-3 left-12 z-[1000] flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setEnableRainfallLayer((prev: boolean) => !prev)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md border transition-all ${
            enableRainfallLayer
              ? 'bg-[#00F5FF]/15 border-[#00F5FF]/50 text-[#00F5FF] shadow-[0_0_12px_rgba(0,245,255,0.2)]'
              : 'bg-[#0B0B10]/90 border-[#1C1C28] text-zinc-400 hover:text-white'
          }`}
          title="Toggle NWDP Delhi Rainfall Telemetry Stations"
        >
          <span className={`w-2 h-2 rounded-full ${enableRainfallLayer ? 'bg-[#00F5FF] animate-pulse' : 'bg-zinc-600'}`} />
          <span>NWDP Rainfall Stations ({rainfallStations.length})</span>
        </button>
      </div>

      {mapError && (
        <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0B0B10]/95 border border-[#00F5FF]/40 text-[#00F5FF] text-xs shadow-xl backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-[#00F5FF] animate-pulse shrink-0" />
          <span>Offline Vector Mode Active · Markers Live</span>
        </div>
      )}

      {showLegend && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-[#0B0B10]/95 backdrop-blur-md border border-[#1C1C28] rounded-lg p-3 max-w-52 shadow-2xl">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Map Legend</h4>
          <div className="space-y-1.5">
            {[
              { color: '#FF9F43', label: 'Pre-Monsoon Pothole' },
              { color: '#FF4D6D', label: 'Open Manhole (Critical)' },
              { color: '#00F5FF', label: 'Active Waterlogging' },
              { color: '#FFD166', label: 'Damaged Roadbed' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full border border-white/30" style={{ background: item.color }} />
                <span className="text-[10px] text-gray-300">{item.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-1 border-t border-[#1C1C28]">
              <div className="w-2.5 h-2.5 rounded-sm border border-[#FF4D6D] bg-[#0B0B10] flex items-center justify-center rotate-45">
                <span className="text-[7px] text-[#FF4D6D] font-bold -rotate-45">!</span>
              </div>
              <span className="text-[10px] text-[#FF4D6D] font-semibold">Hidden Hazard (USP)</span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-[#1C1C28]">
              <div className="w-2.5 h-2.5 rounded-sm border border-[#00F5FF] bg-[#0B0B10] flex items-center justify-center">
                <span className="text-[6px] text-[#00F5FF] font-bold">R</span>
              </div>
              <span className="text-[10px] text-[#00F5FF] font-semibold">NWDP Telemetry (GODL)</span>
            </div>
            <div className="pt-1.5 border-t border-[#1C1C28] text-[8px] text-zinc-500">
              © OpenStreetMap contributors, ODbL
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
