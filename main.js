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


// Páros lábbal taposandó ellenségek listája
const ENEMY_TYPES = [
    { name: 'Narancsos pirula', color: '#6d4c41', head: '#2e7d32', points: 100, width: 80, height: 50 },
    { name: 'Bagolyka', color: '#73996e', head: '#ffca28', points: 500, width: 60, height: 40 },
    { name: 'TcFan', color: '#1a9a31', head: '#ffca28', points: 500, width: 60, height: 40 },
    { name: 'Bagolyka', color: '#5c6bc0', head: '#ffca28', points: 500, width: 60, height: 40 },
    { name: 'Janóka', color: '#b31919', head: '#ffca28', points: 500, width: 60, height: 40 },
    { name: 'Tájfel', color: '#37474f', head: '#c62828', points: 250, width: 110, height: 70 }
];

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
        ctx.fillStyle = this.dead ? '#000' : this.config.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
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
        ammo--;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        enemies.forEach(enemy => {
            if (!enemy.dead && mx > enemy.x && mx < enemy.x + enemy.width &&
                my > enemy.y - 20 && my < enemy.y + enemy.height) {
                enemy.dead = true;
                score += enemy.config.points;
                ammo += 2; // Találat reload, át kell dolgozni majd. Wawe reload lenne talán az ideál
            }
        });

        if (enemies.every(en => en.dead || en.y > canvas.height)) {
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
    ctx.fillStyle = '#64b0ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (gameState === 'START') drawStartScreen();
    else if (gameState === 'PLAYING') {
        ctx.fillStyle = '#64b0ff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        enemies.forEach(e => { e.update(); e.draw(); });
        ctx.fillStyle = '#1b5e20';
        ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
    } else if (gameState === 'GAMEOVER') drawGameOver();
    requestAnimationFrame(loop);
}
loop();