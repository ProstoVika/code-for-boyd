(function () {
    const canvas = document.getElementById("dotCanvas");
    const ctx = canvas.getContext("2d");
    let particles = [];
    let animId = null;


    let mouse = { x: null, y: null, radius: 30 };
    canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    canvas.addEventListener("mouseleave", () => {
        mouse.x = null;
        mouse.y = null;
    });

    function fitCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    fitCanvas();
    window.addEventListener("resize", () => {
        fitCanvas();
        if (currentImage) buildParticlesFromImage(currentImage);
    });

    let currentImage = null;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "https://boydparker.blog/wp-content/uploads/2025/08/crop_logo-removebg-preview.png";

    img.onload = () => {
        currentImage = img;
        buildParticlesFromImage(img);
        start();
    };

    img.onerror = () => {
        console.warn("Check your URL.");
    };

    function buildParticlesFromImage(image) {
        particles = [];

        const maxW = Math.min(Math.floor(window.innerWidth * 0.5), 600);
        const scale = maxW / image.width;
        const drawW = Math.max(120, Math.floor(image.width * scale));
        const drawH = Math.max(120, Math.floor(image.height * scale));
        const startX = Math.floor((canvas.clientWidth - drawW) / 2);
        const startY = Math.floor((canvas.clientHeight - drawH) / 2);

        const off = document.createElement("canvas");
        off.width = drawW;
        off.height = drawH;
        const octx = off.getContext("2d", { willReadFrequently: true });
        octx.drawImage(image, 0, 0, drawW, drawH);

        let imgData;
        try {
            imgData = octx.getImageData(0, 0, drawW, drawH);
        } catch (e) {
            console.error("CORS блокує getImageData.", e);
            return;
        }

        const data = imgData.data;
        const step = 3;
        for (let y = 0; y < drawH; y += step) {
            for (let x = 0; x < drawW; x += step) {
                const idx = (y * drawW + x) * 4;
                const a = data[idx + 3];
                if (a > 128) {
                    const r = data[idx];
                    const g = data[idx + 1];
                    const b = data[idx + 2];
                    particles.push({
                        x: Math.random() * canvas.clientWidth,
                        y: Math.random() * canvas.clientHeight,
                        targetX: startX + x,
                        targetY: startY + y,
                        size: 1.4,
                        color: `rgb(${r},${g},${b})`,
                        ease: 0.06 + Math.random() * 0.03
                    });
                }
            }
        }
    }

    function start() {
        if (animId) cancelAnimationFrame(animId);
        animate();
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];


            if (mouse.x !== null && mouse.y !== null) {
                const dx = p.x - mouse.x;
                const dy = p.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < mouse.radius) {
                    // відштовхуємо
                    const angle = Math.atan2(dy, dx);
                    const force = (mouse.radius - dist) / mouse.radius;
                    const moveX = Math.cos(angle) * force * 8;
                    const moveY = Math.sin(angle) * force * 8;
                    p.x += moveX;
                    p.y += moveY;
                }
            }

            p.x += (p.targetX - p.x) * p.ease;
            p.y += (p.targetY - p.y) * p.ease;

            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        animId = requestAnimationFrame(animate);
    }
})();
