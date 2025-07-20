#!/usr/bin/env node

import { analyzeDependencies, display } from './analyzer'
import { GitTokens } from './repo'

function showHelp(): void {
  console.log(`
Usage: npx dephealth [options]

Options:
  --help, -h                    Show this help
  --github-token <token>        GitHub API token (optional)
  --gitlab-token <token>        GitLab API token (optional)

Description:
  Analyzes dependencies for vulnerabilities and outdated packages.

Examples:
  npx dephealth                    # Analyze current project
  npx dephealth --github-token ghp_xxx    # With GitHub token
  npx dephealth --gitlab-token glpat_xxx  # With GitLab token
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



async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp()
    process.exit(0)
  }
  
  // Parse tokens
  const tokens = parseTokens(args)
  
  // Remove parsed arguments
  const filteredArgs = args.filter((arg, index) => {
    if (arg === '--github-token' || arg === '--gitlab-token') return false
    if (index > 0 && (args[index - 1] === '--github-token' || args[index - 1] === '--gitlab-token')) return false
    return true
  })
  
  if (filteredArgs.length > 0) {
    console.error('Unknown arguments:', filteredArgs.join(' '))
    console.error('Use --help for usage information')
    process.exit(1)
  }

  try {
    const result = await analyzeDependencies(tokens)
    display(result)
  } catch (err) {
    console.error('Error during analysis:', err)
    process.exit(1)
  }
}

main() 