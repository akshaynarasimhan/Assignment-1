// ─── Source of truth: data/territory_data.csv ─────────────────────────────
// This file mirrors that CSV exactly. To update territory data, edit the CSV
// and reflect changes here, or load the CSV dynamically in territoryApi.js.

export const REGIONS = [
  'North America - East',
  'North America - West',
  'EMEA',
  'APAC',
  'India',
];

export const AI_BD_OPTIONS = ['All', 'AI', 'BD'];

export const GEO_TERR_OPTIONS = ['All', 'Enterprise', 'Commercial', 'SMB'];

// ─── Sales Managers ────────────────────────────────────────────────────────
// 3 AE Sales Managers + 3 BD Sales Managers for North America - East.
// Other regions kept for UI completeness.

export const SALES_MANAGERS = {
  'North America - East': [
    // AE managers (AI book)
    'Rachel Monroe',
    'David Osei',
    'Laura Petersen',
    // BD managers (BD book)
    'Carlos Vega',
    'Amara Diallo',
    'James Whitfield',
  ],
  'North America - West': [
    'Carlos Delgado',
    'Priya Nair',
    'Kevin Brandt',
    'Tiffany Cho',
    'Nathan Abrams',
  ],
  EMEA: [
    'Alistair Hughes',
    'Marie-Claire Dubois',
    'Stefan Braun',
    'Fatima Al-Rashid',
    'Luca Ferretti',
  ],
  APAC: [
    'Yuki Nakamura',
    'Lin Wei',
    'Arjun Sharma',
    'Soo-Jin Park',
  ],
  India: [
    'Rohan Verma',
    'Anjali Mehta',
    'Sanjay Pillai',
    'Pooja Iyer',
  ],
};

// ─── AE / BD Rep Data ──────────────────────────────────────────────────────
// 3 AE SMs × 4 AI reps  = 12 AE reps
// 3 BD SMs × 4 BD reps  = 12 BD reps
// Total: 24 reps
//
// Columns mirror territory_data.csv:
//   id | aeName | role | aibd | geoTerr | region | manager | smType
//   cv | targetBookingSize | availableCapacity | pctTargetFromSizeAchieved
//   proxyBuReview | proxyBuReview2 | proxySizeDiscount | proxyGraded

