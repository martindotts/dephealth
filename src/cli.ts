#!/usr/bin/env node

import { analyzeDependencies, displayResults } from './analyzer'

async function main() {
  try {
    const results = await analyzeDependencies()
    displayResults(results)
  } catch (err) {
    console.error('Error during analysis:', err)
    process.exit(1)
  }
}

main() 