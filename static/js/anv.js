(function(){
  var videos=document.querySelectorAll("video.anv-video");
  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function pauseAll(){
    for(var i=0;i<videos.length;i++){
      try{videos[i].pause();}catch(e){}
    }
  }
  function tryPlay(v){
    var p=v.play();
    if(p&&p.catch)p.catch(function(){});
  }

  for(var i=0;i<videos.length;i++){
    (function(v){
      v.muted=true;
      v.defaultMuted=true;
      v.setAttribute("playsinline","");
      v.playsInline=true;
      if(reduce){
        v.removeAttribute("autoplay");
        try{v.pause();}catch(e){}
        return;
      }
      if(!("IntersectionObserver" in window))return;
      v.removeAttribute("autoplay");
      var io=new IntersectionObserver(function(entries){
        for(var j=0;j<entries.length;j++){
          var en=entries[j];
          if(en.isIntersecting&&en.intersectionRatio>=0.35)tryPlay(v);
          else v.pause();
        }
      },{threshold:[0,0.35,1]});
      io.observe(v);
    })(videos[i]);
  }

  var panel=document.getElementById("an-antenna");
  if(panel&&"MutationObserver" in window){
    new MutationObserver(function(){
      if(panel.hasAttribute("hidden"))pauseAll();
    }).observe(panel,{attributes:true,attributeFilter:["hidden"]});
  }

  /* Click-to-enlarge for the product photos */
  var lb=document.querySelector(".anv-lb");
  if(!lb)return;
  var lbImg=lb.querySelector("img");
  var lbCap=lb.querySelector(".anv-lb-cap");
  var lastFocus=null;

  function closeLb(){
    lb.setAttribute("hidden","");
    lbImg.removeAttribute("src");
    if(lastFocus&&lastFocus.focus)try{lastFocus.focus();}catch(e){}
    document.removeEventListener("keydown",onKey);
  }
  function openLb(href,caption,alt){
    lastFocus=document.activeElement;
    lbImg.src=href;
    lbImg.alt=alt||"";
    if(lbCap)lbCap.textContent=caption||"";
    lb.removeAttribute("hidden");
    var closeBtn=lb.querySelector(".anv-lb-close");
    if(closeBtn)closeBtn.focus();
    document.addEventListener("keydown",onKey);
  }
  function onKey(e){
    if(e.key==="Escape"){e.preventDefault();closeLb();}
  }

  var zooms=document.querySelectorAll("a.anv-zoom");
  for(var z=0;z<zooms.length;z++){
    zooms[z].addEventListener("click",function(e){
      e.preventDefault();
      var img=this.querySelector("img");
      openLb(this.getAttribute("href"), this.getAttribute("data-anv-caption")||"", img?img.getAttribute("alt"):"");
    });
  }
  var closeBtn=lb.querySelector(".anv-lb-close");
  if(closeBtn)closeBtn.addEventListener("click",closeLb);
  lb.addEventListener("click",function(e){
    if(e.target===lb)closeLb();
  });
})();
