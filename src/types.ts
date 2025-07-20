// Core data structures
export interface Package {
  name: string
  current: string
  latest: string
  currentDate: Date
  latestDate: Date
  createdDate: Date
  versionCount: number
  deprecated: boolean
  dependencyCount: number
  devDependencyCount: number
  lastWeekDownloads: number
  vulnerabilities: {
    critical: number
    high: number
    moderate: number
    low: number
  }
  openIssuesCount: number
}

export interface Scores {
  maturity: number
  updateFrequency: number
  deprecation: number
  dependency: number
  download: number
  vulnerability: number
  issues: number
}

// NPM data structures
export interface NpmPackageInfo {
  name: string
  version: string
  'dist-tags': {
    latest: string
  },
  time: {
    modified: string
    created: string,
    [key: string]: string
  },
  deprecated: unknown
}

export interface NpmOutdatedInfo {
  wanted: string
  latest: string
}

export interface NpmAuditVulnerability {
  severity: string
  title: string
  description?: string
}

export interface NpmAuditResult {
  vulnerabilities: Record<string, {
    via: NpmAuditVulnerability[]
  }>
} 