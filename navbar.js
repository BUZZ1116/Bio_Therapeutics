document.addEventListener("DOMContentLoaded", function () {
  const navbarHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark">
      <div class="container-fluid">
        <a class="navbar-brand" href="index.html">綠上商城</a>
        <div class="collapse navbar-collapse">
          <ul class="navbar-nav">
            <li class="nav-item"><a class="nav-link" href="index.html">商品</a></li>
            <li class="nav-item"><a class="nav-link" href="cart.html">購物車</a></li>
            <li class="nav-item"><a class="nav-link" href="order.html">訂單</a></li>
          </ul>
        </div>
      </div>
    </nav>`;
  document.getElementById("navbar").innerHTML = navbarHTML;
});