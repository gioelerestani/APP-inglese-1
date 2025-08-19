
const el = (sel) => document.querySelector(sel);
const levelSel = el('#level'); const typeSel  = el('#etype');
const btnStart = el('#btn-start'); const btnCheck = el('#btn-check');
const btnSkip  = el('#btn-skip');  const btnNext  = el('#btn-next');
const btnSpeak = el('#btn-speak'); const feedback = el('#feedback');
const promptBox= el('#prompt');    const workspace= el('#workspace');
const counter  = el('#counter');   const xpEl     = el('#xp');
const streakEl = el('#streak');    const statDone = el('#stat-done');
const statXP   = el('#stat-xp');   const btnTheme = el('#btn-theme');
const darkToggle = el('#darkmode'); const btnInstall = el('#btn-install');

let EX = []; let queue = []; let i = 0;
let xp = +localStorage.getItem('xp') || 0;
let done = +localStorage.getItem('done') || 0;
let streak = +localStorage.getItem('streak') || 0;
let lastDay = localStorage.getItem('lastDay') || "";
function todayKey(){ return new Date().toISOString().slice(0,10); }
function updateStreak(){
  const t = todayKey();
  if(lastDay !== t){
    const y = new Date(Date.now()-86400000).toISOString().slice(0,10);
    streak = (lastDay === y) ? (streak+1) : 1; lastDay = t;
    localStorage.setItem('streak', streak); localStorage.setItem('lastDay', lastDay);
  }
  streakEl.textContent = streak;
}
updateStreak(); xpEl.textContent = xp; statXP.textContent = xp; statDone.textContent = done;

