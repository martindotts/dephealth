export interface OutdatedInfo {
  [pkg: string]: {
    current: string;
    latest: string;
    wanted: string;
  };
}

export interface AuditInfo {
  vulnerabilities: Record<string, any>;
}

export interface RepoHealth {
  stars: number;
  openIssues: number;
  lastCommit: string;
  platform: string;
}

export interface PackageInfo {
  version: string;
  repository?: {
    url: string;
  };
}

export interface Config {
  githubToken?: string;
  gitlabToken?: string;
  bitbucketToken?: string;
  interactive?: boolean;
  configFile?: string;
  noTokens?: boolean;
}

export interface ScoringParams {
  current: string;
  latest: string;
  severity: {
    critical: number;
    high: number;
    moderate: number;
  };
  stars: number;
  openIssues: number;
  lastCommit: string;
}

export interface DependencyResult {
  name: string;
  current: string;
  latest: string;
  outdated: {
    wanted: string;
    latest: string;
  } | null;
  vulnerabilitiesCount: number;
  repoHealth: RepoHealth | null
  score?: number
} 