# DepHealth 🔍

A lightweight dependency health analyzer for Node.js projects that focuses on security vulnerabilities and outdated packages.

## ✨ Features

- 🔒 **Security First**: Analyzes npm audit results for vulnerabilities
- 📦 **Version Tracking**: Detects outdated packages using semantic versioning
- 🎯 **Smart Scoring**: Objective health score based on vulnerabilities and version lag
- 🎨 **Beautiful Output**: Colored console tables with emojis and clear recommendations
- ⚡ **Fast & Lightweight**: No external API calls or tokens required
- 🔧 **Zero Configuration**: Works out of the box with any Node.js project

## 🚀 Quick Start

```bash
# Install globally
npm install -g dephealth

# Or use npx (recommended)
npx dephealth

# Analyze any project
cd your-project
npx dephealth
```

## 📊 What It Analyzes

### 🔒 Security Vulnerabilities
- **Critical vulnerabilities**: Major security risks
- **High vulnerabilities**: Significant security concerns  
- **Moderate vulnerabilities**: Minor security issues

### 📦 Version Health
- **Major updates**: Breaking changes (highest penalty)
- **Minor updates**: New features (moderate penalty)
- **Patch updates**: Bug fixes (minimal penalty)

### 🎯 Health Score (0-100)
- **80-100**: Excellent - Your project is in great shape!
- **60-79**: Good - Some improvements recommended
- **0-59**: Needs attention - Consider reviewing dependencies

## 📋 Output Example

```
📊 Dependency Health Analysis
┌─────────────┬──────────┬─────────┬──────────┬─────────────────┬───────┐
│ Package     │ Current  │ Latest  │ Outdated │ Vulnerabilities │ Score │
├─────────────┼──────────┼─────────┼──────────┼─────────────────┼───────┤
│ express     │ 4.18.2   │ 4.18.2  │ No       │ 0               │ 100   │
│ lodash      │ 4.17.21  │ 4.17.21 │ No       │ 0               │ 100   │
│ request     │ 2.88.2   │ 2.88.2  │ No       │ 3               │ 40    │
│ outdated    │ 1.0.0    │ 2.0.0   │ Yes      │ 0               │ 50    │
└─────────────┴──────────┴─────────┴──────────┴─────────────────┴───────┘

📈 Summary:
   • Total dependencies: 4
   • Outdated packages: 1
   • Packages with vulnerabilities: 1
   • Average health score: 72

🔄 Recommendations:
   • Consider updating 1 outdated package
   • Run npm audit fix to address 1 package with vulnerabilities

🏥 Overall Health:
   Good (72/100) - Some improvements recommended
```

## 🛠️ Usage

### Basic Usage
```bash
npx dephealth
```

### Help
```bash
npx dephealth --help
```

## 🎯 Scoring Algorithm

The health score is calculated using a weighted combination of:

### Version Lag (50% weight)
- **Major updates**: Exponential penalty for breaking changes
- **Minor updates**: Linear penalty for new features  
- **Patch updates**: Minimal penalty for bug fixes

### Vulnerabilities (50% weight)
- **Critical**: Exponential penalty (highest impact)
- **High**: Linear penalty (significant impact)
- **Moderate**: Minimal penalty (low impact)

## 🔧 Configuration

The tool works out of the box with sensible defaults. No configuration required!

### Default Scoring Weights
```javascript
{
  weights: {
    lag: 0.5,    // Version lag penalty
    vuln: 0.5    // Vulnerability penalty
  },
  penalties: {
    majorUpdate: 0.5,      // Major version penalty
    minorUpdate: 0.1,      // Minor version penalty  
    patchUpdate: 0.02,     // Patch version penalty
    criticalVuln: 0.6,     // Critical vulnerability penalty
    highVuln: 0.3,         // High vulnerability penalty
    moderateVuln: 0.1      // Moderate vulnerability penalty
  }
}
```

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