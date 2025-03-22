---
title: "Publications"
permalink: /publications/
layout: page
excerpt: ""
author_profile: true
---

# 📝 Publications

---

## 📰 Journal & Magazine Papers


<div id="travel-map" style="height: 0; width: 100%; margin: 20px 0; position: relative; z-index: 1; display: none;"></div>

{% assign journals = site.data.publications | where: "type", "Journal" %}
{% assign journals_sorted = journals | sort: "year" | reverse %}
{% assign current_year = "" %}
{% for pub in journals_sorted %}
  {% if pub.year != current_year %}
  <hr style="border: none; border-top: 1px solid #ddd; position: relative; margin: 2em 0;">
  <div style="position: relative; margin-top: -2.2em; text-align: right; font-size: 1.1em; color: #bbb;">
    {{ pub.year }}
  </div>
  {% assign current_year = pub.year %}
  {% endif %}
  {% include publication-entry.html pub=pub %}
{% endfor %}

---

## 🎤 Conference Papers

{% assign confs = site.data.publications | where: "type", "Conference" %}
{% assign confs_sorted = confs | sort: "year" | reverse %}
{% assign current_year = "" %}
{% for pub in confs_sorted %}
  {% if pub.year != current_year %}
  <hr style="border: none; border-top: 1px solid #ddd; position: relative; margin: 2em 0;">
  <div style="position: relative; margin-top: -2.2em; text-align: right; font-size: 1.1em; color: #bbb;">
    {{ pub.year }}
  </div>
  {% assign current_year = pub.year %}
  {% endif %}
  {% include publication-entry.html pub=pub %}
{% endfor %}
