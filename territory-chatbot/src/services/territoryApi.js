import { MOCK_AE_DATA, REBALANCE_ACCOUNTS } from '../constants/mockData';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Returns AE/BD rep data filtered by manager, region, aibd, geoTerr.
 * Mirrors the structure of data/territory_data.csv.
 */
export async function fetchAEData(filters) {
  await delay(300);
  let data = [...MOCK_AE_DATA];

  if (filters?.manager) {
    data = data.filter((rep) => rep.manager === filters.manager);
  }
  if (filters?.region && filters.region !== 'All') {
    data = data.filter((rep) => rep.region === filters.region);
  }
  if (filters?.aibd && filters.aibd !== 'All') {
    data = data.filter((rep) => rep.aibd === filters.aibd);
  }
  if (filters?.geoTerr && filters.geoTerr !== 'All') {
    data = data.filter((rep) => rep.geoTerr === filters.geoTerr);
  }

  return data;
}

/**
 * Returns recommended accounts for a given rep ID.
 * Falls back to all accounts if no match found.
 */
export async function fetchRebalanceAccounts(repId) {
  await delay(250);
  if (repId) {
    const rep = MOCK_AE_DATA.find((r) => r.id === repId);
    if (rep) {
      const byName = REBALANCE_ACCOUNTS.filter((acc) => acc.aeName === rep.aeName);
      if (byName.length) return byName;
    }
  }
  return REBALANCE_ACCOUNTS;
}
