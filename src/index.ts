export { analyzeDependencies, displayResults } from './analyzer'
export { getConfig } from './config'
export { fetchRepoHealth } from './repo-health'
export { readPackageJson, getPackageInfo, checkOutdated, checkAudit } from './npm'
export type {
  DependencyResult,
  Config,
  RepoHealth,
  PackageInfo,
  OutdatedInfo,
  AuditInfo
} from './types' 