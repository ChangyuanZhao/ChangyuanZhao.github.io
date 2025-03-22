document.addEventListener("DOMContentLoaded", function () {
  const mainContent = document.querySelector("#main-content");

  // 页面内容加载函数
  function loadPage(fullUrl, updateHistory = true) {
    const [url, hash] = fullUrl.split("#"); // 分离锚点
  
    fetch(url || "/")
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
  
          // ✨ 页面加载完后，跳转锚点
          if (hash) {
            setTimeout(() => {
              const target = document.getElementById(hash);
              if (target) {
                target.scrollIntoView({ behavior: "smooth" });
              }
            }, 50); // 加一点延迟，确保 DOM 已插入
          }
        } else {
          throw new Error("main-content not found in fetched page");
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
