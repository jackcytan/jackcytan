/* Bản Đồ Kiếm Tiền — ứng dụng — © Tân AI */
(function(){
"use strict";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const CAT=Object.fromEntries(CATS.map(c=>[c.id,c]));
const ORDER=Object.fromEntries(M.map((m,i)=>[m.id,i]));
const BYID=Object.fromEntries(M.map(m=>[m.id,m]));
const norm=s=>(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/đ/g,"d");
M.forEach(m=>{m._s=norm([m.n,m.d,CAT[m.c].n,m.inc,(m.s||[]).map(k=>SKILL[k]).join(" "),m.st.join(" "),m.tip].join(" "))});
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

/* ---------- storage (an toàn) ---------- */
const store={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let favs=new Set(store.get("bdkt_fav",[]));

/* ---------- theme ---------- */
const root=document.documentElement;
function setTheme(t){root.setAttribute("data-theme",t);$("#themeBtn").textContent=t==="dark"?"🌙":"☀️";store.set("bdkt_theme",t);document.querySelector('meta[name="theme-color"]').content=t==="dark"?"#07090f":"#f6f4ee"}
setTheme(store.get("bdkt_theme",(window.matchMedia&&matchMedia("(prefers-color-scheme: light)").matches)?"light":"dark"));
$("#themeBtn").onclick=()=>setTheme(root.getAttribute("data-theme")==="dark"?"light":"dark");

/* ---------- toast ---------- */
let tt;function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(tt);tt=setTimeout(()=>t.classList.remove("show"),2200)}

/* ---------- helpers ---------- */
const bars=(n,color)=>`<span class="bars" style="--mc:${color}">${[1,2,3,4,5].map(i=>`<i class="${i<=n?"f":""}"></i>`).join("")}</span>`;
const kCol=k=>k<=2?"var(--em)":k<=3?"var(--gold)":"var(--rose)";
const KTXT=["","Rất dễ","Dễ","Trung bình","Khó","Rất khó"];
const RTXT=["","Rất thấp","Thấp","Trung bình","Cao","Rất cao"];

/* ---------- counters ---------- */
function countUp(el,to){let s=null;const d=1200;function f(t){if(!s)s=t;const p=Math.min((t-s)/d,1);el.textContent=Math.round(to*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(f)}requestAnimationFrame(f)}
$$("[data-count]").forEach(el=>countUp(el,el.dataset.count==="methods"?M.length:CATS.length));

/* ---------- categories ---------- */
$("#catGrid").innerHTML=CATS.map(c=>{const n=M.filter(m=>m.c===c.id).length;return `<button class="cat reveal" style="--c:${c.c}" data-cat="${c.id}"><div class="ic">${c.i}</div><h3>${c.n}</h3><p>${c.d}</p><span class="cnt">${n} cách kiếm tiền →</span></button>`}).join("");
$("#catGrid").onclick=e=>{const b=e.target.closest("[data-cat]");if(!b)return;resetFilters();state.cat=b.dataset.cat;syncUI();render();go("#explore")};

/* ---------- explorer state ---------- */
const state={cat:"all",q:"",von:9,sort:"pop",mode:"all",passive:false,fav:false,shown:24,maxK:9,maxR:9};
function resetFilters(){Object.assign(state,{cat:"all",q:"",von:9,sort:"pop",mode:"all",passive:false,fav:false,shown:24,maxK:9,maxR:9})}
$("#catPills").innerHTML=`<button class="pill" data-c="all">✦ Tất cả</button>`+CATS.map(c=>`<button class="pill" data-c="${c.id}">${c.i} ${c.n}</button>`).join("");
$("#catPills").onclick=e=>{const b=e.target.closest("[data-c]");if(!b)return;state.cat=b.dataset.c;state.shown=24;syncUI();render()};
let qT;$("#q").oninput=e=>{clearTimeout(qT);qT=setTimeout(()=>{state.q=e.target.value;state.shown=24;render()},120)};
$("#fVon").onchange=e=>{state.von=+e.target.value;state.shown=24;render()};
$("#fSort").onchange=e=>{state.sort=e.target.value;render()};
$("#fMode").onclick=e=>{const b=e.target.closest("button");if(!b)return;state.mode=b.dataset.v;state.shown=24;syncUI();render()};
$("#fPassive").onclick=()=>{state.passive=!state.passive;state.shown=24;syncUI();render()};
$("#fFav").onclick=()=>{state.fav=!state.fav;state.shown=24;syncUI();render()};
$("#moreBtn").onclick=()=>{state.shown+=24;render()};

function syncUI(){
 $$("#catPills .pill").forEach(p=>p.classList.toggle("on",p.dataset.c===state.cat));
 $$("#fMode button").forEach(b=>b.classList.toggle("on",b.dataset.v===state.mode));
 $("#fPassive").classList.toggle("on",state.passive);
 $("#fFav").classList.toggle("on",state.fav);
 $("#q").value=state.q;$("#fVon").value=String(state.von);$("#fSort").value=state.sort;
 const act=$("#catPills .pill.on"),cp=$("#catPills");if(act)cp.scrollTo({left:act.offsetLeft-cp.clientWidth/2+act.offsetWidth/2,behavior:"smooth"});
}
function filtered(){
 const words=norm(state.q).split(/\s+/).filter(Boolean);
 let list=M.filter(m=>(state.cat==="all"||m.c===state.cat)&&m.v<=state.von&&m.k<=state.maxK&&m.r<=state.maxR&&(state.mode==="all"||m.m===state.mode||m.m==="mix")&&(!state.passive||m.p)&&(!state.fav||favs.has(m.id))&&words.every(w=>m._s.includes(w)));
 const by={pop:(a,b)=>ORDER[a.id]-ORDER[b.id],von:(a,b)=>a.v-b.v||a.k-b.k,k:(a,b)=>a.k-b.k||a.v-b.v,r:(a,b)=>a.r-b.r||a.v-b.v,az:(a,b)=>a.n.localeCompare(b.n,"vi")};
 return list.sort(by[state.sort]);
}
function card(m,i){const c=CAT[m.c];return `<article class="card" style="--c:${c.c};animation-delay:${Math.min(i,12)*30}ms" data-id="${m.id}" tabindex="0">
 <button class="fav ${favs.has(m.id)?"on":""}" data-fav="${m.id}" aria-label="Lưu">${favs.has(m.id)?"❤️":"🤍"}</button>
 <div class="card-top"><div class="em">${m.i}</div><div><div class="ctag">${c.n}</div><h3>${esc(m.n)}</h3></div></div>
 <p>${esc(m.d)}</p>
 <div class="meta"><span class="tag y">💰 ${VON_S[m.v]}</span><span class="tag">${MODE[m.m]}</span><span class="tag ${m.k<=2?"g":m.k>=4?"r":""}">${KTXT[m.k]}</span>${m.p?'<span class="tag g">💤 Thụ động</span>':""}</div>
</article>`}
function render(){
 const list=filtered(),g=$("#grid");
 const parts=[];if(state.cat!=="all")parts.push(CAT[state.cat].n);if(state.q)parts.push(`“${esc(state.q)}”`);if(state.fav)parts.push("đã lưu");
 $("#resultInfo").innerHTML=`Tìm thấy <b>${list.length}</b> cách kiếm tiền${parts.length?" · "+parts.join(" · "):""}${(state.maxK<9||state.maxR<9)?' · <a href="#" id="clearPre" style="color:var(--gold)">bỏ lọc nhanh ✕</a>':""}`;
 const cp=$("#clearPre");if(cp)cp.onclick=e=>{e.preventDefault();state.maxK=9;state.maxR=9;render()};
 g.innerHTML=list.length?list.slice(0,state.shown).map(card).join(""):`<div class="empty"><div>${state.fav?"🤍":"🧭"}</div>${state.fav?"Bạn chưa lưu cách kiếm tiền nào. Bấm 🤍 trên thẻ để lưu lại.":"Không tìm thấy kết quả phù hợp. Thử bỏ bớt bộ lọc nhé!"}</div>`;
 $("#moreBtn").hidden=list.length<=state.shown;
 if(!$("#moreBtn").hidden)$("#moreBtn").textContent=`Xem thêm (${list.length-state.shown})`;
}
$("#grid").addEventListener("click",e=>{const f=e.target.closest("[data-fav]");if(f){e.stopPropagation();toggleFav(f.dataset.fav);return}const c=e.target.closest(".card");if(c)openM(c.dataset.id)});
$("#grid").addEventListener("keydown",e=>{if(e.key==="Enter"){const c=e.target.closest(".card");if(c)openM(c.dataset.id)}});

/* ---------- favorites ---------- */
function toggleFav(id){favs.has(id)?favs.delete(id):favs.add(id);store.set("bdkt_fav",[...favs]);updFav();toast(favs.has(id)?"Đã lưu vào danh sách ♥":"Đã bỏ lưu");render();if($("#modal").classList.contains("open")&&cur===id)openM(id,true)}
function updFav(){const n=favs.size,b=$("#favCount");b.hidden=!n;b.textContent=n}
updFav();
$("#favBtn").onclick=()=>{resetFilters();state.fav=true;syncUI();render();go("#explore")};

/* ---------- modal ---------- */
let cur=null,lastFocus=null;
function openM(id,keep){
 const m=BYID[id];if(!m)return;cur=id;const c=CAT[m.c];
 if(!keep)lastFocus=document.activeElement;
 const rel=M.filter(x=>x.c===m.c&&x.id!==m.id).slice(0,8);
 $("#sheet").style.setProperty("--c",c.c);
 $("#sheet").innerHTML=`<div class="sheet-hd">
  <div class="x"><button class="icon-btn" data-act="share" title="Sao chép liên kết">🔗</button><button class="icon-btn" data-act="fav" title="Lưu">${favs.has(id)?"❤️":"🤍"}</button><button class="icon-btn" data-act="close" title="Đóng">✕</button></div>
  <div class="em">${m.i}</div><div class="ctag" style="color:${c.c};font-weight:700;font-size:13px">${c.i} ${c.n}</div>
  <h2>${esc(m.n)}</h2><p>${esc(m.d)}</p></div>
 <div class="sheet-bd">
  <div class="kpis">
   <div class="kpi"><small>Vốn khởi đầu</small><b>${VON[m.v]}</b></div>
   <div class="kpi"><small>Thu nhập tham khảo</small><b>${esc(m.inc)}</b></div>
   <div class="kpi"><small>Thời gian có tiền</small><b>${esc(m.t)}</b></div>
   <div class="kpi"><small>Hình thức</small><b>${MODE[m.m]}${m.p?" · Thụ động":" · Chủ động"}</b></div>
   <div class="kpi"><small>Độ khó</small><b>${KTXT[m.k]}</b>${bars(m.k,kCol(m.k))}</div>
   <div class="kpi"><small>Rủi ro</small><b>${RTXT[m.r]}</b>${bars(m.r,kCol(m.r))}</div>
   <div class="kpi" style="grid-column:span 2"><small>Kỹ năng phù hợp</small><b>${m.s.map(k=>SKILL[k]).join(" · ")}</b></div>
  </div>
  <div class="blk"><h4>🚀 Các bước bắt đầu</h4><ol class="steps-list">${m.st.map(s=>`<li>${esc(s)}</li>`).join("")}</ol></div>
  <div class="blk"><h4>⚖️ Ưu & nhược điểm</h4><div class="pc"><ul class="pro">${m.pro.map(s=>`<li>${esc(s)}</li>`).join("")}</ul><ul class="con">${m.con.map(s=>`<li>${esc(s)}</li>`).join("")}</ul></div></div>
  <div class="blk"><h4>💡 Lời khuyên từ Tân AI</h4><div class="tip">${esc(m.tip)}</div></div>
  ${rel.length?`<div class="blk"><h4>🧭 Cùng lĩnh vực</h4><div class="related">${rel.map(r=>`<button data-rel="${r.id}">${r.i} ${esc(r.n)}</button>`).join("")}</div></div>`:""}
 </div>`;
 const md=$("#modal");md.classList.add("open");md.setAttribute("aria-hidden","false");document.body.style.overflow="hidden";
 if(!keep){md.scrollTop=0;try{history.replaceState(null,"","#m-"+id)}catch(e){}}
 const cb=$('[data-act="close"]');if(cb&&!keep)cb.focus({preventScroll:true});
}
function closeM(){const md=$("#modal");md.classList.remove("open");md.setAttribute("aria-hidden","true");document.body.style.overflow="";cur=null;try{history.replaceState(null,"",location.pathname+location.search)}catch(e){}if(lastFocus&&lastFocus.focus)lastFocus.focus({preventScroll:true})}
$("#modal").addEventListener("click",e=>{
 if(e.target.id==="modal")return closeM();
 const a=e.target.closest("[data-act]");
 if(a){const act=a.dataset.act;if(act==="close")closeM();else if(act==="fav")toggleFav(cur);else if(act==="share"){const url=location.href.split("#")[0]+"#m-"+cur;(navigator.clipboard?navigator.clipboard.writeText(url):Promise.reject()).then(()=>toast("Đã sao chép liên kết 🔗"),()=>toast(url))}return}
 const r=e.target.closest("[data-rel]");if(r){openM(r.dataset.rel);$("#modal").scrollTop=0}
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("#modal").classList.contains("open"))closeM()});

/* ---------- navigation ---------- */
function go(sel){const el=$(sel);if(el)el.scrollIntoView({behavior:"smooth"});$("#links").classList.remove("open")}
$("#menuBtn").onclick=()=>$("#links").classList.toggle("open");
$$("#links a").forEach(a=>a.addEventListener("click",()=>$("#links").classList.remove("open")));
$("#heroSearch").onsubmit=e=>{e.preventDefault();resetFilters();state.q=$("#heroQ").value.trim();syncUI();render();go("#explore")};
$("#chips").onclick=e=>{const b=e.target.closest("[data-preset]");if(!b)return;resetFilters();
 const p=b.dataset.preset;
 if(p==="nocap")state.von=0;else if(p==="online")state.mode="on";else if(p==="passive")state.passive=true;else if(p==="ai")state.q="AI";else if(p==="lowrisk"){state.maxR=2;state.sort="r"}else if(p==="easy"){state.maxK=2;state.sort="k"}
 syncUI();render();go("#explore")};
const totop=$("#toTop");totop.onclick=()=>window.scrollTo({top:0,behavior:"smooth"});
const secs=["cats","explore","quiz","tools","history","scam"];
window.addEventListener("scroll",()=>{totop.classList.toggle("show",scrollY>900);
 let on="";for(const s of secs){const el=document.getElementById(s);if(el&&el.getBoundingClientRect().top<140)on=s}
 $$("#links a").forEach(a=>a.classList.toggle("on",a.getAttribute("href")==="#"+on))},{passive:true});

/* ---------- reveal ---------- */
const io="IntersectionObserver" in window?new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){en.target.classList.add("in");io.unobserve(en.target)}}),{threshold:.08,rootMargin:"0px 0px -40px 0px"}):null;
function observe(){$$(".reveal:not(.in)").forEach(el=>io?io.observe(el):el.classList.add("in"))}

