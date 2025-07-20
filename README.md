# dephealth

A comprehensive dependency health analyzer for Node.js projects that checks for outdated packages, security vulnerabilities, and repository health metrics.

## Features

- 🔍 **Dependency Analysis**: Check for outdated packages and their latest versions
- 🛡️ **Security Audit**: Identify packages with known vulnerabilities
- 📊 **Repository Health**: Analyze GitHub, GitLab, and Bitbucket repository metrics
- 🔐 **Multi-Platform Support**: Works with GitHub, GitLab, and Bitbucket APIs
- 🧮 **Smart Scoring**: Objective health scoring based on version lag, vulnerabilities, community metrics, and activity
- ⚙️ **Flexible Configuration**: JavaScript config files with environment variable support
- 🎯 **Customizable Scoring**: Adjust weights, penalties, and thresholds to match your needs

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
# Basic usage (uses environment variables or default values)
npx dephealth

# Generate configuration template
npx dephealth --init-config                    # Creates dephealth-config.js
npx dephealth --init-config my-config.js      # Creates my-config.js

# With custom configuration file
npx dephealth --config config.js

# Override tokens via CLI (highest priority)
npx dephealth --github-token $GITHUB_TOKEN --config config.js

# Show help
npx dephealth --help
```

### Programmatic Usage

```typescript
import { analyzeDependencies, displayResults, setScoringConfig } from 'dephealth';

// Customize scoring before analysis
setScoringConfig({
  weights: {
    lag: 0.20,
    vuln: 0.40,
    health: 0.25,
    activity: 0.15
  }
});

async function main() {
  const results = await analyzeDependencies();
  displayResults(results);
}

main();
```

## Configuration

### Environment Variables

You can set environment variables directly:

```bash
export GITHUB_TOKEN=your_github_token
export GITLAB_TOKEN=your_gitlab_token
export BITBUCKET_TOKEN=your_bitbucket_token
```

Or use a `.env` file in your project root:

```bash
# .env
GITHUB_TOKEN=your_github_token
GITLAB_TOKEN=your_gitlab_token
BITBUCKET_TOKEN=your_bitbucket_token
```

**Note**: The configuration file automatically loads `.env` if the `dotenv` package is available. If you don't have `dotenv` installed, you can install it with `npm install dotenv` or set environment variables directly.

### Configuration File

Generate a configuration template:

```bash
npx dephealth --init-config
```

This creates `dephealth-config.js` with the default configuration. You can also specify a custom filename:

```bash
npx dephealth --init-config my-config.js
```

The generated file will look like this:

```javascript
module.exports = {
  // API tokens (can use environment variables)
  tokens: {
    github: process.env.GITHUB_TOKEN,
    gitlab: process.env.GITLAB_TOKEN,
    bitbucket: process.env.BITBUCKET_TOKEN
  },

  // Customize scoring algorithm (all fields are optional)
  scoring: {
    weights: {
      lag: 0.25,        // Version lag penalty
      vuln: 0.35,       // Vulnerability penalty
      health: 0.25,     // Community health
      activity: 0.15    // Recent activity
    },
    constants: {
      maxStars: 100000,
      minStarsForIssueRatio: 10,
      maxIssueRatio: 0.5,
      activityThresholdDays: 365
    },
    penalties: {
      majorUpdate: 0.5,
      minorUpdate: 0.1,
      patchUpdate: 0.02,
      criticalVuln: 0.6,
      highVuln: 0.3,
      moderateVuln: 0.1
    }
  }
}
```

### CLI Options

- `--github-token <token>`: GitHub API token
- `--gitlab-token <token>`: GitLab API token
- `--bitbucket-token <token>`: Bitbucket API token
- `--config <file>, -c <file>`: Config file path (JavaScript/JSON)
- `--init-config [filename]`: Generate configuration template file
- `--help, -h`: Show help

### Configuration Precedence

1. **CLI arguments** (highest priority)
2. **Config file** (if specified with `--config`)
3. **Environment variables**
4. **Default values**

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

### Customizing Scoring

You can customize every aspect of the scoring algorithm:

```javascript
// config.js - Security-focused configuration
module.exports = {
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
```

## API Reference

### `analyzeDependencies(): Promise<DependencyResult[]>`

Analyzes all dependencies in the current project and returns detailed information about each package.

### `displayResults(results: DependencyResult[]): void`

Displays the analysis results in a formatted table.

### `getConfig(): Promise<Config>`

Gets the configuration with proper precedence (CLI args > config file > env vars > defaults).

### Scoring Functions

```typescript
import { 
  calcFinalScore, 
  calcLagScore, 
  calcVulnScore, 
  calcCommunityScore, 
  calcActivityScore,
  debugScore,
  setScoringConfig,
  getScoringConfig,
  resetScoringConfig,
  DEFAULT_SCORING_CONFIG
} from 'dephealth';

// Configure scoring globally
setScoringConfig({
  weights: { lag: 0.20, vuln: 0.40, health: 0.25, activity: 0.15 }
});

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
  configFile?: string;
}

interface AppConfig {
  tokens?: {
    github?: string;
    gitlab?: string;
    bitbucket?: string;
  };
  scoring?: Partial<ScoringConfig>;
}

interface ScoringConfig {
  weights: {
    lag: number;
    vuln: number;
    health: number;
    activity: number;
  };
  constants: {
    maxStars: number;
    minStarsForIssueRatio: number;
    maxIssueRatio: number;
    activityThresholdDays: number;
  };
  penalties: {
    majorUpdate: number;
    minorUpdate: number;
    patchUpdate: number;
    criticalVuln: number;
    highVuln: number;
    moderateVuln: number;
  };
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