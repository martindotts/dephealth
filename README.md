# DepHealth 🔍

A comprehensive dependency health analyzer for Node.js projects that provides detailed insights into package health, security, and maintenance status.

## ✨ Features

- 🔒 **Security Analysis**: Comprehensive vulnerability assessment with severity weighting
- 📦 **Version Tracking**: Detects outdated packages using semantic versioning
- 🌐 **Repository Analysis**: GitHub and GitLab integration for open issues count
- 📊 **Multi-Metric Scoring**: Evaluates maturity, update frequency, deprecation, dependency health, downloads, and more
- 🎨 **Professional Output**: Beautiful colored console tables with detailed metrics
- ⚡ **Concurrent Processing**: Up to 10 parallel package analyses for better performance
- 🔧 **Optional Authentication**: Support for GitHub and GitLab tokens for enhanced API access
- 📈 **Boosted Scoring**: Customizable score boosters for different metrics

## 🚀 Quick Start

```bash
# Install globally
npm install -g dephealth

# Or use npx (recommended)
npx dephealth

# Analyze any project
cd your-project
npx dephealth

# With authentication tokens (optional)
npx dephealth --github-token YOUR_GITHUB_TOKEN --gitlab-token YOUR_GITLAB_TOKEN
```

## 📊 What It Analyzes

### 🔒 Security Vulnerabilities
- **Critical vulnerabilities**: Weighted penalty of 0.6 each
- **High vulnerabilities**: Weighted penalty of 0.4 each
- **Moderate vulnerabilities**: Weighted penalty of 0.2 each
- **Low vulnerabilities**: Weighted penalty of 0.1 each
- **Total penalty**: Capped at 1.0 (score = 1 - total penalty)

### 📦 Version Health
- **Major updates**: Exponential penalty for breaking changes
- **Minor updates**: Linear penalty for new features  
- **Patch updates**: Minimal penalty for bug fixes

### 🌐 Repository Metrics
- **Maturity**: Based on repository age (years active, capped at 10) and release cadence (releases per year, capped at 4)
- **Update Frequency**: Releases per year (0 if ≤1/year, 1 if ≥12/year)
- **Deprecation**: 0 if deprecated, 1 if not deprecated
- **Dependency Health**: Runtime deps (ideal ≤5, poor ≥40) and dev deps (ideal ≤10, poor ≥80)
- **Download Count**: Log-scaled popularity based on weekly downloads (0 to 1M+)
- **Issue Count**: Open issues normalized by popularity (issues per 10k downloads)

### 🎯 Health Score (0-1)
- **0.8-1.0**: Excellent - Your project is in great shape!
- **0.6-0.79**: Good - Some improvements recommended
- **0.0-0.59**: Needs attention - Consider reviewing dependencies

## 📋 Output Example

```
📋 (1/4) Analyzing packages...
📋 (2/4) Analyzing packages...
📋 (3/4) Analyzing packages...
📋 (4/4) Analyzing packages...
✅ Analysis complete! Analyzed 4 packages

📊 DEPENDENCY HEALTH REPORT
================================================================================
┌─────────────┬──────────┬─────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ Package     │ Current  │ Latest  │ Maturity │ Updates  │ Deprec.  │Dep.Health│ Downloads│ Vuln.    │ Issues   │
├─────────────┼──────────┼─────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ express     │ 4.18.2   │ 4.18.2  │ 0.95     │ 0.90     │ 1.00     │ 0.85     │ 0.98     │ 1.00     │ 0.92     │
│ lodash      │ 4.17.21  │ 4.17.21 │ 0.98     │ 0.85     │ 1.00     │ 0.90     │ 0.99     │ 1.00     │ 0.88     │
│ request     │ 2.88.2   │ 2.88.2  │ 0.80     │ 0.70     │ 0.00     │ 0.60     │ 0.85     │ 0.40     │ 0.75     │
│ outdated    │ 1.0.0    │ 2.0.0   │ 0.60     │ 0.50     │ 1.00     │ 0.70     │ 0.30     │ 1.00     │ 0.65     │
└─────────────┴──────────┴─────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

## 🛠️ Usage

### Basic Usage
```bash
npx dephealth
```

### With Authentication Tokens
```bash
# GitHub token only
npx dephealth --github-token YOUR_GITHUB_TOKEN

# GitLab token only
npx dephealth --gitlab-token YOUR_GITLAB_TOKEN

