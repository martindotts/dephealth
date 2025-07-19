// Use built-in fetch for Node.js 18+
const fetch = globalThis.fetch
import { RepoHealth, Config } from './types'

function parseRepoUrl(repoUrl: string): { platform: string; owner: string; repo: string; apiUrl: string } | null {
  // Remove git+ prefix if present
  const cleanUrl = repoUrl.replace(/^git\+/, '')

  // GitHub patterns
  const githubMatch = /github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?$/.exec(cleanUrl)
  if (githubMatch) {
    const [, owner, repo] = githubMatch
    return {
      platform: 'GitHub',
      owner: owner!,
      repo: repo!,
      apiUrl: `https://api.github.com/repos/${owner}/${repo}`
    }
  }

  // GitLab patterns
  const gitlabMatch = /gitlab\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?$/.exec(cleanUrl)
  if (gitlabMatch) {
    const [, owner, repo] = gitlabMatch
    return {
      platform: 'GitLab',
      owner: owner!,
      repo: repo!,
      apiUrl: `https://gitlab.com/api/v4/projects/${encodeURIComponent(owner + '/' + repo)}`
    }
  }

  // Bitbucket patterns
  const bitbucketMatch = /bitbucket\.org\/([^\/]+)\/([^\/]+?)(?:\.git)?$/.exec(cleanUrl)
  if (bitbucketMatch) {
    const [, owner, repo] = bitbucketMatch
    return {
      platform: 'Bitbucket',
      owner: owner!,
      repo: repo!,
      apiUrl: `https://api.bitbucket.org/2.0/repositories/${owner}/${repo}`
    }
  }

  // GitLab self-hosted patterns (generic)
  const gitlabSelfHostedMatch = /([^\/]+)\/([^\/]+)\/([^\/]+?)(?:\.git)?$/.exec(cleanUrl)
  if (gitlabSelfHostedMatch && !cleanUrl.includes('github.com') && !cleanUrl.includes('bitbucket.org')) {
    const [, domain, owner, repo] = gitlabSelfHostedMatch
    return {
      platform: 'GitLab (Self-hosted)',
      owner: owner!,
      repo: repo!,
      apiUrl: `https://${domain}/api/v4/projects/${encodeURIComponent(owner + '/' + repo)}`
    }
  }

  return null
}

export async function fetchRepoHealth(repoUrl: string, config: Config): Promise<RepoHealth | null> {
  try {
    const repoInfo = parseRepoUrl(repoUrl)
    if (!repoInfo) return null

    const { platform, apiUrl } = repoInfo

    const headers: Record<string, string> = {
      'User-Agent': 'dep-health-analyzer'
    }

    // Add authentication headers based on config
    switch (platform) {
      case 'GitHub':
        if (config.githubToken) {
          headers['Authorization'] = `token ${config.githubToken}`
        }
        break
      case 'GitLab':
      case 'GitLab (Self-hosted)':
        if (config.gitlabToken) {
          headers['PRIVATE-TOKEN'] = config.gitlabToken
        }
        break
      case 'Bitbucket':
        if (config.bitbucketToken) {
          headers['Authorization'] = `Bearer ${config.bitbucketToken}`
        }
        break
    }

    const res = await fetch(apiUrl, { headers })
    if (!res.ok) return null

    const data = await res.json() as any

    switch (platform) {
      case 'GitHub':
        return {
          platform,
          stars: data.stargazers_count || 0,
          openIssues: data.open_issues_count || 0,
          lastCommit: data.updated_at || data.pushed_at || ''
        }

      case 'GitLab':
      case 'GitLab (Self-hosted)':
        return {
          platform,
          stars: data.star_count || 0,
          openIssues: data.open_issues_count || 0,
          lastCommit: data.last_activity_at || data.updated_at || ''
        }

      case 'Bitbucket':
        return {
          platform,
          stars: 0, // Bitbucket doesn't have stars in the same way
          openIssues: data.size?.open || 0,
          lastCommit: data.updated_on || ''
        }

      default:
        return {
          platform,
          stars: 0,
          openIssues: 0,
          lastCommit: ''
        }
    }
  } catch (error) {
    console.warn(`Failed to fetch repo health for ${repoUrl}:`, error)
    return null
  }
} 