'use strict';
// No build step: all visualizations use plain Canvas and browser JavaScript.
const $ = id => document.getElementById(id);
const clamp = (v,lo,hi)=>Math.min(hi,Math.max(lo,v));
const num = id => parseFloat($(id).value);
const accent = '#36c7ae', orange = '#f6b96a', blue = '#86aefb', gridCol = '#2b4154';
function setup(canvas) {
  const cssW=Math.max(canvas.clientWidth,260), cssH=Math.max(canvas.clientHeight,190);
  const dpr=Math.min(window.devicePixelRatio||1,2);
  canvas.width=Math.round(cssW*dpr);canvas.height=Math.round(cssH*dpr);
  const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
  return {ctx,w:cssW,h:cssH};
}
function makeChart(canvas, xMax,yMin,yMax,opts={}) {
  const {ctx,w,h}=setup(canvas), l=47,r=16,t=16,b=32;
  const px=x=>l+(x/xMax)*(w-l-r), py=y=>t+(yMax-y)/(yMax-yMin)*(h-t-b);
  ctx.clearRect(0,0,w,h); ctx.font='11px system-ui';ctx.lineWidth=1;
  for(let i=0;i<=4;i++){
    let val=yMin+i*(yMax-yMin)/4,y=py(val);ctx.strokeStyle=gridCol;ctx.beginPath();ctx.moveTo(l,y);ctx.lineTo(w-r,y);ctx.stroke();ctx.textAlign='right';ctx.fillStyle='#7794a8';ctx.fillText((Math.abs(val)>=100?val.toFixed(0):val.toFixed(1)),l-7,y+4);
  }
  for(let i=0;i<=5;i++){let x=i*xMax/5,xx=px(x);ctx.strokeStyle='#26394d';ctx.beginPath();ctx.moveTo(xx,t);ctx.lineTo(xx,h-b);ctx.stroke();ctx.fillStyle='#7e9daf';ctx.textAlign='center';ctx.fillText(x.toFixed(0),xx,h-13)}
  if(opts.xlabel){ctx.textAlign='right';ctx.fillStyle='#95abba';ctx.fillText(opts.xlabel,w-15,h-4)}
  if(opts.ylabel){ctx.textAlign='left';ctx.fillStyle='#95abba';ctx.fillText(opts.ylabel,6,10)}
  return {ctx,w,h,px,py,left:l,right:w-r,top:t,bottom:h-b};
}
function polyline(ch,points,color,width=2.5,dash=[]) {
  const {ctx,px,py}=ch;ctx.save();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.beginPath();
  points.forEach((p,i)=>i?ctx.lineTo(px(p[0]),py(p[1])):ctx.moveTo(px(p[0]),py(p[1])));
  ctx.stroke();ctx.restore();
}
function hline(ch,v,color,dash=[6,6]){const {ctx,left,right,py}=ch;ctx.save();ctx.strokeStyle=color;ctx.lineWidth=1.2;ctx.setLineDash(dash);ctx.beginPath();ctx.moveTo(left,py(v));ctx.lineTo(right,py(v));ctx.stroke();ctx.restore()}
const defaults={lif:{'r-slider':20,'c-slider':1,'i-slider':1,'th-slider':14},adapt:{'alpha-slider':0.90,'beta-slider':0.94,'a-slider':0.45,'b-slider':0.4},sg:{'sg-width':0.7,'sg-type':'all'},delay:{d1:2,d2:5,d3:8},init:{xi:2,mu:0},time:{t1:8,t2:5,t3:3}};
let selectedModel='LIF';
function drawLif(){const R=num('r-slider'),C=num('c-slider'),I=num('i-slider'),th=num('th-slider'),dt=.2,tau=R*C;
  $('r-out').textContent=R.toFixed(0)+' MΩ';$('c-out').textContent=C.toFixed(1)+' nF';$('i-out').textContent=I.toFixed(1)+' nA';$('th-out').textContent=th.toFixed(0)+' mV';
  let v=0,spikes=0,points=[[0,0]];const maxT=150;for(let j=1;j<=maxT/dt;j++){const tt=j*dt;v+=(R*I-v)*dt/tau;
  if(v>=th){points.push([tt,th]);v=0;spikes++;}points.push([tt,v]);}
  const ch=makeChart($('lif-canvas'),150,0,Math.max(th,R*I,5)*1.14,{xlabel:'time (ms)',ylabel:'voltage (mV)'});
  hline(ch,th,orange);hline(ch,0,'#687e93',[3,4]);polyline(ch,points,accent,2.25);
  $('tau-result').textContent=tau.toFixed(1)+' ms';$('spikes-result').textContent=spikes;$('vss-result').textContent=(R*I).toFixed(1)+' mV';$('lif-state').textContent=spikes>0?'Vₘ reaches Vth → spike → reset':'Vₘ remains below Vth → no spike';$('lif-state').classList.toggle('is-spiking',spikes>0);
}
function drawAdapt(){const alpha=num('alpha-slider'),beta=num('beta-slider'),aRaw=num('a-slider'),bRaw=num('b-slider');
  $('alpha-out').textContent=alpha.toFixed(2);$('beta-out').textContent=beta.toFixed(2);$('a-out').textContent=aRaw.toFixed(2);$('b-out').textContent=bRaw.toFixed(2);
  const isAdapt=selectedModel==='AdLIF'||selectedModel==='cAdLIF',a=isAdapt?(selectedModel==='cAdLIF'?Math.max(0,aRaw):aRaw):0,b=isAdapt?(selectedModel==='cAdLIF'?Math.max(0,bRaw):bRaw):0;
  let u=0,w=0,lastSpike=0,spikes=0;const points=[],adaptPoints=[],theta=1,input=2.25,steps=150;
  const alphaEff=selectedModel==='PLIF'?clamp(alpha+.04,.65,.995):alpha;
  for(let t=0;t<=steps;t++){
    if(t>0){const oldU=u,oldW=w;u=alphaEff*oldU+(1-alphaEff)*(input-oldW)-theta*lastSpike;
      if(isAdapt)w=beta*oldW+(1-beta)*a*oldU+b*lastSpike;else w=0;
      lastSpike=u>=theta?1:0;if(lastSpike)spikes++;}
    points.push([t,u]);adaptPoints.push([t,w]);
  }
  const vals=points.map(p=>p[1]).concat(adaptPoints.map(p=>p[1]));let lo=Math.min(-.3,...vals),hi=Math.max(1.3,...vals);lo=Math.max(-2.5,lo-.1);hi=Math.min(3.5,hi+.15);
  const ch=makeChart($('adapt-canvas'),150,lo,hi,{xlabel:'timestep',ylabel:'relative state'});hline(ch,theta,orange,[5,6]);polyline(ch,points,accent,2.2);if(isAdapt)polyline(ch,adaptPoints,blue,1.5,[6,3]);
  const ctx=ch.ctx;ctx.font='11px system-ui';ctx.textAlign='left';ctx.fillStyle=accent;ctx.fillText('u[t] membrane',ch.left+7,ch.top+13);
  if(isAdapt){ctx.fillStyle=blue;ctx.fillText('w[t] adaptation',ch.left+125,ch.top+13)}
  $('adapt-spikes-result').textContent=spikes;$('model-result').textContent=selectedModel;$('effective-ab').textContent=isAdapt?`${a.toFixed(2)} / ${b.toFixed(2)}`:'0 / 0';
}
function drawSG(){const width=num('sg-width'),type=$('sg-type').value;$('sg-width-out').textContent=width.toFixed(2);
  const ch=makeChart($('sg-canvas'),4,0,1.15,{xlabel:'u − θ (shifted by +2)',ylabel:'surrogate derivative'});
  const functions={rect:x=>Math.abs(x)<=width/2?1:0,tri:x=>Math.max(0,1-Math.abs(x)/width),sig:x=>1/Math.pow(1+Math.abs(x)/width,2)};
  const choices=[['rect',accent],['tri',orange],['sig',blue]];
  for(const [key,color] of choices){if(type!=='all'&&type!==key)continue;const pts=[];for(let k=0;k<=500;k++){const x=k/125-2;pts.push([x+2,functions[key](x)])}polyline(ch,pts,color,2.3)}
  ch.ctx.save();ch.ctx.setLineDash([4,5]);ch.ctx.strokeStyle='#657a8f';ch.ctx.beginPath();ch.ctx.moveTo(ch.px(2),ch.top);ch.ctx.lineTo(ch.px(2),ch.bottom);ch.ctx.stroke();ch.ctx.restore();ch.ctx.fillStyle='#abb9c8';ch.ctx.font='11px system-ui';ch.ctx.fillText('threshold',ch.px(2)+6,ch.top+14);
}
function drawDelay(){const d=[num('d1'),num('d2'),num('d3')];d.forEach((v,i)=>$('d'+(i+1)+'-out').textContent=v+' ms');
  const {ctx,w,h}=setup($('delay-canvas')),l=70,r=22,t=23,b=33, xmax=38;
  const X=x=>l+(w-l-r)*x/xmax;
  ctx.clearRect(0,0,w,h);ctx.font='11px system-ui';const rows=[['Source',10,orange],['A → B',10+d[0],accent],['A → C',10+d[1],blue],['A → D',10+d[2],'#bfabf4']];
  for(let g=0;g<=xmax;g+=5){const x=X(g);ctx.strokeStyle=gridCol;ctx.beginPath();ctx.moveTo(x,t);ctx.lineTo(x,h-b);ctx.stroke();ctx.fillStyle='#829aad';ctx.textAlign='center';ctx.fillText(g+' ms',x,h-9)}
  rows.forEach(([name,event,c],i)=>{const y=t+22+i*(h-t-b-37)/3;ctx.strokeStyle='#496274';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(l,y);ctx.lineTo(w-r,y);ctx.stroke();ctx.fillStyle='#c1d0df';ctx.textAlign='right';ctx.fillText(name,l-11,y+4);ctx.strokeStyle=c;ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(X(event),y+8);ctx.lineTo(X(event),y-22);ctx.stroke();ctx.fillStyle=c;ctx.beginPath();ctx.arc(X(event),y-22,4,0,Math.PI*2);ctx.fill();ctx.textAlign='left';ctx.fillText(event+' ms',Math.min(X(event)+7,w-50),y-15)});
}
function normal(x,mu,sigma){return Math.exp(-.5*Math.pow((x-mu)/sigma,2))/(sigma*Math.sqrt(2*Math.PI))}
// Abramowitz and Stegun approximation for the Gaussian tail probability.
function erf(x){const sign=x<0?-1:1;x=Math.abs(x);const p=.3275911,t=1/(1+p*x);const y=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-x*x);return sign*y}
function drawInit(){const xi=num('xi'),mu=num('mu'),theta=1,sigma=(theta-mu)/xi;$('xi-out').textContent=xi.toFixed(1);$('mu-out').textContent=mu.toFixed(2);
  const ch=makeChart($('init-canvas'),4,0,2.8,{xlabel:'membrane voltage (shifted +1.5)',ylabel:'density'}),points=[];for(let j=0;j<=500;j++){let x=-1.5+4*j/500;points.push([x+1.5,normal(x,mu,sigma)])}
  let maxY=Math.max(2,1/(sigma*Math.sqrt(2*Math.PI))*1.2);if(maxY>2.8){const revised=makeChart($('init-canvas'),4,0,maxY,{xlabel:'voltage (shifted +1.5)',ylabel:'density'});paintInit(revised,points,mu,theta,sigma);}else paintInit(ch,points,mu,theta,sigma);
  const tail=.5*(1-erf((theta-mu)/(sigma*Math.sqrt(2))));$('sig-result').textContent=sigma.toFixed(3);$('tail-result').textContent=(tail*100).toFixed(1)+'%';
}
function paintInit(ch,points,mu,theta,sigma){const {ctx,px,py}=ch;
  ctx.save();ctx.fillStyle='rgba(246,185,106,.21)';ctx.beginPath();let started=false;for(let j=0;j<=250;j++){const x=theta+(2.5-theta)*j/250,y=normal(x,mu,sigma);if(!started){ctx.moveTo(px(theta+1.5),py(0));started=true;}ctx.lineTo(px(x+1.5),py(y))}ctx.lineTo(px(4),py(0));ctx.closePath();ctx.fill();ctx.restore();
  polyline(ch,points,accent,2.2);ctx.save();ctx.setLineDash([5,5]);ctx.strokeStyle=orange;ctx.beginPath();ctx.moveTo(px(theta+1.5),ch.top);ctx.lineTo(px(theta+1.5),ch.bottom);ctx.stroke();ctx.strokeStyle=blue;ctx.beginPath();ctx.moveTo(px(mu+1.5),ch.top);ctx.lineTo(px(mu+1.5),ch.bottom);ctx.stroke();ctx.setLineDash([]);ctx.textAlign='right';ctx.fillStyle=orange;ctx.fillText('θ = 1',px(theta+1.5)-8,ch.top+14);ctx.textAlign='left';ctx.fillStyle=blue;ctx.fillText('μ',px(mu+1.5)+6,ch.top+28);ctx.restore();}
