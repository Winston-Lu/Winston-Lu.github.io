"use strict";

(function() {
     let disableNavbarHiding = false;
     let scrollTimer = null;

     function scrollTo(id){
          const offset = document.getElementById('navbar').offsetHeight;
          const elementRect = document.getElementById(id).getBoundingClientRect().top;
          const elementPosition = elementRect - document.body.getBoundingClientRect().top;
          const offsetPosition = elementPosition - offset;
          disableNavbarHiding = true;
          window.scroll({
               top: offsetPosition,
               behavior: "smooth"
          });
          document.getElementById("checkbox_toggle").checked = false;
     }
     document.getElementById("top_scroll").addEventListener ("click", () => {
          window.scroll({
               top: 0,
               behavior: "smooth"
          });
          document.getElementById("checkbox_toggle").checked = false;
     }, false);
     document.getElementById("about_scroll").addEventListener ("click", () => {
          scrollTo("about_me");
     }, false);
     document.getElementById("summary_scroll").addEventListener ("click", () => {
          scrollTo("about_me");
     }, false);
     document.getElementById("skills_scroll").addEventListener ("click", () => {
          scrollTo("skillsTab");
     }, false);
     document.getElementById("exp_scroll").addEventListener ("click", () => {
          scrollTo("experienceTab");
     }, false);
     document.getElementById("footer").addEventListener ("click", () => {
          window.scroll({
               top: document.body.clientHeight,
               behavior: "smooth"
          });
          document.getElementById("checkbox_toggle").checked = false;
     }, false);
     
     window.addEventListener('scroll', function() {
          if(!disableNavbarHiding) return;
          if(scrollTimer !== null) {
               clearTimeout(scrollTimer);        
          }
          scrollTimer = setTimeout(function() {
               disableNavbarHiding = false;
          }, 150);
     }, false);

     document.getElementById("logo").addEventListener ("click", () => {
          document.getElementById("logo").classList.add('spin'); 
          setTimeout(() => {
               document.getElementById("logo").classList.remove('spin'); 
          },250);
     }, false);
     
     /* When the user scrolls down, hide the navbar. When the user scrolls up, show the navbar */
     let prevScrollpos = window.pageYOffset;
     window.onscroll = function() {
          if(disableNavbarHiding ) return;
          let currentScrollPos = window.pageYOffset;
          if(prevScrollpos == 0){
               prevScrollpos = currentScrollPos;
               return;
          }
          if (prevScrollpos >= currentScrollPos) {
               document.getElementById("navbar").style.top = "0";
          } else {
               document.getElementById("navbar").style.top = "-65px";
          }
          prevScrollpos = currentScrollPos;
     } 
})();
