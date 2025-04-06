const loadComplete = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const diagonal = Math.sqrt(width ** 2 + height ** 2);
    const circle = document.querySelector('.circle');

    const deriveScale = diagonal / circle.scrollWidth;
    circle.style.transform = `scale(${deriveScale})`;
}
window.addEventListener('DOMContentLoaded', loadComplete);