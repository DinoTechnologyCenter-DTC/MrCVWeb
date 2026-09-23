import{l as u,t as s,m as g,o as x,a as c,b as p,e as d,p as h,j as b,w as f}from"./main.js";function y(e){return{graduate:"Graduate",government:"Govt/NGO",banking:"Banking",general:"General",clinical:"Clinical",barua:"Barua"}[e]||e}function o(){const e=c(),a=p(),t=e.length?Math.round(e.reduce((i,l)=>i+(l.match||0),0)/e.length):0,n=e.reduce((i,l)=>i+(l.downloads||0),0);document.getElementById("statCvs").textContent=e.length,document.getElementById("statLetters").textContent=a.length,document.getElementById("statMatch").textContent=e.length?`${t}%`:"—",document.getElementById("statDownloads").textContent=n}function r(){const e=c(),a=document.getElementById("cvList");if(!e.length){a.innerHTML=`
      <div class="text-center py-5">
        <i class="ti ti-files fs-1 text-secondary"></i>
        <h3 class="h6 mt-3">${s("idx.emptyT")}</h3>
        <p class="text-secondary small">${s("idx.emptyS")}</p>
        <a href="new-cv.html" class="btn btn-primary btn-sm"><i class="ti ti-plus"></i> ${s("idx.createFirst")}</a>
      </div>`;return}a.innerHTML=e.map(t=>`
    <div class="list-group-item p-3 d-flex flex-column flex-md-row gap-3 align-items-md-center">
      <div class="icon-shape icon-md bg-primary bg-opacity-10 text-primary rounded-2 flex-shrink-0">
        <i class="ti ti-file-text fs-4"></i>
      </div>
      <div class="flex-grow-1">
        <div class="d-flex flex-wrap align-items-center gap-2">
          <strong>${d(t.name)}</strong>
          ${h(t.match||0)}
          <span class="badge bg-light text-secondary border">${d(y(t.template))}</span>
        </div>
        <small class="text-secondary">${d(t.target||"")} · Updated ${b(t.updatedAt)} · ${t.downloads||0} downloads</small>
      </div>
      <div class="d-flex gap-1 flex-shrink-0">
        <a href="new-cv.html?id=${encodeURIComponent(t.id)}" class="btn btn-sm btn-outline-primary" title="Open"><i class="ti ti-edit"></i></a>
        <button class="btn btn-sm btn-outline-secondary" data-act="dup" data-id="${d(t.id)}" title="Duplicate"><i class="ti ti-copy"></i></button>
        <a class="btn btn-sm btn-outline-success" target="_blank" rel="noopener" title="Share via WhatsApp"
           href="${f(`My CV: ${t.name} — made with MrCV`)}"><i class="ti ti-brand-whatsapp"></i></a>
        <button class="btn btn-sm btn-outline-danger" data-act="del" data-id="${d(t.id)}" title="Delete"><i class="ti ti-trash"></i></button>
      </div>
    </div>`).join("")}function m(){const e=c(),a=p(),t=[{done:e.length>0,text:s("idx.s1")},{done:a.length>0,text:s("idx.s2")},{done:e.reduce((n,i)=>n+(i.downloads||0),0)>0,text:s("idx.s3")}];document.getElementById("startList").innerHTML=t.map(n=>`
    <li class="list-group-item d-flex align-items-center gap-2 border-0 px-0 py-2">
      <i class="ti ${n.done?"ti-circle-check text-success":"ti-circle text-secondary"} fs-5"></i>
      <span class="${n.done?"text-decoration-line-through text-secondary":""}">${n.text}</span>
    </li>`).join("")}document.addEventListener("DOMContentLoaded",()=>{document.getElementById("cvList")&&(o(),r(),m(),document.getElementById("cvList").addEventListener("click",e=>{const a=e.target.closest("[data-act]");if(!a)return;const{act:t,id:n}=a.dataset;t==="dup"&&u(n),!(t==="del"&&!window.confirm(s("idx.delConfirm")))&&(t==="del"&&g(n),t==="dl"&&x(n),o(),r(),m())}))});
