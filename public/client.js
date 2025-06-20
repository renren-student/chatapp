function main() {
  const host = location.origin.replace(/^http/, 'ws')
  const ws = new WebSocket(host + '/ws')

  const myId = self.crypto.randomUUID().substr(0, 8)
  const myName = prompt("あなたの表示名を入力してください", "ゲスト") || "ゲスト"

  const canvas = document.getElementById('canvas')
  const ctx = canvas.getContext('2d')
  let drawing = false

  canvas.addEventListener('mousedown', (e) => {
    drawing = true
    ctx.beginPath()
    ctx.moveTo(e.offsetX, e.offsetY)
    sendDrawingEvent(e.offsetX, e.offsetY, 'mousedown')
  })

  canvas.addEventListener('mousemove', (e) => {
    if (drawing) {
      draw(e.offsetX, e.offsetY, true)
      sendDrawingEvent(e.offsetX, e.offsetY, 'mousemove')
    }
  })

  canvas.addEventListener('mouseup', (e) => {
    drawing = false
    sendDrawingEvent(e.offsetX, e.offsetY, 'mouseup')
  })

  canvas.addEventListener('mouseout', (e) => {
    drawing = false
    sendDrawingEvent(e.offsetX, e.offsetY, 'mouseout')
  })

  function draw(x, y, dragging) {
    if (dragging) {
      ctx.lineTo(x, y)
      ctx.stroke()
    } else {
      ctx.moveTo(x, y)
    }
  }

  function sendDrawingEvent(x, y, control) {
    const message = JSON.stringify({ x, y, control, type: 'paint' })
    ws.send(message)
  }

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data)
    if (msg.type === 'paint') {
      const { x, y, control } = msg
      if (control === 'mousedown') {
        ctx.beginPath()
        ctx.moveTo(x, y)
      } else if (control === 'mouseup') {
        ctx.beginPath()
      } else if (control === 'mousemove') {
        draw(x, y, true)
      }
    }

    if (msg.type === 'chat') {
      const { name, text } = msg
    //   const messageList = document.querySelector('.messages')
      const li = document.createElement('li')
      li.textContent = name === myName ? `自分 (${name}): ${text}` : `${name}: ${text}`
      messageList.appendChild(li)
      messageList.scrollTop = messageList.scrollHeight
    }
  }

  const form = document.querySelector('.form')
  form.onsubmit = function (e) {
    e.preventDefault()
    const input = document.querySelector('.input')
    const text = input.value
    if (text.trim() === '') return
    ws.send(JSON.stringify({ name: myName, text, type: 'chat' }))
    input.value = ''
    input.focus()
  }

  const clearBtn = document.getElementById('clearBtn')
  clearBtn.onclick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  ws.onerror = function (error) {
    console.error('WebSocket Error: ', error)
  }
}

main()
