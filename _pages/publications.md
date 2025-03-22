---
title: "Publications"
permalink: /publications/
layout: default  
excerpt: ""
author_profile: true
---

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

    <div style="margin-top: 0.3em;">
      {% assign display_limit = 7 %}
      {% assign total = pub.authors | size %}
      {% for author in pub.authors limit: display_limit %}
        {{ author }}{% if forloop.last == false %}, {% endif %}
      {% endfor %}
      {% if total > display_limit %}
        and <span style="color: gray;">{{ total | minus: display_limit }} more</span>
      {% endif %}
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
