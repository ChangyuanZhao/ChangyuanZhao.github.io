---
title: "Publications"
permalink: /publications/
layout: default  
excerpt: ""
author_profile: true
---

# 📝 Publications 
<!-- Journal Papers -->
## 📰 Journal Papers
{% assign journals = site.data.publications | where: "type", "Journal" %}
{% assign journals_sorted = journals | sort: "year" | reverse %}
{% for pub in journals_sorted %}
  {% include publication-entry.html pub=pub %}
{% endfor %}

<!-- Conference Papers -->
## 🎤 Conference Papers
{% assign confs = site.data.publications | where: "type", "Conference" %}
{% assign confs_sorted = confs | sort: "year" | reverse %}
{% for pub in confs_sorted %}
  {% include publication-entry.html pub=pub %}
{% endfor %}


