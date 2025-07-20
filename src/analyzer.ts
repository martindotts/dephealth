import chalk from 'chalk'
import { printTable } from 'console-table-printer'
import pLimit from 'p-limit'
import { readPackageJson, getPackageInfo, getOutdatedPackages, getAuditResults, getLastWeekDownloads } from './npm'
import { getRepoData, GitTokens } from './repo'
import { Package, Scores } from './types'

// —— Helpers ——

// Days between two dates
function daysBetween(a: Date, b: Date): number {
  return Math.abs((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

// —— Score Functions ——

/**
 * Calculates a maturity score based on project age and release cadence.
 * - ageNormalized: years active, capped at 10 years
 * - releaseRateNormalized: releases per year, capped at 4/year
 */
function calculateMaturity(pkg: Package): number {
  const today = new Date()
  const ageDays = daysBetween(pkg.createdDate, today)
  const yearsActive = ageDays / 365

  const ageNormalized = Math.min(yearsActive / 10, 1)
  const releasesPerYear = pkg.versionCount / Math.max(yearsActive, 1)
  const releaseRateNormalized = Math.min(releasesPerYear / 4, 1)

  return ageNormalized * 0.6 + releaseRateNormalized * 0.4
}

/**
 * Calculates an update frequency score based on releases per year.
 * - releasesPerYear: total releases divided by years active
 * - score: 0 if ≤1 release/year, 1 if ≥12 releases/year
 */
function calculateUpdateFrequency(pkg: Package): number {
  const yearsActive = daysBetween(pkg.createdDate, new Date()) / 365
  const releasesPerYear = pkg.versionCount / Math.max(yearsActive, 1)
  const normalized = (releasesPerYear - 1) / (12 - 1)
  return Math.min(Math.max(normalized, 0), 1)
}


/**
 * 0 if deprecated, 1 if not
 */
function calculateDeprecation(pkg: Package): number {
  return pkg.deprecated ? 0 : 1
}

/**
 * Dependency health.
 * - Runtime deps: log‑scaled, ideal ≤5, poor ≥40
 * - Dev deps:     log‑scaled, ideal ≤10, poor ≥80
 */
function calculateDependency(pkg: Package): number {
  const runtime = 1 - Math.min(Math.log10(pkg.dependencyCount + 1) / Math.log10(41), 1)
  const dev     = 1 - Math.min(Math.log10(pkg.devDependencyCount + 1) / Math.log10(81), 1)
  return runtime * 0.7 + dev * 0.3
}

/**
 * Download popularity (weekly).
 * - Uses log scale so scores grow quickly at low volumes and plateau toward 1 M downloads/week.
 */
function calculateDownload(pkg: Package): number {
  if (pkg.lastWeekDownloads <= 0) return 0
  const score = Math.log10(pkg.lastWeekDownloads) / 6
  return Math.min(score, 1)
}

/**
 * Vulnerability score.
 * - Severity weights roughly reflect CVSS impact.
 * - Total penalty capped; zero vulns ⇒ 1.0, severe backlog ⇒ 0.
 */
function calculateVulnerability(pkg: Package): number {
  const { critical, high, moderate, low } = pkg.vulnerabilities
  const points = critical * 8 + high * 6 + moderate * 4 + low * 2
  return Math.max(0, 1 - Math.min(points, 25) / 25) // max practical ≈25
}

/**
 * Issue health.
 * - Normalizes open issues by popularity to avoid penalizing popular packages unfairly.
 * - Ratio ≤0.1 open issues per 10 k downloads ⇒ 1.0
 * - Ratio ≥5   open issues per 10 k downloads ⇒ 0.0
 */
function calculateIssues(pkg: Package): number {
  const denominator = Math.max(pkg.lastWeekDownloads / 10_000, 1)
  const ratio = pkg.openIssuesCount / denominator                    // open issues per 10 k downloads
  const normalized = 1 - Math.min(Math.log10(ratio + 1) / Math.log10(51), 1)
  return normalized
}

/** 9. Wrapper: all scores together */
function calculateAllScores(pkg: Package): Scores {
  return {
    maturity: calculateMaturity(pkg),
    updateFrequency: calculateUpdateFrequency(pkg),
    deprecation: calculateDeprecation(pkg),
    dependency: calculateDependency(pkg),
    download: calculateDownload(pkg),
    vulnerability: calculateVulnerability(pkg),
    issues: calculateIssues(pkg),
  }
}

// —— Main Analysis Functions ——

/**
 * Convert npm package info to our Package interface
 */
async function buildPackageData(packageName: string, npmInfo: any, _outdatedInfo?: any, auditInfo?: any, tokens?: GitTokens): Promise<Package> {
  // Get downloads
  const lastWeekDownloads = await getLastWeekDownloads(packageName)
  
  // Get repository data
  const repoData = await getRepoData(npmInfo.repository?.url || npmInfo.homepage || '', tokens)
  
  // Parse time data
  const timeData = npmInfo.time || {}
  const createdDate = new Date(timeData.created || Date.now())
  const latestDate = new Date(timeData[npmInfo['dist-tags']?.latest] || Date.now())
  const currentDate = new Date(timeData[npmInfo.version] || Date.now())
  

  
  // Parse dependencies
  const dependencyCount = Object.keys(npmInfo.dependencies || {}).length
  const devDependencyCount = Object.keys(npmInfo.devDependencies || {}).length
  
  // Parse vulnerabilities
  const vulnerabilities = {
    critical: 0,
    high: 0,
    moderate: 0,
    low: 0
  }
  
  if (auditInfo?.vulnerabilities?.[packageName]) {
    const vuln = auditInfo.vulnerabilities[packageName]
    if (vuln.severity === 'critical') vulnerabilities.critical++
    else if (vuln.severity === 'high') vulnerabilities.high++
    else if (vuln.severity === 'moderate') vulnerabilities.moderate++
    else if (vuln.severity === 'low') vulnerabilities.low++
  }
  
  return {
    name: packageName,
    current: npmInfo.version || '0.0.0',
    latest: npmInfo['dist-tags']?.latest || '0.0.0',
    currentDate,
    latestDate,
    createdDate,
    versionCount: Object.keys(timeData).length - 2, // Exclude 'created' and 'modified'
    deprecated: !!npmInfo.deprecated,
    dependencyCount,
    devDependencyCount,
    lastWeekDownloads,
    vulnerabilities,
    openIssuesCount: repoData.openIssuesCount
  }
}

/**
 * Main analysis function
 */
export async function analyzeDependencies(tokens?: GitTokens): Promise<{package: Package, scores: Scores}[]> {
  // Read package.json
  const packageJson = await readPackageJson()
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  }
  
  if (Object.keys(dependencies).length === 0) {
    console.log(chalk.red('❌ No dependencies found in package.json'))
    return []
  }
  
  // Get audit and outdated info
  const [auditResults, outdatedPackages] = await Promise.all([
    getAuditResults(),
    getOutdatedPackages()
  ])
  
  console.log(chalk.cyan(`📦 Analyzing ${Object.keys(dependencies).length} packages...`))
  
  // Create concurrency limiter (max 10 concurrent operations)
  const limit = pLimit(10)
  
  // Analyze dependencies in parallel with concurrency limit
  const analysisPromises = Object.entries(dependencies).map(([packageName, _version]) => 
    limit(async () => {
      try {
        console.log(chalk.gray(`  📋 ${packageName}...`))
        
        // Get package info from npm
        const npmInfo = await getPackageInfo(packageName)
        if (!npmInfo) {
          console.log(chalk.yellow(`    ⚠️  Could not fetch info for ${packageName}`))
          return null
        }
        
        // Build package data
        const packageData = await buildPackageData(
          packageName, 
          npmInfo, 
          outdatedPackages[packageName], 
          auditResults,
          tokens
        )
        
        // Calculate scores
        const scores = calculateAllScores(packageData)
        
        return { package: packageData, scores }
        
      } catch (error) {
        console.log(chalk.red(`    ❌ Error analyzing ${packageName}:`, error))
        return null
      }
    })
  )
  
  // Wait for all analyses to complete
  const results = (await Promise.all(analysisPromises)).filter(Boolean) as {package: Package, scores: Scores}[]
  
  console.log(chalk.green.bold(`✅ Analysis complete! Analyzed ${results.length} packages`))
  return results
}

/**
 * Display results in a professional formatted table
 */
export function display(data: {package: Package, scores: Scores}[], weights?: {
  maturity?: number
  updateFrequency?: number
  deprecation?: number
  dependency?: number
  download?: number
  vulnerability?: number
  issues?: number
}): void {
  if (data.length === 0) {
    console.log(chalk.yellow('No packages to display'))
    return
  }
  
  console.log('\n' + chalk.blue.bold('📊 DEPENDENCY HEALTH REPORT'))
  console.log(chalk.gray('='.repeat(80)))
  
  // Default weights if not provided (all equal, sum to 1)
  const defaultWeights = {
    maturity: 0.2,
    updateFrequency: 0.05,
    deprecation: 0.3,
    dependency: 0.05,
    download: 0.05,
    vulnerability: 0.3,
    issues: 0.05,
  }
  
  const finalWeights = {
    maturity: weights?.maturity ?? defaultWeights.maturity,
    updateFrequency: weights?.updateFrequency ?? defaultWeights.updateFrequency,
    deprecation: weights?.deprecation ?? defaultWeights.deprecation,
    dependency: weights?.dependency ?? defaultWeights.dependency,
    download: weights?.download ?? defaultWeights.download,
    vulnerability: weights?.vulnerability ?? defaultWeights.vulnerability,
    issues: weights?.issues ?? defaultWeights.issues
  }
  
  // Normalize weights to sum to 1
  const totalWeight = 
    finalWeights.maturity + finalWeights.updateFrequency + finalWeights.deprecation + 
    finalWeights.dependency + finalWeights.download + finalWeights.vulnerability + finalWeights.issues
  
  const normalizedWeights = {
    maturity: finalWeights.maturity / totalWeight,
    updateFrequency: finalWeights.updateFrequency / totalWeight,
    deprecation: finalWeights.deprecation / totalWeight,
    dependency: finalWeights.dependency / totalWeight,
    download: finalWeights.download / totalWeight,
    vulnerability: finalWeights.vulnerability / totalWeight,
    issues: finalWeights.issues / totalWeight
  }
  
  // Calculate weighted score
  const calculateWeightedScore = (scores: Scores): number => {
    return (
      scores.maturity * normalizedWeights.maturity +
      scores.updateFrequency * normalizedWeights.updateFrequency +
      scores.deprecation * normalizedWeights.deprecation +
      scores.dependency * normalizedWeights.dependency +
      scores.download * normalizedWeights.download +
      scores.vulnerability * normalizedWeights.vulnerability +
      scores.issues * normalizedWeights.issues
    )
  }
  
  // Sort by weighted overall score
  const sortedData = data.sort((a, b) => {
    const scoreA = calculateWeightedScore(a.scores)
    const scoreB = calculateWeightedScore(b.scores)
    return scoreB - scoreA
  })
  
  // Color coding functions
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return chalk.green
    if (score >= 0.6) return chalk.yellow
    return chalk.red
  }
  
  // Prepare table data
  const tableData = sortedData.map(({ package: pkg, scores }) => {
    const overallScore = calculateWeightedScore(scores)
    
    return {
      Package: chalk.bold(pkg.name),
      Current: pkg.current,
      Latest: pkg.latest,
      Maturity: getScoreColor(scores.maturity)(scores.maturity.toFixed(2)),
      Updates: getScoreColor(scores.updateFrequency)(scores.updateFrequency.toFixed(2)),
      Deprecation: getScoreColor(scores.deprecation)(scores.deprecation.toFixed(2)),
      Dependency: getScoreColor(scores.dependency)(scores.dependency.toFixed(2)),
      Downloads: getScoreColor(scores.download)(scores.download.toFixed(2)),
      Vulnerability: getScoreColor(scores.vulnerability)(scores.vulnerability.toFixed(2)),
      Issues: getScoreColor(scores.issues)(scores.issues.toFixed(2)),
      Overall: getScoreColor(overallScore)(overallScore.toFixed(2))
    }
  })
  
  // Print table
  printTable(tableData)
} 