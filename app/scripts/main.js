var WORDS = []

$(document).ready(function () {

  var granimInstance = new Granim({
    element: '#canvas-1',
    name: 'basic-gradient',
    direction: 'left-right',
    opacity: [1, 1],
    isPausedWhenNotInView: true,
    states: {
      "default-state": {
        gradients: [
                ['#AA076B', '#61045F'],
                ['#02AAB0', '#00CDAC'],
                ['#DA22FF', '#9733EE']
            ]
      }
    }
  });

  var triggerTimer = 0
    // var triggerTimer = 2000
    /// Trigger the introduction animation on the first Click
  $('.canvas-interactive-wrapper button')
    .click(function () {
      $(this).hide()
        .prev()
        .text('Go !')
        .animate({
          opacity: 0,
          "margin-top": "-=1000"
        }, triggerTimer, function () {
          /// Animation is complete
          $('.game').slideDown()
          gameLogic.start()
        })
    })
    .click()

  $('#game-text-input').on('keyup', function (e) {
    gameInput.onInput(e)
    return false
  })

})

function GameLogic() {
  var self = {}

  self.running = false
  self.input = null
    // Start the game
  self.start = function () {
    self.running = true

    // fetch 500 words to always have something to type
    self.fetchWord()
  }

  // Use Wordnik API to fetch words
  // http://www.wordnik.com/
  self.fetchWord = function () {
    const minLen = 3
    const maxLen = 8
    const limit = 500

    $.ajax({
        url: `http://api.wordnik.com:80/v4/words.json/randomWords?hasDictionaryDef=false&minCorpusCount=0&maxCorpusCount=-1&minDictionaryCount=1&maxDictionaryCount=-1&minLength=${minLen}&maxLength=${maxLen}&limit=${limit}&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5`
      })
      .done(function (data) {
        // Satanize the word fetched to escape special chars
        data.forEach(function (obj) {
          var word = obj.word
          word = word.replace(/\W/g, '')
          WORDS.push(word)
        })

        gameInput.addWord()
      })
  }

  return self
}

function GameInput() {
  var self = {
    selector: "#game-text-input",
    wordsToAvoid: [],
    timeTaken: [],
    uniqId: 0,
    score: 0,
  }


  // Input handler called every time a key is pressed
  self.onInput = function (e) {
    let value = String.fromCharCode(e.which)

    // Try to attack the first word stored using the letter pressed
    self.wordsToAvoid[0].attack(value)
  }

  // Add a new word
  self.addWord = function () {
    var word = getRandomArrayElement(WORDS)
    self.wordsToAvoid.push(new Word(word, self.uniqId++))
    animateBar(self.wordsToAvoid[0].avgTime)
  }

  // Delete the first word on self.wordsToAvoid
  self.deleteFirstWord = function () {

    self.computeScore()
    self.addWord()
      // Delete
    self.wordsToAvoid.shift()

  }

  self.computeScore = function () {

    // Compute time taken
    let w = self.wordsToAvoid[0]
    let timeTaken = w.endTimecode - w.startTimecode
    timeTaken = Math.round(timeTaken)
    let seconds = Number((timeTaken / 1000).toFixed(2))

    // Compute score
    let len = w.text.length
    let delta = seconds - w.avgTime


    // HARDCODED multiplier
    const MULTIPLIER = 10
    let score = 1
    if (delta < 0) {
      score += (-delta) * MULTIPLIER
      score = Math.round(score)
      throwText("+" + score)
    }
    score = Math.round(score)
    self.score += score


    // Display the time
    $('#time-taken').text(seconds + " secs")
    $('#score').text("Score: " + self.score)
  }

  // Animate Progress bar
  self.$bar = $('#bar')


  function animateBar(time) {
    clearInterval(self.id)
    time = time * 1000 // Time in milliseconds
    const TIME_INTERVAL = 100
    const NB_INTERVAL = time / TIME_INTERVAL
    let width = 100
    let decrementValue = width / NB_INTERVAL
    self.id = setInterval(function frame() {
      if (width <= 0) {
        clearInterval(self.id)
      } else {
        width -= decrementValue
        self.$bar.css('width', width + '%')
      }
    }, TIME_INTERVAL);
  }

  gameLogic.input = self
  return self
}

function Word(text, id) {

  var self = {
    text: text || "unknown",
    DOM_selector: '.word-list',
    id: id,
    nextCharId: 0,
    startTimecode: performance.now(),
    endTimecode: undefined,
    avgTime: undefined,
    /// Hardcoded parent ///
    parent: gameInput,
    logic: gameLogic,
  }

  /// Compute it's avgTime
  const avgTypingSpeed = 1 / (200 / 60)
  const EASIER = 1.5
  self.avgTime = (self.text.length * avgTypingSpeed) + EASIER

  /// Graphical interface
  $(self.DOM_selector).append(`<li id=${id} >${text}</li>`)
  self.update = function () {

    // Change the word using the substring function
    $(`${self.DOM_selector} #${self.id}`).text(self.text.substr(self.nextCharId))
  }
  self.delete = function () {
    $(`${self.DOM_selector} #${self.id}`).remove()
  }

  /// Logic

  // Remove the first letter if it is the right one
  self.attack = function (letter) {

    /// Check if the input fit
    if (!letter || typeof letter != "string") {
      return
    }

    /// Check if the given letter is the right one
    if (letter.toLowerCase() === self.text.charAt(self.nextCharId).toLowerCase()) {
      self.nextCharId++;
      if (self.nextCharId == self.text.length) {
        // Delete the word
        self.endTimecode = performance.now()
        self.parent.deleteFirstWord()
        self.delete()
      } else {
        self.update()
      }
    }
  }


  return self
}

var gameLogic = new GameLogic()
var gameInput = new GameInput()



/* HELPERS */
function getRandomArrayElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
var Text = {
  queue: [],
  throwText: function (text = "0x") {
    this.queue.push(text)
    this.dequeue()
  },
  run: function (text = "0x") {
    var id = new Date()
    id = id.getTime()
    $('body')
      .append("<span class='throwText' id='" + id + "'>" + text + "</div>")
    $('#' + id)
      .css('color', getRandomColor())
      .css('font-size', 80 + randInt(-30, 30))
    setTimeout(function () {
      $('#' + id)
        .remove()
    }, 700)
  },
  dequeue: function () {
    if (this.queueing) {
      return
    }
    this.queueing = true
    var self = this
    this.id = setInterval(function () {
      var t = self.queue.shift()
      if (!t) {
        self.queueing = false
        clearInterval(self.id)
      } else {
        self.run(t)
      }
    }, 300)
  },
  stop: function () {
    this.queue = []
  }
}

function throwText(text = "0x") {
  Text.throwText(text)
}

function randInt(min = 0, max = 1) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}