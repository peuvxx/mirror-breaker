const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');
const cursor = document.getElementById('cursor-hammer');
const hammers = Array.from(document.querySelectorAll('#hammers img'));
const frame = document.getElementById('frame-wrapper');
const svgTextWrapper = document.getElementById('svg-text-wrapper');

let currentHammerIndex = 0;
let hitCount = 0;
let breakThreshold = getRandomThreshold();



// 캠 시작
navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: 'user'
  },
  audio: false
}).then(stream => {
  video.srcObject = stream;
  video.onloadedmetadata = () => {
    video.play();

    // face-api.js 모델 로딩 후 얼굴 추적 시작
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models')
    ]).then(startFaceDetection);
  };
}).catch(err => {
  alert("카메라 접근이 불가능합니다: " + err.message);
});

// 캔버스 크기 맞추기
function resizeCanvas() {
  overlay.width = window.innerWidth;
  overlay.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// 망치 따라다니기
document.addEventListener('mousemove', e => {
  cursor.style.left = `${e.pageX - 50}px`;
  cursor.style.top = `${e.pageY - 50}px`;
});

// 망치 클릭
document.addEventListener('click', e => {
  const x = e.pageX;
  const y = e.pageY;
  drawCrack(x, y);

  cursor.classList.add('hammer-hit-animation');
  setTimeout(() => cursor.classList.remove('hammer-hit-animation'), 300);

  hitCount++;
  if (hitCount >= breakThreshold) {
    breakReality();
    hitCount = 0;
    breakThreshold = getRandomThreshold();
  }
});

function drawCrack(x, y) {
    const maxDepth = 2; // 더 짧게
    const startCount = Math.floor(Math.random() * 4) + 5; // 5~8줄
  
    function drawBranch(startX, startY, depth, angle) {
      if (depth > maxDepth) return;
  
      const length = 30 + Math.random() * 40; // 30~70px
      const endX = startX + Math.cos(angle) * length;
      const endY = startY + Math.sin(angle) * length;
  
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
  
      // 분기: 최대 1~2개만
      const branches = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < branches; i++) {
        const newAngle = angle + (Math.random() - 0.5) * Math.PI / 2.5;
        drawBranch(endX, endY, depth + 1, newAngle);
      }
    }
  
    for (let i = 0; i < startCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      drawBranch(x, y, 0, angle);
    }
  }
  
function getRandomThreshold() {
  return Math.floor(Math.random() * 6) + 3;
}

// Enter 누르면 리셋
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') ctx.clearRect(0, 0, overlay.width, overlay.height);
});
document.addEventListener('keydown', e => {
  if (e.code === 'Space') nextHammer();
});

function nextHammer() {
  currentHammerIndex = (currentHammerIndex + 1) % hammers.length;
  cursor.src = hammers[currentHammerIndex].src;
}
function prevHammer() {
  currentHammerIndex = (currentHammerIndex - 1 + hammers.length) % hammers.length;
  cursor.src = hammers[currentHammerIndex].src;
}

function breakReality() {
  const wrapper = document.getElementById('cam-wrapper');
  const captured = captureFrame(video);
  const shardCount = Math.floor(Math.random() * 20) + 20;

  frame.style.display = 'none';
  if (svgTextWrapper) svgTextWrapper.style.display = 'none';
  video.style.display = 'none';

  for (let i = 0; i < shardCount; i++) {
    const shard = document.createElement('canvas');
    shard.width = window.innerWidth;
    shard.height = window.innerHeight;
    shard.className = 'shard-canvas';
    shard.style.position = 'absolute';
    shard.style.left = '0';
    shard.style.top = '0';
    shard.style.zIndex = 100;

    const shardCtx = shard.getContext('2d');
    const centerX = Math.random() * window.innerWidth;
    const centerY = Math.random() * window.innerHeight;
    const sides = 3 + Math.floor(Math.random() * 4);
    const angleStart = Math.random() * Math.PI * 2;

    shardCtx.beginPath();
    for (let j = 0; j <= sides; j++) {
      const angle = angleStart + j * (2 * Math.PI / sides);
      const radius = 100 + Math.random() * 150;
      const px = centerX + Math.cos(angle) * radius;
      const py = centerY + Math.sin(angle) * radius;
      if (j === 0) shardCtx.moveTo(px, py);
      else shardCtx.lineTo(px, py);
    }
    shardCtx.closePath();
    shardCtx.clip();

    const img = new Image();
    img.onload = () => shardCtx.drawImage(img, 0, 0, shard.width, shard.height);
    img.src = captured;

    wrapper.appendChild(shard);

    setTimeout(() => {
      shard.style.transition = 'transform 2.8s ease, opacity 2.8s ease';
      shard.style.transform = `translateY(${1000 + Math.random() * 800}px)`;
      shard.style.opacity = 0;
    }, 50);
  }

  setTimeout(() => {
    if (svgTextWrapper) svgTextWrapper.style.display = 'flex';
  }, 100);

  setTimeout(() => {
    document.querySelectorAll('.shard-canvas').forEach(c => c.remove());
    video.style.display = 'block';
    if (frame) frame.style.display = 'block';
    if (svgTextWrapper) svgTextWrapper.style.display = 'none';
    ctx.clearRect(0, 0, overlay.width, overlay.height);
  }, 8000);
}

function captureFrame(video) {
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg');
}

// 얼굴 방향 감지
function startFaceDetection() {
  setInterval(async () => {
    if (video.readyState < 2) return;

    const result = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks(true);
    if (!result) return;

    const noseX = result.landmarks.getNose()[3].x;
    const leftX = result.landmarks.getLeftEye()[0].x;
    const rightX = result.landmarks.getRightEye()[3].x;
    const center = (leftX + rightX) / 2;
    const offset = noseX - center;

    if (offset > 20) nextHammer();
    else if (offset < -20) prevHammer();
  }, 1500);
}

