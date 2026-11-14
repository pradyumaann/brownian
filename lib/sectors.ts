// The NSE sectoral indices used for turbulence and fragility, with display names. Client-safe.
export const SECTORS: Record<string, string> = {
  auto: "Auto", bank: "Bank", energy: "Energy", finserv: "Financial Services", fmcg: "FMCG", it: "IT", media: "Media",
  metal: "Metal", pharma: "Pharma", psubank: "PSU Bank", realty: "Realty", pvtbank: "Private Bank", oilgas: "Oil & Gas",
  healthcare: "Healthcare", durables: "Consumer Durables",
};
export const SECTOR_IDS = Object.keys(SECTORS);
