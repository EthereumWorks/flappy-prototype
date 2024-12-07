const config = {
  type: Phaser.AUTO,
  width: 360,
  height: 640,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 500 },
      debug: true,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);

// Переменные
let playerWidth = 30; // Ширина игрока
let playerHeight = 30; // Высота игрока
let playerJumpVelocity = -200; // Сила прыжка игрока

let player;
let gameOver = false;
let screenScrolling = true; // Управление скроллингом экрана
let obstaclesGroup; // Группа препятствий
let modifiersGroup; // Группа модификаторов

let backgroundStripes = [];
let gameOverText, playAgainButton; // UI элементы
let nest; // Гнездо
let dangerZone; // Черный блок под гнездом
let pole; // шест гнезда
let levelComplete = false; // Завершение уровня
const SCROLL_SPEED = 4; // Скорость прокрутки
const ROTATION_SPEED = 5; // Коэффициент изменения угла

let coinCount = 0; // Счетчик монет
let coinText; // Текст для отображения счета
let coinsGroup; // Группа монет

let initialNestWidth = 100; // Изначальная ширина гнезда
let nestWidth = initialNestWidth; // Текущая ширина гнезда

function preload() {
  this.load.json('level1', 'data/level1.json'); // Загрузка уровня
}

function create() {
  gameOver = false;
  levelComplete = false;
  screenScrolling = true;

  resetBackground();
  createScrollingBackground(this);

  obstaclesGroup = this.physics.add.staticGroup();
  coinsGroup = this.physics.add.staticGroup();
  modifiersGroup = this.physics.add.staticGroup();

  const levelData = this.cache.json.get('level1');
  levelData.obstacles.forEach(obstacle => createObstacle(this, obstacle));
  levelData.coins.forEach(coin => createCoin(this, coin));
  levelData.modifiers.forEach(modifier => createModifier(this, modifier)); // Добавляем создание модификаторов

  const playerRect = this.add.rectangle(50, config.height / 2, playerWidth, playerHeight, 0xff0000);
  this.physics.add.existing(playerRect);
  player = playerRect;
   player.body.setCollideWorldBounds(true); // Включаем столкновение с краями игрового мира
   player.body.onWorldBounds = true; // Активируем генерацию событий при столкновении с краями
 

  createNest(this, levelData.nest);

  this.physics.add.overlap(player, coinsGroup, collectCoin, null, this);
  this.physics.add.overlap(player, modifiersGroup, applyModifier, null, this); // Обрабатываем модификаторы
  
  this.physics.add.collider(player, obstaclesGroup, () => handlePlayerCollision(this));

  coinText = this.add.text(10, 10, `Coins: ${coinCount}`, {
    fontSize: '20px',
    color: '#FFD700',
  });

  gameOverText = this.add.text(config.width / 2, config.height / 2 - 50, 'Game Over', {
    fontSize: '32px',
    color: '#ff0000',
  }).setOrigin(0.5).setVisible(false);

  playAgainButton = this.add.text(config.width / 2, config.height / 2 + 50, 'Play Again', {
    fontSize: '24px',
    color: '#ffffff',
    backgroundColor: '#000000',
    padding: { x: 10, y: 5 },
  }).setOrigin(0.5).setInteractive().setVisible(false);

  playAgainButton.on('pointerdown', () => {
    coinCount = 0; // Сбрасываем счетчик монет
    coinText.setText(`Coins: ${coinCount}`); // Обновляем текст
    nestWidth = initialNestWidth; // Возвращаем ширину гнезда к стандартному значению
    this.scene.restart();
  });

  this.input.on('pointerdown', () => {
    if (!gameOver) {
      player.body.setVelocityY(playerJumpVelocity); // Прыжок
    }
  });

  // Обработчик для столкновений с краями
  this.physics.world.on('worldbounds', (body, up, down, left, right) => {
    if (body.gameObject === player) { // Проверяем, что это игрок
      if (!gameOver) handleGameOver(this);
    }
  });
}

