// ─── Source of truth: data/territory_data.csv ─────────────────────────────

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
// Each region: 3 AE SMs + 3 BD SMs. Every manager has 4 reps in MOCK_AE_DATA.

export const SALES_MANAGERS = {
  'North America - East': [
    'Rachel Monroe',   // AE SM · Enterprise
    'David Osei',      // AE SM · Commercial
    'Laura Petersen',  // AE SM · SMB
    'Carlos Vega',     // BD SM · Enterprise
    'Amara Diallo',    // BD SM · Commercial
    'James Whitfield', // BD SM · SMB
  ],
  'North America - West': [
    'Carlos Delgado',  // AE SM · Enterprise
    'Priya Nair',      // AE SM · Commercial
    'Kevin Brandt',    // AE SM · SMB
    'Tiffany Cho',     // BD SM · Enterprise
    'Nathan Abrams',   // BD SM · Commercial
    'Zoe Hartmann',    // BD SM · SMB
  ],
  'EMEA': [
    'Alistair Hughes',      // AE SM · Enterprise
    'Marie-Claire Dubois',  // AE SM · Commercial
    'Stefan Braun',         // AE SM · SMB
    'Fatima Al-Rashid',     // BD SM · Enterprise
    'Luca Ferretti',        // BD SM · Commercial
    'Ingrid Svensson',      // BD SM · SMB
  ],
  'APAC': [
    'Yuki Nakamura',  // AE SM · Enterprise
    'Lin Wei',        // AE SM · Commercial
    'Arjun Sharma',   // AE SM · SMB
    'Soo-Jin Park',   // BD SM · Enterprise
    'Budi Santoso',   // BD SM · Commercial
    'Mei Ling Ho',    // BD SM · SMB
  ],
  'India': [
    'Rohan Verma',   // AE SM · Enterprise
    'Anjali Mehta',  // AE SM · Commercial
    'Sanjay Pillai', // AE SM · SMB
    'Pooja Iyer',    // BD SM · Enterprise
    'Vivek Bhatia',  // BD SM · Commercial
    'Nisha Kapoor',  // BD SM · SMB
  ],
};

// ─── Rep Data ──────────────────────────────────────────────────────────────
// Layout: 5 regions × 6 managers × 4 reps = 120 reps total
// AE IDs: NAE-AE-001…, NAW-AE-001…, EMEA-AE-001…, APAC-AE-001…, IND-AE-001…
// BD IDs: NAE-BD-001…, NAW-BD-001…, etc.

