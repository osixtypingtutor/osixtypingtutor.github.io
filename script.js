/* OSIX Typing Tutor — localStorage + modern UI
   - Local users stored under key 'osix_users_v2'
   - Current user id under 'osix_current_v2'
*/
const LS_USERS = 'osix_users_v2';
const LS_CUR = 'osix_current_v2';

/* ----------------- utility ----------------- */
function readUsers(){ try{return JSON.parse(localStorage.getItem(LS_USERS))||[] }catch(e){return[]}}
function writeUsers(u){ localStorage.setItem(LS_USERS, JSON.stringify(u))}
function setCurrent(uid){ localStorage.setItem(LS_CUR, uid)}
function getCurrent(){ return localStorage.getItem(LS_CUR)}

/* ----------------- DOM ----------------- */
const authArea = document.getElementById('authArea');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const forgotForm = document.getElementById('forgotForm');
const appArea = document.getElementById('appArea');

const showSignup = document.getElementById('showSignup');
const showLogin = document.getElementById('showLogin');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');

const sideButtons = document.querySelectorAll('.side-btn');
const pages = {
  home: document.getElementById('pageHome'),
  choose: document.getElementById('pageChoose'),
  profile: document.getElementById('pageProfile'),
  test: document.getElementById('pageTest'),
  leader: document.getElementById('pageLeader'),
  results: document.getElementById('pageResults'),
  learn: document.getElementById('pageLearn'),
  daily: document.getElementById('pageDaily')
};
const sideAvatar = document.getElementById('sideAvatar');
const sideName = document.getElementById('sideName');
const topAvatar = document.getElementById('topAvatar');
const topUserName = document.getElementById('topUserName');
const profileBig = document.getElementById('profileBig');

const filePic = document.getElementById('filePic');
const choosePicBtn = document.getElementById('choosePicBtn');
const saveDetails = document.getElementById('saveDetails');
const editDetails = document.getElementById('editDetails');

const testsList = document.getElementById('testsList');
const searchExam = document.getElementById('searchExam');
const startChosen = document.getElementById('startChosen');
const chooseLang = document.getElementById('chooseLang');
const chooseDiff = document.getElementById('chooseDiff');
const chooseTime = document.getElementById('chooseTime');
const testPass = document.getElementById('testPass');
const testInput = document.getElementById('testInput');
const tLeft = document.getElementById('tLeft');
const tWpm = document.getElementById('tWpm');
const tAcc = document.getElementById('tAcc');

let testState = {running:false, interval:null, timeLeft:60, original:'', typed:''};

/* ---------- initial setup ---------- */
document.getElementById('showSignup').addEventListener('click', (e)=>{ e.preventDefault(); loginForm.classList.add('hidden'); signupForm.classList.remove('hidden'); });
document.getElementById('showLogin').addEventListener('click', (e)=>{ e.preventDefault(); signupForm.classList.add('hidden'); loginForm.classList.remove('hidden'); });
document.getElementById('forgotLink').addEventListener('click', ()=>{ loginForm.classList.add('hidden'); forgotForm.classList.remove('hidden'); });

loginBtn.addEventListener('click', attemptLogin);
signupBtn.addEventListener('click', createAccount);
document.getElementById('fpBack').addEventListener('click', ()=>{ forgotForm.classList.add('hidden'); loginForm.classList.remove('hidden');});
document.getElementById('fpSend').addEventListener('click', fpSend);

/* side navigation */
sideButtons.forEach(b=> b.addEventListener('click', ()=> {
  document.querySelectorAll('.side-btn').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  const p = b.dataset.page;
  if(p==='logout'){ doLogout(); return; }
  showPage(p);
}));

/* choose pic */
choosePicBtn.addEventListener('click', ()=> filePic.click());
filePic.addEventListener('change', handlePic);

/* profile save/edit */
editDetails.addEventListener('click', ()=> toggleProfileEdit(true));
saveDetails.addEventListener('click', saveProfile);

/* start chosen test */
startChosen.addEventListener('click', ()=> startSelectedTest());

/* search tests */
searchExam.addEventListener('input', renderTests);

/* test input */
function onTyping(){ // bound inline in HTML, also set here for safety
  testState.typed = testInput.value;
  renderPassage(testState.original, testState.typed);
  computeLive();
}
window.onTyping = onTyping;

