import type { Coordinates } from "@/lib/models";

/**
 * Provider-agnostic map contract.
 *
 * The results page only depends on `MapViewProps`. The bundled
 * `SchematicMap` renders an honest, approximate plot of coordinates without
 * any tile provider. To go live, implement a component with the same props
 * backed by Mapbox GL, MapLibre, Google Maps or Leaflet and swap it in
 * `components/map/index.ts` — no page changes are required.
 */
export interface MapMarker {
  id: string;
  position: Coordinates;
  /** Short label rendered on the marker, e.g. a price */
  label: string;
  title: string;
  group?: string;
}

export interface MapViewProps {
  markers: MapMarker[];
  selectedId?: string | null;
  highlightedId?: string | null;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
  className?: string;
  /** Accessible name for the map region */
  label: string;
}
