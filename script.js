//初始化設定
const canvas = document.getElementById('game-canvas');
const context = canvas.getContext('2d');

//獲取訊息框
const messageBox = document.getElementById('message-box');
//獲取要放置的訊息模板
const messageTemplates = document.querySelector('#content-templates').children;

//設定畫布的解析度
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;


//玩家顯示尺寸
const PLAYER_DISPLAY_WIDTH = 65;
const PLAYER_DISPLAY_HEIGHT = 100;

//動畫設定物件
const animationConfig = {
    'down': { row: 0, frames: [0, 1], standingFrame: 0 },
    'up': { row: 0, frames: [2, 3], standingFrame: 2 },
    'left': { row: 1, frames: [0, 1, 2, 3], standingFrame: 1 },
    'right': { row: 2, frames: [0, 1, 2, 3], standingFrame: 1 }
};

let playerImages = [[], [], []];

//預載入所有玩家圖片
function preloadPlayerImages() {
    const imagePaths = [];
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
            const path = `picture/Player/${row}${col}.png`;
            imagePaths.push(path);
        }
    }
    const promises = imagePaths.map(path => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`無法載入圖片: ${path}`));
            img.src = path;
        });
    });
    return Promise.all(promises).then(loadedImages => {
        let imageIndex = 0;
        for (let row = 0; row < 3; row++) {
            playerImages[row] = [];
            for (let col = 0; col < 4; col++) {
                playerImages[row][col] = loadedImages[imageIndex];
                imageIndex++;
            }
        }
        return "Player images loaded successfully";
    });
}

//預載入物件圖片
const objectImagePaths = [ 'picture/Home.png', 'picture/About.png', 'picture/Works.png', 'picture/Skill.png' ];
function preloadObjectImages(paths) {
    const promises = paths.map(path => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`無法載入圖片: ${path}`));
            img.src = path;
        });
    });
    return Promise.all(promises);
}


//鍵盤狀態追蹤
const keysPressed = {};
window.addEventListener('keydown', (event) => { keysPressed[event.key.toLowerCase()] = true; });
window.addEventListener('keyup', (event) => { delete keysPressed[event.key.toLowerCase()]; });


//玩家物件定義
const player = {
    x: PLAYER_DISPLAY_WIDTH,
    y: canvas.height / 2,
    speed: 4,
    targetX: PLAYER_DISPLAY_WIDTH,
    targetY: canvas.height / 2,
    width: PLAYER_DISPLAY_WIDTH,
    height: PLAYER_DISPLAY_HEIGHT,
    isMoving: false,
    wasMoving: false,
    direction: 'down',
    animationFrameIndex: 0,
    currentFrame: 0,
    animationTimer: 0,
    animationDelay: 12,
};
player.currentFrame = animationConfig[player.direction].standingFrame;

let interactiveObjects = [];
const numObjects = 4;
const objectWidth = 80;
const objectHeight = 80;


//滑鼠點擊事件
canvas.addEventListener('click', (event) => {
    Object.keys(keysPressed).forEach(key => delete keysPressed[key]);
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (event.clientX - rect.left) * scaleX;
    const mouseY = (event.clientY - rect.top) * scaleY;
    player.targetX = mouseX;
    player.targetY = mouseY;
});


//鍵盤移動處理
function handleKeyboardMovement() {
    let movedByKey = false;
    if (keysPressed['w'] || keysPressed['arrowup']) { player.y -= player.speed; player.direction = 'up'; movedByKey = true; }
    if (keysPressed['s'] || keysPressed['arrowdown']) { player.y += player.speed; player.direction = 'down'; movedByKey = true; }
    if (keysPressed['a'] || keysPressed['arrowleft']) { player.x -= player.speed; player.direction = 'left'; movedByKey = true; }
    if (keysPressed['d'] || keysPressed['arrowright']) { player.x += player.speed; player.direction = 'right'; movedByKey = true; }

    if (movedByKey) {
        player.targetX = player.x;
        player.targetY = player.y;
    }
}


