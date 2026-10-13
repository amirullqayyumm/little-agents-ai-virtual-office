import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import fs from 'node:fs/promises';
import path from 'node:path';
import { runAgent, ollamaHealth } from './agent.js';
import { ROOT, listWorkspaceFiles, resolveWorkspace, readFile } from './workspace.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({limit:'32kb'}));
const identity = {
  developer:{id:'developer',name:'Pixel',title:'Developer Agent',emoji:'💻',status:'idle'},
  researcher:{id:'researcher',name:'Nova',title:'Research Agent',emoji:'🔎',status:'idle'},
  analyst:{id:'analyst',name:'Byte',title:'Data Agent',emoji:'📊',status:'idle'}
};
const states = Object.fromEntries(Object.entries(identity).map(([id,obj])=>[id,{...obj,task:'',result:null,logs:[],updatedAt:new Date().toISOString()}]));
let nextTaskId = 0;
function event(id,status,message) {
  const agent=states[id];
  agent.status=status;
  agent.updatedAt=new Date().toISOString();
  agent.logs=[{time:agent.updatedAt,message},...agent.logs].slice(0,12);
}
app.get('/api/health',async (_req,res)=> res.json({ok:true,provider:'ollama',model:process.env.OLLAMA_MODEL || 'qwen2.5:3b',...await ollamaHealth()}));
app.get('/api/agents',(_req,res)=>res.json(Object.values(states)));
app.get('/api/files',async (_req,res)=>{try {res.json(await listWorkspaceFiles());}catch(err){res.status(500).json({error:err.message});}});
app.get('/api/download',async (req,res)=>{
  try {
    const full=resolveWorkspace(String(req.query.path || ''),'output');
    if (!(await fs.stat(full)).isFile()) throw new Error('Not a file');
    res.download(full,path.basename(full));
  } catch(err) {res.status(400).json({error:err.message});}
});
app.get('/api/preview',async (req,res)=>{
  try {
    const name=String(req.query.path || '');
    if (!name.startsWith('output/')) throw new Error('Preview available only for output files');
    res.json({path:name,content:await readFile(name)});
  } catch(err) {res.status(400).json({error:err.message});}
});
app.post('/api/tasks',async (req,res)=>{
  const {agentId,prompt} = req.body || {};
  if (!states[agentId]) return res.status(400).json({error:'Choose a valid agent'});
  if (typeof prompt!=='string' || prompt.trim().length<5 || prompt.length>6000) return res.status(400).json({error:'Task needs 5–6000 characters'});
  const health=await ollamaHealth();
  if (!health.ollamaOnline) return res.status(400).json({error:'Ollama is offline. Open Ollama on Windows and try again.'});
  if (!health.modelInstalled) return res.status(400).json({error:'Model missing. In a terminal run: ollama pull qwen2.5:3b'});
  if (Object.values(states).some(x=>['thinking','working'].includes(x.status))) return res.status(409).json({error:'8GB mode: only one agent can work at a time. Wait for the current mission to finish.'});
  if (['thinking','working'].includes(states[agentId].status)) return res.status(409).json({error:'This agent is already working'});
  const taskId=++nextTaskId;
  states[agentId].task=prompt.trim();
  states[agentId].result=null;
  states[agentId].logs=[];
  event(agentId,'thinking','Task received — connecting to local Ollama');
  res.status(202).json({taskId,agentId,status:'thinking'});
  (async()=>{
    try {
      const result=await runAgent({agentId,task:prompt.trim(),onEvent:(status,msg)=>event(agentId,status,msg)});
      states[agentId].result=result;
      event(agentId,'done',`Finished — ${result.files.length} file(s) saved`);
    }catch(err){
      states[agentId].result={text:err.message,files:[],sources:[]};
      event(agentId,'error','Task failed — see the result panel');
      console.error(`[${agentId}]`,err.message);
    }
  })();
});
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:1024*1024,files:1},fileFilter:(_req,file,cb)=>cb(null,path.extname(file.originalname).toLowerCase()==='.csv')});
app.post('/api/upload',upload.single('file'),async(req,res)=>{
  try {
    if (!req.file) return res.status(400).json({error:'Choose a .csv file (max 1MB)'});
    const safe=path.basename(req.file.originalname).replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,80);
    const name=`data/${Date.now()}-${safe}`;
    const full=resolveWorkspace(name,'data');
    await fs.mkdir(path.dirname(full),{recursive:true});
    await fs.writeFile(full,req.file.buffer);
    res.json({path:name,bytes:req.file.size});
  }catch(err){res.status(400).json({error:err.message});}
});
app.use((err,_req,res,_next)=> res.status(400).json({error:err.message || 'Request failed'}));
const port=Number(process.env.PORT) || 5050;
app.listen(port,'127.0.0.1',()=>console.log(`🚀 AI Office API on http://127.0.0.1:${port} — Workspace: ${ROOT}`));
