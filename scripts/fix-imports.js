import fs from 'fs';
import path from 'path';

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.js') || p.endsWith('.jsx')) {
      let content = fs.readFileSync(p, 'utf-8');
      const replaced = content
        .replace(/\.tsx(['"])/g, '$1')
        .replace(/\.ts(['"])/g, '$1');
      if (replaced !== content) {
        fs.writeFileSync(p, replaced, 'utf-8');
        console.log('Fixed imports in:', p);
      }
    }
  }
}

walk(path.resolve('components/editor'));
console.log('Import fixing complete.');
