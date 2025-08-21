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

// 建立一個物件來儲存滑鼠的即時位置
const mousePos = { x: 0, y: 0 };

// 監聽滑鼠移動事件，更新 mousePos 物件
canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    mousePos.x = (event.clientX - rect.left) * scaleX;
    mousePos.y = (event.clientY - rect.top) * scaleY;
});


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

let currentDisplayingMessageId = -1;

let interactiveObjects = [];
const objectWidth = 80;
const objectHeight = 80;


//滑鼠點擊事件
canvas.addEventListener('click', (event) => {
    Object.keys(keysPressed).forEach(key => delete keysPressed[key]);
    
    // 直接使用已追蹤的滑鼠位置
    player.targetX = mousePos.x;
    player.targetY = mousePos.y;
});

// 更新Canvas尺寸
function updateCanvasSize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}

// 根據當前Canvas尺寸，重新計算所有物件的位置
function recalculateObjectPositions() {
    const numObjects = interactiveObjects.length;
    if (numObjects === 0) return; //如果物件還沒載入好，就直接返回

    const spacing = canvas.width / (numObjects + 1);
    const yPos = (canvas.height / 2) - (objectHeight / 2);

    interactiveObjects.forEach((obj, i) => {
        obj.x = (spacing * (i + 1)) - (objectWidth / 2);
        obj.y = yPos;
    });
}


// 根據當前互動狀態，將玩家移動回初始位置
function recalculatePlayerPosition() {
    const homeObject = interactiveObjects[0];
     const homeCenterX = homeObject.x + (homeObject.width / 2);
     const homeCenterY = homeObject.y + (homeObject.height / 2);
    player.x = homeCenterX;
    player.y = homeCenterY;
    player.targetX = homeCenterX;
    player.targetY = homeCenterY;
}

function CollisionJudge(x1,y1,width1,height1,x2,y2,width2,height2){

    return  x1 - width1/2 < x2 + width2 &&
            x1 + width1/2 > x2 &&
            y1 - height1/2 < y2 + height2 &&
            y1 + height1/2 > y2
}


// 監聽視窗的resize事件
window.addEventListener('resize', () => {
    updateCanvasSize();
    recalculateObjectPositions(); 
    recalculatePlayerPosition();  

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
    
    const halfWidth = player.width / 2;
    const halfHeight = player.height / 2;
    if (player.x - halfWidth < 0) { player.x = halfWidth; player.targetX = player.x; }
    if (player.x + halfWidth > canvas.width) { player.x = canvas.width - halfWidth; player.targetX = player.x; }
    if (player.y - halfHeight < 0) { player.y = halfHeight; player.targetY = player.y; }
    if (player.y + halfHeight > canvas.height) { player.y = canvas.height - halfHeight; player.targetY = player.y; }

    player.isMoving = (player.x !== oldX || player.y !== oldY);


    //用來判斷是否要改變滑鼠指標
    let isHoveringAnyObject = false; 

    interactiveObjects.forEach(obj => {
        // 檢查滑鼠是否在物件的原始範圍內
        const isHovering = (
            mousePos.x > obj.x && mousePos.x < obj.x + obj.width &&
            mousePos.y > obj.y && mousePos.y < obj.y + obj.height
        );
        
        if (isHovering) {
            isHoveringAnyObject = true;
            obj.targetScale = 1.15; // 懸停時，目標放大 1.15 倍
        } else {
            obj.targetScale = 1.0; // 恢復原狀
        }

        // 使用平滑演算法，讓目前的比例逐漸趨近目標比例
        const scaleSpeed = 0.1;
        obj.currentScale += (obj.targetScale - obj.currentScale) * scaleSpeed;

        // 根據目前的縮放比例，計算繪製時的尺寸和位置
        const scaledWidth = obj.width * obj.currentScale;
        const scaledHeight = obj.height * obj.currentScale;
        const drawX = obj.x - (scaledWidth - obj.width) / 2; // 從中心放大
        const drawY = obj.y - (scaledHeight - obj.height) / 2;

        // 使用計算後的位置和尺寸來繪製物件
        context.drawImage(obj.image, drawX, drawY, scaledWidth, scaledHeight);
    });
    
    // 根據是否懸停在任何物件上，改變滑鼠指標樣式
    canvas.style.cursor = isHoveringAnyObject ? 'grab' : 'default';


    //更新並繪製玩家動畫 (圖層在上)
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
    
    // 決定這一幀應該顯示哪個 ID
    let newId = 0;
    
    const playerFeetCollisionWidth = player.width;
    const playerFeetCollisionHeight = player.height;
    const playerFeetX = player.x;
    const playerFeetY = player.y + player.height/2 - playerFeetCollisionHeight/2;

    interactiveObjects.forEach((obj, index) => {
        if (CollisionJudge(playerFeetX, playerFeetY, playerFeetCollisionWidth, playerFeetCollisionHeight, obj.x, obj.y, obj.width, obj.height)) {
            newId = index;
        }    
    });

    if (newId !== currentDisplayingMessageId) {
        if (messageTemplates[newId]) {
            messageBox.innerHTML = messageTemplates[newId].innerHTML;
        }
        currentDisplayingMessageId = newId;
    }

    requestAnimationFrame(gameLoop);
}




//遊戲啟動流程
const objectDefinitions = document.querySelectorAll('#object-definitions .canvas-object-def');
const numObjects = objectDefinitions.length;
const objectImagePaths = Array.from(objectDefinitions).map(def => {
    return def.getAttribute('data-img-src');
});

Promise.all([
    preloadPlayerImages(),
    preloadObjectImages(objectImagePaths)
])
.then(([playerResult, loadedObjectImages]) => {
    console.log(playerResult);
    interactiveObjects = loadedObjectImages.map((img, i) => {
        const spacing = canvas.width / (numObjects + 1);
        const yPos = (canvas.height / 2) - (objectHeight / 2);
        const xPos = (spacing * (i + 1)) - (objectWidth / 2);
        

        // 為物件添加縮放屬性
        return { 
            x: xPos, y: yPos, 
            width: objectWidth, height: objectHeight, 
            image: img,
            currentScale: 1.0, //目前的縮放比例
            targetScale: 1.0   //目標縮放比例
        };
    });

    // 設定初始位置
    recalculateObjectPositions();
    recalculateObjectPositions();
    
    if (interactiveObjects.length > 0) {
        const homeObject = interactiveObjects[0];
        const homeCenterX = homeObject.x + (homeObject.width / 2);
        const homeCenterY = homeObject.y + (homeObject.height / 2);
        player.x = homeCenterX;
        player.y = homeCenterY;
        player.targetX = homeCenterX;
        player.targetY = homeCenterY;
    }
    
    gameLoop();
})
.catch(error => {
    console.error("圖片載入失敗:", error);
    alert("部分網頁資源載入失敗，請檢查網路連線或檔案路徑後重新整理。");
});