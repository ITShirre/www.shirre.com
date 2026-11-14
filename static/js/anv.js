(function(){
  var videos=document.querySelectorAll("#an-antenna video.anv-video");
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
  function isAudible(v){
    return !v.muted && v.volume>0;
  }
  function setSoundUI(btn,on){
    if(!btn)return;
    btn.setAttribute("aria-pressed",on?"true":"false");
    btn.setAttribute("aria-label",on?"Sound on":"Sound off");
    var t=btn.querySelector(".anv-sound-text");
    if(t)t.textContent=on?"Sound on":"Sound off";
  }

  for(var i=0;i<videos.length;i++){
    (function(v){
      var card=v.closest(".anv-videocard")||v.parentElement;
      var btn=card?card.querySelector(".anv-sound"):null;
      /* True while muted autoplay (or in-view autoplay) is driving playback.
         Used only to decide whether "Sound on" should restart from the start.
         Not written to storage — nothing is remembered across pages. */
      var autoplaying=false;

      v.muted=true;
      v.defaultMuted=true;
      v.setAttribute("playsinline","");
      v.playsInline=true;
      setSoundUI(btn,false);

      if(btn){
        btn.addEventListener("click",function(){
          var turnOn=!isAudible(v);
          if(turnOn){
            if(autoplaying&&!v.paused){
              try{v.currentTime=0;}catch(e){}
            }
            v.muted=false;
            if(v.volume===0)v.volume=1;
            tryPlay(v);
          }else{
            v.muted=true;
          }
          setSoundUI(btn,turnOn);
        });
      }

      /* Keep the overlay in sync if the visitor uses the native volume / mute control. */
      v.addEventListener("volumechange",function(){
        setSoundUI(btn,isAudible(v));
      });

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
          if(en.isIntersecting&&en.intersectionRatio>=0.35){
            autoplaying=!isAudible(v);
            tryPlay(v);
          }else{
            v.pause();
          }
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
  var lb=document.querySelector("#an-antenna .anv-lb, .anv-lb");
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

  var zooms=document.querySelectorAll("#an-antenna a.anv-zoom");
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
