/**
 * acad-homepage SPA 实现
 * 专为 Jekyll 生成的学术主页设计
 */
document.addEventListener("DOMContentLoaded", function () {
  // 主内容区域
  const mainContent = document.querySelector("#main-content");
  
  // 检测是否为移动设备
  const isMobile = window.innerWidth < 768;
  
  // 已处理链接的标记，防止重复绑定事件
  const HANDLED_ATTR = "data-spa-handled";
  
  /**
   * 加载页面内容
   * @param {string} url - 要加载的页面URL
   * @param {boolean} updateHistory - 是否更新浏览器历史
   */
  function loadPage(url, updateHistory = true) {
    // 添加加载状态指示
    document.body.classList.add("is-loading");
    
    // 处理URL，确保格式正确
    const cleanUrl = url.split("#")[0];
    const hash = url.includes("#") ? url.split("#")[1] : "";
    
    // 对于路径结尾的URL，如果服务器返回目录索引则自动追加index.html
    const requestUrl = cleanUrl.endsWith("/") ? cleanUrl : cleanUrl;
    
    // 移动设备上简化加载过程
    if (isMobile) {
      console.log("移动设备: 使用简化页面加载");
      window.location.href = url;
      return;
    }
    
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
        }
      })
      .catch(error => {
        console.error("SPA加载错误:", error);
        
        // 处理加载失败 - 在移动设备上直接重定向
        if (isMobile) {
          window.location.href = url;
          return;
        }
        
        // 桌面设备上显示错误消息
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
      })
      .finally(() => {
        // 移除加载状态
        document.body.classList.remove("is-loading");
      });
  }
  
  /**
   * 修复移动端布局问题
   */
  function fixMobileLayout() {
    if (isMobile) {
      console.log("应用移动端布局修复");
      
      // 获取关键元素
      const sidebar = document.querySelector('.sidebar');
      const mainContent = document.querySelector('#main-content');
      const authorAvatar = document.querySelector('.author__avatar');
      const sidebarSticky = document.querySelector('.sidebar.sticky');
      
      // 修复侧边栏布局
      if (sidebar) {
        sidebar.style.float = 'none';
        sidebar.style.width = '100%';
        sidebar.style.position = 'relative';
        sidebar.style.marginBottom = '2em';
        sidebar.style.clear = 'both';
      }
      
      // 修复头像显示
      if (authorAvatar) {
        authorAvatar.style.display = 'block';
        authorAvatar.style.margin = '0 auto 1em';
        authorAvatar.style.textAlign = 'center';
      }
      
      // 处理粘性侧边栏
      if (sidebarSticky) {
        sidebarSticky.style.position = 'relative';
        sidebarSticky.style.top = '0';
      }
      
      // 模拟窗口大小变化以触发响应式布局
      window.dispatchEvent(new Event('resize'));
    }
  }
  
  /**
   * 修复侧边栏高度问题
   */
  function fixSidebarHeight() {
    // 移动端不需要调整侧边栏高度
    if (isMobile) return;
    
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('#main-content');
    
    if (sidebar && mainContent) {
      // 重置侧边栏样式以避免累积的高度问题
      sidebar.style.height = 'auto';
      sidebar.style.minHeight = '';
      
      // 获取内容区域的高度
      const contentHeight = mainContent.offsetHeight;
      const sidebarHeight = sidebar.offsetHeight;
      
      // 确保侧边栏高度至少与内容区域相同
      if (contentHeight > sidebarHeight) {
        sidebar.style.minHeight = contentHeight + 'px';
      }
      
      console.log("修复侧边栏高度: 内容高度=", contentHeight, "侧边栏高度=", sidebarHeight);
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
    
    // 修复移动端布局问题 - 优先级高
    setTimeout(fixMobileLayout, 100);
    
    // 修复侧边栏高度问题
    setTimeout(fixSidebarHeight, 300);
  }
  
  /**
   * 为页面内链接附加SPA导航事件
   */
  function attachLinkHandlers() {
    // 移动设备上不使用SPA导航
    if (isMobile) return;
    
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
    // 移动设备上不拦截历史导航
    if (isMobile) return;
    
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
  
  // 移动设备上直接应用布局修复，不启用SPA
  if (isMobile) {
    console.log("移动设备检测：不启用SPA导航，直接修复布局");
    fixMobileLayout();
    // 初始化旅行地图
    if (typeof window.initTravelMap === 'function') {
      setTimeout(window.initTravelMap, 500);
    }
    return; // 不继续执行SPA初始化代码
  }
  
  // 以下代码在移动设备上不会执行
  
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
    
    /* 修复侧边栏高度问题 */
    .sidebar {
      transition: min-height 0.3s ease;
    }
    
    /* 移动端特定样式 */
    @media (max-width: 767px) {
      .sidebar {
        float: none !important;
        width: 100% !important;
        position: relative !important;
        clear: both !important;
        margin-bottom: 2em !important;
      }
      .author__avatar {
        display: block !important;
        margin: 0 auto 1em !important;
        text-align: center !important;
      }
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
      console.warn("找不到全局旅行数据，使用内置备用数据");
      
      // 内置备用数据 - 当全局数据不可用时使用
      travelData = [
        {
          "city": "Beijing",
          "lat": 39.9042,
          "lon": 116.4074,
          "visits": ["2025-02-28"]
        },
        {
          "city": "Dalian",
          "lat": 38.9140,
          "lon": 121.6147,
          "visits": ["2025-03-02"]
        },
        {
          "city": "Suwon",
          "lat": 37.2636,
          "lon": 127.0286,
          "visits": ["2025-03-04"]
        },
        {
          "city": "Seoul",
          "lat": 37.5665,
          "lon": 126.9780,
          "visits": ["2025-03-09"]
        },
        {
          "city": "Singapore",
          "lat": 1.3521,
          "lon": 103.8198,
          "visits": ["2025-03-14", "2025-01-10", "2024-12-20"]
        },
        {
          "city": "Johor Bahru",
          "lat": 1.4927,
          "lon": 103.7414,
          "visits": ["2025-01-29"]
        },
        {
          "city": "Hong Kong",
          "lat": 22.3193,
          "lon": 114.1694,
          "visits": ["2024-12-16"]
        },
        {
          "city": "Bangkok",
          "lat": 13.7563,
          "lon": 100.5018,
          "visits": ["2024-12-26"]
        },
        {
          "city": "Xi'an",
          "lat": 34.3416,
          "lon": 108.9398,
          "visits": ["2024-12-29"]
        }
      ];
      
      console.log("已加载内置备用数据:", travelData.length, "个城市");
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
    
    // 强制刷新地图布局
    setTimeout(function() {
      if (map) {
        map.invalidateSize();
        console.log("刷新地图布局");
      }
    }, 100);
    
    // 移动端无需触发侧边栏修复
    if (!isMobile) {
      setTimeout(fixSidebarHeight, 200);
    }
  };
  
  // 初始页面加载时修复侧边栏高度
  if (!isMobile) {
    setTimeout(fixSidebarHeight, 500);
  }
  
  // 监听窗口大小变化，随时修复布局
  window.addEventListener('resize', function() {
    const newIsMobile = window.innerWidth < 768;
    
    // 如果设备类型变化，刷新页面以应用正确的逻辑
    if (newIsMobile !== isMobile) {
      console.log("设备类型变化，刷新页面");
      window.location.reload();
      return;
    }
    
    // 根据设备类型应用不同的修复
    if (newIsMobile) {
      fixMobileLayout();
    } else {
      fixSidebarHeight();
    }
    
    // 刷新地图布局
    if (window.travelMap) {
      window.travelMap.invalidateSize();
    }
  });
});
