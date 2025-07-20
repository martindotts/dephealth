import * as fs from 'fs'
import * as path from 'path'
import { promisify } from 'util'
import { exec } from 'child_process'
import { NpmPackageInfo, NpmOutdatedInfo, NpmAuditResult } from './types'

const execAsync = promisify(exec)

/**
 * Read package.json from current directory
 */
export async function readPackageJson(): Promise<any> {
  const pkgPath = path.join(process.cwd(), 'package.json')
  const content = await fs.promises.readFile(pkgPath, 'utf-8')
  return JSON.parse(content)
}

/**
 * Get latest version of a package from npm registry
 */
export async function getPackageInfo(packageName: string): Promise<NpmPackageInfo | null> {
  try {
    const { stdout } = await execAsync(`npm view ${packageName} --json`)
    const data = JSON.parse(stdout)
    return data
  } catch (error) {
    console.error(packageName, error)
    return null
  }
}

/**
 * Get outdated packages information
 */
export async function getOutdatedPackages(): Promise<Record<string, NpmOutdatedInfo>> {
  try {
    const { stdout } = await execAsync('npm outdated --json')
    return JSON.parse(stdout) || {}
  } catch (err: any) {
    // npm outdated exits with code >0 when there are outdated packages
    if (err.stdout) {
      try {
        return JSON.parse(err.stdout) || {}
      } catch {
        return {}
      }
    }
    return {}
  }
}

/**
 * Get audit results
 */
export async function getAuditResults(): Promise<NpmAuditResult> {
  try {
    const { stdout } = await execAsync('npm audit --json')
    return JSON.parse(stdout) || { vulnerabilities: {} }
  } catch (err: any) {
    if (err.stdout) {
      try {
        return JSON.parse(err.stdout) || { vulnerabilities: {} }
      } catch {
        return { vulnerabilities: {} }
      }
    }
    return { vulnerabilities: {} }
  }
}

/**
 * Get last week downloads for a package using npm API
 */
export async function getLastWeekDownloads(packageName: string): Promise<number> {
  try {
    const response = await fetch(`https://api.npmjs.org/downloads/point/last-week/${packageName}`)
    
    if (!response.ok) {
      console.warn(`Failed to get downloads for ${packageName}: ${response.status}`)
      return 0
    }
    
    const data = await response.json()
    return data.downloads || 0
  } catch (error) {
    console.warn(`Error fetching downloads for ${packageName}:`, error)
    return 0
  }
}