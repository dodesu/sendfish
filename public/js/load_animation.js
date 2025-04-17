const loadComplete = () => {
    const loader = document.querySelector('#loader');
    const width = window.innerWidth;
    const height = window.innerHeight;
    const diagonal = Math.sqrt(width ** 2 + height ** 2);
    const circle = document.querySelector('.circle');

    const deriveScale = diagonal / circle.scrollWidth;
    circle.style.transform = `scale(${deriveScale})`;
    setTimeout(() => { loader.remove() }, 1000);
}
loadComplete();