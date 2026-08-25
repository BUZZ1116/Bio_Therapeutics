const docs = Array.isArray(window.KB_DOCUMENTS) ? window.KB_DOCUMENTS : [];

const STAGES = [
  { id: "level1", label: "第一階：政策" },
  { id: "level2", label: "第二階：程序書" },
  { id: "level3", label: "第三階：作業指導書" },
  { id: "level4", label: "第四階：表單與紀錄" }
];

const CLAUSES = [
  ["4", "4. 組織全景"], ["5", "5. 領導力"], ["6", "6. 規劃"],
  ["7", "7. 支援"], ["8", "8. 運作"], ["9", "9. 績效評估"],
  ["10", "10. 改善"], ["A.5", "Annex A.5 組織控制"],
  ["A.6", "Annex A.6 人員控制"], ["A.7", "Annex A.7 實體控制"],
  ["A.8", "Annex A.8 技術控制"]
];

const state = {
  q: "",
  stages: new Set(),
  clauses: new Set(),
  selected: null,
  viewMode: "document"
};

const el = function (id) { return document.getElementById(id); };

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, function (character) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character];
  });
}

function safeId(value) {
  return String(value).replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "-");
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s·・_/\\|,，、:：;；()（）\[\]【】.-]+/g, "");
}

function byId(id) {
  return docs.find(function (doc) { return doc.id === id; });
}

function docTopics(doc) {
  if (Array.isArray(doc.topics) && doc.topics.length) return doc.topics;
  return doc.clause ? [doc.clause] : [];
}

function hasInteractive(doc) {
  return Boolean(doc && doc.interactivePath);
}

function queryMatches(doc) {
  const query = normalizeText(state.q);
  if (!query) return true;
  const haystack = normalizeText([
    doc.search, doc.code, doc.title, doc.filename, doc.typeCode, doc.typeLabel,
    doc.stageLabel, doc.clauseLabel, doc.topic, doc.owner, doc.applicableClause
  ].join(" "));
  return haystack.includes(query);
}

function stageMatches(doc) {
  return state.stages.size === 0 || state.stages.has(doc.stage);
}

function clauseMatches(doc) {
  if (state.clauses.size === 0) return true;
  return docTopics(doc).some(function (topic) { return state.clauses.has(topic); });
}

function filtered() {
  return docs.filter(function (doc) {
    return stageMatches(doc) && clauseMatches(doc) && queryMatches(doc);
  });
}

function countStage(id) {
  return docs.filter(function (doc) {
    return doc.stage === id && clauseMatches(doc) && queryMatches(doc);
  }).length;
}

function countClause(id) {
  return docs.filter(function (doc) {
    return docTopics(doc).includes(id) && stageMatches(doc) && queryMatches(doc);
  }).length;
}

function checkbox(group, value, label, checked, count) {
  const id = group + "-" + safeId(value);
  return (
    '<label class="checkChip" for="' + id + '">' +
    '<input id="' + id + '" type="checkbox" ' + (checked ? "checked" : "") +
    ' onchange="toggleFilter(\'' + group + "','" + value + "')\">" +
    "<span>" + escapeHtml(label + " (" + count + ")") + "</span></label>"
  );
}

function renderFilters() {
  el("typeFilters").innerHTML = STAGES.map(function (stage) {
    return checkbox("stage", stage.id, stage.label, state.stages.has(stage.id), countStage(stage.id));
  }).join("");
  el("clauseFilters").innerHTML = CLAUSES.map(function (item) {
    return checkbox("clause", item[0], item[1], state.clauses.has(item[0]), countClause(item[0]));
  }).join("");
}

function toggleFilter(group, value) {
  const values = group === "stage" ? state.stages : state.clauses;
  if (values.has(value)) values.delete(value); else values.add(value);
  renderAll();
}

function filteredLabel() {
  if (!state.stages.size && !state.clauses.size && !state.q.trim()) return "未套用篩選";
  const parts = [];
  if (state.stages.size) parts.push(state.stages.size + " 個文件層級");
  if (state.clauses.size) parts.push(state.clauses.size + " 個管理主題");
  if (state.q.trim()) parts.push("關鍵字搜尋");
  return "已套用 " + parts.join("、");
}

function reconcileSelection(list) {
  if (list.some(function (doc) { return doc.id === state.selected; })) return;
  state.selected = list.length ? list[0].id : null;
  state.viewMode = "document";
}

