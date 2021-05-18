function scrollSmoothTo(elementId) {
    const offset = document.getElementById('navbar').offsetHeight;
    const elementRect = document.getElementById(elementId).getBoundingClientRect().top;
    const elementPosition = elementRect - document.body.getBoundingClientRect().top;
    const offsetPosition = elementPosition - offset;
    window.scrollTo({
         top: offsetPosition,
         behavior: "smooth"
    });
  }