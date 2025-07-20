// Main exports
export { analyzeDependencies, display } from './analyzer'
export { getRepoData } from './repo'
export { getPackageInfo, getOutdatedPackages, getAuditResults, getLastWeekDownloads } from './npm'
export { createConfigFile, loadConfig } from './config'

// Types
export type { Package, Scores } from './types'
export type { RepoData, GitTokens } from './repo'
export type { NpmPackageInfo, NpmOutdatedInfo, NpmAuditResult } from './types'
export type { DepHealthConfig } from './config' 