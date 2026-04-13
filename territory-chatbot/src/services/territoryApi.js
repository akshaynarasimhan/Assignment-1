import { MOCK_AE_DATA, REBALANCE_ACCOUNTS } from '../constants/mockData';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchAEData(filters) {
  await delay(300);
  let data = [...MOCK_AE_DATA];
  if (filters?.manager) {
    data = data.filter((ae) => ae.manager === filters.manager);
  }
  if (filters?.region && filters.region !== 'All') {
    data = data.filter((ae) => ae.region === filters.region);
  }
  if (filters?.aibd && filters.aibd !== 'All') {
    data = data.filter((ae) => ae.aibd === filters.aibd);
  }
  if (filters?.geoTerr && filters.geoTerr !== 'All') {
    data = data.filter((ae) => ae.geoTerr === filters.geoTerr);
  }
  return data;
}

export async function fetchRebalanceAccounts(aeId) {
  await delay(250);
  if (aeId) {
    const ae = MOCK_AE_DATA.find((a) => a.id === aeId);
    if (ae) {
      return REBALANCE_ACCOUNTS.filter((acc) => acc.aeName === ae.aeName);
    }
  }
  return REBALANCE_ACCOUNTS;
}
