
(function(){
"use strict";
var body=document.body,storageKey=body.dataset.storageKey||"tksg-isms-form";
function q(s,r){return Array.from((r||document).querySelectorAll(s))}
function today(){var d=new Date();return String(d.getFullYear())+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function value(c){return c.type==="checkbox"?c.checked:c.value}
function setValue(c,v){if(c.type==="checkbox")c.checked=!!v;else c.value=v==null?"":v}
function controls(row){return q("input,select,textarea",row)}
function field(key){var c=document.querySelector('[data-key="'+key+'"]');return c?value(c):""}
function esc(s){return String(s==null?"":s).replace(/[&<>\"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;"}[c]})}
function rekey(row,token){controls(row).forEach(function(c,i){c.dataset.key="record-"+token+"-"+i})}
function cloneRow(clear){
  var tbody=document.querySelector("#recordsBody"),source=tbody.rows[tbody.rows.length-1]||tbody.rows[0],row=source.cloneNode(true),token=Date.now()+"-"+Math.floor(Math.random()*9999);
  rekey(row,token);
  if(clear)controls(row).forEach(function(c){if(c.type==="date")c.value=today();else if(c.type==="datetime-local")c.value=today()+"T09:00";else if(c.tagName==="SELECT")c.selectedIndex=0;else c.value=""});
  tbody.appendChild(row);return row
}
function serialize(){
  var fields={};
  q("[data-key]").filter(function(c){return !c.closest("#recordsBody")}).forEach(function(c){fields[c.dataset.key]=value(c)});
  return{documentCode:body.dataset.documentCode,organization:field("organization"),savedAt:new Date().toISOString(),fields:fields,records:q("#recordsBody tr").map(function(r){return controls(r).map(value)})}
}
function load(data){
  if(!data)return;
  Object.keys(data.fields||{}).forEach(function(k){var c=document.querySelector('[data-key="'+CSS.escape(k)+'"]');if(c)setValue(c,data.fields[k])});
  var rows=data.records||[],tbody=document.querySelector("#recordsBody");
  while(tbody.rows.length<rows.length)cloneRow(true);
  while(tbody.rows.length>Math.max(1,rows.length))tbody.deleteRow(tbody.rows.length-1);
  rows.forEach(function(vals,i){controls(tbody.rows[i]).forEach(function(c,j){setValue(c,vals[j])})});
  document.getElementById("savedText").textContent=data.savedAt?new Date(data.savedAt).toLocaleString():"已載入"
}
function save(){var data=serialize();localStorage.setItem(storageKey,JSON.stringify(data));document.getElementById("savedText").textContent=new Date(data.savedAt).toLocaleString();document.getElementById("statusText").textContent="已儲存";return data}
function validate(){
  q(".invalid").forEach(function(x){x.classList.remove("invalid")});var bad=[];
  q("[data-required]").forEach(function(c){if(!String(value(c)||"").trim()){c.classList.add("invalid");bad.push(c)}});
  q("#recordsBody tr").forEach(function(r){var c=controls(r)[0];if(c&&!String(value(c)||"").trim()){c.classList.add("invalid");bad.push(c)}});
  document.getElementById("statusText").textContent=bad.length?"尚有 "+bad.length+" 項必填":"必填檢查完成";if(bad[0])bad[0].focus();return !bad.length
}
function download(name,type,text){var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:type}));a.download=name;a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},1000)}
function simpleTable(pairs){
  var rows=[];
  for(var i=0;i<pairs.length;i+=2){
    var left=pairs[i],right=pairs[i+1];
    rows.push("<tr><th>"+esc(left[0])+"</th><td>"+esc(left[1])+"</td>"+(right?"<th>"+esc(right[0])+"</th><td>"+esc(right[1])+"</td>":"<th></th><td></td>")+"</tr>")
  }
  return"<table class=information><tbody>"+rows.join("")+"</tbody></table>"
}
function controlTable(headers,values){
  return"<table class=document-control><thead><tr>"+headers.map(function(x){return"<th>"+esc(x)+"</th>"}).join("")+"</tr></thead><tbody><tr>"+values.map(function(x){return"<td>"+esc(x)+"</td>"}).join("")+"</tr></tbody></table>"
}
function snapshot(){
  var title=(document.querySelector("h1")||{}).textContent||field("title"),heads=q("#recordsTable thead th").slice(0,-1).map(function(h){return h.textContent.trim()}),rows=q("#recordsBody tr").map(function(r){return controls(r).map(value)});
  var mainTable="<table><thead><tr>"+heads.map(function(x){return"<th>"+esc(x)+"</th>"}).join("")+"</tr></thead><tbody>"+rows.map(function(r){return"<tr>"+r.map(function(x){return"<td>"+esc(x)+"</td>"}).join("")+"</tr>"}).join("")+"</tbody></table>";
  var documentControl=
    controlTable(["文件編號","文件名稱","文件類型","版本","保存等級／期限","文件分級"],[field("code"),field("title"),field("type"),field("version"),field("retention"),field("classification")])+
    controlTable(["組織名稱","適用條款","文件Owner","核准權責","保存位置","正式使用前確認"],[field("organization"),field("applicableClause"),field("owner"),field("approver"),field("storageLocation"),field("preUseConfirmation")])+
    controlTable(["文件狀態","生效日期","審查週期","下次審查日","審查權責","變更管制紀錄"],[field("status"),field("effectiveDate"),field("reviewCycle"),field("nextReviewDate"),field("reviewAuthority"),field("changeControl")]);
  var review=simpleTable([["編製／填表",field("preparedBy")],["審查",field("reviewedBy")],["核准",field("approvedBy")],["日期",field("approvalDate")]]);
  var conclusion=simpleTable([["整體結論",field("overallConclusion")],["待辦／跟催",field("followUp")],["核准／確認",field("finalApproval")]]);
  var revision=simpleTable([["版本",field("version")],["日期",field("approvalDate")||field("effectiveDate")||today()],["修訂摘要","ISMS-KB-1.0018 文件管制版型一致化"],["核准",field("approvedBy")||field("approver")]]);
  var styles=":root{color-scheme:light}html,body{background:#fff!important;color:#111!important}body{font-family:Arial,'Microsoft JhengHei',sans-serif;margin:24px}h1,h2{color:#123f5a}h2{margin-top:24px;border-bottom:2px solid #157f75;padding-bottom:5px}table{width:100%;border-collapse:collapse;margin:10px 0 22px;table-layout:auto}th,td{border:1px solid #333;padding:6px;vertical-align:top;color:#111!important;background:#fff!important;white-space:pre-wrap}th{background:#e8f1f8!important}.information th{width:16%}.information td{width:34%}.copyright{margin-top:30px;border-top:1px solid #aaa;padding-top:10px}";
  return"<!doctype html><html xmlns:o='urn:schemas-microsoft-com:office:office'><head><meta charset=utf-8><meta name=color-scheme content=light><title>"+esc(title)+"</title><style>"+styles+"</style></head><body><h1>"+esc(title)+"</h1><h2>1.0 文件管制</h2>"+documentControl+"<h2>0.1 填表與審查紀錄</h2>"+review+"<h2>3.0 主要紀錄</h2>"+mainTable+"<h2>4.0 審查、結論與後續行動</h2>"+conclusion+"<h2>5.0 修訂紀錄</h2>"+revision+"<p class=copyright>© 2026 TechKnowledge Services Group (TKSG). All Rights Reserved.</p></body></html>"
}
document.addEventListener("click",function(e){var add=e.target.closest("[data-add-row]");if(add){cloneRow(true);save();return}var del=e.target.closest("[data-delete-row]");if(del){var tbody=document.querySelector("#recordsBody");if(tbody.rows.length>1){del.closest("tr").remove();save()}return}});
document.getElementById("saveBtn").onclick=save;
document.getElementById("validateBtn").onclick=validate;
document.getElementById("exportBtn").onclick=function(){download((body.dataset.documentCode||"form")+".json","application/json",JSON.stringify(save(),null,2))};
document.getElementById("importBtn").onclick=function(){document.getElementById("importFile").click()};
document.getElementById("importFile").onchange=function(){var f=this.files[0];if(!f)return;var r=new FileReader();r.onload=function(){try{load(JSON.parse(r.result));save()}catch(e){alert("JSON格式不正確")}};r.readAsText(f)};
document.getElementById("previewBtn").onclick=function(){var w=window.open("","_blank");if(!w){alert("瀏覽器已阻擋預覽視窗，請允許此頁開啟彈出式視窗。");return}w.document.open();w.document.write(snapshot());w.document.close()};
document.getElementById("printBtn").onclick=function(){window.print()};
document.getElementById("wordBtn").onclick=function(){download((body.dataset.documentCode||"form")+".doc","application/msword;charset=utf-8","\ufeff"+snapshot())};
document.getElementById("resetBtn").onclick=function(){if(confirm("確定清除本機儲存並重設表單？")){localStorage.removeItem(storageKey);location.reload()}};
q("[data-default-today]").forEach(function(c){if(!c.value)c.value=today()});
var saved=localStorage.getItem(storageKey);if(saved){try{load(JSON.parse(saved))}catch(e){}}
})();
