export class ProjectileRenderer {
  constructor({ trailOpacity = 0.5 } = {}) {
    this._trailOpacity = trailOpacity
  }

  render(context, projectiles) {
    for (const p of projectiles) {
      this._renderTrail(context, p)
      this._renderProjectile(context, p)
    }
  }

  _renderTrail(context, p) {
    const trail = p.trail
    if (trail.length < 2) return

    context.save()
    context.strokeStyle = p.color
    context.lineCap = 'round'

    for (let i = 1; i < trail.length; i++) {
      const prev = trail[i - 1]
      const curr = trail[i]

      // Fade out older trail segments
      const alpha = (i / trail.length) * this._trailOpacity
      context.globalAlpha = alpha
      context.lineWidth = (p.size / 2) * (i / trail.length)

      context.beginPath()
      context.moveTo(prev.x, prev.y)
      context.lineTo(curr.x, curr.y)
      context.stroke()
    }

    // Trail from last point to current position
    if (trail.length > 0) {
      const last = trail[trail.length - 1]
      context.globalAlpha = this._trailOpacity
      context.lineWidth = p.size / 2

      context.beginPath()
      context.moveTo(last.x, last.y)
      context.lineTo(p.x, p.y)
      context.stroke()
    }

    context.restore()
  }

  _renderProjectile(context, p) {
    context.save()
    context.fillStyle = p.color
    context.globalAlpha = 1

    context.beginPath()
    context.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2)
    context.fill()

    context.restore()
  }
}
