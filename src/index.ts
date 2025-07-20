export { analyzeDependencies, displayResults } from './analyzer'
export { getConfig } from './config'
export { fetchRepoHealth } from './repo-health'
export { readPackageJson, getPackageInfo, checkOutdated, checkAudit } from './npm'
export { 
  calcFinalScore, 
  calcLagScore, 
  calcVulnScore, 
  calcCommunityScore, 
  calcActivityScore,
  debugScore,
  setScoringConfig,
  getScoringConfig,
  resetScoringConfig,
  DEFAULT_SCORING_CONFIG,
  WEIGHTS,
  MAX_STARS,
  MIN_STARS_FOR_ISSUE_RATIO,
  MAX_ISSUE_RATIO,
  ACTIVITY_THRESHOLD_DAYS
} from './scoring'
export type {
  DependencyResult,
  Config,
  RepoHealth,
  PackageInfo,
  OutdatedInfo,
  AuditInfo,
  ScoringParams,
  ScoringConfig,
  AppConfig
} from './types' 