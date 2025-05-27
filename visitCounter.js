document.addEventListener("DOMContentLoaded", function () {
  const key = "loyk-visit-count";
  let count = parseInt(localStorage.getItem(key)) || 0;
  count++;
  localStorage.setItem(key, count);
  const counter = document.createElement("div");
  counter.id = "visit-counter";
  counter.innerHTML = `瀏覽次數：<span id="visit-count">${count}</span>`;
  document.body.appendChild(counter);
});