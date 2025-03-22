/**
 * acad-homepage SPA 实现
 * 支持子页面刷新并保持布局完整性
 */

// 在页面加载前保存当前布局状态
const savedPath = window.location.pathname;
let needsRefresh = false;

// 检查是否有布局
function checkLayout() {
  // 检查关键布局元素是否存在
  const hasHeader = document.querySelector("header");
  const hasSidebar = document.querySelector(".sidebar, .author__avatar");
  const hasFooter = document.querySelector("footer");
  
  return hasHeader && hasSidebar && hasFooter;
}

document.addEventListener("DOMContentLoaded", function () {
  // 主内容区域
  const mainContent = document.querySelector("#main-content");
  
  // 已处理链接的标记
  const HANDLED_ATTR = "data-spa-handled";
  
  // 检查布局并处理子页面刷新
  if (savedPath !== "/" && savedPath !== "/index.html") {
    // 等待一段时间再检查布局
    setTimeout(function() {
      if (!checkLayout()) {
        console.log("子页面缺少布局, 正在完整刷新页面");
        // 标记为需要强制刷新
        localStorage.setItem("forceReload", savedPath);
        // 使用 location.href 跳转到自身，这会触发完整页面加载
        window.location.href = savedPath;
        return;
      }
    }, 100);
  }
  
  // 检查是否是强制刷新后的访问
  const forceReload = localStorage.getItem("forceReload");
  if (forceReload) {
    // 清除标记
    localStorage.removeItem("forceReload");
    console.log("完成了强制刷新，页面应该有完整布局了");
  }
  
  /**
   * 加载页面内容
   */
  function loadPage(url, updateHistory = true) {
    // 添加加载状态
    document.body.classList.add("is-loading");
    
    // 处理URL
    const cleanUrl = url.split("#")[0];
    const hash = url.includes("#") ? url.split("#")[1] : "";
    const requestUrl = cleanUrl.endsWith("/") ? cleanUrl : cleanUrl;
    
    console.log("SPA加载页面:", url);
    
    // 请求页面内容
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
          // 使用平滑过渡效果
          const transitionContainer = document.createElement('div');
          transitionContainer.className = 'content-transition-enter';
          transitionContainer.innerHTML = newContent.innerHTML;
          
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
          
          // 初始化新内容
          setTimeout(() => {
            initDynamicElements();
            attachLinkHandlers();
            fixLayout();
            
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
        console.error("页面加载错误:", error);
        mainContent.innerHTML = `
          <div class="notice--danger">
            <h4>加载错误</h4>
            <p>${error.message}</p>
            <p>尝试<a href="${url}">重新加载</a>页面</p>
          </div>
        `;
      })
      .finally(() => {
        document.body.classList.remove("is-loading");
      });
  }
  
  /**
   * 修复布局问题
   */
  function fixLayout() {
    // 修复头像和侧边栏
    const avatarContainer = document.querySelector('.author__avatar');
    if (avatarContainer) {
      avatarContainer.style.display = 'block';
      avatarContainer.style.overflow = 'hidden';
      avatarContainer.style.marginBottom = '1em';
      
      const avatarImg = avatarContainer.querySelector('img');
      if (avatarImg) {
        avatarImg.style.maxWidth = '100%';
        avatarImg.style.height = 'auto';
        avatarImg.style.display = 'block';
      }
    }
    
    // 修复侧边栏
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.style.display = 'block';
    }
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
  
  // 设置初始历史状态
  const currentPath = window.location.pathname;
  history.replaceState({ url: currentPath }, document.title, currentPath);
  
  // 附加链接处理器
  attachLinkHandlers();
  
  // 修复初始布局
  fixLayout();
  
  // 添加样式
  const style = document.createElement("style");
  style.textContent = `
    /* 加载状态 */
    body.is-loading { cursor: wait; }
    body.is-loading #main-content { opacity: 0.7; transition: opacity 0.3s; }
    
    /* 内容过渡 */
    .content-transition-enter {
      opacity: 0;
      transform: translateY(10px);
    }
    
    .content-transition-enter-active {
      opacity: 1;
      transform: translateY(0);
      transition: opacity 0.3s, transform 0.3s;
    }
    
    /* 布局修复 */
    .author__avatar {
      overflow: hidden;
      display: block;
      margin-bottom: 1em;
    }
    
    .author__avatar img {
      max-width: 100%;
      height: auto;
      display: block;
    }
    
    .sidebar {
      display: block;
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