/* ---------- QUIZ ---------- */
const QS=[
 {k:"von",t:"Bạn có thể bỏ ra bao nhiêu vốn để bắt đầu?",o:[{v:0,i:"🪙",b:"Gần như 0đ",s:"Chỉ có thời gian và công sức"},{v:1,i:"💵",b:"Dưới 10 triệu",s:"Một khoản nhỏ để thử"},{v:2,i:"💰",b:"10 – 100 triệu",s:"Đủ để khởi sự kinh doanh nhỏ"},{v:4,i:"🏦",b:"Trên 100 triệu",s:"Sẵn sàng đầu tư lớn"}]},
 {k:"time",t:"Bạn dành được bao nhiêu thời gian?",o:[{v:"side",i:"🌙",b:"Vài giờ mỗi tuần",s:"Làm thêm ngoài giờ"},{v:"part",i:"⏳",b:"10 – 20 giờ/tuần",s:"Nghiêm túc nhưng chưa toàn thời gian"},{v:"full",i:"🔥",b:"Toàn thời gian",s:"Muốn biến nó thành nghề chính"},{v:"min",i:"🧘",b:"Càng ít càng tốt",s:"Muốn tiền tự làm việc"}]},
 {k:"mode",t:"Bạn thích làm việc theo hình thức nào?",o:[{v:"on",i:"💻",b:"Online tại nhà",s:"Chỉ cần máy tính, điện thoại"},{v:"off",i:"🏪",b:"Offline, gặp gỡ trực tiếp",s:"Thích không khí thực tế"},{v:"all",i:"🔀",b:"Cả hai đều được",s:"Linh hoạt"}]},
 {k:"risk",t:"Bạn chấp nhận rủi ro đến mức nào?",o:[{v:2,i:"🛡️",b:"An toàn là trên hết",s:"Không muốn mất tiền"},{v:3,i:"⚖️",b:"Vừa phải",s:"Chấp nhận dao động có kiểm soát"},{v:5,i:"🎢",b:"Mạo hiểm",s:"Rủi ro cao để lợi nhuận lớn"}]},
 {k:"skills",multi:true,t:"Thế mạnh của bạn là gì? (chọn nhiều)",o:Object.entries(SKILL).map(([v,b])=>({v,b,i:{tech:"💻",creative:"🎨",sales:"🗣️",hand:"🛠️",finance:"📊",teach:"🎓",care:"🤝"}[v],s:{tech:"Máy tính, phần mềm, AI",creative:"Thiết kế, viết, quay dựng",sales:"Thuyết phục, kết nối",hand:"Làm ra sản phẩm bằng tay",finance:"Số liệu, đầu tư",teach:"Giải thích, hướng dẫn",care:"Tận tâm, chu đáo"}[v]}))},
 {k:"goal",t:"Mục tiêu chính của bạn là gì?",o:[{v:"fast",i:"⚡",b:"Có thêm tiền nhanh",s:"Cần thu nhập trong 1–3 tháng"},{v:"career",i:"🧭",b:"Xây nghề nghiệp chính",s:"Thu nhập lớn, ổn định lâu dài"},{v:"passive",i:"💤",b:"Thu nhập thụ động",s:"Tiền đến cả khi ngủ"},{v:"wealth",i:"🏰",b:"Làm giàu dài hạn",s:"Tích lũy tài sản lớn"}]}
];
let qi=0,ans={skills:[]};
function quizRender(){
 const box=$("#quizBox");
 if(qi>=QS.length)return quizResult();
 const q=QS[qi],sel=ans[q.k];
 box.innerHTML=`<div class="progress"><i style="width:${qi/QS.length*100}%"></i></div>
 <div class="q-num">Câu ${qi+1} / ${QS.length}</div><div class="q-title">${q.t}</div>
 <div class="opts">${q.o.map(o=>{const on=q.multi?sel.includes(o.v):sel===o.v;return `<button class="opt ${on?"on":""}" data-v="${o.v}"><span class="oi">${o.i}</span><span><b>${o.b}</b><small>${o.s}</small></span></button>`}).join("")}</div>
 <div class="q-nav"><button class="btn btn-ghost" id="qBack" ${qi?"":"style=\"visibility:hidden\""}>← Quay lại</button>${q.multi?`<button class="btn btn-pri" id="qNext">${sel.length?"Tiếp tục →":"Bỏ qua →"}</button>`:"<span></span>"}</div>`;
 box.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{
  let v=b.dataset.v;if(!isNaN(v)&&v!=="")v=+v;
  if(q.multi){const a=ans[q.k];const i=a.indexOf(v);i>=0?a.splice(i,1):a.push(v);quizRender()}
  else{ans[q.k]=v;b.classList.add("on");setTimeout(()=>{qi++;quizRender()},220)}
 });
 const bk=$("#qBack");if(bk)bk.onclick=()=>{qi--;quizRender()};
 const nx=$("#qNext");if(nx)nx.onclick=()=>{qi++;quizRender()};
}
function score(m){
 let s=0;
 if(m.v>ans.von)return -999;
 s+=6-Math.abs(ans.von-m.v)*1.5;
 if(m.r>ans.risk)s-=(m.r-ans.risk)*14;else s+=4;
 if(ans.mode==="on"&&m.m==="off")s-=25;if(ans.mode==="off"&&m.m==="on")s-=25;if(ans.mode!=="all"&&m.m===ans.mode)s+=5;
 const sk=ans.skills||[];s+=m.s.filter(x=>sk.includes(x)).length*14;if(sk.length&&!m.s.some(x=>sk.includes(x)))s-=10;
 if(ans.time==="side"){if(m.k>=4)s-=10;if(m.p)s+=4;if(["sunghiep"].includes(m.c)&&!m.p)s-=4}
 if(ans.time==="min"){s+=m.p?18:-14}
 if(ans.time==="full"&&!m.p)s+=4;
 if(ans.goal==="fast"){s+=(m.k<=2?10:m.k===3?4:-8);if(/Ngay|tuần/.test(m.t))s+=10;if(/năm/.test(m.t))s-=10}
 if(ans.goal==="career"&&["freelance","sunghiep","dichvu","giaoduc","congnghe","noidung"].includes(m.c))s+=12;
 if(ans.goal==="passive")s+=m.p?20:-6;
 if(ans.goal==="wealth"&&["dautu","bds","thudong","kinhdoanh"].includes(m.c))s+=14;
 return s;
}
function quizResult(){
 const ranked=M.map(m=>({m,s:score(m)})).filter(x=>x.s>-999).sort((a,b)=>b.s-a.s);
 const top=ranked.slice(0,8),hi=top.length?top[0].s:1,lo=ranked.length?ranked[ranked.length-1].s:0;
 const pct=s=>Math.max(55,Math.min(98,Math.round(60+38*(s-lo)/Math.max(1,hi-lo))));
 const persona=ans.goal==="passive"||ans.time==="min"?["🧘","Nhà tích sản thông thái","Bạn muốn tiền làm việc thay mình. Ưu tiên xây tài sản tạo dòng tiền đều đặn."]:ans.goal==="wealth"?["🏰","Người kiến tạo tài sản","Bạn nhìn xa. Hãy kết hợp tăng thu nhập chủ động với đầu tư kỷ luật dài hạn."]:ans.goal==="fast"?["⚡","Chiến binh hành động","Bạn cần kết quả sớm. Hãy chọn việc bắt đầu được ngay, sau đó dùng thu nhập để học kỹ năng giá trị cao hơn."]:["🧭","Người xây sự nghiệp","Bạn muốn một con đường bền vững. Hãy chọn kỹ năng mũi nhọn và đào sâu trong 2–3 năm."];
 $("#quizBox").innerHTML=`<div class="progress"><i style="width:100%"></i></div>
 <div class="result-hd"><div class="emo">${persona[0]}</div><div class="q-num">Kết quả của bạn</div><div class="q-title" style="margin:6px 0">${persona[1]}</div><p style="color:var(--muted)">${persona[2]}</p></div>
 ${top.length?top.map((x,i)=>`<button class="rec" data-id="${x.m.id}"><span class="rk">${i+1}</span><span class="em">${x.m.i}</span><span class="info"><b>${esc(x.m.n)}</b><small>${CAT[x.m.c].n} · ${VON_S[x.m.v]} · ${KTXT[x.m.k]}</small></span><span class="match">${pct(x.s)}%</span></button>`).join(""):'<p style="text-align:center;color:var(--muted)">Chưa có phương án phù hợp, hãy thử nới điều kiện.</p>'}
 <div class="q-nav"><button class="btn btn-ghost" id="qRe">↻ Làm lại</button><button class="btn btn-pri" id="qSave">♥ Lưu tất cả gợi ý</button></div>`;
 $$("#quizBox .rec").forEach(b=>b.onclick=()=>openM(b.dataset.id));
 $("#qRe").onclick=()=>{qi=0;ans={skills:[]};quizRender()};
 $("#qSave").onclick=()=>{top.forEach(x=>favs.add(x.m.id));store.set("bdkt_fav",[...favs]);updFav();render();toast(`Đã lưu ${top.length} gợi ý vào danh sách ♥`)};
}
quizRender();

