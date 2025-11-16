const scrollToTop = document.getElementById("scrollToTop");

window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        scrollToTop.style.display = 'flex';
    } else {
        scrollToTop.style.display = 'none';
    }
});

scrollToTop.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});
