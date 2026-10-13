import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeCSV,groupCSV,resolveWorkspace,writeFile,readFile} from '../workspace.js';

test('prevents traversing outside workspace',()=>{
  assert.throws(()=>resolveWorkspace('../server/.env'),/limited/);
  assert.throws(()=>resolveWorkspace('/etc/passwd'),/Invalid/);
  assert.throws(()=>resolveWorkspace('data/example.csv','output'),/limited/);
});
test('analyzes sample CSV with actual totals',async()=>{
  const stats=await analyzeCSV('data/sales_sample.csv');
  assert.equal(stats.rowCount,12);
  assert.equal(stats.numericSummary.sales_myr.sum,1176700);
  assert.equal(stats.numericSummary.agents.sum,302);
});
test('write file only under output',async()=>{
  await assert.rejects(writeFile('../server/malicious.js','oops'),/limited/);
  await assert.rejects(writeFile('script.exe','bad'),/Unsupported/);
});

test('groups CSV sales accurately by region',async()=>{
  const r=await groupCSV('data/sales_sample.csv',['region'],'sales_myr');
  assert.equal(r.totalGroups,4);
  assert.equal(r.rows.find(x=>x.groups.region==='Central').sum,404000);
  assert.equal(r.rows.reduce((sum,x)=>sum+x.sum,0),1176700);
});
