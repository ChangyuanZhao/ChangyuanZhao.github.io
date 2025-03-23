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
  
  // Load page content without full refresh
  function loadPageContent(url, isRedirectLoad = false) {
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
        return;
      }
      
      // Clean up existing map instance if present
      if (mapContainer._leaflet_id) {
        try {
          if (window.L && window.L.DomUtil.get(mapContainer.id)._leaflet_id) {
            window.L.DomUtil.get(mapContainer.id)._leaflet = null;
          }
        } catch (e) {
          console.log("No existing Leaflet map to clean up");
        }
      }
      
      // Ensure map container has proper dimensions
      mapContainer.style.minHeight = "400px";
      mapContainer.style.display = "block";
      
      // Schedule multiple initialization attempts
      const initAttempts = [100, 500, 1000, 2000];
      
      initAttempts.forEach((delay, index) => {
        setTimeout(() => {
          if (typeof window.initTravelMap === "function") {
            try {
              console.log(`Map initialization attempt ${index + 1}`);
              window.initTravelMap();
            } catch (e) {
              console.error(`Map initialization error (attempt ${index + 1}):`, e);
              
              // Last attempt fallback
              if (index === initAttempts.length - 1 && window.L) {
                console.log("Final attempt: Basic map initialization");
                try {
                  // Clear container
                  mapContainer.innerHTML = "";
                  
                  // Create basic map
                  const basicMap = window.L.map(mapContainer.id || "travel-map").setView([20, 0], 2);
                  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                    attribution: "© OpenStreetMap contributors"
                  }).addTo(basicMap);
                } catch (fallbackError) {
                  console.error("Fallback map creation failed:", fallbackError);
                }
              }
            }
          }
        }, delay);
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
