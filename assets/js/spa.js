document.addEventListener("DOMContentLoaded", function () {
  const mainContent = document.querySelector("#main-content");
  
  function loadPage(fullUrl, updateHistory = true) {
    // Extract path and hash correctly
    let path, hash;
    if (fullUrl.includes("#")) {
      [path, hash] = fullUrl.split("#");
      hash = hash ? hash : "";
    } else {
      path = fullUrl;
      hash = "";
    }
    
    // Clean up the URL - make sure we're requesting a valid path
    const cleanUrl = (path === "" || path === "/") ? "/index.html" : path;
    
    // For paths like "/cv/" make sure to append index.html or handle accordingly
    const requestUrl = cleanUrl.endsWith("/") ? `${cleanUrl}index.html` : cleanUrl;
    
    fetch(requestUrl)
      .then(response => {
        if (!response.ok) throw new Error("Page not found");
        return response.text();
      })
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const newContent = doc.querySelector("#main-content");
        
        if (newContent && mainContent) {
          mainContent.innerHTML = newContent.innerHTML;
          document.title = doc.title;
          window.scrollTo(0, 0); // Scroll to top
          
          if (updateHistory) {
            history.pushState(null, "", fullUrl);
          }
          
          if (typeof window.loadCitation === "function") {
            window.loadCitation();
          }
          
          if (hash) {
            setTimeout(() => {
              const target = document.getElementById(hash);
              if (target) {
                target.scrollIntoView({ behavior: "smooth" });
              }
            }, 50);
          }
          
          // Re-attach event listeners to any new navigation links
          attachNavLinkListeners();
        }
      })
      .catch(err => {
        console.error("SPA load error:", err);
        mainContent.innerHTML = "<p><strong>Page failed to load.</strong></p>";
      });
  }
  
  // Function to attach event listeners to navigation links
  function attachNavLinkListeners() {
    document.querySelectorAll("a.nav-link").forEach(link => {
      const href = link.getAttribute("href");
      if (href && href.startsWith("/") && !href.includes(".") && !href.startsWith("//")) {
        // Remove any existing event listeners to avoid duplicates
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);
        
        newLink.addEventListener("click", function (e) {
          e.preventDefault();
          loadPage(href);
        });
      }
    });
  }
  
  // Handle browser back/forward navigation
  window.addEventListener("popstate", function () {
    const currentPath = window.location.pathname + window.location.hash;
    loadPage(currentPath, false);
  });
  
  // Initial page load
  const initialPath = window.location.pathname + window.location.hash;
  loadPage(initialPath, false);
  
  // Attach event listeners to initial navigation links
  attachNavLinkListeners();
});