function handlePlayerCollision(scene) {
  if (gameOver) return;

  // Устанавливаем вертикальное ускорение для падения
  player.body.setVelocityY(300); // Падение вниз с постоянной скоростью
  player.body.setGravityY(800); // Увеличиваем силу притяжения
  
  // Фиксируем игрока, чтобы он не мог прыгать
  //gameOver = true;
  handleGameOver(scene);
  // Отключаем горизонтальное движение
  //player.body.setVelocityX(0);
  // Отключаем ввод пользователя
  //scene.input.off('pointerdown'); 

}

function getModifierSymbol(effect) {
  switch (effect) {
    case 'enlarge':
      return 'x';
    case 'slow':
      return 'S';
    case 'duplicate':
      return '+';
    default:
      return '?'; // Неизвестный модификатор
  }
}

function createModifier(scene, modifierData) {
  const modifier = scene.add.rectangle(
    modifierData.x,
    modifierData.y,
    modifierData.width,
    modifierData.height,
    Phaser.Display.Color.HexStringToColor(modifierData.color).color
  );

  modifier.alpha = 0.5; // Устанавливаем полупрозрачность

  // Добавляем текст поверх модификатора
  const symbol = getModifierSymbol(modifierData.effect); // Получаем символ для эффекта
  const text = `${symbol}${modifierData.value}`; // Формируем текст с параметром
  const textStyle = {
    fontSize: '16px',
    color: '#FFFFFF',
    align: 'center',
  };
  const modifierText = scene.add.text(modifierData.x, modifierData.y, text, textStyle).setOrigin(0.5);

  // Привязываем текст к модификатору
  modifier.text = modifierText;

  scene.physics.add.existing(modifier, true);
  modifier.effect = modifierData.effect; // Добавляем эффект в объект модификатора
  modifier.value = modifierData.value; // Добавляем значение параметра в объект модификатора
  modifiersGroup.add(modifier); // Добавляем в группу модификаторов
}

function applyModifier(player, modifier) {
  /*
  switch (modifier.effect) {
    case 'enlarge':
      playerWidth += 10;
      playerHeight += 10;
      player.setSize(playerWidth, playerHeight);
      player.body.setSize(playerWidth, playerHeight);
      break;
    case 'slow':
      SCROLL_SPEED -= 1;
      if (SCROLL_SPEED < 1) SCROLL_SPEED = 1; // Минимальная скорость
      break;
    case 'duplicate':
      coinCount += 2; // Добавляем две монеты
      coinText.setText(`Coins: ${coinCount}`);
      break;
    default:
      console.warn('Unknown modifier effect:', modifier.effect);
  }
  */

  // Удаляем текст модификатора, если он существует
  if (modifier.text) {
    modifier.text.destroy();
  }

  modifier.destroy(); // Удаляем модификатор после применения
}

function update() {
  if (gameOver || levelComplete) return;

  if (screenScrolling) {
    // Проверяем, достигло ли гнездо середины экрана
    if (nest && nest.x <= config.width * 0.75 ) {
      stopScreenScrolling();
      // Запускаем движение игрока вправо
      player.body.setVelocityX(SCROLL_SPEED * 60);
    }

    // Скроллинг экрана
    scrollBackground();
    scrollObstacles();
    scrollNest();
  } else {
    // Проверяем движение игрока к гнезду
    movePlayerToNest();
  }

  // Наклон игрока
  handlePlayerRotation();
}


function scrollNest() {
  if (nest) {
    // Перемещаем гнездо
    nest.x -= SCROLL_SPEED;

    if (nest.body) {
      nest.body.updateFromGameObject(); // Синхронизируем физическое тело с визуальным объектом
    }

    // Если dangerZone существует, перемещаем его вместе с nest
    if (dangerZone) {
      dangerZone.x = nest.x; // Синхронизация по X
      if (dangerZone.body) {
        dangerZone.body.updateFromGameObject(); // Синхронизация физического тела dangerZone
      }
    }

    // Если шест (pole) существует, перемещаем его вместе с nest
    if (pole) {
      pole.x = nest.x; // Синхронизация по X
      if (pole.body) {
        pole.body.updateFromGameObject(); // Синхронизация физического тела шеста
      }
    }

    // Удаляем гнездо, если оно выходит за экран (опционально)
    if (nest.x + nest.width / 2 < 0) {
      console.log("Nest went off-screen");
    }
  }
}

