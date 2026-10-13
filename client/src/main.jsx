import React,{useCallback,useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import { Activity, ArrowRight, ArrowUpRight, Bot, Check, ChevronRight, CircleAlert, Clock3, Code2, Database, Download, ExternalLink, FileText, FolderOpen, Github, Globe2, Play, Search, Send, ShieldCheck, Sparkles, Terminal, Upload, X } from 'lucide-react';
import Office from './Office.jsx';
import './style.css';

const initial=[
  {id:'developer',name:'Pixel',title:'Developer Agent',status:'idle',task:'',logs:[],result:null},
  {id:'researcher',name:'Nova',title:'Research Agent',status:'idle',task:'',logs:[],result:null},
  {id:'analyst',name:'Byte',title:'Data Agent',status:'idle',task:'',logs:[],result:null}
];
const examples={
  developer:'Build a complete responsive to-do list web app using HTML, CSS and JavaScript. Save all source files and a README explaining how to use them.',
  researcher:'Research the history of artificial intelligence using Wikipedia search. Summarise findings, include real Wikipedia source links, and save a Markdown research brief.',
  analyst:'Analyse data/sales_sample.csv. Calculate total sales by region and month, identify the highest performing region, and save a detailed Markdown report with exact figures.'
};
const agentsMeta={
  developer:{number:'01',accent:'#a29bfe',color:'violet',icon:Code2,skill:'BUILD & CODE',description:'Writes real code and saves files'},
  researcher:{number:'02',accent:'#77dcf3',color:'cyan',icon:Search,skill:'RESEARCH & INSIGHT',description:'Researches Wikipedia & local documents'},
  analyst:{number:'03',accent:'#f6cb7f',color:'gold',icon:Database,skill:'DATA & REPORTS',description:'Analyses actual CSV datasets'}
};
const statusNames={idle:'Available',thinking:'Thinking',working:'Working',done:'Completed',error:'Error'};
async function request(url,opts){const r=await fetch(url,opts);const json=await r.json();if(!r.ok)throw new Error(json.error||'Request failed');return json;}
function App(){
  const [agents,setAgents]=useState(initial),[selected,setSelected]=useState('developer');
  const [prompt,setPrompt]=useState(examples.developer);
  const [health,setHealth]=useState(null),[files,setFiles]=useState([]);
  const [notice,setNotice]=useState(''),[preview,setPreview]=useState(null),[uploading,setUploading]=useState(false);
  const [connection,setConnection]=useState('Connecting…');
  const selectedAgent=agents.find(a=>a.id===selected)||initial[0];
  const meta=agentsMeta[selected],Icon=meta.icon;
  const busy=['thinking','working'].includes(selectedAgent.status);
  const anyBusy=agents.some(a=>['thinking','working'].includes(a.status));
  const selectAgent=useCallback(id=>{setSelected(id);setPrompt(examples[id]);setNotice('');},[]);
  const refresh=useCallback(async()=>{
    try {
      const [a,f,h]=await Promise.all([request('/api/agents'),request('/api/files'),request('/api/health')]);
      setAgents(a);setFiles(f);setHealth(h);setConnection('Online');
    }catch{setConnection('Offline');}
  },[]);
  useEffect(()=>{refresh();const t=setInterval(refresh,1500);return ()=>clearInterval(t);},[refresh]);
  async function send(){
    if(anyBusy||prompt.trim().length<5)return;
    setNotice('');
    try{
      await request('/api/tasks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({agentId:selected,prompt})});
      setNotice(`${selectedAgent.name} accepted your task. Watch the office!`);
      refresh();
    }catch(e){setNotice('⚠ '+e.message);}
  }
  async function uploadFile(e){
    const file=e.target.files?.[0];if(!file)return;
    setUploading(true);setNotice('');
    try{
      const body=new FormData();body.append('file',file);
      const data=await request('/api/upload',{method:'POST',body});
      setNotice(`Uploaded successfully: ${data.path}`);
      selectAgent('analyst');setPrompt(`Analyse ${data.path} accurately. Summarise important figures, trends and useful insights. Save a professional Markdown report.`);
      refresh();
    }catch(err){setNotice('⚠ '+err.message);}finally{setUploading(false);e.target.value='';}
  }
  async function openPreview(file){
    try{setPreview({...file,loading:true});const out=await request('/api/preview?path='+encodeURIComponent(file.path));setPreview(out);}catch(err){setNotice('⚠ '+err.message);setPreview(null);}
  }
  const outputFiles=files.filter(x=>x.path.startsWith('output/'));
  const activity=agents.flatMap(a=>a.logs.map(l=>({...l,agent:a.name,id:a.id}))).sort((a,b)=>b.time.localeCompare(a.time)).slice(0,9);
  return <div className="app-shell">
    <header className="app-header">
      <div className="brand"><div className="brand-symbol">✳</div><div><strong>little<span>agents</span></strong><small>YOUR AI VIRTUAL OFFICE</small></div></div>
      <div className="header-center"><span className="header-link"><Terminal size={14}/> LOCAL PROJECT</span><span className="header-divider"/><span className="header-link">REACT + PHASER + OLLAMA</span></div>
      <div className={`connection-pill ${connection==='Online'?'connected':'offline'}`}><span className="ping"/>{connection}</div>
    </header>
    <main>
      <section className="intro"><div className="eyebrow"><Sparkles size={13}/> MEET YOUR DIGITAL TEAM <span className="small-line"/></div><h1>Big work. <em>Little agents.</em></h1><p>A working AI team in a tiny pixel office. Give them a mission, watch them move, and collect real results.</p></section>
      {health && (!health.ollamaOnline || !health.modelInstalled) && <div className="key-warning"><CircleAlert size={18}/><div><strong>{!health.ollamaOnline?'Ollama is not running':'AI model not downloaded'}</strong><span>{!health.ollamaOnline?'Open the Ollama app on Windows. Then refresh this page.':'Open VS Code terminal and run: ollama pull qwen2.5:3b'}</span></div></div>}
      <div className="dashboard-layout">
        <div className="main-column">
          <section className="office-panel">
            <div className="panel-heading"><div><span className="live-dot"/> <strong>THE OFFICE FLOOR</strong><span className="tiny-label">LIVE STATUS</span></div><div className="panel-heading-right"><span>FLOOR 01</span><span className="window-icons"><i/><i/><i/></span></div></div>
            <Office agents={agents} onSelect={selectAgent}/>
            <div className="office-footer"><div><span className="office-indicator"/> 3 AI TEAM MEMBERS</div><div>👆 Click a character to assign work</div></div>
          </section>
          <div className="section-label"><span>YOUR AGENTS</span><span>SELECT AN AGENT TO GIVE A TASK ↓</span></div>
          <div className="agent-grid">
            {agents.map(a=>{const m=agentsMeta[a.id],AgentIcon=m.icon;return <button key={a.id} onClick={()=>selectAgent(a.id)} className={`agent-card ${selected===a.id?'selected':''}`} style={{'--agent-accent':m.accent}}>
              <div className="agent-card-top"><span className="agent-card-id">AGENT {m.number}</span><span className={`mini-status ${a.status}`}><span className="status-point"/>{statusNames[a.status]}</span></div>
              <div className="agent-avatar"><AgentIcon size={24} strokeWidth={1.7}/></div>
              <div className="agent-identity"><strong>{a.name}</strong><ChevronRight size={16}/></div>
              <div className="agent-role">{a.title}</div>
              <div className="agent-foot">{m.skill}<ArrowUpRight size={14}/></div>
            </button>})}
          </div>
          <div className="lower-grid">
            <section className="content-panel"><div className="content-title"><span><Activity size={16}/> Activity feed</span><span className="subtle-text">RECENT EVENTS</span></div>
              <div className="activity-list">{activity.length? activity.map((a,i)=><div className="activity-row" key={a.id+a.time+i}><div className="activity-bubble">{a.id==='developer'?'⌘':a.id==='researcher'?'⌕':'▦'}</div><div><b>{a.agent}</b><p>{a.message}</p></div><time>{new Date(a.time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</time></div>):<div className="empty"><Clock3 size={22}/><p>No activity yet. Assign a mission to get started.</p></div>}</div>
            </section>
            <section className="content-panel"><div className="content-title"><span><FolderOpen size={16}/> Workspace files</span><span className="file-counter">{outputFiles.length} OUTPUT</span></div>
              <div className="files-list">{outputFiles.length? outputFiles.slice(0,10).map(f=><div key={f.path} className="file-row"><button onClick={()=>openPreview(f)} title="View file"><FileText size={16}/><span>{f.path.replace('output/','')}</span></button><a href={'/api/download?path='+encodeURIComponent(f.path)} title="Download"><Download size={15}/></a></div>):<div className="empty"><FileText size={22}/><p>Created files will appear here, ready to view or download.</p></div>}</div>
            </section>
          </div>
        </div>
        <aside className="command-panel" style={{'--agent-accent':meta.accent}}>
          <div className="command-top"><div className="side-eyebrow"><span className="diamond">◆</span> COMMAND CENTER</div><div className="side-counter">0{Object.keys(agentsMeta).indexOf(selected)+1} / 03</div></div>
          <div className="side-agent-label">ASSIGNED AGENT</div>
          <div className="selected-agent"><div className="selected-agent-icon"><Icon size={29}/></div><div><strong>{selectedAgent.name}</strong><span>{selectedAgent.title}</span></div></div>
          <div className={`active-status ${selectedAgent.status}`}><span className="ping"/>{statusNames[selectedAgent.status]}<span className="active-status-dot">●</span></div>
          <div className="side-divider"/>
          <label htmlFor="task-text">YOUR MISSION <span>✦</span></label>
          <textarea id="task-text" value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Describe what you want your AI agent to do…" rows={7} maxLength={6000}/>
          <div className="example-row"><span>TRY A TEMPLATE</span><button onClick={()=>setPrompt(examples[selected])}><Play size={11} fill="currentColor"/> Example task</button></div>
          <button className="primary-button" disabled={anyBusy||prompt.trim().length<5||!health?.ollamaOnline||!health?.modelInstalled} onClick={send}><span>{anyBusy?'AGENT IS WORKING':'ASSIGN MISSION'}</span>{anyBusy?<span className="loading-spinner"/>:<ArrowRight size={19}/>}</button>
          {notice&&<div className={`notice ${notice.startsWith('⚠')?'notice-error':''}`}>{notice}</div>}
          <div className="side-divider"/>
          <div className="side-file-label"><span>BRING YOUR DATA</span><span className="small-pill">CSV</span></div>
          <label className="upload-button"><Upload size={17}/><span>{uploading?'UPLOADING…':'UPLOAD A CSV DATASET'}</span><input disabled={uploading} hidden type="file" accept=".csv,text/csv" onChange={uploadFile}/></label>
          <p className="side-helper">Upload CSV for Byte to analyse. 8GB mode: one agent at a time. Nova searches Wikipedia only when internet is available.</p>
          {selectedAgent.result && <div className={`result-card ${selectedAgent.status==='error'?'error':''}`}><div className="result-heading"><Check size={15}/> {selectedAgent.status==='error'?'TASK ERROR':'LAST RESULT'}</div><p>{selectedAgent.result.text}</p>{selectedAgent.result.sources?.length>0&&<div className="result-sources"><b>Sources</b>{selectedAgent.result.sources.map(s=><a target="_blank" rel="noreferrer" key={s.url} href={s.url}>{s.title} <ExternalLink size={11}/></a>)}</div>}</div>}
          <div className="side-safe"><ShieldCheck size={15}/> Ollama runs locally. Nova can search Wikipedia online. Files restricted to the local workspace. No shell execution or deployment.</div>
        </aside>
      </div>
      <footer className="page-footer"><span>✳ LITTLE AGENTS © 2026</span><span>BUILT WITH ☕ AND TOO MANY PIXELS</span><span>PERSONAL PORTFOLIO PROJECT</span></footer>
    </main>
    {preview && <div className="modal-backdrop" onClick={()=>setPreview(null)}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-header"><span><FileText size={17}/>{preview.path}</span><button onClick={()=>setPreview(null)}><X size={20}/></button></div><pre>{preview.loading?'Loading preview…':preview.content}</pre><a className="modal-download" href={'/api/download?path='+encodeURIComponent(preview.path)}><Download size={16}/> Download this file</a></div></div>}
  </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