//核心遊戲迴圈
function gameLoop() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    const oldX = player.x;
    const oldY = player.y;
    player.wasMoving = player.isMoving;

    handleKeyboardMovement();

    const dx = player.targetX - player.x;
    const dy = player.targetY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > player.speed) {
        if (!Object.keys(keysPressed).length) {
             if (Math.abs(dx) > Math.abs(dy)) {
                player.direction = dx > 0 ? 'right' : 'left';
            } else {
                player.direction = dy > 0 ? 'down' : 'up';
            }
        }
        player.x += (dx / distance) * player.speed;
        player.y += (dy / distance) * player.speed;
    } else if (distance > 0) {
        player.x = player.targetX;
        player.y = player.targetY;
    }
    
    // ======================================================
    // ==================== 關鍵修正處 =======================
    // ======================================================
    const halfWidth = player.width / 2;
    const halfHeight = player.height / 2;

    // 當角色碰到邊界時，不僅要修正他的位置，也要修正他的「目標」
    if (player.x - halfWidth < 0) {
        player.x = halfWidth;
        player.targetX = player.x; // 更新目標，讓他停止嘗試移動
    }
    if (player.x + halfWidth > canvas.width) {
        player.x = canvas.width - halfWidth;
        player.targetX = player.x; // 更新目標
    }
    // (順便修正了您的y軸上方碰撞判斷)
    if (player.y - halfHeight < 0) {
        player.y = halfHeight;
        player.targetY = player.y; // 更新目標
    }
    if (player.y + halfHeight > canvas.height) {
        player.y = canvas.height - halfHeight;
        player.targetY = player.y; // 更新目標
    }

    player.isMoving = (player.x !== oldX || player.y !== oldY);


    //繪製物件
    interactiveObjects.forEach(obj => { context.drawImage(obj.image, obj.x, obj.y, obj.width, obj.height); });

    //更新並繪製玩家動畫
    const config = animationConfig[player.direction];
    if (player.isMoving) {
        player.animationTimer++;
        if (player.animationTimer >= player.animationDelay) {
            player.animationFrameIndex = (player.animationFrameIndex + 1) % config.frames.length;
            player.currentFrame = config.frames[player.animationFrameIndex];
            player.animationTimer = 0;
        }
    } else {
        player.currentFrame = config.standingFrame;
        if (player.wasMoving) { 
            player.animationFrameIndex = 0;
        }
    }
    const row = config.row;
    const col = player.currentFrame;
    const imageToDraw = playerImages[row] ? playerImages[row][col] : null;
    if (imageToDraw) {
      context.drawImage( imageToDraw, player.x - halfWidth, player.y - halfHeight, player.width, player.height );
    }
    
    //碰撞偵測與互動
    const playerFeetCollisionWidth = player.width * 0.4;
    const playerFeetCollisionHeight = player.height * 0.2;
    const playerFeetX = player.x;
    const playerFeetY = player.y + player.height/2 - playerFeetCollisionHeight/2;
    let interacting = false;
    interactiveObjects.forEach((obj, index) => {
        if (
            playerFeetX - playerFeetCollisionWidth/2 < obj.x + obj.width &&
            playerFeetX + playerFeetCollisionWidth/2 > obj.x &&
            playerFeetY - playerFeetCollisionHeight/2 < obj.y + obj.height &&
            playerFeetY + playerFeetCollisionHeight/2 > obj.y
        ) {
            if (messageTemplates[index + 1]) { messageBox.innerHTML = messageTemplates[index + 1].innerHTML; }
            interacting = true;
        }
    });
    if (!interacting) { messageBox.innerHTML = messageTemplates[0].innerHTML; }

    requestAnimationFrame(gameLoop);
}


//遊戲啟動流程
Promise.all([ preloadPlayerImages(), preloadObjectImages(objectImagePaths) ])
.then(([playerResult, loadedObjectImages]) => {
    console.log(playerResult);
    interactiveObjects = loadedObjectImages.map((img, i) => {
        const spacing = canvas.width / (numObjects + 1);
        const yPos = (canvas.height / 2) - (objectHeight / 2);
        const xPos = (spacing * (i + 1)) - (objectWidth / 2);
        return { x: xPos, y: yPos, width: objectWidth, height: objectHeight, image: img };
    });
    gameLoop();
})
.catch(error => {
    console.error("圖片載入失敗:", error);
    alert("部分網頁資源載入失敗，請檢查網路連線或檔案路徑後重新整理。");
});