const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');
const cursor = document.getElementById('cursor-hammer');
const hammers = Array.from(document.querySelectorAll('#hammers img'));

let currentHammerIndex = 0;

// 캠 시작
navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
  video.srcObject = stream;
});

// 캔버스 사이즈 맞추기
function resizeCanvas() {
  overlay.width = window.innerWidth;
  overlay.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// 마우스 따라다니는 망치
document.addEventListener('mousemove', (e) => {
  cursor.style.left = `${e.pageX - 50}px`;
  cursor.style.top = `${e.pageY - 50}px`;
});

// 스페이스바 누르면 망치 바꾸기
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    currentHammerIndex = (currentHammerIndex + 1) % hammers.length;
    cursor.src = hammers[currentHammerIndex].src;
  }
});

// 엔터 누르면 캔버스 리셋
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    ctx.clearRect(0, 0, overlay.width, overlay.height);
  }
});

// 클릭하면 깨짐 + 애니메이션 + 붕괴 조건 체크
document.addEventListener('click', (e) => {
  const x = e.pageX;
  const y = e.pageY;

  drawCrack(x, y);

  cursor.classList.add('hammer-hit-animation');
  setTimeout(() => {
    cursor.classList.remove('hammer-hit-animation');
  }, 300);

  hitCount++;
  if (hitCount >= breakThreshold) {
    breakReality();
    hitCount = 0;
    breakThreshold = getRandomThreshold();
  }
});

// 깨짐 그래픽 그리기
function drawCrack(x, y) {
  const crackCount = Math.floor(Math.random() * 10) + 3; // 3~12개

  for (let i = 0; i < crackCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const length = 50 + Math.pow(Math.random(), 0.5) * 450;

    const curveOffset = 90;
    const controlX = x + Math.cos(angle) * (length / 2) + (Math.random() * curveOffset - curveOffset / 2);
    const controlY = y + Math.sin(angle) * (length / 2) + (Math.random() * curveOffset - curveOffset / 2);

    const endX = x + Math.cos(angle) * length;
    const endY = y + Math.sin(angle) * length;

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2 + Math.random() * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(controlX, controlY, endX, endY);
    ctx.stroke();
  }
}

// ===========================
// 캠 붕괴 효과 (불규칙 파편)
// ===========================

let hitCount = 0;
let breakThreshold = getRandomThreshold();

function getRandomThreshold() {
  return Math.floor(Math.random() * 6) + 3; // 3~8번 클릭
}

function breakReality() {
    const wrapper = document.getElementById('cam-wrapper');
    const captured = captureFrame(video);
    const shardCount = Math.floor(Math.random() * 6) + 3; // 3~8 조각
  
    video.style.display = 'none';
  
    for (let i = 0; i < shardCount; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.className = 'shard-canvas';
      const shardCtx = canvas.getContext('2d');
  
      // 먼저 조각의 위치를 정하고
      const offsetX = Math.random() * (window.innerWidth - canvas.width);
      const offsetY = Math.random() * (window.innerHeight - canvas.height);
  
      canvas.style.position = 'absolute';
      canvas.style.left = `${offsetX}px`;
      canvas.style.top = `${offsetY}px`;
      canvas.style.zIndex = 100;
  
      // 랜덤 다각형 경로 생성
      const centerX = canvas.width / 2 + (Math.random() - 0.5) * 200;
      const centerY = canvas.height / 2 + (Math.random() - 0.5) * 200;
      const sides = 3 + Math.floor(Math.random() * 4); // 3~6각형
      const angleStart = Math.random() * Math.PI * 2;
  
      shardCtx.beginPath();
      for (let j = 0; j <= sides; j++) {
        const angle = angleStart + j * (2 * Math.PI / sides);
        const radius = 400 + Math.random() * 200;
        const px = centerX + Math.cos(angle) * radius;
        const py = centerY + Math.sin(angle) * radius;
        if (j === 0) shardCtx.moveTo(px, py);
        else shardCtx.lineTo(px, py);
      }
      shardCtx.closePath();
      shardCtx.clip();
  
      // 이미지 생성 후, 위치 보정하여 그리기
      const img = new Image();
      img.onload = () => {
        shardCtx.drawImage(img, -offsetX, -offsetY, canvas.width, canvas.height);
      };
      img.src = captured;
  
      // 떨어지는 애니메이션
      setTimeout(() => {
        canvas.style.transition = 'transform 1.2s ease, opacity 1.2s ease';
        const dy = 1000 + Math.random() * 500;
        canvas.style.transform = `translate(0px, ${dy}px)`;
        canvas.style.opacity = 0;
      }, 50);
  
      wrapper.appendChild(canvas);
    }
  
    setTimeout(() => {
      document.querySelectorAll('.shard-canvas').forEach(c => c.remove());
      video.style.display = 'block';
    }, 5000);
  }
  
  

function captureFrame(video) {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  return canvas.toDataURL('image/jpeg');
}
