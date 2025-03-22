document.addEventListener("DOMContentLoaded", function () {
  const mainContent = document.querySelector("#main-content");

  function loadPage(fullUrl, updateHistory = true) {
    const [urlPart, hash] = fullUrl.split("#");
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
          window.scrollTo(0, 0); // 回顶部

          if (updateHistory) {
            history.pushState(null, "", fullUrl);
          }

          if (typeof window.loadCitation === "function") {
            window.loadCitation();
          }

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

  // nav-link 点击监听
  document.querySelectorAll("a.nav-link").forEach(link => {
    const href = link.getAttribute("href");
    if (href.startsWith("/") && !href.includes(".") && !href.startsWith("//")) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        loadPage(href);
      });
    }
  });

  // ✅ popstate 后退/前进 处理
  window.addEventListener("popstate", function () {
    const path = window.location.hash.startsWith("#/")
      ? window.location.hash.slice(1)
      : window.location.pathname;
    loadPage(path, false);
  });

  // ✅ 页面初始化时也加载一次当前路径
  const currentPath = window.location.hash.startsWith("#/")
    ? window.location.hash.slice(1)
    : window.location.pathname;
  loadPage(currentPath, false);
});
