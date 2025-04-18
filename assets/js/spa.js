/**
 * Enhanced SPA Implementation for Academic Homepage
 * 
 * Features:
 * 1. Content-only updates when navigating between pages
 * 2. Single page navigation without opening new pages
 * 3. Consistent white background
 * 4. Preserved map information when switching pages
 * 5. Refresh handling for subpages (redirect to home first, then to the target)
 * 6. Improved anchor scrolling for highlighted sections
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
  
  // Global map data cache (simplified)
  window.mapDataCache = window.mapDataCache || {
    markers: [],
    initialized: false
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
  
  // Pre-process URL to determine if it's a map page
  function isUrlMapPage(url) {
    return url.includes("/travel") || url.includes("/map");
  }
  
  // Load page content without full refresh
  function loadPageContent(url, isRedirectLoad = false) {
    // Save anchor if present for later use
    const hasAnchor = url.includes('#');
    const anchor = hasAnchor ? url.substring(url.indexOf('#')) : null;
    const urlWithoutAnchor = hasAnchor ? url.substring(0, url.indexOf('#')) : url;
    
    // Check if we're navigating to or from a map page
    const wasMapPage = isMapPage;
    const willBeMapPage = isUrlMapPage(url);
    
    // Update map page status for next time
    isMapPage = willBeMapPage;
    
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
    
    // Skip content loading if we're just navigating to an anchor on the same page
    if (hasAnchor && 
        (window.location.pathname === urlWithoutAnchor || 
         (window.location.pathname === '/' && urlWithoutAnchor === '/'))) {
      
      // Just update URL and scroll to anchor
      console.log(`Same-page anchor navigation to ${anchor}`);
      
      if (isRedirectLoad) {
        history.replaceState({url: url}, document.title, url);
      } else {
        history.pushState({url: url}, document.title, url);
      }
      
      scrollToAnchor(url);
      document.body.removeChild(loadingIndicator);
      return;
    }
    
    // Fetch page content
    fetch(urlWithoutAnchor)
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
          
          // Update main content only
          mainContent.innerHTML = newContent.innerHTML;
          
          // Update URL (replace if redirect, push if normal navigation)
          // Make sure to include the anchor if present
          const fullUrl = hasAnchor ? `${urlWithoutAnchor}${anchor}` : urlWithoutAnchor;
          
          if (isRedirectLoad) {
            history.replaceState({url: fullUrl}, document.title, fullUrl);
          } else {
            history.pushState({url: fullUrl}, document.title, fullUrl);
          }
          
          // Initialize new content
          initPageContent();
          
          // Rebind all links
          bindAllLinks();
          
          // Give the browser time to render content before scrolling
          setTimeout(() => {
            // Handle scroll position
            if (isRedirectLoad && window.restoreScrollPosition) {
              window.restoreScrollPosition();
              window.restoreScrollPosition = null;
            } else if (hasAnchor) {
              // Scroll to anchor with increased delay for content to render
              scrollToAnchor(fullUrl);
            } else {
              // Regular navigation, scroll to top
              window.scrollTo(0, 0);
            }
          }, 300);
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
    
    // Enhanced map handling (simplified)
    if (isCurrentMapPage) {
      console.log("Initializing map via initPageContent");
      
      // Try to initialize map after a delay
      setTimeout(() => {
        if (typeof window.initTravelMap === 'function') {
          window.initTravelMap();
        } else {
          // Fallback to simple map creation
          const mapContainer = document.getElementById("travel-map") || 
                          document.querySelector(".travel-map-container");
          if (mapContainer) {
            createMapWithLeaflet(mapContainer);
          }
        }
      }, 300);
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
  
  // Simplified map creation function
  function createMapWithLeaflet(container) {
    if (!container || !window.L) {
      // Load Leaflet if not available
      loadLeaflet().then(() => createMapWithLeaflet(container));
      return;
    }
    
    // Clear any existing map
    if (window.travelMap) {
      window.travelMap.remove();
    }
    
    // Create map
    const map = L.map(container.id || 'travel-map').setView([30, 105], 2);
    window.travelMap = map;
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 10,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Get travel data
    let travelData = [];
    
    // Try different data sources in order of preference
    if (window.siteData && window.siteData.travelCities) {
      travelData = window.siteData.travelCities;
    } else if (window.mapDataCache && window.mapDataCache.initialized) {
      // Try to restore from cache
      travelData = window.mapDataCache.markers.map(marker => ({
        city: marker.city || "Unknown",
        lat: marker.lat || 0,
        lon: marker.lng || 0,
        visits: marker.visits || []
      }));
    }
    
    // Fallback to sample data if needed
    if (!travelData || travelData.length === 0) {
      travelData = getSampleTravelData();
    }
    
    // Add markers for each location
    travelData.forEach(location => {
      if (!location.lat || !location.lon) return;
      
      const visits = Array.isArray(location.visits) ? location.visits : [];
      const totalVisits = visits.length;
      const recentVisits = visits.slice(0, Math.min(5, totalVisits)).reverse();
      
      const popupContent = `
        <strong>${location.city}</strong><br/>
        🧭 Total trips: ${totalVisits}<br/>
        🕒 Most recent ${recentVisits.length} trips:<br/>
        <ul style="padding-left: 16px; margin: 5px 0;">
          ${recentVisits.map(date => `<li>${date}</li>`).join("")}
        </ul>
      `;
      
      // Size based on visit count
      const radius = 3 + Math.min(totalVisits, 8) * 0.7;
      
      // Create marker
      L.circleMarker([location.lat, location.lon], {
        radius: radius,
        fillColor: "#d62728",
        color: "#b22222",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.7
      }).bindPopup(popupContent).addTo(map);
    });
    
    // Update statistics
    updateTravelStats(travelData);
    
    // Cache data for future use
    window.mapDataCache = {
      markers: travelData.map(item => ({
        city: item.city,
        lat: item.lat,
        lng: item.lon,
        visits: item.visits
      })),
      initialized: true
    };
    
    // Refresh map layout
    setTimeout(() => map.invalidateSize(), 100);
    
    return map;
  }
  
  // Get sample travel data for fallback
  function getSampleTravelData() {
    return [
      {
        "city": "Beijing",
        "lat": 39.9042,
        "lon": 116.4074,
        "visits": ["2025-02-28"]
      },
      {
        "city": "Singapore",
        "lat": 1.3521,
        "lon": 103.8198,
        "visits": ["2025-03-14", "2025-01-10", "2024-12-20"]
      },
      {
        "city": "Hong Kong",
        "lat": 22.3193,
        "lon": 114.1694,
        "visits": ["2024-12-16"]
      }
    ];
  }
  
  // Update travel statistics
  function updateTravelStats(travelData) {
    const totalCitiesElement = document.getElementById('total-cities');
    const totalVisitsElement = document.getElementById('total-visits');
    
    if (!travelData || !travelData.length) return;
    
    // Update city count
    if (totalCitiesElement) {
      totalCitiesElement.textContent = travelData.length;
    }
    
    // Update visit count
    if (totalVisitsElement) {
      let totalVisits = 0;
      travelData.forEach(city => {
        if (city.visits && Array.isArray(city.visits)) {
          totalVisits += city.visits.length;
        }
      });
      totalVisitsElement.textContent = totalVisits;
    }
  }
  
  // Override the default map initialization if it exists
  if (typeof window.initTravelMap === 'function') {
    const originalInitTravelMap = window.initTravelMap;
    
    window.initTravelMap = function() {
      console.log("SPA: Initializing travel map");
      
      const mapContainer = document.getElementById('travel-map');
      if (!mapContainer) {
        console.log("Map container not found, skipping initialization");
        return;
      }
      
      // Try the original function first
      try {
        originalInitTravelMap();
        
        // Check if map was successfully initialized
        setTimeout(() => {
          if (!mapContainer._leaflet && !mapContainer.querySelector('.leaflet-container')) {
            // Fallback to simple creation
            createMapWithLeaflet(mapContainer);
          }
        }, 300);
      } catch (e) {
        console.error("Original map init failed, using fallback:", e);
        createMapWithLeaflet(mapContainer);
      }
    };
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
        
        // Handle all navigation through the loadPageContent function
        loadPageContent(href);
      });
    });
  }
  
  // Handle browser back/forward buttons
  window.addEventListener("popstate", function(event) {
    if (event.state && event.state.url) {
      loadPageContent(event.state.url);
    } else {
      loadPageContent(window.location.pathname + window.location.hash);
    }
  });
  
  // Scroll to anchor function with improved reliability
  function scrollToAnchor(url) {
    // Extract the hash part from the URL
    const hash = url.includes('#') ? url.substring(url.indexOf('#')) : null;
    
    if (!hash) return;
    
    console.log(`Attempting to scroll to anchor: ${hash}`);
    
    // Function to do the actual scrolling with multiple attempts
    const attemptScrollToElement = function(retryCount = 0, maxRetries = 5) {
      // Clean the hash by removing any URL encoding
      const cleanHash = decodeURIComponent(hash);
      const hashWithoutPrefix = cleanHash.substring(1); // Remove the # prefix
      
      // Try multiple selector approaches
      let targetElement = null;
      
      // Method 1: Direct ID selector
      try {
        targetElement = document.querySelector(cleanHash);
      } catch (e) {
        console.warn(`Error with direct selector "${cleanHash}":`, e.message);
      }
      
      // Method 2: Try with escaped selector for special characters
      if (!targetElement) {
        try {
          // Escape special characters in CSS selector
          const escapedHash = '#' + CSS.escape(hashWithoutPrefix);
          targetElement = document.querySelector(escapedHash);
        } catch (e) {
          console.warn("Error with escaped selector:", e.message);
        }
      }
      
      // Method 3: Try getting element by ID directly
      if (!targetElement) {
        targetElement = document.getElementById(hashWithoutPrefix);
      }
      
      // Method 4: Check for data-section-id attribute
      if (!targetElement) {
        targetElement = document.querySelector(`[data-section-id="${hashWithoutPrefix}"]`);
      }
      
      // Method 5: Look for elements with class matching the hash
      if (!targetElement) {
        targetElement = document.querySelector(`.${hashWithoutPrefix}`);
      }
      
      // Method 6: Try finding an anchor name
      if (!targetElement) {
        targetElement = document.querySelector(`a[name="${hashWithoutPrefix}"]`);
      }
      
      // Method 7: Try finding headers with id containing the hash (partial match)
      if (!targetElement) {
        const headers = document.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id]');
        for (const header of headers) {
          if (header.id.includes(hashWithoutPrefix)) {
            targetElement = header;
            break;
          }
        }
      }
      
      if (targetElement) {
        console.log(`Found target element for "${cleanHash}", scrolling to it`);
        
        // Scroll with smooth behavior
        targetElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start'
        });
        
        // Highlight the element briefly to make it more noticeable
        const originalBackground = targetElement.style.backgroundColor;
        const originalTransition = targetElement.style.transition;
        
        targetElement.style.transition = 'background-color 1s ease-in-out';
        targetElement.style.backgroundColor = 'rgba(255, 255, 0, 0.2)';
        
        setTimeout(() => {
          targetElement.style.backgroundColor = originalBackground;
          setTimeout(() => {
            targetElement.style.transition = originalTransition;
          }, 1000);
        }, 1000);
        
        return true;
      } else if (retryCount < maxRetries) {
        // Element might not be fully loaded yet, retry after a delay
        console.log(`Element for "${cleanHash}" not found, retrying in ${100 * (retryCount + 1)}ms (attempt ${retryCount + 1}/${maxRetries})`);
        setTimeout(() => {
          attemptScrollToElement(retryCount + 1, maxRetries);
        }, 100 * (retryCount + 1));
        return false;
      } else {
        console.warn(`Could not find element for "${cleanHash}" after ${maxRetries} attempts`);
        return false;
      }
    };
    
    // Start with a larger initial delay for content to fully render
    setTimeout(() => {
      attemptScrollToElement();
    }, 300);
  }
  
  // Initial link binding
  bindAllLinks();
  
  // Map observation to detect dynamically added map containers
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
          console.log("Map container detected in DOM");
          if (typeof window.initTravelMap === 'function') {
            window.initTravelMap();
          }
        }
      }
    }
  });
  
  // Start observing DOM for map container
  mapObserver.observe(document.body, { childList: true, subtree: true });
  
  // Check for hash in URL on initial load
  if (window.location.hash) {
    // Wait for page to fully load before scrolling to hash
    setTimeout(() => {
      scrollToAnchor(window.location.pathname + window.location.hash);
    }, 500);
  }
});
