document.addEventListener("DOMContentLoaded", function () {
  const mainContent = document.querySelector("#main-content");

  // 页面内容加载函数
  function loadPage(url, updateHistory = true) {
    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error("Page not found");
        return response.text();
      })
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const newContent = doc.querySelector("#main-content");

        if (newContent && mainContent) {
          mainContent.innerHTML = newContent.innerHTML;
          document.title = doc.title; // 可选：更新 tab 标题
          if (updateHistory) {
            history.pushState(null, "", url);
          }
        }
      })
      .catch(err => {
        console.error("SPA load error:", err);
        mainContent.innerHTML = "<p><strong>Page failed to load.</strong></p>";
      });
  }

  // 拦截导航链接点击
  document.querySelectorAll("a.nav-link").forEach(link => {
    const href = link.getAttribute("href");

    // 只处理站内链接（非锚点、非外链）
    if (href.startsWith("/") && !href.includes("#")) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        loadPage(href);
      });
    }
  });

  // 浏览器前进/后退按钮支持
  window.addEventListener("popstate", function () {
    loadPage(location.pathname, false);
  });
});
