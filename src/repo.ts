export interface RepoData {
  openIssuesCount: number
}

export interface GitTokens {
  githubToken?: string
  gitlabToken?: string
}

/**
 * Extract repository info from package.json repository field
 */
function extractRepoInfo(repositoryUrl: string): { platform: 'github' | 'gitlab', owner: string, repo: string } | null {
  try {
    // Handle different URL formats
    let url = repositoryUrl
    
    // Remove .git suffix
    if (url.endsWith('.git')) {
      url = url.slice(0, -4)
    }
    
    // Handle git:// URLs
    if (url.startsWith('git://')) {
      url = url.replace('git://', 'https://')
    }
    
    // Handle git+https:// URLs
    if (url.startsWith('git+https://')) {
      url = url.replace('git+https://', 'https://')
    }
    
    // Handle git+ssh:// URLs
    if (url.startsWith('git+ssh://')) {
      url = url.replace('git+ssh://git@', 'https://')
    }
    
    // Parse URL
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/').filter(Boolean)
    
    if (pathParts.length < 2) return null
    
    const owner = pathParts[0]
    const repo = pathParts[1]
    
    // Determine platform
    if (urlObj.hostname.includes('github.com')) {
      return { platform: 'github', owner, repo }
    } else if (urlObj.hostname.includes('gitlab.com')) {
      return { platform: 'gitlab', owner, repo }
    }
    
    return null
  } catch (error) {
    return null
  }
}

/**
 * Get repository data from GitHub
 */
async function getGitHubData(owner: string, repo: string, token?: string): Promise<RepoData> {
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json'
    }
    
    if (token) {
      headers['Authorization'] = `token ${token}`
    }
    
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers })
    
    if (!response.ok) {
      console.warn(`GitHub API error for ${owner}/${repo}: ${response.status}`)
      return { openIssuesCount: 0 }
    }
    
    const data = await response.json()
    
    return {
      openIssuesCount: data.open_issues_count || 0
    }
  } catch (error) {
    console.warn(`Error fetching GitHub data for ${owner}/${repo}:`, error)
    return { openIssuesCount: 0 }
  }
}

/**
 * Get repository data from GitLab
 */
async function getGitLabData(owner: string, repo: string, token?: string): Promise<RepoData> {
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    // GitLab API uses project ID or path
    const projectPath = `${owner}/${repo}`
    const encodedPath = encodeURIComponent(projectPath)
    
    // Get open issues count
    const issuesResponse = await fetch(`https://gitlab.com/api/v4/projects/${encodedPath}/issues?state=opened&per_page=1`, { headers })
    
    const openIssuesCount = issuesResponse.ok ? parseInt(issuesResponse.headers.get('x-total') || '0') : 0
    
    return {
      openIssuesCount
    }
  } catch (error) {
    console.warn(`Error fetching GitLab data for ${owner}/${repo}:`, error)
    return { openIssuesCount: 0 }
  }
}

/**
 * Get repository data (open issues count only)
 */
export async function getRepoData(repositoryUrl: string, gitTokens: GitTokens = {}): Promise<RepoData> {
  const repoInfo = extractRepoInfo(repositoryUrl)
  
  if (!repoInfo) {
    return { openIssuesCount: 0 }
  }
  
  const { platform, owner, repo } = repoInfo
  
  try {
    if (platform === 'github') {
      return await getGitHubData(owner, repo, gitTokens.githubToken)
    } else if (platform === 'gitlab') {
      return await getGitLabData(owner, repo, gitTokens.gitlabToken)
    }
  } catch (error) {
    console.warn(`Error fetching repo data for ${repositoryUrl}:`, error)
  }
  
  return { openIssuesCount: 0 }
}
