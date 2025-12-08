/**
 * Script to analyze CategoryFieldsNew.tsx and generate a migration plan
 * This helps identify all categories and subcategories that need modules
 */

import * as fs from 'fs'
import * as path from 'path'

const categoryFieldsPath = path.join(process.cwd(), 'src/components/forms/CategoryFieldsNew.tsx')
const content = fs.readFileSync(categoryFieldsPath, 'utf-8')

// Extract all category checks
const categoryMatches = content.matchAll(/if \(category === ['"]([^'"]+)['"]\)/g)
const categories = Array.from(categoryMatches).map(m => m[1])

// Extract all subcategory checks
const subcategoryMatches = content.matchAll(/subcategory === ['"]([^'"]+)['"]/g)
const subcategories = Array.from(subcategoryMatches).map(m => m[1])

// Extract subcategory includes
const subcategoryIncludes = content.matchAll(/subcategory\?\.includes\(['"]([^'"]+)['"]\)/g)
const subcategoryIncludesList = Array.from(subcategoryIncludes).map(m => m[1])

console.log('=== CATEGORIES ===')
console.log(Array.from(new Set(categories)).sort().join('\n'))
console.log('\n=== SUBCATEGORIES (exact matches) ===')
console.log(Array.from(new Set(subcategories)).sort().join('\n'))
console.log('\n=== SUBCATEGORIES (includes) ===')
console.log(Array.from(new Set(subcategoryIncludesList)).sort().join('\n'))

