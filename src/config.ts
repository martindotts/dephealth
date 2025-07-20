import * as fs from 'fs'
import * as path from 'path'
import { Config, AppConfig } from './types'
import { setScoringConfig } from './scoring'

// Parse command line arguments
export function parseArgs(): Config {
  const args = process.argv.slice(2)
  const config: Config = {}

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--github-token':
        config.githubToken = args[++i] || ''
        break
      case '--gitlab-token':
        config.gitlabToken = args[++i] || ''
        break
      case '--bitbucket-token':
        config.bitbucketToken = args[++i] || ''
        break
      case '--config':
      case '-c':
        config.configFile = args[++i] || ''
        break
      case '--init-config':
        const fileName = args[++i] || 'dephealth-config.js'
        initConfigFile(fileName)
        process.exit(0)
        break
      case '--help':
      case '-h':
        console.log(`
Usage: npx dephealth [options]

Options:
  --github-token <token>     GitHub API token
  --gitlab-token <token>     GitLab API token  
  --bitbucket-token <token>  Bitbucket API token
  --config <file>, -c <file> Config file path (JavaScript/JSON)
  --init-config [filename]   Generate configuration template file
  --help, -h                 Show this help

Environment variables:
  GITHUB_TOKEN              GitHub API token
  GITLAB_TOKEN              GitLab API token
  BITBUCKET_TOKEN           Bitbucket API token

Configuration precedence:
  1. CLI arguments (highest priority)
  2. Config file
  3. Environment variables
  4. Default values

Examples:
  npx dephealth --init-config                    # Creates dephealth-config.js
  npx dephealth --init-config my-config.js      # Creates my-config.js
  npx dephealth --config config.js              # Use custom config file
  npx dephealth --github-token $GITHUB_TOKEN    # Use CLI tokens
        `)
        process.exit(0)
    }
  }

  return config
}

// Generate configuration template file
function initConfigFile(fileName: string): void {
  const template = `// Configuration file for dephealth
// Generated on ${new Date().toISOString()}

// Load environment variables from .env file (optional)
try {
  require('dotenv').config()
} catch (error) {
  // dotenv not installed, continue without it
}

module.exports = {
  // API tokens (can use environment variables)
  tokens: {
    github: process.env.GITHUB_TOKEN,
    gitlab: process.env.GITLAB_TOKEN,
    bitbucket: process.env.BITBUCKET_TOKEN
  },

  // Customize scoring algorithm (all fields are optional)
  scoring: {
    // Weights for different factors (must sum to 1.0)
    weights: {
      lag: 0.25,        // Version lag penalty
      vuln: 0.35,       // Vulnerability penalty
      health: 0.25,     // Community health
      activity: 0.15    // Recent activity
    },

    // Constants for calculations
    constants: {
      maxStars: 100000,              // Maximum stars for normalization
      minStarsForIssueRatio: 10,     // Minimum stars to consider issue ratio
      maxIssueRatio: 0.5,            // Maximum issues per star (50%)
      activityThresholdDays: 365     // Days before considering repo stale
    },

    // Penalty multipliers
    penalties: {
      majorUpdate: 0.5,      // Penalty for major version updates
      minorUpdate: 0.1,      // Penalty for minor version updates
      patchUpdate: 0.02,     // Penalty for patch version updates
      criticalVuln: 0.6,     // Penalty for critical vulnerabilities
      highVuln: 0.3,         // Penalty for high vulnerabilities
      moderateVuln: 0.1      // Penalty for moderate vulnerabilities
    }
  }
}

// Alternative: More aggressive scoring for security-focused projects
/*
module.exports = {
  tokens: {
    github: process.env.GITHUB_TOKEN
  },
  scoring: {
    weights: {
      lag: 0.15,        // Less weight on version lag
      vuln: 0.50,       // Much more weight on vulnerabilities
      health: 0.20,     // Community health
      activity: 0.15    // Recent activity
    },
    penalties: {
      criticalVuln: 0.8,    // Higher penalty for critical vulns
      highVuln: 0.5,        // Higher penalty for high vulns
      moderateVuln: 0.2     // Higher penalty for moderate vulns
    }
  }
}
*/
`

  try {
    fs.writeFileSync(fileName, template, 'utf-8')
    console.log(`✅ Configuration template created: ${fileName}`)
    console.log(`📝 Edit the file to customize your settings`)
    console.log(`🚀 Run: npx dephealth --config ${fileName}`)
  } catch (error) {
    console.error(`❌ Failed to create configuration file: ${error}`)
    process.exit(1)
  }
}

// Load config from JavaScript/JSON file
export async function loadConfigFile(filePath: string): Promise<AppConfig> {
  try {
    const fullPath = path.resolve(filePath)
    
    if (!fs.existsSync(fullPath)) {
      console.warn(`Config file not found: ${filePath}`)
      return {}
    }

    const ext = path.extname(fullPath).toLowerCase()
    
    if (ext === '.js' || ext === '.mjs' || ext === '.cjs') {
      // Load JavaScript config file
      const configModule = await import(fullPath)
      const config = configModule.default || configModule
      
      if (typeof config !== 'object' || config === null) {
        throw new Error('Config file must export an object')
      }
      
      return config as AppConfig
    } else if (ext === '.json') {
      // Load JSON config file
      const content = await fs.promises.readFile(fullPath, 'utf-8')
      return JSON.parse(content) as AppConfig
    } else {
      throw new Error(`Unsupported config file format: ${ext}`)
    }
  } catch (error) {
    console.warn(`Failed to load config file: ${filePath}`, error)
    return {}
  }
}

// Merge configs with proper precedence
export async function getConfig(): Promise<Config> {
  const cliConfig = parseArgs()

  // Load config file if specified
  let fileConfig: AppConfig = {}
  if (cliConfig.configFile) {
    fileConfig = await loadConfigFile(cliConfig.configFile)
  }

  // Environment variables
  const envConfig: Config = {
    githubToken: process.env.GITHUB_TOKEN || undefined,
    gitlabToken: process.env.GITLAB_TOKEN || undefined,
    bitbucketToken: process.env.BITBUCKET_TOKEN || undefined
  }

  // Merge with precedence: CLI > config file > env vars
  const finalConfig: Config = {
    ...envConfig,
    ...fileConfig.tokens,
    ...cliConfig
  }

  // Apply scoring configuration if provided
  if (fileConfig.scoring) {
    setScoringConfig(fileConfig.scoring)
  }

  return finalConfig
} 