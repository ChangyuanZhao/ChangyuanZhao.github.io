/**
 * acad-homepage SPA 实现
 * 专注于解决布局渲染和头像位置问题
 */

// 最优先执行的代码，在页面最早阶段就检测刷新情况
(function() {
  // 判断是否为子页面
  const path = window.location.pathname;
  if (path !== "/" && path !== "/index.html") {
    // 立即隐藏整个页面以防闪烁
    document.documentElement.style.opacity = "0";
    document.documentElement.style.transition = "opacity 0.3s";
    
    // 标记为子页面刷新
    sessionStorage.setItem("refreshSubpage", path);
  }
})();

document.addEventListener("DOMContentLoaded", function() {
  // 主内容区域
  const mainContent = document.querySelector("#main-content");
  
  // 已处理链接的标记
  const HANDLED_ATTR = "data-spa-handled";
  
  // 当前路径和是否为子页面刷新
  const currentPath = window.location.pathname;
  const refreshSubpage = sessionStorage.getItem("refreshSubpage");
  
  // ===== 区分刷新情况 =====
  
  // 情况1: 子页面刷新并且我们没有完整布局
  if (currentPath !== "/" && refreshSubpage === currentPath) {
    const hasFullLayout = hasCompleteSiteLayout();
    
    if (!hasFullLayout) {
      console.log("检测到子页面刷新且布局不完整，重定向到主页");
      // 清除子页面刷新标记
      sessionStorage.removeItem("refreshSubpage");
      // 设置重定向目标
      sessionStorage.setItem("redirectTarget", currentPath);
      // 重定向到主页以获取完整布局
      window.location.replace("/");
      return; // 停止执行
    }
  }
  
  // 情况2: 主页加载但有重定向目标
  if ((currentPath === "/" || currentPath === "/index.html") && sessionStorage.getItem("redirectTarget")) {
    const targetPage = sessionStorage.getItem("redirectTarget");
    console.log("从主页重定向到:", targetPage);
    
    // 清除重定向标记
    sessionStorage.removeItem("redirectTarget");
    
    // 加载完整站点布局后立即重定向到目标页面
    // 使用 location.replace 而不是 loadPage 确保获得完整的布局
    window.location.replace(targetPage);
    return; // 停止执行
  }
  
  // 允许页面显示（针对子页面刷新的情况）
  document.documentElement.style.opacity = "1";
  
  /**
   * 检查站点是否有完整布局
   */
  function hasCompleteSiteLayout() {
    return Boolean(
      document.querySelector("header") && 
      document.querySelector("footer") && 
      document.querySelector(".sidebar, .author__avatar")
    );
  }
  
  /**
   * 设置当前页面类型
   */
  function setCurrentPageType(url) {
    let pageType = "home";
    
    if (url.includes("/publications")) {
      pageType = "publications";
    } else if (url.includes("/cv")) {
      pageType = "cv";
    } else if (url.includes("/teaching")) {
      pageType = "teaching";
    } else if (url.includes("/portfolio")) {
      pageType = "portfolio";
    }
    
    document.body.setAttribute("data-current-page", pageType);
  }
  
  // 设置初始页面类型
  setCurrentPageType(currentPath);
  
  /**
   * 加载页面内容
   */
  function loadPage(url, updateHistory = true) {
    // 标记为加载中
    document.body.classList.add("is-loading");
    
    // 保存当前内容高度，减少布局跳动
    const currentHeight = mainContent.offsetHeight;
    mainContent.style.minHeight = `${currentHeight}px`;
    
    // 处理URL
    const cleanUrl = url.split("#")[0];
    const hash = url.includes("#") ? url.split("#")[1] : "";
    const requestUrl = cleanUrl.endsWith("/") ? cleanUrl : cleanUrl;
    
    // 更新页面类型
    setCurrentPageType(url);
    
    console.log("SPA加载页面:", url);
    
    // 发送请求获取内容
    fetch(requestUrl)
      .then(response => {
        if (!response.ok) throw new Error(`页面加载失败: ${response.status}`);
        return response.text();
      })
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        
        // 查找新内容
        const newContent = doc.querySelector("#main-content");
        const newTitle = doc.querySelector("title")?.textContent || "";
        
        if (newContent && mainContent) {
          // 创建过渡容器
          const transitionContainer = document.createElement('div');
          transitionContainer.className = 'content-transition-enter';
          transitionContainer.innerHTML = newContent.innerHTML;
          
          // 更新内容
          mainContent.innerHTML = '';
          mainContent.appendChild(transitionContainer);
          
          // 触发过渡
          setTimeout(() => {
            transitionContainer.classList.add('content-transition-enter-active');
          }, 10);
          
          // 更新标题和历史
          document.title = newTitle;
          if (updateHistory) {
            history.pushState({ url: url }, newTitle, url);
          }
          
          // 初始化新内容
          setTimeout(() => {
            initDynamicElements();
            fixSidebarAndImages();
            attachLinkHandlers();
            
            // 移除高度限制
            setTimeout(() => {
              mainContent.style.minHeight = '';
            }, 200);
            
            // 处理锚点滚动
            if (hash) {
              const target = document.getElementById(hash);
              if (target) target.scrollIntoView({ behavior: "smooth" });
            } else {
              window.scrollTo(0, 0);
            }
          }, 300);
        }
      })
      .catch(error => {
        console.error("页面加载错误:", error);
        mainContent.innerHTML = `
          <div class="notice--danger">
            <h4>加载错误</h4>
            <p>${error.message}</p>
            <p>尝试<a href="${url}">重新加载</a></p>
          </div>
        `;
        mainContent.style.minHeight = '';
      })
      .finally(() => {
        document.body.classList.remove("is-loading");
      });
  }
  
  /**
   * 修复侧边栏和图片显示
   */
  function fixSidebarAndImages() {
    // 处理头像
    const avatarContainer = document.querySelector('.author__avatar');
    if (avatarContainer) {
      // 移除之前设置的样式
      avatarContainer.style.height = '';
      avatarContainer.style.width = '';
      avatarContainer.style.position = 'relative';
      
      const avatarImg = avatarContainer.querySelector('img');
      if (avatarImg) {
        // 确保头像图片显示正确
        avatarImg.style.maxWidth = '100%';
        avatarImg.style.height = 'auto';
        avatarImg.style.display = 'block';
      }
    }
    
    // 修复侧边栏
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.style.position = 'sticky';
      sidebar.style.top = '2em';
      sidebar.style.height = 'auto';
      sidebar.style.maxHeight = 'calc(100vh - 4em)';
    }
    
    // 处理页面中的所有图片
    document.querySelectorAll('img').forEach(img => {
      // 确保所有图片都设置正确的样式
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      
      // 如果图片已加载，修复其尺寸
      if (img.complete) {
        img.style.display = 'block';
      } else {
        // 否则在加载后修复
        img.onload = function() {
          this.style.display = 'block';
        };
      }
    });
  }
  
  /**
   * 预加载图片
   */
  function preloadImages() {
    mainContent.querySelectorAll('img').forEach(img => {
      // 设置默认占位尺寸
      if (!img.width || !img.height) {
        img.style.aspectRatio = img.naturalWidth && img.naturalHeight 
          ? `${img.naturalWidth} / ${img.naturalHeight}` 
          : '16 / 9';
      }
      
      img.onload = function() { this.style.aspectRatio = ''; };
      if (img.complete) img.style.aspectRatio = '';
    });
  }
  
  /**
   * 初始化动态内容
   */
  function initDynamicElements() {
    // 处理懒加载图片
    mainContent.querySelectorAll("img[data-src]").forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute("data-src");
      }
    });
    
    // 执行内联脚本
    mainContent.querySelectorAll("script").forEach(oldScript => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = oldScript.textContent;
      
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
    
    // 初始化第三方库
    if (typeof window.loadCitation === "function") {
      window.loadCitation();
    }
    
    // 处理MathJax
    if (window.MathJax) {
      if (typeof window.MathJax.typeset === 'function') {
        window.MathJax.typeset();
      } else if (window.MathJax.Hub && typeof window.MathJax.Hub.Queue === 'function') {
        window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
      }
    }
  }
  
  /**
   * 为内部链接添加SPA事件
   */
  function attachLinkHandlers() {
    document.querySelectorAll(`a[href^="/"], a[href^="./"], a[href^="../"]`).forEach(link => {
      if (link.hasAttribute(HANDLED_ATTR)) return;
      
      const href = link.getAttribute("href");
      if (!href) return;
      
      // 排除特定链接
      const isResourceLink = href.match(/\.(pdf|zip|jpg|png|gif|mp4)$/i);
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
  
  // 处理浏览器导航
  window.addEventListener("popstate", function(event) {
    const url = event.state?.url || window.location.pathname;
    loadPage(url, false);
  });
  
  // 初始化历史状态
  history.replaceState({ url: currentPath }, document.title, currentPath);
  
  // 附加链接处理器
  attachLinkHandlers();
  
  // 初始修复布局
  fixSidebarAndImages();
  
  // 添加样式
  const style = document.createElement("style");
  style.textContent = `
    /* 全局过渡 */
    html {
      scroll-behavior: smooth;
      scrollbar-gutter: stable;
    }
    
    /* 加载状态 */
    body.is-loading { cursor: wait; }
    body.is-loading #main-content { opacity: 0.7; }
    
    /* 内容过渡 */
    #main-content {
      transition: opacity 0.3s;
      animation: fadeIn 0.3s;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .content-transition-enter {
      opacity: 0;
      transform: translateY(10px);
    }
    
    .content-transition-enter-active {
      opacity: 1;
      transform: translateY(0);
      transition: opacity 0.3s, transform 0.3s;
    }
    
    /* 布局稳定性 */
    .page__inner-wrap {
      min-height: 200px;
    }
    
    /* 头像和侧边栏修复 */
    .author__avatar {
      overflow: hidden;
      width: auto !important;
      height: auto !important;
      margin-bottom: 1em;
    }
    
    .author__avatar img {
      display: block;
      max-width: 100%;
      height: auto;
      margin: 0 auto;
    }
    
    .sidebar {
      position: sticky;
      top: 2em;
      max-height: calc(100vh - 4em);
      overflow-y: auto;
    }
    
    /* 图片处理 */
    img {
      max-width: 100%;
      height: auto;
    }
    
    /* 错误提示 */
    .notice--danger {
      padding: 1.5em;
      background-color: #ffebee;
      border-left: 5px solid #f44336;
      margin: 2em 0;
    }
  `;
  document.head.appendChild(style);
});
