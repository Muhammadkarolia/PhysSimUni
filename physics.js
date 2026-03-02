export const G = 1;         // scaled gravitational constant
export const EPSILON = 5;   // softening constant
export const SCALE = 0.1; // Scaling const

export function computeForces(bodies) {
    for (let i = 0; i < bodies.length; i++) {
        bodies[i].resetForce();

        for (let j = 0; j < bodies.length; j++) {
            if (i === j) continue;

            const dx = (bodies[j].x - bodies[i].x) * SCALE;
            const dy = (bodies[j].y - bodies[i].y) * SCALE;

            const distSq = dx*dx + dy*dy + EPSILON*EPSILON;
            const dist = Math.sqrt(distSq);

            const force = G * bodies[i].mass * bodies[j].mass / distSq;

            const fx = force * dx / dist;
            const fy = force * dy / dist;

            bodies[i].applyForce(fx, fy);
        }
    }
}
