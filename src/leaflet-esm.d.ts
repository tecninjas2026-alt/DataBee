/** Leaflet 1.9.4 ships an official ESM build but its package main points to UMD. */
declare module 'leaflet/dist/leaflet-src.esm.js' {
  export * from 'leaflet';
}
