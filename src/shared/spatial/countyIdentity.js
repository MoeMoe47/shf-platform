// Qualified identity manifest for the Ohio Census county asset. This is an
// exact migration/validation table, not a county inference mechanism.
const OHIO_COUNTY_NAME_TO_FIPS = Object.freeze({
  Adams: "39001",
  Allen: "39003",
  Ashland: "39005",
  Ashtabula: "39007",
  Athens: "39009",
  Auglaize: "39011",
  Belmont: "39013",
  Brown: "39015",
  Butler: "39017",
  Carroll: "39019",
  Champaign: "39021",
  Clark: "39023",
  Clermont: "39025",
  Clinton: "39027",
  Columbiana: "39029",
  Coshocton: "39031",
  Crawford: "39033",
  Cuyahoga: "39035",
  Darke: "39037",
  Defiance: "39039",
  Delaware: "39041",
  Erie: "39043",
  Fairfield: "39045",
  Fayette: "39047",
  Franklin: "39049",
  Fulton: "39051",
  Gallia: "39053",
  Geauga: "39055",
  Greene: "39057",
  Guernsey: "39059",
  Hamilton: "39061",
  Hancock: "39063",
  Hardin: "39065",
  Harrison: "39067",
  Henry: "39069",
  Highland: "39071",
  Hocking: "39073",
  Holmes: "39075",
  Huron: "39077",
  Jackson: "39079",
  Jefferson: "39081",
  Knox: "39083",
  Lake: "39085",
  Lawrence: "39087",
  Licking: "39089",
  Logan: "39091",
  Lorain: "39093",
  Lucas: "39095",
  Madison: "39097",
  Mahoning: "39099",
  Marion: "39101",
  Medina: "39103",
  Meigs: "39105",
  Mercer: "39107",
  Miami: "39109",
  Monroe: "39111",
  Montgomery: "39113",
  Morgan: "39115",
  Morrow: "39117",
  Muskingum: "39119",
  Noble: "39121",
  Ottawa: "39123",
  Paulding: "39125",
  Perry: "39127",
  Pickaway: "39129",
  Pike: "39131",
  Portage: "39133",
  Preble: "39135",
  Putnam: "39137",
  Richland: "39139",
  Ross: "39141",
  Sandusky: "39143",
  Scioto: "39145",
  Seneca: "39147",
  Shelby: "39149",
  Stark: "39151",
  Summit: "39153",
  Trumbull: "39155",
  Tuscarawas: "39157",
  Union: "39159",
  "Van Wert": "39161",
  Vinton: "39163",
  Warren: "39165",
  Washington: "39167",
  Wayne: "39169",
  Williams: "39171",
  Wood: "39173",
  Wyandot: "39175",
});

const OHIO_COUNTY_FIPS = Object.freeze(Object.values(OHIO_COUNTY_NAME_TO_FIPS));
const OHIO_COUNTY_FIPS_SET = new Set(OHIO_COUNTY_FIPS);

function normalizeCountyName(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

export function isQualifiedOhioCountyFips(value) {
  return typeof value === "string"
    && /^39\d{3}$/.test(value)
    && OHIO_COUNTY_FIPS_SET.has(value);
}

export function validateQualifiedOhioCountyFips(value) {
  return isQualifiedOhioCountyFips(value)
    ? { ok: true, value }
    : { ok: false, value: null, reason: "INVALID_QUALIFIED_OHIO_COUNTY_FIPS" };
}

// Used only while hardening existing exact-name static records. It never
// accepts aliases, fuzzy matches, addresses, or entity-derived values.
export function resolveExactQualifiedCountyNameToFips(value) {
  const normalized = normalizeCountyName(value);
  const match = Object.entries(OHIO_COUNTY_NAME_TO_FIPS)
    .find(([name]) => name.toUpperCase() === normalized.toUpperCase());
  return match?.[1] || null;
}

export function joinIepRecordToCounty(record, countyFeature) {
  const recordFips = record?.countyFips;
  const countyFips = countyFeature?.sourceRecordId;
  if (!isQualifiedOhioCountyFips(recordFips) || !isQualifiedOhioCountyFips(countyFips)) {
    return { ok: false, reason: "UNRESOLVED_COUNTY_IDENTITY" };
  }
  return recordFips === countyFips
    ? { ok: true, countyFips }
    : { ok: false, reason: "COUNTY_IDENTITY_MISMATCH" };
}

export function normalizeDynamicIepCountyIdentity(record) {
  return {
    ...record,
    countyFips: isQualifiedOhioCountyFips(record?.countyFips) ? record.countyFips : null,
  };
}

export function propagateCountyFipsFromCountyOwnedParent(parent, child, relationship) {
  const countyFips = relationship === "COUNTY_OWNED_DERIVED"
    && isQualifiedOhioCountyFips(parent?.countyFips)
    ? parent.countyFips
    : null;
  return { ...child, countyFips };
}

export const QUALIFIED_OHIO_COUNTY_FIPS = OHIO_COUNTY_FIPS;
export const QUALIFIED_OHIO_COUNTY_NAME_TO_FIPS = OHIO_COUNTY_NAME_TO_FIPS;
