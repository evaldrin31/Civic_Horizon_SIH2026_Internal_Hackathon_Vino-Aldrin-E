const fs = require('fs');
const glob = require('fs').readdirSync;

function findFiles(dir, ext) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(findFiles(file, ext));
    } else if (file.endsWith(ext)) {
      results.push(file);
    }
  });
  return results;
}

const files = findFiles('src', '.tsx');

const replacements = {
  'text-on-surface-variant': 'text-muted-foreground',
  'text-on-surface': 'text-foreground',
  'bg-surface-variant': 'bg-muted',
  'bg-surface': 'bg-background',
  'text-outline': 'text-muted-foreground'
};

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(key.replace(/\//g, '\\\\/'), 'g');
    content = content.replace(regex, value);
  }
  
  // also fix some dashboard specific hardcoded warning/critical colors that might be broken in dark mode
  // e.g., bg-red-50 text-red-700
  content = content.replace(/bg-red-50 text-red-700 border-red-200/g, 'bg-destructive/10 text-destructive border-destructive/20');
  content = content.replace(/bg-amber-50 text-amber-700 border-amber-200/g, 'bg-orange-500/10 text-orange-500 border-orange-500/20');
  content = content.replace(/bg-green-50 text-green-700 border-green-200/g, 'bg-green-500/10 text-green-500 border-green-500/20');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
});
