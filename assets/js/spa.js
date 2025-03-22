/**
 * acad-homepage SPA 实现
 * 极简版本 - 确保移动端和子页面刷新兼容性
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
  
  // 检查是否为子页面直接访问（刷新情况）
  if (currentPath !== "/" && !currentPath.endsWith("index.html")) {
    console.log("子页面直接访问，使用传统导航");
    
    // === 关键修改：子页面刷新时确保完整布局 ===
    // 检查是否缺少主要布局元素
    const mainContainer = document.querySelector(".layout--single");
    const masthead = document.querySelector(".masthead");
    const sidebar = document.querySelector(".sidebar");
    
    if (!mainContainer || !masthead || !sidebar) {
      console.log("子页面刷新时缺少布局，重定向到首页并带上目标路径");
      
      // 保存当前路径，并重定向到首页
      const targetPath = window.location.pathname;
      sessionStorage.setItem('redirectTarget', targetPath);
      
      // 跳转到首页
      window.location.href = "/";
      return;
    }
    
    // 处理样式一致性问题 - 确保子页面样式和主页一致
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
    
    // 应用样式一致性
    ensureConsistentStyle();
    
    // 初始化内容 - 关键修复：确保子页面也能初始化内容
    if (mainContent) {
      initContent();
    }
    
    // 初始绑定链接
    bindLinks();
    
    // 子页面使用传统导航，不启用SPA加载
    return;
  }
  
  // === 新增：首页加载时检查是否有重定向目标 ===
  if (currentPath === "/" || currentPath.endsWith("index.html")) {
    const redirectTarget = sessionStorage.getItem('redirectTarget');
    if (redirectTarget) {
      console.log("检测到重定向目标:", redirectTarget);
      // 清除存储的目标
      sessionStorage.removeItem('redirectTarget');
      // 等待首页完全加载后再跳转
      setTimeout(() => {
        loadPage(redirectTarget);
      }, 300);
    }
  }
  
  // 没有主内容区域则退出
  if (!mainContent) {
    console.error("无法找到.page__content，禁用SPA");
    return;
  }
  
  // 链接处理标记
  const HANDLED_ATTR = "data-spa-link";
  
  // 简单获取页面并替换内容
  function loadPage(url) {
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
          
          // 更新URL
          history.pushState({url: url}, document.title, url);
          
          // 初始化内容
          initContent();
          
          // 重新绑定链接
          bindLinks();
          
          // 回到顶部
          window.scrollTo(0, 0);
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
    
    // 初始化旅行地图
    if (typeof window.initTravelMap === 'function') {
      setTimeout(window.initTravelMap, 300);
    }
    
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
  
  // 简单地引用旅行地图函数 (保持原有功能不变)
  window.initTravelMap = window.initTravelMap || function() {
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
