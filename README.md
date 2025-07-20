# dephealth

A comprehensive dependency health analyzer for Node.js projects that checks for outdated packages, security vulnerabilities, and repository health metrics.

## Features

- 🔍 **Dependency Analysis**: Check for outdated packages and their latest versions
- 🛡️ **Security Audit**: Identify packages with known vulnerabilities
- 📊 **Repository Health**: Analyze GitHub, GitLab, and Bitbucket repository metrics
- 🔐 **Multi-Platform Support**: Works with GitHub, GitLab, and Bitbucket APIs
- 📈 **Interactive Mode**: Easy token input for API authentication
- 🎯 **Flexible Configuration**: Support for CLI args, config files, and environment variables
- 🧮 **Smart Scoring**: Objective health scoring based on version lag, vulnerabilities, community metrics, and activity

## Installation

```bash
npm install dephealth
```

Or use it directly with npx:

```bash
npx dephealth
```

## Usage

### CLI Usage

```bash
# Basic usage (interactive token prompt if no tokens provided)
npx dephealth

# Provide tokens explicitly
npx dephealth --github-token YOUR_TOKEN

# Skip tokens entirely (rate-limited requests)
npx dephealth --no-tokens

# Using config file
npx dephealth --config config.json

# Show help
npx dephealth --help
```

### Programmatic Usage

```typescript
import { analyzeDependencies, displayResults } from 'dephealth';

async function main() {
  const results = await analyzeDependencies();
  displayResults(results);
}

main();
```

## Configuration

### Environment Variables

```bash
export GITHUB_TOKEN=your_github_token
export GITLAB_TOKEN=your_gitlab_token
export BITBUCKET_TOKEN=your_bitbucket_token
```

### Config File

Create a JSON file (e.g., `config.json`):

```json
{
  "githubToken": "your_github_token",
  "gitlabToken": "your_gitlab_token",
  "bitbucketToken": "your_bitbucket_token"
}
```

### CLI Options

- `--github-token <token>`: GitHub API token
- `--gitlab-token <token>`: GitLab API token
- `--bitbucket-token <token>`: Bitbucket API token
- `--no-tokens`: Skip interactive token input and use rate-limited requests
- `--config <file>, -c <file>`: Config file path (JSON)
- `--help, -h`: Show help

### Configuration Precedence

1. **CLI arguments** (highest priority)
2. **Config file** (if specified with `--config`)
3. **Environment variables**
4. **Interactive prompt** (if no tokens provided and `--no-tokens` not used)

## Scoring System

The tool uses an objective scoring system (0-100) based on:

- **Version Lag (25%)**: Penalizes outdated packages using semantic versioning
- **Vulnerabilities (35%)**: Exponential penalty for critical/high vulnerabilities
- **Community Health (25%)**: Combines popularity (stars) with issue management ratio
- **Activity (15%)**: Recent commit activity with exponential decay

### Community Score Calculation

The community score intelligently combines:
- **Popularity**: Logarithmic scale based on repository stars
- **Issue Ratio**: Issues per star ratio (penalizes repos with poor issue management)
- **Balance**: 60% popularity + 40% issue management

## API Reference

### `analyzeDependencies(): Promise<DependencyResult[]>`

Analyzes all dependencies in the current project and returns detailed information about each package.

### `displayResults(results: DependencyResult[]): void`

Displays the analysis results in a formatted table.

### `getConfig(): Promise<Config>`

Gets the configuration with proper precedence (CLI args > config file > env vars > interactive).

### Scoring Functions

```typescript
import { 
  calcFinalScore, 
  calcLagScore, 
  calcVulnScore, 
  calcCommunityScore, 
  calcActivityScore,
  debugScore 
} from 'dephealth';

// Calculate individual scores
const lagScore = calcLagScore(currentVersion, latestVersion);
const vulnScore = calcVulnScore({ critical: 0, high: 1, moderate: 2 });
const communityScore = calcCommunityScore(stars, openIssues);
const activityScore = calcActivityScore(lastCommitDate);

// Calculate final score
const finalScore = calcFinalScore({
  current: '1.0.0',
  latest: '2.0.0',
  severity: { critical: 0, high: 0, moderate: 0 },
  stars: 1000,
  openIssues: 10,
  lastCommit: '2024-01-01T00:00:00.000Z'
});

// Debug scoring breakdown
const debug = debugScore(params);
```

### Types

```typescript
interface DependencyResult {
  name: string;
  current: string;
  latest: string;
  outdated: {
    wanted: string;
    latest: string;
  } | null;
  vulnerabilitiesCount: number;
  repoHealth: RepoHealth | null;
  score?: number;
}

interface RepoHealth {
  stars: number;
  openIssues: number;
  lastCommit: string;
  platform: string;
}

interface Config {
  githubToken?: string;
  gitlabToken?: string;
  bitbucketToken?: string;
  interactive?: boolean;
  configFile?: string;
  noTokens?: boolean;
}

interface ScoringParams {
  current: string;
  latest: string;
  severity: {
    critical: number;
    high: number;
    moderate: number;
  };
  stars: number;
  openIssues: number;
  lastCommit: string;
}
```

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd lib-health-check

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev
```

### Scripts

- `npm run build`: Build the project
- `npm run dev`: Build in watch mode
- `npm run start`: Run the CLI
- `npm run clean`: Clean build artifacts

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

If you encounter any issues or have questions, please open an issue on GitHub. 