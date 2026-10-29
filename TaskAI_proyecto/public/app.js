let token = localStorage.getItem("taskai_token");
let currentUser = null, tasks = [], events = [], currentMonth = new Date(), currentFilter = "all";

const $ = id => document.getElementById(id);
const api = async (url, options={}) => {
  options.headers = {"Content-Type":"application/json", ...(options.headers||{})};
  if(token) options.headers.Authorization = "Bearer " + token;
  const r = await fetch(url, options);
  const data = await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(data.error || "Error");
  return data;
};

function initials(name){ return name.split(/\s+/).map(x=>x[0]).slice(0,2).join("").toUpperCase(); }
function showLogin(){ $("loginForm").hidden=false; $("registerForm").hidden=true; $("authError").textContent=""; }
function showRegister(){ $("loginForm").hidden=true; $("registerForm").hidden=false; $("authError").textContent=""; }

async function login(){
  try{
    const data=await api("/api/login",{method:"POST",body:JSON.stringify({email:$("loginEmail").value,password:$("loginPassword").value})});
    token=data.token; localStorage.setItem("taskai_token",token); await boot();
  }catch(e){$("authError").textContent=e.message}
}
async function register(){
  try{
    const data=await api("/api/register",{method:"POST",body:JSON.stringify({name:$("regName").value,email:$("regEmail").value,password:$("regPassword").value})});
    token=data.token; localStorage.setItem("taskai_token",token); await boot();
  }catch(e){$("authError").textContent=e.message}
}
function logout(){localStorage.removeItem("taskai_token");token=null;location.reload()}

async function boot(){
  try{
    currentUser=await api("/api/me");
    $("authView").hidden=true; $("appView").hidden=false;
    $("topName").textContent=currentUser.name; $("helloName").textContent=currentUser.name.split(" ")[0];
    $("avatar").textContent=initials(currentUser.name); $("profileAvatar").textContent=initials(currentUser.name);
    $("profileName").textContent=currentUser.name; $("profileEmail").textContent=currentUser.email;
    setTheme(currentUser.theme || "light", false);
    await refresh();
  }catch(e){localStorage.removeItem("taskai_token");token=null}
}
async function refresh(){
  tasks=await api("/api/tasks"); events=await api("/api/events");
  renderTasks(); renderHome(); renderCalendar(); renderScore();
}
function openPage(id){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active-page"));
  $(id).classList.add("active-page");
  document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.page===id));
  if(id==="calendar") renderCalendar();
}
document.querySelectorAll(".nav").forEach(n=>n.onclick=()=>openPage(n.dataset.page));

