---
title: "Publications"
permalink: /publications/
layout: default  
excerpt: ""
author_profile: true
---

# 📝 Publications 

{% for pub in site.data.publications %}
<div class="paper-box" style="margin-bottom: 1.2em;">
  <div class="paper-box-text" style="font-size: 0.95em; line-height: 1.5;">
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <span style="background-color: #00369f; color: white; padding: 0.2em 0.5em; border-radius: 4px; font-weight: 600; font-size: 0.75em;">
        {{ pub.short }}
      </span>
      <span style="color: #ccc; font-size: 1.5em;">{{ pub.year }}</span>
    </div>

    <div style="margin-top: 0.4em; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
      {{ pub.title }}
    </div>

    <div style="margin-top: 0.4em; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
  <a href="{{ pub.url }}" target="_blank" style="text-decoration: none; color: inherit;">
    {{ pub.title }}
  </a>
</div>


    <div style="margin-top: 0.2em; font-style: italic; color: #444;">
      <em>{{ pub.venue }}</em>, {{ pub.year }}
    </div>
  </div>
</div>
{% endfor %}

    <div style="margin-top: 0.2em; font-style: italic; color: #444;">
      <em>IEEE Transactions on Mobile Computing</em>, 2024
    </div>
  </div>
</div>
