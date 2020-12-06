export function $(sel) {
  return document.querySelector(sel)
}

export function div(cls, props = {}, children = []) {
  const el = document.createElement('div')
  el.className = cls.split('.').filter(Boolean).join(' ')
  Object.assign(el, props)
  el.append(...[].concat(children).map(c => c instanceof Node ? c : document.createTextNode(String(c))))
  return el
}

const temp = document.createElement('template')

export function html(strings, ...values) {
  temp.innerHTML = strings.reduce((p, s, i) => p + values[i - 1] + s).trim()
  return temp.content.firstChild
}

export function toDelimited(num) {
  return num.toLocaleString('en-US')
}

export function setupEffect(el, pos) {
  Object.assign(el.style, {
    left: `${pos.x}px`,
    top: `${pos.y}px`,
  })
  el.addEventListener('animationend', (e) => (e.target === el && el.remove()))
  return el
}

export function randomNative(num) {
  return Math.floor(Math.random() * num)
}

const seed = Uint32Array.of(Math.random() * 0xffffffff + 1)

export function setRandomSeed(value) {
  seed[0] = value
}

export function updateRandomSeed() {
  seed[0] = Math.random() * 0xffffffff + 1
  return seed[0]
}

export function random(num) {
  seed[0] ^= seed[0] << 13
  seed[0] ^= seed[0] >> 17
  seed[0] ^= seed[0] << 5
  return Math.floor(seed[0] / 0x100000000 * num)
}

export function arrayToBase64(arr) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.replace(/^.*,/, ''))
    reader.readAsDataURL(new Blob([new Uint16Array(arr)]))
  })
}

export async function base64toArray(text) {
  const res = await fetch(`data:text/plain;charset=UTF-8;base64,${text}`)
  const buf = await res.arrayBuffer()
  return Array.from(new Uint16Array(buf))
}
