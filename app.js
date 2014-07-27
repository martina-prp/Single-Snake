"use strict";

var canvas = document.getElementById('canvas'),
    context = canvas.getContext('2d');
var canvasWidth = $('#canvas').width();
var canvasHeight = $('#canvas').height();
var color = '';
var gameLoopIntervalId,
    food={},
    gamePaused = false,
    reversed = false;

var snake = (function(context) {
  var tail = [];
  var direction = "right";

  [1, 2, 3].forEach(function(i) {
    tail.push(new Pixel(i, 1, 10, color, context));
  });
  var head = tail[tail.length - 1];

  var print = function() {
    tail.forEach(function(p) {
      p.print();
    })
  };

  var move = function() {
    switch(direction) {
      case "up":
        var new_head = new Pixel(head.x, head.y - 1, 10, color,context);
        break;
      case "down":
        var new_head = new Pixel(head.x, head.y + 1, 10, color, context);
        break;
      case "left":
        var new_head = new Pixel(head.x - 1, head.y, 10, color, context);
        break;
      case "right":
        var new_head = new Pixel(head.x + 1, head.y, 10, color, context);
        break;
    }
    tail.push(new_head);
    tail.shift();
    head = new_head;
  }

  var setDirection = function(dir) {
    if(dir === "left" && direction === "right" || dir === "right" && direction === "left" || dir === "up" && direction === "down" || dir === "down" && direction === "up" ) {
      return false;
    }
    else {
      direction = dir;
    }
  };

  var get_head = function() {
    return head;
  };

  var check_snake_collision = function() {
    var t = tail.slice(0, tail.length-1);
    var collision = t.some(function(element) {
      return (head.x === element.x && head.y === element.y)
    });
    if (collision) {
      game_over();
    }
  }

  var check_borders = function() {
    if (head.x < 0 || head.x >= canvasWidth/10 || head.y < 0 || head.y >= canvasHeight/10) {
      game_over();
    }
  };

  var check_food = function() {
    var score = parseInt($('#snake-score').text());
    if (head.x === food.x && head.y === food.y) {
      tail.unshift(food);
      head = food;
      score += 1;
      $('#snake-score').text(score);
      food = new Food(10, context);
      food.generateNewPosition();
      food.print();
    }
  }

  var game_over = function() {
    clearInterval(gameLoopIntervalId);
    context.font = '40pt Arial';
    context.strokeStyle = 'white';
    context.textAlign = 'center';
    context.strokeText('GAME OVER!', canvasWidth/2, canvasHeight/2);

    var score = $('#snake-score').text();
    var name = prompt('Save score with name? If your name exists the score will be updated if it is better :)');
    if (name) {
      var tempData = localStorage.getItem('snake-game'),
          data = [];
      if (tempData) {
        data = JSON.parse(tempData);
      }
      var isExisting = data.some(function(element) {
        if (element.name === name && parseInt(element.score) <= score) {
          element.score = score;
          return true;
        }
        else {
          return false;
        }
      });
      if (!isExisting) {
        data.push({
          name: name,
          score: score
        });
      }
      else {
        alert('Your score is updated!');
      }
      localStorage.setItem('snake-game', JSON.stringify(data));
    }
  }

  var reverse = function (coord) {
  switch(direction) {
    case "up":
      var new_head = new Pixel(coord.x, coord.y + 1, 10, color,context);
      direction = "down";
      break;
    case "down":
      var new_head = new Pixel(coord.x, coord.y - 1, 10, color, context);
      direction = "up";
      break;
    case "left":
      var new_head = new Pixel(coord.x + 1, coord.y, 10, color, context);
      direction = "right";
      break;
    case "right":
      var new_head = new Pixel(coord.x - 1, coord.y, 10, color, context);
      direction = "left";
      break;
    }
    return new_head;
  }

  var reverseSnake = function() {
    var new_head = reverse(tail[0]);
    if (!reversed) {
      tail.unshift(new_head);
      tail.pop();
      reversed= true;
    }
    else {
      tail.push(new_head);
      tail.shift();
      reversed = false;
    }
    head = new_head;
  }

  return {
    print: print,
    move: move,
    setDirection: setDirection,
    get_head: get_head,
    check_borders: check_borders,
    check_food: check_food,
    check_snake_collision: check_snake_collision,
    reverseSnake: reverseSnake
  };

}(context));

initKeyController(function(direction){
  snake.setDirection(direction);
});

function initKeyController(cb) {
  var keyCodeToDirectionTable = {
    37: "left",
    38: "up",
    39: "right",
    40: "down"
  };

  $(document).keydown(function(e) {
    if(keyCodeToDirectionTable[e.which]) {
      e.preventDefault();
      cb(keyCodeToDirectionTable[e.which]);
    }
  })
}

function pauseGame() {
  if (!gamePaused) {
    gameLoopIntervalId = clearInterval(gameLoopIntervalId);
    gamePaused = true;
  }
  else {
    var speed = $('#snake-speed').val();
    gameLoopIntervalId = setInterval(gameLoop, speed);
    gamePaused = false;
  }
}

$('#snake-speed').on('change', function() {
  $('#speed').val($(this).val());
});

function gameLoop() {
  context.clearRect(0, 0, canvasWidth, canvasHeight);
  snake.print();
  snake.move();
  food.print();
  snake.check_snake_collision();
  snake.check_borders();
  snake.check_food();
}

$('.start-game').on('click', function(event) {
  event.preventDefault();
  $(this).attr('disabled', 'disabled');
  var speed = $('#snake-speed').val();
  food = new Food(10, context);
  food.generateNewPosition();
  color = $('#snake-color').val();
  gameLoopIntervalId = setInterval(gameLoop, speed);

  $(document).keydown(function(e) {
    if (e.keyCode == 80) {
      e.preventDefault();
      pauseGame();
    }
    if (e.keyCode == 82) {
      e.preventDefault();
      snake.reverseSnake();
    }
  });

  $('input[name="pause-op"]').on('change', function() {
    pauseGame();
  });

  $('input[name="reverse-op"').on('change', function() {
    snake.reverseSnake();
  });
});

$('.top-chart').on('click', function() {
  var data = localStorage.getItem('snake-game');
  data = JSON.parse(data);
  data.sort(function(a, b) {
    return parseInt(b.score) - parseInt(a.score);
  })
  var results = data.slice(0, 9);
  var topChartTpl = $('#top-chart-results-tpl').html();
  var template = Handlebars.compile(topChartTpl);
  var html = template({results: data});
  $('.top-chart-results').append(html);
});

function Pixel(x, y, size, color, context) {
  this.x = x;
  this.y = y;
  this.size = size;
  this.color = color;
  this.context = context;

  this.print = function() {
    this.context.fillStyle = this.color;
    this.context.fillRect(this.x*this.size, this.y*this.size, this.size, this.size);
  }
}

function Food(size, context) {
  this.size = size;
  this.context = context;

  this.generateNewPosition = function() {
    this.x = Math.round(Math.random() * (canvasWidth - this.size) / this.size);
    this.y = Math.round(Math.random() * (canvasHeight - this.size) / this.size);
    //this.color = "#" + (Math.round(Math.random() * 0XFFFFFF)).toString(16);
  }

  this.print = function() {
    //this.context.fillStyle = this.color;
    //this.context.fillRect(this.x*this.size, this.y*this.size, this.size, this.size);
    var img = document.getElementById("snake-food");
    this.context.drawImage(img, this.x*this.size, this.y*this.size, this.size, this.size);
  }
}
