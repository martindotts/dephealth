import semver from 'semver'
import { ScoringParams } from './types'

// Scoring weights
export const WEIGHTS = { 
  lag: 0.25, 
  vuln: 0.35, 
  health: 0.25,  // Combined health metric
  activity: 0.15 
}

// Scoring constants
export const MAX_STARS = 100000
export const MIN_STARS_FOR_ISSUE_RATIO = 10
export const MAX_ISSUE_RATIO = 0.5  // 50% issues per star
export const ACTIVITY_THRESHOLD_DAYS = 365

/**
 * Calculates score based on version lag between current and latest
 * Uses semantic versioning to determine update urgency
 */
export function calcLagScore(current: string, latest: string): number {
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
  const majorPenalty = diff.major > 0 ? Math.pow(0.5, diff.major) : 0
  // Linear penalty for minor updates (features)
  const minorPenalty = Math.min(diff.minor * 0.1, 0.3)
  // Minimal penalty for patch updates (bug fixes)
  const patchPenalty = Math.min(diff.patch * 0.02, 0.1)
  
  const totalPenalty = Math.min(majorPenalty + minorPenalty + patchPenalty, 1)
  return 1 - totalPenalty
}

/**
 * Calculates score based on vulnerability severity
 * Uses exponential penalty for critical vulnerabilities
 */
export function calcVulnScore(sev: {critical: number, high: number, moderate: number}): number {
  // Exponential penalty for critical vulnerabilities
  const criticalPenalty = sev.critical > 0 ? Math.pow(0.8, sev.critical) : 0
  // Linear penalty for high vulnerabilities
  const highPenalty = Math.min(sev.high * 0.3, 0.5)
  // Minimal penalty for moderate vulnerabilities
  const moderatePenalty = Math.min(sev.moderate * 0.1, 0.2)
  
  const totalPenalty = Math.min(criticalPenalty + highPenalty + moderatePenalty, 1)
  return 1 - totalPenalty
}

/**
 * Calculates community score using multiple factors
 * Combines popularity, issue ratio, and community health
 */
export function calcCommunityScore(stars: number, openIssues: number): number {
  // Popularity score using logarithmic scale
  const popularityScore = Math.min(Math.log10(stars + 1) / Math.log10(MAX_STARS + 1), 1)
  
  // Issue ratio score (issues per star)
  let issueRatioScore = 1
  if (stars >= MIN_STARS_FOR_ISSUE_RATIO) {
    const issueRatio = openIssues / stars
    // Perfect score if ratio is very low, penalty increases with ratio
    issueRatioScore = Math.max(0, 1 - (issueRatio / MAX_ISSUE_RATIO))
  } else if (openIssues > 0) {
    // For unpopular repos with issues, apply penalty
    issueRatioScore = Math.max(0, 1 - (openIssues / MIN_STARS_FOR_ISSUE_RATIO))
  }
  
  // Community health: balance between popularity and issue management
  const communityHealth = (popularityScore * 0.6) + (issueRatioScore * 0.4)
  
  return communityHealth
}

/**
 * Calculates activity score based on last commit date
 * Uses exponential decay with different thresholds
 */
export function calcActivityScore(lastCommit: string): number {
  if (!lastCommit) return 0
  
  const days = (Date.now() - new Date(lastCommit).getTime()) / (1000 * 60 * 60 * 24)
  
  // Different decay rates for different time periods
  if (days <= 30) {
    // Very recent activity: high score
    return Math.exp(-days / 30)
  } else if (days <= 90) {
    // Recent activity: moderate score
    return 0.8 * Math.exp(-(days - 30) / 60)
  } else if (days <= ACTIVITY_THRESHOLD_DAYS) {
    // Acceptable activity: lower score
    return 0.5 * Math.exp(-(days - 90) / 275)
  } else {
    // Stale repository: very low score
    return 0.1 * Math.exp(-(days - ACTIVITY_THRESHOLD_DAYS) / 365)
  }
}

/**
 * Calculates final health score (0-100) based on all parameters
 * Uses weighted combination of objective metrics
 */
export function calcFinalScore(params: ScoringParams): number {
  const lagScore = calcLagScore(params.current, params.latest)
  const vulnScore = calcVulnScore(params.severity)
  const communityScore = calcCommunityScore(params.stars, params.openIssues)
  const activityScore = calcActivityScore(params.lastCommit)
  
  const value = WEIGHTS.lag * lagScore +
               WEIGHTS.vuln * vulnScore +
               WEIGHTS.health * communityScore +
               WEIGHTS.activity * activityScore
               
  // Ensure score is within bounds (0-100)
  return Math.round(Math.max(0, Math.min(100, value * 100)))
}

/**
 * Debug function to show individual scores for troubleshooting
 */
export function debugScore(params: ScoringParams): {
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
  const lagScore = calcLagScore(params.current, params.latest)
  const vulnScore = calcVulnScore(params.severity)
  const communityScore = calcCommunityScore(params.stars, params.openIssues)
  const activityScore = calcActivityScore(params.lastCommit)
  
  const breakdown = {
    lag: WEIGHTS.lag * lagScore,
    vuln: WEIGHTS.vuln * vulnScore,
    health: WEIGHTS.health * communityScore,
    activity: WEIGHTS.activity * activityScore
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