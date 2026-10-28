(() => {
  const canvas = document.getElementById("vero-animation-bg");
  if (!canvas) {
    console.error("Canvas #vero-animation-bg não foi encontrado no HTML.");
    return;
  }

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  console.log("Animação Vero iniciada com sucesso.");

  let width = 0;
  let height = 0;
  let dpr = 1;
  let raf = 0;

  // Pontos de cor (blobs) com cores da Vero
  const blobs = [
    { color: [245, 166, 35], x: 0.16, y: 0.37, rx: 0.38, ry: 0.38, speed: 0.00045, phase: 0.3 },
    { color: [105, 91, 205], x: 0.79, y: 0.31, rx: 0.35, ry: 0.38, speed: 0.00035, phase: 2.4 },
    { color: [244, 151, 39], x: 0.72, y: 0.82, rx: 0.32, ry: 0.30, speed: 0.00040, phase: 4.5 },
    { color: [65, 76, 158], x: 0.34, y: 0.78, rx: 0.35, ry: 0.30, speed: 0.00032, phase: 5.6 }
  ];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function paintBlob(blob, t) {
    const driftX = Math.sin(t * blob.speed + blob.phase) * width * 0.15;
    const driftY = Math.cos(t * blob.speed * 0.82 + blob.phase) * height * 0.18;
    const breathe = 1 + Math.sin(t * blob.speed * 1.7 + blob.phase) * 0.18;
    const x = blob.x * width + driftX;
    const y = blob.y * height + driftY;
    const radius = Math.max(width, height) * blob.rx * breathe;
    const radiusY = Math.max(width, height) * blob.ry * breathe;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, radiusY / radius);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    const [r, green, b] = blob.color;
    // Opacidades aumentadas para maior visibilidade
    g.addColorStop(0, `rgba(${r},${green},${b},0.35)`);
    g.addColorStop(0.35, `rgba(${r},${green},${b},0.18)`);
    g.addColorStop(1, `rgba(${r},${green},${b},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawRibbon(t, color, phase, direction, thickness) {
    const scale = Math.min(width, height);
    const yBase = height * (0.48 + Math.sin(t * 0.00035 + phase) * 0.14);
    const amp = height * 0.18;
    const drift = Math.sin(t * 0.00045 + phase) * width * 0.12;

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const gradient = ctx.createLinearGradient(
      width * 0.08 + drift, yBase - amp,
      width * 0.92 - drift, yBase + amp
    );
    gradient.addColorStop(0, `rgba(${color},0)`);
    gradient.addColorStop(0.2, `rgba(${color},0.1)`);
    gradient.addColorStop(0.5, `rgba(${color},0.35)`);
    gradient.addColorStop(0.7, `rgba(${color},0.15)`);
    gradient.addColorStop(1, `rgba(${color},0)`);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = scale * thickness;
    ctx.shadowBlur = scale * 0.05;
    ctx.shadowColor = `rgba(${color},0.3)`;
    ctx.beginPath();
    ctx.moveTo(-width * 0.1, yBase + Math.sin(t * 0.0005 + phase) * amp);
    ctx.bezierCurveTo(
      width * 0.24, yBase - amp * direction + Math.sin(t * 0.00035 + phase) * amp * 0.5,
      width * 0.62, yBase + amp * direction + Math.cos(t * 0.0003 + phase) * amp * 0.55,
      width * 1.1, yBase + Math.cos(t * 0.00045 + phase) * amp
    );
    ctx.stroke();
    ctx.restore();
  }

  function draw(t) {
    ctx.clearRect(0, 0, width, height);

    // Gradientes de fundo
    blobs.forEach(blob => paintBlob(blob, t));

    // Linhas de luz fluidas
    drawRibbon(t, "245,166,35", 0.6, 1, 0.09);
    drawRibbon(t + 1800, "113,103,218", 2.8, -1, 0.075);

    // Partículas e pontos de luz
    const points = [
      { phase: 0.2, color: "255,205,112", radius: 2.8 },
      { phase: 3.1, color: "166,157,255", radius: 2.2 },
      { phase: 4.7, color: "245,166,35", radius: 2.0 }
    ];
    points.forEach((p, i) => {
      const x = width * (0.5 + 0.36 * Math.sin(t * (0.00035 + i * 0.00003) + p.phase));
      const y = height * (0.5 + 0.3 * Math.cos(t * 0.0003 + p.phase * 1.7));
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 26);
      glow.addColorStop(0, `rgba(${p.color},0.6)`);
      glow.addColorStop(1, `rgba(${p.color},0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, 26, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(${p.color},0.9)`;
      ctx.beginPath();
      ctx.arc(x, y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    raf = requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(draw);
    }
  });

  resize();
  raf = requestAnimationFrame(draw);
})();