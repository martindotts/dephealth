import semver from 'semver'
import { ScoringParams, ScoringConfig } from './types'

// Default scoring configuration
export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  weights: {
    lag: 0.25,
    vuln: 0.35,
    health: 0.25,
    activity: 0.15
  },
  constants: {
    maxStars: 100000,
    minStarsForIssueRatio: 10,
    maxIssueRatio: 0.5,
    activityThresholdDays: 365
  },
  penalties: {
    majorUpdate: 0.5,
    minorUpdate: 0.1,
    patchUpdate: 0.02,
    criticalVuln: 0.6,
    highVuln: 0.3,
    moderateVuln: 0.1
  }
}

// Global config instance
let currentConfig: ScoringConfig = { ...DEFAULT_SCORING_CONFIG }

// Configuration management functions
export function setScoringConfig(config: Partial<ScoringConfig>): void {
  currentConfig = { ...DEFAULT_SCORING_CONFIG, ...config }
}

export function getScoringConfig(): ScoringConfig {
  return { ...currentConfig }
}

export function resetScoringConfig(): void {
  currentConfig = { ...DEFAULT_SCORING_CONFIG }
}

// Legacy exports for backward compatibility
export const WEIGHTS = currentConfig.weights
export const MAX_STARS = currentConfig.constants.maxStars
export const MIN_STARS_FOR_ISSUE_RATIO = currentConfig.constants.minStarsForIssueRatio
export const MAX_ISSUE_RATIO = currentConfig.constants.maxIssueRatio
export const ACTIVITY_THRESHOLD_DAYS = currentConfig.constants.activityThresholdDays

/**
 * Calculates score based on version lag between current and latest
 * Uses semantic versioning to determine update urgency
 */
export function calcLagScore(current: string, latest: string, config?: Partial<ScoringConfig>): number {
  const cfg = config ? { ...currentConfig, ...config } : currentConfig
  
  if (!latest || latest === 'unknown') return 1
  const cur = semver.coerce(current)
  const lat = semver.coerce(latest)
  if (!cur || !lat) return 1
  
  const diff = {
    major: lat.major - cur.major,
    minor: lat.minor - cur.minor,
    patch: lat.patch - cur.patch
  }
  
  // Exponential penalty for major updates (breaking changes)
  const majorPenalty = diff.major > 0 ? Math.pow(cfg.penalties.majorUpdate, diff.major) : 0
  // Linear penalty for minor updates (features)
  const minorPenalty = Math.min(diff.minor * cfg.penalties.minorUpdate, 0.3)
  // Minimal penalty for patch updates (bug fixes)
  const patchPenalty = Math.min(diff.patch * cfg.penalties.patchUpdate, 0.1)
  
  const totalPenalty = Math.min(majorPenalty + minorPenalty + patchPenalty, 1)
  return 1 - totalPenalty
}

/**
 * Calculates score based on vulnerability severity
 * Uses exponential penalty for critical vulnerabilities
 */
export function calcVulnScore(
  sev: {critical: number, high: number, moderate: number}, 
  config?: Partial<ScoringConfig>
): number {
  const cfg = config ? { ...currentConfig, ...config } : currentConfig
  
  // Exponential penalty for critical vulnerabilities
  const criticalPenalty = sev.critical > 0 ? Math.pow(cfg.penalties.criticalVuln, sev.critical) : 0
  // Linear penalty for high vulnerabilities
  const highPenalty = Math.min(sev.high * cfg.penalties.highVuln, 0.5)
  // Minimal penalty for moderate vulnerabilities
  const moderatePenalty = Math.min(sev.moderate * cfg.penalties.moderateVuln, 0.2)
  
  const totalPenalty = Math.min(criticalPenalty + highPenalty + moderatePenalty, 1)
  return 1 - totalPenalty
}

/**
 * Calculates community score using multiple factors
 * Combines popularity, issue ratio, and community health
 */
