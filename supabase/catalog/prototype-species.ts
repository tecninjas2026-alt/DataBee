/** Names/IDs previously validated by Prof. Rodrigo (07/10). Species-only prototype use authorized by the teacher on 29/10. No family/genus hierarchy, traits, images or educational claims. */
export const PROTOTYPE_SPECIES_CATALOG_V1 = {
  version: 'v1-species-2026-10-29',
  status: 'approved',
  taxa: [
    {
      id: 'sp-tetragonisca-angustula',
      taxonomicLevel: 'species',
      scientificName: 'Tetragonisca angustula',
      commonName: 'Jataí',
      visualTraits: [],
    },
    {
      id: 'sp-tetragonisca-fiebrigi',
      taxonomicLevel: 'species',
      scientificName: 'Tetragonisca fiebrigi',
      commonName: 'Jataí',
      visualTraits: [],
    },
    {
      id: 'sp-paratrigona-subnuda',
      taxonomicLevel: 'species',
      scientificName: 'Paratrigona subnuda',
      commonName: 'Jataí-da-terra',
      visualTraits: [],
    },
    {
      id: 'sp-plebeia-remota',
      taxonomicLevel: 'species',
      scientificName: 'Plebeia remota',
      commonName: 'Mirim-guaçu',
      visualTraits: [],
    },
    {
      id: 'sp-trigona-spinipes',
      taxonomicLevel: 'species',
      scientificName: 'Trigona spinipes',
      commonName: 'Irapuá',
      visualTraits: [],
    },
    {
      id: 'sp-scaptotrigona-bipunctata',
      taxonomicLevel: 'species',
      scientificName: 'Scaptotrigona bipunctata',
      commonName: 'Tubuna',
      visualTraits: [],
    },
    {
      id: 'sp-nannotrigona-testaceicornis',
      taxonomicLevel: 'species',
      scientificName: 'Nannotrigona testaceicornis',
      commonName: 'Iraí',
      visualTraits: [],
    },
    {
      id: 'sp-melipona-bicolor',
      taxonomicLevel: 'species',
      scientificName: 'Melipona bicolor',
      commonName: 'Guaraipo',
      visualTraits: [],
    },
    {
      id: 'sp-melipona-marginata',
      taxonomicLevel: 'species',
      scientificName: 'Melipona marginata',
      commonName: 'Manduri',
      visualTraits: [],
    },
    {
      id: 'sp-melipona-quadrifasciata',
      taxonomicLevel: 'species',
      scientificName: 'Melipona quadrifasciata',
      commonName: 'Mandaçaia',
      visualTraits: [],
    },
    {
      id: 'sp-eulaema-nigrita',
      taxonomicLevel: 'species',
      scientificName: 'Eulaema nigrita',
      commonName: 'Abelha-da-orquídea',
      visualTraits: [],
    },
    {
      id: 'sp-bombus-pauloensis',
      taxonomicLevel: 'species',
      scientificName: 'Bombus pauloensis',
      commonName: 'Mamangava-social',
      visualTraits: [],
    },
  ],
} as const;

/** Addition authorized by the teacher on 02/11. Apis reference: ICMBio guide, 2023, v4.
 * This is prototype catalog inclusion, not Prof. Rodrigo's validation of the new entry.
 * Keep V1 immutable so saved results retain their original name/version mapping. */
export const PROTOTYPE_SPECIES_CATALOG = {
  version: 'v2-species-2026-11-02',
  status: 'approved',
  taxa: [
    ...PROTOTYPE_SPECIES_CATALOG_V1.taxa,
    {
      id: 'sp-apis-mellifera',
      taxonomicLevel: 'species',
      scientificName: 'Apis mellifera',
      commonName: 'Abelha-do-mel',
      visualTraits: [],
    },
  ],
} as const;

export const PREVIOUS_PROTOTYPE_CATALOGS = [PROTOTYPE_SPECIES_CATALOG_V1] as const;

export function prototypeCatalogForVersion(version: string) {
  return [PROTOTYPE_SPECIES_CATALOG, ...PREVIOUS_PROTOTYPE_CATALOGS].find((catalog) => catalog.version === version);
}
