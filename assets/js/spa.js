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
    handleMapInitialization();
    
    // Trigger custom content update event
    document.dispatchEvent(new CustomEvent("spa:contentUpdated", {
      detail: { path: window.location.pathname }
    }));
    
    // Ensure white background
    setWhiteBackground();
    
    // Update sidebar active states
    updateSidebarActiveState();
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
    
    // Leaflet backup function
    function useLeafletBackup() {
      if (mapInitialized) return;
      
      ensureLeaflet(() => {
        console.log("Using Leaflet backup initialization");
        try {
          // Clear container
          const currentContent = mapContainer.innerHTML;
          mapContainer.innerHTML = "";
          
          if (window.L) {
            // Create basic map
            const basicMap = window.L.map(mapContainer.id || mapContainer).setView([20, 0], 2);
            window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
              attribution: "© OpenStreetMap contributors"
            }).addTo(basicMap);
            
            console.log("Created basic map with Leaflet");
            mapInitialized = true;
            
            // Add custom event
            document.dispatchEvent(new CustomEvent('spa:mapCreated', {
              detail: { map: basicMap }
            }));
            
            // If custom init exists, try to use it
            if (window.customMapInit && typeof window.customMapInit === 'function') {
              try {
                window.customMapInit(basicMap);
              } catch (e) {
                console.error("Custom map initialization failed:", e);
              }
            }
          } else {
            // If Leaflet failed to load, restore original content
            console.error("Leaflet failed to load, restoring original content");
            mapContainer.innerHTML = currentContent;
          }
        } catch (fallbackError) {
          console.error("Leaflet backup failed:", fallbackError);
        }
      });
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
});