export const MOCK_AE_DATA = [

  // ── Rachel Monroe (AE SM · AI · Enterprise) ────────────────────────────
  {
    id: 'AE-001', aeName: 'Jordan Blake',
    role: 'AE II – Enterprise GTS', aibd: 'AI', geoTerr: 'Enterprise',
    region: 'North America - East', manager: 'Rachel Monroe', smType: 'AE SM',
    cv: 2400, targetBookingSize: 2800, availableCapacity: 1,
    pctTargetFromSizeAchieved: 55,
    proxyBuReview: 78, proxyBuReview2: 81, proxySizeDiscount: 72, proxyGraded: 76,
  },
  {
    id: 'AE-002', aeName: 'Priya Kapoor',
    role: 'AE I – Enterprise GTS', aibd: 'AI', geoTerr: 'Enterprise',
    region: 'North America - East', manager: 'Rachel Monroe', smType: 'AE SM',
    cv: 1950, targetBookingSize: 2500, availableCapacity: 2,
    pctTargetFromSizeAchieved: 62,
    proxyBuReview: 70, proxyBuReview2: 74, proxySizeDiscount: 65, proxyGraded: 70,
  },
  {
    id: 'AE-003', aeName: 'Marcus Webb',
    role: 'AE III – Enterprise GTS', aibd: 'AI', geoTerr: 'Enterprise',
    region: 'North America - East', manager: 'Rachel Monroe', smType: 'AE SM',
    cv: 3100, targetBookingSize: 3400, availableCapacity: 0,
    pctTargetFromSizeAchieved: 88,
    proxyBuReview: 55, proxyBuReview2: 58, proxySizeDiscount: 50, proxyGraded: 55,
  },
  {
    id: 'AE-004', aeName: 'Sofia Delgado',
    role: 'AE II – Enterprise GTS', aibd: 'AI', geoTerr: 'Enterprise',
    region: 'North America - East', manager: 'Rachel Monroe', smType: 'AE SM',
    cv: 2700, targetBookingSize: 3000, availableCapacity: 1,
    pctTargetFromSizeAchieved: 72,
    proxyBuReview: 82, proxyBuReview2: 85, proxySizeDiscount: 78, proxyGraded: 82,
  },

  // ── David Osei (AE SM · AI · Commercial) ──────────────────────────────
  {
    id: 'AE-005', aeName: 'Avery Chen',
    role: 'AE I – Commercial GTS', aibd: 'AI', geoTerr: 'Commercial',
    region: 'North America - East', manager: 'David Osei', smType: 'AE SM',
    cv: 950, targetBookingSize: 1200, availableCapacity: 0,
    pctTargetFromSizeAchieved: 86,
    proxyBuReview: 60, proxyBuReview2: 63, proxySizeDiscount: 55, proxyGraded: 60,
  },
  {
    id: 'AE-006', aeName: 'Riley Okafor',
    role: 'AE II – Commercial GTS', aibd: 'AI', geoTerr: 'Commercial',
    region: 'North America - East', manager: 'David Osei', smType: 'AE SM',
    cv: 1600, targetBookingSize: 2000, availableCapacity: 2,
    pctTargetFromSizeAchieved: 58,
    proxyBuReview: 75, proxyBuReview2: 78, proxySizeDiscount: 70, proxyGraded: 75,
  },
  {
    id: 'AE-007', aeName: 'Jamie Park',
    role: 'AE III – Commercial GTS', aibd: 'AI', geoTerr: 'Commercial',
    region: 'North America - East', manager: 'David Osei', smType: 'AE SM',
    cv: 2100, targetBookingSize: 2400, availableCapacity: 1,
    pctTargetFromSizeAchieved: 65,
    proxyBuReview: 68, proxyBuReview2: 71, proxySizeDiscount: 64, proxyGraded: 68,
  },
  {
    id: 'AE-008', aeName: 'Natasha Iyer',
    role: 'AE II – Commercial GTS', aibd: 'AI', geoTerr: 'Commercial',
    region: 'North America - East', manager: 'David Osei', smType: 'AE SM',
    cv: 1800, targetBookingSize: 2200, availableCapacity: 3,
    pctTargetFromSizeAchieved: 45,
    proxyBuReview: 88, proxyBuReview2: 91, proxySizeDiscount: 83, proxyGraded: 88,
  },

  // ── Laura Petersen (AE SM · AI · SMB) ─────────────────────────────────
  {
    id: 'AE-009', aeName: 'Quinn Patel',
    role: 'AE I – SMB GTS', aibd: 'AI', geoTerr: 'SMB',
    region: 'North America - East', manager: 'Laura Petersen', smType: 'AE SM',
    cv: 680, targetBookingSize: 900, availableCapacity: 4,
    pctTargetFromSizeAchieved: 45,
    proxyBuReview: 84, proxyBuReview2: 87, proxySizeDiscount: 79, proxyGraded: 84,
  },
  {
    id: 'AE-010', aeName: 'Sam Torres',
    role: 'AE II – SMB GTS', aibd: 'AI', geoTerr: 'SMB',
    region: 'North America - East', manager: 'Laura Petersen', smType: 'AE SM',
    cv: 1100, targetBookingSize: 1300, availableCapacity: 1,
    pctTargetFromSizeAchieved: 58,
    proxyBuReview: 72, proxyBuReview2: 75, proxySizeDiscount: 68, proxyGraded: 72,
  },
  {
    id: 'AE-011', aeName: 'Casey Navarro',
    role: 'AE I – SMB GTS', aibd: 'AI', geoTerr: 'SMB',
    region: 'North America - East', manager: 'Laura Petersen', smType: 'AE SM',
    cv: 750, targetBookingSize: 1000, availableCapacity: 2,
    pctTargetFromSizeAchieved: 52,
    proxyBuReview: 79, proxyBuReview2: 82, proxySizeDiscount: 74, proxyGraded: 79,
  },
  {
    id: 'AE-012', aeName: 'Morgan Kim',
    role: 'AE II – SMB GTS', aibd: 'AI', geoTerr: 'SMB',
    region: 'North America - East', manager: 'Laura Petersen', smType: 'AE SM',
    cv: 960, targetBookingSize: 1100, availableCapacity: 0,
    pctTargetFromSizeAchieved: 91,
    proxyBuReview: 58, proxyBuReview2: 61, proxySizeDiscount: 54, proxyGraded: 58,
  },

  // ── Carlos Vega (BD SM · BD · Enterprise) ─────────────────────────────
  {
    id: 'BD-001', aeName: 'Taylor Singh',
    role: 'BD II – Enterprise GBS', aibd: 'BD', geoTerr: 'Enterprise',
    region: 'North America - East', manager: 'Carlos Vega', smType: 'BD SM',
    cv: 3200, targetBookingSize: 3500, availableCapacity: 3,
    pctTargetFromSizeAchieved: 72,
    proxyBuReview: 90, proxyBuReview2: 93, proxySizeDiscount: 86, proxyGraded: 90,
  },
  {
    id: 'BD-002', aeName: 'Leila Osman',
    role: 'BD I – Enterprise GBS', aibd: 'BD', geoTerr: 'Enterprise',
    region: 'North America - East', manager: 'Carlos Vega', smType: 'BD SM',
    cv: 2600, targetBookingSize: 2900, availableCapacity: 1,
    pctTargetFromSizeAchieved: 66,
    proxyBuReview: 77, proxyBuReview2: 80, proxySizeDiscount: 73, proxyGraded: 77,
  },
  {
    id: 'BD-003', aeName: 'Noah Christensen',
    role: 'BD III – Enterprise GBS', aibd: 'BD', geoTerr: 'Enterprise',
    region: 'North America - East', manager: 'Carlos Vega', smType: 'BD SM',
    cv: 4100, targetBookingSize: 4400, availableCapacity: 0,
    pctTargetFromSizeAchieved: 93,
    proxyBuReview: 61, proxyBuReview2: 64, proxySizeDiscount: 57, proxyGraded: 61,
  },
  {
    id: 'BD-004', aeName: 'Mei Lin',
    role: 'BD II – Enterprise GBS', aibd: 'BD', geoTerr: 'Enterprise',
    region: 'North America - East', manager: 'Carlos Vega', smType: 'BD SM',
    cv: 2900, targetBookingSize: 3200, availableCapacity: 2,
    pctTargetFromSizeAchieved: 78,
    proxyBuReview: 85, proxyBuReview2: 88, proxySizeDiscount: 81, proxyGraded: 85,
  },

  // ── Amara Diallo (BD SM · BD · Commercial) ────────────────────────────
  {
    id: 'BD-005', aeName: 'Ethan Brandt',
    role: 'BD II – Commercial GBS', aibd: 'BD', geoTerr: 'Commercial',
    region: 'North America - East', manager: 'Amara Diallo', smType: 'BD SM',
    cv: 1700, targetBookingSize: 2000, availableCapacity: 1,
    pctTargetFromSizeAchieved: 60,
    proxyBuReview: 73, proxyBuReview2: 76, proxySizeDiscount: 69, proxyGraded: 73,
  },
  {
    id: 'BD-006', aeName: 'Hana Fujimoto',
    role: 'BD I – Commercial GBS', aibd: 'BD', geoTerr: 'Commercial',
    region: 'North America - East', manager: 'Amara Diallo', smType: 'BD SM',
    cv: 1200, targetBookingSize: 1500, availableCapacity: 3,
    pctTargetFromSizeAchieved: 52,
    proxyBuReview: 86, proxyBuReview2: 89, proxySizeDiscount: 82, proxyGraded: 86,
  },
  {
    id: 'BD-007', aeName: 'Luke Ferreira',
    role: 'BD II – Commercial GBS', aibd: 'BD', geoTerr: 'Commercial',
    region: 'North America - East', manager: 'Amara Diallo', smType: 'BD SM',
    cv: 2000, targetBookingSize: 2300, availableCapacity: 0,
    pctTargetFromSizeAchieved: 84,
    proxyBuReview: 64, proxyBuReview2: 67, proxySizeDiscount: 60, proxyGraded: 64,
  },
  {
    id: 'BD-008', aeName: 'Nia Okonkwo',
    role: 'BD III – Commercial GBS', aibd: 'BD', geoTerr: 'Commercial',
    region: 'North America - East', manager: 'Amara Diallo', smType: 'BD SM',
    cv: 2500, targetBookingSize: 2700, availableCapacity: 2,
    pctTargetFromSizeAchieved: 69,
    proxyBuReview: 80, proxyBuReview2: 83, proxySizeDiscount: 76, proxyGraded: 80,
  },

  // ── James Whitfield (BD SM · BD · SMB) ────────────────────────────────
  {
    id: 'BD-009', aeName: 'Ryan Cho',
    role: 'BD I – SMB GBS', aibd: 'BD', geoTerr: 'SMB',
    region: 'North America - East', manager: 'James Whitfield', smType: 'BD SM',
    cv: 580, targetBookingSize: 800, availableCapacity: 5,
    pctTargetFromSizeAchieved: 48,
    proxyBuReview: 88, proxyBuReview2: 91, proxySizeDiscount: 84, proxyGraded: 88,
  },
  {
    id: 'BD-010', aeName: 'Ana Reyes',
    role: 'BD II – SMB GBS', aibd: 'BD', geoTerr: 'SMB',
    region: 'North America - East', manager: 'James Whitfield', smType: 'BD SM',
    cv: 900, targetBookingSize: 1100, availableCapacity: 2,
    pctTargetFromSizeAchieved: 55,
    proxyBuReview: 76, proxyBuReview2: 79, proxySizeDiscount: 72, proxyGraded: 76,
  },
  {
    id: 'BD-011', aeName: 'Kai Nakamura',
    role: 'BD I – SMB GBS', aibd: 'BD', geoTerr: 'SMB',
    region: 'North America - East', manager: 'James Whitfield', smType: 'BD SM',
    cv: 650, targetBookingSize: 900, availableCapacity: 3,
    pctTargetFromSizeAchieved: 50,
    proxyBuReview: 83, proxyBuReview2: 86, proxySizeDiscount: 79, proxyGraded: 83,
  },
  {
    id: 'BD-012', aeName: 'Fatima Hassan',
    role: 'BD II – SMB GBS', aibd: 'BD', geoTerr: 'SMB',
    region: 'North America - East', manager: 'James Whitfield', smType: 'BD SM',
    cv: 1050, targetBookingSize: 1200, availableCapacity: 0,
    pctTargetFromSizeAchieved: 94,
    proxyBuReview: 59, proxyBuReview2: 62, proxySizeDiscount: 55, proxyGraded: 59,
  },
];