# Both tokens
npx dephealth --github-token YOUR_GITHUB_TOKEN --gitlab-token YOUR_GITLAB_TOKEN
```

### Configuration Files
```bash
# Create default configuration file
npx dephealth --init-config

# Create custom configuration file
npx dephealth --init-config myconfig.json

# Use configuration file for boosters
npx dephealth --config dephealth-config.json

# Use config file with CLI tokens
npx dephealth --config dephealth-config.json --github-token YOUR_TOKEN
```

### Help
```bash
npx dephealth --help
```

## 🎯 Scoring Algorithm

The health score is calculated using multiple metrics, each returning a value between 0 and 1:

### 📦 Version Lag Score
- **Major updates**: Exponential penalty for breaking changes
- **Minor updates**: Linear penalty for new features  
- **Patch updates**: Minimal penalty for bug fixes

### 🔒 Vulnerability Score
- **Critical**: Weighted penalty of 0.6 each
- **High**: Weighted penalty of 0.4 each
- **Moderate**: Weighted penalty of 0.2 each
- **Low**: Weighted penalty of 0.1 each
- **Total penalty**: Capped at 1.0 (score = 1 - total penalty)

### 🌐 Repository Metrics
- **Maturity**: Age (years active, capped at 10) × 0.6 + Release rate (releases/year, capped at 4) × 0.4
- **Update Frequency**: (releasesPerYear - 1) / (12 - 1), clamped to 0-1
- **Deprecation**: 0 if deprecated, 1 if not deprecated
- **Dependency Health**: Runtime deps (log-scaled, ideal ≤5, poor ≥40) × 0.7 + Dev deps (log-scaled, ideal ≤10, poor ≥80) × 0.3
- **Downloads**: log10(weeklyDownloads) / 6, capped at 1
- **Issues**: Normalized by popularity (issues per 10k downloads), log-scaled

### 📈 Score Boosters
Each metric can be boosted using multipliers:
- **Booster > 1.0**: Emphasizes the metric (higher scores become more important)
- **Booster = 1.0**: No change (default)
- **Booster < 1.0**: De-emphasizes the metric (lower scores become less important)

**Example**: A vulnerability booster of 5.0 means vulnerabilities have 5x more impact on the final score.

## 🔧 Configuration

The tool works out of the box with sensible defaults. You can customize boosters using configuration files.

### Configuration File Format

Create a configuration file using `--init-config`:

```json
{
  "boosters": {
    "maturity": 2,
    "updateFrequency": 1,
    "deprecation": 4,
    "dependency": 1,
    "download": 1,
    "vulnerability": 2,
    "issues": 1
  }
}
```

**Note**: Configuration files are only for boosters. Tokens must be provided via CLI arguments.

### Authentication Tokens

#### GitHub Token
- Create a personal access token at: https://github.com/settings/tokens
- Required scopes: `public_repo` (for public repositories)
- Helps avoid rate limiting and access private repositories

#### GitLab Token
- Create a personal access token at: https://gitlab.com/-/profile/personal_access_tokens
- Required scopes: `read_api`
- Helps avoid rate limiting and access private repositories

### Booster Configuration

Each metric can be customized with boosters:
- **maturity**: Repository age and activity (default: 2.0)
- **updateFrequency**: How often packages are updated (default: 1.0)
- **deprecation**: Penalty for deprecated packages (default: 4.0)
- **dependency**: Health of package dependencies (default: 1.0)
- **download**: Popularity based on downloads (default: 1.0)
- **vulnerability**: Security vulnerability impact (default: 2.0)
- **issues**: Open issues impact (default: 1.0)

## 📦 Installation

### Global Installation
```bash
npm install -g dephealth
```

### Local Development
```bash
git clone https://github.com/your-username/dephealth.git
cd dephealth
npm install
npm run build
npm start
```

## 🚀 Performance Features

- **Concurrent Processing**: Up to 10 parallel package analyses
- **Progress Tracking**: Real-time progress display with package count
- **Error Recovery**: Graceful handling of API failures
- **Rate Limit Handling**: Automatic handling of API rate limits

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with TypeScript for type safety
- Uses `semver` for semantic versioning analysis
- Powered by `npm audit` and `npm outdated`
- Beautiful output with `chalk` and `console-table-printer`
- Concurrent processing with `p-limit`
- GitHub and GitLab API integration 