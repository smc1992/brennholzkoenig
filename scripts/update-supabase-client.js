#!/usr/bin/env node

/**
 * This script updates all components to use the centralized Supabase client
 * from lib/supabase.ts instead of creating individual client instances.
 * 
 * Usage: node update-supabase-client.js
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Patterns to find and replace
const importPattern = /import\s+{\s*createClient\s*}\s+from\s+['"]@supabase\/supabase-js['"];?/;
const importReplacement = `import { supabase } from '@/lib/supabase';`;

const clientPattern = /const\s+supabase\s*=\s*createClient\(\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL!?,\s*process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY!?(,\s*{[^}]*})?\s*\);?/;
const clientReplacement = `// Using the centralized Supabase client from lib/supabase.ts`;

// Directories to process
const directories = [
  'app/admin',
  'app/blog',
  'app/checkout',
  'app/kontakt',
  'app/konto',
  'app/warenkorb',
  'components'
];

// File extensions to process
const extensions = ['.tsx', '.ts', '.jsx', '.js'];

// Function to recursively get all files in a directory
async function getFiles(dir) {
  const dirents = fs.readdirSync(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  }));
  return Array.prototype.concat(...files);
}

// Function to update a file
async function updateFile(filePath) {
  try {
    // Check if file has the right extension
    if (!extensions.some(ext => filePath.endsWith(ext))) {
      return false;
    }

    // Read file content
    const content = await readFile(filePath, 'utf8');
    
    // Check if file contains the patterns
    const hasImport = importPattern.test(content);
    const hasClient = clientPattern.test(content);
    
    if (!hasImport && !hasClient) {
      return false;
    }
    
    // Replace patterns
    let newContent = content;
    if (hasImport) {
      newContent = newContent.replace(importPattern, importReplacement);
    }
    if (hasClient) {
      newContent = newContent.replace(clientPattern, clientReplacement);
    }
    
    // Write updated content
    await writeFile(filePath, newContent, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

// Main function
async function main() {
  const baseDir = process.cwd();
  let updatedFiles = 0;
  
  for (const dir of directories) {
    const dirPath = path.join(baseDir, dir);
    
    if (!fs.existsSync(dirPath)) {
      console.log(`Directory not found: ${dirPath}`);
      continue;
    }
    
    console.log(`Processing directory: ${dirPath}`);
    const files = await getFiles(dirPath);
    
    for (const file of files) {
      const updated = await updateFile(file);
      if (updated) {
        updatedFiles++;
        console.log(`Updated: ${file}`);
      }
    }
  }
  
  console.log(`\nTotal files updated: ${updatedFiles}`);
}

main().catch(console.error);
