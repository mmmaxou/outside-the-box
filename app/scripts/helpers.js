/* HELPERS */
function getRandomArrayElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
var Text = {
  queue: [],
  throwText: function (text = '0x') {
    this.queue.push(text)
    this.dequeue()
  },
  run: function (text = '0x') {
    var id = new Date()
    id = id.getTime()
    $('body')
      .append('<span class=\'throwText\' id=\'' + id + '\'>' + text + '</div>')
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

function throwText(text = '0x') {
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