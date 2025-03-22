/**
 * acad-homepage SPA 实现
 * 专为 Jekyll 生成的学术主页设计
 */
document.addEventListener("DOMContentLoaded", function () {
  // 主内容区域
  const mainContent = document.querySelector("#main-content");
  
  // 已处理链接的标记，防止重复绑定事件
  const HANDLED_ATTR = "data-spa-handled";
  
  // 添加初始隐藏样式，防止子页面刷新时闪烁
  (function preventFlash() {
    // 检查是否为子页面刷新
    const lastPath = sessionStorage.getItem("lastPath");
    const currentPath = window.location.pathname;
    const isSubpageRefresh = lastPath && lastPath !== "/" && currentPath === lastPath;
    
    if (isSubpageRefresh) {
      // 检查布局是否完整
      const hasFullLayout = document.querySelector("header") && 
                            document.querySelector("footer") && 
                            document.querySelector(".sidebar, .author__avatar");
                            
      if (!hasFullLayout) {
        // 如果布局不完整，立即添加隐藏样式
        document.documentElement.style.visibility = "hidden";
        
        // 设置重定向标记
        sessionStorage.setItem("redirectedFrom", currentPath);
        
        // 使用更平滑的方式重定向到主页
        window.location.replace("/");
        return;
      }
    }
    
    // 设置当前页面类型
    setCurrentPageType(window.location.pathname);
    
    // 添加页面过渡样式
    const style = document.createElement("style");
    style.textContent = `
      html.content-loading {
        visibility: hidden;
      }
      
      html.content-loaded {
        visibility: visible;
        transition: opacity 0.3s ease;
      }
    `;
    document.head.appendChild(style);
  })();
  
  /**
   * 根据URL设置当前页面类型标记
   */
  function setCurrentPageType(url) {
    // 根据URL确定页面类型
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
    
    // 设置body的数据属性以便CSS可以针对特定页面类型应用样式
    document.body.setAttribute("data-current-page", pageType);
  }
  
  /**
   * 保存头像和侧边栏的布局状态
   */
  function saveLayoutState() {
    const avatarContainer = document.querySelector('.author__avatar');
    const sidebar = document.querySelector('.sidebar');
    
    if (!avatarContainer || !sidebar) return null;
    
    // 记录当前侧边栏和头像的位置
    const avatarRect = avatarContainer.getBoundingClientRect();
    const sidebarRect = sidebar.getBoundingClientRect();
    
    return {
      avatarTop: avatarRect.top,
      avatarHeight: avatarRect.height,
      avatarWidth: avatarRect.width,
      sidebarTop: sidebarRect.top
    };
  }
  
  /**
   * 固定头像位置，防止切换页面时的偏移
   */
  function stabilizePhotos() {
    const avatarContainer = document.querySelector('.author__avatar');
    const avatarImg = avatarContainer ? avatarContainer.querySelector('img') : null;
    
    if (avatarImg) {
      // 如果图片已加载完成，记录其位置和尺寸
      if (avatarImg.complete) {
        const rect = avatarImg.getBoundingClientRect();
        avatarContainer.style.height = `${rect.height}px`;
        avatarContainer.style.width = `${rect.width}px`;
      } else {
        // 如果图片未加载完成，添加加载事件
        avatarImg.onload = function() {
          const rect = this.getBoundingClientRect();
          avatarContainer.style.height = `${rect.height}px`;
          avatarContainer.style.width = `${rect.width}px`;
        };
      }
    }
  }
  
  /**
   * 加载页面内容
   * @param {string} url - 要加载的页面URL
   * @param {boolean} updateHistory - 是否更新浏览器历史
   */
  function loadPage(url, updateHistory = true) {
    // 保存当前布局状态
    const layoutState = saveLayoutState();
    
    // 先固定头像位置，防止布局偏移
    stabilizePhotos();
    
    // 保存当前内容区域高度，以减少内容加载时的跳动
    const currentHeight = mainContent.offsetHeight;
    mainContent.style.minHeight = `${currentHeight}px`;
    
    // 添加加载状态指示
    document.body.classList.add("is-loading");
    
    // 处理URL，确保格式正确
    const cleanUrl = url.split("#")[0];
    const hash = url.includes("#") ? url.split("#")[1] : "";
    
    // 对于路径结尾的URL，如果服务器返回目录索引则自动追加index.html
    const requestUrl = cleanUrl.endsWith("/") ? cleanUrl : cleanUrl;
    
    // 设置当前页面类型
    setCurrentPageType(url);
    
    // 发送请求获取页面
    fetch(requestUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`页面加载失败: ${response.status}`);
        }
        return response.text();
      })
      .then(html => {
        // 解析HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        
        // 查找新页面中的内容区域
        const newInnerWrap = doc.querySelector("#main-content");
        const newTitle = doc.querySelector("title")?.textContent || "";
        
        if (newInnerWrap && mainContent) {
          // 创建过渡容器进行平滑过渡
          const transitionContainer = document.createElement('div');
          transitionContainer.className = 'content-transition-enter';
          transitionContainer.innerHTML = newInnerWrap.innerHTML;
          
          // 清空并添加新内容
          mainContent.innerHTML = '';
          mainContent.appendChild(transitionContainer);
          
          // 强制重绘以启动过渡
          transitionContainer.offsetHeight;
          transitionContainer.classList.add('content-transition-enter-active');
          
          // 更新页面标题
          document.title = newTitle;
          
          // 更新浏览器历史
          if (updateHistory) {
            history.pushState({ url: url }, newTitle, url);
          }
          
          // 预加载图片并设置占位尺寸
          preloadImages();
          
          // 延迟执行其他初始化，等待过渡完成
          setTimeout(() => {
            // 处理任何需要JavaScript初始化的元素
            initDynamicElements();
            
            // 重新绑定链接事件
            attachLinkHandlers();
            
            // 恢复布局状态，保持照片位置稳定
            if (layoutState) {
              const avatarContainer = document.querySelector('.author__avatar');
              if (avatarContainer) {
                avatarContainer.style.height = `${layoutState.avatarHeight}px`;
                avatarContainer.style.width = `${layoutState.avatarWidth}px`;
              }
            }
            
            // 移除高度限制，允许内容自然调整
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
        
        // 处理加载失败 - 你可以选择回退到完整页面加载
        if (error.message.includes("404")) {
          // 对于404错误，可以选择导航到主页或显示错误消息
          mainContent.innerHTML = `<div class="notice--danger">
            <h4>页面未找到</h4>
            <p>请尝试从<a href="/">主页</a>重新开始浏览。</p>
          </div>`;
        } else {
          // 对于其他错误，显示错误消息
          mainContent.innerHTML = `<div class="notice--danger">
            <h4>加载错误</h4>
            <p>${error.message}</p>
            <p>尝试<a href="${url}" onclick="window.location.reload(); return false;">刷新页面</a>。</p>
          </div>`;
        }
        
        // 错误情况下也要移除高度限制
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
  
  /**
   * 检查页面刷新情况
   */
  window.addEventListener("beforeunload", function() {
    // 保存刷新前的路径
    sessionStorage.setItem("lastPath", window.location.pathname);
  });
  
  // 设置初始历史状态
  const currentPath = window.location.pathname + window.location.hash;
  history.replaceState({ url: currentPath }, document.title, currentPath);
  
  // 检查是否从主页重定向而来
  const redirectedFrom = sessionStorage.getItem("redirectedFrom");
  if (redirectedFrom) {
    // 清除重定向标记
    sessionStorage.removeItem("redirectedFrom");
    
    // 检查页面是否已经完全加载
    if (document.readyState === 'complete') {
      // 立即加载原始请求的页面
      loadPage(redirectedFrom, true);
    } else {
      // 如果页面还在加载中，等待完全加载后再加载原始页面
      window.addEventListener('load', function() {
        setTimeout(() => {
          loadPage(redirectedFrom, true);
        }, 10);
      });
    }
  }
  
  // 初始化页面链接
  attachLinkHandlers();
  
  // 页面加载完成后固定头像位置
  window.addEventListener('load', stabilizePhotos);
  
  // 添加样式
  const style = document.createElement("style");
  style.textContent = `
    .is-loading {
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
  
  // 为子页面添加预加载链接，提高导航速度
  function addPreloadLinks() {
    const navLinks = document.querySelectorAll('a.nav-link');
    const head = document.head;
    
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('/') && !href.includes('.')) {
        const preloadLink = document.createElement('link');
        preloadLink.rel = 'prefetch';
        preloadLink.href = href;
        head.appendChild(preloadLink);
      }
    });
  }
  
  // 页面加载完成后添加预加载链接
  window.addEventListener('load', addPreloadLinks);
  
  // 确保在 DOMContentLoaded 后让页面可见
  document.documentElement.classList.add('content-loaded');
});