function stopScreenScrolling() {
  screenScrolling = false;

  // Останавливаем фоновую прокрутку (фон сам обновляется через scrollBackground)
  backgroundStripes.forEach((stripe) => {
    stripe.x = stripe.x; // Оставляем их в текущем состоянии
  });

  // Останавливаем движение препятствий
  obstaclesGroup.getChildren().forEach((obstacle) => {
    // Мы больше не обновляем их позиции
    obstacle.x = obstacle.x; // Удерживаем текущее положение
  });

  // Останавливаем гнездо
  if (nest) {
    nest.x = nest.x; // Удерживаем текущее положение
  }
}

function movePlayerToNest() {
  if (!nest) {
    console.error('Nest is not defined');
    return;
  }
}

function handleLevelComplete(player, nest) {
  if (!player || !nest) {
    console.error('Player or nest is undefined');
    return;
  }

  levelComplete = true;

  // Останавливаем движение игрока и отключаем гравитацию
  if (player.body) {
    player.body.setVelocity(0, 0); // Останавливаем движение
    player.body.setGravityY(0); // Отключаем гравитацию
    player.body.moves = false; // Отключаем любые перемещения
  }

  // Выводим сообщение об успешном завершении уровня
  this.add.text(config.width / 2, config.height / 2 - 50, 'Level Complete!', {
    fontSize: '32px',
    color: '#00FF00',
  }).setOrigin(0.5);

  // Проверяем существование playAgainButton
  if (playAgainButton) {
    playAgainButton.setVisible(true);
  } else {
    console.warn('playAgainButton is undefined.');
  }
}

function handleGameOver(scene) {
  if (gameOver) return;

  gameOver = true;

  // Отключаем управление игроком
  scene.input.off('pointerdown');

  // Удаляем игрока
  if (player) {
    player.destroy();
    player = null;
  }

  // Показываем текст Game Over и кнопку Play Again
  gameOverText.setVisible(true);
  playAgainButton.setVisible(true);
}

function createScrollingBackground(scene) {
  const colors = [0x87cefa, 0xadd8e6]; // Два оттенка голубого
  const stripeWidth = 60;

  for (let i = 0; i < Math.ceil(config.width / stripeWidth) + 2; i++) {
    const color = colors[i % 2];
    const stripe = scene.add.rectangle(i * stripeWidth, config.height / 2, stripeWidth, config.height, color);
    backgroundStripes.push(stripe);
  }
}

function scrollBackground() {
  backgroundStripes.forEach((stripe) => {
    stripe.x -= SCROLL_SPEED;
    if (stripe.x < -30) {
      stripe.x += backgroundStripes.length * 60;
    }
  });
}

function createNest(scene, nestData) {

  // Создаем основное гнездо (зеленый блок)
  nest = scene.add.rectangle(
    nestData.x,
    nestData.y,
    nestWidth, // Используем динамическую ширину
    nestData.height,
    Phaser.Display.Color.HexStringToColor(nestData.color).color
  );

  scene.physics.add.existing(nest, true); // Создаем статическое тело для гнезда

  // Проверяем, создано ли физическое тело гнезда
  if (!nest.body) {
    console.error('Physics body for nest was not created.');
    return;
  }

  // Создаем черный блок под гнездом
  dangerZone = scene.add.rectangle(
    nestData.x,
    nestData.y + nestData.height, // Под гнездом
    nestWidth, // Используем динамическую ширину
    nestData.height,
    0x000000 // Черный цвет
  );

  scene.physics.add.existing(dangerZone, true); // Создаем статическое тело для dangerZone

  // Создаем вертикальный прямоугольник для шеста
  pole = scene.add.rectangle(
    nestData.x, // Центр шеста совпадает с центром гнезда
    nestData.y + nestData.height * 2 + nestData.y / 2, // Половина высоты dangerZone + ниже гнезда
    nestData.height, // Шест тоньше гнезда
    config.height - (nestData.y + nestData.height), // Высота от dangerZone до низа экрана
    0x000000 // Черный цвет
  );

  scene.physics.add.existing(pole, true); // Создаем статическое тело для шеста

  // Проверяем, создано ли физическое тело dangerZone и шеста
  if (!dangerZone.body || !pole.body) {
    console.error('Physics body for dangerZone or pole was not created.');
    return;
  }

  // Проверяем столкновение игрока с dangerZone
  scene.physics.add.collider(player, dangerZone, () => {
    if (!gameOver) handleGameOver(scene);
  });

  // Проверяем столкновение игрока с шестом
  scene.physics.add.collider(player, pole, () => {
    if (!gameOver) handleGameOver(scene);
  });

  // Проверяем перекрытие игрока с гнездом для завершения уровня
  scene.physics.add.overlap(player, nest, (player, nest) => {
    if (!levelComplete && !gameOver) {
      handleLevelComplete.call(scene, player, nest); // Используем `call` для правильного контекста
    }
  });
}

