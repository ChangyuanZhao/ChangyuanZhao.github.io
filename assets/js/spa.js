/**
 * acad-homepage SPA 实现 - 直接方式
 * 不使用重定向，而是通过本地存储和延迟加载保持页面状态
 */
document.addEventListener("DOMContentLoaded", function () {
  // 主内容区域
  const mainContent = document.querySelector("#main-content");
  
  // 已处理链接的标记
  const HANDLED_ATTR = "data-spa-handled";
  
  // ==== 页面加载状态管理 ====
  // 1. 在页面加载时保存当前URL
  const currentPath = window.location.pathname;
  
  // 2. 检查是否为子页面
  const isSubpage = currentPath !== "/" && currentPath !== "/index.html";
  
  // 3. 针对子页面刷新的处理
  if (isSubpage) {
    // 检查是否有完整布局
    const hasFullLayout = document.querySelector("header") && 
                          document.querySelector("footer") && 
                          document.querySelector(".sidebar, .author__avatar");
    
    // 在本地存储中检查是否有缓存的内容
    const cachedContent = localStorage.getItem(`page-content-${currentPath}`);
    
    // 如果布局不完整但有缓存的内容，直接使用缓存
    if (!hasFullLayout && cachedContent) {
      // 创建一个临时容器，用于恢复页面
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = cachedContent;
      
      // 使用缓存内容替换当前内容
      if (mainContent) {
        mainContent.innerHTML = cachedContent;
      }
      
      console.log("恢复了缓存的内容:", currentPath);
    }
  }
  
  /**
   * 设置当前页面类型
   */
  function setCurrentPageType(url) {
    // 从URL中提取页面类型
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
    // 保存当前内容高度，减少跳动
    const currentHeight = mainContent.offsetHeight;
    mainContent.style.minHeight = `${currentHeight}px`;
    
    // 添加加载状态
    document.body.classList.add("is-loading");
    
    // 处理URL
    const cleanUrl = url.split("#")[0];
    const hash = url.includes("#") ? url.split("#")[1] : "";
    const requestUrl = cleanUrl.endsWith("/") ? cleanUrl : cleanUrl;
    
    // 更新页面类型
    setCurrentPageType(url);
    
    // 加载页面内容
    fetch(requestUrl)
      .then(response => {
        if (!response.ok) throw new Error(`页面加载失败: ${response.status}`);
        return response.text();
      })
      .then(html => {
        // 解析HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        
        // 查找新内容
        const newContent = doc.querySelector("#main-content");
        const newTitle = doc.querySelector("title")?.textContent || "";
        
        if (newContent && mainContent) {
          // 缓存内容，用于刷新时恢复
          localStorage.setItem(`page-content-${cleanUrl}`, newContent.innerHTML);
          
          // 添加平滑过渡
          const transitionContainer = document.createElement('div');
          transitionContainer.className = 'content-transition-enter';
          transitionContainer.innerHTML = newContent.innerHTML;
          
          // 更新内容
          mainContent.innerHTML = '';
          mainContent.appendChild(transitionContainer);
          
          // 触发过渡动画
          setTimeout(() => {
            transitionContainer.classList.add('content-transition-enter-active');
          }, 10);
          
          // 更新标题和历史记录
          document.title = newTitle;
          if (updateHistory) {
            history.pushState({ url: url }, newTitle, url);
          }
          
          // 预加载图片
          preloadImages();
          
          // 初始化新内容
          setTimeout(() => {
            initDynamicElements();
            attachLinkHandlers();
            
            // 移除高度限制
            mainContent.style.minHeight = '';
            
            // 处理锚点滚动
            if (hash) {
              setTimeout(() => {
                const target = document.getElementById(hash);
                if (target) target.scrollIntoView({ behavior: "smooth" });
              }, 50);
            } else {
              window.scrollTo(0, 0);
            }
          }, 300);
        }
      })
      .catch(error => {
        console.error("加载页面失败:", error);
        
        // 显示错误信息
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
   * 预加载图片
   */
  function preloadImages() {
    mainContent.querySelectorAll('img').forEach(img => {
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
   * 初始化动态元素
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
  
  // 添加样式
  const style = document.createElement("style");
  style.textContent = `
    /* 加载状态 */
    .is-loading { cursor: wait; }
    .is-loading #main-content { opacity: 0.6; transition: opacity 0.3s; }
    
    /* 内容过渡 */
    #main-content { animation: fadeIn 0.3s; will-change: contents; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    
    .content-transition-enter {
      opacity: 0;
      transform: translateY(10px);
    }
    
    .content-transition-enter-active {
      opacity: 1;
      transform: translateY(0);
      transition: opacity 0.3s, transform 0.3s;
    }
    
    /* 图片和布局优化 */
    img { height: auto; }
    html { scrollbar-gutter: stable; }
    .page__inner-wrap { min-height: 200px; }
    
    /* 错误提示 */
    .notice--danger {
      padding: 1.5em;
      background-color: #ffebee;
      border-left: 5px solid #f44336;
      margin: 2em 0;
    }
  `;
  document.head.appendChild(style);
  
  // 预加载相关页面
  function preloadPages() {
    document.querySelectorAll('a.nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('/') && !href.includes('.')) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        document.head.appendChild(link);
      }
    });
  }
  
  // 页面完全加载后初始化
  window.addEventListener('load', function() {
    preloadPages();
    
    // 检查内容并清除可能的占位符
    preloadImages();
    initDynamicElements();
  });
});
