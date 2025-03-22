/**
 * acad-homepage SPA 实现
 * 专为 Jekyll 生成的学术主页设计
 * 简化版：仅替换内容，保持框架不变
 */
document.addEventListener("DOMContentLoaded", function () {
  // 主内容区域 - 精确定位为仅需要更新的部分
  const mainContent = document.querySelector(".page__content");
  if (!mainContent) {
    console.error("无法找到主内容区域 .page__content");
    return;
  }
  
  // 已处理链接的标记
  const HANDLED_ATTR = "data-spa-handled";
  
  /**
   * 加载页面内容
   * 只更新 .page__content 区域，保持页面框架不变
   */
  function loadPage(url, updateHistory = true) {
    // 表明正在加载
    document.body.classList.add("is-loading");
    
    // 清理URL，获取hash
    const cleanUrl = url.split("#")[0];
    const hash = url.includes("#") ? url.split("#")[1] : "";
    
    console.log("SPA加载页面:", url);
    
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
        
        // 只查找内容区域
        const newContent = doc.querySelector(".page__content");
        const newTitle = doc.querySelector("title")?.textContent || "";
        
        if (newContent) {
          // 保存滚动位置
          const scrollPos = window.scrollY;
          
          // 更新内容区域
          mainContent.innerHTML = newContent.innerHTML;
          
          // 更新页面标题
          document.title = newTitle;
          
          // 更新浏览器历史
          if (updateHistory) {
            history.pushState({ url: url }, newTitle, url);
          }
          
          // 初始化新内容
          initDynamicElements();
          
          // 重新绑定链接
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
        } else {
          console.error("无法找到新页面中的 .page__content 区域");
          window.location.href = url; // 回退到传统导航
        }
      })
      .catch(error => {
        console.error("SPA加载错误:", error);
        // 出错时回退到传统导航
        window.location.href = url;
      })
      .finally(() => {
        // 移除加载状态
        document.body.classList.remove("is-loading");
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
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = oldScript.textContent;
      if (oldScript.parentNode) {
        oldScript.parentNode.replaceChild(newScript, oldScript);
      }
    });
    
    // 重新初始化旅行地图
    if (typeof window.initTravelMap === 'function') {
      console.log("SPA: 检测到旅行地图，尝试初始化");
      setTimeout(window.initTravelMap, 100);
    }
    
    // 重新初始化其他组件
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
  
  // 初始化页面链接
  attachLinkHandlers();
  
  // 设置初始历史状态
  const currentPath = window.location.pathname + window.location.hash;
  history.replaceState({ url: currentPath }, document.title, currentPath);
  
  // 添加样式
  const style = document.createElement("style");
  style.textContent = `
    .is-loading .page__content {
      opacity: 0.6;
      transition: opacity 0.3s;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .page__content {
      animation: fadeIn 0.3s;
    }
    
    /* 修复布局偏移问题 */
    body {
      overflow-x: hidden !important;
      max-width: 100vw;
    }
    
    /* 确保内容区域不会引起偏移 */
    .page__content {
      overflow-x: hidden;
      width: 100%;
      box-sizing: border-box;
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
  };
  
  // 监听窗口大小变化，刷新地图布局
  window.addEventListener('resize', function() {
    if (window.travelMap) {
      window.travelMap.invalidateSize();
    }
  });
});
