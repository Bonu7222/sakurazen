const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreEl = document.getElementById('final-score');

let width = canvas.width;
let height = canvas.height;

let isPlaying = false;
let score = 0;
let lives = 3;
let frame = 0;
let gameSpeed = 1;

const basket = {
    x: width / 2,
    y: height - 80,
    width: 100,
    height: 50,
    targetX: width / 2
};

let petals = [];
let branches = [];
let particles = [];

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playChime() {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
}

function playThud() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
}

class Petal {
    constructor() {
        this.x = Math.random() * width;
        this.y = -20;
        this.size = Math.random() * 10 + 8;
        this.speedY = Math.random() * 2 + 2;
        this.speedX = Math.random() * 2 - 1;
        this.angle = Math.random() * Math.PI * 2;
        this.spin = Math.random() * 0.05 - 0.025;
        this.swing = Math.random() * 2;
        this.color = Math.random() > 0.5 ? '#ffb7c5' : '#ffc0cb';
    }
    update() {
        this.y += this.speedY;
        this.x += Math.sin(this.y * 0.02) * this.swing + this.speedX;
        this.angle += this.spin;
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size, this.size / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Branch {
    constructor() {
        this.x = Math.random() * width;
        this.y = -30;
        this.width = Math.random() * 40 + 30;
        this.height = Math.random() * 20 + 15;
        this.speedY = Math.random() * 2 + 3;
        this.angle = Math.random() * Math.PI * 2;
        this.spin = Math.random() * 0.04 - 0.02;
    }
    update() {
        this.y += this.speedY;
        this.angle += this.spin;
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = '#2c1e16';
        ctx.beginPath();
        ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 5);
        ctx.fill();
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8 - 2;
        this.size = Math.random() * 4 + 2;
        this.life = 1;
        this.color = color;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.15;
        this.life -= 0.03;
    }
    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#1a0b2e');
    gradient.addColorStop(0.5, '#3b1e54');
    gradient.addColorStop(1, '#6d3a5c');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(255, 100, 100, 0.15)';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2 - 50, 200, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff4d4d';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2 - 50, 150, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 50;
    ctx.shadowColor = '#ff4d4d';
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#120a1a';
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, height - 150);
    ctx.lineTo(150, height - 200);
    ctx.lineTo(300, height - 100);
    ctx.lineTo(500, height - 180);
    ctx.lineTo(650, height - 120);
    ctx.lineTo(width, height - 220);
    ctx.lineTo(width, height);
    ctx.fill();

    ctx.fillStyle = '#0a0510';
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, height - 80);
    ctx.lineTo(200, height - 120);
    ctx.lineTo(400, height - 50);
    ctx.lineTo(600, height - 100);
    ctx.lineTo(width, height - 60);
    ctx.lineTo(width, height);
    ctx.fill();
}

function drawBasket() {
    ctx.fillStyle = '#8b5a2b';
    ctx.beginPath();
    ctx.roundRect(basket.x - basket.width / 2, basket.y, basket.width, basket.height, 10);
    ctx.fill();

    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(basket.x - basket.width / 2, basket.y, basket.width, 10);

    ctx.strokeStyle = '#d4b48c';
    ctx.lineWidth = 2;
    for (let i = -30; i <= 30; i += 15) {
        ctx.beginPath();
        ctx.moveTo(basket.x + i, basket.y);
        ctx.lineTo(basket.x + i, basket.y + basket.height);
        ctx.stroke();
    }
}

function checkCollision(obj, isBranch) {
    const dx = Math.abs(obj.x - basket.x);
    const dy = Math.abs(obj.y - basket.y - basket.height / 2);
    
    if (dx < basket.width / 2 && dy < basket.height / 2 + 10) {
        if (isBranch) {
            playThud();
            lives--;
            updateLives();
            createExplosion(obj.x, obj.y, '#ff4d4d');
            if (lives <= 0) gameOver();
        } else {
            playChime();
            score++;
            scoreEl.textContent = score;
            createExplosion(obj.x, obj.y, '#ffb7c5');
        }
        return true;
    }
    return false;
}

function updateLives() {
    livesEl.textContent = '❤'.repeat(lives) + '🖤'.repeat(3 - lives);
}

function spawnObjects() {
    if (frame % Math.max(20, 60 - Math.floor(score / 5)) === 0) {
        petals.push(new Petal());
    }
    if (frame > 120 && frame % Math.max(60, 120 - Math.floor(score / 3)) === 0) {
        branches.push(new Branch());
    }
}

function gameOver() {
    isPlaying = false;
    finalScoreEl.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

function update() {
    if (!isPlaying) return;

    frame++;
    basket.x += (basket.targetX - basket.x) * 0.1;
    basket.x = Math.max(basket.width / 2, Math.min(width - basket.width / 2, basket.x));

    spawnObjects();

    for (let i = petals.length - 1; i >= 0; i--) {
        petals[i].update();
        petals[i].draw();
        if (checkCollision(petals[i], false)) {
            petals.splice(i, 1);
        } else if (petals[i].y > height) {
            petals.splice(i, 1);
        }
    }

    for (let i = branches.length - 1; i >= 0; i--) {
        branches[i].update();
        branches[i].draw();
        if (checkCollision(branches[i], true)) {
            branches.splice(i, 1);
        } else if (branches[i].y > height) {
            branches.splice(i, 1);
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }

    drawBasket();
}

function loop() {
    drawBackground();
    update();
    requestAnimationFrame(loop);
}

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    basket.targetX = e.clientX - rect.left;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    basket.targetX = e.touches[0].clientX - rect.left;
}, { passive: false });

document.getElementById('start-btn').addEventListener('click', () => {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    score = 0;
    lives = 3;
    frame = 0;
    petals = [];
    branches = [];
    particles = [];
    basket.x = width / 2;
    basket.targetX = width / 2;
    
    scoreEl.textContent = score;
    updateLives();
    
    isPlaying = true;
    if (audioCtx.state === 'suspended') audioCtx.resume();
});

document.getElementById('restart-btn').addEventListener('click', () => {
    document.getElementById('start-btn').click();
});

loop();
