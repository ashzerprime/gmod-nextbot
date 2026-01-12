<script>
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const FLOOR_HEIGHT = 5;
const NUM_FLOORS = 3;

const game = {
    player: {
        x: 0,
        y: 1.7,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        height: 1.7,
        radius: 0.5,
        health: 100,
        isDead: false,
        isJumping: false,
        currentFloor: 0
    },
    camera: {
        pitch: 0,
        yaw: 0
    },
    keys: {},
    nextbots: [],
    gravity: -0.02,
    jumpForce: 0.35,
    moveSpeed: 0.12
};

const parking = {
    pillars: [],
    walls: [],
    stairs: [
        {x: 18, zStart: 16, zEnd: 21, width: 4, fromFloor: 0, toFloor: 1},
        {x: 18, zStart: 16, zEnd: 21, width: 4, fromFloor: 1, toFloor: 2},
        {x: -18, zStart: -21, zEnd: -16, width: 4, fromFloor: 0, toFloor: 1},
        {x: -18, zStart: -21, zEnd: -16, width: 4, fromFloor: 1, toFloor: 2}
    ]
};

for (let x = -20; x <= 20; x += 8) {
    for (let z = -20; z <= 20; z += 8) {
        if (Math.abs(x) > 3 || Math.abs(z) > 3) {
            parking.pillars.push({x, z, w: 0.6, d: 0.6});
        }
    }
}

parking.walls = [
    {x1: -25, z1: -25, x2: 25, z2: -25},
    {x1: 25, z1: -25, x2: 25, z2: 25},
    {x1: 25, z1: 25, x2: -25, z2: 25},
    {x1: -25, z1: 25, x2: -25, z2: -25}
];

const nextbotImages = [];
const imageUrls = [
    'data:image/svg+xml,' + encodeURIComponent(`
        <svg width="100" height="120" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="bg">
                    <stop offset="0%" style="stop-color:#8B0000"/>
                    <stop offset="100%" style="stop-color:#000"/>
                </radialGradient>
            </defs>
            <ellipse cx="50" cy="60" rx="45" ry="55" fill="url(#bg)"/>
            <ellipse cx="30" cy="45" rx="12" ry="18" fill="#fff"/>
            <ellipse cx="70" cy="45" rx="12" ry="18" fill="#fff"/>
            <circle cx="30" cy="45" r="8" fill="#000"/>
            <circle cx="70" cy="45" r="8" fill="#000"/>
            <rect x="20" y="75" width="60" height="8" fill="#000"/>
            <path d="M 25 75 Q 50 85 75 75" stroke="#fff" stroke-width="3" fill="none"/>
        </svg>
    `),
    'data:image/svg+xml,' + encodeURIComponent(`
        <svg width="100" height="120" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="50" cy="60" rx="42" ry="55" fill="#2a2a2a"/>
            <ellipse cx="32" cy="48" rx="10" ry="16" fill="#fff"/>
            <ellipse cx="68" cy="48" rx="10" ry="16" fill="#fff"/>
            <circle cx="32" cy="48" r="7" fill="#000"/>
            <circle cx="68" cy="48" r="7" fill="#000"/>
            <ellipse cx="50" cy="80" rx="18" ry="12" fill="#1a1a1a"/>
            <path d="M 30 78 Q 50 90 70 78" stroke="#000" stroke-width="4" fill="none"/>
        </svg>
    `),
    'data:image/svg+xml,' + encodeURIComponent(`
        <svg width="100" height="120" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="50" cy="60" rx="40" ry="52" fill="#1a1a1a"/>
            <ellipse cx="35" cy="50" rx="9" ry="14" fill="#fff"/>
            <ellipse cx="65" cy="50" rx="9" ry="14" fill="#fff"/>
            <circle cx="35" cy="50" r="6" fill="#000"/>
            <circle cx="65" cy="50" r="6" fill="#000"/>
            <line x1="30" y1="72" x2="70" y2="72" stroke="#000" stroke-width="5"/>
            <ellipse cx="32" cy="47" rx="3" ry="4" fill="#fff" opacity="0.5"/>
        </svg>
    `)
];

