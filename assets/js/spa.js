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

  document.querySelectorAll("a.nav-link").forEach(link => {
    const href = link.getAttribute("href");

    if (href.startsWith("/") && !href.includes(".") && !href.startsWith("//")) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        loadPage(href);
      });
    }
  });

  window.addEventListener("popstate", function () {
    loadPage(location.pathname, false);
  });

  // ✅ 新增逻辑：页面加载后自动尝试刷新当前路径
  const currentPath = window.location.pathname;
  if (currentPath !== "/" && currentPath !== "") {
    loadPage(currentPath, false);
  }
});
