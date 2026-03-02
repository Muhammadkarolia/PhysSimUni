export class Body {
    constructor(x, y, vx, vy, mass) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.mass = mass;

        this.trail = [];
        this.maxTrailLength = 100; // adjust length here


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

        // Trail stuff
        this.trail.push({ x: this.x, y: this.y });
        // Limit trail length
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift(); // remove oldest point
        }
    }

    draw(ctx) {
        // Draw trail
        for (let i = 0; i < this.trail.length - 1; i++) {

            const p1 = this.trail[i];
            const p2 = this.trail[i + 1];

            const alpha = i / this.trail.length; // fades older points

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.stroke();
        }

        // Draw Cirlce
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();
    }
}
