import{t as l,u as w,e as r,f,h as b,w as I,b as E,i as B,a as y,j as v,k}from"./main.js";let m=null;function p(){const n=E(),a=document.getElementById("letterList"),e=Object.fromEntries(y().map(t=>[t.id,t.name]));if(document.getElementById("statLetters").textContent=n.length,document.getElementById("statLetterCvs").textContent=y().length,!n.length){a.innerHTML=`<div class="text-center py-5">
      <i class="ti ti-mail fs-1 text-secondary"></i>
      <h3 class="h6 mt-3">${l("ltr.noletters")}</h3>
      <p class="text-secondary small">${l("ltr.nolettersSub")}</p>
    </div>`;return}a.innerHTML=n.map(t=>`
    <div class="list-group-item p-3">
      <div class="d-flex flex-column flex-md-row gap-2 align-items-md-center">
        <div class="icon-shape icon-md bg-info bg-opacity-10 text-info rounded-2 flex-shrink-0"><i class="ti ti-mail fs-4"></i></div>
        <div class="flex-grow-1">
          <strong>${r(t.jobTitle)} — ${r(t.company)}</strong>
          <span class="badge bg-light text-secondary border ms-1">${r(t.lang)}</span><br>
          <small class="text-secondary">${l("ltr.from")} ${r(e[t.cvId]||"CV")} · Updated ${v(t.updatedAt)}</small>
        </div>
        <div class="d-flex gap-1 flex-shrink-0">
          <button class="btn btn-sm btn-outline-primary" data-act="edit" data-id="${t.id}" title="Edit"><i class="ti ti-edit"></i></button>
          <button class="btn btn-sm btn-outline-secondary" data-act="dl" data-id="${t.id}" title="Download .doc"><i class="ti ti-download"></i></button>
          <a class="btn btn-sm btn-outline-success" target="_blank" rel="noopener" title="Share via WhatsApp" href="${I(t.body)}"><i class="ti ti-brand-whatsapp"></i></a>
          <button class="btn btn-sm btn-outline-danger" data-act="del" data-id="${t.id}" title="Delete"><i class="ti ti-trash"></i></button>
        </div>
      </div>
    </div>`).join("")}function h(){const n=document.getElementById("letterCv");n.innerHTML=y().map(a=>`<option value="${r(a.id)}">${r(a.name)}</option>`).join("")||'<option value="">No CVs yet — create one first</option>'}function g(){const n=y(),a=n.find(e=>e.id===document.getElementById("letterCv").value)||n[0];return{cvId:a?a.id:"",cvName:a?a.name.split("—")[0].trim():"Your Name",jobTitle:document.getElementById("letterJob").value.trim(),company:document.getElementById("letterCompany").value.trim(),manager:document.getElementById("letterManager").value.trim(),lang:document.querySelector('input[name="letterLang"]:checked').value}}function u(){const n=g();document.getElementById("letterBody").value=k(n)}const $=new Set("the,a,an,and,or,for,with,you,your,our,are,will,have,has,who,can,all,from,that,this,shall,should,would,position,role,work,team,company,job,required,requirements,experience,skills,ability,strong,plus,must,join,looking,seeking,ideal,apply,bank,tz,ajira,kazi,katika,kwa,na,ya,za,wa,hii,hiyo,kama,ili,ni,sana,tena,yetu,yako,yao,mimi,sisi,wewe,also,into,over,under,more,most,very,just,than,about,them,they,their,been,were,was,had,not,but".split(","));function L(n,a=3){const e={};return(String(n).toLowerCase().match(/[a-z]{5,}/g)||[]).forEach(t=>{$.has(t)||(e[t]=(e[t]||0)+1)}),Object.entries(e).sort((t,i)=>i[1]-t[1]).slice(0,a).map(([t])=>t.replace(/^\w/,i=>i.toUpperCase()))}function C(n,a,e){const t=n.jobTitle||"the advertised position",i=n.company||"your organisation",o=n.manager,d=String(e).split(/[.\n]+/).map(s=>s.trim()).filter(Boolean)[0]||(n.lang==="SW"?"uzoefu wangu":"my experience"),c=a.length?a.join(", "):n.lang==="SW"?"sifa muhimu":"key requirements";return n.lang==="SW"?`${v(new Date)}
${o||"Meneja wa Ajira"}
${i}
Dar es Salaam, Tanzania

Ndugu Meneja,

YAH: MAOMBI YA KAZI YA ${t.toUpperCase()}

Mimi, ${n.cvName}, ninaomba kazi ya ${t} kama ilivyotangazwa.

Kutokana na historia yangu — ${d} — ninafaa mahitaji yako muhimu (${c}). Wasifu wangu (CV) nilioambatanisha unaeleza elimu, ujuzi na uzoefu wangu zaidi.

Nitafurahi kupata fursa ya kujadili maombi yangu kwenye usaili.

Wako mtiifu,
${n.cvName}
Viambatanisho: CV`:`${v(new Date)}
${o||"The Hiring Manager"}
${i}
Dar es Salaam, Tanzania

Dear ${o||"Sir/Madam"},

RE: APPLICATION FOR THE POSITION OF ${t.toUpperCase()}

I, ${n.cvName}, wish to apply for the above position as advertised.

Drawing from my background — ${d} — I am a strong match for your key requirements (${c}). My CV, attached herewith, outlines my education, skills and experience in more detail.

I would welcome the opportunity to discuss my application at an interview.

Yours faithfully,
${n.cvName}
Attachments: CV`}document.addEventListener("DOMContentLoaded",()=>{if(!document.getElementById("letterList"))return;h(),p(),u();let n=null;try{n=localStorage.getItem("mrcv.letterMode")||null}catch{}const a=e=>{n=e;try{localStorage.setItem("mrcv.letterMode",e||"")}catch{}document.getElementById("modeChooser").classList.toggle("d-none",!!e),document.getElementById("aiPanel").classList.toggle("d-none",e!=="ai"),document.getElementById("modeChip").classList.toggle("d-none",!e),e&&(document.getElementById("modeName").textContent=e==="ai"?l("mode.ai"):l("mode.manual"))};a(n),document.querySelectorAll("#modeChooser [data-mode]").forEach(e=>e.addEventListener("click",()=>a(e.dataset.mode))),document.getElementById("modeChange").addEventListener("click",()=>a(null)),document.getElementById("aiGenLetter").addEventListener("click",()=>{const e=g();if(!e.jobTitle||!e.company){window.alert(l("ltr.needBoth"));return}const t=L(document.getElementById("aiAd").value),i=document.getElementById("aiBg").value;document.getElementById("letterBody").value=C(e,t,i),document.getElementById("aiKeys").textContent=t.length?`${l("ai2.matched")} ${t.join(", ")}`:"",document.getElementById("generator").scrollIntoView({behavior:"smooth"})}),["letterCv","letterJob","letterCompany","letterManager"].forEach(e=>document.getElementById(e).addEventListener("input",u)),document.querySelectorAll('input[name="letterLang"]').forEach(e=>e.addEventListener("change",u)),document.getElementById("letterNew").addEventListener("click",()=>{m=null,document.getElementById("letterForm").reset(),h(),u(),document.getElementById("generator").scrollIntoView({behavior:"smooth"})}),document.getElementById("letterSave").addEventListener("click",()=>{const e=g();if(!e.jobTitle||!e.company){window.alert(l("ltr.needBoth"));return}w({id:m,cvId:e.cvId,jobTitle:e.jobTitle,company:e.company,lang:e.lang,body:document.getElementById("letterBody").value}),m=null,p()}),document.getElementById("letterDl").addEventListener("click",async()=>{const e=g(),t=document.getElementById("letterBody").value,i=`Cover-Letter-${e.jobTitle||"draft"}`,o=t.split(`
`).map(s=>s.trim()?`<p>${r(s.trim())}</p>`:"").join("");await f("docx",{html:o,css:"body{font-family:Georgia,serif;font-size:12pt;color:#111;}p{margin:0 0 8pt;}",filename:i})||b(`${i}.doc`,t,{headline:!1})}),document.getElementById("letterWa").addEventListener("click",e=>{e.preventDefault(),window.open(I(document.getElementById("letterBody").value),"_blank","noopener")}),document.getElementById("letterList").addEventListener("click",async e=>{const t=e.target.closest("[data-act]");if(!t)return;const o=E().find(d=>d.id===t.dataset.id);if(o){if(t.dataset.act==="del"){if(!window.confirm(l("ltr.delConfirm")))return;B(o.id),p()}if(t.dataset.act==="dl"){const d=o.body.split(`
`).map(s=>s.trim()?`<p>${r(s.trim())}</p>`:"").join("");await f("docx",{html:d,css:"body{font-family:Georgia,serif;font-size:12pt;}p{margin:0 0 8pt;}",filename:`Cover-Letter-${o.jobTitle}`})||b(`Cover-Letter-${o.jobTitle}.doc`,o.body,{headline:!1})}t.dataset.act==="edit"&&(m=o.id,h(),document.getElementById("letterCv").value=o.cvId,document.getElementById("letterJob").value=o.jobTitle,document.getElementById("letterCompany").value=o.company,document.querySelector(`input[name="letterLang"][value="${o.lang}"]`).checked=!0,document.getElementById("letterBody").value=o.body,document.getElementById("generator").scrollIntoView({behavior:"smooth"}))}})});