imageUrls.forEach((url, i) => {
    const img = new Image();
    img.src = url;
    nextbotImages.push(img);
});

document.addEventListener('keydown', (e) => {
    game.keys[e.key.toLowerCase()] = true;
    if (e.code === 'Space' && !game.player.isJumping && !game.player.isDead) {
        game.player.vy = game.jumpForce;
        game.player.isJumping = true;
    }
});

document.addEventListener('keyup', (e) => {
    game.keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
});

document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === canvas) {
        game.camera.yaw += e.movementX * 0.002;
        game.camera.pitch -= e.movementY * 0.002;
        game.camera.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, game.camera.pitch));
    }
});

document.querySelectorAll('.spawn-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        spawnNextbot(btn.dataset.type);
    });
});

document.getElementById('restartBtn').addEventListener('click', restartGame);

function spawnNextbot(type) {
    if (game.player.isDead) return;
    
    const speeds = {
        'speed': 0.1,
        'medium': 0.06,
        'low': 0.03
    };

    const angle = Math.random() * Math.PI * 2;
    const distance = 15 + Math.random() * 8;
    const imageIndex = Math.floor(Math.random() * nextbotImages.length);
    
    game.nextbots.push({
        x: game.player.x + Math.cos(angle) * distance,
        y: game.player.currentFloor * FLOOR_HEIGHT + 1.7,
        z: game.player.z + Math.sin(angle) * distance,
        speed: speeds[type],
        type: type,
        currentFloor: game.player.currentFloor,
        imageIndex: imageIndex
    });
}

function checkWallCollision(x, z) {
    if (x < -24 || x > 24 || z < -24 || z > 24) return true;
    
    for (let pillar of parking.pillars) {
        if (Math.abs(x - pillar.x) < pillar.w + game.player.radius && 
            Math.abs(z - pillar.z) < pillar.d + game.player.radius) {
            return true;
        }
    }
    
    return false;
}

function isOnStairs(x, z, floor) {
    for (let stair of parking.stairs) {
        const minZ = Math.min(stair.zStart, stair.zEnd);
        const maxZ = Math.max(stair.zStart, stair.zEnd);
        
        if (Math.abs(x - stair.x) < stair.width / 2 && 
            z >= minZ && z <= maxZ &&
            (floor === stair.fromFloor || floor === stair.toFloor)) {
            return stair;
        }
    }
    return null;
}

function getStairHeight(x, z, floor) {
    const stair = isOnStairs(x, z, floor);
    if (!stair) return null;

    const minZ = Math.min(stair.zStart, stair.zEnd);
    const maxZ = Math.max(stair.zStart, stair.zEnd);
    const progress = (z - minZ) / (maxZ - minZ);
    
    const baseY = stair.fromFloor * FLOOR_HEIGHT;
    const targetY = stair.toFloor * FLOOR_HEIGHT;
    
    return baseY + progress * (targetY - baseY) + 1.7;
}

function checkNextbotCollision() {
    for (let bot of game.nextbots) {
        const dx = game.player.x - bot.x;
        const dy = game.player.y - bot.y;
        const dz = game.player.z - bot.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        if (dist < 1 && Math.abs(dy) < 1.5) {
            game.player.health = 0;
            updateHealth();
            return true;
        }
    }
    return false;
}

function updateHealth() {
    document.getElementById('healthFill').style.width = game.player.health + '%';
    document.getElementById('healthText').textContent = Math.floor(game.player.health);
    
    if (game.player.health <= 0 && !game.player.isDead) {
        game.player.isDead = true;
        document.getElementById('gameOver').style.display = 'block';
    }
}

