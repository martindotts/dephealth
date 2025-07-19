# dephealth

A comprehensive dependency health analyzer for Node.js projects that checks for outdated packages, security vulnerabilities, and repository health metrics.

## Features

- 🔍 **Dependency Analysis**: Check for outdated packages and their latest versions
- 🛡️ **Security Audit**: Identify packages with known vulnerabilities
- 📊 **Repository Health**: Analyze GitHub, GitLab, and Bitbucket repository metrics
- 🔐 **Multi-Platform Support**: Works with GitHub, GitLab, and Bitbucket APIs
- 📈 **Interactive Mode**: Easy token input for API authentication
- 🎯 **Flexible Configuration**: Support for CLI args, config files, and environment variables

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
# Basic usage (interactive token prompt)
npx dephealth

# Provide tokens explicitly
npx dephealth --github-token YOUR_TOKEN

# Skip tokens entirely (rate-limited requests)
npx dephealth --no-tokens

# Using config file
npx dephealth --config config.json
```

### Programmatic Usage

```typescript
import { analyzeDependencies, displayResults } from 'lib-health-check';

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
- `--interactive, -i`: Interactive mode to enter tokens
- `--config <file>, -c <file>`: Config file path (JSON)
- `--help, -h`: Show help

## API Reference

### `analyzeDependencies(): Promise<DependencyResult[]>`

Analyzes all dependencies in the current project and returns detailed information about each package.

### `displayResults(results: DependencyResult[]): void`

Displays the analysis results in a formatted table.

### `getConfig(): Promise<Config>`

Gets the configuration with proper precedence (CLI args > config file > env vars > interactive).

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