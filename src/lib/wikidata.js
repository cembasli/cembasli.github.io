import { setEntry } from '../stores/entriesStore.js';

export const SPARQL_QUERY = `
SELECT ?item ?itemLabel ?coordinate ?keId ?province ?provinceLabel ?district ?districtLabel WHERE {
  ?item wdt:P31 wd:Q34763 ;
        wdt:P625 ?coordinate .
  OPTIONAL { ?item wdt:P2764 ?keId. }
  OPTIONAL { ?item wdt:P131 ?district. ?district wdt:P131 ?province. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "tr,en". }
}`;

function getLiteral(binding, key) {
  return binding?.[key]?.value ?? null;
}

export function createEntryFromBinding(binding) {
  if (!binding?.item?.value) {
    throw new Error('Binding is missing the mandatory item IRI.');
  }

  const wikidataId = binding.item.value.split('/').pop();
  const keId = getLiteral(binding, 'keId');
  const provinceLabel = getLiteral(binding, 'provinceLabel');
  const districtLabel = getLiteral(binding, 'districtLabel');

  const entry = {
    id: wikidataId,
    wikidataId,
    keId,
    provinceLabel,
    districtLabel,
    label: getLiteral(binding, 'itemLabel'),
    coordinate: binding.coordinate?.value ?? null,
  };

  setEntry(wikidataId, entry);
  return entry;
}
