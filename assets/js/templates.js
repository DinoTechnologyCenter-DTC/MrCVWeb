import{A as r,B as n,x as i,S as o,h as d,t as c,D as v}from"./main.js";function p(e){return e.kind==="letter"?`<div class="cv-sheet tpl-letter cv-zoom">${n(v)}</div>`:`<div class="cv-sheet tpl-${e.slug} cv-zoom">${i(o)}</div>`}function f(e){const a=e.useLink||`new-cv.html?template=${e.slug}`;return`
  <div class="col-12 col-md-6 col-lg-4 tpl-card" data-cat="${e.cat}">
    <div class="card h-100">
      <div class="card-body p-3 d-flex flex-column">
        <div class="cv-frame cv-frame-sm mb-3">${p(e)}</div>
        <h3 class="h6 mb-1">${d(e.name)}</h3>
        <p class="small text-secondary mb-2">${d(e.desc)}</p>
        <p class="small mb-2"><i class="ti ti-briefcase text-primary"></i> ${c("tpl.bestfor")} ${d(e.best)}</p>
        <div class="d-flex flex-wrap gap-1 mb-3">
          ${e.badges.map(l=>`<span class="badge bg-light text-secondary border">${d(l)}</span>`).join("")}
        </div>
        <div class="d-flex gap-2 mt-auto">
          <a href="${a}" class="btn btn-primary btn-sm flex-grow-1">${c("tpl.use")}</a>
          <button class="btn btn-outline-secondary btn-sm" data-preview="${e.slug}" data-bs-toggle="modal" data-bs-target="#tplModal">${c("tpl.preview")}</button>
        </div>
      </div>
    </div>
  </div>`}document.addEventListener("DOMContentLoaded",()=>{const e=document.getElementById("tplGrid");if(!e)return;e.innerHTML=r.map(f).join(""),document.querySelectorAll("[data-filter]").forEach(l=>{l.addEventListener("click",()=>{document.querySelectorAll("[data-filter]").forEach(t=>t.classList.remove("active")),l.classList.add("active");const s=l.dataset.filter;document.querySelectorAll(".tpl-card").forEach(t=>{t.style.display=s==="all"||t.dataset.cat===s?"":"none"})})});const a=document.getElementById("tplModal");e.addEventListener("click",l=>{const s=l.target.closest("[data-preview]");if(!s||!a)return;const t=r.find(u=>u.slug===s.dataset.preview);if(!t)return;const m=t.kind==="letter"?`<div class="cv-sheet tpl-letter">${n(v)}</div>`:`<div class="cv-sheet tpl-${t.slug}">${i(o)}</div>`;a.querySelector(".modal-title").textContent=t.name,a.querySelector("#tplModalBody").innerHTML=m,a.querySelector("#tplModalUse").href=t.useLink||`new-cv.html?template=${t.slug}`})});
