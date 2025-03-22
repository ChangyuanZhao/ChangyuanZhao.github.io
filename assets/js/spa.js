/**
 * 跨浏览器兼容的SPA刷新处理
 * 支持Chrome和其他主流浏览器
 */
document.addEventListener("DOMContentLoaded", function () {
  // 定义关键变量
  const currentPath = window.location.pathname;
  const mainContent = document.querySelector(".page__content");
  const isChrome = /Chrome/.test(navigator.userAgent) && !/Edge|Edg/.test(navigator.userAgent);
  
  console.log("当前浏览器:", isChrome ? "Chrome" : "非Chrome浏览器");
  console.log("当前路径:", currentPath);
  
  // 设置主页背景为白色 (确保在所有浏览器中始终执行)
  function enforceBackgroundColor() {
    // 使用强制样式设置背景色
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      body, .page__content, .layout--single, .initial-content, .archive {
        background-color: #ffffff !important;
      }
    `;
    document.head.appendChild(styleElement);
    
    // 直接设置DOM元素样式
    document.body.style.backgroundColor = "#ffffff";
    
    // 设置所有可能的容器元素
    const containers = [
      ".page__content", 
      ".layout--single",
      ".initial-content",
      ".archive",
      "main",
      ".container"
    ];
    
    containers.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if(el) el.style.backgroundColor = "#ffffff";
      });
    });
    
    console.log("强制设置背景颜色完成");
  }
  
  // 立即执行背景颜色设置
  enforceBackgroundColor();
  
  // === Chrome特定处理 ===
  // 如果是Chrome浏览器并且在子页面，可能需要特殊处理
  if (isChrome && currentPath !== "/" && !currentPath.endsWith("index.html")) {
    // 检查页面是否是刷新访问的
    const isPageRefresh = (
      (performance && performance.navigation && performance.navigation.type === 1) ||
      (window.performance && window.performance.getEntriesByType && 
       window.performance.getEntriesByType("navigation")[0]?.type === "reload")
    );
    
    // 在Chrome浏览器中检测到子页面刷新时的特殊处理
    if (isPageRefresh) {
      console.log("Chrome浏览器检测到子页面刷新，使用特殊处理");
      
      // 保存当前路径以便返回
      const currentUrl = window.location.href;
      sessionStorage.setItem('chromeRefreshUrl', currentUrl);
      
      // 添加加载指示器
      const loadingIndicator = document.createElement('div');
      loadingIndicator.innerHTML = '<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.8);z-index:9999;display:flex;justify-content:center;align-items:center;"><div>加载中...</div></div>';
      document.body.appendChild(loadingIndicator);
      
      // 使用异步延时确保当前页面的所有资源都已经加载完成
      setTimeout(() => {
        // 强制重新加载当前页面 - 这会绕过缓存并完全重新渲染页面
        window.location.reload(true);
      }, 50);
    }
  }
  
  // 检查是否是从Chrome刷新重定向回来的状态
  const chromeRefreshUrl = sessionStorage.getItem('chromeRefreshUrl');
  if (chromeRefreshUrl) {
    console.log("检测到Chrome刷新重定向状态，清除状态");
    sessionStorage.removeItem('chromeRefreshUrl');
  }
  
  // 通用的子页面处理 - 非Chrome浏览器或Chrome非刷新访问
  if (!isChrome && currentPath !== "/" && !currentPath.endsWith("index.html")) {
    console.log("非Chrome浏览器子页面访问，使用传统处理");
    
    // 检查是否缺少主要布局元素
    const mainContainer = document.querySelector(".layout--single");
    const masthead = document.querySelector(".masthead");
    const sidebar = document.querySelector(".sidebar");
    
    if (!mainContainer || !masthead || !sidebar) {
      console.log("检测到子页面缺少布局元素，重定向到首页");
      
      // 记住当前URL以便返回
      sessionStorage.setItem('redirectTarget', window.location.pathname);
      
      // 跳转到首页
      window.location.href = "/";
      return;
    }
  }
  
  // 处理从主页到子页面的重定向
  if (currentPath === "/" || currentPath.endsWith("index.html")) {
    const redirectTarget = sessionStorage.getItem('redirectTarget');
    if (redirectTarget) {
      console.log("主页检测到重定向目标:", redirectTarget);
      sessionStorage.removeItem('redirectTarget');
      
      // 确保主页完全加载后再跳转
      setTimeout(() => {
        console.log("执行重定向跳转到:", redirectTarget);
        window.location.href = redirectTarget;
      }, 500);
    }
  }
  
  // === 全局背景处理器 - 在页面加载和DOM变化时运行 ===
  // 创建MutationObserver来监听DOM变化并确保背景颜色
  const backgroundObserver = new MutationObserver(() => {
    enforceBackgroundColor();
  });
  
  // 监听文档体的变化
  backgroundObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class']
  });
  
  // 在页面加载后和每隔一段时间强制执行背景颜色
  window.addEventListener('load', enforceBackgroundColor);
  
  // 定期检查并强制应用背景颜色 (页面完全加载后)
  setTimeout(() => {
    enforceBackgroundColor();
    
    // 之后每秒检查一次背景颜色，持续5秒
    let checkCount = 0;
    const intervalId = setInterval(() => {
      enforceBackgroundColor();
      checkCount++;
      if (checkCount >= 5) {
        clearInterval(intervalId);
      }
    }, 1000);
  }, 1000);
});
