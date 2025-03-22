/**
 * acad-homepage SPA 实现 - 强化刷新处理
 * 修复地图在页面切换后不显示的问题
 */
document.addEventListener("DOMContentLoaded", function () {
  // 定义关键变量
  const isMobile = window.innerWidth < 768;
  const currentPath = window.location.pathname;
  const mainContent = document.querySelector(".page__content");
  
  // 设置主页背景为白色
  document.body.style.backgroundColor = "#ffffff";
  if (document.querySelector(".page__content")) {
    document.querySelector(".page__content").style.backgroundColor = "#ffffff";
  }
  
  // === 新增：检测刷新操作 ===
  // 使用performance API检测是否为页面刷新
  const isRefresh = (performance && performance.navigation && 
                     performance.navigation.type === 1) || 
                    (window.performance && window.performance.getEntriesByType && 
                     window.performance.getEntriesByType("navigation")[0]?.type === "reload");
  
  // 子页面刷新处理逻辑
  if (isRefresh && currentPath !== "/" && !currentPath.endsWith("index.html")) {
    console.log("检测到子页面刷新操作，重定向至首页后再返回");
    
    // 保存当前路径和滚动位置
    const targetPath = window.location.pathname;
    const scrollPosition = {
      x: window.scrollX,
      y: window.scrollY
    };
    
    // 存储重定向信息
    sessionStorage.setItem('redirectTarget', targetPath);
    sessionStorage.setItem('scrollPosition', JSON.stringify(scrollPosition));
    sessionStorage.setItem('isRefresh', 'true');
    
    // 跳转到首页
    window.location.href = "/";
    return;
  }
  
  // 检查是否为子页面直接访问（非刷新情况）
  if (!isRefresh && currentPath !== "/" && !currentPath.endsWith("index.html")) {
    console.log("子页面直接访问，使用传统导航");
    
    // === 关键修改：子页面访问时确保完整布局 ===
    // 检查是否缺少主要布局元素
    const mainContainer = document.querySelector(".layout--single");
    const masthead = document.querySelector(".masthead");
    const sidebar = document.querySelector(".sidebar");
    
    if (!mainContainer || !masthead || !sidebar) {
      console.log("子页面访问时缺少布局，重定向到首页并带上目标路径");
      
      // 保存当前路径
      const targetPath = window.location.pathname;
      sessionStorage.setItem('redirectTarget', targetPath);
      sessionStorage.setItem('isRefresh', 'false'); // 标记为非刷新重定向
      
      // 跳转到首页
      window.location.href = "/";
      return;
    }
    
    // 处理样式一致性问题 - 确保子页面样式和主页一致
    ensureConsistentStyle();
    
    // 初始化内容
    if (mainContent) {
      initContent();
    }
    
    // 初始绑定链接
    bindLinks();
    
    // 子页面使用传统导航，不启用SPA加载
    return;
  }
  
  // === 增强：首页加载时检查是否有重定向目标 ===
  if (currentPath === "/" || currentPath.endsWith("index.html")) {
    const redirectTarget = sessionStorage.getItem('redirectTarget');
    const isRefreshRedirect = sessionStorage.getItem('isRefresh') === 'true';
    
    if (redirectTarget) {
      console.log(`检测到重定向目标: ${redirectTarget}, 刷新状态: ${isRefreshRedirect ? '刷新' : '常规'}`);
      
      // 清除存储的目标和刷新状态
      sessionStorage.removeItem('redirectTarget');
      sessionStorage.removeItem('isRefresh');
      
      // 恢复滚动位置（如果有）
      const savedScrollPosition = sessionStorage.getItem('scrollPosition');
      if (savedScrollPosition) {
        try {
          const position = JSON.parse(savedScrollPosition);
          sessionStorage.removeItem('scrollPosition');
          
          // 在页面跳转后恢复滚动位置
          const restoreScroll = () => {
            window.scrollTo(position.x, position.y);
            console.log(`恢复滚动位置: (${position.x}, ${position.y})`);
          };
          
          // 记录恢复滚动的函数，稍后执行
          window.restoreScrollPosition = restoreScroll;
        } catch (e) {
          console.error("解析滚动位置时出错:", e);
        }
      }
      
      // 优先等待首页完全加载后再跳转
      // 刷新操作使用稍长的延迟确保样式完全加载
      const delay = isRefreshRedirect ? 500 : 300;
      setTimeout(() => {
        loadPage(redirectTarget, true); // 第二个参数表示这是重定向后的加载
      }, delay);
    }
  }
  
  // 没有主内容区域则退出
  if (!mainContent) {
    console.error("无法找到.page__content，禁用SPA");
    return;
  }
  
  // 链接处理标记
  const HANDLED_ATTR = "data-spa-link";
  
  // 确保样式一致性的函数
  function ensureConsistentStyle() {
    // 添加CSS样式确保页面背景为白色
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      body, .page__content, .layout--single {
        background-color: #ffffff !important;
      }
    `;
    document.head.appendChild(styleElement);
    
    // 检查并修复可能的布局问题
    const layoutElement = document.querySelector('.layout--single');
    if (layoutElement) {
      layoutElement.style.backgroundColor = "#ffffff";
    }
  }
  
  // 增强的页面加载函数，支持刷新后恢复
  function loadPage(url, isRedirectLoad = false) {
    // 简单的加载指示
    const loadingDiv = document.createElement("div");
    loadingDiv.textContent = "Loading...";
    loadingDiv.style.position = "fixed";
    loadingDiv.style.top = "50%";
    loadingDiv.style.left = "50%";
    loadingDiv.style.transform = "translate(-50%, -50%)";
    loadingDiv.style.padding = "10px";
    loadingDiv.style.background = "rgba(0,0,0,0.5)";
    loadingDiv.style.color = "white";
    loadingDiv.style.borderRadius = "5px";
    loadingDiv.style.zIndex = "9999";
    document.body.appendChild(loadingDiv);
    
    // 获取页面
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`页面加载失败: ${response.status}`);
        }
        return response.text();
      })
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const newContent = doc.querySelector(".page__content");
        
        if (newContent) {
          // 更新标题
          document.title = doc.title;
          
          // === 关键修改：保留布局，只更新主内容 === 
          mainContent.innerHTML = newContent.innerHTML;
          
          // 更新URL (如果是重定向加载，使用replace而不是push，避免历史记录重复)
          if (isRedirectLoad) {
            history.replaceState({url: url}, document.title, url);
          } else {
            history.pushState({url: url}, document.title, url);
          }
          
          // 初始化内容
          initContent();
          
          // 重新绑定链接
          bindLinks();
          
          // 如果需要恢复滚动位置
          if (isRedirectLoad && window.restoreScrollPosition) {
            setTimeout(() => {
              window.restoreScrollPosition();
              window.restoreScrollPosition = null; // 清除函数引用
            }, 100);
          } else {
            // 正常导航，回到顶部
            window.scrollTo(0, 0);
          }
        } else {
          // 回退到传统导航
          window.location.href = url;
        }
      })
      .catch(error => {
        console.error("SPA加载错误:", error);
        // 始终回退到传统导航
        window.location.href = url;
      })
      .finally(() => {
        // 移除加载指示
        document.body.removeChild(loadingDiv);
      });
  }
  
  // 初始化页面内容
  function initContent() {
    // 处理内联脚本
    const scripts = mainContent.querySelectorAll("script");
    scripts.forEach(oldScript => {
      const newScript = document.createElement("script");
      
      // 复制属性
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      
      // 复制内容
      newScript.innerHTML = oldScript.innerHTML;
      
      // 替换旧脚本
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
    
    // === 修复：更强大的地图初始化处理 ===
    if (typeof window.initTravelMap === 'function') {
      console.log("检测到地图初始化函数，准备加载地图...");
      // 使用更长的延迟以确保DOM完全加载
      setTimeout(() => {
        try {
          // 检查地图容器是否存在
          const mapContainer = document.getElementById('travel-map') || document.querySelector('.travel-map-container');
          if (mapContainer) {
            console.log("找到地图容器，初始化地图");
            window.initTravelMap();
          } else {
            console.log("未找到地图容器，跳过地图初始化");
          }
        } catch (e) {
          console.error("地图初始化错误:", e);
        }
      }, 800); // 增加延迟时间
    } else {
      console.log("未检测到地图初始化函数");
    }
    
    // === 新增：触发自定义事件，通知页面内容已更新 ===
    const contentUpdateEvent = new CustomEvent('spa:contentUpdated', {
      detail: { path: window.location.pathname }
    });
    document.dispatchEvent(contentUpdateEvent);
    
    // 确保背景颜色为白色
    document.body.style.backgroundColor = "#ffffff";
    if (mainContent) {
      mainContent.style.backgroundColor = "#ffffff";
    }
    
    // === 关键修改：检查和修复边栏激活状态 ===
    const currentPath = window.location.pathname;
    document.querySelectorAll('.sidebar .nav__items a').forEach(link => {
      const href = link.getAttribute('href');
      // 清除所有激活状态
      link.parentElement.classList.remove('active');
      
      // 为当前页面设置激活状态
      if (href && currentPath.includes(href) && href !== '/') {
        link.parentElement.classList.add('active');
      }
    });
  }
  
  // 绑定所有内部链接
  function bindLinks() {
    document.querySelectorAll('a[href^="/"]').forEach(link => {
      // 跳过已处理链接
      if (link.hasAttribute(HANDLED_ATTR)) return;
      
      const href = link.getAttribute('href');
      
      // 跳过资源链接
      if (href.match(/\.(pdf|zip|jpg|png|gif|svg)$/i)) return;
      
      // 标记为已处理
      link.setAttribute(HANDLED_ATTR, "true");
      
      // 添加点击处理
      link.addEventListener('click', function(e) {
        e.preventDefault();
        loadPage(href);
      });
    });
  }
  
  // 处理后退按钮
  window.addEventListener('popstate', function(event) {
    if (event.state && event.state.url) {
      loadPage(event.state.url);
    } else {
      loadPage(window.location.pathname);
    }
  });
  
  // 初始绑定链接
  bindLinks();
  
  // === 新增：监听地图初始化需求 ===
  document.addEventListener('spa:needMapInit', function() {
    if (typeof window.initTravelMap === 'function') {
      console.log("收到地图初始化请求");
      setTimeout(window.initTravelMap, 300);
    }
  });
});