function renderHome(){
  const done=tasks.filter(t=>t.status==="completed").length;
  const progress=tasks.length?Math.round(tasks.reduce((a,t)=>a+t.progress,0)/tasks.length):0;
  $("homeProgress").textContent=progress+"%"; document.querySelector(".progress-ring").style.setProperty("--progress",progress+"%");
  $("completedCount").textContent=done; $("pendingCount").textContent=tasks.length-done;
  $("upcomingList").innerHTML=tasks.filter(t=>t.status!=="completed").slice(0,5).map(t=>`<div class="task-mini"><i class="dot"></i><div><b>${esc(t.title)}</b><div class="task-meta">${t.due_date||"Sin fecha"} · ${t.priority}</div></div></div>`).join("") || `<p class="muted">No tienes tareas pendientes.</p>`;
  renderMiniCalendar();
}
function renderMiniCalendar(){
  const d=new Date(); const y=d.getFullYear(),m=d.getMonth();
  const days=new Date(y,m+1,0).getDate(), first=new Date(y,m,1).getDay();
  let html=`<div class="calendar-grid"><div class="cal-head">Dom</div><div class="cal-head">Lun</div><div class="cal-head">Mar</div><div class="cal-head">Mié</div><div class="cal-head">Jue</div><div class="cal-head">Vie</div><div class="cal-head">Sáb</div>`;
  for(let i=0;i<first;i++)html+=`<div class="cal-day"></div>`;
  for(let day=1;day<=days;day++){let iso=`${y}-${String(m+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;let has=tasks.some(t=>t.due_date===iso)||events.some(e=>e.event_date===iso);html+=`<div class="cal-day ${day===d.getDate()?"today":""}"><b>${day}</b>${has?'<div class="event-dot">•</div>':''}</div>`}
  $("miniCalendar").innerHTML=html+"</div>";
}
function renderTasks(){
  const arr=currentFilter==="all"?tasks:tasks.filter(t=>t.status===currentFilter);
  $("taskList").innerHTML=arr.map(t=>`<div class="task-row">
    <button class="check ${t.status==="completed"?"done":""}" onclick="toggleTask(${t.id},${t.status==="completed"?0:100})">${t.status==="completed"?"✓":""}</button>
    <div><div class="task-title">${esc(t.title)}</div><div class="task-meta">${t.due_date||"Sin fecha"} · ${esc(t.category)} · ${t.priority}</div></div>
    <div class="bar"><i style="width:${t.progress}%"></i></div><div class="percent">${t.progress}%</div>
  </div>`).join("") || `<div class="card"><p class="muted">No hay tareas en esta categoría.</p></div>`;
}
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");currentFilter=b.dataset.filter;renderTasks()});
async function toggleTask(id,progress){await api("/api/tasks/"+id,{method:"PUT",body:JSON.stringify({progress})});await refresh()}

function openTaskModal(){
  $("modalTitle").textContent="Nueva tarea";
  $("modalContent").innerHTML=`<label>Título</label><input id="mTitle" placeholder="Ej. Terminar proyecto"><label>Descripción</label><textarea id="mDesc" placeholder="Detalles..."></textarea><label>Fecha</label><input id="mDate" type="date"><label>Categoría</label><input id="mCat" value="General"><label>Prioridad</label><select id="mPriority"><option>Alta</option><option selected>Media</option><option>Baja</option></select><label>Puntos</label><input id="mPoints" type="number" value="10" min="1" max="100"><button class="primary" onclick="createTask()">Crear tarea</button>`;
  $("modal").hidden=false;
}
async function createTask(){
  await api("/api/tasks",{method:"POST",body:JSON.stringify({title:$("mTitle").value,description:$("mDesc").value,due_date:$("mDate").value,category:$("mCat").value,priority:$("mPriority").value,points:$("mPoints").value})});closeModal();await refresh();
}
function openEventModal(){
  $("modalTitle").textContent="Nuevo evento";
  $("modalContent").innerHTML=`<label>Título</label><input id="eTitle" placeholder="Ej. Reunión"><label>Fecha</label><input id="eDate" type="date"><label>Hora</label><input id="eTime" type="time"><label>Tipo</label><input id="eType" value="Evento"><button class="primary" onclick="createEvent()">Crear evento</button>`;
  $("modal").hidden=false;
}
async function createEvent(){await api("/api/events",{method:"POST",body:JSON.stringify({title:$("eTitle").value,event_date:$("eDate").value,event_time:$("eTime").value,type:$("eType").value})});closeModal();await refresh()}
function closeModal(){$("modal").hidden=true}

function renderCalendar(){
  const y=currentMonth.getFullYear(),m=currentMonth.getMonth();
  $("calendarTitle").textContent=currentMonth.toLocaleDateString("es-ES",{month:"long",year:"numeric"});
  const first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();
  let html=`<div class="calendar-grid"><div class="cal-head">Dom</div><div class="cal-head">Lun</div><div class="cal-head">Mar</div><div class="cal-head">Mié</div><div class="cal-head">Jue</div><div class="cal-head">Vie</div><div class="cal-head">Sáb</div>`;
  for(let i=0;i<first;i++)html+=`<div class="cal-day"></div>`;
  for(let day=1;day<=days;day++){
    const iso=`${y}-${String(m+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const ts=tasks.filter(t=>t.due_date===iso), es=events.filter(e=>e.event_date===iso);
    const today=new Date();const isToday=day===today.getDate()&&m===today.getMonth()&&y===today.getFullYear();
    html+=`<div class="cal-day ${isToday?"today":""}"><b>${day}</b>${ts.map(t=>`<div class="event-dot">T · ${esc(t.title)}</div>`).join("")}${es.map(e=>`<div class="event-dot">E · ${esc(e.title)}</div>`).join("")}</div>`;
  }
  $("fullCalendar").innerHTML=html+"</div>";
}
function changeMonth(n){currentMonth.setMonth(currentMonth.getMonth()+n);renderCalendar()}
function goToday(){currentMonth=new Date();renderCalendar()}

async function sendMessage(){
  const input=$("chatInput"),message=input.value.trim();if(!message)return;
  addMessage(message,"me");input.value="";
  try{const data=await api("/api/assistant",{method:"POST",body:JSON.stringify({message})});addMessage(data.reply,"ai")}
  catch(e){addMessage("No pude responder: "+e.message,"ai")}
}
function addMessage(text,type){const d=document.createElement("div");d.className="message "+type;d.textContent=text;$("messages").appendChild(d);$("messages").scrollTop=$("messages").scrollHeight}
$("chatInput").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage()}});

const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
if(SpeechRecognition){
  const recognition=new SpeechRecognition();recognition.lang="es-ES";recognition.interimResults=false;
  $("voiceBtn").onclick=()=>{recognition.start();$("voiceStatus").textContent="Escuchando...";};
  recognition.onresult=e=>{$("chatInput").value=e.results[0][0].transcript;$("voiceStatus").textContent="Texto reconocido. Puedes enviarlo.";};
  recognition.onerror=()=>$("voiceStatus").textContent="No se pudo reconocer la voz.";
  recognition.onend=()=>{if($("voiceStatus").textContent==="Escuchando...")$("voiceStatus").textContent="Pulsa el micrófono para empezar."};
}else{$("voiceBtn").disabled=true;$("voiceStatus").textContent="Tu navegador no admite reconocimiento de voz."}

$("fileInput").onchange=e=>$("fileNames").innerHTML=[...e.target.files].map(f=>`<p>📄 ${esc(f.name)} — ${Math.round(f.size/1024)} KB</p>`).join("");
async function setTheme(theme,save=true){
  if(theme==="auto")document.body.classList.toggle("dark",matchMedia("(prefers-color-scheme: dark)").matches);
  else document.body.classList.toggle("dark",theme==="dark");
  if(save&&currentUser){await api("/api/me",{method:"PUT",body:JSON.stringify({theme})});currentUser.theme=theme}
}
async function editProfile(){
  const name=prompt("Nuevo nombre:",currentUser.name);if(!name||name===currentUser.name)return;
  await api("/api/me",{method:"PUT",body:JSON.stringify({name})});await boot();
}
function renderScore(){
  const completed=tasks.filter(t=>t.status==="completed"), points=completed.reduce((a,t)=>a+Number(t.points||0),0), avg=tasks.length?Math.round(tasks.reduce((a,t)=>a+t.progress,0)/tasks.length):0;
  const score=Math.min(100,Math.round(avg*.7+Math.min(points,100)*.3));
  $("bigScore").textContent=score;$("statCompleted").textContent=completed.length;$("statPoints").textContent=points;$("statAverage").textContent=avg+"%";
  $("scoreLevel").textContent=score>=80?"Productivo":score>=50?"En progreso":"Empezando";
}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

if(token) boot();
