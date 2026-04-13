/**
 * Territory Rebalancing Rule Engine
 * Runs deterministic rules on AE data before LLM reasoning.
 */

const CV_THRESHOLD_RATIO = 0.80;
const COLLAPSE_CV_MIN = 1000;

function computeProxyScore(ae) {
  return (
    ae.proxyGraded * 0.4 +
    ae.proxySizeDiscount * 0.3 +
    ae.proxyBuReview2 * 0.3
  );
}

/**
 * @param {Array} aeData - array of AE objects from mockData
 * @param {Object} filters - { region, aibd, geoTerr }
 * @returns {{ flags, rankedAEs, eligibleForGrowth, eligibleForCollapse, ruleLog }}
 */
export function runRules(aeData, filters) {
  const ruleLog = [];
  const timestamp = new Date().toISOString();

  ruleLog.push(`[${timestamp}] Rule engine started.`);
  ruleLog.push(`[${timestamp}] Input: ${aeData.length} AEs, filters: ${JSON.stringify(filters)}`);

  // Apply filters
  let filtered = [...aeData];
  if (filters) {
    if (filters.region && filters.region !== 'All') {
      filtered = filtered.filter((ae) => ae.region === filters.region);
      ruleLog.push(`[FILTER] Region = "${filters.region}" → ${filtered.length} AEs remaining`);
    }
    if (filters.aibd && filters.aibd !== 'All') {
      filtered = filtered.filter((ae) => ae.aibd === filters.aibd);
      ruleLog.push(`[FILTER] AI/BD = "${filters.aibd}" → ${filtered.length} AEs remaining`);
    }
    if (filters.geoTerr && filters.geoTerr !== 'All') {
      filtered = filtered.filter((ae) => ae.geoTerr === filters.geoTerr);
      ruleLog.push(`[FILTER] GeoTerr = "${filters.geoTerr}" → ${filtered.length} AEs remaining`);
    }
  }

  // RULE 1: CV_THRESHOLD
  // Flag AEs where cv/targetBookingSize > 0.80
  const cvBreachAEs = filtered.filter(
    (ae) => ae.targetBookingSize > 0 && ae.cv / ae.targetBookingSize > CV_THRESHOLD_RATIO
  );
  const cvBreach = cvBreachAEs.length > 0;
  const breachPct =
    filtered.length > 0 ? Math.round((cvBreachAEs.length / filtered.length) * 100) : 0;

  ruleLog.push(
    `[RULE 1 CV_THRESHOLD] ${cvBreachAEs.length}/${filtered.length} AEs exceed ${CV_THRESHOLD_RATIO * 100}% CV/Target ratio.`
  );
  cvBreachAEs.forEach((ae) => {
    const ratio = ((ae.cv / ae.targetBookingSize) * 100).toFixed(1);
    ruleLog.push(`  ↳ ${ae.aeName}: CV ${ae.cv.toLocaleString()} / Target ${ae.targetBookingSize.toLocaleString()} = ${ratio}%`);
  });

  // RULE 2: CAPACITY_CHECK
  // AEs with availableCapacity > 0 are eligible for growth rebalancing
  const eligibleForGrowth = filtered.filter((ae) => ae.availableCapacity > 0);
  ruleLog.push(
    `[RULE 2 CAPACITY_CHECK] ${eligibleForGrowth.length} AEs have available capacity > 0 (growth eligible).`
  );
  eligibleForGrowth.forEach((ae) => {
    ruleLog.push(`  ↳ ${ae.aeName}: capacity = ${ae.availableCapacity}`);
  });

  // RULE 3: PROXY_RANK
  // Sort AEs by weighted proxy score descending
  const scoredAEs = filtered.map((ae) => ({
    ...ae,
    compositeScore: computeProxyScore(ae),
  }));
  const rankedAEs = scoredAEs.sort((a, b) => b.compositeScore - a.compositeScore);

  ruleLog.push(`[RULE 3 PROXY_RANK] AEs ranked by composite proxy score:`);
  rankedAEs.forEach((ae, i) => {
    ruleLog.push(`  ${i + 1}. ${ae.aeName} → score: ${ae.compositeScore.toFixed(2)}`);
  });

  // RULE 4: COLLAPSE_ELIGIBLE
  // AE must have cv > 1000 to be collapse-eligible
  const eligibleForCollapse = filtered.filter((ae) => ae.cv > COLLAPSE_CV_MIN);
  ruleLog.push(
    `[RULE 4 COLLAPSE_ELIGIBLE] ${eligibleForCollapse.length} AEs have CV > ${COLLAPSE_CV_MIN.toLocaleString()} (collapse eligible).`
  );
  eligibleForCollapse.forEach((ae) => {
    ruleLog.push(`  ↳ ${ae.aeName}: CV = ${ae.cv.toLocaleString()}`);
  });

  ruleLog.push(`[${new Date().toISOString()}] Rule engine complete.`);

  return {
    flags: {
      cv_breach: cvBreach,
      breach_pct: breachPct,
    },
    rankedAEs,
    eligibleForGrowth,
    eligibleForCollapse,
    ruleLog,
    filteredAEs: filtered,
  };
}

export function buildDatasetSummary(aeData, ruleOutput) {
  const { flags, rankedAEs, eligibleForGrowth, eligibleForCollapse } = ruleOutput;
  return {
    total_aes: aeData.length,
    cv_breach: flags.cv_breach,
    breach_pct: flags.breach_pct,
    top_ranked_ae: rankedAEs[0]?.aeName ?? 'N/A',
    growth_eligible_count: eligibleForGrowth.length,
    collapse_eligible_count: eligibleForCollapse.length,
    total_cv: aeData.reduce((sum, ae) => sum + ae.cv, 0),
    avg_proxy_graded: aeData.length
      ? Math.round(aeData.reduce((sum, ae) => sum + ae.proxyGraded, 0) / aeData.length)
      : 0,
  };
}
