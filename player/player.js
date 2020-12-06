import * as app from '../app/app.js'
import * as status from '../status/status.js'
import { div, html, setupEffect } from '../lib/util.js'
import * as audio from '../audio/audio.js'

let nextX = 0

export function init() {
  me.init()
  nextX = 0
}

export function updateBefore() {
  me.updateBefore()
}

export function update() {
  me.update()
  status.setPower(me.power)

  while (!me.isDead && app.isPlaying() && me.x >= nextX) {
    const prev = status.isScoreOver()
    nextX += 1000
    if (me.power) {
      status.setScore(status.getScore() + me.power * 100)
      audio.scoreUp.play()
    }
    if (!prev && status.isScoreOver()) {
      app.toggleFlash(true)
      audio.scoreOver.play()
    }
  }

  if (!me.isDead) {
    app.scrollTo(me.x, 0)
  }
}

export class Player {
  constructor() {
    this.el = html`
    <svg class="player" viewBox="0 0 983 1466">
      <path d="M902.798 1062.5C923.946 1061.67 944.196 1053.73 960.269 1039.96C962.457 1038.36 965.058 1037.42 967.763 1037.26C970.469 1037.09 973.166 1037.7 975.536 1039.01C977.906 1040.33 979.85 1042.29 981.138 1044.68C982.426 1047.06 983.005 1049.77 982.806 1052.47C973.678 1157.27 899.643 1268.83 827.298 1335.43C776.937 1382.4 717.264 1418.26 652.151 1440.69C587.037 1463.12 517.937 1471.61 449.331 1465.61C380.724 1459.62 314.144 1439.27 253.908 1405.89C193.672 1372.51 141.124 1326.84 99.6725 1271.84C58.2211 1216.85 28.7918 1153.75 13.2929 1086.65C-2.20602 1019.55 -3.42845 949.941 9.70491 882.337C22.8383 814.733 50.0342 750.645 89.5289 694.228C129.024 637.81 179.936 590.324 238.963 554.848C251.97 545.846 265.56 537.714 279.643 530.508C282.133 529.391 284.892 529.016 287.59 529.426C290.288 529.837 292.811 531.017 294.856 532.824C296.901 534.631 298.381 536.989 299.121 539.616C299.86 542.243 299.827 545.028 299.025 547.636C296.32 556.651 293.165 565.441 290.46 574.118C280.394 602.623 274.105 632.325 271.754 662.464C269.568 692.885 279.491 722.938 299.363 746.077C330.239 778.531 372.834 776.84 407.992 751.26C501.86 682.747 452.053 572.202 410.471 489.941L409.683 488.814L408.781 487.236C388.723 447.796 370.355 416.582 367.313 411.399C366.984 410.949 366.718 410.456 366.524 409.934C365.172 406.891 363.819 403.849 362.58 400.806C323.256 312.742 317.564 213.321 346.578 121.344C356.269 92.4963 378.581 32.0965 407.654 4.15027C409.501 2.34949 411.803 1.08573 414.313 0.494616C416.824 -0.0964986 419.448 0.00741558 421.904 0.795177C424.36 1.58294 426.555 3.02476 428.253 4.96589C429.952 6.90702 431.089 9.2741 431.544 11.8129C437.967 46.2949 454.081 111.315 456.898 119.428C469.004 161.146 488.718 200.267 515.044 234.819C579.276 316.066 681.708 353.591 754.954 426.386C850.737 521.268 876.655 651.759 860.316 782.362C855.993 816.799 848.447 850.753 837.778 883.78C827.975 914.205 811.184 941.588 811.297 973.929C811.997 994.182 819.319 1013.65 832.142 1029.34C844.966 1045.03 862.581 1056.09 882.289 1060.81C888.792 1062.3 895.453 1062.98 902.122 1062.84L902.798 1062.5Z" fill="currentColor" />
    </svg>
    `
    this.size = 30
    this.init()
    app.appendWorldChild(this.el)
  }

  init() {
    this.x = 0
    this.y = 0
    this.vx = 0
    this.vy = 0
    this.isLand = true
    this.isDead = false
    this.isHovering = false
    this.power = 0
    this.tickCount = 0
  }

  updateBefore() {
    this.tickCount++

    if (this.isLand) {
      this.vx += app.isPlaying() ? 0.2 : -1
    }

    if (!this.isDead && app.isPlaying()) {
      if (app.button.isDownChanged && !this.isLand || app.button.isDown && this.vy > 0) {
        this.isHovering = true
      }

      if (this.isLand || !app.button.isDown) {
        this.isHovering = false
      }

      if (app.button.isDownChanged && this.isLand) {
        this.vy = -12
        this.isLand = false
        audio.jump.play()
      }
    } else {
      this.isHovering = false
    }

    if (this.isHovering) {
      this.vy = 0
    }

    this.vx = Math.min(Math.max(this.vx, 0), this.getMaxSpeed())
    this.vy = Math.min(this.vy + 0.5, 30)

    if (this.y - this.size < app.getViewRect().bottom) {
      this.x += this.vx
      this.y += this.vy
      if (this.y - this.size >= app.getViewRect().bottom) {
        audio.sink.play()
      }
    }

    this.el.classList.remove('flash')
  }

