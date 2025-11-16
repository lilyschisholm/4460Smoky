const fishSection = document.querySelector("#biodiversity");
const fishContainer = document.querySelector(".fish-animation");

let lastScrollY = window.scrollY;
let offsetX = 0;
let isVisible = false;

const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      isVisible = entry.isIntersecting;
    });
  },
  { threshold: 0.1 }
);

observer.observe(fishSection);

function handleScroll() {
  if (!isVisible) return;

  const currentY = window.scrollY;
  const deltaY = currentY - lastScrollY;

  offsetX -= deltaY * .4;
  fishContainer.style.transform = `translateX(${offsetX}px)`;

  lastScrollY = currentY;
}

window.addEventListener("scroll", handleScroll);
