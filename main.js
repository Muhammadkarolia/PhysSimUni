import { Body } from "./body.js";
import { computeForces } from "./physics.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Creation mode stuff
let creationMode = "drag";
const modeRadios = document.querySelectorAll('input[name="creationMode"]');

// ==========================================================================
// Mass stuff
const massSlider = document.getElementById("massSlider");
const massInput = document.getElementById("massInput");

// Update input when slider moves
massSlider.addEventListener("input", () => {
    massInput.value = massSlider.value;
});

// Update slider when input changes
massInput.addEventListener("input", () => {
    let val = parseFloat(massInput.value);

    // Clamp value to slider min/max
    if (val < parseFloat(massSlider.min)) val = massSlider.min;
    if (val > parseFloat(massSlider.max)) val = massSlider.max;

    massSlider.value = val;
    massInput.value = val;
});
// Mass Stuff End
// ==========================================================================


// Start Pause Reset
document.getElementById("start").onclick = () => running = true;
document.getElementById("pause").onclick = () => running = false;
document.getElementById("reset").onclick = () => {
    bodies = [];
};



// ==========================================================================
// Pos using Precice values
let previewBody = null;
const posXInput = document.getElementById("posX");
const posYInput = document.getElementById("posY");
const velXInput = document.getElementById("velX");
const velYInput = document.getElementById("velY");
const addBodyBtn = document.getElementById("addBody");

addBodyBtn.addEventListener("click", () => {
    const x = parseFloat(posXInput.value);
    const y = parseFloat(posYInput.value);
    const vx = parseFloat(velXInput.value);
    const vy = parseFloat(velYInput.value);
    const mass = parseFloat(massInput.value);

    if (isNaN(x) || isNaN(y) || isNaN(vx) || isNaN(vy) || isNaN(mass)) {
        alert("Please enter valid numbers.");
        return;
    }

    const newBody = new Body(x, y, vx, vy, mass);
    bodies.push(newBody);

    previewBody = null;
});

[posXInput, posYInput, velXInput, velYInput, massInput]
.forEach(input => {
    input.addEventListener("input", updatePreviewBody);
});

modeRadios.forEach(radio => {
    radio.addEventListener("change", () => {
        console.log(radio.value)
        creationMode = radio.value;
        updatePreviewBody();
    });
});


function updatePreviewBody() {
    if (creationMode !== "precise") {
        previewBody = null;
        return;
    }

    const x = parseFloat(posXInput.value);
    const y = parseFloat(posYInput.value);
    const vx = parseFloat(velXInput.value);
    const vy = parseFloat(velYInput.value);
    const mass = parseFloat(massInput.value);

    if (isNaN(x) || isNaN(y) || isNaN(vx) || isNaN(vy) || isNaN(mass)) {
        previewBody = null;
        console.log("NAN")
        return;
    }

    previewBody = new Body(x, y, vx, vy, mass);
}
// Pos using Precice values end
// ==========================================================================



let bodies = [];
let running = false;
let dt = 0.02; // timestep

let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let mouseX = 0;
let mouseY = 0;

const velocityScale = 0.05; // adjust for sensitivity

function loop() {
    if (running) {
        computeForces(bodies);

        for (let body of bodies) {
            body.update(dt);
        }

        handleCollisions();
    }

    draw();
    requestAnimationFrame(loop);
}

function handleCollisions() {
    for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {

            const dx = bodies[j].x - bodies[i].x;
            const dy = bodies[j].y - bodies[i].y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < bodies[i].radius + bodies[j].radius) {

                const totalMass = bodies[i].mass + bodies[j].mass;

                // Momentum conservation
                bodies[i].vx =
                    (bodies[i].vx * bodies[i].mass +
                     bodies[j].vx * bodies[j].mass) / totalMass;

                bodies[i].vy =
                    (bodies[i].vy * bodies[i].mass +
                     bodies[j].vy * bodies[j].mass) / totalMass;

                bodies[i].mass = totalMass;
                bodies[i].radius = Math.sqrt(totalMass);

                bodies.splice(j, 1);
                j--; // important when removing from array
            }
        }
    }
}

function draw() {

    // Always clear first
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let body of bodies) {

        // Draw body
        body.draw(ctx);

        // Draw velocity vector (green)
        ctx.beginPath();
        ctx.moveTo(body.x, body.y);
        ctx.lineTo(body.x + body.vx * 5, body.y + body.vy * 5);
        ctx.strokeStyle = "green";
        ctx.stroke();

        // Draw force vector (red)
        ctx.beginPath();
        ctx.moveTo(body.x, body.y);
        ctx.lineTo(body.x + body.fx * 0.01, body.y + body.fy * 0.01);
        ctx.strokeStyle = "red";
        ctx.stroke();
    }


    // Drag mode preview
    if (isDragging && creationMode === "drag") {

        ctx.beginPath();
        ctx.moveTo(dragStartX, dragStartY);
        ctx.lineTo(mouseX, mouseY);
        ctx.strokeStyle = "yellow";
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(dragStartX, dragStartY, 5, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();
    }
    
    // Precise mode preview
    if (previewBody && creationMode === "precise") {

        ctx.globalAlpha = 0.5;

        previewBody.draw(ctx);

        ctx.beginPath();
        ctx.moveTo(previewBody.x, previewBody.y);
        ctx.lineTo(
            previewBody.x + previewBody.vx * 5,
            previewBody.y + previewBody.vy * 5
        );
        ctx.strokeStyle = "blue";
        ctx.stroke();

        ctx.globalAlpha = 1.0;
    }

}


loop();


// --------------------------------------------------------------------------------------
// Adding objects LINKS TO creation mode
canvas.addEventListener("mousedown", (e) => {

    if (creationMode !== "drag") return;

    const rect = canvas.getBoundingClientRect();
    dragStartX = e.clientX - rect.left;
    dragStartY = e.clientY - rect.top;
    isDragging = true;
});

canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener("mouseup", () => {
    if (creationMode !== "drag") return;
    if (!isDragging) return;

    isDragging = false;

    const dx = mouseX - dragStartX;
    const dy = mouseY - dragStartY;

    const dragDistance = Math.sqrt(dx*dx + dy*dy);

    if (dragDistance < 5) return; // ignore tiny drags

    const vx = (dragStartX - mouseX) * velocityScale;
    const vy = (dragStartY - mouseY) * velocityScale;

    const mass = parseFloat(massInput.value);

    const newBody = new Body(
        dragStartX,
        dragStartY,
        vx,
        vy,
        mass
    );

    bodies.push(newBody);
});
