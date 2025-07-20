import * as fs from 'fs'
import * as path from 'path'

export interface DepHealthConfig {
  boosters?: {
    maturity?: number
    updateFrequency?: number
    deprecation?: number
    dependency?: number
    download?: number
    vulnerability?: number
    issues?: number
  }
}

const DEFAULT_CONFIG: DepHealthConfig = {
  boosters: {
    maturity: 2,
    updateFrequency: 1,
    deprecation: 3,
    dependency: 1,
    download: 1,
    vulnerability: 2,
    issues: 1,
  }
}

/**
 * Create a default configuration file
 */
export function createConfigFile(configPath: string = 'dephealth-config.json'): void {
  const fullPath = path.resolve(configPath)
  
  // Check if file already exists
  if (fs.existsSync(fullPath)) {
    throw new Error(`Configuration file already exists: ${configPath}`)
  }
  
  // Create directory if it doesn't exist
  const dir = path.dirname(fullPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  
  // Write default configuration
  const configContent = JSON.stringify(DEFAULT_CONFIG, null, 2)
  fs.writeFileSync(fullPath, configContent, 'utf8')
  
  console.log(`✅ Configuration file created: ${configPath}`)
  console.log('📝 Edit the file to customize your boosters and tokens')
}

/**
 * Load configuration from file
 */
export function loadConfig(configPath: string): DepHealthConfig {
  const fullPath = path.resolve(configPath)
  
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Configuration file not found: ${configPath}`)
  }
  
  try {
    const configContent = fs.readFileSync(fullPath, 'utf8')
    const config = JSON.parse(configContent) as DepHealthConfig
    
    // Validate configuration
    validateConfig(config)
    
    return config
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in configuration file: ${configPath}`)
    }
    throw error
  }
}

/**
 * Validate configuration structure
 */
function validateConfig(config: any): void {
  if (typeof config !== 'object' || config === null) {
    throw new Error('Configuration must be an object')
  }
  
  if (config.boosters && typeof config.boosters !== 'object') {
    throw new Error('boosters must be an object')
  }
  

  
  // Validate booster values
  if (config.boosters) {
    const validBoosters = ['maturity', 'updateFrequency', 'deprecation', 'dependency', 'download', 'vulnerability', 'issues']
    
    for (const [key, value] of Object.entries(config.boosters)) {
      if (!validBoosters.includes(key)) {
        throw new Error(`Invalid booster key: ${key}`)
      }
      
      if (typeof value !== 'number' || value <= 0) {
        throw new Error(`Booster value for ${key} must be a positive number`)
      }
    }
  }
  

}

 