function drawTime(){const vals=[num('t1'),num('t2'),num('t3')],total=vals.reduce((a,b)=>a+b,0);vals.forEach((v,i)=>{$('t'+(i+1)+'-out').textContent=v;$('bar-t'+(i+1)).style.width=(v/16*100)+'%'});$('t-total').textContent=total;$('t-saving').textContent=Math.round(100*(24-total)/24)+'%';}
const renders={lif:drawLif,adapt:drawAdapt,sg:drawSG,delay:drawDelay,init:drawInit,time:drawTime};
for(const [demo,keys] of Object.entries(defaults))for(const key of Object.keys(keys)){const node=$(key);node.addEventListener(node.tagName==='SELECT'?'change':'input',renders[demo]);}
for(const btn of document.querySelectorAll('.reset-button'))btn.addEventListener('click',()=>{const name=btn.dataset.reset;for(const [k,v] of Object.entries(defaults[name]))$(k).value=v;if(name==='adapt'){selectedModel='LIF';for(const b of document.querySelectorAll('[data-model]'))b.classList.toggle('active',b.dataset.model==='LIF')}renders[name]()});
for(const btn of document.querySelectorAll('[data-model]'))btn.addEventListener('click',()=>{selectedModel=btn.dataset.model;for(const b of document.querySelectorAll('[data-model]'))b.classList.toggle('active',b===btn);drawAdapt()});

const menu=$('mobile-menu'),sidebar=$('sidebar');menu.addEventListener('click',()=>{const opened=sidebar.classList.toggle('open');menu.setAttribute('aria-expanded',String(opened))});for(const link of document.querySelectorAll('.sidebar .nav-link'))link.addEventListener('click',()=>{sidebar.classList.remove('open');menu.setAttribute('aria-expanded','false')});
const sections=[...document.querySelectorAll('section[id]')];const navs=[...document.querySelectorAll('.nav-link')];
const spy=new IntersectionObserver(entries=>{const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);if(visible.length){const id='#'+visible[0].target.id;navs.forEach(n=>{const active=n.getAttribute('href')===id;n.classList.toggle('active',active);if(active)n.setAttribute('aria-current','true');else n.removeAttribute('aria-current')})}},{rootMargin:'-8% 0px -75% 0px',threshold:0});sections.forEach(s=>spy.observe(s));
function progress(){const max=document.documentElement.scrollHeight-window.innerHeight;$('reading-progress').style.width=(max>0?100*window.scrollY/max:0)+'%'}
window.addEventListener('scroll',progress,{passive:true});progress();
let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>Object.values(renders).forEach(fn=>fn()),130)});
Object.values(renders).forEach(fn=>fn());