/* ---------- Auth functions ---------- */
function createAccount(){
  const name = document.getElementById('suName').value.trim();
  const mobile = document.getElementById('suMobile').value.trim();
  const email = document.getElementById('suEmail').value.trim();
  const pass = document.getElementById('suPass').value;
  if(!name || !mobile || !pass){ alert('Please fill name, mobile and password'); return; }
  const users = readUsers();
  if(users.find(u=>u.mobile===mobile)){ alert('Mobile already registered'); return; }
  const id = 'u'+Date.now();
  const user = { id, name, mobile, email, pass, district:'', state:'', joined:new Date().toISOString(), avatar:'', results:[] };
  users.push(user); writeUsers(users);
  setCurrent(id);
  renderLoggedIn(user);
  alert('Account created. Welcome '+name);
}

/* login with mobile+password */
function attemptLogin(){
  const m = document.getElementById('loginMobile').value.trim();
  const p = document.getElementById('loginPass').value;
  if(!m || !p){ alert('Enter mobile and password'); return; }
  const u = readUsers().find(x=>x.mobile===m && x.pass===p);
  if(!u){ alert('Invalid credentials'); return; }
  setCurrent(u.id);
  renderLoggedIn(u);
}

/* forgot password (local fallback) */
function fpSend(){
  const m = document.getElementById('fpMobile').value.trim();
  if(!m){ alert('Enter mobile'); return; }
  const users = readUsers();
  const u = users.find(x=>x.mobile===m);
  if(!u){ alert('No user with this mobile'); return; }
  // In real app: send OTP via Firebase. Local fallback: show OTP input and allow reset (demo OTP=1234)
  document.getElementById('fpOtpWrap').classList.remove('hidden');
  alert('OTP (demo) sent: 1234 — in production app OTP will be sent via Firebase');
  document.getElementById('fpResetBtn').addEventListener('click', ()=> {
    const otp = document.getElementById('fpOtp').value.trim();
    if(otp !== '1234'){ alert('Wrong OTP (demo)'); return; }
    const np = document.getElementById('fpNewPass').value;
    if(!np){ alert('Enter new password'); return; }
    u.pass = np; writeUsers(users);
    alert('Password reset. Please login.');
    document.getElementById('fpOtpWrap').classList.add('hidden');
    forgotForm.classList.add('hidden'); loginForm.classList.remove('hidden');
  }, {once:true});
}

/* logout */
function doLogout(){
  localStorage.removeItem(LS_CUR);
  location.reload();
}

/* ---------- Render logged in UI ---------- */
function renderLoggedIn(user){
  // hide auth, show app
  authArea.classList.add('hidden');
  appArea.classList.remove('hidden');
  // set avatars & names
  sideAvatar.src = user.avatar || ('https://ui-avatars.com/api/?name='+encodeURIComponent(user.name)+'&background=7c3aed&color=fff');
  topAvatar.src = sideAvatar.src;
  profileBig.src = sideAvatar.src;
  sideName.innerText = user.name;
  topUserName.innerText = user.name;
  // show home page and load tests
  showPage('home');
  renderTests();
  renderMyResults();
  renderLeaderBoard();
}

/* ---------- profile picture handling ---------- */
function handlePic(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(ev){
    const data = ev.target.result;
    profileBig.src = data; sideAvatar.src = data; topAvatar.src = data;
    // save to user
    const uid = getCurrent();
    if(uid){
      const users = readUsers();
      const u = users.find(x=>x.id===uid);
      if(u){ u.avatar = data; writeUsers(users); }
    }
  };
  reader.readAsDataURL(file);
}

/* profile edit/save */
function toggleProfileEdit(on){
  document.getElementById('pfName').disabled = !on;
  document.getElementById('pfMobile').disabled = !on;
  document.getElementById('pfEmail').disabled = !on;
  document.getElementById('pfDistrict').disabled = !on;
  document.getElementById('pfState').disabled = !on;
}
function saveProfile(){
  const uid = getCurrent();
  if(!uid) return alert('No user');
  const users = readUsers();
  const u = users.find(x=>x.id===uid);
  if(!u) return;
  u.name = document.getElementById('pfName').value.trim();
  u.mobile = document.getElementById('pfMobile').value.trim();
  u.email = document.getElementById('pfEmail').value.trim();
  u.district = document.getElementById('pfDistrict').value.trim();
  u.state = document.getElementById('pfState').value.trim();
  writeUsers(users);
  sideName.innerText = u.name; topUserName.innerText = u.name;
  alert('Profile saved');
  toggleProfileEdit(false);
}

