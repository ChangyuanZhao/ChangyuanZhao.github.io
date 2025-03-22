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
  
          // 💡 添加延迟滚动到锚点
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



  document.querySelectorAll("a.nav-link").forEach(link => {
    const href = link.getAttribute("href");
  
    if (href.startsWith("/") && !href.includes(".") && !href.startsWith("//")) {
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
