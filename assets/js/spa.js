document.addEventListener("DOMContentLoaded", function () {
  // 存储完整页面布局
  const layoutElements = {
    header: document.querySelector("header"),
    footer: document.querySelector("footer"),
    sidebar: document.querySelector(".sidebar") || document.querySelector(".author__avatar"),
    // 添加其他布局元素
  };
  
  // 定义内容容器
  const contentContainer = document.querySelector(".page__content") || document.querySelector("#main-content");
  if (!contentContainer) {
    console.error("Content container not found!");
    return;
  }
  
  // 处理页面加载
  function loadPage(url, updateHistory = true) {
    // 显示加载状态
    if (contentContainer) {
      contentContainer.classList.add("is-loading");
    }
    
    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error("Page not found");
        return response.text();
      })
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        
        // 获取新页面的内容
        const newContent = doc.querySelector(".page__content") || doc.querySelector("#main-content");
        const newTitle = doc.querySelector("title").textContent;
        
        // 更新内容和标题
        if (newContent && contentContainer) {
          contentContainer.innerHTML = newContent.innerHTML;
          document.title = newTitle;
          
          // 更新页面状态
          if (updateHistory) {
            history.pushState({ url: url }, newTitle, url);
          }
          
          // 执行可能的脚本
          executeScripts(newContent);
          
          // 重新绑定事件监听器
          attachLinkHandlers();
          
          // 处理图片懒加载或其他特殊元素
          handleSpecialElements();
          
          // 移除加载状态
          contentContainer.classList.remove("is-loading");
          
          // 回到顶部
          window.scrollTo(0, 0);
        }
      })
      .catch(error => {
        console.error("Failed to load page:", error);
        contentContainer.classList.remove("is-loading");
        contentContainer.innerHTML = `<div class="notice--danger">
          <p><strong>页面加载失败</strong></p>
          <p>${error.message}</p>
        </div>`;
      });
  }
  
  // 执行新内容中的脚本
  function executeScripts(contentElement) {
    // 查找内联脚本
    const scripts = contentElement.querySelectorAll("script");
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
      } else {
        contentContainer.appendChild(newScript);
      }
    });
  }
  
  // 处理特殊元素
  function handleSpecialElements() {
    // 图片懒加载
    const lazyImages = document.querySelectorAll("img[data-src]");
    lazyImages.forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
      }
    });
    
    // MathJax 渲染 (如果使用)
    if (window.MathJax) {
      window.MathJax.typeset();
    }
    
    // 引用处理
    if (typeof window.loadCitation === "function") {
      window.loadCitation();
    }
  }
  
  // 附加链接处理器
  function attachLinkHandlers() {
    // 获取所有站内链接
    const links = document.querySelectorAll("a[href^='/']");
    
    links.forEach(link => {
      const href = link.getAttribute("href");
      
      // 排除外部链接、资源链接和锚点链接
      if (
        !href.includes("//") && 
        !href.match(/\.(pdf|zip|jpg|png|gif)$/i) &&
        !link.hasAttribute("data-spa-handled")
      ) {
        // 标记为已处理
        link.setAttribute("data-spa-handled", "true");
        
        // 移除现有事件
        const newLink = link.cloneNode(true);
        if (link.parentNode) {
          link.parentNode.replaceChild(newLink, link);
        }
        
        // 添加 SPA 导航事件
        newLink.addEventListener("click", function(e) {
          e.preventDefault();
          loadPage(href);
        });
      }
    });
  }
  
  // 处理浏览器历史导航
  window.addEventListener("popstate", function(event) {
    if (event.state && event.state.url) {
      loadPage(event.state.url, false);
    } else {
      loadPage(window.location.pathname, false);
    }
  });
  
  // 初始页面加载时保存状态
  history.replaceState({ url: window.location.pathname }, document.title, window.location.pathname);
  
  // 页面刷新处理
  window.addEventListener("beforeunload", function() {
    // 保存当前页面状态到 sessionStorage
    sessionStorage.setItem("lastPath", window.location.pathname);
  });
  
  // 检查是否为刷新后的子页面加载
  const lastPath = sessionStorage.getItem("lastPath");
  if (lastPath && lastPath !== "/" && window.location.pathname === lastPath) {
    // 是子页面刷新，无需特殊处理，因为服务器应该已经渲染好了布局
    console.log("Page refreshed at " + lastPath);
  }
  
  // 初始化链接处理
  attachLinkHandlers();
  
  // 增加 CSS 样式
  const style = document.createElement("style");
  style.textContent = `
    .is-loading {
      opacity: 0.6;
      transition: opacity 0.3s;
      pointer-events: none;
    }
    
    .page-transition {
      transition: opacity 0.3s ease;
    }
  `;
  document.head.appendChild(style);
});
