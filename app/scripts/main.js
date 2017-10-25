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

    // fetch 2 words to always have something to type
    self.fetchWord()
    self.fetchWord()
  }

  // Use Wordnik API to fetch words
  // http://www.wordnik.com/
  self.fetchWord = function () {
    const minLen = 3
    const maxLen = 8

    $.ajax({
        url: `http://api.wordnik.com:80/v4/words.json/randomWord?hasDictionaryDef=false&minCorpusCount=0&maxCorpusCount=-1&minDictionaryCount=1&maxDictionaryCount=-1&minLength=${minLen}&maxLength=${maxLen}&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5`
      })
      .done(function (data) {
        // Satanize the word fetched to escape special chars
        var word = data.word
        word = word.replace(/\W/g, '')
        gameInput.addWord(word)
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
  self.addWord = function (word) {
    if (word && typeof word == "string") {
      self.wordsToAvoid.push(new Word(word, self.uniqId++))
    } else {
      console.error("Wrong input: ", word)
    }
  }

  // Delete the first word on self.wordsToAvoid
  self.deleteFirstWord = function () {

    self.computeScore()

    // Delete
    self.wordsToAvoid.shift()

  }

  self.computeScore = function () {

    // Compute time taken
    let w = self.wordsToAvoid[0]
    let timeTaken = w.endTimecode - w.startTimecode
    timeTaken = Math.round(timeTaken)
    let seconds = (timeTaken / 1000).toFixed(2)

    // Compute score
    let len = w.text.length

    // average char per seconds
    const avgTypingSpeed = 200 / 60

    /// TODO

    let score = timeTaken / l
    score = Math.round(score)
    self.score += score


    // Display the time
    $('#time-taken').text(seconds + " secs")
    $('#score').text("Score: " + self.score)
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
    /// Hardcoded parent ///
    parent: gameInput,
    logic: gameLogic,
  }

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
        self.logic.fetchWord()
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