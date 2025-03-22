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
- *2022.02*: &nbsp;🎉🎉 Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ornare aliquet ipsum, ac tempus justo dapibus sit amet. 
- *2022.02*: &nbsp;🎉🎉 Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ornare aliquet ipsum, ac tempus justo dapibus sit amet. 



# 🌍 Travel Map

<div id="travel-map" style="height: 400px; border-radius: 8px; margin: 20px 0;"></div>

<p class="map-stats">截至目前共访问了 <span id="total-cities">0</span> 个城市，累计 <span id="total-visits">0</span> 次旅行体验。</p>

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
  document.addEventListener("DOMContentLoaded", function () {
    // 初始化地图
    const map = L.map('travel-map').setView([30, 105], 2);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 10,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
  });
</script>

// 旅行数据
    const travelData = [
      {
        "city": "北京",
        "lat": 39.9042,
        "lon": 116.4074,
        "visits": ["2023-12-15", "2023-10-01", "2023-07-20", "2022-05-10", "2022-01-25"]
      },
      {
        "city": "上海",
        "lat": 31.2304,
        "lon": 121.4737,
        "visits": ["2024-01-05", "2023-09-10", "2023-04-15"]
      },
      {
        "city": "东京",
        "lat": 35.6762,
        "lon": 139.6503,
        "visits": ["2023-08-12", "2022-11-30", "2022-03-15", "2021-07-20"]
      },
      {
        "city": "新加坡",
        "lat": 1.3521,
        "lon": 103.8198,
        "visits": ["2024-02-10", "2023-11-20", "2023-06-15"]
      }
    ];
    
    // 处理旅行数据并添加标记
    travelData.forEach(entry => {
      const totalVisits = entry.visits.length;
      const recentVisits = entry.visits.slice(0, Math.min(5, totalVisits)).reverse();
      
      const popupContent = `
        <strong>${entry.city}</strong><br/>
        🧭 出行次数：${totalVisits}<br/>
        🕒 最近 ${recentVisits.length} 次：<br/>
        <ul style="padding-left: 16px; margin: 5px 0;">
          ${recentVisits.map(date => `<li>${date}</li>`).join("")}
        </ul>
      `;
      
      // 根据访问次数调整圆点大小
      const radius = 5 + totalVisits * 2;
      
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

















<div id="map" style="height: 600px; border-radius: 12px;"></div>

<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<script>
  document.addEventListener("DOMContentLoaded", function () {
    const map = L.map('map').setView([20, 0], 2);  // 世界地图居中视角

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 8,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // 异步加载 travel 数据
    fetch('/assets/data/travel.json')
      .then(response => response.json())
      .then(data => {
        data.forEach(entry => {
          const totalVisits = entry.visits.length;
          const recentVisits = entry.visits.slice(-5).reverse();

          const popupContent = `
            <strong>${entry.city}</strong><br/>
            🧭 出行次数：${totalVisits}<br/>
            🕒 最近 5 次：<br/>
            <ul style="padding-left: 16px;">
              ${recentVisits.map(date => `<li>${date}</li>`).join("")}
            </ul>
          `;

          const radius = 5 + totalVisits * 3;

          L.circleMarker([entry.lat, entry.lon], {
            radius: radius,
            fillColor: "#d62728",
            color: "#b22222",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.7
          }).bindPopup(popupContent).addTo(map);
        });
      })
      .catch(error => {
        console.error("加载出行数据失败：", error);
      });
  });
</script>




# 📝 Publications 

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">CVPR 2016</div><img src='images/500x300.png' alt="sym" width="100%"></div></div>
<div class='paper-box-text' markdown="1">

[Deep Residual Learning for Image Recognition](https://openaccess.thecvf.com/content_cvpr_2016/papers/He_Deep_Residual_Learning_CVPR_2016_paper.pdf)

**Kaiming He**, Xiangyu Zhang, Shaoqing Ren, Jian Sun

[**Project**](https://scholar.google.com/citations?view_op=view_citation&hl=zh-CN&user=DhtAFkwAAAAJ&citation_for_view=DhtAFkwAAAAJ:ALROH1vI_8AC) <strong><span class='show_paper_citations' data='DhtAFkwAAAAJ:ALROH1vI_8AC'></span></strong>
- Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ornare aliquet ipsum, ac tempus justo dapibus sit amet. 
</div>
</div>

- [Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ornare aliquet ipsum, ac tempus justo dapibus sit amet](https://github.com), A, B, C, **CVPR 2020**

# 🎖 Honors and Awards
- *2021.10* Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ornare aliquet ipsum, ac tempus justo dapibus sit amet. 
- *2021.09* Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ornare aliquet ipsum, ac tempus justo dapibus sit amet. 

# 📖 Educations
- *2019.06 - 2022.04 (now)*, Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ornare aliquet ipsum, ac tempus justo dapibus sit amet. 
- *2015.09 - 2019.06*, Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ornare aliquet ipsum, ac tempus justo dapibus sit amet. 

# 💬 Invited Talks
- *2021.06*, Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ornare aliquet ipsum, ac tempus justo dapibus sit amet. 
- *2021.03*, Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ornare aliquet ipsum, ac tempus justo dapibus sit amet.  \| [\[video\]](https://github.com/)

# 💻 Internships
- *2019.05 - 2020.02*, [Lorem](https://github.com/), China.