// ─── Recommended Accounts ──────────────────────────────────────────────────
export const REBALANCE_ACCOUNTS = [
  {
    id: 'ACC-001', aeName: 'Jordan Blake',
    company: 'Nexgen Systems Inc.', cv: 420000,
    sinceDate: '2021-03', country: 'USA', state: 'New York',
    industry: 'Technology', segment: 'Enterprise', sizeM: 1.2,
    proxyPremiumNotes: 'High renewal probability. Expansion opportunity in Q3. Premium account flagged for upsell.',
    history: [
      { year: 2022, cv: 310000, notes: 'Initial contract' },
      { year: 2023, cv: 370000, notes: 'Expanded seat count' },
      { year: 2024, cv: 420000, notes: 'Multi-product adoption' },
    ],
  },
  {
    id: 'ACC-002', aeName: 'Taylor Singh',
    company: 'Arcturus Financial Group', cv: 780000,
    sinceDate: '2019-07', country: 'USA', state: 'Illinois',
    industry: 'Financial Services', segment: 'Large Enterprise', sizeM: 3.4,
    proxyPremiumNotes: 'Strategic account. BU review pending. Discount applied for multi-year deal.',
    history: [
      { year: 2021, cv: 550000, notes: 'Global expansion' },
      { year: 2022, cv: 650000, notes: 'Premium tier upgrade' },
      { year: 2023, cv: 780000, notes: 'New LOB added' },
    ],
  },
  {
    id: 'ACC-003', aeName: 'Quinn Patel',
    company: 'Luminary Health Partners', cv: 195000,
    sinceDate: '2022-11', country: 'Canada', state: 'Ontario',
    industry: 'Healthcare', segment: 'Commercial', sizeM: 0.8,
    proxyPremiumNotes: 'Growth trajectory strong. Recommend territory move to capitalise.',
    history: [
      { year: 2023, cv: 140000, notes: 'Pilot program' },
      { year: 2024, cv: 195000, notes: 'Full deployment' },
    ],
  },
  {
    id: 'ACC-004', aeName: 'Ryan Cho',
    company: 'Vantage Retail Solutions', cv: 310000,
    sinceDate: '2020-04', country: 'USA', state: 'Texas',
    industry: 'Retail', segment: 'Enterprise', sizeM: 1.5,
    proxyPremiumNotes: 'At-risk renewal. Competitor activity noted. Requires executive sponsorship.',
    history: [
      { year: 2021, cv: 280000, notes: 'Initial onboarding' },
      { year: 2022, cv: 295000, notes: 'Stable renewal' },
      { year: 2023, cv: 310000, notes: 'Minor expansion' },
    ],
  },
  {
    id: 'ACC-005', aeName: 'Hana Fujimoto',
    company: 'Pinnacle Manufacturing Co.', cv: 540000,
    sinceDate: '2018-09', country: 'USA', state: 'Michigan',
    industry: 'Manufacturing', segment: 'Large Enterprise', sizeM: 2.1,
    proxyPremiumNotes: 'Long-standing account. Proxy score high. Collapse candidate if BD overloaded.',
    history: [
      { year: 2020, cv: 410000, notes: 'Pre-COVID baseline' },
      { year: 2021, cv: 460000, notes: 'Recovery growth' },
      { year: 2022, cv: 510000, notes: 'Digital transformation' },
      { year: 2023, cv: 540000, notes: 'Stable renewal' },
    ],
  },
];
