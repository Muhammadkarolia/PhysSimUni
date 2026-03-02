export class Body {
    constructor(x, y, vx, vy, mass) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.mass = mass;

        this.fx = 0;
        this.fy = 0;
        this.radius = Math.sqrt(mass); // visual scaling
    }

    resetForce() {
        this.fx = 0;
        this.fy = 0;
    }

    applyForce(fx, fy) {
        this.fx += fx;
        this.fy += fy;
    }

    update(dt) {
        // Euler integration
        this.vx += (this.fx / this.mass) * dt;
        this.vy += (this.fy / this.mass) * dt;

        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();
    }
}
