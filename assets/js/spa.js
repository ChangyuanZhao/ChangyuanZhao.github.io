/**
 * acad-homepage SPA 实现
 * 专为 Jekyll 生成的学术主页设计
 */
document.addEventListener("DOMContentLoaded", function () {
  // 主内容区域
  const mainContent = document.querySelector("#main-content");
  
  // 已处理链接的标记，防止重复绑定事件
  const HANDLED_ATTR = "data-spa-handled";
  
  /**
   * 加载页面内容
   * @param {string} url - 要加载的页面URL
   * @param {boolean} updateHistory - 是否更新浏览器历史
   */
  function loadPage(url, updateHistory = true) {
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
            
            // 移除高度限制，允许内容自然调整
            mainContent.style.minHeight = '';
            
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
  
  // 检查是否为子页面刷新
  const lastPath = sessionStorage.getItem("lastPath");
  const isSubpageRefresh = lastPath && lastPath !== "/" && currentPath === lastPath;
  
  // 如果是子页面刷新并且检测到布局不完整，尝试恢复
  if (isSubpageRefresh) {
    const hasFullLayout = document.querySelector("header") && 
                          document.querySelector("footer") && 
                          document.querySelector(".sidebar, .author__avatar");
    
    if (!hasFullLayout) {
      // 如果子页面刷新后没有完整布局，重定向到主页并记录原始请求的路径
      sessionStorage.setItem("redirectedFrom", currentPath);
      window.location.href = "/";
      // 阻止后续代码执行
      throw new Error("Redirecting to homepage to restore layout");
    }
  }
  
  // 检查是否从主页重定向而来
  const redirectedFrom = sessionStorage.getItem("redirectedFrom");
  if (redirectedFrom) {
    // 清除重定向标记
    sessionStorage.removeItem("redirectedFrom");
    // 加载原始请求的页面
    setTimeout(() => {
      loadPage(redirectedFrom, true);
    }, 100);
  }
  
  // 初始化页面链接
  attachLinkHandlers();
  
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
    
    .notice--danger {
      padding: 1.5em;
      background-color: #ffebee;
      border-left: 5px solid #f44336;
      margin: 2em 0;
    }
  `;
  document.head.appendChild(style);
});