/* ---------- Page routing ---------- */
function hideAllPages(){ Object.values(pages).forEach(p=>p.classList.add('hidden')); }
function showPage(name){
  hideAllPages();
  if(name==='home'){ pages.home.classList.remove('hidden'); }
  else if(name==='choose'){ pages.choose.classList.remove('hidden'); }
  else if(name==='profile'){ pages.profile.classList.remove('hidden'); }
  else if(name==='test'){ pages.test.classList.remove('hidden'); }
  else if(name==='leader'){ pages.leader.classList.remove('hidden'); }
  else if(name==='results'){ pages.results.classList.remove('hidden'); }
  else if(name==='learn'){ pages.learn.classList.remove('hidden'); }
  else if(name==='daily'){ pages.daily?.classList.remove('hidden'); }
  // load profile fields
  loadProfileFields();
}

/* ---------- Tests data (we will inject 50 tests programmatically) ---------- */
const TESTS = [];
function generateTests(){
  // generate 50 tests (20+ real topics can be replaced with curated texts)
  const topics = ['CGL - Governance','CHSL - Basic Maths','Delhi Police - Comprehension','Bank PO - Economy','RRB - Technical','TGT History','UPSSSC - GK','Current Affairs','Science Tech','Environment'];
  for(let i=1;i<=50;i++){
    const topic = topics[i % topics.length];
    const text = `Test ${i} — ${topic}. ` + "This is a sample paragraph of approximately two hundred words. ".repeat(8);
    TESTS.push({ id:'t'+i, title:`Test ${i} — ${topic}`, passage: text.slice(0,1200), words:200});
  }
}
generateTests();

/* render list of tests */
function renderTests(){
  testsList.innerHTML = '';
  const q = (searchExam.value||'').toLowerCase();
  TESTS.forEach(t=>{
    if(q && !(t.title.toLowerCase().includes(q) || t.passage.toLowerCase().includes(q))) return;
    const el = document.createElement('div'); el.className='test-card';
    el.innerHTML = `<div><strong>${t.title}</strong><p class="muted small">${t.passage.slice(0,120)}...</p></div><div><button class="btn" onclick="beginTestById('${t.id}')">Start</button></div>`;
    testsList.appendChild(el);
  });
}

/* start test by id */
function beginTestById(id){
  const t = TESTS.find(x=>x.id===id);
  if(!t) return;
  beginTest(t.passage, 60);
}

/* start selected test from choose page */
function startSelectedTest(){
  const diff = chooseDiff.value;
  const lang = chooseLang.value;
  const time = parseInt(chooseTime.value,10) || 60;
  // pick a test based on difficulty (simple random)
  const idx = Math.floor(Math.random()*TESTS.length);
  const t = TESTS[idx];
  beginTest(t.passage, time);
}

/* ---------- Test runner ---------- */
function beginTest(text, seconds){
  testState.original = text;
  testState.timeLeft = seconds;
  testState.startTs = Date.now();
  testState.typed = '';
  document.getElementById('tLeft').innerText = testState.timeLeft;
  document.getElementById('tWpm').innerText = 0;
  document.getElementById('tAcc').innerText = 0;
  renderPassage(text,'');
  showPage('test');
  // start timer
  if(testState.interval) clearInterval(testState.interval);
  testState.interval = setInterval(()=> {
    testState.timeLeft--;
    document.getElementById('tLeft').innerText = testState.timeLeft;
    computeLive();
    if(testState.timeLeft<=0){ finishTest(); }
  },1000);
}
function renderPassage(text, typed){
  const spans = [];
  for(let i=0;i<text.length;i++){
    const ch = text[i] === ' ' ? '\u00A0' : text[i];
    const cls = (typed[i]==null) ? '' : (typed[i]===text[i] ? 'correct' : 'wrong');
    spans.push(`<span class="${cls}">${escapeHtml(ch)}</span>`);
  }
  testPass.innerHTML = spans.join('');
}
function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function computeLive(){
  const typed = testInput.value || '';
  testState.typed = typed;
  const target = testState.original || '';
  let correct=0;
  for(let i=0;i<typed.length;i++) if(typed[i]===target[i]) correct++;
  const total = typed.length;
  const accuracy = total? Math.round((correct/total)*10000)/100 : 0;
  const elapsed = Math.max(1, Math.floor((Date.now()-testState.startTs)/1000));
  const mins = Math.max(elapsed/60, 1/60);
  const words = typed.trim().split(/\s+/).filter(Boolean).length;
  const wpm = Math.round(words/mins);
  document.getElementById('tWpm').innerText = wpm;
  document.getElementById('tAcc').innerText = accuracy;
}