/* ---------- TOOLS ---------- */
const fmt=n=>{const a=Math.abs(n);if(a>=1e9)return (n/1e9).toLocaleString("vi-VN",{maximumFractionDigits:2})+" tỷ";if(a>=1e6)return (n/1e6).toLocaleString("vi-VN",{maximumFractionDigits:1})+" triệu";return Math.round(n).toLocaleString("vi-VN")+"đ"};
const tr=v=>fmt(v*1e6);
$("#toolTabs").onclick=e=>{const b=e.target.closest("[data-t]");if(!b)return;$$("#toolTabs .pill").forEach(p=>p.classList.toggle("on",p===b));$$(".tool").forEach(t=>t.classList.toggle("on",t.id==="t-"+b.dataset.t))};

function compound(){
 const P=+$("#cP").value*1e6,C=+$("#cC").value*1e6,R=+$("#cR").value,N=+$("#cN").value,i=R/100/12;
 $("#cPv").textContent=fmt(P);$("#cCv").textContent=fmt(C)+"/tháng";$("#cRv").textContent=R+"%";$("#cNv").textContent=N+" năm";
 const rows=[];let bal=P,inv=P;
 for(let y=1;y<=N;y++){for(let k=0;k<12;k++){bal=bal*(1+i)+C;inv+=C}rows.push({bal,inv})}
 $("#cYears").textContent=N+" năm";$("#cFV").textContent=fmt(bal);$("#cIn").textContent=fmt(inv);$("#cInt").textContent=fmt(bal-inv);
 $("#c72").textContent="≈ "+(72/R).toLocaleString("vi-VN",{maximumFractionDigits:1})+" năm";$("#cPct").textContent=bal>0?Math.round((bal-inv)/bal*100)+"%":"0%";
 const W=600,H=220,max=Math.max(1,...rows.map(r=>r.bal)),bw=W/rows.length,gap=Math.min(6,bw*.25);
 $("#cChart").innerHTML=rows.map((r,k)=>{const x=k*bw+gap/2,w=bw-gap,hi=r.inv/max*(H-10),ht=r.bal/max*(H-10);return `<rect x="${x}" y="${H-ht}" width="${w}" height="${Math.max(0,ht-hi)}" rx="3" fill="var(--gold)"><title>Năm ${k+1}: ${fmt(r.bal)}</title></rect><rect x="${x}" y="${H-hi}" width="${w}" height="${hi}" rx="3" fill="var(--sky)" opacity=".85"><title>Năm ${k+1}: gốc ${fmt(r.inv)}</title></rect>`}).join("");
}
["cP","cC","cR","cN"].forEach(id=>$("#"+id).addEventListener("input",compound));

