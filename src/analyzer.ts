import { getConfig } from './config'
import { readPackageJson, getPackageInfo, checkOutdated, checkAudit } from './npm'
import { fetchRepoHealth } from './repo-health'
import { DependencyResult } from './types'
import pLimit from 'p-limit'
import semver from 'semver'

// Scoring weights
const WEIGHTS = { lag: 0.25, vuln: 0.35, stars: 0.15, issues: 0.1, recent: 0.15 }
const MAX_STARS = 100000
const MAX_OPEN_ISSUES = 500

function calcLagScore(current: string, latest: string): number {
  if (!latest || latest === 'unknown') return 1
  const cur = semver.coerce(current)
  const lat = semver.coerce(latest)
  if (!cur || !lat) return 1
  const diff = {
    major: lat.major - cur.major,
    minor: lat.minor - cur.minor,
    patch: lat.patch - cur.patch
  }
  const penalty = Math.min(diff.major * 0.5 + diff.minor * 0.1 + diff.patch * 0.02, 1)
  return 1 - penalty
}

function calcVulnScore(sev: {critical:number, high:number, moderate:number}): number {
  const penalty = Math.min(sev.critical*0.6 + sev.high*0.3 + sev.moderate*0.1, 1)
  return 1 - penalty
}

function calcPopScore(stars:number): number {
  return Math.min(Math.log10(stars+1)/Math.log10(MAX_STARS+1),1)
}

function calcIssueScore(openIssues:number): number {
  return 1 - Math.min(openIssues / MAX_OPEN_ISSUES,1)
}

function calcActiveScore(lastCommit:string): number {
  if(!lastCommit) return 0
  const days = (Date.now() - new Date(lastCommit).getTime())/ (1000*60*60*24)
  return Math.exp(-days/365)
}

function calcFinalScore(params:{current:string, latest:string, severity:{critical:number, high:number, moderate:number}, stars:number, openIssues:number, lastCommit:string}): number {
  const value = WEIGHTS.lag   * calcLagScore(params.current, params.latest) +
               WEIGHTS.vuln  * calcVulnScore(params.severity) +
               WEIGHTS.stars * calcPopScore(params.stars) +
               WEIGHTS.issues* calcIssueScore(params.openIssues) +
               WEIGHTS.recent* calcActiveScore(params.lastCommit)
  return Math.round(value * 100)
}

export async function analyzeDependencies(): Promise<DependencyResult[]> {
  const config = await getConfig()

  const pkg = await readPackageJson()
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }
  const totalDeps = Object.keys(deps).length
  console.log(`Found ${totalDeps} dependencies.`)

  const outdated = await checkOutdated() || {}
  const audit = await checkAudit() || { vulnerabilities: {} }

  const results: DependencyResult[] = []
  let processedCount = 0

  const limit = pLimit(10)

  const analysisPromises = Object.entries(deps).map(([name, currentVersion]) => limit(async () => {
    try {
      const info = await getPackageInfo(name as string)
      const latest = info.version
      const repoUrl = (info.repository && info.repository.url) || (pkg.repository && pkg.repository.url) || ''
      const repoHealth = repoUrl ? await fetchRepoHealth(repoUrl, config) : null
      const isOutdated = outdated[name]
      const vulnerabilities = audit.vulnerabilities[name] || {}
      const vulnInfo = vulnerabilities[latest] || {}

      const severity = {critical:0, high:0, moderate:0}
      if (vulnInfo && vulnInfo.via) {
        const arr = Array.isArray(vulnInfo.via) ? vulnInfo.via : []
        arr.forEach((v: any) => {
          if (typeof v === 'object' && v.severity && severity[v.severity as keyof typeof severity] !== undefined) {
            severity[v.severity as keyof typeof severity]++
          }
        })
      }

      const scoreNum = calcFinalScore({
        current: currentVersion as string,
        latest,
        severity,
        stars: repoHealth?.stars ?? 0,
        openIssues: repoHealth?.openIssues ?? 0,
        lastCommit: repoHealth?.lastCommit ?? ''
      })

      return {
        name,
        current: currentVersion as string,
        latest,
        outdated: isOutdated ? {
          wanted: isOutdated.wanted,
          latest: isOutdated.latest
        } : null,
        vulnerabilitiesCount: Object.keys(vulnerabilities).length,
        repoHealth,
        score: scoreNum
      } as DependencyResult
    } catch (error) {
      console.warn(`Failed to analyze ${name}:`, error)
      return {
        name,
        current: currentVersion as string,
        latest: 'unknown',
        outdated: null,
        vulnerabilitiesCount: 0,
        repoHealth: null,
        score: 0
      } as DependencyResult
    } finally {
      processedCount++
      process.stdout.write(`\r${processedCount}/${totalDeps} dependencies analyzed...`)
    }
  }))

  const resultsParallel = await Promise.all(analysisPromises)
  results.push(...resultsParallel)

  console.log('\n') // Clear the progress line
  return results
}

export function displayResults(results: DependencyResult[]): void {
  console.table(results.map(r => ({
    Package: r.name,
    Current: r.current,
    Latest: r.latest,
    Outdated: r.outdated ? 'Yes' : 'No',
    Vulnerabilities: r.vulnerabilitiesCount,
    Platform: r.repoHealth?.platform ?? '-',
    Stars: r.repoHealth?.stars ?? '-',
    Issues: r.repoHealth?.openIssues ?? '-',
    'Last Commit': r.repoHealth?.lastCommit ? new Date(r.repoHealth.lastCommit).toLocaleDateString() : '-',
    Score: r.score ?? 0
  })))
} 