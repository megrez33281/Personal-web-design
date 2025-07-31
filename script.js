//初始化設定
const canvas = document.getElementById('game-canvas');
const context = canvas.getContext('2d');

//獲取訊息框的元素
const messageTitleEl = document.getElementById('message-title');
const messageContentEl = document.getElementById('message-content');


// 設定畫布的解析度
// 讓畫布的內部繪圖尺寸等於其在 CSS 中顯示的尺寸
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;


//遊戲物件定義
// 像素小人
const player = {
    x: 50,
    y: canvas.height - 60, //初始位置在左下角
    width: 30,
    height: 30,
    color: '#e60073', //一個鮮豔的顏色
    speed: 3,
    targetX: 50, // 目標位置
    targetY: canvas.height - 60
};

//互動物件
const interactiveObjects = [
    {
        x: 200, y: canvas.height - 100, width: 50, height: 50, color: '#9400d3',
        title: '關於我 (About Me)',
        content: '你好！我是一位熱愛創造與設計的開發者。這個網站是我用來展示作品與分享想法的小天地。'
    },
    {
        x: 400, y: canvas.height - 150, width: 50, height: 50, color: '#9400d3',
        title: '我的作品集 (Portfolio)',
        content: '這裡放置了我的精選作品，包含網頁設計、應用程式開發與一些有趣的小專案。每一個專案都代表了我的熱情與努力。'
    },
    {
        x: 600, y: canvas.height - 80, width: 50, height: 50, color: '#9400d3',
        title: '聯絡方式 (Contact)',
        content: '很高興你逛到這裡！如果有任何合作邀約或想聊聊，可以透過 example@email.com 與我聯繫。期待你的來信！'
    }
];

//處理滑鼠點擊
canvas.addEventListener('click', (event) => {
    //獲取滑鼠在canvas內的相對座標
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const mouseX = (event.clientX - rect.left) * scaleX;
    const mouseY = (event.clientY - rect.top) * scaleY;

    //設定玩家的移動目標
    player.targetX = mouseX;
    player.targetY = mouseY;
});


//核心遊戲迴圈
function gameLoop() {
    //清除上一幀的畫面
    context.clearRect(0, 0, canvas.width, canvas.height);

    //移動玩家
    //計算玩家到目標的距離
    const dx = player.targetX - player.x;
    const dy = player.targetY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    //如果玩家到目標的距離大於玩家速度，就繼續移動
    if (distance > player.speed) {
        // 移動玩家
        player.x += (dx / distance) * player.speed;
        player.y += (dy / distance) * player.speed;
    }

    //繪製物件
    //繪製所有紫色互動方塊
    interactiveObjects.forEach(interactiveObject => {
        context.fillStyle = interactiveObject.color;
        context.fillRect(interactiveObject.x, interactiveObject.y, interactiveObject.width, interactiveObject.height);
    });

    // 繪製玩家
    context.fillStyle = player.color;
    context.fillRect(player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);


    //碰撞偵測與互動
    let interacting = false;
    interactiveObjects.forEach(obj => {
        //簡單的矩形碰撞偵測
        if (
            player.x > obj.x && player.x < obj.x + obj.width &&
            player.y > obj.y && player.y < obj.y + obj.height
        ) {
            //發生碰撞，更新訊息框內容
            messageTitleEl.textContent = obj.title;
            messageContentEl.textContent = obj.content;
            interacting = true;
        }
    });

    //如果沒有跟任何物件互動，就顯示預設訊息
    if (!interacting) {
        messageTitleEl.textContent = '歡迎來到我的世界！';
        messageContentEl.textContent = '試著在下方區域移動，探索看看吧！點擊滑鼠可以指定移動的目的地。';
    }


    //請求瀏覽器在下一次重繪前呼叫gameLoop函數
    requestAnimationFrame(gameLoop);
}

//啟動遊戲迴圈
gameLoop();