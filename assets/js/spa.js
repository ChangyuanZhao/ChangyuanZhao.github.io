/**
 * acad-homepage SPA 实现（修复刷新跳动）
 * 专为 Jekyll 生成的学术主页设计
 */
document.addEventListener("DOMContentLoaded", function () {
  const mainContent = document.querySelector("#main-content");
  const HANDLED_ATTR = "data-spa-handled";
  let lastContentHeight = 0;

  function loadPage(url, updateHistory = true) {
    if (mainContent) {
      lastContentHeight = mainContent.offsetHeight;
      mainContent.style.minHeight = `${lastContentHeight}px`;
    }
    document.body.classList.add("is-loading");
    const cleanUrl = url.split("#")[0];
    const hash = url.includes("#") ? url.split("#")[1] : "";
    const requestUrl = cleanUrl.endsWith("/") ? cleanUrl : cleanUrl;

    fetch(requestUrl)
      .then(response => {
        if (!response.ok) throw new Error(`页面加载失败: ${response.status}`);
        return response.text();
      })
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const newInnerWrap = doc.querySelector("#main-content");
        const newTitle = doc.querySelector("title")?.textContent || "";

        if (newInnerWrap && mainContent) {
          const tempDiv = document.createElement('div');
          tempDiv.style.visibility = 'hidden';
          tempDiv.style.position = 'absolute';
          tempDiv.style.width = getComputedStyle(mainContent).width;
          tempDiv.innerHTML = newInnerWrap.innerHTML;
          document.body.appendChild(tempDiv);
          const newContentHeight = tempDiv.offsetHeight;
          document.body.removeChild(tempDiv);

          mainContent.classList.add('content-transitioning-out');

          setTimeout(() => {
            mainContent.innerHTML = newInnerWrap.innerHTML;
            document.title = newTitle;
            if (updateHistory) {
              history.pushState({ url: url }, newTitle, url);
            }
            initDynamicElements();
            attachLinkHandlers();
            mainContent.classList.remove('content-transitioning-out');
            mainContent.classList.add('content-transitioning-in');
            mainContent.style.minHeight = `${newContentHeight}px`;

            if (hash) {
              setTimeout(() => {
                const target = document.getElementById(hash);
                if (target) target.scrollIntoView({ behavior: "smooth" });
              }, 100);
            } else {
              window.scrollTo(0, 0);
            }

            setTimeout(() => {
              mainContent.classList.remove('content-transitioning-in');
              setTimeout(() => {
                mainContent.style.minHeight = '';
              }, 300);
            }, 300);
          }, 150);
        }
      })
      .catch(error => {
        console.error("SPA加载错误:", error);
        mainContent.innerHTML = `<div class="notice--danger">
          <h4>${error.message.includes("404") ? '页面未找到' : '加载错误'}</h4>
          <p>${error.message}</p>
          <p>尝试<a href="${url}" onclick="window.location.reload(); return false;">刷新页面</a>。</p>
        </div>`;
        mainContent.style.minHeight = '';
      })
      .finally(() => {
        document.body.classList.remove("is-loading");
      });
  }

  function fixSidebarHeight() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && mainContent) {
      requestAnimationFrame(() => {
        const currentSidebarHeight = sidebar.offsetHeight;
        const contentHeight = mainContent.offsetHeight;
        if (contentHeight > currentSidebarHeight) {
          sidebar.style.minHeight = contentHeight + 'px';
        }
      });
    }
  }

  function initDynamicElements() {
    document.querySelectorAll("img[data-src]").forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute("data-src");
      }
    });

    mainContent.querySelectorAll("script").forEach(oldScript => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = oldScript.textContent;
      if (oldScript.parentNode) {
        oldScript.parentNode.replaceChild(newScript, oldScript);
      }
    });

    if (typeof window.loadCitation === "function") window.loadCitation();
    if (window.MathJax) {
      if (typeof window.MathJax.typeset === 'function') window.MathJax.typeset();
      else if (window.MathJax.Hub && typeof window.MathJax.Hub.Queue === 'function') window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
    }

    if (typeof window.initTravelMap === 'function') {
      setTimeout(window.initTravelMap, 100);
    }

    setTimeout(fixSidebarHeight, 300);
  }

  function attachLinkHandlers() {
    const links = document.querySelectorAll(`a[href^="/"], a[href^="./"], a[href^="../"]`);
    links.forEach(link => {
      if (link.hasAttribute(HANDLED_ATTR)) return;
      const href = link.getAttribute("href");
      if (!href) return;
      const isResourceLink = href.match(/\.(pdf|zip|rar|jpe?g|png|gif|svg|mp4|mp3|docx?|xlsx?|pptx?)$/i);
      const isMailtoLink = href.startsWith("mailto:");
      const hasProtocol = href.includes("://");
      if (!isResourceLink && !isMailtoLink && !hasProtocol) {
        link.setAttribute(HANDLED_ATTR, "true");
        link.addEventListener("click", function(e) {
          e.preventDefault();
          loadPage(href);
        });
      }
    });
  }

  window.addEventListener("popstate", function(event) {
    if (event.state && event.state.url) {
      loadPage(event.state.url, false);
    } else {
      loadPage(window.location.pathname + window.location.hash, false);
    }
  });

  window.addEventListener("beforeunload", function() {
    localStorage.setItem("lastPath", window.location.pathname);
  });

  const currentPath = window.location.pathname + window.location.hash;
  history.replaceState({ url: currentPath }, document.title, currentPath);

  const lastPath = localStorage.getItem("lastPath");
  const isSubpageRefresh = lastPath && lastPath !== "/" && currentPath === lastPath;
  if (isSubpageRefresh) {
    const hasFullLayout = document.querySelector("header") && 
                          document.querySelector("footer") && 
                          document.querySelector(".sidebar, .author__avatar");
    if (!hasFullLayout) {
      localStorage.setItem("redirectedFrom", currentPath);
      window.location.href = "/";
      throw new Error("Redirecting to homepage to restore layout");
    }
  }

  const redirectedFrom = localStorage.getItem("redirectedFrom");
  if (redirectedFrom) {
    localStorage.removeItem("redirectedFrom");
    setTimeout(() => {
      loadPage(redirectedFrom, true);
    }, 200);
  }

  attachLinkHandlers();

  const style = document.createElement("style");
  style.textContent = `
    html { overflow-y: scroll; }
    .is-loading { cursor: wait; }
    #main-content { transition: min-height 0.3s ease-out; }
    .content-transitioning-out { opacity: 0.3; transition: opacity 0.15s ease-out; }
    .content-transitioning-in { opacity: 1; transition: opacity 0.3s ease-in; }
    #main { transition: min-height 0.3s ease; }
    .author__avatar { display: block; overflow: hidden; margin-bottom: 1em; min-height: 80px; }
    .author__avatar img { max-width: 100%; height: auto; display: block; }
    .sidebar { transition: min-height 0.3s ease-out; min-height: 400px; }
    .notice--danger { padding: 1.5em; background-color: #ffebee; border-left: 5px solid #f44336; margin: 2em 0; }
  `;
  document.head.appendChild(style);

  window.addEventListener("load", () => {
    setTimeout(fixSidebarHeight, 300);
  });

  window.addEventListener('resize', function() {
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(function() {
      fixSidebarHeight();
      if (window.travelMap) {
        window.travelMap.invalidateSize();
      }
    }, 100);
  });
});
