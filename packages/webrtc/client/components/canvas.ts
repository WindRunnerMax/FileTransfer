export const drawingBackdrop = () => {
  const canvas = document.createElement("canvas");
  document.body.appendChild(canvas);
  const style = canvas.style;
  style.width = "100%";
  style.position = "absolute";
  style.zIndex = "-1";
  style.top = "0";
  style.left = "0";
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let x: number, y: number, width: number, height: number, degree: number;

  const initCanvas = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    const offset = 135;
    x = width / 2;
    y = height - offset;
    degree = Math.max(width, height, 1000) / 13;
    drawCircles();
  };

  window.addEventListener("resize", initCanvas);

  const drawCircle = (radius: number) => {
    ctx.beginPath();
    const color = Math.round(255 * (1 - radius / Math.max(width, height)));
    ctx.strokeStyle = "rgba(" + color + "," + color + "," + color + ",0.1)";
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.lineWidth = 2;
  };

  let step = 0;
  const drawCircles = () => {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < 8; i++) {
      drawCircle(degree * i + (step % degree));
    }
    step = (step + 1) % Number.MAX_SAFE_INTEGER;
  };

  const drawingAnimation = () => {
    const handler = () => {
      drawCircles();
      drawingAnimation();
    };
    requestAnimationFrame(handler);
  };

  initCanvas();
  drawingAnimation();
};