function collectCoin(player, coin) {
  coin.destroy(); // Удаляем монетку
  coinCount += 1; // Увеличиваем счетчик
  coinText.setText(`Coins: ${coinCount}`); // Обновляем текст
}

function createCoin(scene, coinData) {
  const coin = scene.add.ellipse(
    coinData.x,
    coinData.y,
    20, // Ширина эллипса
    30, // Высота эллипса
    0xFFD700 // Желтый цвет
  );

  scene.physics.add.existing(coin, true); // Создаем статическое тело для монеты
  coinsGroup.add(coin); // Добавляем физическое тело монеты в группу
}

function createObstacle(scene, obstacleData) {
  const obstacle = obstaclesGroup.create(obstacleData.x, obstacleData.y, undefined);
  obstacle.setSize(obstacleData.width, obstacleData.height);
  obstacle.setDisplaySize(obstacleData.width, obstacleData.height);
  obstacle.setOrigin(0.5, 0.5);
  obstacle.setTint(Phaser.Display.Color.HexStringToColor(obstacleData.color).color);
}

function scrollObstacles() {
  obstaclesGroup.getChildren().forEach(obstacle => {
    obstacle.x -= SCROLL_SPEED;
    obstacle.body.updateFromGameObject();

    if (obstacle.x + obstacle.displayWidth / 2 < 0) {
      obstaclesGroup.remove(obstacle, true, true);
    }
  });

  coinsGroup.getChildren().forEach(coin => {
    coin.x -= SCROLL_SPEED;

    if (coin.body) {
      coin.body.updateFromGameObject(); // Синхронизация физического тела
    }

    if (coin.x < -20) {
      coin.destroy();
    }
  });

    // Скроллинг модификаторов
    modifiersGroup.getChildren().forEach(modifier => {
      modifier.x -= SCROLL_SPEED;
    
      if (modifier.body) {
        modifier.body.updateFromGameObject(); // Синхронизация физического тела
      }
    
      // Обновляем позицию текста
      if (modifier.text) {
        modifier.text.x = modifier.x;
        modifier.text.y = modifier.y;
      }
    
      if (modifier.x < -modifier.width / 2) {
        if (modifier.text) {
          modifier.text.destroy(); // Удаляем текст, если модификатор вышел за экран
        }
        modifier.destroy(); // Удаляем модификатор
      }
    });
    
}

function handlePlayerRotation() {
  if (!player || !player.body) return;

  if (player.body.velocity.y < 0) {
    player.angle = Phaser.Math.Clamp(player.angle - ROTATION_SPEED, -30, 30);
  } else if (player.body.velocity.y > 0) {
    player.angle = Phaser.Math.Clamp(player.angle + ROTATION_SPEED, -30, 30);
  }
}

function resetBackground() {
  if (backgroundStripes && backgroundStripes.length) {
    backgroundStripes.forEach((stripe) => stripe.destroy());
  }
  backgroundStripes = [];
}
