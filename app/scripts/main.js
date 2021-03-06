var WORDS = []
var gameLogic, gameInput, timer

$(document).ready(function () {

  var granimInstance = new Granim({
    element: '#canvas-1',
    name: 'basic-gradient',
    direction: 'left-right',
    opacity: [1, 1],
    isPausedWhenNotInView: true,
    states: {
      'default-state': {
        gradients: [
          ['#e1f7d5', '#ffbdbd'],
          ['#ffbdbd', '#c9c9ff'],
          ['#c9c9ff', '#f1cbff'],
          ['#f1cbff', '#e1f7d5'],
        ]
      }
    }
  });

  var triggerTimer = 1500
  /// Trigger the introduction animation on the first Click
  $('#start')
    .click(function () {
      $(this).hide()
        .prev()
        .text('Go !')
        .animate({
          opacity: 0,
          'margin-top': '-=' + (window.innerHeight / 1.5)
        }, triggerTimer, function () {
          /// Animation is complete
          $('.game').slideDown()
          gameLogic.start()
        })
    })
  //.click()

  $('body').on('keydown', function (e) {
    gameInput.onInput(e)
  })

  // Link input changes to the difficulty tab
  $('#difficulty input').on('input', function (e) {
    let diff = $(this).val()
    $('span#diff').text("Difficulty: " + diff)
    gameInput.setDifficulty(diff)
  })

  // Button pause logic
  $('#pause').click(() => {
    gameLogic.pause()
  })

  /*
  NOT IMPLEMENTED
  $('#modifiers button').each(function (button) {
		$(this).text($(this).text() + " | " + $(this).attr("data-price") + "$")
		$(this).click(function (e) {
			if (gameInput.score < $(this).attr("data-price")) {
				throwText("Not enough money !!!")
			} else {
				gameInput[$(this).attr("id")]()
				gameInput.score -= $(this).attr("data-price")
				gameInput.displayScore()
				$(this).fadeOut(100)
				throwText("Modifier Bought !!!")
			}
		})
	})

  */

  $('#replay').click(() => {
    initGame()
    $('.game-over').slideToggle()
    $('#start')
      .show()
      .prev()
      .text('Select difficulty and press Start')
      .animate({
        opacity: 1,
        marginTop: '0'
      }, triggerTimer)
    $('#difficulty, #pause, #modifiers').slideToggle()
  })


})

function GameLogic() {
  var self = {
    running: false,
    input: null,
    paused: false,
  }

  // Start the game
  self.start = function () {
    self.running = true

    // fetch 500 words to always have something to type
    $('.loading').show()
    self.fetchWord(function () {
      timer.start()
      $('.loading').hide()
    })


    // Hide Diff
    // Show Pause
    // Show Modifiers 
    $('#difficulty, #pause, #modifiers').slideToggle()

    // Clean up
    $('#word-list li').remove()
  }

  // Pause or UnPause the game
  self.pause = function () {
    timer.pause()
    if (!self.paused) {
      $('#pause').text("Unpause")
    } else {
      $('#pause').text("Pause")
    }
    self.paused = !self.paused
  }

  // Game over
  self.gameOver = function () {
    $('#word-list li').remove()
    $('#word-list .game-over').show()
    self.input.endBar()
    self.running = false
  }

  // Use Wordnik API to fetch words
  // http://www.wordnik.com/
  self.fetchWord = function (cb) {
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
        cb()
      })
  }


  return self
}

