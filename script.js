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



//建立一個物件來儲存目前哪些按鍵被按下了
const keysPressed = {};

//監聽鍵盤按下的事件
window.addEventListener('keydown', (event) => {
    //將被按下的按鍵名稱 (例如 "w", "ArrowUp") 設為 true
    keysPressed[event.key] = true;
});

//監聽鍵盤放開的事件
window.addEventListener('keyup', (event) => {
    //當按鍵放開時，從物件中刪除該按鍵的紀錄
    delete keysPressed[event.key];
});


//遊戲物件定義
//像素小人
const player = {
    x: 50,
    y: canvas.height / 2, //初始位置改到畫布中間
    width: 30,
    height: 30,
    color: '#e60073', //一個鮮豔的顏色
    speed: 3,
    targetX: 50, // 目標位置
    targetY: canvas.height / 2
};

//動態生成互動物件
const interactiveObjects = [];
const numObjects = 4;
const objectWidth = 50;
const objectHeight = 50;
const spacing = canvas.width / (numObjects + 1);
const yPos = (canvas.height / 2) - (objectHeight / 2);

for (let i = 0; i < numObjects; i++) {
    const xPos = (spacing * (i + 1)) - (objectWidth / 2);
    interactiveObjects.push({
        x: xPos,
        y: yPos,
        width: objectWidth,
        height: objectHeight,
        color: '#9400d3'
    });
}


//處理滑鼠點擊
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const mouseX = (event.clientX - rect.left) * scaleX;
    const mouseY = (event.clientY - rect.top) * scaleY;

    player.targetX = mouseX;
    player.targetY = mouseY;
});



//鍵盤移動處理函式
function handleKeyboardMovement() {
    let movedByKeyboard = false;

    // 檢查向上移動的按鍵 (W 或 ↑)
    if (keysPressed['w'] || keysPressed['ArrowUp']) {
        player.y -= player.speed;
        movedByKeyboard = true;
    }
    // 檢查向下移動的按鍵 (S 或 ↓)
    if (keysPressed['s'] || keysPressed['ArrowDown']) {
        player.y += player.speed;
        movedByKeyboard = true;
    }
    // 檢查向左移動的按鍵 (A 或 ←)
    if (keysPressed['a'] || keysPressed['ArrowLeft']) {
        player.x -= player.speed;
        movedByKeyboard = true;
    }
    // 檢查向右移動的按鍵 (D 或 →)
    if (keysPressed['d'] || keysPressed['ArrowRight']) {
        player.x += player.speed;
        movedByKeyboard = true;
    }
    
    // 如果是透過鍵盤移動，就更新滑鼠目標點，防止衝突
    if (movedByKeyboard) {
        player.targetX = player.x;
        player.targetY = player.y;
    }
}


//核心遊戲迴圈
function gameLoop() {
    //清除上一幀的畫面
    context.clearRect(0, 0, canvas.width, canvas.height);
    //優先處理鍵盤移動
    handleKeyboardMovement();

    //處理滑鼠點擊的移動
    const dx = player.targetX - player.x;
    const dy = player.targetY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > player.speed) {
        player.x += (dx / distance) * player.speed;
        player.y += (dy / distance) * player.speed;
    } else if (distance > 0) {
        //如果距離很近，就直接到位，避免抖動
        player.x = player.targetX;
        player.y = player.targetY;
    }

    //新增邊界檢測，防止玩家跑出畫布
    const halfWidth = player.width / 2;
    const halfHeight = player.height / 2;
    if (player.x - halfWidth < 0) player.x = halfWidth;
    if (player.x + halfWidth > canvas.width) player.x = canvas.width - halfWidth;
    if (player.y - halfHeight < 0) player.y = halfHeight;
    if (player.y + halfHeight > canvas.height) player.y = canvas.height - halfHeight;


    //繪製物件
    interactiveObjects.forEach(interactiveObject => {
        context.fillStyle = interactiveObject.color;
        context.fillRect(interactiveObject.x, interactiveObject.y, interactiveObject.width, interactiveObject.height);
    });

    // 繪製玩家
    context.fillStyle = player.color;
    context.fillRect(player.x - halfWidth, player.y - halfHeight, player.width, player.height);


    //碰撞偵測與互動
    let interacting = false;
    interactiveObjects.forEach((obj, index) => {
        if (
            player.x > obj.x && player.x < obj.x + obj.width &&
            player.y > obj.y && player.y < obj.y + obj.height
        ) {
            if(messageTemplates[index+1]) {
                messageBox.innerHTML = messageTemplates[index+1].innerHTML;
            }
            interacting = true;
        }
    });

    //如果沒有跟任何物件互動，就顯示預設訊息
    if (!interacting) {
        messageBox.innerHTML = messageTemplates[0].innerHTML;
    }

    //請求瀏覽器在下一次重繪前呼叫gameLoop函數
    requestAnimationFrame(gameLoop);
}

//啟動遊戲迴圈
gameLoop();