function renderList(list) {
  el("count").textContent =
    "顯示 " + list.length + " / " + docs.length + " 份受控文件｜" + filteredLabel();
  el("docList").innerHTML = list.map(function (doc) {
    return (
      '<div class="docItem ' + (state.selected === doc.id ? "active" : "") +
      '" tabindex="0" role="button" onclick="selectDoc(\'' + doc.id +
      "')\" onkeydown=\"activateDoc(event,'" + doc.id + "')\">" +
      '<div class="title">' + escapeHtml(doc.title) + "</div>" +
      '<div class="code">' + escapeHtml(doc.code) + " · " + escapeHtml(doc.version) + "</div>" +
      '<div class="tags"><span class="tag primaryTag">' + escapeHtml(doc.stageLabel) + "</span>" +
      '<span class="tag">' + escapeHtml(doc.clauseLabel) + "</span>" +
      '<span class="tag">' + escapeHtml(doc.classification) + "</span>" +
      (hasInteractive(doc) ? '<span class="tag toolTag">互動表單</span>' : "") +
      "</div></div>"
    );
  }).join("") || '<div class="empty">找不到符合條件的文件，請調整文件層級、管理主題或搜尋文字。</div>';
}

function activateDoc(event, id) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    selectDoc(id);
  }
}

function currentDoc() {
  return state.selected ? byId(state.selected) : null;
}

function currentPath(doc) {
  return state.viewMode === "interactive" && hasInteractive(doc) ? doc.interactivePath : doc.path;
}

function absolutePath(path) {
  try { return new URL(path, document.baseURI).href; }
  catch (_error) { return path; }
}

function renderViewer(doc) {
  if (!doc) {
    el("viewer").innerHTML = '<div class="empty">目前沒有符合條件的文件。</div>';
    return;
  }
  const interactiveButton = hasInteractive(doc)
    ? '<button id="toolBtn" class="btn toolBtn" type="button" onclick="openInteractive(event)">開啟互動表單</button>'
    : "";
  el("viewer").innerHTML =
    '<div class="viewerBar"><div><h2>' + escapeHtml(doc.title) + "</h2>" +
    "<p>" + escapeHtml(doc.code) + " · " + escapeHtml(doc.version) + " · " +
    escapeHtml(doc.status) + " · " + escapeHtml(doc.classification) +
    "<br>" + escapeHtml(doc.owner) + " · " + escapeHtml(doc.reviewCycle) + "</p></div>" +
    '<div class="viewerActions"><button id="docBtn" class="btn" type="button" onclick="openDocument(event)">開啟文件</button>' +
    interactiveButton +
    '<a id="newWindowBtn" class="btn secondaryBtn" href="' + escapeHtml(absolutePath(doc.path)) +
    '" target="_blank" rel="noopener">在新視窗開啟</a></div></div>' +
    '<iframe class="frame" title="' + escapeHtml(doc.title) + '" src="' +
    escapeHtml(absolutePath(doc.path)) + '"></iframe>';
  updateViewerMode();
}

function updateViewerMode() {
  const doc = currentDoc();
  if (!doc) return;
  const target = absolutePath(currentPath(doc));
  const frame = el("viewer").querySelector("iframe");
  const newWindow = el("newWindowBtn");
  if (frame) frame.src = target;
  if (newWindow) newWindow.href = target;
  if (el("docBtn")) el("docBtn").classList.toggle("activeMode", state.viewMode === "document");
  if (el("toolBtn")) el("toolBtn").classList.toggle("activeMode", state.viewMode === "interactive");
}

function selectDoc(id) {
  const doc = byId(id);
  if (!doc) return;
  state.selected = id;
  state.viewMode = "document";
  renderList(filtered());
  renderViewer(doc);
  location.hash = encodeURIComponent(id);
}

function openDocument(event) {
  event.stopPropagation();
  state.viewMode = "document";
  updateViewerMode();
}

function openInteractive(event) {
  event.stopPropagation();
  const doc = currentDoc();
  if (!hasInteractive(doc)) return;
  state.viewMode = "interactive";
  updateViewerMode();
}

function renderAll() {
  const list = filtered();
  reconcileSelection(list);
  renderFilters();
  renderList(list);
  renderViewer(currentDoc());
}

function clearFilters() {
  state.stages.clear();
  state.clauses.clear();
  state.q = "";
  el("q").value = "";
  renderAll();
}

el("q").addEventListener("input", function (event) {
  state.q = event.target.value;
  renderAll();
});
el("clearFilters").addEventListener("click", clearFilters);
if (el("statDocs")) el("statDocs").textContent = docs.length;
if (el("statTypes")) el("statTypes").textContent = STAGES.length;

if (location.hash) {
  const id = decodeURIComponent(location.hash.slice(1));
  if (byId(id)) state.selected = id;
}
renderAll();
