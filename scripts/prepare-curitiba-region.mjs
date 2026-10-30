import fs from 'node:fs';
import tls from 'node:tls';
tls.setDefaultCACertificates(tls.getCACertificates('system'));
fs.mkdirSync('.tmp', { recursive: true });
for (const [name, url] of Object.entries({
  municipalities: 'https://servicodados.ibge.gov.br/api/v1/localidades/estados/41/municipios',
  mesh: 'https://servicodados.ibge.gov.br/api/v3/malhas/estados/41?formato=application/vnd.geo%2Bjson&qualidade=intermediaria&intrarregiao=municipio',
})) {
  const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw Error(name + ' HTTP ' + response.status);
  fs.writeFileSync('.tmp/curitiba-map-' + name + '.json', await response.text());
}

const names = [
  'Curitiba',
  'Adrianópolis',
  'Agudos do Sul',
  'Almirante Tamandaré',
  'Araucária',
  'Balsa Nova',
  'Bocaiúva do Sul',
  'Campina Grande do Sul',
  'Campo do Tenente',
  'Campo Largo',
  'Campo Magro',
  'Cerro Azul',
  'Colombo',
  'Contenda',
  'Doutor Ulysses',
  'Fazenda Rio Grande',
  'Itaperuçu',
  'Lapa',
  'Mandirituba',
  'Piên',
  'Pinhais',
  'Piraquara',
  'Quatro Barras',
  'Rio Branco do Sul',
  'Rio Negro',
  'São José dos Pinhais',
  'Quitandinha',
  'Tijucas do Sul',
  'Tunas do Paraná',
];
const normalize = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const cities = JSON.parse(fs.readFileSync('.tmp/curitiba-map-municipalities.json', 'utf8'));
const mesh = JSON.parse(fs.readFileSync('.tmp/curitiba-map-mesh.json', 'utf8'));
const selected = names.map((name) => {
  const city = cities.find((x) => normalize(x.nome) === normalize(name));
  if (!city) throw Error('Missing municipality ' + name);
  const feature = mesh.features.find((x) => x.properties.codarea === String(city.id));
  if (!feature || !['Polygon', 'MultiPolygon'].includes(feature.geometry.type))
    throw Error('Missing municipality geometry');
  return {
    code: String(city.id),
    name,
    polygons: feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates,
  };
});
const points = selected.flatMap((x) => x.polygons.flat(2));
if (
  points.some(
    (p) =>
      !Array.isArray(p) ||
      p.length !== 2 ||
      !p.every(Number.isFinite) ||
      p[0] < -51 ||
      p[0] > -48 ||
      p[1] < -27 ||
      p[1] > -24,
  )
)
  throw Error('Invalid public cartographic coordinate');
const bbox = [
  Math.min(...points.map((x) => x[0])),
  Math.min(...points.map((x) => x[1])),
  Math.max(...points.map((x) => x[0])),
  Math.max(...points.map((x) => x[1])),
];
fs.mkdirSync('src/app/features/map', { recursive: true });
fs.writeFileSync(
  'src/app/features/map/curitiba-region.data.ts',
  `/** Public cartographic reference. IBGE simplified municipal mesh; AMEP list of 29 RMC municipalities. Retrieved 2026-10-30. No participant data or runtime third-party map requests. */\nexport type GeoPoint = readonly [number, number];\nexport type GeoRing = readonly GeoPoint[];\nexport type GeoPolygon = readonly GeoRing[];\nexport interface MunicipalityShape { readonly code: string; readonly name: string; readonly polygons: readonly GeoPolygon[]; }\nexport const CURITIBA_REGION_BOUNDS: readonly [number, number, number, number] = ${JSON.stringify(bbox)};\nexport const CURITIBA_REGION: readonly MunicipalityShape[] = ${JSON.stringify(selected)};\n`,
);
fs.writeFileSync(
  '.tmp/curitiba-region-selected.json',
  JSON.stringify(
    {
      source: 'IBGE v3 simplified municipal mesh; AMEP 29 municipalities',
      retrievedOn: '2026-10-30',
      bbox,
      municipalities: selected,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({
    municipalities: selected.length,
    points: points.length,
    bounds: bbox,
    bytes: fs.statSync('src/app/features/map/curitiba-region.data.ts').size,
    polygons: selected.reduce((n, x) => n + x.polygons.length, 0),
    holes: selected.reduce((n, x) => n + x.polygons.reduce((m, p) => m + Math.max(0, p.length - 1), 0), 0),
  }),
);