function GameInput() {
  var self = {
    selector: '#word-list',
    wordsToAvoid: [],
    timeTaken: [],
    uniqId: 0,
    score: 200,
    difficulty: 4,
    combo: 0,
    comboMultiplier: 1,
  }


  // Input handler called every time a key is pressed
  self.onInput = function (e) {
    if (gameLogic.paused || gameLogic.running == false) {
      return
    }
    let value = String.fromCharCode(e.which)

    // Try to attack the first word stored using the letter pressed
    self.wordsToAvoid[0].attack(value)
  }

  // Add a new word
  self.addWord = function () {
    var word = getRandomArrayElement(WORDS)
    self.wordsToAvoid.push(new Word(word, self.uniqId++))
    self.animateBar(self.wordsToAvoid[0].avgTime)
  }

  // Delete the first word on self.wordsToAvoid
  self.deleteFirstWord = function () {

    self.computeCombo()
    self.computeScore()
    self.addWord()
    // Delete
    self.wordsToAvoid.shift()

  }

  self.computeCombo = function () {
    let w = self.wordsToAvoid[0]
    if (w.errors != 0) {
      self.combo = 0
    } else {
      self.combo++
    }
    self.comboMultiplier = Math.pow(1.15, self.combo)
    self.comboMultiplier = Number(self.comboMultiplier.toFixed(2))
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
    // Depends on the difficulty
    const MULTIPLIER = map(self.difficulty, 1, 10, 2, 20)
    let score = 1
    if (delta < 0) {
      score += (-delta) * MULTIPLIER
      score = Math.round(score)
      throwText('+' + score)
    } else {
      self.combo = 0
      self.comboMultiplier = 1
    }

    // Compute errors
    const ERR_MULTIPLIER = 5
    let errors = w.errors
    score -= errors * ERR_MULTIPLIER

    // Compute combo
    score *= self.comboMultiplier

    // Fix score
    score = Math.round(score)
    self.score += score

    // Display the time
    self.displayScore()
    $('#time-taken').text(seconds + 's')
  }

  self.displayScore = function () {
    $('.score').text(self.score)
    if (self.comboMultiplier > 1) {
      throwText(self.comboMultiplier + "x")
    }
  }

  self.animateError = function () {
    if (self.isAnimating)
      return

    self.isAnimating = true
    $(self.selector).addClass('error-animation')
    setTimeout(function () {
      $(self.selector).removeClass('error-animation')
      self.isAnimating = false
    }, 200)
  }

  self.setDifficulty = function (diff) {
    self.difficulty = diff
  }

  // MODIFIERS
  /*
  NOT IMPLEMENTED
  self.twoWords = function () {
		console.log('coucou')
	}
  */


  // Animate Progress bar
  self.$bar = $('#bar')

  self.animateBar = function (time) {
    clearInterval(self.id)
    time = time * 1000 // Time in milliseconds
    const TIME_INTERVAL = 100
    const NB_INTERVAL = time / TIME_INTERVAL
    let width = 100
    let decrementValue = width / NB_INTERVAL
    self.id = setInterval(function frame() {
      if (gameLogic.paused) {
        return
      }
      if (width <= 0) {
        clearInterval(self.id)
      } else {
        width -= decrementValue
        self.$bar.css('width', width + '%')
      }
    }, TIME_INTERVAL);
  }

  self.endBar = function () {
    clearInterval(self.id)
    self.$bar.css('width', '0')
  }

  self.displayScore()
  gameLogic.input = self
  return self
}

function Word(text, id) {

  var self = {
    text: text || 'unknown',
    DOM_selector: '#word-list',
    id: id,
    nextCharId: 0,
    startTimecode: performance.now(),
    endTimecode: undefined,
    avgTime: undefined,
    errors: 0,
    /// Hardcoded parent ///
    parent: gameInput,
    logic: gameLogic,
  }

  /// Compute it's avgTime
  const avgTypingSpeed = 1 / (200 / 60)
  const EASIER = map(self.parent.difficulty, 1, 10, 2, -0.5)
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
    if (!letter || typeof letter != 'string') {
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
    } else {
      /// It is not the right letter, hence it is an error
      self.errors++;
      // Animate the error
      self.parent.animateError()

    }
  }


  return self
}

function Timer() {
  return {
    time: 60000,
    milliseconds: 0,
    seconds: 0,
    selector: "#timer",
    interval: undefined,
    paused: false,
    stopped: false,
    start() {
      var n = 10
      this.interval = setInterval(() => {
        if (!this.paused && !this.stopped) {
          this.time -= n
          this.format()
          this.display()
        }
        if (this.time <= 0) {
          this.stop()
        }
      }, n)
    },
    display() {
      let s = this.toFixed(2, this.seconds)
      let mm = this.toFixed(2, this.milliseconds / 10)
      $(this.selector).text(`${s}:${mm}`)
    },
    format() {
      this.seconds = Math.round(this.time / 1000)
      this.milliseconds = this.time % 1000
    },
    toFixed(n, val) {
      if (val < Math.pow(10, n - 1)) {
        return "0" + String(val)
      } else {
        return val
      }
    },
    pause() {
      this.paused = !this.paused
    },
    stop() {
      this.stopped = true
      gameLogic.gameOver()
      clearInterval(this.interval)
    }
  }
}

function initGame() {
  gameLogic = new GameLogic()
  gameInput = new GameInput()
  timer = new Timer()
}
initGame()
