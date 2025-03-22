/**
 * 地图初始化辅助脚本 - 在主脚本外提供额外的地图支持
 * 将此脚本添加到包含地图的页面中
 */
(function() {
  // 等待DOM完全加载
  function docReady(fn) {
    if (document.readyState !== 'loading') {
      setTimeout(fn, 0);
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }
  
  // 主函数 - 帮助初始化地图
  docReady(function() {
    console.log("地图辅助脚本已加载");
    
    // 确保全局对象存在
    window.mapHelpers = window.mapHelpers || {};
    
    // 跟踪初始化状态
    window.mapHelpers.initialized = false;
    window.mapHelpers.initAttempts = 0;
    window.mapHelpers.maxAttempts = 5;
    
    // 保存原始的初始化函数
    if (typeof window.initTravelMap === 'function' && !window.mapHelpers.originalInitFunc) {
      window.mapHelpers.originalInitFunc = window.initTravelMap;
      
      // 增强初始化函数
      window.initTravelMap = function() {
        try {
          // 记录尝试次数
          window.mapHelpers.initAttempts++;
          console.log(`地图初始化尝试 #${window.mapHelpers.initAttempts}`);
          
          // 调用原始初始化函数
          const result = window.mapHelpers.originalInitFunc.apply(this, arguments);
          
          // 检查初始化结果
          setTimeout(function() {
            checkMapInitialization();
          }, 500);
          
          return result;
        } catch (e) {
          console.error("增强的地图初始化函数出错:", e);
          // 失败重试
          if (window.mapHelpers.initAttempts < window.mapHelpers.maxAttempts) {
            console.log("初始化失败，安排重试...");
            setTimeout(window.initTravelMap, 1000);
          }
        }
      };
    }
    
    // 检查地图是否成功初始化
    function checkMapInitialization() {
      // 查找地图容器
      const mapContainer = document.getElementById('travel-map') || document.querySelector('.travel-map-container');
      if (!mapContainer) {
        console.warn("找不到地图容器，无法检查初始化状态");
        return;
      }
      
      // 检查是否有Leaflet实例或其他地图标志
      const hasLeaflet = mapContainer._leaflet || 
                         mapContainer.querySelector('.leaflet-container') ||
                         document.querySelector('.leaflet-container');
                         
      const hasMapContent = mapContainer.querySelector('svg') || 
                           mapContainer.querySelector('canvas') ||
                           mapContainer.querySelectorAll('*').length > 3;
      
      if (hasLeaflet || hasMapContent) {
        console.log("地图似乎已成功初始化!");
        window.mapHelpers.initialized = true;
      } else {
        console.warn("地图可能没有正确初始化，容器内容:", mapContainer.innerHTML);
        
        // 还有重试次数就继续尝试
        if (window.mapHelpers.initAttempts < window.mapHelpers.maxAttempts) {
          console.log(`地图初始化检查失败，将在1秒后重试(${window.mapHelpers.initAttempts}/${window.mapHelpers.maxAttempts})`);
          setTimeout(window.initTravelMap, 1000);
        } else {
          console.error("达到最大尝试次数，地图初始化失败");
          // 通知其他脚本初始化失败
          document.dispatchEvent(new CustomEvent('spa:mapInitFailed'));
        }
      }
    }
    
    // 监听页面内容更新事件
    document.addEventListener('spa:contentUpdated', function(e) {
      console.log("检测到内容更新，检查是否需要初始化地图:", e.detail.path);
      
      // 重置初始化状态
      window.mapHelpers.initialized = false;
      window.mapHelpers.initAttempts = 0;
      
      // 判断更新的页面是否包含地图
      const mapContainer = document.getElementById('travel-map') || document.querySelector('.travel-map-container');
      
      if (mapContainer) {
        console.log("发现地图容器，安排初始化...");
        
        // 延迟初始化让DOM完全渲染
        setTimeout(function() {
          // 派发初始化请求事件
          document.dispatchEvent(new CustomEvent('spa:needMapInit'));
          
          // 直接调用初始化
          if (typeof window.initTravelMap === 'function') {
            window.initTravelMap();
          }
          
          // 再次在短延迟后检查状态
          setTimeout(checkMapInitialization, 1000);
        }, 500);
      }
    });
    
    // 初始检查 - 当前页面是否有地图
    const mapContainer = document.getElementById('travel-map') || document.querySelector('.travel-map-container');
    if (mapContainer) {
      console.log("当前页面包含地图，尝试初始化");
      if (typeof window.initTravelMap === 'function') {
        // 派发初始化请求
        document.dispatchEvent(new CustomEvent('spa:needMapInit'));
        
        // 延迟调用初始化
        setTimeout(window.initTravelMap, 500);
      }
    }
  });
  
  // 如果Leaflet可用，增强其功能以适应SPA
  if (window.L) {
    // 保存原始的地图创建函数
    const originalMapFunc = window.L.map;
    
    // 增强地图创建函数，使其更适应SPA环境
    window.L.map = function(id, options) {
      console.log("增强的Leaflet地图创建:", id);
      
      try {
        // 检查容器
        const container = typeof id === 'string' ? document.getElementById(id) : id;
        
        // 如果容器已有地图实例，先移除
        if (container && container._leaflet) {
          console.log("容器已有地图实例，先移除");
          container._leaflet.remove();
        }
        
        // 创建新地图
        const map = originalMapFunc.call(this, id, options);
        
        // 添加SPA环境必要的事件处理
        map.on('load', function() {
          console.log("Leaflet地图加载完成");
          document.dispatchEvent(new CustomEvent('spa:mapLoaded', { detail: { map: map } }));
        });
        
        return map;
      } catch (e) {
        console.error("增强的Leaflet地图创建失败:", e);
        // 尝试以原始方式创建
        return originalMapFunc.call(this, id, options);
      }
    };
  }
})();
