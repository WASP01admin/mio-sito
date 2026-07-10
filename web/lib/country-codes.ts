// ISO 3166-1 alpha-3 country codes
export const COUNTRY_CODES = {
  ITA: "Italy",
  GBR: "United Kingdom",
  FRA: "France",
  DEU: "Germany",
  ESP: "Spain",
  NLD: "Netherlands",
  BEL: "Belgium",
  LUX: "Luxembourg",
  CHE: "Switzerland",
  AUT: "Austria",
  PLD: "Poland",
  CZE: "Czech Republic",
  SVK: "Slovakia",
  HUN: "Hungary",
  ROU: "Romania",
  BGR: "Bulgaria",
  HRV: "Croatia",
  SVN: "Slovenia",
  GRC: "Greece",
  PRT: "Portugal",
  DNK: "Denmark",
  SWE: "Sweden",
  NOR: "Norway",
  FIN: "Finland",
  POL: "Poland",
  RUS: "Russia",
  UKR: "Ukraine",
  USA: "United States",
  CAN: "Canada",
  MEX: "Mexico",
  BRA: "Brazil",
  ARG: "Argentina",
  CHL: "Chile",
  AUS: "Australia",
  NZL: "New Zealand",
  JPN: "Japan",
  CHN: "China",
  IND: "India",
  ZAF: "South Africa",
  EGY: "Egypt",
  NGA: "Nigeria",
  KEN: "Kenya",
  ISR: "Israel",
  SGP: "Singapore",
  MYS: "Malaysia",
  THA: "Thailand",
  IDN: "Indonesia",
  PHL: "Philippines",
  VNM: "Vietnam",
  KOR: "South Korea",
  TWN: "Taiwan",
} as const;

export type CountryCode = keyof typeof COUNTRY_CODES;

export function getCountryNameFromCode(code: string): string | undefined {
  return COUNTRY_CODES[code.toUpperCase() as CountryCode];
}

export function getCountryCodeFromName(name: string): string | undefined {
  const entry = Object.entries(COUNTRY_CODES).find(
    ([_, countryName]) => countryName.toLowerCase() === name.toLowerCase()
  );
  return entry?.[0];
}

export function getAllCountryCodes(): Array<{ code: string; name: string }> {
  return Object.entries(COUNTRY_CODES).map(([code, name]) => ({ code, name }));
}
