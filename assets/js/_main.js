/* ==========================================================================
   jQuery plugin settings and other scripts
   ========================================================================== */

$(document).ready(function () {
  // 📌 加载 citation 引用数函数
  function loadCitation() {
    const span = document.getElementById("total_cit");
    if (!span) return;

    fetch("/assets/json/citations.json")
      .then(res => res.json())
      .then(data => {
        span.textContent = data.citedby || "—";
      })
      .catch(err => {
        console.error("Citation load error:", err);
        span.textContent = "N/A";
      });
  }

  // ✅ 首次加载就执行一次
  loadCitation();

  // ✅ 提供给外部 window 用于 SPA 页面切换后调用
  window.loadCitation = loadCitation;

  // Sticky footer
  var bumpIt = function () {
      $("body").css("margin-bottom", $(".page__footer").outerHeight(true));
    },
    didResize = false;

  bumpIt();

  $(window).resize(function () {
    didResize = true;
  });

  setInterval(function () {
    if (didResize) {
      didResize = false;
      bumpIt();
    }
  }, 250);

  // FitVids init
  $("#main").fitVids();

  // init sticky sidebar
  $(".sticky").Stickyfill();

  var stickySideBar = function () {
    var show =
      $(".author__urls-wrapper button").length === 0
        ? $(window).width() > 925
        : !$(".author__urls-wrapper button").is(":visible");

    if (show) {
      Stickyfill.rebuild();
      Stickyfill.init();
      $(".author__urls").show();
    } else {
      Stickyfill.stop();
      $(".author__urls").hide();
    }
  };

  stickySideBar();

  $(window).resize(function () {
    stickySideBar();
  });

  // Follow menu drop down
  $(".author__urls-wrapper button").on("click", function () {
    $(".author__urls").fadeToggle("fast", function () {});
    $(".author__urls-wrapper button").toggleClass("open");
  });

  // init smooth scroll
  $("a").smoothScroll({ offset: -20 });

  // add lightbox class to all image links
  $("a[href$='.jpg'],a[href$='.jpeg'],a[href$='.JPG'],a[href$='.png'],a[href$='.gif']").addClass("image-popup");

  // Magnific-Popup options
  $(".image-popup").magnificPopup({
    type: "image",
    tLoading: "Loading image #%curr%...",
    gallery: {
      enabled: true,
      navigateByImgClick: true,
      preload: [0, 1],
    },
    image: {
      tError: '<a href="%url%">Image #%curr%</a> could not be loaded.',
    },
    removalDelay: 500,
    mainClass: "mfp-zoom-in",
    callbacks: {
      beforeOpen: function () {
        this.st.image.markup = this.st.image.markup.replace("mfp-figure", "mfp-figure mfp-with-anim");
      },
    },
    closeOnContentClick: true,
    midClick: true,
  });
});
