document.addEventListener("DOMContentLoaded", function () {
  const mainContent = document.querySelector("#main-content");
  const layoutContainer = document.querySelector("body"); // 或者其他包含布局的容器
  let isFirstLoad = true;
  let layoutHTML = ""; // 存储初始布局的HTML

  // 在首次加载时保存页面布局
  if (isFirstLoad) {
    // 存储除主内容以外的所有布局元素
    layoutHTML = layoutContainer.innerHTML;
    isFirstLoad = false;
  }

  function loadPage(fullUrl, updateHistory = true) {
    const [urlPart, hash] = fullUrl.split("#");
    const cleanUrl = (urlPart === "" || urlPart === "/") ? "/index.html" : urlPart;
    
    // 对于"/cv/"这样的路径，自动添加index.html
    const requestUrl = cleanUrl.endsWith("/") ? `${cleanUrl}index.html` : cleanUrl;

    fetch(requestUrl)
      .then(response => {
        if (!response.ok) throw new Error("Page not found");
        return response.text();
      })
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const newContent = doc.querySelector("#main-content");
        
        // 如果是直接刷新的子页面，可能需要重建整个布局
        const isDirectPageLoad = document.referrer === "" || !document.referrer.includes(window.location.host);
        
        if (newContent && mainContent) {
          if (isDirectPageLoad && window.location.pathname !== "/") {
            // 如果是直接访问子页面（如通过刷新），恢复完整布局
            // 这里需要确保我们有正确的布局HTML
            if (!layoutHTML) {
              // 如果没有缓存的布局，需要先获取主页的布局
              fetch("/index.html")
                .then(response => response.text())
                .then(homeHtml => {
                  const homeDoc = parser.parseFromString(homeHtml, "text/html");
                  layoutContainer.innerHTML = homeDoc.querySelector("body").innerHTML;
                  
                  // 然后替换内容区域
                  const refreshedMainContent = document.querySelector("#main-content");
                  if (refreshedMainContent) {
                    refreshedMainContent.innerHTML = newContent.innerHTML;
                  }
                  
                  document.title = doc.title;
                  attachAllEventListeners();
                })
                .catch(err => console.error("Failed to load layout:", err));
            } else {
              // 使用缓存的布局
              layoutContainer.innerHTML = layoutHTML;
              const refreshedMainContent = document.querySelector("#main-content");
              if (refreshedMainContent) {
                refreshedMainContent.innerHTML = newContent.innerHTML;
              }
              attachAllEventListeners();
            }
          } else {
            // 正常的SPA导航，只更新内容区域
            mainContent.innerHTML = newContent.innerHTML;
          }
          
          document.title = doc.title;
          
          if (updateHistory) {
            history.pushState(null, "", fullUrl);
          }
          
          // 处理滚动和锚点
          window.scrollTo(0, 0);
          if (hash) {
            setTimeout(() => {
              const target = document.getElementById(hash);
              if (target) {
                target.scrollIntoView({ behavior: "smooth" });
              }
            }, 50);
          }
          
          // 重新加载可能的自定义脚本
          if (typeof window.loadCitation === "function") {
            window.loadCitation();
          }
          
          // 处理其他可能需要动态重新加载的脚本
          const scripts = doc.querySelectorAll("script");
          scripts.forEach(script => {
            if (script.src && !Array.from(document.scripts).some(s => s.src === script.src)) {
              const newScript = document.createElement("script");
              newScript.src = script.src;
              document.body.appendChild(newScript);
            }
          });
        }
      })
      .catch(err => {
        console.error("SPA load error:", err);
        mainContent.innerHTML = "<p><strong>页面加载失败。</strong></p>";
      });
  }

  // 将所有事件监听器放在一个函数中，以便重新附加
  function attachAllEventListeners() {
    // 导航链接事件
    document.querySelectorAll("a.nav-link").forEach(link => {
      const href = link.getAttribute("href");
      if (href && href.startsWith("/") && !href.includes(".") && !href.startsWith("//")) {
        // 移除已有的事件监听器
        const newLink = link.cloneNode(true);
        if (link.parentNode) {
          link.parentNode.replaceChild(newLink, link);
        }
        
        newLink.addEventListener("click", function (e) {
          e.preventDefault();
          loadPage(href);
        });
      }
    });
    
    // 在这里添加其他需要重新附加的事件监听器
  }

  // 处理浏览器后退/前进
  window.addEventListener("popstate", function () {
    const path = window.location.pathname + window.location.hash;
    loadPage(path, false);
  });

  // 存储初始布局
  if (window.location.pathname === "/" || window.location.pathname === "/index.html") {
    layoutHTML = layoutContainer.innerHTML;
  } else {
    // 如果不是主页，先获取主页布局
    fetch("/index.html")
      .then(response => response.text())
      .then(html => {
        const parser = new DOMParser();
        const homeDoc = parser.parseFromString(html, "text/html");
        layoutHTML = homeDoc.querySelector("body").innerHTML;
      })
      .catch(err => console.error("Failed to cache layout:", err));
  }

  // 页面初始化
  const initialPath = window.location.pathname + window.location.hash;
  loadPage(initialPath, false);
  
  // 附加初始事件监听器
  attachAllEventListeners();
  
  // 将布局HTML保存到会话存储，以便在页面刷新后恢复
  window.addEventListener("beforeunload", function() {
    sessionStorage.setItem("layoutHTML", layoutHTML);
  });
  
  // 检查会话存储中是否有已保存的布局
  const savedLayout = sessionStorage.getItem("layoutHTML");
  if (savedLayout && window.location.pathname !== "/" && window.location.pathname !== "/index.html") {
    layoutHTML = savedLayout;
  }
});
