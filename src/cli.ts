#!/usr/bin/env node

import { analyzeDependencies, display } from './analyzer'
import { GitTokens } from './repo'
import { createConfigFile, loadConfig } from './config'

function showHelp(): void {
  console.log(`
Usage: npx dephealth [options]

Options:
  --help, -h                    Show this help
  --github-token <token>        GitHub API token (optional)
  --gitlab-token <token>        GitLab API token (optional)
  --init-config [file]          Create default configuration file
  --config <file>               Use configuration file for boosters

Description:
  Analyzes dependencies for vulnerabilities and outdated packages.

Examples:
  npx dephealth                                    # Analyze current project
  npx dephealth --github-token ghp_xxx            # With GitHub token
  npx dephealth --gitlab-token glpat_xxx          # With GitLab token
  npx dephealth --init-config                     # Create dephealth-config.json
  npx dephealth --init-config myconfig.json       # Create myconfig.json
  npx dephealth --config dephealth-config.json    # Use configuration file for boosters
`)
}

function parseTokens(args: string[]): GitTokens {
  const tokens: GitTokens = {}
  
  const githubIndex = args.indexOf('--github-token')
  if (githubIndex !== -1 && githubIndex + 1 < args.length) {
    tokens.githubToken = args[githubIndex + 1]
  }
  
  const gitlabIndex = args.indexOf('--gitlab-token')
  if (gitlabIndex !== -1 && gitlabIndex + 1 < args.length) {
    tokens.gitlabToken = args[gitlabIndex + 1]
  }
  
  return tokens
}

function parseConfigFile(args: string[]): string | null {
  const configIndex = args.indexOf('--config')
  if (configIndex !== -1 && configIndex + 1 < args.length) {
    return args[configIndex + 1]
  }
  return null
}

function parseInitConfig(args: string[]): string | null {
  const initIndex = args.indexOf('--init-config')
  if (initIndex !== -1) {
    // Check if there's a file name after --init-config
    if (initIndex + 1 < args.length && !args[initIndex + 1].startsWith('--')) {
      return args[initIndex + 1]
    }
    return 'dephealth-config.json' // Default file name
  }
  return null
}



async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp()
    process.exit(0)
  }
  
  // Check for --init-config first
  const initConfigFile = parseInitConfig(args)
  if (initConfigFile) {
    try {
      createConfigFile(initConfigFile)
      process.exit(0)
    } catch (err) {
      console.error('Error creating config file:', err)
      process.exit(1)
    }
  }
  
  // Parse tokens and config file
  const tokens = parseTokens(args)
  const configFile = parseConfigFile(args)
  
  // Remove parsed arguments
  const filteredArgs = args.filter((arg, index) => {
    if (arg === '--github-token' || arg === '--gitlab-token' || 
        arg === '--config' || arg === '--init-config') return false
    if (index > 0 && (args[index - 1] === '--github-token' || 
        args[index - 1] === '--gitlab-token' || args[index - 1] === '--config')) return false
    if (index > 0 && args[index - 1] === '--init-config' && !arg.startsWith('--')) return false
    return true
  })
  
  if (filteredArgs.length > 0) {
    console.error('Unknown arguments:', filteredArgs.join(' '))
    console.error('Use --help for usage information')
    process.exit(1)
  }

  try {
    let config = null
    if (configFile) {
      config = loadConfig(configFile)
    }
    
    // Use CLI tokens only (config is only for boosters)
    const gitTokens: GitTokens = {
      githubToken: tokens.githubToken,
      gitlabToken: tokens.gitlabToken
    }
    
    const result = await analyzeDependencies(gitTokens)
    
    // Use boosters from config if available
    const boosters = config?.boosters
    display(result, boosters)
  } catch (err) {
    console.error('Error during analysis:', err)
    process.exit(1)
  }
}

main() 