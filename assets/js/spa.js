/**
 * acad-homepage SPA 实现
 * 专为 Jekyll 生成的学术主页设计
 * 改进版：减少页面切换时的垂直跳动
 */
document.addEventListener("DOMContentLoaded", function () {
  // 主内容区域
  const mainContent = document.querySelector("#main-content");
  
  // 已处理链接的标记，防止重复绑定事件
  const HANDLED_ATTR = "data-spa-handled";
  
  // 记录当前内容区域高度
  let lastContentHeight = 0;
  
  /**
   * 加载页面内容
   * @param {string} url - 要加载的页面URL
   * @param {boolean} updateHistory - 是否更新浏览器历史
   */
  function loadPage(url, updateHistory = true) {
    // 在加载前记录当前内容区域高度
    if (mainContent) {
      lastContentHeight = mainContent.offsetHeight;
      
      // 设置最小高度来防止内容区域收缩
      mainContent.style.minHeight = `${lastContentHeight}px`;
    }
    
    // 添加加载状态指示，但不改变透明度（避免闪烁）
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
          // 在更新内容前准备新内容的容器
          const tempDiv = document.createElement('div');
          tempDiv.style.visibility = 'hidden';
          tempDiv.style.position = 'absolute';
          tempDiv.style.width = getComputedStyle(mainContent).width;
          tempDiv.innerHTML = newInnerWrap.innerHTML;
          document.body.appendChild(tempDiv);
          
          // 获取新内容的高度
          const newContentHeight = tempDiv.offsetHeight;
          document.body.removeChild(tempDiv);
          
          // 应用淡入淡出过渡效果，但保持高度稳定
          mainContent.classList.add('content-transitioning-out');
          
          setTimeout(() => {
            // 更新内容
            mainContent.innerHTML = newInnerWrap.innerHTML;
            
            // 更新页面标题
            document.title = newTitle;
            
            // 更新浏览器历史
            if (updateHistory) {
              history.pushState({ url: url }, newTitle, url);
            }
            
            // 处理任何需要JavaScript初始化的元素
            initDynamicElements();
            
            // 重新绑定链接事件
            attachLinkHandlers();
            
            // 淡入新内容
            mainContent.classList.remove('content-transitioning-out');
            mainContent.classList.add('content-transitioning-in');
            
            // 逐渐调整到新内容的高度，使用动画过渡
            mainContent.style.minHeight = `${newContentHeight}px`;
            
            // 处理锚点滚动
            if (hash) {
              setTimeout(() => {
                const target = document.getElementById(hash);
                if (target) {
                  target.scrollIntoView({ behavior: "smooth" });
                }
              }, 100);
            } else {
              // 回到顶部
              window.scrollTo(0, 0);
            }
            
            // 完成后移除过渡类
            setTimeout(() => {
              mainContent.classList.remove('content-transitioning-in');
              // 完全加载后允许内容自然调整高度
              setTimeout(() => {
                mainContent.style.minHeight = '';
              }, 300);
            }, 300);
          }, 150); // 短暂延迟以允许淡出效果
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
        
        // 移除最小高度限制
        mainContent.style.minHeight = '';
      })
      .finally(() => {
        // 移除加载状态
        document.body.classList.remove("is-loading");
      });
  }
  
  /**
   * 修复侧边栏高度问题 - 改进版，避免跳动
   */
  function fixSidebarHeight() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('#main-content');
    
    if (sidebar && mainContent) {
      // 使用requestAnimationFrame确保计算发生在正确的时机
      requestAnimationFrame(() => {
        // 先获取现有的侧边栏高度
        const currentSidebarHeight = sidebar.offsetHeight;
        const contentHeight = mainContent.offsetHeight;
        
        // 只在内容真的比侧边栏高时才调整，并且使用平滑过渡
        if (contentHeight > currentSidebarHeight) {
          // 使用CSS过渡来平滑调整高度
          sidebar.style.minHeight = contentHeight + 'px';
        }
      });
    }
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
    
    // 添加旅行地图初始化
    if (typeof window.initTravelMap === 'function') {
      console.log("SPA: 检测到旅行地图，尝试初始化");
      setTimeout(window.initTravelMap, 100);
    }
    
    // 修复侧边栏高度问题 - 使用延迟执行多次以确保在内容完全加载后调整
    setTimeout(fixSidebarHeight, 100);
    setTimeout(fixSidebarHeight, 300);
    setTimeout(fixSidebarHeight, 600);
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
    localStorage.setItem("lastPath", window.location.pathname);
  });
  
  // 设置初始历史状态
  const currentPath = window.location.pathname + window.location.hash;
  history.replaceState({ url: currentPath }, document.title, currentPath);
  
  // 检查是否为子页面刷新
  const lastPath = localStorage.getItem("lastPath");
  const isSubpageRefresh = lastPath && lastPath !== "/" && currentPath === lastPath;
  
  // 如果是子页面刷新并且检测到布局不完整，尝试恢复
  if (isSubpageRefresh) {
    const hasFullLayout = document.querySelector("header") && 
                          document.querySelector("footer") && 
                          document.querySelector(".sidebar, .author__avatar");
    
    if (!hasFullLayout) {
      console.log("检测到子页面刷新且布局不完整，重定向到主页...");
      // 如果子页面刷新后没有完整布局，重定向到主页并记录原始请求的路径
      localStorage.setItem("redirectedFrom", currentPath);
      window.location.href = "/";
      // 阻止后续代码执行
      throw new Error("Redirecting to homepage to restore layout");
    }
  }
  
  // 检查是否从主页重定向而来
  const redirectedFrom = localStorage.getItem("redirectedFrom");
  if (redirectedFrom) {
    console.log("从主页重定向回到原始页面:", redirectedFrom);
    // 清除重定向标记
    localStorage.removeItem("redirectedFrom");
    // 加载原始请求的页面
    setTimeout(() => {
      loadPage(redirectedFrom, true);
    }, 200); // 稍微增加延迟，确保主页完全加载
  }
  
  // 初始化页面链接
  attachLinkHandlers();
  
  // 添加样式
  const style = document.createElement("style");
  style.textContent = `
    html {
      overflow-y: scroll;
    }
    
    .is-loading {
      cursor: wait;
    }
    
    /* 更平滑的内容过渡效果 */
    #main-content {
      transition: min-height 0.3s ease-out;
    }
    
    .content-transitioning-out {
      opacity: 0.3;
      transition: opacity 0.15s ease-out;
    }
    
    .content-transitioning-in {
      opacity: 1;
      transition: opacity 0.3s ease-in;
    }
    
    /* 防止内容区域跳动 */
    #main {
      transition: min-height 0.3s ease;
    }
    
    /* 修复布局问题的样式 */
    .author__avatar {
      display: block;
      overflow: hidden;
      margin-bottom: 1em;
    }
    
    .author__avatar img {
      max-width: 100%;
      height: auto;
      display: block;
    }
    
    /* 修复侧边栏高度问题 - 使用平滑过渡 */
    .sidebar {
      transition: min-height 0.3s ease-out;
    }
    
    /* 错误提示样式 */
    .notice--danger {
      padding: 1.5em;
      background-color: #ffebee;
      border-left: 5px solid #f44336;
      margin: 2em 0;
    }
  `;
  document.head.appendChild(style);
  
  // 定义全局旅行地图初始化函数，以便在SPA导航后重新初始化
  window.initTravelMap = function() {
    console.log("SPA环境: 初始化旅行地图");
    
    // 检查地图容器是否存在
    const mapContainer = document.getElementById('travel-map');
    if (!mapContainer) {
      console.log("地图容器不存在，跳过初始化");
      return;
    }
    
    // 确保Leaflet库已加载
    if (typeof L === 'undefined') {
      console.error("Leaflet库未加载，无法初始化地图");
      return;
    }
    
    // 先销毁现有地图实例(如果有)
    if (window.travelMap) {
      console.log("销毁现有地图实例");
      window.travelMap.remove();
      window.travelMap = null;
    }
    
    console.log("创建新地图实例");
    // 初始化地图
    const map = L.map('travel-map').setView([30, 105], 2);
    window.travelMap = map;
    
    // 添加瓦片图层
    try {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 10,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);
    } catch (e) {
      console.error("主要瓦片源加载失败，尝试备用源", e);
      
      // 备用瓦片源
      L.tileLayer('https://tile.openstreetmap.de/{z}/{x}/{y}.png', {
        maxZoom: 10,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);
    }
    
    // 尝试获取旅行数据 - 在SPA环境中需要特殊处理
    let travelData = [];
    
    // 检查是否有全局数据对象
    if (window.siteData && window.siteData.travelCities) {
      travelData = window.siteData.travelCities;
      console.log("从全局变量加载旅行数据:", travelData.length, "个城市");
    } else {
      console.warn("找不到旅行数据，地图将不显示标记点");
    }
    
    // 处理旅行数据并添加标记
    travelData.forEach(entry => {
      if (!entry.visits || !Array.isArray(entry.visits)) {
        console.error("城市数据格式错误:", entry);
        return;
      }
      
      const totalVisits = entry.visits.length;
      const recentVisits = entry.visits.slice(0, Math.min(5, totalVisits)).reverse();
      
      const popupContent = `
        <strong>${entry.city}</strong><br/>
        🧭 Total trips: ${totalVisits}<br/>
        🕒 Most recent ${recentVisits.length} trips:<br/>
        <ul style="padding-left: 16px; margin: 5px 0;">
          ${recentVisits.map(date => `<li>${date}</li>`).join("")}
        </ul>
      `;
      
      // 根据访问次数调整圆点大小
      const baseSize = 3;
      const growthFactor = 0.7;
      const maxVisitsForSize = 8;
      const effectiveVisits = Math.min(totalVisits, maxVisitsForSize);
      const radius = baseSize + effectiveVisits * growthFactor;
      
      L.circleMarker([entry.lat, entry.lon], {
        radius: radius,
        fillColor: "#d62728",
        color: "#b22222",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.7
      }).bindPopup(popupContent).addTo(map);
    });
    
    // 更新统计数字 - 增强版
    const totalCitiesElement = document.getElementById('total-cities');
    const totalVisitsElement = document.getElementById('total-visits');
    
    if (travelData.length > 0) {
      // 城市总数
      if (totalCitiesElement) {
        totalCitiesElement.textContent = travelData.length;
        console.log("更新城市总数:", travelData.length);
      } else {
        console.error("找不到 'total-cities' 元素");
      }
      
      // 访问总次数
      let totalVisits = 0;
      travelData.forEach(entry => {
        if (entry.visits && Array.isArray(entry.visits)) {
          totalVisits += entry.visits.length;
        }
      });
      
      if (totalVisitsElement) {
        totalVisitsElement.textContent = totalVisits;
        console.log("更新访问总次数:", totalVisits);
      } else {
        console.error("找不到 'total-visits' 元素");
      }
    } else {
      console.warn("无旅行数据，无法更新统计数字");
    }
    
    // 强制刷新地图布局 - 多次尝试以确保地图正确显示
    if (map) {
      map.invalidateSize();
      // 再次尝试刷新，以防第一次不生效
      setTimeout(function() {
        map.invalidateSize();
      }, 200);
    }
    
    // 触发侧边栏修复 - 使用多个时间点来确保正确应用
    fixSidebarHeight();
    setTimeout(fixSidebarHeight, 200);
  };
  
  // 初始页面加载时修复侧边栏高度
  setTimeout(fixSidebarHeight, 100);
  setTimeout(fixSidebarHeight, 500);
  
  // 监听窗口大小变化，随时修复侧边栏高度
  window.addEventListener('resize', function() {
    // 使用防抖处理来避免过多的调整
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(function() {
      fixSidebarHeight();
      // 同时刷新地图布局
      if (window.travelMap) {
        window.travelMap.invalidateSize();
      }
    }, 100);
  });
});