function restartGame() {
    game.player = {
        x: 0,
        y: 1.7,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        height: 1.7,
        radius: 0.5,
        health: 100,
        isDead: false,
        isJumping: false,
        currentFloor: 0
    };
    game.nextbots = [];
    game.camera.pitch = 0;
    game.camera.yaw = 0;
    document.getElementById('gameOver').style.display = 'none';
    updateHealth();
}

function findNearestStairs(x, z, fromFloor, toFloor) {
    let nearest = null;
    let minDist = Infinity;

    for (let stair of parking.stairs) {
        if (stair.fromFloor === fromFloor && stair.toFloor === toFloor) {
            const centerZ = (stair.zStart + stair.zEnd) / 2;
            const dist = Math.hypot(x - stair.x, z - centerZ);
            if (dist < minDist) {
                minDist = dist;
                nearest = stair;
            }
        }
    }

    return nearest;
}

function gameLoop() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a0a0a');
    gradient.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!game.player.isDead) {
        const moveX = (game.keys['d'] ? 1 : 0) - (game.keys['q'] ? 1 : 0);
        const moveZ = (game.keys['z'] ? 1 : 0) - (game.keys['s'] ? 1 : 0);

        if (moveX !== 0 || moveZ !== 0) {
            const angle = Math.atan2(moveZ, moveX) + game.camera.yaw;
            const newVX = Math.cos(angle) * game.moveSpeed;
            const newVZ = Math.sin(angle) * game.moveSpeed;
            
            if (!checkWallCollision(game.player.x + newVX, game.player.z)) {
                game.player.vx = newVX;
            } else {
                game.player.vx = 0;
            }
            
            if (!checkWallCollision(game.player.x, game.player.z + newVZ)) {
                game.player.vz = newVZ;
            } else {
                game.player.vz = 0;
            }
        } else {
            game.player.vx *= 0.8;
            game.player.vz *= 0.8;
        }

        game.player.vy += game.gravity;
        game.player.x += game.player.vx;
        game.player.y += game.player.vy;
        game.player.z += game.player.vz;

        const stairHeight = getStairHeight(game.player.x, game.player.z, game.player.currentFloor);
        
        if (stairHeight !== null) {
            if (game.player.y < stairHeight) {
                game.player.y = stairHeight;
                game.player.vy = 0;
                game.player.isJumping = false;
            }
            game.player.currentFloor = Math.round((game.player.y - 1.7) / FLOOR_HEIGHT);
        } else {
            const floorY = game.player.currentFloor * FLOOR_HEIGHT + 1.7;
            
            if (game.player.y <= floorY) {
                game.player.y = floorY;
                game.player.vy = 0;
                game.player.isJumping = false;
            }
            
            if (game.player.y < floorY - 2) {
                game.player.currentFloor = Math.max(0, game.player.currentFloor - 1);
            }
        }

        document.getElementById('floorInfo').textContent = `Étage: ${game.player.currentFloor}`;

        for (let bot of game.nextbots) {
            const playerFloor = game.player.currentFloor;
            
            if (bot.currentFloor !== playerFloor) {
                const stairs = findNearestStairs(bot.x, bot.z, bot.currentFloor, 
                    bot.currentFloor < playerFloor ? bot.currentFloor + 1 : bot.currentFloor - 1);
                
                if (stairs) {
                    const centerZ = (stairs.zStart + stairs.zEnd) / 2;
                    const dx = stairs.x - bot.x;
                    const dz = centerZ - bot.z;
                    const dist = Math.sqrt(dx * dx + dz * dz);
                    
                    if (dist > 0.5) {
                        let newX = bot.x + (dx / dist) * bot.speed;
                        let newZ = bot.z + (dz / dist) * bot.speed;
                        
                        if (!checkWallCollision(newX, newZ)) {
                            bot.x = newX;
                            bot.z = newZ;
                        }
                    }
                }
            } else {
                const dx = game.player.x - bot.x;
                const dz = game.player.z - bot.z;
                const dist = Math.sqrt(dx * dx + dz * dz);
                
                if (dist > 0.5) {
                    let newX = bot.x + (dx / dist) * bot.speed;
                    let newZ = bot.z + (dz / dist) * bot.speed;
                    
                    if (checkWallCollision(newX, newZ)) {
                        newX = bot.x + (dz / dist) * bot.speed;
                        newZ = bot.z - (dx / dist) * bot.speed;
                        
                        if (checkWallCollision(newX, newZ)) {
                            newX = bot.x - (dz / dist) * bot.speed;
                            newZ = bot.z + (dx / dist) * bot.speed;
                        }
                    }
                    
                    if (!checkWallCollision(newX, newZ)) {
                        bot.x = newX;
                        bot.z = newZ;
                    }
                }
            }
            
            const botStairHeight = getStairHeight(bot.x, bot.z, bot.currentFloor);
            
            if (botStairHeight !== null) {
                bot.y = botStairHeight;
                bot.currentFloor = Math.round((bot.y - 1.7) / FLOOR_HEIGHT);
            } else {
                const targetY = bot.currentFloor * FLOOR_HEIGHT + 1.7;
                bot.y = targetY;
            }
        }

        checkNextbotCollision();
    }

    render3D();
    requestAnimationFrame(gameLoop);
}

