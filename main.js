const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const ammoEl = document.getElementById('ammo');
const scoreEl = document.getElementById('score');
const uiEl = document.getElementById('ui');

let gameState = 'START';
let score = 0;
let ammo = 10;
let enemies = [];
let enemyCount;

// Game pause state
let gamePaused = false;
let pauseEndTime = 0; // Timestamp when the pause should end
const HIT_PAUSE_DURATION = 200; // milliseconds

// Sound effects
const shootSound = new Audio('asset/sfx/shoot.mp3');
shootSound.volume = 0.5; // Adjust volume as needed

const trollHitSounds = [];
for (let i = 1; i <= 14; i++) {
    const sound = new Audio(`asset/sfx/trollhit${i}.mp3`);
    sound.volume = 0.7; // Adjust volume as needed
    trollHitSounds.push(sound);
}
const backgroundImg = new Image();
backgroundImg.src = 'asset/level/background.png';

// Páros lábbal taposandó ellenségek listája
const ENEMY_TYPES = [
    { name: 'Narancsos pirula', image: 'asset/enemy/narancsospirula.jpg', points: 100, width: 80, height: 80 },
    { name: 'Bagolyka', image: 'asset/enemy/bagolyka.jpg', points: 500, width: 50, height: 70 },
    { name: 'tituszmitusz', image: 'asset/enemy/tituszmitusz.PNG', points: 500, width: 60, height: 60 },
    { name: 'Emberkinzoforum', image: 'asset/enemy/emberkinzoforum.gif', points: 500, width: 70, height: 70 },
    { name: 'CCklener', image: 'asset/enemy/ccklener.jpg', points: 500, width: 60, height: 80 },
    { name: 'wurmjude', image: 'asset/enemy/wurmjude.jpeg', points: 250, width: 80, height: 110 }
];

ENEMY_TYPES.forEach(type => {
    type.img = new Image();
    type.img.src = type.image;
});

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

class Enemy {
    constructor() {
        this.config = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
        this.width = this.config.width;
        this.height = this.config.height;
        this.init();
    }

    init() {
        this.dead = false;
        this.x = Math.random() * (canvas.width - this.width);
        this.y = canvas.height - 150; 
        
        this.vx = (Math.random() - 0.5) * 5; 
        this.vy = -(Math.random() * 2 + 1.5); 
    }

    update() {
        if (this.dead) {
            this.y += 10; 
            return;
        }

        const outOfAmmo = (ammo <= 0);

        this.x += this.vx;
        this.y += this.vy;

        if (this.x <= 0 || this.x + this.width >= canvas.width) this.vx *= -1;

        if (!outOfAmmo) {
            if (this.y <= 0) {
                this.y = 0;
                this.vy *= -1;
            }
            if (this.y + this.height >= canvas.height - 100) {
                this.y = canvas.height - 100 - this.height;
                this.vy *= -1;
            }
        } else {
            this.vy = -8;
            if (this.y + this.height < 0) {
                gameOver();
            }
        }
    }

    draw() {
        if (this.dead) {
            ctx.save();
            ctx.translate(this.x, this.y + this.height);
            ctx.scale(1, -1);
            ctx.drawImage(this.config.img, 0, 0, this.width, this.height);
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.restore();
        } else {
            ctx.drawImage(this.config.img, this.x, this.y, this.width, this.height);
        }
        
        // Fej rajz - /nem kell/
        // ctx.fillStyle = this.config.head;
        // const headX = this.vx > 0 ? this.x + this.width - 15 : this.x - 10;
        // ctx.fillRect(headX, this.y - 10, 25, 25);

        if (!this.dead) {
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.font = "12px Courier New";
            ctx.fillText(this.config.name, this.x, this.y - 15);
        }
    }
}

function spawnWave() {
    enemies = [];
    enemyCount = 0

    while(enemyCount == 0){
        enemyCount = Math.floor(Math.random() * 6); //Mennyi troll legyen a képernyőn
    }

    for (let i = 0; i < enemyCount; i++) {
        enemies.push(new Enemy());
    }
}

canvas.addEventListener('mousedown', (e) => {
    if (gameState !== 'PLAYING') { resetGame(); return; }

    if (ammo > 0) {
        shootSound.currentTime = 0; // Rewind to start
        shootSound.play();

        ammo--;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        let enemyWasHit = false;

        enemies.forEach(enemy => {
            if (!enemy.dead && mx > enemy.x && mx < enemy.x + enemy.width &&
                my > enemy.y - 20 && my < enemy.y + enemy.height) {
                enemy.dead = true;
                score += enemy.config.points;
                ammo += 2; // Találat reload, át kell dolgozni majd. Wawe reload lenne talán az ideál
                enemyWasHit = true;

                // Play random troll hit sound
                const randomHitSound = trollHitSounds[Math.floor(Math.random() * trollHitSounds.length)];
                randomHitSound.currentTime = 0; // Rewind to start
                randomHitSound.play();
            }
        });

        if (enemyWasHit) { // Only pause if an enemy was actually hit
            gamePaused = true;
            pauseEndTime = Date.now() + HIT_PAUSE_DURATION;
        } else if (enemies.every(en => en.dead || en.y > canvas.height)) {
            spawnWave();
        }
        updateUI();
    }
});

function resetGame() {
    score = 0;
    ammo = 10;
    gameState = 'PLAYING';
    uiEl.style.display = 'flex';
    spawnWave();
    updateUI();
}

function gameOver() { gameState = 'GAMEOVER'; }
function updateUI() { ammoEl.innerText = ammo; scoreEl.innerText = score; }

function drawStartScreen() {
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = 'bold 50px Courier New';
    ctx.fillText('TrollHunt', canvas.width / 2, canvas.height / 2);
    ctx.font = '20px Courier New';
    ctx.fillText('A VÁLASZTÁS GYŐZELMI LESZÁMOLÁS - Katt a starthoz.', canvas.width / 2, canvas.height / 2 + 40);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff4444';
    ctx.textAlign = 'center';
    ctx.font = 'bold 60px Courier New';
    ctx.fillText('ELSZÖKTEK!', canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = 'white';
    ctx.fillText(`PONTOK: ${score}`, canvas.width / 2, canvas.height / 2 + 70);
}

function loop() {
    requestAnimationFrame(loop);

    let shouldUpdate = true;
    if (gamePaused) {
        if (Date.now() >= pauseEndTime) {
            gamePaused = false;
        } else {
            shouldUpdate = false; // Don't update game logic if paused
        }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'START') {
        drawStartScreen();
    } else if (gameState === 'PLAYING') {
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
        if (shouldUpdate) enemies.forEach(e => { e.update(); }); // Update only if not paused
        enemies.forEach(e => { e.draw(); }); // Always draw
        ctx.fillStyle = '#1b5e20'; // Ground color
        ctx.fillRect(0, canvas.height - 80, canvas.width, 80); // Ground
    } else if (gameState === 'GAMEOVER') {
        drawGameOver();
    }
}
loop();