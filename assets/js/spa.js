/**
 * Enhanced SPA Implementation for Academic Homepage
 * 
 * Features:
 * 1. Content-only updates when navigating between pages
 * 2. Single page navigation without opening new pages
 * 3. Consistent white background
 * 4. Preserved map information when switching pages
 * 5. Refresh handling for subpages (redirect to home first, then to the target)
 */
document.addEventListener("DOMContentLoaded", function () {
  // Core variables
  const mainContent = document.querySelector(".page__content");
  const currentPath = window.location.pathname;
  
  // Set consistent white background
  function setWhiteBackground() {
    const elementsToWhiten = [
      document.body,
      document.querySelector(".page__content"),
      document.querySelector(".layout--single")
    ];
    
    elementsToWhiten.forEach(element => {
      if (element) element.style.backgroundColor = "#ffffff";
    });
    
    // Add permanent style rule
    if (!document.getElementById("spa-styles")) {
      const styleElement = document.createElement("style");
      styleElement.id = "spa-styles";
      styleElement.textContent = `
        body, .page__content, .layout--single {
          background-color: #ffffff !important;
        }
      `;
      document.head.appendChild(styleElement);
    }
  }
  
  // Initialize white background
  setWhiteBackground();
  
  // Check if this is a page refresh
  const isRefresh = (
    (performance && performance.navigation && performance.navigation.type === 1) || 
    (window.performance && window.performance.getEntriesByType && 
     window.performance.getEntriesByType("navigation")[0]?.type === "reload")
  );
  
  // Global map data cache
  window.mapDataCache = window.mapDataCache || {
    markers: [],
    paths: [],
    initialized: false,
    originalInitFunction: null
  };
  
  // Handle subpage refresh: redirect to home, then return to subpage
  if (isRefresh && currentPath !== "/" && !currentPath.endsWith("index.html")) {
    console.log("Detected subpage refresh, redirecting to home first");
    
    // Save current path and scroll position
    const scrollPosition = {
      x: window.scrollX,
      y: window.scrollY
    };
    
    // Store redirection info
    sessionStorage.setItem("redirectTarget", currentPath);
    sessionStorage.setItem("scrollPosition", JSON.stringify(scrollPosition));
    sessionStorage.setItem("isRefresh", "true");
    
    // Redirect to home
    window.location.href = "/";
    return;
  }
  
  // Handle direct subpage access (not via refresh)
  if (!isRefresh && currentPath !== "/" && !currentPath.endsWith("index.html")) {
    console.log("Direct subpage access, checking layout integrity");
    
    // Check if essential layout elements exist
    const hasCompleteLayout = (
      document.querySelector(".layout--single") &&
      document.querySelector(".masthead") &&
      document.querySelector(".sidebar")
    );
    
    if (!hasCompleteLayout) {
      console.log("Missing layout elements, redirecting to home");
      
      // Save target path
      sessionStorage.setItem("redirectTarget", currentPath);
      sessionStorage.setItem("isRefresh", "false");
      
      // Redirect to home
      window.location.href = "/";
      return;
    }
    
    // Ensure consistent style for direct subpage access
    setWhiteBackground();
    
    // Initialize content and bind links
    if (mainContent) {
      initPageContent();
      bindAllLinks();
    }
    
    // Continue with regular navigation
    return;
  }
  
  // Handle home page load with redirection
  if (currentPath === "/" || currentPath.endsWith("index.html")) {
    const redirectTarget = sessionStorage.getItem("redirectTarget");
    const isRefreshRedirect = sessionStorage.getItem("isRefresh") === "true";
    
    if (redirectTarget) {
      console.log(`Found redirect target: ${redirectTarget}, refresh state: ${isRefreshRedirect ? "refresh" : "regular"}`);
      
      // Clear stored data
      sessionStorage.removeItem("redirectTarget");
      sessionStorage.removeItem("isRefresh");
      
      // Restore scroll position if available
      const savedScrollPosition = sessionStorage.getItem("scrollPosition");
      if (savedScrollPosition) {
        try {
          const position = JSON.parse(savedScrollPosition);
          sessionStorage.removeItem("scrollPosition");
          
          // Save scroll restoration function
          window.restoreScrollPosition = () => {
            window.scrollTo(position.x, position.y);
            console.log(`Restored scroll position: (${position.x}, ${position.y})`);
          };
        } catch (e) {
          console.error("Error parsing scroll position:", e);
        }
      }
      
      // Wait for homepage to fully load before redirecting
      const delay = isRefreshRedirect ? 300 : 150;
      setTimeout(() => {
        loadPageContent(redirectTarget, true);
      }, delay);
    }
  }
  
  // Exit if no main content found
  if (!mainContent) {
    console.error("No .page__content found, disabling SPA");
    return;
  }
  
  // Link handler marker attribute
  const HANDLED_LINK_ATTR = "data-spa-handled";
  
  // Keep track of page transitions
  let isMapPage = false;
  let pendingMapInitialization = false;
  
  // Pre-process URL to determine if it's a map page
  function isUrlMapPage(url) {
    return url.includes("/travel") || url.includes("/map");
  }
  
  // Load page content without full refresh
  function loadPageContent(url, isRedirectLoad = false) {
    // Check if we're navigating to or from a map page
    const wasMapPage = isMapPage;
    const willBeMapPage = isUrlMapPage(url);
    
    // Update map page status for next time
    isMapPage = willBeMapPage;
    
    // Special handling for map page transitions
    if (willBeMapPage) {
      console.log("Navigating to map page - preparing special handling");
      pendingMapInitialization = true;
    }
    
    // Create loading indicator
    const loadingIndicator = document.createElement("div");
    loadingIndicator.textContent = "Loading...";
    loadingIndicator.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 10px 20px;
      background: rgba(0,0,0,0.7);
      color: white;
      border-radius: 4px;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;
    document.body.appendChild(loadingIndicator);
    
    // Pre-load map resources if navigating to map page
    if (willBeMapPage && !wasMapPage) {
      preloadMapResources();
    }
    
    // Fetch page content
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Page load failed: ${response.status}`);
        }
        return response.text();
      })
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const newContent = doc.querySelector(".page__content");
        
        if (newContent) {
          // Update page title
          document.title = doc.title;
          
          // Check for map scripts in the new content
          const hasMapScripts = extractAndPreserveMapScripts(doc);
          
          // Update main content only
          mainContent.innerHTML = newContent.innerHTML;
          
          // Update URL (replace if redirect, push if normal navigation)
          if (isRedirectLoad) {
            history.replaceState({url: url}, document.title, url);
          } else {
            history.pushState({url: url}, document.title, url);
          }
          
          // Initialize new content
          initPageContent();
          
          // Special handling for map pages
          if (willBeMapPage) {
            // Inject preserved map scripts if found
            if (hasMapScripts) {
              injectPreservedMapScripts();
            }
            
            // Double-check map initialization with multiple attempts
            const mapCheckAttempts = [300, 600, 1000, 1500];
            mapCheckAttempts.forEach(delay => {
              setTimeout(() => {
                if (pendingMapInitialization) {
                  console.log(`Checking map initialization status after ${delay}ms`);
                  const mapContainer = document.getElementById("travel-map") || 
                                      document.querySelector(".travel-map-container");
                  
                  if (mapContainer) {
                    // Check if map is already initialized
                    const isMapInitialized = mapContainer._leaflet || 
                                            mapContainer.querySelector('.leaflet-container') ||
                                            (mapContainer.childNodes && mapContainer.childNodes.length > 1);
                    
                    if (!isMapInitialized) {
                      console.log(`Map not initialized after ${delay}ms, attempting initialization`);
                      handleMapInitialization();
                    } else {
                      console.log(`Map already initialized after ${delay}ms`);
                      pendingMapInitialization = false;
                    }
                  }
                }
              }, delay);
            });
          }
          
          // Rebind all links
          bindAllLinks();
          
          // Handle scroll position
          if (isRedirectLoad && window.restoreScrollPosition) {
            setTimeout(() => {
              window.restoreScrollPosition();
              window.restoreScrollPosition = null;
            }, 100);
          } else {
            // Regular navigation, scroll to top
            window.scrollTo(0, 0);
          }
        } else {
          // Fallback to traditional navigation
          window.location.href = url;
        }
      })
      .catch(error => {
        console.error("SPA load error:", error);
        // Fallback to traditional navigation
        window.location.href = url;
      })
      .finally(() => {
        // Remove loading indicator
        document.body.removeChild(loadingIndicator);
      });
  }
  
  // Store for map scripts
  let preservedMapScripts = [];
  
  // Extract and preserve map scripts from a document
  function extractAndPreserveMapScripts(doc) {
    preservedMapScripts = [];
    const scripts = doc.querySelectorAll("script");
    
    scripts.forEach(script => {
      const src = script.getAttribute('src') || '';
      const content = script.innerHTML;
      
      // Check if it's a map-related script
      const isMapScript = 
        src.includes('map') || 
        src.includes('leaflet') || 
        src.includes('travel') ||
        content.includes('map') ||
        content.includes('initTravelMap');
      
      if (isMapScript) {
        console.log("Found map script:", src || "(inline script)");
        preservedMapScripts.push({
          src: src,
          content: content,
          async: script.async,
          defer: script.defer,
          type: script.type || "text/javascript"
        });
      }
    });
    
    return preservedMapScripts.length > 0;
  }
  
  // Inject preserved map scripts
  function injectPreservedMapScripts() {
    console.log(`Injecting ${preservedMapScripts.length} preserved map scripts`);
    
    preservedMapScripts.forEach((scriptInfo, index) => {
      const script = document.createElement("script");
      
      if (scriptInfo.type) script.type = scriptInfo.type;
      if (scriptInfo.async) script.async = true;
      if (scriptInfo.defer) script.defer = true;
      
      if (scriptInfo.src) {
        // Add timestamp to prevent caching
        script.src = scriptInfo.src.includes('?') ? 
          `${scriptInfo.src}&_t=${new Date().getTime()}` : 
          `${scriptInfo.src}?_t=${new Date().getTime()}`;
      } else {
        script.innerHTML = scriptInfo.content;
      }
      
      // Add load listener for the last external script
      if (scriptInfo.src && index === preservedMapScripts.length - 1) {
        script.onload = () => {
          console.log("Final map script loaded, initializing map");
          setTimeout(() => handleMapInitialization(), 100);
        };
      }
      
      document.head.appendChild(script);
    });
    
    // If all scripts were inline, manually trigger map initialization
    const hasExternalScripts = preservedMapScripts.some(s => s.src);
    if (!hasExternalScripts) {
      console.log("No external map scripts, scheduling initialization");
      setTimeout(() => handleMapInitialization(), 200);
    }
  }
  
  // Preload map resources
  function preloadMapResources() {
    console.log("Preloading map resources");
    
    // Preload common map resources 
    const resources = [
      "https://unpkg.com/leaflet@1.7.1/dist/leaflet.css",
      "https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"
    ];
    
    resources.forEach(url => {
      const isCSS = url.endsWith('.css');
      
      if (isCSS) {
        // Preload CSS
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'style';
        link.href = url;
        document.head.appendChild(link);
        
        // Actually load the CSS
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = url;
        document.head.appendChild(styleLink);
      } else {
        // Preload JS
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'script';
        link.href = url;
        document.head.appendChild(link);
      }
    });
  }
  
  // Initialize page content
  function initPageContent() {
    // Check if we're on a map page
    const isCurrentMapPage = 
      window.location.pathname.includes("/travel") || 
      window.location.pathname.includes("/map") ||
      document.getElementById("travel-map") || 
      document.querySelector(".travel-map-container");
      
    // For map pages, ensure we load Leaflet early
    if (isCurrentMapPage && !window.L) {
      console.log("Map page detected, loading Leaflet early");
      loadLeaflet();
    }
    
    // Execute inline scripts
    const scripts = mainContent.querySelectorAll("script");
    scripts.forEach(oldScript => {
      const newScript = document.createElement("script");
      
      // Copy attributes
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      
      // Copy content
      newScript.innerHTML = oldScript.innerHTML;
      
      // Replace old script
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
    
    // Enhanced map handling
    if (isCurrentMapPage) {
      console.log("Initializing map via initPageContent");
      
      // Use cached data if available, otherwise normal initialization
      if (window.mapDataCache && window.mapDataCache.initialized) {
        console.log("Using cached map data");
        setTimeout(() => {
          const mapContainer = document.getElementById("travel-map") || 
                              document.querySelector(".travel-map-container");
          
          if (mapContainer) {
            createLeafletMap(mapContainer);
          } else {
            handleMapInitialization();
          }
        }, 100);
      } else {
        handleMapInitialization();
      }
    }
    
    // Trigger custom content update event
    document.dispatchEvent(new CustomEvent("spa:contentUpdated", {
      detail: { path: window.location.pathname }
    }));
    
    // Ensure white background
    setWhiteBackground();
    
    // Update sidebar active states
    updateSidebarActiveState();
  }
  
  // Load Leaflet library
  function loadLeaflet() {
    if (window.L) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      console.log("Loading Leaflet library");
      
      // Add Leaflet CSS
      const leafletCss = document.createElement('link');
      leafletCss.rel = 'stylesheet';
      leafletCss.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
      document.head.appendChild(leafletCss);
      
      // Add Leaflet JS
      const leafletJs = document.createElement('script');
      leafletJs.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
      leafletJs.onload = resolve;
      leafletJs.onerror = reject;
      document.head.appendChild(leafletJs);
    });
  }
  
  // Update sidebar active state based on current path
  function updateSidebarActiveState() {
    const currentPath = window.location.pathname;
    
    document.querySelectorAll(".sidebar .nav__items a").forEach(link => {
      const href = link.getAttribute("href");
      const linkParent = link.parentElement;
      
      // Remove all active states
      linkParent.classList.remove("active");
      
      // Set active state for current page
      if (href && currentPath.includes(href) && href !== "/") {
        linkParent.classList.add("active");
      }
    });
  }
  
  // Advanced map initialization
  function handleMapInitialization() {
    // Check if current page contains map
    const isMapPage = 
      window.location.pathname.includes("/travel") || 
      window.location.pathname.includes("/map") ||
      document.getElementById("travel-map") || 
      document.querySelector(".travel-map-container");
    
    if (isMapPage) {
      console.log("Map page detected, initializing map");
      
      // Get map container
      const mapContainer = document.getElementById("travel-map") || 
                          document.querySelector(".travel-map-container");
      
      if (!mapContainer) {
        console.warn("Map container not found");
        // Defer search for map container
        setTimeout(() => {
          const laterMapContainer = document.getElementById("travel-map") || 
                                   document.querySelector(".travel-map-container");
          if (laterMapContainer) {
            console.log("Map container found on delayed check");
            initMapWithContainer(laterMapContainer);
          } else {
            // Add a placeholder and try again
            const contentArea = document.querySelector(".page__content");
            if (contentArea && !document.getElementById("travel-map-placeholder")) {
              console.log("Adding map placeholder to trigger initialization");
              const placeholder = document.createElement("div");
              placeholder.id = "travel-map-placeholder";
              placeholder.className = "travel-map-container";
              placeholder.style.minHeight = "400px";
              placeholder.style.display = "block";
              placeholder.style.backgroundColor = "#f8f8f8";
              placeholder.style.border = "1px dashed #ccc";
              placeholder.innerHTML = "<p style='text-align:center;padding-top:180px;'>Map loading...</p>";
              contentArea.prepend(placeholder);
              
              setTimeout(() => initMapWithContainer(placeholder), 300);
            }
          }
        }, 300);
        return;
      }
      
      initMapWithContainer(mapContainer);
    }
  }
  
  // Separate function to initialize map with a container
  function initMapWithContainer(mapContainer) {
    // Force reload map-related scripts
    const reloadMapScripts = () => {
      document.querySelectorAll('script').forEach(script => {
        const src = script.getAttribute('src') || '';
        if (src && (src.includes('map') || src.includes('leaflet') || src.includes('travel'))) {
          console.log("Reloading map script:", src);
          
          // Create a new script element
          const newScript = document.createElement('script');
          
          // Copy attributes except src
          Array.from(script.attributes).forEach(attr => {
            if (attr.name !== 'src') {
              newScript.setAttribute(attr.name, attr.value);
            }
          });
          
          // Add timestamp to prevent caching
          newScript.src = src.includes('?') ? 
            `${src}&_t=${new Date().getTime()}` : 
            `${src}?_t=${new Date().getTime()}`;
          
          // Replace old script if possible
          if (script.parentNode) {
            script.parentNode.replaceChild(newScript, script);
          } else {
            // Or append to head
            document.head.appendChild(newScript);
          }
        }
      });
    };
    
    // Intercept and enhance the original map initialization function
    if (!window.mapDataCache.originalInitFunction && window.initTravelMap) {
      console.log("Intercepting original map initialization function");
      window.mapDataCache.originalInitFunction = window.initTravelMap;
      
      // 修改地图初始化函数以与SPA系统更好地集成
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
  
  // 数据源优先级:
  // 1. 全局变量 window.siteData.travelCities
  // 2. 缓存在 window.mapDataCache 中的数据
  // 3. 内置备用数据
  
  if (window.siteData && window.siteData.travelCities) {
    travelData = window.siteData.travelCities;
    console.log("从全局变量加载旅行数据:", travelData.length, "个城市");
  } else if (window.mapDataCache && window.mapDataCache.initialized && window.mapDataCache.markers) {
    // 尝试从SPA的缓存中恢复数据
    console.log("尝试从SPA缓存恢复数据");
    
    // 将缓存的标记转换回旅行数据
    try {
      const markers = window.mapDataCache.markers || [];
      travelData = markers.map(marker => {
        // 尝试从popup内容中提取信息
        const popupContent = marker.popupContent || "";
        let cityName = "Unknown City";
        let visits = [];
        
        // 提取城市名称
        const cityMatch = popupContent.match(/<strong>(.*?)<\/strong>/);
        if (cityMatch && cityMatch[1]) {
          cityName = cityMatch[1];
        }
        
        // 尝试提取访问信息
        const visitMatches = popupContent.match(/<li>(.*?)<\/li>/g);
        if (visitMatches) {
          visits = visitMatches.map(m => {
            return m.replace(/<li>(.*?)<\/li>/, '$1');
          });
        }
        
        return {
          city: cityName,
          lat: marker.latLng.lat,
          lon: marker.latLng.lng,
          visits: visits
        };
      });
      
      if (travelData.length > 0) {
        console.log("成功从SPA缓存恢复数据:", travelData.length, "个城市");
      } else {
        console.warn("SPA缓存数据转换未生成有效数据");
      }
    } catch (e) {
      console.error("从SPA缓存恢复数据失败:", e);
    }
  }
  
  // 如果前两种方法都失败，使用内置备用数据
  if (!travelData || travelData.length === 0) {
    console.warn("找不到全局旅行数据，使用内置备用数据");
    
    // 内置备用数据
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
  
  // 更新SPA缓存的标记数据，确保下次切换页面时数据可用
  window.mapDataCache = window.mapDataCache || {};
  window.mapDataCache.initialized = true;
  
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
  
  // 刷新SPA标记缓存
  if (travelData.length > 0) {
    console.log("为SPA缓存捕获地图数据");
    
    // 捕获缓存所需的信息
    setTimeout(() => {
      try {
        // 捕获地图配置
        const mapConfig = {
          center: map.getCenter(),
          zoom: map.getZoom(),
          minZoom: map.options.minZoom,
          maxZoom: map.options.maxZoom
        };
        
        // 更新缓存
        window.mapDataCache.mapConfig = mapConfig;
        // 标记在SPA的captureMapData函数中捕获
        
        console.log("SPA缓存数据已更新");
        
        // 触发SPA地图创建事件
        document.dispatchEvent(new CustomEvent('spa:mapCreated', {
          detail: { map: map }
        }));
      } catch (e) {
        console.error("缓存地图数据时出错:", e);
      }
    }, 500);
  }
  
  // 通知其他组件地图初始化完成
  document.dispatchEvent(new CustomEvent('map:initialized', {
    detail: { 
      map: map,
      data: travelData 
    }
  }));
  
  return map;
};
    }
    
    // Try to clean up existing map instance
    try {
      if (mapContainer._leaflet_id || mapContainer._leaflet) {
        console.log("Cleaning up existing map instance");
        if (window.L && mapContainer._leaflet) {
          mapContainer._leaflet.remove();
        } else if (window.L && window.L.DomUtil.get(mapContainer.id)) {
          const mapInstance = window.L.DomUtil.get(mapContainer.id);
          if (mapInstance._leaflet_id) {
            mapInstance._leaflet = null;
          }
        }
      }
    } catch (e) {
      console.log("No existing Leaflet map to clean up");
    }
    
    // Ensure map container has proper dimensions
    mapContainer.style.minHeight = "400px";
    mapContainer.style.display = "block";
    
    // First try to reload map scripts
    reloadMapScripts();
    
    // Check if Leaflet is already loaded
    const isLeafletLoaded = () => {
      return typeof window.L !== 'undefined' && typeof window.L.map === 'function';
    };
    
    // Load Leaflet dynamically if needed
    const ensureLeaflet = (callback) => {
      if (isLeafletLoaded()) {
        callback();
        return;
      }
      
      console.log("Leaflet not found, loading dynamically");
      
      // Load CSS
      const leafletCss = document.createElement('link');
      leafletCss.rel = 'stylesheet';
      leafletCss.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
      document.head.appendChild(leafletCss);
      
      // Load JS
      const leafletJs = document.createElement('script');
      leafletJs.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
      leafletJs.onload = callback;
      document.head.appendChild(leafletJs);
    };
    
    // Schedule multiple initialization attempts with increasing delays
    const initAttempts = [100, 300, 600, 1000, 2000, 3000];
    let mapInitialized = false;
    
    initAttempts.forEach((delay, index) => {
      setTimeout(() => {
        // Skip if already initialized
        if (mapInitialized) return;
        
        // Check if initTravelMap function exists
        if (typeof window.initTravelMap === "function") {
          try {
            console.log(`Map initialization attempt ${index + 1}`);
            window.initTravelMap();
            
            // Check if initialization was successful
            setTimeout(() => {
              if (mapContainer._leaflet || 
                  mapContainer.querySelector('.leaflet-container') ||
                  (mapContainer.childNodes && mapContainer.childNodes.length > 1)) {
                console.log("Map successfully initialized");
                mapInitialized = true;
              } else if (index === initAttempts.length - 2) {
                // Penultimate attempt failed, try Leaflet backup
                useLeafletBackup();
              }
            }, 200);
          } catch (e) {
            console.error(`Map initialization error (attempt ${index + 1}):`, e);
            
            // Last attempt fallback
            if (index === initAttempts.length - 1) {
              useLeafletBackup();
            }
          }
        } else if (index === initAttempts.length - 1) {
          // Final attempt with Leaflet backup
          useLeafletBackup();
        }
      }, delay);
    });
    
    // Function to capture map data from an initialized map
    function captureMapData(mapContainer) {
      console.log("Attempting to capture map data");
      
      if (!window.L || !mapContainer) return;
      
      try {
        // Find Leaflet map instance
        let mapInstance = null;
        
        if (mapContainer._leaflet) {
          mapInstance = mapContainer._leaflet;
        } else if (mapContainer._leaflet_id) {
          mapInstance = window.L.DomUtil.get(mapContainer.id);
        } else {
          // Look for Leaflet map in container
          const leafletContainer = mapContainer.querySelector('.leaflet-container');
          if (leafletContainer && leafletContainer._leaflet_id) {
            mapInstance = window.L.map(leafletContainer);
          }
        }
        
        if (!mapInstance) {
          console.warn("Could not find Leaflet map instance for data capture");
          return;
        }
        
        // Capture markers and paths
        const markers = [];
        const paths = [];
        
        mapInstance.eachLayer(layer => {
          // Capture markers
          if (layer instanceof window.L.Marker) {
            markers.push({
              latLng: layer.getLatLng(),
              options: {
                icon: layer.options.icon,
                title: layer.options.title,
                alt: layer.options.alt,
                zIndexOffset: layer.options.zIndexOffset,
                opacity: layer.options.opacity,
                riseOnHover: layer.options.riseOnHover,
                riseOffset: layer.options.riseOffset
              },
              popupContent: layer._popup ? layer._popup._content : null
            });
          }
          // Capture paths (polylines)
          else if (layer instanceof window.L.Polyline) {
            paths.push({
              latLngs: layer.getLatLngs(),
              options: {
                stroke: layer.options.stroke,
                color: layer.options.color,
                weight: layer.options.weight,
                opacity: layer.options.opacity,
                fill: layer.options.fill,
                fillColor: layer.options.fillColor,
                fillOpacity: layer.options.fillOpacity,
                dashArray: layer.options.dashArray,
                lineCap: layer.options.lineCap,
                lineJoin: layer.options.lineJoin,
                dashOffset: layer.options.dashOffset,
                smoothFactor: layer.options.smoothFactor
              }
            });
          }
        });
        
        // Save the center and zoom of the map
        const mapConfig = {
          center: mapInstance.getCenter(),
          zoom: mapInstance.getZoom(),
          minZoom: mapInstance.options.minZoom,
          maxZoom: mapInstance.options.maxZoom
        };
        
        // Cache the captured data
        window.mapDataCache = {
          markers: markers,
          paths: paths,
          mapConfig: mapConfig,
          initialized: true,
          originalInitFunction: window.mapDataCache.originalInitFunction
        };
        
        console.log(`Map data captured: ${markers.length} markers, ${paths.length} paths`);
      } catch (e) {
        console.error("Error capturing map data:", e);
      }
    }
    
    // Create a leaflet map with cached data if available
    function createLeafletMap(mapContainer) {
      if (mapInitialized) return;
      
      ensureLeaflet(() => {
        console.log("Creating Leaflet map");
        try {
          // Clear container
          const currentContent = mapContainer.innerHTML;
          mapContainer.innerHTML = "";
          
          if (window.L) {
            // Determine map initialization parameters
            let center = [20, 0];
            let zoom = 2;
            let minZoom, maxZoom;
            
            // Use cached configuration if available
            if (window.mapDataCache.initialized && window.mapDataCache.mapConfig) {
              center = window.mapDataCache.mapConfig.center;
              zoom = window.mapDataCache.mapConfig.zoom;
              minZoom = window.mapDataCache.mapConfig.minZoom;
              maxZoom = window.mapDataCache.mapConfig.maxZoom;
            }
            
            // Create map with the right configuration
            const mapOptions = {
              minZoom: minZoom,
              maxZoom: maxZoom
            };
            
            const map = window.L.map(mapContainer.id || mapContainer, mapOptions).setView(center, zoom);
            
            // Add tile layer
            window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
              attribution: "© OpenStreetMap contributors"
            }).addTo(map);
            
            // Add cached markers if available
            if (window.mapDataCache.initialized && window.mapDataCache.markers.length > 0) {
              console.log(`Restoring ${window.mapDataCache.markers.length} cached markers`);
              
              window.mapDataCache.markers.forEach(markerData => {
                const marker = window.L.marker(markerData.latLng, markerData.options);
                
                if (markerData.popupContent) {
                  marker.bindPopup(markerData.popupContent);
                }
                
                marker.addTo(map);
              });
            }
            
            // Add cached paths if available
            if (window.mapDataCache.initialized && window.mapDataCache.paths.length > 0) {
              console.log(`Restoring ${window.mapDataCache.paths.length} cached paths`);
              
              window.mapDataCache.paths.forEach(pathData => {
                const path = window.L.polyline(pathData.latLngs, pathData.options);
                path.addTo(map);
              });
            }
            
            console.log("Leaflet map created with cached data");
            mapInitialized = true;
            
            // Dispatch event for any external components that need the map
            document.dispatchEvent(new CustomEvent('spa:mapCreated', {
              detail: { map: map }
            }));
            
            // If custom init exists, try to use it
            if (window.customMapInit && typeof window.customMapInit === 'function') {
              try {
                window.customMapInit(map);
              } catch (e) {
                console.error("Custom map initialization failed:", e);
              }
            }
            
            // If not already cached, capture this initialization
            if (!window.mapDataCache.initialized) {
              setTimeout(() => {
                captureMapData(mapContainer);
              }, 500);
            }
          } else {
            // If Leaflet failed to load, restore original content
            console.error("Leaflet failed to load, restoring original content");
            mapContainer.innerHTML = currentContent;
          }
        } catch (fallbackError) {
          console.error("Leaflet map creation failed:", fallbackError);
        }
      });
    }
    
    // Leaflet backup function
    function useLeafletBackup() {
      if (mapInitialized) return;
      createLeafletMap(mapContainer);
    }
  }
  
  // Bind all internal links
  function bindAllLinks() {
    document.querySelectorAll('a[href^="/"]').forEach(link => {
      // Skip already processed links
      if (link.hasAttribute(HANDLED_LINK_ATTR)) return;
      
      const href = link.getAttribute("href");
      
      // Skip resource links
      if (href.match(/\.(pdf|zip|jpg|png|gif|svg|mp4|webm)$/i)) return;
      
      // Mark as handled
      link.setAttribute(HANDLED_LINK_ATTR, "true");
      
      // Add click handler
      link.addEventListener("click", function(e) {
        e.preventDefault();
        loadPageContent(href);
      });
    });
  }
  
  // Handle browser back/forward buttons
  window.addEventListener("popstate", function(event) {
    if (event.state && event.state.url) {
      loadPageContent(event.state.url);
    } else {
      loadPageContent(window.location.pathname);
    }
  });
  
  // Initial link binding
  bindAllLinks();
  
  // Map initialization observer
  const mapObserver = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        // Check if map container was added
        const hasMapContainer = Array.from(mutation.addedNodes).some(node => {
          if (node.nodeType !== Node.ELEMENT_NODE) return false;
          
          if (node.id === "travel-map" || node.classList?.contains("travel-map-container")) {
            return true;
          }
          
          return node.querySelector && (
            node.querySelector("#travel-map") || 
            node.querySelector(".travel-map-container")
          );
        });
        
        if (hasMapContainer) {
          console.log("Map container detected in DOM, initializing");
          handleMapInitialization();
          break;
        }
      }
    }
  });
  
  // Start observing DOM for map container
  mapObserver.observe(document.body, { childList: true, subtree: true });
  
  // Listen for custom map initialization requests
  document.addEventListener("spa:needMapInit", function() {
    console.log("Map initialization requested");
    handleMapInitialization();
  });
  function scrollToAnchor(url) {
  // Extract the hash part from the URL
  const hash = url.includes('#') ? url.substring(url.indexOf('#')) : null;
  
  if (hash) {
    console.log(`Scrolling to anchor: ${hash}`);
    
    // Try to find the element with this ID
    const targetElement = document.querySelector(hash);
    
    if (targetElement) {
      // Give time for the page to render properly
      setTimeout(() => {
        targetElement.scrollIntoView({ behavior: 'smooth' });
        console.log(`Scrolled to element with ID ${hash}`);
      }, 200);
    } else {
      console.warn(`Element with ID ${hash} not found`);
      
      // Try looking for elements with data-section-id
      const dataTargets = document.querySelectorAll(`[data-section-id="${hash.substring(1)}"]`);
      if (dataTargets.length > 0) {
        setTimeout(() => {
          dataTargets[0].scrollIntoView({ behavior: 'smooth' });
          console.log(`Scrolled to element with data-section-id ${hash.substring(1)}`);
        }, 200);
      }
    }
  }
}

// Modify the loadPageContent function to handle anchor links
// Inside your loadPageContent function, after updating the URL 
// and before the final else block, add this code block:

// Update URL (replace if redirect, push if normal navigation)
if (isRedirectLoad) {
  history.replaceState({url: url}, document.title, url);
} else {
  history.pushState({url: url}, document.title, url);
}

// Initialize new content
initPageContent();

// Check for anchor in the URL and scroll to it if present
if (url.includes('#')) {
  scrollToAnchor(url);
}

// Also modify the bindAllLinks function to handle anchor links to the same page
function bindAllLinks() {
  document.querySelectorAll('a[href^="/"]').forEach(link => {
    // Skip already processed links
    if (link.hasAttribute(HANDLED_LINK_ATTR)) return;
    
    const href = link.getAttribute("href");
    
    // Skip resource links
    if (href.match(/\.(pdf|zip|jpg|png|gif|svg|mp4|webm)$/i)) return;
    
    // Mark as handled
    link.setAttribute(HANDLED_LINK_ATTR, "true");
    
    // Add click handler
    link.addEventListener("click", function(e) {
      e.preventDefault();
      
      // Check if this is just an anchor link to the current page
      if (href.startsWith('/#') && (window.location.pathname === '/' || window.location.pathname.endsWith('index.html'))) {
        // Just scroll to the anchor on the same page
        history.pushState({url: href}, document.title, href);
        scrollToAnchor(href);
      } else {
        // Navigate to a different page
        loadPageContent(href);
      }
    });
  });
}
});