export const MOCK_AE_DATA = [

  // ══════════════════════════════════════════════════════════════════════════
  // NORTH AMERICA – EAST
  // ══════════════════════════════════════════════════════════════════════════

  // ── Rachel Monroe · AE SM · Enterprise ───────────────────────────────────
  { id:'NAE-AE-001', aeName:'Jordan Blake',   role:'AE II – Enterprise GTS', aibd:'AI', geoTerr:'Enterprise', region:'North America - East', manager:'Rachel Monroe', smType:'AE SM', cv:2400, targetBookingSize:2800, availableCapacity:1, pctTargetFromSizeAchieved:55, proxyBuReview:78, proxyBuReview2:81, proxySizeDiscount:72, proxyGraded:76 },
  { id:'NAE-AE-002', aeName:'Priya Kapoor',   role:'AE I – Enterprise GTS',  aibd:'AI', geoTerr:'Enterprise', region:'North America - East', manager:'Rachel Monroe', smType:'AE SM', cv:1950, targetBookingSize:2500, availableCapacity:2, pctTargetFromSizeAchieved:62, proxyBuReview:70, proxyBuReview2:74, proxySizeDiscount:65, proxyGraded:70 },
  { id:'NAE-AE-003', aeName:'Marcus Webb',    role:'AE III – Enterprise GTS', aibd:'AI', geoTerr:'Enterprise', region:'North America - East', manager:'Rachel Monroe', smType:'AE SM', cv:3100, targetBookingSize:3400, availableCapacity:0, pctTargetFromSizeAchieved:88, proxyBuReview:55, proxyBuReview2:58, proxySizeDiscount:50, proxyGraded:55 },
  { id:'NAE-AE-004', aeName:'Sofia Delgado',  role:'AE II – Enterprise GTS', aibd:'AI', geoTerr:'Enterprise', region:'North America - East', manager:'Rachel Monroe', smType:'AE SM', cv:2700, targetBookingSize:3000, availableCapacity:1, pctTargetFromSizeAchieved:72, proxyBuReview:82, proxyBuReview2:85, proxySizeDiscount:78, proxyGraded:82 },

  // ── David Osei · AE SM · Commercial ──────────────────────────────────────
  { id:'NAE-AE-005', aeName:'Avery Chen',    role:'AE I – Commercial GTS',   aibd:'AI', geoTerr:'Commercial', region:'North America - East', manager:'David Osei', smType:'AE SM', cv:950,  targetBookingSize:1200, availableCapacity:0, pctTargetFromSizeAchieved:86, proxyBuReview:60, proxyBuReview2:63, proxySizeDiscount:55, proxyGraded:60 },
  { id:'NAE-AE-006', aeName:'Riley Okafor',  role:'AE II – Commercial GTS',  aibd:'AI', geoTerr:'Commercial', region:'North America - East', manager:'David Osei', smType:'AE SM', cv:1600, targetBookingSize:2000, availableCapacity:2, pctTargetFromSizeAchieved:58, proxyBuReview:75, proxyBuReview2:78, proxySizeDiscount:70, proxyGraded:75 },
  { id:'NAE-AE-007', aeName:'Jamie Park',    role:'AE III – Commercial GTS', aibd:'AI', geoTerr:'Commercial', region:'North America - East', manager:'David Osei', smType:'AE SM', cv:2100, targetBookingSize:2400, availableCapacity:1, pctTargetFromSizeAchieved:65, proxyBuReview:68, proxyBuReview2:71, proxySizeDiscount:64, proxyGraded:68 },
  { id:'NAE-AE-008', aeName:'Natasha Iyer',  role:'AE II – Commercial GTS',  aibd:'AI', geoTerr:'Commercial', region:'North America - East', manager:'David Osei', smType:'AE SM', cv:1800, targetBookingSize:2200, availableCapacity:3, pctTargetFromSizeAchieved:45, proxyBuReview:88, proxyBuReview2:91, proxySizeDiscount:83, proxyGraded:88 },

  // ── Laura Petersen · AE SM · SMB ─────────────────────────────────────────
  { id:'NAE-AE-009', aeName:'Quinn Patel',   role:'AE I – SMB GTS',  aibd:'AI', geoTerr:'SMB', region:'North America - East', manager:'Laura Petersen', smType:'AE SM', cv:680,  targetBookingSize:900,  availableCapacity:4, pctTargetFromSizeAchieved:45, proxyBuReview:84, proxyBuReview2:87, proxySizeDiscount:79, proxyGraded:84 },
  { id:'NAE-AE-010', aeName:'Sam Torres',    role:'AE II – SMB GTS', aibd:'AI', geoTerr:'SMB', region:'North America - East', manager:'Laura Petersen', smType:'AE SM', cv:1100, targetBookingSize:1300, availableCapacity:1, pctTargetFromSizeAchieved:58, proxyBuReview:72, proxyBuReview2:75, proxySizeDiscount:68, proxyGraded:72 },
  { id:'NAE-AE-011', aeName:'Casey Navarro', role:'AE I – SMB GTS',  aibd:'AI', geoTerr:'SMB', region:'North America - East', manager:'Laura Petersen', smType:'AE SM', cv:750,  targetBookingSize:1000, availableCapacity:2, pctTargetFromSizeAchieved:52, proxyBuReview:79, proxyBuReview2:82, proxySizeDiscount:74, proxyGraded:79 },
  { id:'NAE-AE-012', aeName:'Morgan Kim',    role:'AE II – SMB GTS', aibd:'AI', geoTerr:'SMB', region:'North America - East', manager:'Laura Petersen', smType:'AE SM', cv:960,  targetBookingSize:1100, availableCapacity:0, pctTargetFromSizeAchieved:91, proxyBuReview:58, proxyBuReview2:61, proxySizeDiscount:54, proxyGraded:58 },

  // ── Carlos Vega · BD SM · Enterprise ─────────────────────────────────────
  { id:'NAE-BD-001', aeName:'Taylor Singh',      role:'BD II – Enterprise GBS', aibd:'BD', geoTerr:'Enterprise', region:'North America - East', manager:'Carlos Vega', smType:'BD SM', cv:3200, targetBookingSize:3500, availableCapacity:3, pctTargetFromSizeAchieved:72, proxyBuReview:90, proxyBuReview2:93, proxySizeDiscount:86, proxyGraded:90 },
  { id:'NAE-BD-002', aeName:'Leila Osman',       role:'BD I – Enterprise GBS',  aibd:'BD', geoTerr:'Enterprise', region:'North America - East', manager:'Carlos Vega', smType:'BD SM', cv:2600, targetBookingSize:2900, availableCapacity:1, pctTargetFromSizeAchieved:66, proxyBuReview:77, proxyBuReview2:80, proxySizeDiscount:73, proxyGraded:77 },
  { id:'NAE-BD-003', aeName:'Noah Christensen',  role:'BD III – Enterprise GBS', aibd:'BD', geoTerr:'Enterprise', region:'North America - East', manager:'Carlos Vega', smType:'BD SM', cv:4100, targetBookingSize:4400, availableCapacity:0, pctTargetFromSizeAchieved:93, proxyBuReview:61, proxyBuReview2:64, proxySizeDiscount:57, proxyGraded:61 },
  { id:'NAE-BD-004', aeName:'Mei Lin',           role:'BD II – Enterprise GBS', aibd:'BD', geoTerr:'Enterprise', region:'North America - East', manager:'Carlos Vega', smType:'BD SM', cv:2900, targetBookingSize:3200, availableCapacity:2, pctTargetFromSizeAchieved:78, proxyBuReview:85, proxyBuReview2:88, proxySizeDiscount:81, proxyGraded:85 },

  // ── Amara Diallo · BD SM · Commercial ────────────────────────────────────
  { id:'NAE-BD-005', aeName:'Ethan Brandt',   role:'BD II – Commercial GBS',  aibd:'BD', geoTerr:'Commercial', region:'North America - East', manager:'Amara Diallo', smType:'BD SM', cv:1700, targetBookingSize:2000, availableCapacity:1, pctTargetFromSizeAchieved:60, proxyBuReview:73, proxyBuReview2:76, proxySizeDiscount:69, proxyGraded:73 },
  { id:'NAE-BD-006', aeName:'Hana Fujimoto',  role:'BD I – Commercial GBS',   aibd:'BD', geoTerr:'Commercial', region:'North America - East', manager:'Amara Diallo', smType:'BD SM', cv:1200, targetBookingSize:1500, availableCapacity:3, pctTargetFromSizeAchieved:52, proxyBuReview:86, proxyBuReview2:89, proxySizeDiscount:82, proxyGraded:86 },
  { id:'NAE-BD-007', aeName:'Luke Ferreira',  role:'BD II – Commercial GBS',  aibd:'BD', geoTerr:'Commercial', region:'North America - East', manager:'Amara Diallo', smType:'BD SM', cv:2000, targetBookingSize:2300, availableCapacity:0, pctTargetFromSizeAchieved:84, proxyBuReview:64, proxyBuReview2:67, proxySizeDiscount:60, proxyGraded:64 },
  { id:'NAE-BD-008', aeName:'Nia Okonkwo',    role:'BD III – Commercial GBS', aibd:'BD', geoTerr:'Commercial', region:'North America - East', manager:'Amara Diallo', smType:'BD SM', cv:2500, targetBookingSize:2700, availableCapacity:2, pctTargetFromSizeAchieved:69, proxyBuReview:80, proxyBuReview2:83, proxySizeDiscount:76, proxyGraded:80 },

  // ── James Whitfield · BD SM · SMB ────────────────────────────────────────
  { id:'NAE-BD-009', aeName:'Ryan Cho',       role:'BD I – SMB GBS',  aibd:'BD', geoTerr:'SMB', region:'North America - East', manager:'James Whitfield', smType:'BD SM', cv:580,  targetBookingSize:800,  availableCapacity:5, pctTargetFromSizeAchieved:48, proxyBuReview:88, proxyBuReview2:91, proxySizeDiscount:84, proxyGraded:88 },
  { id:'NAE-BD-010', aeName:'Ana Reyes',      role:'BD II – SMB GBS', aibd:'BD', geoTerr:'SMB', region:'North America - East', manager:'James Whitfield', smType:'BD SM', cv:900,  targetBookingSize:1100, availableCapacity:2, pctTargetFromSizeAchieved:55, proxyBuReview:76, proxyBuReview2:79, proxySizeDiscount:72, proxyGraded:76 },
  { id:'NAE-BD-011', aeName:'Kai Nakamura',   role:'BD I – SMB GBS',  aibd:'BD', geoTerr:'SMB', region:'North America - East', manager:'James Whitfield', smType:'BD SM', cv:650,  targetBookingSize:900,  availableCapacity:3, pctTargetFromSizeAchieved:50, proxyBuReview:83, proxyBuReview2:86, proxySizeDiscount:79, proxyGraded:83 },
  { id:'NAE-BD-012', aeName:'Fatima Hassan',  role:'BD II – SMB GBS', aibd:'BD', geoTerr:'SMB', region:'North America - East', manager:'James Whitfield', smType:'BD SM', cv:1050, targetBookingSize:1200, availableCapacity:0, pctTargetFromSizeAchieved:94, proxyBuReview:59, proxyBuReview2:62, proxySizeDiscount:55, proxyGraded:59 },

  // ══════════════════════════════════════════════════════════════════════════
  // NORTH AMERICA – WEST
  // ══════════════════════════════════════════════════════════════════════════

  // ── Carlos Delgado · AE SM · Enterprise ──────────────────────────────────
  { id:'NAW-AE-001', aeName:'Diane Frost',    role:'AE II – Enterprise GTS', aibd:'AI', geoTerr:'Enterprise', region:'North America - West', manager:'Carlos Delgado', smType:'AE SM', cv:2200, targetBookingSize:2600, availableCapacity:2, pctTargetFromSizeAchieved:58, proxyBuReview:74, proxyBuReview2:77, proxySizeDiscount:70, proxyGraded:74 },
  { id:'NAW-AE-002', aeName:'Brett Lawson',   role:'AE I – Enterprise GTS',  aibd:'AI', geoTerr:'Enterprise', region:'North America - West', manager:'Carlos Delgado', smType:'AE SM', cv:1750, targetBookingSize:2200, availableCapacity:3, pctTargetFromSizeAchieved:50, proxyBuReview:80, proxyBuReview2:83, proxySizeDiscount:76, proxyGraded:80 },
  { id:'NAW-AE-003', aeName:'Serena Malik',   role:'AE III – Enterprise GTS', aibd:'AI', geoTerr:'Enterprise', region:'North America - West', manager:'Carlos Delgado', smType:'AE SM', cv:3300, targetBookingSize:3600, availableCapacity:0, pctTargetFromSizeAchieved:91, proxyBuReview:57, proxyBuReview2:60, proxySizeDiscount:53, proxyGraded:57 },
  { id:'NAW-AE-004', aeName:'Derek Chang',    role:'AE II – Enterprise GTS', aibd:'AI', geoTerr:'Enterprise', region:'North America - West', manager:'Carlos Delgado', smType:'AE SM', cv:2550, targetBookingSize:2900, availableCapacity:1, pctTargetFromSizeAchieved:69, proxyBuReview:79, proxyBuReview2:82, proxySizeDiscount:75, proxyGraded:79 },

  // ── Priya Nair · AE SM · Commercial ──────────────────────────────────────
  { id:'NAW-AE-005', aeName:'Olivia Grant',   role:'AE I – Commercial GTS',   aibd:'AI', geoTerr:'Commercial', region:'North America - West', manager:'Priya Nair', smType:'AE SM', cv:1050, targetBookingSize:1300, availableCapacity:2, pctTargetFromSizeAchieved:57, proxyBuReview:77, proxyBuReview2:80, proxySizeDiscount:73, proxyGraded:77 },
  { id:'NAW-AE-006', aeName:'Marcus Tran',    role:'AE II – Commercial GTS',  aibd:'AI', geoTerr:'Commercial', region:'North America - West', manager:'Priya Nair', smType:'AE SM', cv:1900, targetBookingSize:2200, availableCapacity:0, pctTargetFromSizeAchieved:83, proxyBuReview:62, proxyBuReview2:65, proxySizeDiscount:58, proxyGraded:62 },
  { id:'NAW-AE-007', aeName:'Isla Shepherd',  role:'AE III – Commercial GTS', aibd:'AI', geoTerr:'Commercial', region:'North America - West', manager:'Priya Nair', smType:'AE SM', cv:2300, targetBookingSize:2600, availableCapacity:1, pctTargetFromSizeAchieved:72, proxyBuReview:71, proxyBuReview2:74, proxySizeDiscount:67, proxyGraded:71 },
  { id:'NAW-AE-008', aeName:'Deon Petrov',    role:'AE II – Commercial GTS',  aibd:'AI', geoTerr:'Commercial', region:'North America - West', manager:'Priya Nair', smType:'AE SM', cv:1450, targetBookingSize:1800, availableCapacity:3, pctTargetFromSizeAchieved:48, proxyBuReview:86, proxyBuReview2:89, proxySizeDiscount:82, proxyGraded:86 },

  // ── Kevin Brandt · AE SM · SMB ────────────────────────────────────────────
  { id:'NAW-AE-009', aeName:'Chloe Nguyen',   role:'AE I – SMB GTS',  aibd:'AI', geoTerr:'SMB', region:'North America - West', manager:'Kevin Brandt', smType:'AE SM', cv:720,  targetBookingSize:950,  availableCapacity:3, pctTargetFromSizeAchieved:46, proxyBuReview:82, proxyBuReview2:85, proxySizeDiscount:78, proxyGraded:82 },
  { id:'NAW-AE-010', aeName:'Jake Moreau',    role:'AE II – SMB GTS', aibd:'AI', geoTerr:'SMB', region:'North America - West', manager:'Kevin Brandt', smType:'AE SM', cv:1000, targetBookingSize:1200, availableCapacity:1, pctTargetFromSizeAchieved:60, proxyBuReview:70, proxyBuReview2:73, proxySizeDiscount:66, proxyGraded:70 },
  { id:'NAW-AE-011', aeName:'Amber Collins',  role:'AE I – SMB GTS',  aibd:'AI', geoTerr:'SMB', region:'North America - West', manager:'Kevin Brandt', smType:'AE SM', cv:830,  targetBookingSize:1050, availableCapacity:2, pctTargetFromSizeAchieved:54, proxyBuReview:75, proxyBuReview2:78, proxySizeDiscount:71, proxyGraded:75 },
  { id:'NAW-AE-012', aeName:'Victor Solis',   role:'AE II – SMB GTS', aibd:'AI', geoTerr:'SMB', region:'North America - West', manager:'Kevin Brandt', smType:'AE SM', cv:990,  targetBookingSize:1100, availableCapacity:0, pctTargetFromSizeAchieved:89, proxyBuReview:56, proxyBuReview2:59, proxySizeDiscount:52, proxyGraded:56 },

  // ── Tiffany Cho · BD SM · Enterprise ─────────────────────────────────────
  { id:'NAW-BD-001', aeName:'Ryan Park',      role:'BD II – Enterprise GBS', aibd:'BD', geoTerr:'Enterprise', region:'North America - West', manager:'Tiffany Cho', smType:'BD SM', cv:3000, targetBookingSize:3300, availableCapacity:2, pctTargetFromSizeAchieved:70, proxyBuReview:88, proxyBuReview2:91, proxySizeDiscount:84, proxyGraded:88 },
  { id:'NAW-BD-002', aeName:'Sabrina Wells',  role:'BD I – Enterprise GBS',  aibd:'BD', geoTerr:'Enterprise', region:'North America - West', manager:'Tiffany Cho', smType:'BD SM', cv:2400, targetBookingSize:2800, availableCapacity:1, pctTargetFromSizeAchieved:64, proxyBuReview:75, proxyBuReview2:78, proxySizeDiscount:71, proxyGraded:75 },
  { id:'NAW-BD-003', aeName:'Finn Harrington',role:'BD III – Enterprise GBS', aibd:'BD', geoTerr:'Enterprise', region:'North America - West', manager:'Tiffany Cho', smType:'BD SM', cv:3900, targetBookingSize:4200, availableCapacity:0, pctTargetFromSizeAchieved:92, proxyBuReview:60, proxyBuReview2:63, proxySizeDiscount:56, proxyGraded:60 },
  { id:'NAW-BD-004', aeName:'Yara Castillo',  role:'BD II – Enterprise GBS', aibd:'BD', geoTerr:'Enterprise', region:'North America - West', manager:'Tiffany Cho', smType:'BD SM', cv:2750, targetBookingSize:3100, availableCapacity:3, pctTargetFromSizeAchieved:67, proxyBuReview:83, proxyBuReview2:86, proxySizeDiscount:79, proxyGraded:83 },

  // ── Nathan Abrams · BD SM · Commercial ───────────────────────────────────
  { id:'NAW-BD-005', aeName:'Leo Martins',    role:'BD II – Commercial GBS',  aibd:'BD', geoTerr:'Commercial', region:'North America - West', manager:'Nathan Abrams', smType:'BD SM', cv:1600, targetBookingSize:1900, availableCapacity:2, pctTargetFromSizeAchieved:62, proxyBuReview:71, proxyBuReview2:74, proxySizeDiscount:67, proxyGraded:71 },
  { id:'NAW-BD-006', aeName:'Grace Kim',      role:'BD I – Commercial GBS',   aibd:'BD', geoTerr:'Commercial', region:'North America - West', manager:'Nathan Abrams', smType:'BD SM', cv:1100, targetBookingSize:1400, availableCapacity:4, pctTargetFromSizeAchieved:49, proxyBuReview:84, proxyBuReview2:87, proxySizeDiscount:80, proxyGraded:84 },
  { id:'NAW-BD-007', aeName:'Omar Farouk',    role:'BD II – Commercial GBS',  aibd:'BD', geoTerr:'Commercial', region:'North America - West', manager:'Nathan Abrams', smType:'BD SM', cv:1950, targetBookingSize:2200, availableCapacity:0, pctTargetFromSizeAchieved:85, proxyBuReview:63, proxyBuReview2:66, proxySizeDiscount:59, proxyGraded:63 },
  { id:'NAW-BD-008', aeName:'Tara Olsen',     role:'BD III – Commercial GBS', aibd:'BD', geoTerr:'Commercial', region:'North America - West', manager:'Nathan Abrams', smType:'BD SM', cv:2350, targetBookingSize:2600, availableCapacity:1, pctTargetFromSizeAchieved:75, proxyBuReview:78, proxyBuReview2:81, proxySizeDiscount:74, proxyGraded:78 },

  // ── Zoe Hartmann · BD SM · SMB ───────────────────────────────────────────
  { id:'NAW-BD-009', aeName:'Sam Rivera',     role:'BD I – SMB GBS',  aibd:'BD', geoTerr:'SMB', region:'North America - West', manager:'Zoe Hartmann', smType:'BD SM', cv:600,  targetBookingSize:850,  availableCapacity:4, pctTargetFromSizeAchieved:47, proxyBuReview:85, proxyBuReview2:88, proxySizeDiscount:81, proxyGraded:85 },
  { id:'NAW-BD-010', aeName:'Isla Brennan',   role:'BD II – SMB GBS', aibd:'BD', geoTerr:'SMB', region:'North America - West', manager:'Zoe Hartmann', smType:'BD SM', cv:850,  targetBookingSize:1050, availableCapacity:2, pctTargetFromSizeAchieved:53, proxyBuReview:74, proxyBuReview2:77, proxySizeDiscount:70, proxyGraded:74 },
  { id:'NAW-BD-011', aeName:'Felix Morin',    role:'BD I – SMB GBS',  aibd:'BD', geoTerr:'SMB', region:'North America - West', manager:'Zoe Hartmann', smType:'BD SM', cv:700,  targetBookingSize:920,  availableCapacity:3, pctTargetFromSizeAchieved:51, proxyBuReview:80, proxyBuReview2:83, proxySizeDiscount:76, proxyGraded:80 },
  { id:'NAW-BD-012', aeName:'Nadia Brooks',   role:'BD II – SMB GBS', aibd:'BD', geoTerr:'SMB', region:'North America - West', manager:'Zoe Hartmann', smType:'BD SM', cv:1020, targetBookingSize:1150, availableCapacity:0, pctTargetFromSizeAchieved:93, proxyBuReview:57, proxyBuReview2:60, proxySizeDiscount:53, proxyGraded:57 },

  // ══════════════════════════════════════════════════════════════════════════
  // EMEA
  // ══════════════════════════════════════════════════════════════════════════

  // ── Alistair Hughes · AE SM · Enterprise ─────────────────────────────────
  { id:'EMEA-AE-001', aeName:'Charlotte Webb',   role:'AE II – Enterprise GTS', aibd:'AI', geoTerr:'Enterprise', region:'EMEA', manager:'Alistair Hughes', smType:'AE SM', cv:2300, targetBookingSize:2700, availableCapacity:1, pctTargetFromSizeAchieved:61, proxyBuReview:76, proxyBuReview2:79, proxySizeDiscount:72, proxyGraded:76 },
  { id:'EMEA-AE-002', aeName:'Hugo Lemaire',     role:'AE I – Enterprise GTS',  aibd:'AI', geoTerr:'Enterprise', region:'EMEA', manager:'Alistair Hughes', smType:'AE SM', cv:1800, targetBookingSize:2300, availableCapacity:2, pctTargetFromSizeAchieved:54, proxyBuReview:81, proxyBuReview2:84, proxySizeDiscount:77, proxyGraded:81 },
  { id:'EMEA-AE-003', aeName:'Rania Aziz',       role:'AE III – Enterprise GTS', aibd:'AI', geoTerr:'Enterprise', region:'EMEA', manager:'Alistair Hughes', smType:'AE SM', cv:3200, targetBookingSize:3500, availableCapacity:0, pctTargetFromSizeAchieved:90, proxyBuReview:58, proxyBuReview2:61, proxySizeDiscount:54, proxyGraded:58 },
  { id:'EMEA-AE-004', aeName:'Pieter van Dijk',  role:'AE II – Enterprise GTS', aibd:'AI', geoTerr:'Enterprise', region:'EMEA', manager:'Alistair Hughes', smType:'AE SM', cv:2600, targetBookingSize:2950, availableCapacity:1, pctTargetFromSizeAchieved:74, proxyBuReview:80, proxyBuReview2:83, proxySizeDiscount:76, proxyGraded:80 },

  // ── Marie-Claire Dubois · AE SM · Commercial ─────────────────────────────
  { id:'EMEA-AE-005', aeName:'Lars Nielsen',     role:'AE I – Commercial GTS',   aibd:'AI', geoTerr:'Commercial', region:'EMEA', manager:'Marie-Claire Dubois', smType:'AE SM', cv:980,  targetBookingSize:1250, availableCapacity:2, pctTargetFromSizeAchieved:55, proxyBuReview:73, proxyBuReview2:76, proxySizeDiscount:69, proxyGraded:73 },
  { id:'EMEA-AE-006', aeName:'Sophia Bauer',     role:'AE II – Commercial GTS',  aibd:'AI', geoTerr:'Commercial', region:'EMEA', manager:'Marie-Claire Dubois', smType:'AE SM', cv:1750, targetBookingSize:2100, availableCapacity:0, pctTargetFromSizeAchieved:82, proxyBuReview:63, proxyBuReview2:66, proxySizeDiscount:59, proxyGraded:63 },
  { id:'EMEA-AE-007', aeName:'Ahmed Mansour',    role:'AE III – Commercial GTS', aibd:'AI', geoTerr:'Commercial', region:'EMEA', manager:'Marie-Claire Dubois', smType:'AE SM', cv:2050, targetBookingSize:2350, availableCapacity:1, pctTargetFromSizeAchieved:68, proxyBuReview:69, proxyBuReview2:72, proxySizeDiscount:65, proxyGraded:69 },
  { id:'EMEA-AE-008', aeName:'Elena Vasquez',    role:'AE II – Commercial GTS',  aibd:'AI', geoTerr:'Commercial', region:'EMEA', manager:'Marie-Claire Dubois', smType:'AE SM', cv:1500, targetBookingSize:1850, availableCapacity:3, pctTargetFromSizeAchieved:46, proxyBuReview:87, proxyBuReview2:90, proxySizeDiscount:83, proxyGraded:87 },

  // ── Stefan Braun · AE SM · SMB ───────────────────────────────────────────
  { id:'EMEA-AE-009', aeName:'Freya Jensen',     role:'AE I – SMB GTS',  aibd:'AI', geoTerr:'SMB', region:'EMEA', manager:'Stefan Braun', smType:'AE SM', cv:700,  targetBookingSize:920,  availableCapacity:3, pctTargetFromSizeAchieved:44, proxyBuReview:83, proxyBuReview2:86, proxySizeDiscount:79, proxyGraded:83 },
  { id:'EMEA-AE-010', aeName:'Matteo Romano',    role:'AE II – SMB GTS', aibd:'AI', geoTerr:'SMB', region:'EMEA', manager:'Stefan Braun', smType:'AE SM', cv:1050, targetBookingSize:1280, availableCapacity:1, pctTargetFromSizeAchieved:57, proxyBuReview:71, proxyBuReview2:74, proxySizeDiscount:67, proxyGraded:71 },
  { id:'EMEA-AE-011', aeName:'Niamh O\'Brien',   role:'AE I – SMB GTS',  aibd:'AI', geoTerr:'SMB', region:'EMEA', manager:'Stefan Braun', smType:'AE SM', cv:780,  targetBookingSize:1000, availableCapacity:2, pctTargetFromSizeAchieved:51, proxyBuReview:78, proxyBuReview2:81, proxySizeDiscount:74, proxyGraded:78 },
  { id:'EMEA-AE-012', aeName:'Boris Kowalski',   role:'AE II – SMB GTS', aibd:'AI', geoTerr:'SMB', region:'EMEA', manager:'Stefan Braun', smType:'AE SM', cv:940,  targetBookingSize:1080, availableCapacity:0, pctTargetFromSizeAchieved:90, proxyBuReview:55, proxyBuReview2:58, proxySizeDiscount:51, proxyGraded:55 },

  // ── Fatima Al-Rashid · BD SM · Enterprise ────────────────────────────────
  { id:'EMEA-BD-001', aeName:'William Scott',    role:'BD II – Enterprise GBS', aibd:'BD', geoTerr:'Enterprise', region:'EMEA', manager:'Fatima Al-Rashid', smType:'BD SM', cv:3100, targetBookingSize:3400, availableCapacity:2, pctTargetFromSizeAchieved:71, proxyBuReview:89, proxyBuReview2:92, proxySizeDiscount:85, proxyGraded:89 },
  { id:'EMEA-BD-002', aeName:'Adaeze Obi',       role:'BD I – Enterprise GBS',  aibd:'BD', geoTerr:'Enterprise', region:'EMEA', manager:'Fatima Al-Rashid', smType:'BD SM', cv:2500, targetBookingSize:2800, availableCapacity:1, pctTargetFromSizeAchieved:65, proxyBuReview:76, proxyBuReview2:79, proxySizeDiscount:72, proxyGraded:76 },
  { id:'EMEA-BD-003', aeName:'Mikael Lindqvist', role:'BD III – Enterprise GBS', aibd:'BD', geoTerr:'Enterprise', region:'EMEA', manager:'Fatima Al-Rashid', smType:'BD SM', cv:4000, targetBookingSize:4300, availableCapacity:0, pctTargetFromSizeAchieved:92, proxyBuReview:60, proxyBuReview2:63, proxySizeDiscount:56, proxyGraded:60 },
  { id:'EMEA-BD-004', aeName:'Clara Hoffmann',   role:'BD II – Enterprise GBS', aibd:'BD', geoTerr:'Enterprise', region:'EMEA', manager:'Fatima Al-Rashid', smType:'BD SM', cv:2800, targetBookingSize:3100, availableCapacity:3, pctTargetFromSizeAchieved:68, proxyBuReview:84, proxyBuReview2:87, proxySizeDiscount:80, proxyGraded:84 },

  // ── Luca Ferretti · BD SM · Commercial ───────────────────────────────────
  { id:'EMEA-BD-005', aeName:'Zara Osei',        role:'BD II – Commercial GBS',  aibd:'BD', geoTerr:'Commercial', region:'EMEA', manager:'Luca Ferretti', smType:'BD SM', cv:1650, targetBookingSize:1950, availableCapacity:2, pctTargetFromSizeAchieved:61, proxyBuReview:72, proxyBuReview2:75, proxySizeDiscount:68, proxyGraded:72 },
  { id:'EMEA-BD-006', aeName:'Pierre Dupont',    role:'BD I – Commercial GBS',   aibd:'BD', geoTerr:'Commercial', region:'EMEA', manager:'Luca Ferretti', smType:'BD SM', cv:1150, targetBookingSize:1450, availableCapacity:4, pctTargetFromSizeAchieved:50, proxyBuReview:85, proxyBuReview2:88, proxySizeDiscount:81, proxyGraded:85 },
  { id:'EMEA-BD-007', aeName:'Helena Cruz',      role:'BD II – Commercial GBS',  aibd:'BD', geoTerr:'Commercial', region:'EMEA', manager:'Luca Ferretti', smType:'BD SM', cv:1950, targetBookingSize:2250, availableCapacity:0, pctTargetFromSizeAchieved:83, proxyBuReview:63, proxyBuReview2:66, proxySizeDiscount:59, proxyGraded:63 },
  { id:'EMEA-BD-008', aeName:'Kwame Asante',     role:'BD III – Commercial GBS', aibd:'BD', geoTerr:'Commercial', region:'EMEA', manager:'Luca Ferretti', smType:'BD SM', cv:2450, targetBookingSize:2700, availableCapacity:1, pctTargetFromSizeAchieved:77, proxyBuReview:79, proxyBuReview2:82, proxySizeDiscount:75, proxyGraded:79 },

  // ── Ingrid Svensson · BD SM · SMB ────────────────────────────────────────
  { id:'EMEA-BD-009', aeName:'Alexei Morozov',   role:'BD I – SMB GBS',  aibd:'BD', geoTerr:'SMB', region:'EMEA', manager:'Ingrid Svensson', smType:'BD SM', cv:560,  targetBookingSize:800,  availableCapacity:5, pctTargetFromSizeAchieved:46, proxyBuReview:87, proxyBuReview2:90, proxySizeDiscount:83, proxyGraded:87 },
  { id:'EMEA-BD-010', aeName:'Camille Bernard',  role:'BD II – SMB GBS', aibd:'BD', geoTerr:'SMB', region:'EMEA', manager:'Ingrid Svensson', smType:'BD SM', cv:880,  targetBookingSize:1080, availableCapacity:2, pctTargetFromSizeAchieved:54, proxyBuReview:75, proxyBuReview2:78, proxySizeDiscount:71, proxyGraded:75 },
  { id:'EMEA-BD-011', aeName:'Jonas Weber',      role:'BD I – SMB GBS',  aibd:'BD', geoTerr:'SMB', region:'EMEA', manager:'Ingrid Svensson', smType:'BD SM', cv:670,  targetBookingSize:890,  availableCapacity:3, pctTargetFromSizeAchieved:50, proxyBuReview:82, proxyBuReview2:85, proxySizeDiscount:78, proxyGraded:82 },
  { id:'EMEA-BD-012', aeName:'Amelia Frost',     role:'BD II – SMB GBS', aibd:'BD', geoTerr:'SMB', region:'EMEA', manager:'Ingrid Svensson', smType:'BD SM', cv:1030, targetBookingSize:1180, availableCapacity:0, pctTargetFromSizeAchieved:92, proxyBuReview:58, proxyBuReview2:61, proxySizeDiscount:54, proxyGraded:58 },

  // ══════════════════════════════════════════════════════════════════════════
  // APAC
  // ══════════════════════════════════════════════════════════════════════════

  // ── Yuki Nakamura · AE SM · Enterprise ───────────────────────────────────
  { id:'APAC-AE-001', aeName:'Haruto Sato',      role:'AE II – Enterprise GTS', aibd:'AI', geoTerr:'Enterprise', region:'APAC', manager:'Yuki Nakamura', smType:'AE SM', cv:2100, targetBookingSize:2500, availableCapacity:2, pctTargetFromSizeAchieved:59, proxyBuReview:75, proxyBuReview2:78, proxySizeDiscount:71, proxyGraded:75 },
  { id:'APAC-AE-002', aeName:'Aisha Patel',      role:'AE I – Enterprise GTS',  aibd:'AI', geoTerr:'Enterprise', region:'APAC', manager:'Yuki Nakamura', smType:'AE SM', cv:1700, targetBookingSize:2100, availableCapacity:3, pctTargetFromSizeAchieved:51, proxyBuReview:82, proxyBuReview2:85, proxySizeDiscount:78, proxyGraded:82 },
  { id:'APAC-AE-003', aeName:'Chen Wei',         role:'AE III – Enterprise GTS', aibd:'AI', geoTerr:'Enterprise', region:'APAC', manager:'Yuki Nakamura', smType:'AE SM', cv:3000, targetBookingSize:3300, availableCapacity:0, pctTargetFromSizeAchieved:89, proxyBuReview:57, proxyBuReview2:60, proxySizeDiscount:53, proxyGraded:57 },
  { id:'APAC-AE-004', aeName:'Priya Rajan',      role:'AE II – Enterprise GTS', aibd:'AI', geoTerr:'Enterprise', region:'APAC', manager:'Yuki Nakamura', smType:'AE SM', cv:2450, targetBookingSize:2800, availableCapacity:1, pctTargetFromSizeAchieved:70, proxyBuReview:81, proxyBuReview2:84, proxySizeDiscount:77, proxyGraded:81 },

  // ── Lin Wei · AE SM · Commercial ─────────────────────────────────────────
  { id:'APAC-AE-005', aeName:'Jae-won Oh',       role:'AE I – Commercial GTS',   aibd:'AI', geoTerr:'Commercial', region:'APAC', manager:'Lin Wei', smType:'AE SM', cv:920,  targetBookingSize:1200, availableCapacity:2, pctTargetFromSizeAchieved:56, proxyBuReview:74, proxyBuReview2:77, proxySizeDiscount:70, proxyGraded:74 },
  { id:'APAC-AE-006', aeName:'Mei Sasaki',       role:'AE II – Commercial GTS',  aibd:'AI', geoTerr:'Commercial', region:'APAC', manager:'Lin Wei', smType:'AE SM', cv:1650, targetBookingSize:2000, availableCapacity:0, pctTargetFromSizeAchieved:81, proxyBuReview:63, proxyBuReview2:66, proxySizeDiscount:59, proxyGraded:63 },
  { id:'APAC-AE-007', aeName:'Rahul Mehta',      role:'AE III – Commercial GTS', aibd:'AI', geoTerr:'Commercial', region:'APAC', manager:'Lin Wei', smType:'AE SM', cv:1980, targetBookingSize:2280, availableCapacity:1, pctTargetFromSizeAchieved:67, proxyBuReview:70, proxyBuReview2:73, proxySizeDiscount:66, proxyGraded:70 },
  { id:'APAC-AE-008', aeName:'Siti Rahma',       role:'AE II – Commercial GTS',  aibd:'AI', geoTerr:'Commercial', region:'APAC', manager:'Lin Wei', smType:'AE SM', cv:1380, targetBookingSize:1720, availableCapacity:3, pctTargetFromSizeAchieved:47, proxyBuReview:88, proxyBuReview2:91, proxySizeDiscount:84, proxyGraded:88 },

  // ── Arjun Sharma · AE SM · SMB ───────────────────────────────────────────
  { id:'APAC-AE-009', aeName:'Ying Li',          role:'AE I – SMB GTS',  aibd:'AI', geoTerr:'SMB', region:'APAC', manager:'Arjun Sharma', smType:'AE SM', cv:650,  targetBookingSize:880,  availableCapacity:4, pctTargetFromSizeAchieved:43, proxyBuReview:85, proxyBuReview2:88, proxySizeDiscount:81, proxyGraded:85 },
  { id:'APAC-AE-010', aeName:'Takeshi Ito',      role:'AE II – SMB GTS', aibd:'AI', geoTerr:'SMB', region:'APAC', manager:'Arjun Sharma', smType:'AE SM', cv:980,  targetBookingSize:1200, availableCapacity:1, pctTargetFromSizeAchieved:59, proxyBuReview:72, proxyBuReview2:75, proxySizeDiscount:68, proxyGraded:72 },
  { id:'APAC-AE-011', aeName:'Nina Chandra',     role:'AE I – SMB GTS',  aibd:'AI', geoTerr:'SMB', region:'APAC', manager:'Arjun Sharma', smType:'AE SM', cv:760,  targetBookingSize:980,  availableCapacity:2, pctTargetFromSizeAchieved:53, proxyBuReview:79, proxyBuReview2:82, proxySizeDiscount:75, proxyGraded:79 },
  { id:'APAC-AE-012', aeName:'Bao Nguyen',       role:'AE II – SMB GTS', aibd:'AI', geoTerr:'SMB', region:'APAC', manager:'Arjun Sharma', smType:'AE SM', cv:920,  targetBookingSize:1060, availableCapacity:0, pctTargetFromSizeAchieved:88, proxyBuReview:56, proxyBuReview2:59, proxySizeDiscount:52, proxyGraded:56 },

  // ── Soo-Jin Park · BD SM · Enterprise ────────────────────────────────────
  { id:'APAC-BD-001', aeName:'Kenji Watanabe',   role:'BD II – Enterprise GBS', aibd:'BD', geoTerr:'Enterprise', region:'APAC', manager:'Soo-Jin Park', smType:'BD SM', cv:2900, targetBookingSize:3200, availableCapacity:2, pctTargetFromSizeAchieved:69, proxyBuReview:87, proxyBuReview2:90, proxySizeDiscount:83, proxyGraded:87 },
  { id:'APAC-BD-002', aeName:'Ananya Singh',     role:'BD I – Enterprise GBS',  aibd:'BD', geoTerr:'Enterprise', region:'APAC', manager:'Soo-Jin Park', smType:'BD SM', cv:2300, targetBookingSize:2650, availableCapacity:1, pctTargetFromSizeAchieved:63, proxyBuReview:74, proxyBuReview2:77, proxySizeDiscount:70, proxyGraded:74 },
  { id:'APAC-BD-003', aeName:'Jason Wu',         role:'BD III – Enterprise GBS', aibd:'BD', geoTerr:'Enterprise', region:'APAC', manager:'Soo-Jin Park', smType:'BD SM', cv:3800, targetBookingSize:4100, availableCapacity:0, pctTargetFromSizeAchieved:91, proxyBuReview:59, proxyBuReview2:62, proxySizeDiscount:55, proxyGraded:59 },
  { id:'APAC-BD-004', aeName:'Preethi Nair',     role:'BD II – Enterprise GBS', aibd:'BD', geoTerr:'Enterprise', region:'APAC', manager:'Soo-Jin Park', smType:'BD SM', cv:2650, targetBookingSize:3000, availableCapacity:3, pctTargetFromSizeAchieved:66, proxyBuReview:83, proxyBuReview2:86, proxySizeDiscount:79, proxyGraded:83 },

  // ── Budi Santoso · BD SM · Commercial ────────────────────────────────────
  { id:'APAC-BD-005', aeName:'Min-jun Lee',      role:'BD II – Commercial GBS',  aibd:'BD', geoTerr:'Commercial', region:'APAC', manager:'Budi Santoso', smType:'BD SM', cv:1550, targetBookingSize:1850, availableCapacity:2, pctTargetFromSizeAchieved:60, proxyBuReview:71, proxyBuReview2:74, proxySizeDiscount:67, proxyGraded:71 },
  { id:'APAC-BD-006', aeName:'Kavya Reddy',      role:'BD I – Commercial GBS',   aibd:'BD', geoTerr:'Commercial', region:'APAC', manager:'Budi Santoso', smType:'BD SM', cv:1080, targetBookingSize:1380, availableCapacity:4, pctTargetFromSizeAchieved:48, proxyBuReview:84, proxyBuReview2:87, proxySizeDiscount:80, proxyGraded:84 },
  { id:'APAC-BD-007', aeName:'Hiroshi Tanaka',   role:'BD II – Commercial GBS',  aibd:'BD', geoTerr:'Commercial', region:'APAC', manager:'Budi Santoso', smType:'BD SM', cv:1900, targetBookingSize:2200, availableCapacity:0, pctTargetFromSizeAchieved:84, proxyBuReview:62, proxyBuReview2:65, proxySizeDiscount:58, proxyGraded:62 },
  { id:'APAC-BD-008', aeName:'Ling Huang',       role:'BD III – Commercial GBS', aibd:'BD', geoTerr:'Commercial', region:'APAC', manager:'Budi Santoso', smType:'BD SM', cv:2300, targetBookingSize:2550, availableCapacity:1, pctTargetFromSizeAchieved:74, proxyBuReview:77, proxyBuReview2:80, proxySizeDiscount:73, proxyGraded:77 },

  // ── Mei Ling Ho · BD SM · SMB ────────────────────────────────────────────
  { id:'APAC-BD-009', aeName:'Raj Pillai',       role:'BD I – SMB GBS',  aibd:'BD', geoTerr:'SMB', region:'APAC', manager:'Mei Ling Ho', smType:'BD SM', cv:540,  targetBookingSize:780,  availableCapacity:5, pctTargetFromSizeAchieved:45, proxyBuReview:86, proxyBuReview2:89, proxySizeDiscount:82, proxyGraded:86 },
  { id:'APAC-BD-010', aeName:'Sakura Yoshida',   role:'BD II – SMB GBS', aibd:'BD', geoTerr:'SMB', region:'APAC', manager:'Mei Ling Ho', smType:'BD SM', cv:820,  targetBookingSize:1020, availableCapacity:2, pctTargetFromSizeAchieved:52, proxyBuReview:73, proxyBuReview2:76, proxySizeDiscount:69, proxyGraded:73 },
  { id:'APAC-BD-011', aeName:'Aarav Kumar',      role:'BD I – SMB GBS',  aibd:'BD', geoTerr:'SMB', region:'APAC', manager:'Mei Ling Ho', smType:'BD SM', cv:640,  targetBookingSize:860,  availableCapacity:3, pctTargetFromSizeAchieved:49, proxyBuReview:80, proxyBuReview2:83, proxySizeDiscount:76, proxyGraded:80 },
  { id:'APAC-BD-012', aeName:'Lian Zhou',        role:'BD II – SMB GBS', aibd:'BD', geoTerr:'SMB', region:'APAC', manager:'Mei Ling Ho', smType:'BD SM', cv:990,  targetBookingSize:1140, availableCapacity:0, pctTargetFromSizeAchieved:91, proxyBuReview:57, proxyBuReview2:60, proxySizeDiscount:53, proxyGraded:57 },

  // ══════════════════════════════════════════════════════════════════════════
  // INDIA
  // ══════════════════════════════════════════════════════════════════════════

  // ── Rohan Verma · AE SM · Enterprise ─────────────────────────────────────
  { id:'IND-AE-001', aeName:'Vikram Rao',        role:'AE II – Enterprise GTS', aibd:'AI', geoTerr:'Enterprise', region:'India', manager:'Rohan Verma', smType:'AE SM', cv:1950, targetBookingSize:2350, availableCapacity:2, pctTargetFromSizeAchieved:57, proxyBuReview:74, proxyBuReview2:77, proxySizeDiscount:70, proxyGraded:74 },
  { id:'IND-AE-002', aeName:'Neha Gupta',        role:'AE I – Enterprise GTS',  aibd:'AI', geoTerr:'Enterprise', region:'India', manager:'Rohan Verma', smType:'AE SM', cv:1550, targetBookingSize:2000, availableCapacity:3, pctTargetFromSizeAchieved:49, proxyBuReview:81, proxyBuReview2:84, proxySizeDiscount:77, proxyGraded:81 },
  { id:'IND-AE-003', aeName:'Aryan Khanna',      role:'AE III – Enterprise GTS', aibd:'AI', geoTerr:'Enterprise', region:'India', manager:'Rohan Verma', smType:'AE SM', cv:2800, targetBookingSize:3100, availableCapacity:0, pctTargetFromSizeAchieved:89, proxyBuReview:55, proxyBuReview2:58, proxySizeDiscount:51, proxyGraded:55 },
  { id:'IND-AE-004', aeName:'Divya Nair',        role:'AE II – Enterprise GTS', aibd:'AI', geoTerr:'Enterprise', region:'India', manager:'Rohan Verma', smType:'AE SM', cv:2250, targetBookingSize:2600, availableCapacity:1, pctTargetFromSizeAchieved:68, proxyBuReview:79, proxyBuReview2:82, proxySizeDiscount:75, proxyGraded:79 },

  // ── Anjali Mehta · AE SM · Commercial ────────────────────────────────────
  { id:'IND-AE-005', aeName:'Karan Shah',        role:'AE I – Commercial GTS',   aibd:'AI', geoTerr:'Commercial', region:'India', manager:'Anjali Mehta', smType:'AE SM', cv:870,  targetBookingSize:1100, availableCapacity:3, pctTargetFromSizeAchieved:53, proxyBuReview:76, proxyBuReview2:79, proxySizeDiscount:72, proxyGraded:76 },
  { id:'IND-AE-006', aeName:'Rhea Bose',         role:'AE II – Commercial GTS',  aibd:'AI', geoTerr:'Commercial', region:'India', manager:'Anjali Mehta', smType:'AE SM', cv:1580, targetBookingSize:1900, availableCapacity:0, pctTargetFromSizeAchieved:80, proxyBuReview:64, proxyBuReview2:67, proxySizeDiscount:60, proxyGraded:64 },
  { id:'IND-AE-007', aeName:'Aditya Joshi',      role:'AE III – Commercial GTS', aibd:'AI', geoTerr:'Commercial', region:'India', manager:'Anjali Mehta', smType:'AE SM', cv:1850, targetBookingSize:2150, availableCapacity:1, pctTargetFromSizeAchieved:66, proxyBuReview:70, proxyBuReview2:73, proxySizeDiscount:66, proxyGraded:70 },
  { id:'IND-AE-008', aeName:'Tanya Mishra',      role:'AE II – Commercial GTS',  aibd:'AI', geoTerr:'Commercial', region:'India', manager:'Anjali Mehta', smType:'AE SM', cv:1280, targetBookingSize:1600, availableCapacity:4, pctTargetFromSizeAchieved:44, proxyBuReview:89, proxyBuReview2:92, proxySizeDiscount:85, proxyGraded:89 },

  // ── Sanjay Pillai · AE SM · SMB ──────────────────────────────────────────
  { id:'IND-AE-009', aeName:'Meera Krishnan',    role:'AE I – SMB GTS',  aibd:'AI', geoTerr:'SMB', region:'India', manager:'Sanjay Pillai', smType:'AE SM', cv:590,  targetBookingSize:820,  availableCapacity:4, pctTargetFromSizeAchieved:42, proxyBuReview:86, proxyBuReview2:89, proxySizeDiscount:82, proxyGraded:86 },
  { id:'IND-AE-010', aeName:'Ravi Shankar',      role:'AE II – SMB GTS', aibd:'AI', geoTerr:'SMB', region:'India', manager:'Sanjay Pillai', smType:'AE SM', cv:920,  targetBookingSize:1120, availableCapacity:1, pctTargetFromSizeAchieved:56, proxyBuReview:73, proxyBuReview2:76, proxySizeDiscount:69, proxyGraded:73 },
  { id:'IND-AE-011', aeName:'Pooja Desai',       role:'AE I – SMB GTS',  aibd:'AI', geoTerr:'SMB', region:'India', manager:'Sanjay Pillai', smType:'AE SM', cv:710,  targetBookingSize:930,  availableCapacity:2, pctTargetFromSizeAchieved:50, proxyBuReview:80, proxyBuReview2:83, proxySizeDiscount:76, proxyGraded:80 },
  { id:'IND-AE-012', aeName:'Suresh Iyer',       role:'AE II – SMB GTS', aibd:'AI', geoTerr:'SMB', region:'India', manager:'Sanjay Pillai', smType:'AE SM', cv:870,  targetBookingSize:1000, availableCapacity:0, pctTargetFromSizeAchieved:90, proxyBuReview:55, proxyBuReview2:58, proxySizeDiscount:51, proxyGraded:55 },

  // ── Pooja Iyer · BD SM · Enterprise ──────────────────────────────────────
  { id:'IND-BD-001', aeName:'Manish Verma',      role:'BD II – Enterprise GBS', aibd:'BD', geoTerr:'Enterprise', region:'India', manager:'Pooja Iyer', smType:'BD SM', cv:2800, targetBookingSize:3100, availableCapacity:2, pctTargetFromSizeAchieved:68, proxyBuReview:87, proxyBuReview2:90, proxySizeDiscount:83, proxyGraded:87 },
  { id:'IND-BD-002', aeName:'Sneha Kapoor',      role:'BD I – Enterprise GBS',  aibd:'BD', geoTerr:'Enterprise', region:'India', manager:'Pooja Iyer', smType:'BD SM', cv:2200, targetBookingSize:2550, availableCapacity:1, pctTargetFromSizeAchieved:62, proxyBuReview:73, proxyBuReview2:76, proxySizeDiscount:69, proxyGraded:73 },
  { id:'IND-BD-003', aeName:'Dev Malhotra',      role:'BD III – Enterprise GBS', aibd:'BD', geoTerr:'Enterprise', region:'India', manager:'Pooja Iyer', smType:'BD SM', cv:3600, targetBookingSize:3900, availableCapacity:0, pctTargetFromSizeAchieved:91, proxyBuReview:58, proxyBuReview2:61, proxySizeDiscount:54, proxyGraded:58 },
  { id:'IND-BD-004', aeName:'Isha Agarwal',      role:'BD II – Enterprise GBS', aibd:'BD', geoTerr:'Enterprise', region:'India', manager:'Pooja Iyer', smType:'BD SM', cv:2500, targetBookingSize:2850, availableCapacity:3, pctTargetFromSizeAchieved:65, proxyBuReview:82, proxyBuReview2:85, proxySizeDiscount:78, proxyGraded:82 },

  // ── Vivek Bhatia · BD SM · Commercial ────────────────────────────────────
  { id:'IND-BD-005', aeName:'Neel Saxena',       role:'BD II – Commercial GBS',  aibd:'BD', geoTerr:'Commercial', region:'India', manager:'Vivek Bhatia', smType:'BD SM', cv:1480, targetBookingSize:1780, availableCapacity:2, pctTargetFromSizeAchieved:59, proxyBuReview:70, proxyBuReview2:73, proxySizeDiscount:66, proxyGraded:70 },
  { id:'IND-BD-006', aeName:'Ritu Sharma',       role:'BD I – Commercial GBS',   aibd:'BD', geoTerr:'Commercial', region:'India', manager:'Vivek Bhatia', smType:'BD SM', cv:1020, targetBookingSize:1320, availableCapacity:4, pctTargetFromSizeAchieved:47, proxyBuReview:83, proxyBuReview2:86, proxySizeDiscount:79, proxyGraded:83 },
  { id:'IND-BD-007', aeName:'Shiv Pandey',       role:'BD II – Commercial GBS',  aibd:'BD', geoTerr:'Commercial', region:'India', manager:'Vivek Bhatia', smType:'BD SM', cv:1820, targetBookingSize:2120, availableCapacity:0, pctTargetFromSizeAchieved:83, proxyBuReview:61, proxyBuReview2:64, proxySizeDiscount:57, proxyGraded:61 },
  { id:'IND-BD-008', aeName:'Priya Menon',       role:'BD III – Commercial GBS', aibd:'BD', geoTerr:'Commercial', region:'India', manager:'Vivek Bhatia', smType:'BD SM', cv:2200, targetBookingSize:2450, availableCapacity:1, pctTargetFromSizeAchieved:73, proxyBuReview:76, proxyBuReview2:79, proxySizeDiscount:72, proxyGraded:76 },

  // ── Nisha Kapoor · BD SM · SMB ───────────────────────────────────────────
  { id:'IND-BD-009', aeName:'Ankit Tiwari',      role:'BD I – SMB GBS',  aibd:'BD', geoTerr:'SMB', region:'India', manager:'Nisha Kapoor', smType:'BD SM', cv:510,  targetBookingSize:750,  availableCapacity:5, pctTargetFromSizeAchieved:44, proxyBuReview:85, proxyBuReview2:88, proxySizeDiscount:81, proxyGraded:85 },
  { id:'IND-BD-010', aeName:'Kavita Rao',        role:'BD II – SMB GBS', aibd:'BD', geoTerr:'SMB', region:'India', manager:'Nisha Kapoor', smType:'BD SM', cv:790,  targetBookingSize:990,  availableCapacity:2, pctTargetFromSizeAchieved:51, proxyBuReview:72, proxyBuReview2:75, proxySizeDiscount:68, proxyGraded:72 },
  { id:'IND-BD-011', aeName:'Rahul Das',         role:'BD I – SMB GBS',  aibd:'BD', geoTerr:'SMB', region:'India', manager:'Nisha Kapoor', smType:'BD SM', cv:620,  targetBookingSize:840,  availableCapacity:3, pctTargetFromSizeAchieved:48, proxyBuReview:79, proxyBuReview2:82, proxySizeDiscount:75, proxyGraded:79 },
  { id:'IND-BD-012', aeName:'Swati Choudhary',   role:'BD II – SMB GBS', aibd:'BD', geoTerr:'SMB', region:'India', manager:'Nisha Kapoor', smType:'BD SM', cv:950,  targetBookingSize:1090, availableCapacity:0, pctTargetFromSizeAchieved:90, proxyBuReview:54, proxyBuReview2:57, proxySizeDiscount:50, proxyGraded:54 },
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