/* finish test & save */
function finishTest(){
  if(testState.interval) clearInterval(testState.interval);
  const typed = testState.typed || '';
  const target = testState.original || '';
  let correct=0;
  for(let i=0;i<typed.length;i++) if(typed[i]===target[i]) correct++;
  const total = typed.length;
  const accuracy = total? Math.round((correct/total)*10000)/100 : 0;
  const elapsed = Math.max(1, Math.floor((Date.now()-testState.startTs)/1000));
  const mins = Math.max(elapsed/60,1/60);
  const words = typed.trim().split(/\s+/).filter(Boolean).length;
  const wpm = Math.round(words/mins);

  // save to user
  const uid = getCurrent();
  if(uid){
    const users = readUsers();
    const u = users.find(x=>x.id===uid);
    if(u){
      const rec = { id:'r'+Date.now(), wpm, accuracy, elapsed, date:new Date().toISOString(), passage:testState.original.slice(0,200)};
      u.results = u.results||[]; u.results.unshift(rec);
      writeUsers(users);
      alert('Test saved — WPM: '+wpm+' Accuracy: '+accuracy+'%');
    }
  } else {
    alert('Test finished — Login to save results');
  }
  renderMyResults(); renderLeaderBoard();
  showPage('results');
}

/* cancel */
function cancelTest(){ if(testState.interval) clearInterval(testState.interval); showPage('home'); }

/* ---------- Results & leaderboard ---------- */
function renderMyResults(){
  const uid = getCurrent();
  const el = document.getElementById('myResultsList');
  el.innerHTML='';
  if(!uid){ el.innerHTML='<p class="muted">Login to see results</p>'; return; }
  const users = readUsers(); const u = users.find(x=>x.id===uid);
  if(!u || !u.results || u.results.length===0){ el.innerHTML='<p class="muted">No attempts yet</p>'; return; }
  u.results.forEach(r=>{
    const div = document.createElement('div'); div.className='test-card';
    div.innerHTML = `<strong>${r.wpm} WPM</strong><div class="muted small">${(new Date(r.date)).toLocaleString()}</div><div class="muted small">${r.passage.slice(0,120)}...</div>`;
    el.appendChild(div);
  });
}
function renderLeaderBoard(){
  const container = document.getElementById('leaderboardList') || document.createElement('div');
  if(!document.getElementById('leaderboardList')) return;
  container.innerHTML='';
  const users = readUsers();
  let all = [];
  users.forEach(u=> (u.results||[]).forEach(r=> all.push({user:u.name||u.mobile,wpm:r.wpm,acc:r.accuracy,date:r.date})));
  all.sort((a,b)=>b.wpm - a.wpm);
  if(all.length===0){ container.innerHTML='<p class="muted">No results yet</p>'; return; }
  all.slice(0,50).forEach(r=>{
    const d = document.createElement('div'); d.className='leader-item';
    d.innerHTML = `<div><strong>${r.user}</strong><div class="small muted">${r.wpm} WPM • ${r.acc}%</div></div><div class="small muted">${(new Date(r.date)).toLocaleDateString()}</div>`;
    container.appendChild(d);
  });
}

/* ---------- helper: load profile fields ---------- */
function loadProfileFields(){
  const uid = getCurrent();
  if(!uid) return;
  const users = readUsers();
  const u = users.find(x=>x.id===uid);
  if(!u) return;
  document.getElementById('pfName').value = u.name || '';
  document.getElementById('pfMobile').value = u.mobile || '';
  document.getElementById('pfEmail').value = u.email || '';
  document.getElementById('pfDistrict').value = u.district || '';
  document.getElementById('pfState').value = u.state || '';
  // set avatars
  const av = u.avatar || ('https://ui-avatars.com/api/?name='+encodeURIComponent(u.name)+'&background=7c3aed&color=fff');
  sideAvatar.src = av; topAvatar.src = av; profileBig.src = av;
}

/* ---------- initial UI state ---------- */
window.addEventListener('load', ()=>{
  const cur = getCurrent();
  if(cur){
    const u = readUsers().find(x=>x.id===cur);
    if(u){ renderLoggedIn(u); return; }
  }
  // else show auth
  authArea.classList.remove('hidden');
  appArea.classList.add('hidden');
  renderTests();
});

/* expose beginTestById for on-page buttons */
window.beginTestById = beginTestById;