function fire(){
 const E=+$("#fE").value*1e6,S=+$("#fS").value*1e6,C=+$("#fC").value*1e6,R=+$("#fR").value,i=R/100/12;
 $("#fEv").textContent=fmt(E)+"/tháng";$("#fSv").textContent=fmt(S);$("#fCv").textContent=fmt(C)+"/tháng";$("#fRv").textContent=R+"%";
 const T=E*12*25;$("#fTarget").textContent=fmt(T);
 let b=S,mo=0;while(b<T&&mo<1200){b=b*(1+i)+C;mo++}
 const prog=Math.min(100,S/T*100);
 $("#fYears").textContent=S>=T?"Bạn đã tự do! 🎉":mo>=1200?"Hơn 100 năm 😅":`${Math.floor(mo/12)} năm ${mo%12} tháng`;
 $("#fPassiveOut").textContent=fmt(S*0.04/12)+"/tháng";
 $("#fProg").textContent=prog.toLocaleString("vi-VN",{maximumFractionDigits:1})+"%";
 $("#fBar").style.width=prog+"%";
 const need=E+C>0?Math.round(C/(E+C)*100):0;$("#fRate").textContent=need+"% thu nhập";
 const yrs=mo/12;
 $("#fTip").innerHTML=yrs>30?"<b>Gợi ý:</b> Thời gian còn dài. Tăng thu nhập chủ động (nghề tay trái, kỹ năng mới) để nâng tiền đầu tư mỗi tháng là đòn bẩy mạnh nhất.":yrs>15?"<b>Gợi ý:</b> Bạn đang đi đúng hướng. Mỗi 1 triệu tăng thêm vào khoản đầu tư hằng tháng có thể rút ngắn nhiều năm.":"<b>Tuyệt vời!</b> Kế hoạch rất khả thi. Hãy giữ kỷ luật, đa dạng hóa và tránh rủi ro không cần thiết.";
}
["fE","fS","fC","fR"].forEach(id=>$("#"+id).addEventListener("input",fire));

