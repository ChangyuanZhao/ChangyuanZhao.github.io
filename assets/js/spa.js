/**
 * acad-homepage SPA 实现 - 修复版本
 * 解决移动端空白、背景渲染和布局一致性问题
 */
document.addEventListener("DOMContentLoaded", function () {
  // 定义关键变量
  const isMobile = window.innerWidth < 768;
  const currentPath = window.location.pathname;
  const mainContent = document.querySelector(".page__content");
  
  // 修复问题1：移动端菜单栏与正文之间的空白
  function fixMobileLayout() {
    if (isMobile) {
      // 获取菜单和内容区域
      const sidebarMenu = document.querySelector(".sidebar");
      const contentArea = document.querySelector(".page__content");
      
      if (sidebarMenu && contentArea) {
        // 调整移动端菜单和内容区域的间距
        sidebarMenu.style.marginBottom = "0";
        contentArea.style.marginTop = "1rem";
        
        // 修复可能的父容器内边距问题
        const containers = document.querySelectorAll(".container, .archive");
        containers.forEach(container => {
          container.style.padding = "0 1rem";
        });
      }
    }
  }
  
  // 修复问题2：移动端刷新子页面背景渲染问题
  function fixBackgroundRendering() {
    // 确保背景样式在页面加载时应用
    const body = document.body;
    const htmlElement = document.documentElement;
    
    // 强制应用背景样式
    if (body && !body.style.background) {
      // 检查是否有定义的背景色/图像，如果没有设置默认值
      const computedStyle = window.getComputedStyle(body);
      if (!computedStyle.background || computedStyle.background === "none") {
        body.style.backgroundColor = "#f3f6f6"; // 默认背景色，根据你的设计修改
      }
    }
    
    // 确保HTML元素也有正确的背景
    if (htmlElement) {
      htmlElement.style.minHeight = "100%";
    }
    
    // 特别处理子页面
    if (currentPath !== "/" && !currentPath.endsWith("index.html")) {
      // 确保子页面的容器有足够的高度
      const pageWrapper = document.querySelector(".page-wrapper, .archive, main");
      if (pageWrapper) {
        pageWrapper.style.minHeight = "100vh";
      }
    }
  }
  
  // 修复问题3：布局一致性问题
  function fixLayoutConsistency() {
    // 获取所有可能有不同布局的容器
    const layoutContainers = document.querySelectorAll(".page, .archive, .page__inner-wrap");
    
    layoutContainers.forEach(container => {
      // 确保内边距和外边距一致
      container.style.boxSizing = "border-box";
      
      // 获取主页的布局样式，应用到所有页面
      const mainPageContainer = document.querySelector(".home .page, .home .archive");
      if (mainPageContainer) {
        // 复制主页布局的关键样式
        const mainStyle = window.getComputedStyle(mainPageContainer);
        container.style.padding = mainStyle.padding;
        container.style.margin = mainStyle.margin;
        container.style.maxWidth = mainStyle.maxWidth;
        container.style.width = mainStyle.width;
      } else {
        // 默认值，如果无法获取主页样式
        container.style.padding = "1em";
        container.style.margin = "0 auto";
        container.style.maxWidth = "100%";
      }
    });
    
    // 特别处理移动设备的布局
    if (isMobile) {
      document.querySelectorAll(".page__inner-wrap, .page__content").forEach(el => {
        el.style.padding = "0.5em";
      });
    }
  }
  
  // 检查是否为子页面直接访问
  if (currentPath !== "/" && !currentPath.endsWith("index.html")) {
    // 判断是否为刷新子页面
    const isRefreshing = true;
    
    if (isRefreshing) {
      // 修复：即使在传统导航模式下，也应用布局修复
      fixMobileLayout();
      fixBackgroundRendering();
      fixLayoutConsistency();
      
      // 修复问题2：确保背景样式在子页面刷新时也应用
      window.addEventListener("load", function() {
        setTimeout(fixBackgroundRendering, 100);
      });
      
      // 如果是直接访问子页面，使用传统导航，但应用布局修复
      console.log("子页面直接访问，使用传统导航并应用布局修复");
      return; // 不启用SPA，使用传统导航
    }
  }
  
  // 没有主内容区域则退出
  if (!mainContent) {
    console.error("无法找到.page__content，禁用SPA");
    return;
  }
  
  // 链接处理标记
  const HANDLED_ATTR = "data-spa-link";
  
  // 简单获取页面并替换内容，增加布局一致性处理
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
          // 记录原始页面的滚动位置和主要CSS类
          const originalBodyClasses = document.body.className;
          const originalHtmlClasses = document.documentElement.className;
          
          // 更新标题和内容
          document.title = doc.title;
          mainContent.innerHTML = newContent.innerHTML;
          
          // 保留并合并body类和HTML类以保持样式一致性
          if (doc.body.className) {
            // 合并类，保留原有的重要类
            const originalClasses = originalBodyClasses.split(' ');
            const newClasses = doc.body.className.split(' ');
            
            // 保留布局相关的类
            const layoutClasses = originalClasses.filter(cls => 
              cls.includes('layout') || cls.includes('wide') || cls.includes('sidebar')
            );
            
            // 从新页面获取特定页面类型
            const pageTypeClasses = newClasses.filter(cls => 
              !cls.includes('layout') && !cls.includes('wide') && !cls.includes('sidebar')
            );
            
            // 合并并设置
            document.body.className = [...layoutClasses, ...pageTypeClasses].join(' ');
          }
          
          // 更新URL
          history.pushState(null, document.title, url);
          
          // 初始化内容
          initContent();
          
          // 应用所有布局修复
          fixMobileLayout();
          fixBackgroundRendering();
          fixLayoutConsistency();
          
          // 绑定链接
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
  window.addEventListener('popstate', function() {
    loadPage(window.location.pathname);
  });
  
  // 修复: 应用所有布局修复
  fixMobileLayout();
  fixBackgroundRendering();
  fixLayoutConsistency();
  
  // 修复: 监听窗口大小变化，重新应用修复
  window.addEventListener('resize', function() {
    // 更新移动状态
    const wasIsMobile = isMobile;
    const currentIsMobile = window.innerWidth < 768;
    
    // 仅当移动状态变化时重新应用修复
    if (wasIsMobile !== currentIsMobile) {
      fixMobileLayout();
      fixLayoutConsistency();
      
      // 如果包含地图，更新地图大小
      if (window.travelMap) {
        setTimeout(() => window.travelMap.invalidateSize(), 100);
      }
    }
  });
  
  // 初始绑定链接
  bindLinks();
  
  // 保留原有的旅行地图函数
  window.initTravelMap = window.initTravelMap || function() {
    // 原有代码保持不变
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
