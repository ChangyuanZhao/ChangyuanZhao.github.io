document.addEventListener("DOMContentLoaded", function () {
  const mainContent = document.querySelector("#main-content");

  // 页面内容加载函数
  function loadPage(fullUrl, updateHistory = true) {
    const [urlPart, hash] = fullUrl.split("#");

    // 🧠 特殊处理 homepage 上的锚点（如 /#about-me）
    const cleanUrl = (urlPart === "" || urlPart === "/") ? "/" : urlPart;

    fetch(cleanUrl)
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
          document.title = doc.title;

          if (updateHistory) {
            history.pushState(null, "", fullUrl);
          }

          // ✅ 引用数刷新支持
          if (typeof window.loadCitation === "function") {
            window.loadCitation();
          }

          // 锚点滚动支持
          if (hash) {
            setTimeout(() => {
              const target = document.getElementById(hash);
              if (target) {
                target.scrollIntoView({ behavior: "smooth" });
              }
            }, 50);
          }
        }
      })
      .catch(err => {
        console.error("SPA load error:", err);
        mainContent.innerHTML = "<p><strong>Page failed to load.</strong></p>";
      });
  }

  // ✅ 监听菜单点击，SPA 加载
  document.querySelectorAll("a.nav-link").forEach(link => {
    const href = link.getAttribute("href");

    if (href.startsWith("/") && !href.includes(".") && !href.startsWith("//")) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        loadPage(href);
      });
    }
  });

  // ✅ 监听浏览器前进/后退按钮
  window.addEventListener("popstate", function () {
    loadPage(location.pathname, false);
  });

  // ✅ 支持刷新时从 hash 路由加载页面（例如 /#/cv/）
  const initialHashPath = window.location.hash;
  if (initialHashPath && initialHashPath.startsWith("#/")) {
    const realPath = initialHashPath.slice(1); // 去掉 #
    loadPage(realPath);
  } else {
    // 默认加载当前路径
    loadPage(location.pathname, false);
  }
});
