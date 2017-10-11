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
  })
})

function GameLogic() {
  var self = {}

  self.running = false
    // Start the game
  self.start = function () {
    self.running = true
  }

  return self
}

function GameInput() {
  var self = {}

  self.currentText = ""
  self.onInput = function (e) {
    console.log(e.key)
  }


  return self
}


var gameLogic = new GameLogic()
var gameInput = new GameInput()