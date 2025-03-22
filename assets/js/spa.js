/**
 * acad-homepage SPA 实现 - 平衡方案
 * 结合了完整布局渲染和当前页面保持的优点
 */
document.addEventListener("DOMContentLoaded", function () {
  // 主内容区域
  const mainContent = document.querySelector("#main-content");
  
  // 已处理链接的标记
  const HANDLED_ATTR = "data-spa-handled";
  
  // ==== 页面初始化 ====
  // 获取当前路径和锚点
  const currentPath = window.location.pathname;
  const currentHash = window.location.hash;
  
  // 隐藏页面内容直到检查完成
  document.body.classList.add("is-loading");
  
  // 检查是否为子页面刷新
  const isSubpage = currentPath !== "/" && currentPath !== "/index.html";
  
  // 立即检查布局完整性
  const hasFullLayout = document.querySelector("header") && 
                        document.querySelector("footer") && 
                        document.querySelector(".sidebar, .author__avatar");
  
  // 只有在子页面刷新且布局不完整时才需要特殊处理
  if (isSubpage && !hasFullLayout) {
    console.log("子页面刷新，布局不完整，正在处理...");
    
    // 1. 隐藏正文以防闪烁
    document.documentElement.style.visibility = "hidden";
    
    // 2. 保存当前页面路径，用于后续恢复
    localStorage.setItem("last-page", currentPath + currentHash);
    
    // 3. 重定向到主页以获取完整布局
    window.location.replace("/");
    
    // 阻止后续执行
    return;
  }
  
  // 设置页面类型
  setCurrentPageType(currentPath);
  
  // ==== 处理从主页恢复到子页面的情况 ====
  const lastPage = localStorage.getItem("last-page");
  if (currentPath === "/" || currentPath === "/index.html") {
    if (lastPage && lastPage !== "/" && lastPage !== "/index.html") {
      console.log("正在从主页恢复到:", lastPage);
      
      // 清除标记
      localStorage.removeItem("last-page");
      
      // 页面完成基本渲染后加载子页面
      // 使用较短的延迟，因为我们不需要等待完整加载
      setTimeout(function() {
        // 显示页面
        document.documentElement.style.visibility = "visible";
        
        // 加载上次的页面
        loadPage(lastPage, true);
      }, 50);
      
      return;
    }
  }
  
  // 对于非恢复情况，确保页面可见
  document.documentElement.style.visibility = "visible";
  
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
  
  /**
   * 固定头像和布局状态
   */
  function stabilizeLayout() {
    const avatarContainer = document.querySelector('.author__avatar');
    const avatarImg = avatarContainer ? avatarContainer.querySelector('img') : null;
    
    if (avatarContainer && avatarImg) {
      if (avatarImg.complete) {
        const rect = avatarImg.getBoundingClientRect();
        avatarContainer.style.height = `${rect.height}px`;
        avatarContainer.style.width = `${rect.width}px`;
      } else {
        avatarImg.onload = function() {
          const rect = this.getBoundingClientRect();
          avatarContainer.style.height = `${rect.height}px`;
          avatarContainer.style.width = `${rect.width}px`;
        };
      }
    }
    
    // 固定侧边栏
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.style.contain = 'layout style';
    }
  }
  
  /**
   * 加载页面内容
   */
  function loadPage(url, updateHistory = true) {
    // 保存当前布局状态
    stabilizeLayout();
    
    // 保存内容高度
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
    
    console.log("加载页面:", url);
    
    // 发起请求
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
        const newInnerWrap = doc.querySelector("#main-content");
        const newTitle = doc.querySelector("title")?.textContent || "";
        
        if (newInnerWrap && mainContent) {
          // 创建平滑过渡
          const transitionContainer = document.createElement('div');
          transitionContainer.className = 'content-transition-enter';
          transitionContainer.innerHTML = newInnerWrap.innerHTML;
          
          // 清空并添加新内容
          mainContent.innerHTML = '';
          mainContent.appendChild(transitionContainer);
          
          // 强制重绘以启动过渡
          transitionContainer.offsetHeight;
          transitionContainer.classList.add('content-transition-enter-active');
          
          // 更新标题和历史
          document.title = newTitle;
          if (updateHistory) {
            history.pushState({ url: url }, newTitle, url);
          }
          
          // 预加载图片并设置占位尺寸
          preloadImages();
          
          // 延迟执行初始化
          setTimeout(() => {
            initDynamicElements();
            attachLinkHandlers();
            
            // 移除高度限制
            setTimeout(() => {
              mainContent.style.minHeight = '';
            }, 200);
            
            // 处理锚点滚动
            if (hash) {
              setTimeout(() => {
                const target = document.getElementById(hash);
                if (target) {
                  target.scrollIntoView({ behavior: "smooth" });
                }
              }, 50);
            } else {
              // 回到顶部
              window.scrollTo(0, 0);
            }
          }, 300);
        }
      })
      .catch(error => {
        console.error("SPA加载错误:", error);
        
        // 显示错误消息
        mainContent.innerHTML = `<div class="notice--danger">
          <h4>加载错误</h4>
          <p>${error.message}</p>
          <p>尝试<a href="${url}" onclick="window.location.reload(); return false;">刷新页面</a>。</p>
        </div>`;
        
        // 移除高度限制
        mainContent.style.minHeight = '';
      })
      .finally(() => {
        // 移除加载状态
        document.body.classList.remove("is-loading");
      });
  }
  
  /**
   * 预加载图片并设置尺寸占位符
   */
  function preloadImages() {
    const images = mainContent.querySelectorAll('img');
    images.forEach(img => {
      // 如果图片没有明确的宽高，设置占位符样式
      if (!img.hasAttribute('width') || !img.hasAttribute('height')) {
        if (img.naturalWidth && img.naturalHeight) {
          // 如果浏览器已经知道图片尺寸，使用实际比例
          img.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
        } else {
          // 否则使用默认比例
          img.style.aspectRatio = '16 / 9';
        }
      }
      
      // 添加加载事件以移除占位符
      img.onload = function() {
        this.style.aspectRatio = '';
      };
      
      // 如果图片已经在缓存中加载完成
      if (img.complete) {
        img.style.aspectRatio = '';
      }
    });
  }
  
  /**
   * 初始化动态加载的元素
   */
  function initDynamicElements() {
    // 处理图片懒加载
    document.querySelectorAll("img[data-src]").forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute("data-src");
      }
    });
    
    // 运行可能的内联脚本
    const scripts = mainContent.querySelectorAll("script");
    scripts.forEach(oldScript => {
      const newScript = document.createElement("script");
      
      // 复制脚本属性
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      
      // 复制脚本内容
      newScript.textContent = oldScript.textContent;
      
      // 替换旧脚本
      if (oldScript.parentNode) {
        oldScript.parentNode.replaceChild(newScript, oldScript);
      }
    });
    
    // 重新初始化可能的第三方库
    if (typeof window.loadCitation === "function") {
      window.loadCitation();
    }
    
    // 如果有使用MathJax，根据不同版本调用不同方法
    if (window.MathJax) {
      // MathJax v3.x
      if (typeof window.MathJax.typeset === 'function') {
        window.MathJax.typeset();
      }
      // MathJax v2.x
      else if (window.MathJax.Hub && typeof window.MathJax.Hub.Queue === 'function') {
        window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
      }
    }
  }
  
  /**
   * 为页面内链接附加SPA导航事件
   */
  function attachLinkHandlers() {
    // 查找所有内部链接
    const links = document.querySelectorAll(`a[href^="/"], a[href^="./"], a[href^="../"]`);
    
    links.forEach(link => {
      // 跳过已处理的链接
      if (link.hasAttribute(HANDLED_ATTR)) {
        return;
      }
      
      const href = link.getAttribute("href");
      if (!href) return;
      
      // 排除资源文件链接和外部链接
      const isResourceLink = href.match(/\.(pdf|zip|rar|jpg|jpeg|png|gif|svg|mp4|mp3|docx?|xlsx?|pptx?)$/i);
      const isMailtoLink = href.startsWith("mailto:");
      const hasProtocol = href.includes("://");
      
      if (!isResourceLink && !isMailtoLink && !hasProtocol) {
        // 标记为已处理
        link.setAttribute(HANDLED_ATTR, "true");
        
        // 添加点击事件
        link.addEventListener("click", function(e) {
          e.preventDefault();
          loadPage(href);
        });
      }
    });
  }
  
  /**
   * 处理浏览器后退/前进导航
   */
  window.addEventListener("popstate", function(event) {
    if (event.state && event.state.url) {
      loadPage(event.state.url, false);
    } else {
      // 如果没有状态，使用当前URL
      loadPage(window.location.pathname + window.location.hash, false);
    }
  });
  
  // 设置初始历史状态
  history.replaceState({ url: currentPath }, document.title, currentPath);
  
  // 初始化页面链接
  attachLinkHandlers();
  
  // 添加样式
  const style = document.createElement("style");
  style.textContent = `
    body.is-loading {
      cursor: wait;
    }
    
    .is-loading #main-content {
      opacity: 0.6;
      transition: opacity 0.3s;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    #main-content {
      animation: fadeIn 0.3s;
      will-change: contents;
      contain: layout style paint;
      position: relative;
    }
    
    /* 平滑内容过渡 */
    .content-transition-enter {
      opacity: 0;
      transform: translateY(10px);
    }
    
    .content-transition-enter-active {
      opacity: 1;
      transform: translateY(0);
      transition: opacity 0.3s, transform 0.3s;
    }
    
    /* 为图片添加占位符尺寸 */
    img {
      height: auto;
    }
    
    /* 禁用页面滚动条跳动 */
    html {
      scrollbar-gutter: stable;
    }
    
    /* 修复头像位置偏移问题 */
    .author__avatar {
      position: relative;
      overflow: hidden;
      transition: none !important;
    }
    
    .author__avatar img {
      display: block;
      max-width: 100%;
      height: auto;
      margin: 0 auto;
      transform: translateZ(0);
      will-change: transform;
      backface-visibility: hidden;
    }
    
    /* 固定侧边栏位置 */
    .sidebar {
      position: sticky;
      top: 2em;
      height: calc(100vh - 4em);
      overflow-y: auto;
      scrollbar-width: thin;
      contain: layout style;
      will-change: contents;
    }
    
    /* 确保页面主容器在过渡期间保持稳定 */
    #main {
      min-height: 100vh;
      contain: layout;
    }
    
    /* 防止内容高度变化导致的布局偏移 */
    .page__inner-wrap {
      min-height: 200px;
    }
    
    /* 修复特定页面之间的切换问题 */
    body[data-current-page="publications"] .author__avatar,
    body[data-current-page="cv"] .author__avatar {
      height: auto !important;
      transition: none !important;
    }
    
    .notice--danger {
      padding: 1.5em;
      background-color: #ffebee;
      border-left: 5px solid #f44336;
      margin: 2em 0;
    }
  `;
  document.head.appendChild(style);
});

// 在页面最上方添加这段代码，确保尽早执行
(function() {
  // 检查是否为刷新后的子页面
  const path = window.location.pathname;
  const isSubpage = path !== "/" && path !== "/index.html";
  
  if (isSubpage) {
    // 检查是否有完整布局（在DOM加载前无法检查，这里只是为了防止闪烁）
    document.documentElement.style.visibility = "hidden";
    
    // 当DOM加载后，spa.js会进行更详细的检查
    // 如果确实需要重定向，会保持隐藏状态
    // 如果不需要重定向，会在spa.js中重新显示
  }
})();
