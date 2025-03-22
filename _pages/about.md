---
layout: page  
permalink: /
title: ""
excerpt: ""
author_profile: true
redirect_from: 
  - /about/
  - /about.html
---

{% if site.google_scholar_stats_use_cdn %}
{% assign gsDataBaseUrl = "https://cdn.jsdelivr.net/gh/" | append: site.repository | append: "@" %}
{% else %}
{% assign gsDataBaseUrl = "https://raw.githubusercontent.com/" | append: site.repository | append: "/" %}
{% endif %}
{% assign url = gsDataBaseUrl | append: "google-scholar-stats/gs_data_shieldsio.json" %}

<span class='anchor' id='about-me'></span>

<!--Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ornare aliquet ipsum, ac tempus justo dapibus sit amet. Suspendisse condimentum, libero vel tempus mattis, risus risus vulputate libero, elementum fermentum mi neque vel nisl. Maecenas facilisis maximus dignissim. Curabitur mattis vulputate dui, tincidunt varius libero luctus eu. Mauris mauris nulla, scelerisque eget massa id, tincidunt congue felis. Sed convallis tempor ipsum rhoncus viverra. Pellentesque nulla orci, accumsan volutpat fringilla vitae, maximus sit amet tortor. Aliquam ultricies odio ut volutpat scelerisque. Donec nisl nisl, porttitor vitae pharetra quis, fringilla sed mi. Fusce pretium dolor ut aliquam consequat. Cras volutpat, tellus accumsan mattis molestie, nisl lacus tempus massa, nec malesuada tortor leo vel quam. Aliquam vel ex consectetur, vehicula leo nec, efficitur eros. Donec convallis non urna quis feugiat.-->

## 👋 About Me {#about-me}

Hi! I am currently a PhD candidate at the College of Computing and Data Science, Nanyang Technological University (NTU), Singapore, supervised by [Prof. Dusit Niyato](https://personal.ntu.edu.sg/dniyato/) (IEEE Fellow).

Prior to this, I obtained a BEng degree at the University of Science and Technology of China, China, and an MSc degree at the University of Chinese Academy of Sciences, Institute of Software, China, under the guidance of [Prof. Bai Xue](https://lcs.ios.ac.cn/~xuebai/).

My research is primarily centered around the utilization of Generative AI (GenAI) and Large Language Models (LLMs) in wireless communications and intelligent networking. 

Our primary objective is to investigate how intelligent networks can support a wide range of GenAI and LLM models, and "how GenAI and LLM models can enhance the performance, security, and reliability of next-generation communication systems. I have published several papers with total <a href='https://scholar.google.com/citations?user=FI6q53MAAAAJ'>google scholar </a> <a href='https://scholar.google.com/citations?user=FI6q53MAAAAJ'><img src="https://img.shields.io/endpoint?url={{ url | url_encode }}&logo=Google%20Scholar&labelColor=f6f6f6&color=9cf&style=flat&label=citations"></a>.

For more information, please visit our research group at NTU.

<!--  My research interest includes neural machine translation and computer vision. I have published more than 100 papers at the top international AI conferences with total <a href='https://scholar.google.com/citations?user=FI6q53MAAAAJ'>google scholar citations <strong><span id='total_cit'>260000+</span></strong></a> <a href='https://scholar.google.com/citations?user=FI6q53MAAAAJ'><img src="https://img.shields.io/endpoint?url={{ url | url_encode }}&logo=Google%20Scholar&labelColor=f6f6f6&color=9cf&style=flat&label=citations"></a> -->

<!-- (You can also use google scholar badge <a href='https://scholar.google.com/citations?user=FI6q53MAAAAJ'><img src="https://img.shields.io/endpoint?url={{ url | url_encode }}&logo=Google%20Scholar&labelColor=f6f6f6&color=9cf&style=flat&label=citations"></a>).-->


# 🔥 News
- *2025.03*: &nbsp;🎉🎉 One coauthored paper has been accepted by the IEEE Internet of Things Journal. Thanks Prof. Dusit and Prof. Geng Sun!
- *2025.03*: &nbsp;📖📖 I arrive in Suwon, South Korea, and will start the visit at Sungkyunkwan University, hosted by [Prof. Dong In Kim](https://scholar.google.com/citations?user=v2chr7kAAAAJ&hl=en).
- *2024.12*: &nbsp;🎉🎉 One first-author paper has been accepted to the 39th Annual AAAI Conference on Artificial Intelligence — see you in Philadelphia, Pennsylvania, USA, next March!
- *2024.11*: &nbsp;🎉🎉 One first-author paper has been accepted by the IEEE Wireless Communications. Thanks Prof. Dusit and Prof. Jiawen!



# 🌍 Travel Map

<div id="travel-map" style="height: 400px; width: 100%; border-radius: 8px; margin: 20px 0; position: relative; z-index: 1;"></div>
<p class="map-stats">Since 2025 Dec., I have visited <span id="total-cities">0</span> cities with a total of <span id="total-visits">0</span> travel experiences.</p>
<style>
  #travel-map {
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    margin-bottom: 15px;
  }
  
  /* 弹出窗口样式 */
  .leaflet-popup-content {
    font-size: 14px;
    line-height: 1.4;
  }
  
  .leaflet-popup-content strong {
    color: #d62728;
    font-size: 16px;
  }
  
  .leaflet-popup-content ul {
    margin-top: 5px;
    margin-bottom: 5px;
  }
  
  /* 添加统计信息样式 */
  .map-stats {
    text-align: center;
    color: #666;
    font-size: 0.9em;
    margin-top: 10px;
  }
  
  .map-stats span {
    font-weight: bold;
    color: #d62728;
  }
</style>
<!-- Leaflet 地图库 -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css" />
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"></script>
<script>
  // 初始化函数
  function initMap() {
    console.log("初始化地图...");
    
    // 检查地图容器是否存在
    const mapContainer = document.getElementById('travel-map');
    if (!mapContainer) {
      console.error("找不到地图容器");
      return;
    }
    
    // 防止多次初始化
    if (window.travelMap) {
      // 如果地图已经存在，只需刷新布局
      window.travelMap.invalidateSize();
      return;
    }
    
    // 初始化地图
    const map = L.map('travel-map').setView([30, 105], 2);
    window.travelMap = map;
    
    // 尝试多个瓦片源，增加可靠性
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
    
    // 使用 Jekyll 从 YAML 文件中获取旅行数据
    const travelData = {{ site.data.travel.cities | jsonify }} || [];
    
    // 处理旅行数据并添加标记
    travelData.forEach(entry => {
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
      
      // 根据访问次数调整圆点大小，设置最大值
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
    document.getElementById('total-cities').textContent = travelData.length;
    let totalVisits = 0;
    travelData.forEach(entry => {
      totalVisits += entry.visits.length;
    });
    document.getElementById('total-visits').textContent = totalVisits;
    
    // 强制刷新地图布局
    setTimeout(function() {
      map.invalidateSize();
    }, 100);
  }

  // 页面加载时初始化地图
  window.onload = initMap;
  
  // 当URL的哈希部分变化时（例如点击锚点链接时）重新初始化地图
  window.addEventListener('hashchange', function() {
    // 给地图一点时间来重新布局
    setTimeout(initMap, 300);
  });
  
  // 对于使用pushState的情况
  window.addEventListener('popstate', function() {
    setTimeout(initMap, 300);
  });
</script>