  update() {
    this.el.style.transform = `translate(${this.x}px, ${this.y}px)`

    if (this.isLand && this.vx > 1 && this.tickCount % 5 === 0) {
      const el = setupEffect(div('.smoke'), { x: this.x, y: this.y + 10 })
      app.appendWorldChild(el)
    }

    if (this.isHovering && this.tickCount % 5 === 0) {
      const el = setupEffect(div('.smoke .hover'), { x: this.x, y: this.y + 10 })
      app.appendWorldChild(el)
      audio.hovering.play()
    }

    if (this.vx >= 20 && this.tickCount % 2 === 0) {
      const el = html`
      <svg class="after-image" viewBox="0 0 983 1466">
        <path d="M902.798 1062.5C923.946 1061.67 944.196 1053.73 960.269 1039.96C962.457 1038.36 965.058 1037.42 967.763 1037.26C970.469 1037.09 973.166 1037.7 975.536 1039.01C977.906 1040.33 979.85 1042.29 981.138 1044.68C982.426 1047.06 983.005 1049.77 982.806 1052.47C973.678 1157.27 899.643 1268.83 827.298 1335.43C776.937 1382.4 717.264 1418.26 652.151 1440.69C587.037 1463.12 517.937 1471.61 449.331 1465.61C380.724 1459.62 314.144 1439.27 253.908 1405.89C193.672 1372.51 141.124 1326.84 99.6725 1271.84C58.2211 1216.85 28.7918 1153.75 13.2929 1086.65C-2.20602 1019.55 -3.42845 949.941 9.70491 882.337C22.8383 814.733 50.0342 750.645 89.5289 694.228C129.024 637.81 179.936 590.324 238.963 554.848C251.97 545.846 265.56 537.714 279.643 530.508C282.133 529.391 284.892 529.016 287.59 529.426C290.288 529.837 292.811 531.017 294.856 532.824C296.901 534.631 298.381 536.989 299.121 539.616C299.86 542.243 299.827 545.028 299.025 547.636C296.32 556.651 293.165 565.441 290.46 574.118C280.394 602.623 274.105 632.325 271.754 662.464C269.568 692.885 279.491 722.938 299.363 746.077C330.239 778.531 372.834 776.84 407.992 751.26C501.86 682.747 452.053 572.202 410.471 489.941L409.683 488.814L408.781 487.236C388.723 447.796 370.355 416.582 367.313 411.399C366.984 410.949 366.718 410.456 366.524 409.934C365.172 406.891 363.819 403.849 362.58 400.806C323.256 312.742 317.564 213.321 346.578 121.344C356.269 92.4963 378.581 32.0965 407.654 4.15027C409.501 2.34949 411.803 1.08573 414.313 0.494616C416.824 -0.0964986 419.448 0.00741558 421.904 0.795177C424.36 1.58294 426.555 3.02476 428.253 4.96589C429.952 6.90702 431.089 9.2741 431.544 11.8129C437.967 46.2949 454.081 111.315 456.898 119.428C469.004 161.146 488.718 200.267 515.044 234.819C579.276 316.066 681.708 353.591 754.954 426.386C850.737 521.268 876.655 651.759 860.316 782.362C855.993 816.799 848.447 850.753 837.778 883.78C827.975 914.205 811.184 941.588 811.297 973.929C811.997 994.182 819.319 1013.65 832.142 1029.34C844.966 1045.03 862.581 1056.09 882.289 1060.81C888.792 1062.3 895.453 1062.98 902.122 1062.84L902.798 1062.5Z" fill="currentColor" />
      </svg>
      `
      app.appendWorldChild(setupEffect(el, { x: this.x, y: this.y }))
    }
  }

  getMaxSpeed() {
    const speed = 10 + this.power * 0.1
    return status.isScoreOver() ? speed : Math.min(speed, 20)
  }

  putLand(y) {
    if (!this.isLand) {
      audio.landing.play()
    }
    this.y = y - this.size / 2
    this.vy = 0
    this.isLand = true
  }

  die() {
    this.isDead = true
    this.isLand = false
  }

  powerUp() {
    if (app.isPlaying()) {
      this.power++
      audio.powerUp.play()
    }
  }

  powerDown() {
    this.power = Math.max(0, this.power - 3)
  }

  flash() {
    this.el.classList.add('flash')
  }
}

export const me = new Player()
