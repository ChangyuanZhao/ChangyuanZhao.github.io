---
title: "Changyuan's CV"
permalink: /cv/
layout: page
excerpt: ""
author_profile: true
min_content_height: 800px  # 添加这一行
min_content_height_4k: 1200px # 4K显示器
---



# 📖 Educations
- *Nanyang Technological University, Singapore*  
**Ph.D., Aug. 2023 – Aug. 2026**  
◦ Supervised by Prof. Dusit Niyato

- *University of Chinese Academy of Sciences, Institute of Software, China* <br/>
**M.Eng., Sept. 2020 – Jun. 2023**  
◦ Supervised by Prof. Bai Xue

- *University of Science and Technology of China, China* <br/>
**B.Sc., Sept. 2016 – Jun. 2020**


# 📑 Research Experience
- *Sungkyunkwan University, South Korea*  
**Visiting Student, Mar. 2025 / May. 2026**  
◦ Supervised by Prof. Dong In Kim



## 🎖 Honors and Awards

<!-- ===== Per-award certificate toggle (drop-in block) ===== -->
<style>
  .cv-cert-btn {
    display: inline-block;
    margin-left: 0.4em;
    padding: 0.05em 0.55em;
    font-size: 0.75em;
    font-weight: 600;
    line-height: 1.5;
    vertical-align: middle;
    white-space: nowrap;
    color: #2f6f9f;
    background: #f5f8fa;
    border: 1px solid #d6e2ea;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  .cv-cert-btn:hover { background: #e8f0f6; }
  .cv-cert { display: block; margin-top: 0.4em; }
  .cv-cert[hidden] { display: none; }
</style>

<script>
(function () {
  var SHOW = '🖼️ show';
  var HIDE = '🖼️ hide';

  function makeButton(wrap) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cv-cert-btn';
    btn.textContent = SHOW;
    btn.addEventListener('click', function () {
      var open = wrap.hidden;
      wrap.hidden = !open;
      btn.textContent = open ? HIDE : SHOW;
    });
    return btn;
  }

  function initCerts() {
    var root = document.querySelector('.page__content') || document.querySelector('#main');
    if (!root) return;

    var imgs = root.querySelectorAll('li img');
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i];
      var node = img.parentNode;
      // if the image sits alone inside a link, move the whole link
      if (!(node && node.tagName === 'A' && node.childNodes.length === 1)) node = img;

      var parent = node.parentNode;

      // already wired up (spa.js re-runs inline scripts) -> just collapse again
      if (parent && parent.classList && parent.classList.contains('cv-cert')) {
        parent.hidden = true;
        var prev = parent.previousElementSibling;
        if (prev && prev.classList.contains('cv-cert-btn')) prev.textContent = SHOW;
        continue;
      }

      var wrap = document.createElement('span');
      wrap.className = 'cv-cert';
      wrap.hidden = true;
      parent.insertBefore(wrap, node);
      wrap.appendChild(node);
      parent.insertBefore(makeButton(wrap), wrap);
    }
  }

  initCerts();
  document.addEventListener('DOMContentLoaded', initCerts);
  window.addEventListener('load', initCerts);
  window.addEventListener('hashchange', function () { setTimeout(initCerts, 100); });
  window.addEventListener('popstate', function () { setTimeout(initCerts, 300); });
})();
</script>

- *2026.08* Chinese Government Award for Outstanding Self-financed Students Abroad (2025–2026), presented by the China Scholarship Council (CSC), with only 650 recipients selected worldwide each year
![BP_CAICE_2026](./images/csc.jpg)

- *2026.02* Best Paper Award in the *12th EAI International Conference on Industrial Networks and Intelligent Systems (EAI INISCOM 2026)* on Feb. 26-27, 2026, Da Nang City, Vietnam
![BP_CAICE_2026](./images/BP/ICINIS.png)

- *2026.01* Best Paper Award in the *5th International Conference on Computer, Artificial Intelligence and Control Engineering (CAICE 2026)* on Jan. 23-25, 2026, Hangzhou, China
![BP_CAICE_2026](./images/BP/CAICE_2026.jpg)

- *2025.12* Exemplary Reviewer, *IEEE Transactions on Network Science and Engineering (TNSE)*, 2025
![Reviewer_tnse](./images/tnse_2025.png)

- *2025.12* Winner in *Signal Processing and Computing for Communications (SPCC) TC Student Challenge and Video Contest* – 2025
![SPCC_winner](./images/Spcc.png)


- *2025.05* Best Paper Award in the *IWCMC 2025 Conference* on 12–16 May 2025, Marriott Hotel Downtown, Abu Dhabi, UAE
![Best Paper Award](./images/iwcmc2025.jpg)


- *2024.11* One project received an Honorable Mention in the 2024 ComSoc Student Competition *"Communications Technology Changing the World"*, ranking among the top 16 out of 93 submissions.
![comsoc_2024](./images/comsoc.png)

- *2024* One project received a second silver award in the 2024 SocMeta IEEE ComSoc SNTC Student Competition.
- *2022* China National Scholarship



<div style="min-height: 600px;"></div>

