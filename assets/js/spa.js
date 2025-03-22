/**
 * acad-homepage SPA 实现
 * 全平台兼容版
 */
document.addEventListener("DOMContentLoaded", function () {
  console.log("SPA框架初始化...");
  
  // 精确定位内容区域和包含框架
  const contentWrap = document.querySelector(".page__inner-wrap");
  const mainContent = document.querySelector(".page__content");
  
  if (!mainContent || !contentWrap) {
    console.error("无法找到必要的DOM元素，禁用SPA");
    return;
  }
  
  // 记录初始HTML结构
  const initialContentHTML = contentWrap.innerHTML;
  
  // 已处理链接的标记
  const HANDLED_ATTR = "data-spa-handled";
  
  // 防抖函数，用于避免多次快速调用
  function debounce(func, wait) {
    let timeout;
    return function() {
      const context = this, args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }
  
  /**
   * 加载页面内容
   */
  function loadPage(url, updateHistory = true) {
    console.log("SPA: 加载页面", url);
    
    // 表明正在加载
    document.body.classList.add("is-loading");
    
    // 清理URL，获取hash
    const cleanUrl = url.split("#")[0];
    const hash = url.includes("#") ? url.split("#")[1] : "";
    
    // 获取页面
    fetch(url)
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
        
        // 查找新页面内容区域
        const newContentWrap = doc.querySelector(".page__inner-wrap");
        const newContent = doc.querySelector(".page__content");
        const newTitle = doc.querySelector("title")?.textContent || "";
        
        // 仅更新内容区域，保持框架结构
        if (newContent) {
          // 记录滚动位置和内容区域尺寸
          const scrollPos = window.scrollY;
          const contentWidth = contentWrap.offsetWidth;
          
          // 更新页面标题
          document.title = newTitle;
          
          // 更新内容区域 - 可以选择更新整个包装器或仅内容
          mainContent.innerHTML = newContent.innerHTML;
          
          // 更新浏览器历史
          if (updateHistory) {
            history.pushState({ url: url }, newTitle, url);
          }
          
          // 防止布局偏移
          document.body.style.width = contentWidth + 'px';
          
          // 初始化新内容
          initDynamicElements();
          
          // 重新绑定链接
          attachLinkHandlers();
          
          // 处理锚点滚动
          handleScrolling(hash);
          
          // 恢复正常布局
          setTimeout(() => {
            document.body.style.width = '';
          }, 100);
        } else {
          // 如果找不到内容区域，回退到传统导航
          window.location.href = url;
        }
      })
      .catch(error => {
        console.error("SPA加载错误:", error);
        // 尝试恢复先前的内容
        contentWrap.innerHTML = initialContentHTML;
        // 然后回退到传统导航
        window.location.href = url;
      })
      .finally(() => {
        // 移除加载状态
        document.body.classList.remove("is-loading");
      });
  }
  
  /**
   * 处理滚动逻辑
   */
  function handleScrolling(hash) {
    if (hash) {
      setTimeout(() => {
        const target = document.getElementById(hash);
        if (target) {
          // 使用平滑滚动
          target.scrollIntoView({ behavior: "smooth" });
        }
      }, 200);
    } else {
      // 回到顶部，使用延迟确保DOM渲染完成
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
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
    
    // 运行内联脚本
    mainContent.querySelectorAll("script").forEach(oldScript => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = oldScript.textContent;
      if (oldScript.parentNode) {
        oldScript.parentNode.replaceChild(newScript, oldScript);
      }
    });
    
    // 初始化旅行地图
    if (typeof window.initTravelMap === 'function') {
      console.log("初始化旅行地图");
      setTimeout(window.initTravelMap, 200);
    }
    
    // 其他组件初始化
    if (typeof window.loadCitation === "function") {
      window.loadCitation();
    }
    
    // MathJax支持
    if (window.MathJax) {
      if (typeof window.MathJax.typeset === 'function') {
        window.MathJax.typeset();
      } else if (window.MathJax.Hub && typeof window.MathJax.Hub.Queue === 'function') {
        window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
      }
    }
    
    // 更新布局修复
    fixLayout();
  }
  
  /**
   * 修复可能的布局问题
   */
  function fixLayout() {
    // 修复侧边栏和内容高度
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && mainContent) {
      const contentHeight = mainContent.offsetHeight;
      const sidebarHeight = sidebar.offsetHeight;
      
      if (contentHeight > sidebarHeight) {
        sidebar.style.minHeight = contentHeight + 'px';
      }
    }
    
    // 处理移动端特定问题
    if (window.innerWidth < 768) {
      // 确保移动端下的侧边栏样式正确
      const sidebarElements = document.querySelectorAll('.sidebar, .sidebar__right');
      sidebarElements.forEach(el => {
        if (el) {
          el.style.float = 'none';
          el.style.width = '100%';
          el.style.marginLeft = '0';
          el.style.marginRight = '0';
        }
      });
      
      // 修复作者头像在移动端的显示
      const avatar = document.querySelector('.author__avatar');
      if (avatar) {
        avatar.style.display = 'block';
        avatar.style.margin = '0 auto 1em';
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
          // 使用防抖确保不会多次快速触发
          debounce(loadPage, 100)(href);
        });
      }
    });
  }
  
  /**
   * 添加样式
   */
  function addStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .is-loading {
        cursor: wait;
      }
      
      .is-loading .page__content {
        opacity: 0.6;
        transition: opacity 0.3s;
      }
      
      .page__content {
        transition: opacity 0.3s;
      }
      
      /* 防止布局偏移 */
      body {
        overflow-x: hidden !important;
        max-width: 100% !important;
        position: relative !important;
      }
      
      .page__content, 
      .page__inner-wrap {
        overflow-x: visible !important;
        box-sizing: border-box !important;
      }
      
      /* 移动端特定样式 */
      @media (max-width: 767px) {
        .sidebar,
        .sidebar__right {
          float: none !important;
          width: 100% !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
        }
        
        .author__avatar {
          display: block !important;
          margin: 0 auto 1em !important;
        }
      }
    `;
    document.head.appendChild(style);
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
   * 窗口大小改变时修复布局
   */
  window.addEventListener('resize', debounce(function() {
    console.log("窗口大小变化，修复布局");
    fixLayout();
    
    // 刷新地图
    if (window.travelMap) {
      window.travelMap.invalidateSize();
    }
  }, 200));
  
  // 初始化SPA
  addStyles();
  attachLinkHandlers();
  fixLayout();
  
  // 设置初始历史状态
  const currentPath = window.location.pathname + window.location.hash;
  history.replaceState({ url: currentPath }, document.title, currentPath);
  
  console.log("SPA框架初始化完成");

  // 定义全局旅行地图初始化函数，确保能在内容更新后被调用
  window.initTravelMap = function() {
    console.log("初始化旅行地图");
    
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
    
    // 更新统计数字
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
    }
    
    // 强制刷新地图布局
    setTimeout(function() {
      if (map) {
        map.invalidateSize();
        console.log("刷新地图布局");
      }
    }, 100);
  };
});
