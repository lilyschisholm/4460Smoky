const waterSection = document.querySelector('.water-section');

let cursorX = 0;
let cursorY = 0;
let spawnActive = false;

waterSection.addEventListener('mousemove', (e) => {
    const rect = waterSection.getBoundingClientRect();
    cursorX = e.clientX - rect.left;
    cursorY = e.clientY - rect.top;
});

function spawnAcidDrop() {
    if (!spawnActive) return;

    const drop = document.createElement('img');
    drop.src = 'sprites/acid.png';
    drop.classList.add('acid-drop');

    drop.style.left = `${cursorX}px`;
    drop.style.top = `${cursorY}px`;

    const duration = 3 + Math.random() * 2; 
    drop.style.animationDuration = `${duration}s`;

    waterSection.appendChild(drop);

    drop.addEventListener('animationend', () => drop.remove());

    const nextInterval = 1000 + Math.random() * 200;
    setTimeout(spawnAcidDrop, nextInterval);
}

waterSection.addEventListener('mouseenter', () => {
    spawnActive = true;
    spawnAcidDrop();
});

waterSection.addEventListener('mouseleave', () => {
    spawnActive = false;
});