function render3D() {
    drawParking();
    
    const sortedBots = [...game.nextbots].sort((a, b) => {
        const distA = Math.hypot(a.x - game.player.x, a.z - game.player.z);
        const distB = Math.hypot(b.x - game.player.x, b.z - game.player.z);
        return distB - distA;
    });

    for (let bot of sortedBots) {
        drawNextbot(bot);
    }
}

function drawParking() {
    const cf = game.player.currentFloor;
    
    ctx.fillStyle = '#2a2a2a';
    for (let i = -6; i <= 6; i++) {
        for (let j = -6; j <= 6; j++) {
            drawFloorTile(i * 4, cf * FLOOR_HEIGHT, j * 4, 4, '#2a2a2a');
        }
    }

    ctx.fillStyle = '#1a1a1a';
    for (let i = -6; i <= 6; i++) {
        for (let j = -6; j <= 6; j++) {
            drawFloorTile(i * 4, cf * FLOOR_HEIGHT + 3.8, j * 4, 4, '#1a1a1a');
        }
    }

    for (let wall of parking.walls) {
        drawWall(wall, cf);
    }

    for (let pillar of parking.pillars) {
        drawPillar(pillar.x, cf * FLOOR_HEIGHT, pillar.z);
    }

    for (let stair of parking.stairs) {
        if (stair.fromFloor === cf || stair.toFloor === cf) {
            drawStairs(stair);
        }
    }

    ctx.fillStyle = 'rgba(255, 200, 0, 0.2)';
    for (let i = -20; i <= 20; i += 10) {
        for (let j = -20; j <= 20; j += 10) {
            const light = project3D(i, cf * FLOOR_HEIGHT + 3.5, j);
            if (light) {
                ctx.beginPath();
                ctx.arc(light.x, light.y, 30, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

function drawWall(wall, floor) {
    const y = floor * FLOOR_HEIGHT;
    const h = 3.8;
    
    drawQuad([
        [wall.x1, y, wall.z1],
        [wall.x2, y, wall.z2],
        [wall.x2, y + h, wall.z2],
        [wall.x1, y + h, wall.z1]
    ], '#3a3a3a');
}

function drawFloorTile(x, y, z, size, color) {
    drawQuad([
        [x, y, z],
        [x + size, y, z],
        [x + size, y, z + size],
        [x, y, z + size]
    ], color);
}

function drawPillar(x, y, z) {
    const h = 3.8;
    const w = 0.6;
    
    drawQuad([
        [x - w/2, y, z - w/2],
        [x + w/2, y, z - w/2],
        [x + w/2, y + h, z - w/2],
        [x - w/2, y + h, z - w/2]
    ], '#555');

    for (let i = 0; i < 5; i++) {
        const stripeY = y + (i * h / 5);
        const color = i % 2 === 0 ? '#ffcc00' : '#000';
        drawQuad([
            [x - w/2, stripeY, z - w/2],
            [x + w/2, stripeY, z - w/2],
            [x + w/2, stripeY + h/10, z - w/2],
            [x - w/2, stripeY + h/10, z - w/2]
        ], color);
    }
}

function drawStairs(stair) {
    const steps = 20;
    const minZ = Math.min(stair.zStart, stair.zEnd);
    const maxZ = Math.max(stair.zStart, stair.zEnd);
    const stepDepth = (maxZ - minZ) / steps;
    
    for (let i = 0; i < steps; i++) {
        const stepZ = minZ + i * stepDepth;
        const baseY = stair.fromFloor * FLOOR_HEIGHT;
        const targetY = stair.toFloor * FLOOR_HEIGHT;
        const stepY = baseY + (i / steps) * (targetY - baseY);
        
        drawQuad([
            [stair.x - stair.width/2, stepY, stepZ],
            [stair.x + stair.width/2, stepY, stepZ],
            [stair.x + stair.width/2, stepY + 0.15, stepZ + stepDepth],
            [stair.x - stair.width/2, stepY + 0.15, stepZ + stepDepth]
        ], '#666');
    }
}

function drawQuad(corners, color) {
    const projected = corners.map(c => project3D(c[0], c[1], c[2]));
    
    if (projected.every(p => p)) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(projected[0].x, projected[0].y);
        for (let i = 1; i < projected.length; i++) {
            ctx.lineTo(projected[i].x, projected[i].y);
        }
        ctx.closePath();
        ctx.fill();
    }
}

function drawNextbot(bot) {
    const dx = bot.x - game.player.x;
    const dy = (bot.y - 0.85) - game.player.y;
    const dz = bot.z - game.player.z;

    const cosYaw = Math.cos(-game.camera.yaw);
    const sinYaw = Math.sin(-game.camera.yaw);
    const rx = dx * cosYaw - dz * sinYaw;
    const rz = dx * sinYaw + dz * cosYaw;

    if (rz <= 0.1) return;

    const cosPitch = Math.cos(-game.camera.pitch);
    const sinPitch = Math.sin(-game.camera.pitch);
    const ry = dy * cosPitch - rz * sinPitch;

    const fov = Math.PI / 3;
    const scale = (canvas.width / 2) / Math.tan(fov / 2) / rz;
    const screenX = canvas.width / 2 + rx * scale;
    const screenY = canvas.height / 2 - ry * scale;

    const size = 30 * scale;

    ctx.save();
    ctx.globalAlpha = Math.min(1, 20 / rz);
    ctx.drawImage(nextbotImages[bot.imageIndex], screenX - size / 2, screenY - size, size, size * 1.2);
    ctx.restore();
}

function project3D(x, y, z) {
    const dx = x - game.player.x;
    const dy = y - game.player.y;
    const dz = z - game.player.z;

    const cosYaw = Math.cos(-game.camera.yaw);
    const sinYaw = Math.sin(-game.camera.yaw);
    const rx = dx * cosYaw - dz * sinYaw;
    const rz = dx * sinYaw + dz * cosYaw;

    if (rz <= 0.1) return null;

    const cosPitch = Math.cos(-game.camera.pitch);
    const sinPitch = Math.sin(-game.camera.pitch);
    const ry = dy * cosPitch - rz * sinPitch;

    const fov = Math.PI / 3;
    const scale = (canvas.width / 2) / Math.tan(fov / 2) / rz;
    
    return {
        x: canvas.width / 2 + rx * scale,
        y: canvas.height / 2 - ry * scale
    };
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

gameLoop();
</script>
