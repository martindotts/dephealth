import * as fs from 'fs'
import * as readline from 'readline'
import { Config } from './types'

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
      case '--no-tokens':
        config.interactive = false
        break
      case '--config':
      case '-c':
        config.configFile = args[++i] || ''
        break
      case '--help':
      case '-h':
        console.log(`
Usage: npx dephealth [options]

Options:
  --github-token <token>     GitHub API token
  --gitlab-token <token>     GitLab API token  
  --bitbucket-token <token>  Bitbucket API token
  --no-tokens                Skip interactive token input
  --config <file>, -c <file> Config file path (JSON)
  --help, -h                 Show this help

Environment variables:
  GITHUB_TOKEN              GitHub API token
  GITLAB_TOKEN              GitLab API token
  BITBUCKET_TOKEN           Bitbucket API token

Config file format:
  {
    "githubToken": "your_token",
    "gitlabToken": "your_token",
    "bitbucketToken": "your_token"
  }
        `)
        process.exit(0)
    }
  }

  return config
}

// Load config from file
export async function loadConfigFile(filePath: string): Promise<Config> {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.warn(`Failed to load config file: ${filePath}`)
    return {}
  }
}

// Interactive token input
export async function promptForTokens(): Promise<Config> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const question = (query: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(query, resolve)
    })
  }

  const config: Config = {}

  console.log('Enter your API tokens (press Enter to skip):\n')

  const githubToken = await question('GitHub Token: ')
  if (githubToken.trim()) config.githubToken = githubToken.trim()

  const gitlabToken = await question('GitLab Token: ')
  if (gitlabToken.trim()) config.gitlabToken = gitlabToken.trim()

  const bitbucketToken = await question('Bitbucket Token: ')
  if (bitbucketToken.trim()) config.bitbucketToken = bitbucketToken.trim()

  rl.close()
  return config
}

// Merge configs with priority: CLI args > config file > env vars > interactive
export async function getConfig(): Promise<Config> {
  const cliConfig = parseArgs()

  // Load config file if specified
  let fileConfig: Config = {}
  if (cliConfig.configFile) {
    fileConfig = await loadConfigFile(cliConfig.configFile)
  }

  // Environment variables
  const envConfig: Config = {
    githubToken: process.env.GITHUB_TOKEN || undefined,
    gitlabToken: process.env.GITLAB_TOKEN || undefined,
    bitbucketToken: process.env.BITBUCKET_TOKEN || undefined
  }

  // Merge with priority
  const config: Config = {
    ...envConfig,
    ...fileConfig,
    ...cliConfig
  }

  // Interactive mode: default true unless noTokens flag or tokens already provided
  if ((cliConfig.interactive !== false) && (!cliConfig.noTokens) && (!config.githubToken && !config.gitlabToken && !config.bitbucketToken)) {
    const interactiveConfig = await promptForTokens()
    Object.assign(config, interactiveConfig)
  }

  return config
} 