function tryFetchExercises(){
  return fetch('exercises/exercises.json').then(r=>r.json()).catch(()=>window.EXERCISES_INLINE||[]);
}
function sample(arr, n){ const c=arr.slice(); const out=[]; while(out.length<n && c.length){ out.push(c.splice(Math.floor(Math.random()*c.length),1)[0]); } return out; }
function buildQueue(){
  let filtered = EX; const lv=levelSel.value, ty=typeSel.value;
  if(lv!=='ALL') filtered = filtered.filter(e=>e.level===lv);
  if(ty!=='ALL') filtered = filtered.filter(e=>e.type===ty);
  queue = sample(filtered, 20); i=0; renderExercise();
}
function renderExercise(){
  feedback.textContent=''; btnNext.disabled=true;
  if(!queue.length){ promptBox.textContent="Nessun esercizio trovato."; workspace.innerHTML=''; return; }
  const ex = queue[i]; counter.textContent = `${i+1}/${queue.length}`;
  promptBox.textContent = ex.prompt; workspace.innerHTML='';
  if(['vocab','cloze','listening','writing'].includes(ex.type)){
    const t=document.createElement('textarea'); t.rows=(ex.type==='writing')?4:2;
    t.placeholder=(ex.type==='vocab')? "Scrivi la parola in inglese..." : (ex.type==='cloze')? "Parola mancante..." : (ex.type==='listening')? "Trascrivi..." : "Scrivi il tuo testo...";
    workspace.appendChild(t);
  } else if(ex.type==='order'){
    const box=document.createElement('div'); (ex.pieces||[]).forEach(w=>{ const b=document.createElement('button'); b.textContent=w; b.onclick=()=>b.classList.toggle('pick'); box.appendChild(b); });
    workspace.appendChild(box);
  } else if(ex.type==='match'){
    const list=document.createElement('div');
    ex.pairs.forEach(p=>{ const row=document.createElement('div'); row.style.margin='6px 0';
      const label=document.createElement('span'); label.textContent=p[0]+" → ";
      const sel=document.createElement('select'); const opts=ex.pairs.map(pp=>pp[1]).sort(()=>Math.random()-0.5);
      opts.forEach(o=>{ const op=document.createElement('option'); op.value=o; op.textContent=o; sel.appendChild(op); });
      sel.dataset.answer=p[1]; row.appendChild(label); row.appendChild(sel); list.appendChild(row);
    }); workspace.appendChild(list);
  } else if(['dialogue','reading'].includes(ex.type)){
    (ex.options||[]).forEach(opt=>{ const b=document.createElement('button'); b.textContent=opt; b.onclick=()=>{ [...workspace.querySelectorAll('button')].forEach(x=>x.classList.remove('pick')); b.classList.add('pick'); }; workspace.appendChild(b); });
  }
}
function norm(s){ return (s||'').toLowerCase().replace(/[^a-z0-9 ]/gi,' ').replace(/\s+/g,' ').trim(); }
btnCheck.onclick=()=>{
  const ex=queue[i]; let ok=false;
  if(['vocab','cloze','listening'].includes(ex.type)){
    const val=workspace.querySelector('textarea').value; ok = norm(val).includes(norm(ex.answer));
  } else if(ex.type==='order'){
    const picks=[...workspace.querySelectorAll('.pick')].map(b=>b.textContent).join(' '); ok = norm(picks)===norm(ex.answer);
  } else if(ex.type==='match'){
    ok = [...workspace.querySelectorAll('select')].every(sel=>sel.value===sel.dataset.answer);
  } else if(['dialogue','reading'].includes(ex.type)){
    const selected=[...workspace.querySelectorAll('.pick')][0]; if(!selected){ feedback.textContent='Seleziona una risposta.'; return; }
    const idx=[...workspace.children].indexOf(selected); ok = idx===ex.answerIndex;
  } else if(ex.type==='writing'){
    const val=workspace.querySelector('textarea').value; ok = norm(val).split(' ').length>=8;
  }
  if(ok){ feedback.style.color='#0a0'; feedback.textContent='✅ Corretto! +10 XP'; xp+=10; done+=1; localStorage.setItem('xp',xp); localStorage.setItem('done',done); xpEl.textContent=xp; statXP.textContent=xp; statDone.textContent=done; }
  else { feedback.style.color='#c00'; const sol=ex.answer || (ex.answerIndex!==undefined?('Opzione corretta: '+(ex.answerIndex+1)):'—'); feedback.textContent='❌ Non esatto. Soluzione: '+sol; }
  btnNext.disabled=false;
};
btnSkip.onclick=()=>{ btnNext.disabled=false; feedback.textContent='⏭ Esercizio saltato.'; };
btnNext.onclick=()=>{ i++; if(i>=queue.length){ feedback.textContent='🎉 Sessione completa! Cambia filtri o premi Inizia pratica.'; i=queue.length-1; } else { renderExercise(); } };
btnSpeak.onclick=()=>{ const ex=queue[i]; const text=ex.audioText||ex.prompt||'Hello!'; if('speechSynthesis' in window){ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang='en-US'; speechSynthesis.speak(u);} else alert('Sintesi vocale non supportata.'); };
btnStart.onclick=()=>buildQueue();
document.querySelectorAll('.bottombar button').forEach(b=>{ b.onclick=()=>{ document.querySelectorAll('.bottombar button').forEach(x=>x.classList.remove('active')); b.classList.add('active');
  const tab=b.dataset.tab; document.getElementById('panel-stats').classList.toggle('hidden',tab!=='stats'); document.getElementById('panel-settings').classList.toggle('hidden',tab!=='settings');
  if(tab==='practice') window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'}); if(tab==='home') window.scrollTo({top:0,behavior:'smooth'}); }; });
function applyTheme(){ const dark=localStorage.getItem('theme')==='dark'; document.documentElement.classList.toggle('dark',dark); darkToggle.checked=dark; }
applyTheme();
document.getElementById('btn-theme').onclick=()=>{ const now=localStorage.getItem('theme')==='dark'?'light':'dark'; localStorage.setItem('theme',now); applyTheme(); };
darkToggle.onchange=()=>{ localStorage.setItem('theme', darkToggle.checked?'dark':'light'); applyTheme(); };
let deferredPrompt=null; window.addEventListener('beforeinstallprompt', (e)=>{ e.preventDefault(); deferredPrompt=e; btnInstall.style.display='inline-block'; });
btnInstall.onclick=async ()=>{ if(deferredPrompt){ deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; } };
tryFetchExercises().then(data=>EX=data);
if('serviceWorker' in navigator){ navigator.serviceWorker.register('./service-worker.js'); }
