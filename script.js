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



// 👇 캠 시작
navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: 'user'
    }
  }).then(stream => {
    video.srcObject = stream;
  
    // 👉 얼굴 추적은 캠 시작 후 시작되게
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models')
    ]).then(startFaceDetection);
  });
  

// 👇 캔버스 사이즈 맞추기
function resizeCanvas() {
  overlay.width = window.innerWidth;
  overlay.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// 👇 망치 따라다니기
document.addEventListener('mousemove', e => {
  cursor.style.left = `${e.pageX - 50}px`;
  cursor.style.top = `${e.pageY - 50}px`;
});

// 👇 깨짐 효과
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
  const crackCount = Math.floor(Math.random() * 10) + 3;
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

function getRandomThreshold() {
  return Math.floor(Math.random() * 6) + 3;
}

// 👇 캔버스 리셋 (Enter 키)
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') ctx.clearRect(0, 0, overlay.width, overlay.height);
});

// 👇 망치 바꾸기 (스페이스)
document.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    nextHammer();
  }
});

function nextHammer() {
  currentHammerIndex = (currentHammerIndex + 1) % hammers.length;
  cursor.src = hammers[currentHammerIndex].src;
}
function prevHammer() {
  currentHammerIndex = (currentHammerIndex - 1 + hammers.length) % hammers.length;
  cursor.src = hammers[currentHammerIndex].src;
}

// 👇 캠 깨짐 효과
function breakReality() {
  const wrapper = document.getElementById('cam-wrapper');
  const captured = captureFrame(video);
  const shardCount = Math.floor(Math.random() * 20) + 20;

  // 프레임, 텍스트 숨기기
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
      const dy = 1000 + Math.random() * 800;
      shard.style.transform = `translateY(${dy}px)`;
      shard.style.opacity = 0;
    }, 50);
  }

  // 텍스트 SVG 나타내기
  setTimeout(() => {
    if (svgTextWrapper) svgTextWrapper.style.display = 'flex';
  }, 100);

  // 복구
  setTimeout(() => {
    document.querySelectorAll('.shard-canvas').forEach(c => c.remove());
    video.style.display = 'block';
    if (frame) frame.style.display = 'block';
    if (svgTextWrapper) svgTextWrapper.style.display = 'none';
    ctx.clearRect(0, 0, overlay.width, overlay.height);
  }, 8000);
}

// 👇 프레임 캡쳐
function captureFrame(video) {
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg');
}

// 👇 얼굴 방향 감지 (face-api.js 필요)
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models')
]).then(startFaceDetection);

function startFaceDetection() {
  setInterval(async () => {
    const result = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks(true);
    if (!result) return;

    const landmarks = result.landmarks;
    const nose = landmarks.getNose();
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    const noseX = nose[3].x;
    const leftX = leftEye[0].x;
    const rightX = rightEye[3].x;
    const faceCenter = (leftX + rightX) / 2;

    const offset = noseX - faceCenter;

    if (offset > 20) {
      nextHammer();
    } else if (offset < -20) {
      prevHammer();
    }
  }, 1500); // 1.5초마다 체크
}
