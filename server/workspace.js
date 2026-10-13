import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../workspace');
const EXTENSIONS = new Set(['.md','.txt','.json','.js','.jsx','.ts','.tsx','.css','.html','.py','.sql','.csv','.svg','.yml','.yaml']);

export function resolveWorkspace(relative, area = 'any') {
  if (typeof relative !== 'string' || !relative.trim() || relative.includes('\0') || path.isAbsolute(relative)) throw new Error('Invalid relative file path');
  const normalized = relative.replaceAll('\\','/');
  const full = path.resolve(ROOT, normalized);
  const base = area === 'any' ? ROOT : path.resolve(ROOT, area);
  if (!full.startsWith(base + path.sep)) throw new Error(`Access limited to workspace/${area === 'any' ? '' : area}`);
  return full;
}
export function relativePath(full) { return path.relative(ROOT, full).replaceAll(path.sep, '/'); }
export async function listWorkspaceFiles() {
  const results = [];
  async function visit(folder) {
    for (const entry of await fs.readdir(path.join(ROOT, folder), { withFileTypes:true })) {
      if (entry.name.startsWith('.')) continue;
      const relative = folder + '/' + entry.name;
      if (entry.isDirectory()) await visit(relative);
      else if (entry.isFile()) {
        const st = await fs.stat(path.join(ROOT, relative));
        results.push({path:relative, bytes:st.size, updatedAt:st.mtime.toISOString()});
      }
    }
  }
  for (const folder of ['data','output']) await visit(folder);
  return results.sort((a,b)=> b.updatedAt.localeCompare(a.updatedAt)).slice(0,200);
}
export async function readFile(filePath) {
  const full = resolveWorkspace(filePath);
  const stat = await fs.stat(full);
  if (!stat.isFile() || stat.size > 180000) throw new Error('Not a file, or over 180 KB');
  return await fs.readFile(full, 'utf8');
}
export async function writeFile(filePath, content) {
  const normalized = filePath.startsWith('output/') ? filePath : `output/${filePath}`;
  const full = resolveWorkspace(normalized, 'output');
  if (!EXTENSIONS.has(path.extname(full).toLowerCase())) throw new Error('Unsupported extension');
  if (typeof content !== 'string' || Buffer.byteLength(content, 'utf8') > 180000) throw new Error('Content must be text and less than 180 KB');
  await fs.mkdir(path.dirname(full), { recursive:true });
  await fs.writeFile(full, content, 'utf8');
  return {path:relativePath(full),bytes:Buffer.byteLength(content,'utf8')};
}
export async function analyzeCSV(filePath) {
  if (!filePath.endsWith('.csv')) throw new Error('Only .csv supported');
  const str = await readFile(filePath);
  const rows = parse(str, {columns: true, skip_empty_lines:true, bom:true, relax_quotes:true});
  const cols = rows.length ? Object.keys(rows[0]) : [];
  const numbers = {};
  for (const name of cols) {
    const arr = rows.map(r => Number(String(r[name] ?? '').replaceAll(',','').replaceAll('RM','').trim()))
      .filter((n,i) => String(rows[i][name] ?? '').trim() !== '' && Number.isFinite(n));
    if (arr.length && arr.length >= Math.max(1, rows.length * 0.7)) {
      numbers[name] = {count:arr.length,sum:arr.reduce((a,b)=>a+b,0),average:arr.reduce((a,b)=>a+b,0)/arr.length,min:Math.min(...arr),max:Math.max(...arr)};
    }
  }
  const categories = {};
  for (const name of cols.filter(c => !numbers[c])) {
    const counts = {};
    for (const row of rows) { const v = String(row[name] || '(blank)'); counts[v] = (counts[v] || 0) + 1; }
    categories[name] = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([value,count])=>({value,count}));
  }
  return {file:filePath,rowCount:rows.length,columns:cols,numericSummary:numbers,categoryCounts:categories,preview:rows.slice(0,30)};
}

// Deterministic totals by dimensions: do not ask a small LLM to add CSV rows manually.
export async function groupCSV(filePath, groupBy, sumColumn) {
  if (!filePath?.toLowerCase().endsWith('.csv')) throw new Error('Only .csv supported');
  if (!Array.isArray(groupBy) || groupBy.length<1 || groupBy.length>2 || !groupBy.every(x=>typeof x==='string')) throw new Error('Choose one or two group columns');
  const rows=parse(await readFile(filePath), {columns:true,skip_empty_lines:true,bom:true,relax_quotes:true});
  const columns=rows.length ? Object.keys(rows[0]) : [];
  if (![...groupBy,sumColumn].every(x=>columns.includes(x))) throw new Error(`Column not found. Available: ${columns.join(', ')}`);
  const sums=new Map();
  for (const row of rows) {
    const keys=groupBy.map(col=>String(row[col]??'').trim()||'(blank)');
    const id=JSON.stringify(keys);
    const n=Number(String(row[sumColumn]??'').replace(/RM|,/g,'').trim());
    if (!Number.isFinite(n) || String(row[sumColumn]??'').trim()==='') continue;
    const current=sums.get(id)||{groups:Object.fromEntries(groupBy.map((name,i)=>[name,keys[i]])),count:0,sum:0};
    current.count++;current.sum+=n;sums.set(id,current);
  }
  return {file:filePath,groupBy,sumColumn,totalGroups:sums.size,rows:[...sums.values()].sort((a,b)=>b.sum-a.sum).slice(0,100)};
}