export function calcCommunityScore(stars: number, openIssues: number, config?: Partial<ScoringConfig>): number {
  const cfg = config ? { ...currentConfig, ...config } : currentConfig
  
  // Popularity score using logarithmic scale
  const popularityScore = Math.min(Math.log10(stars + 1) / Math.log10(cfg.constants.maxStars + 1), 1)
  
  // Issue ratio score (issues per star)
  let issueRatioScore = 1
  if (stars >= cfg.constants.minStarsForIssueRatio) {
    const issueRatio = openIssues / stars
    // Perfect score if ratio is very low, penalty increases with ratio
    issueRatioScore = Math.max(0, 1 - (issueRatio / cfg.constants.maxIssueRatio))
  } else if (openIssues > 0) {
    // For unpopular repos with issues, apply penalty
    issueRatioScore = Math.max(0, 1 - (openIssues / cfg.constants.minStarsForIssueRatio))
  }
  
  // Community health: balance between popularity and issue management
  const communityHealth = (popularityScore * 0.6) + (issueRatioScore * 0.4)
  
  return communityHealth
}

/**
 * Calculates activity score based on last commit date
 * Uses exponential decay with different thresholds
 */
export function calcActivityScore(lastCommit: string, config?: Partial<ScoringConfig>): number {
  const cfg = config ? { ...currentConfig, ...config } : currentConfig
  
  if (!lastCommit) return 0
  
  const days = (Date.now() - new Date(lastCommit).getTime()) / (1000 * 60 * 60 * 24)
  
  // Different decay rates for different time periods
  if (days <= 30) {
    // Very recent activity: high score
    return Math.exp(-days / 30)
  } else if (days <= 90) {
    // Recent activity: moderate score
    return 0.8 * Math.exp(-(days - 30) / 60)
  } else if (days <= cfg.constants.activityThresholdDays) {
    // Acceptable activity: lower score
    return 0.5 * Math.exp(-(days - 90) / 275)
  } else {
    // Stale repository: very low score
    return 0.1 * Math.exp(-(days - cfg.constants.activityThresholdDays) / 365)
  }
}

/**
 * Calculates final health score (0-100) based on all parameters
 * Uses weighted combination of objective metrics
 */
export function calcFinalScore(params: ScoringParams, config?: Partial<ScoringConfig>): number {
  const cfg = config ? { ...currentConfig, ...config } : currentConfig
  
  const lagScore = calcLagScore(params.current, params.latest, config)
  const vulnScore = calcVulnScore(params.severity, config)
  const communityScore = calcCommunityScore(params.stars, params.openIssues, config)
  const activityScore = calcActivityScore(params.lastCommit, config)
  
  const value = cfg.weights.lag * lagScore +
               cfg.weights.vuln * vulnScore +
               cfg.weights.health * communityScore +
               cfg.weights.activity * activityScore
               
  // Ensure score is within bounds (0-100)
  return Math.round(Math.max(0, Math.min(100, value * 100)))
}

/**
 * Debug function to show individual scores for troubleshooting
 */
export function debugScore(params: ScoringParams, config?: Partial<ScoringConfig>): {
  lagScore: number
  vulnScore: number
  communityScore: number
  activityScore: number
  finalScore: number
  breakdown: {
    lag: number
    vuln: number
    health: number
    activity: number
  }
} {
  const cfg = config ? { ...currentConfig, ...config } : currentConfig
  
  const lagScore = calcLagScore(params.current, params.latest, config)
  const vulnScore = calcVulnScore(params.severity, config)
  const communityScore = calcCommunityScore(params.stars, params.openIssues, config)
  const activityScore = calcActivityScore(params.lastCommit, config)
  
  const breakdown = {
    lag: cfg.weights.lag * lagScore,
    vuln: cfg.weights.vuln * vulnScore,
    health: cfg.weights.health * communityScore,
    activity: cfg.weights.activity * activityScore
  }
  
  const finalScore = breakdown.lag + breakdown.vuln + breakdown.health + breakdown.activity
  
  return {
    lagScore,
    vulnScore,
    communityScore,
    activityScore,
    finalScore: Math.round(Math.max(0, Math.min(100, finalScore * 100))),
    breakdown
  }
} 