const JARS=[["NEC","Thiết yếu",55,"#5cc8ff","Ăn uống, nhà ở, đi lại, hóa đơn"],["FFA","Tự do tài chính",10,"#f5c451","Đầu tư tạo thu nhập thụ động — không tiêu gốc"],["LTSS","Tiết kiệm dài hạn",10,"#2ee6a6","Mua nhà, xe, quỹ dự phòng"],["EDU","Giáo dục",10,"#a78bfa","Sách, khóa học, phát triển bản thân"],["PLAY","Hưởng thụ",10,"#ff7ad9","Du lịch, giải trí — phải tiêu hết mỗi tháng"],["GIVE","Cho đi",5,"#ff9f5a","Từ thiện, giúp đỡ người thân"]];
function jars(){const I=+$("#jI").value*1e6;$("#jIv").textContent=fmt(I)+"/tháng";
 $("#jars").innerHTML=JARS.map(j=>`<div class="jar" style="--jc:${j[3]}"><div class="fill" style="height:${j[2]/55*100}%"></div><span class="pct">${j[2]}% · ${j[0]}</span><b>${j[1]}</b><div class="amt">${fmt(I*j[2]/100)}</div><small>${j[4]}</small></div>`).join("")}
$("#jI").addEventListener("input",jars);
compound();fire();jars();

/* ---------- history / principles / scams ---------- */
$("#timeline").innerHTML=HISTORY.map(h=>`<div class="tl reveal"><div class="tl-card"><div class="yr">${h.y}</div><h4>${h.t}</h4><p>${h.d}</p><div class="les">${h.l}</div></div></div>`).join("");
$("#princ").innerHTML=PRINCIPLES.map(p=>`<div class="pr reveal"><div class="n grad-text">${p.n}</div><h4>${p.t}</h4><p>${p.d}</p></div>`).join("");
$("#scams").innerHTML=SCAMS.map(s=>`<div class="scam reveal"><div class="ic">${s.i}</div><h4>${s.t}</h4><p>${s.d}</p><div class="sign">${s.s}</div></div>`).join("");
$("#flags").innerHTML=FLAGS.map(f=>`<li>${f}</li>`).join("");
$("#yr").textContent=new Date().getFullYear();

/* ---------- init ---------- */
syncUI();render();observe();
const mh=location.hash.match(/^#m-(.+)$/);if(mh&&BYID[mh[1]])setTimeout(()=>openM(mh[1]),300);
window.addEventListener("hashchange",()=>{const h=location.hash.match(/^#m-(.+)$/);if(h&&BYID[h[1]])openM(h[1])});
})();
