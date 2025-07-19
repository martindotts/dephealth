import * as fs from 'fs'
import * as path from 'path'
import { promisify } from 'util'
import { exec } from 'child_process'
import { OutdatedInfo, AuditInfo, PackageInfo } from './types'

const execAsync = promisify(exec)

export async function readPackageJson() {
  const pkgPath = path.join(process.cwd(), 'package.json')
  const content = await fs.promises.readFile(pkgPath, 'utf-8')
  return JSON.parse(content) as any
}

export async function getPackageInfo(packageName: string): Promise<PackageInfo> {
  try {
    const { stdout } = await execAsync(`npm view ${packageName} --json`)
    const data = JSON.parse(stdout) as PackageInfo
    return {
      version: data.version || 'unknown',
      repository: data.repository || undefined
    }
  } catch (error) {
    console.warn(`Failed to get info for ${packageName}:`, error)
    return {
      version: 'unknown'
    }
  }
}

export async function checkOutdated(): Promise<OutdatedInfo> {
  try {
    const { stdout } = await execAsync('npm outdated --json')
    if (!stdout) return {}
    const result = JSON.parse(stdout)
    return result || {}
  } catch (err: any) {
    // npm outdated exits with code >0 when there are outdated packages
    if (err.stdout) {
      try {
        const result = JSON.parse(err.stdout)
        return result || {}
      } catch {
        return {}
      }
    }
    return {}
  }
}

export async function checkAudit(): Promise<AuditInfo> {
  try {
    const { stdout } = await execAsync('npm audit --json')
    if (!stdout) return { vulnerabilities: {} }
    const result = JSON.parse(stdout) as AuditInfo
    return result || { vulnerabilities: {} }
  } catch (err: any) {
    if (err.stdout) {
      try {
        const result = JSON.parse(err.stdout) as AuditInfo
        return result || { vulnerabilities: {} }
      } catch {
        return { vulnerabilities: {} }
      }
    }
    return { vulnerabilities: {} }
  }
} 