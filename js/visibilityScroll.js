const visibilitySection = document.getElementById("visibility");
const clouds = document.querySelectorAll("#visibility .cloud-layer");

function animateClouds() {
    const time = Date.now() * 0.002;

    const sectionTop = visibilitySection.getBoundingClientRect().top;

    function getOpacity(distance, maxDistance = 300) {
        let t = Math.min(Math.abs(distance) / maxDistance, 1);
        return t + 0.3; 
    }

    const speed0 = 1.2; 
    clouds[0].style.transform = `translate(${ -sectionTop * speed0 }px, ${ Math.sin(time) * 10 }px)`;
    clouds[0].style.opacity = getOpacity(-sectionTop * speed0 *0.5);

    const speed1 = 0.7;
    clouds[1].style.transform = `translate(${ sectionTop * speed1 }px, ${ Math.sin(time + 1) * 15 }px)`;
    clouds[1].style.opacity = getOpacity(-sectionTop * speed1 *0.5);

    const speed2 = 0.4;
    clouds[2].style.transform = `translate(${ -sectionTop * speed2 }px, ${ Math.sin(time + 2) * 8 }px)`;
    clouds[2].style.opacity = getOpacity(-sectionTop * speed2 *0.5);

    requestAnimationFrame(animateClouds);
}

animateClouds();

function checkVisibility() {
    const sectionTop = visibilitySection.getBoundingClientRect().top;
    const triggerPoint = window.innerHeight * 0.75;

    if (sectionTop < triggerPoint) {
        visibilitySection.classList.add("visible");
    }
}

window.addEventListener("scroll", checkVisibility);
window.addEventListener("load", checkVisibility);
