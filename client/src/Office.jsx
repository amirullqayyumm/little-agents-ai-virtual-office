import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

const WIDTH=960, HEIGHT=490;
const workers = {
  developer:{x:225,color:0x8f8cf9,skin:0xf4bf8d,hair:0x32283f,name:'PIXEL'},
  researcher:{x:490,color:0x52b6d7,skin:0xd99f73,hair:0x49312c,name:'NOVA'},
  analyst:{x:750,color:0xe7b869,skin:0xf3cf9e,hair:0x25263e,name:'BYTE'}
};
class OfficeScene extends Phaser.Scene {
  constructor(){super('OfficeScene'); this.people={}; this.prevState={};this.onSelect=()=>{};}
  create(){
    const g=this.add.graphics();
    g.fillStyle(0x111a2c).fillRect(0,0,WIDTH,HEIGHT);
    g.fillStyle(0x1a2940).fillRect(0,0,WIDTH,165);
    g.fillStyle(0x25344c).fillRect(0,158,WIDTH,8);
    // wall grid & little notice board
    g.lineStyle(1,0x334760,.23);
    for(let x=0;x<WIDTH;x+=48)g.lineBetween(x,0,x,160);
    g.fillStyle(0x334a66).fillRoundedRect(46,25,238,115,12);
    g.fillStyle(0x0e2038).fillRoundedRect(57,35,216,91,8);
    g.fillStyle(0x163554).fillRoundedRect(63,40,204,83,5);
    g.fillStyle(0x245074).fillRect(156,40,5,83);
    g.fillStyle(0x245074).fillRect(63,78,204,4);
    for(let i=0;i<14;i++){const x=68+i*14;const h=9+(i*7%30);g.fillStyle(0x17304a).fillRect(x,122-h,10,h);}
    g.fillStyle(0xf1c56d).fillCircle(246,55,9);
    // company wall neon
    this.add.text(614,62,'LITTLE  AGENTS',{fontFamily:'monospace',fontSize:'26px',fontStyle:'bold',color:'#c2f3eb',stroke:'#182e41',strokeThickness:3});
    this.add.text(616,95,'a tiny office with real intelligence',{fontFamily:'monospace',fontSize:'12px',color:'#7893ad'});
    g.fillStyle(0x162439).fillRect(0,166,WIDTH,HEIGHT-166);
    // perspective-ish floor tiles
    g.lineStyle(1,0x2b3d54,.55);
    for(let y=166;y<HEIGHT;y+=38)g.lineBetween(0,y,WIDTH,y);
    for(let x=0;x<WIDTH;x+=45)g.lineBetween(x,166,x,HEIGHT);
    g.fillStyle(0x1b3444).fillRoundedRect(86,208,804,215,20);
    g.lineStyle(3,0x2e5660).strokeRoundedRect(86,208,804,215,20);
    // desk stations
    Object.entries(workers).forEach(([key,w],i)=>this.makeDesk(w.x,i,key));
    // plants
    this.plant(28,185);this.plant(926,188);
    // snacks and lounge
    g.fillStyle(0x44374e).fillRoundedRect(393,414,172,48,10);
    g.fillStyle(0x72597a).fillRoundedRect(406,408,145,33,8);
    g.fillStyle(0x352d4d).fillRoundedRect(405,435,145,10,4);
    this.add.text(452,425,'LOUNGE',{fontFamily:'monospace',fontSize:'11px',color:'#cfb3d3'});
    Object.entries(workers).forEach(([id,w],i)=>this.makePerson(id,w,i));
    this.add.text(25,467,'LOCAL MODE  /  3 AGENTS  /  CLICK A CHARACTER',{fontFamily:'monospace',fontSize:'10px',color:'#708ba5'});
    // Phaser Scene events do not exist before scene boot. Notify React once objects are ready.
    this.onReady?.();
  }
  plant(x,y){
    const g=this.add.graphics();
    g.fillStyle(0x956b55).fillRoundedRect(x-12,y+35,24,27,5);
    g.fillStyle(0x489e7d).fillEllipse(x-7,y+16,15,37);
    g.fillStyle(0x61bc87).fillEllipse(x+8,y+14,15,32);
    g.fillStyle(0x317966).fillEllipse(x,y+6,12,33);
  }
  makeDesk(x,i,key){
    const g=this.add.graphics();
    g.fillStyle(0x0d1727,.6).fillEllipse(x,352,210,40);
    g.fillStyle(0x39354e).fillRoundedRect(x-103,237,206,100,12);
    g.fillStyle(0x604c55).fillRoundedRect(x-110,230,220,70,10);
    g.fillStyle(0x9c7380).fillRoundedRect(x-110,227,220,17,6);
    g.fillStyle(0x3c3346).fillRoundedRect(x-75,164,150,92,9);
    g.fillStyle(0x101d31).fillRoundedRect(x-68,170,136,76,5);
    g.lineStyle(2,workers[key].color).strokeRoundedRect(x-68,170,136,76,5);
    g.fillStyle(0x3a3650).fillRect(x-7,246,14,11);
    g.fillStyle(0x322d43).fillRoundedRect(x-40,256,80,8,3);
    g.fillStyle(0x262f40).fillRoundedRect(x-48,275,100,10,3);
    g.fillStyle(0x4d6375).fillRoundedRect(x+72,259,21,25,5);
    this.add.text(x-58,186,i===0?'</> build()':i===1?'? discover()':'▥ analyse()',{fontFamily:'monospace',fontSize:'13px',color:i===0?'#9f9cfb':i===1?'#80dff5':'#f5cf83'});
    this.add.text(x-65,208,'> standby_',{fontFamily:'monospace',fontSize:'10px',color:'#7e91ad'});
    this.add.text(x,349,['DEV LAB','RESEARCH','DATA DESK'][i],{fontFamily:'monospace',fontSize:'11px',fontStyle:'bold',color:'#c0a6ad'}).setOrigin(.5);
  }
  makePerson(id,w,i){
    const x=170+i*185,y=400;
    const container=this.add.container(x,y);
    const shadow=this.add.graphics();shadow.fillStyle(0x090f20,.5).fillEllipse(0,0,52,13);container.add(shadow);
    const figure=this.add.container(0,-3);container.add(figure);
    const g=this.add.graphics();
    // sprite assembled from chunky rectangles: hair, head, body, legs
    g.fillStyle(0x313d56).fillRoundedRect(-15,-21,11,22,3).fillRoundedRect(4,-21,11,22,3);
    g.fillStyle(0x111a29).fillRoundedRect(-16,-3,12,6,2).fillRoundedRect(5,-3,13,6,2);
    g.fillStyle(w.color).fillRoundedRect(-22,-59,44,40,8);
    g.fillStyle(w.color).fillRoundedRect(-31,-55,13,26,5).fillRoundedRect(18,-55,13,26,5);
    g.fillStyle(w.skin).fillRoundedRect(-28,-32,10,10,2).fillRoundedRect(19,-32,10,10,2);
    g.fillStyle(w.skin).fillRoundedRect(-21,-94,42,41,8);
    g.fillStyle(w.hair).fillRoundedRect(-23,-101,46,19,7);
    g.fillStyle(w.hair).fillRoundedRect(-23,-93,9,19,3);
    g.fillStyle(0x202138).fillRect(-11,-76,5,5).fillRect(7,-76,5,5);
    g.fillStyle(0xffffff,.8).fillRect(-8,-79,2,2).fillRect(9,-79,2,2);
    g.fillStyle(0x8c4b54).fillRect(-3,-65,6,2);
    g.fillStyle(0xffffff,.8).fillRect(-11,-55,22,4);
    figure.add(g);
    const name=this.add.text(0,-123,w.name,{fontFamily:'monospace',fontSize:'14px',fontStyle:'bold',color:'#e9edfa',stroke:'#081326',strokeThickness:4}).setOrigin(.5);container.add(name);
    const label=this.add.text(0,-144,'☕ BREAK',{fontFamily:'monospace',fontSize:'10px',backgroundColor:'#2b374c',color:'#b2c5df',padding:{x:6,y:3}}).setOrigin(.5);container.add(label);
    container.setSize(74,140).setInteractive(new Phaser.Geom.Rectangle(-37,-148,74,154),Phaser.Geom.Rectangle.Contains);
    container.on('pointerdown',()=>this.onSelect(id));
    container.on('pointerover',()=>this.input.setDefaultCursor('pointer'));
    container.on('pointerout',()=>this.input.setDefaultCursor('default'));
    container.setDepth(200);
    this.people[id]={container,figure,label,transition:'idle',baseY:y,tween:null,deskX:w.x};
  }
  setAgentState(id,status){
    const p=this.people[id];if(!p || this.prevState[id]===status)return;
    this.prevState[id]=status;
    p.tween?.stop();this.tweens.killTweensOf(p.container);
    const textMap={idle:'☕ BREAK',thinking:'◌ THINKING',working:'⌨ WORKING',done:'✓ DONE',error:'! ERROR'};
    const col={idle:'#b2c5df',thinking:'#ffe4a1',working:'#a1f4dc',done:'#a1f4dc',error:'#ff9fa8'};
    p.label.setText(textMap[status]||status.toUpperCase()).setColor(col[status]||'#fff');
    const desk = status==='thinking'||status==='working'||status==='done'||status==='error';
    const targetX=desk?p.deskX:170+Object.keys(workers).indexOf(id)*185;
    const targetY=desk?331:400;
    this.tweens.add({targets:p.container,x:targetX,y:targetY,duration:800,ease:'Sine.easeInOut',onComplete:()=>{
      this.tweens.killTweensOf(p.figure);p.figure.y=-3;
      if(['working','thinking'].includes(this.prevState[id]))p.tween=this.tweens.add({targets:p.figure,y:-8,duration:260,yoyo:true,repeat:-1});
    }});
  }
}
export default function Office({agents,onSelect}){
  const mount=useRef(null),game=useRef(null),scene=useRef(null);
  const latestAgents=useRef(agents);
  latestAgents.current=agents;
  useEffect(()=>{
    const instance=new OfficeScene();instance.onSelect=onSelect;scene.current=instance;
    instance.onReady=()=>latestAgents.current.forEach(a=>instance.setAgentState(a.id,a.status));
    game.current=new Phaser.Game({type:Phaser.AUTO,parent:mount.current,width:WIDTH,height:HEIGHT,backgroundColor:'#121b2c',render:{pixelArt:true,antialias:false},scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[instance]});
    return ()=>{game.current?.destroy(true);game.current=null;scene.current=null;};
  },[]);
  useEffect(()=>{if(scene.current)scene.current.onSelect=onSelect;},[onSelect]);
  useEffect(()=>{
    const s=scene.current;
    if(s?.sys?.isActive()) agents.forEach(a=>s.setAgentState(a.id,a.status));
  },[agents]);
  return <div className="office-canvas" ref={mount} aria-label="Animated virtual office with three agents"/>;
}
