import { Body } from "./scriptBody.js";
import { computeForces } from "./scriptPhysics.js";

const canvas = document.getElementById("canvas");
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
const ctx = canvas.getContext("2d");

// ==========================================================================
// Creation mode
let creationMode = "drag";
const modeRadios = document.querySelectorAll('input[name="creationMode"]');

// ==========================================================================
// Mass controls
const massSlider = document.getElementById("massSlider");
const massInput  = document.getElementById("massInput");

massSlider.addEventListener("input", () => {
    massInput.value = massSlider.value;
    updatePreviewBody();
});

massInput.addEventListener("input", () => {
    let val = parseFloat(massInput.value);
    val = Math.max(parseFloat(massSlider.min), Math.min(parseFloat(massSlider.max), val));
    massSlider.value = val;
    massInput.value  = val;
    updatePreviewBody();
});

// ==========================================================================
// Simulation state
let bodies  = [];
let running = false;
const dt    = 0.02;

const VELOCITY_SCALE = 0.05; // drag pixels → velocity units

let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let mouseX     = 0;
let mouseY     = 0;

// ==========================================================================
// Precise-mode inputs
let previewBody = null;
const posXInput = document.getElementById("posX");
const posYInput = document.getElementById("posY");
const velXInput = document.getElementById("velX");
const velYInput = document.getElementById("velY");
const inputForAddBody = document.getElementsByClassName("inputForAddBody");
const addBodyBtn = document.getElementById("addBody");
const toggleVelocity = document.getElementById("toggleVelocity");
const toggleForce = document.getElementById("toggleForce");

// Hide precise-mode inputs by default (drag mode is the default)
Array.from(inputForAddBody).forEach(el => el.style.display = "none");

// ==========================================================================
// Helpers

function isInteractionAllowed() {
    return !inWalkthrough || walkthroughSteps[currentStep].interactive;
}

function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) * (canvas.width  / rect.width),
        y: (e.clientY - rect.top)  * (canvas.height / rect.height)
    };
}

function updateNumBodies() {
    numBodiesDisplay.textContent = bodies.length;
}

function updatePreviewBody() {
    if (creationMode !== "precise") { previewBody = null; return; }

    const x    = parseFloat(posXInput.value);
    const y    = parseFloat(posYInput.value);
    const vx   = parseFloat(velXInput.value);
    const vy   = parseFloat(velYInput.value);
    const mass = parseFloat(massInput.value);

    previewBody = (isNaN(x) || isNaN(y) || isNaN(vx) || isNaN(vy) || isNaN(mass))
        ? null
        : new Body(x, y, vx, vy, mass);
}

// ==========================================================================
// Start / Pause / Reset
document.getElementById("start").onclick  = () => { if (isInteractionAllowed()) running = true;  };
document.getElementById("pause").onclick  = () => { if (isInteractionAllowed()) running = false; };
document.getElementById("reset").onclick  = () => {
    if (!isInteractionAllowed()) return;
    bodies = [];
    updateNumBodies();
};

// ==========================================================================
// Precise mode — add body button + live preview
addBodyBtn.addEventListener("click", () => {
    if (!isInteractionAllowed()) return;

    const x    = parseFloat(posXInput.value);
    const y    = parseFloat(posYInput.value);
    const vx   = parseFloat(velXInput.value);
    const vy   = parseFloat(velYInput.value);
    const mass = parseFloat(massInput.value);

    if (isNaN(x) || isNaN(y) || isNaN(vx) || isNaN(vy) || isNaN(mass)) {
        alert("Please enter valid numbers.");
        return;
    }

    bodies.push(new Body(x, y, vx, vy, mass));
    updateNumBodies();

    if (inWalkthrough && currentStep === 2) completeCurrentStep();
});

[posXInput, posYInput, velXInput, velYInput, massInput]
    .forEach(input => input.addEventListener("input", updatePreviewBody));

modeRadios.forEach(radio => {
    radio.addEventListener("change", () => {
        if (!isInteractionAllowed()) return;

        creationMode = radio.value;
        const displayVal = creationMode === "drag" ? "none" : "block";
        Array.from(inputForAddBody).forEach(el => el.style.display = displayVal);
        updatePreviewBody();
    });
});

// ==========================================================================
// Main loop
function loop() {
    if (running) {
        computeForces(bodies);
        bodies.forEach(body => body.update(dt));
        handleCollisions();
    }
    draw();
    requestAnimationFrame(loop);
}

function handleCollisions() {
    for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
            const dx   = bodies[j].x - bodies[i].x;
            const dy   = bodies[j].y - bodies[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < bodies[i].radius + bodies[j].radius) {
                const totalMass = bodies[i].mass + bodies[j].mass;

                bodies[i].vx = (bodies[i].vx * bodies[i].mass + bodies[j].vx * bodies[j].mass) / totalMass;
                bodies[i].vy = (bodies[i].vy * bodies[i].mass + bodies[j].vy * bodies[j].mass) / totalMass;
                bodies[i].mass   = totalMass;
                bodies[i].radius = Math.sqrt(totalMass);

                bodies.splice(j, 1);
                j--;
                updateNumBodies();
            }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const body of bodies) {
        body.draw(ctx);

        if (toggleVelocity.checked) {
            ctx.beginPath();
            ctx.moveTo(body.x, body.y);
            ctx.lineTo(body.x + body.vx * 5, body.y + body.vy * 5);
            ctx.strokeStyle = "green";
            ctx.stroke();
        }

        if (toggleForce.checked) {
            ctx.beginPath();
            ctx.moveTo(body.x, body.y);
            ctx.lineTo(body.x + body.fx * 0.05, body.y + body.fy * 0.05);
            ctx.strokeStyle = "red";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.lineWidth = 1;
        }
    }

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

    if (previewBody && creationMode === "precise") {
        ctx.globalAlpha = 0.5;
        previewBody.draw(ctx);

        ctx.beginPath();
        ctx.moveTo(previewBody.x, previewBody.y);
        ctx.lineTo(previewBody.x + previewBody.vx * 5, previewBody.y + previewBody.vy * 5);
        ctx.strokeStyle = "blue";
        ctx.stroke();

        ctx.globalAlpha = 1.0;
    }
}

loop();

// ==========================================================================
// Canvas mouse events — body creation in drag mode
const numBodiesDisplay = document.getElementById("numBodiesValue");

canvas.addEventListener("mousedown", (e) => {
    if (!isInteractionAllowed() || creationMode !== "drag") return;
    const { x, y } = getCanvasCoords(e);
    dragStartX = x;
    dragStartY = y;
    isDragging = true;
});

canvas.addEventListener("mousemove", (e) => {
    const { x, y } = getCanvasCoords(e);
    mouseX = x;
    mouseY = y;
});

canvas.addEventListener("mouseup", () => {
    if (!isInteractionAllowed() || creationMode !== "drag" || !isDragging) return;
    isDragging = false;

    const dx = mouseX - dragStartX;
    const dy = mouseY - dragStartY;
    if (Math.sqrt(dx * dx + dy * dy) < 5) return; // ignore tiny drags

    bodies.push(new Body(
        dragStartX,
        dragStartY,
        (dragStartX - mouseX) * VELOCITY_SCALE,
        (dragStartY - mouseY) * VELOCITY_SCALE,
        parseFloat(massInput.value)
    ));
    updateNumBodies();

    if (inWalkthrough && currentStep === 1) completeCurrentStep();
});

// ==========================================================================
// Walkthrough
const walkThBtn  = document.getElementById("walkThBtn");
const overlay    = document.getElementsByClassName("overlay");
const close      = document.getElementById("close");
const mainText   = document.getElementById("mainText");
const backBtn    = document.getElementById("back");
const forwardBtn = document.getElementById("forward");

let currentStep   = 0;
let inWalkthrough = false;
let stepCompleted = false;

const walkthroughSteps = [
    {
        title: "Welcome to the 2D N-Body Gravity Simulator",
        text: "This simulator lets you create and observe gravitational systems in action. Bodies attract each other based on Newton's law of universal gravitation. Click the right arrow to learn how to use it!",
        interactive: false
    },
    {
        title: "Creating Bodies - Drag Mode",
        text: "<strong>Drag Mode</strong> is the easiest way to create bodies:<br><br><strong style='color: #FFD700;'>Try it now: Click and drag on the canvas to create your first body!</strong><br><br>• The distance you drag determines the velocity<br>• The mass is controlled by the slider on the left<br>• Release to create the body<br><br>👉 Create a body to continue...",
        interactive: true,
        action: "drag"
    },
    {
        title: "Creating Bodies - Precise Mode",
        text: "<strong>Precise Mode</strong> allows exact control:<br><br><strong style='color: #FFD700;'>Try it now: Switch to Precise Mode and create a body!</strong><br><br>The controls on the left let you set:<br>1. X and Y coordinates (position)<br>2. Vx and Vy (velocity components)<br>3. Mass with the slider<br>4. Click 'Add Body' to create it<br><br>👉 Create a body to continue...",
        interactive: true,
        action: "precise"
    },
    {
        title: "Mass Control",
        text: "The <strong>Mass</strong> slider controls the size and gravitational pull of new bodies:<br><br>• Higher mass = larger body size<br>• Higher mass = stronger gravitational attraction<br>• Adjust the slider or type a value directly in the input field<br>• Mass affects both visual size and physics calculations",
        interactive: false
    },
    {
        title: "Simulation Controls",
        text: "<strong>Start / Pause / Reset</strong>:<br><br>• <strong>Start</strong> - Begin the simulation<br>• <strong>Pause</strong> - Pause the simulation<br>• <strong>Reset</strong> - Clear all bodies and start over<br><br>You can add bodies while paused or running!",
        interactive: false
    },
    {
        title: "Visualization Options",
        text: "<strong>Show Velocity</strong> / <strong>Show Force</strong>:<br><br>• <strong>Velocity arrows</strong> - Direction and magnitude of each body's motion<br>• <strong>Force arrows</strong> - Gravitational forces acting on each body",
        interactive: false
    },
    {
        title: "Understanding the Physics",
        text: "Key concepts:<br><br>• <strong>Gravity</strong> - Bodies attract each other proportionally to their masses<br>• <strong>Orbits</strong> - Bodies can orbit if they have the right velocity<br>• <strong>Collisions</strong> - Bodies merge on contact, conserving momentum<br>• <strong>Trails</strong> - Each body leaves a trail showing its path",
        interactive: false
    },
    {
        title: "You're Ready!",
        text: "You now understand the basics!<br><br>Try it out:<br>1. Create multiple bodies with different masses<br>2. Click 'Start' to launch the simulation<br>3. Use 'Pause' to stop and 'Reset' to clear<br>4. Toggle velocity and force visualizations<br>5. Experiment with different initial velocities<br><br>Good luck exploring gravitational systems! 🚀",
        interactive: false
    }
];

function updateWalkthroughDisplay() {
    stepCompleted = false;
    const step = walkthroughSteps[currentStep];
    mainText.innerHTML = `<strong>${step.title}</strong><br>${step.text}`;

    const isFinalStep = currentStep === walkthroughSteps.length - 1;
    if (isFinalStep) {
        Object.assign(close.style, { width: "300px", height: "80px", fontSize: "1.5em", padding: "20px", left: "40%" });
    }

    overlay[0].classList.add("active-overlay");

    if (step.interactive) {
        forwardBtn.style.pointerEvents = "none";
        forwardBtn.style.opacity = "0.5";
        overlay[0].style.backgroundColor = "transparent";
        Object.assign(mainText.style, { left: "auto", right: "20px", top: "auto", bottom: "20px", transform: "none", textAlign: "left", maxWidth: "400px" });
    } else {
        forwardBtn.style.pointerEvents = "auto";
        forwardBtn.style.opacity = "1";
        overlay[0].style.backgroundColor = "rgba(128, 128, 128, 0.5)";
        Object.assign(mainText.style, { left: "50%", right: "auto", top: "40%", bottom: "auto", transform: "translate(-50%, -50%)", textAlign: "center", maxWidth: "none" });
    }
}

function completeCurrentStep() {
    const step = walkthroughSteps[currentStep];
    if (!step.interactive) return;
    stepCompleted = true;
    forwardBtn.style.pointerEvents = "auto";
    forwardBtn.style.opacity = "1";
    mainText.innerHTML = `<strong>${step.title}</strong><br>${step.text}<br><br><strong style='color: #90EE90;'>✓ Great! Click the arrow to continue...</strong>`;
}

walkThBtn.addEventListener("click", () => {
    currentStep = 0;
    inWalkthrough = true;
    bodies = [];
    updateNumBodies();
    updateWalkthroughDisplay();
    Array.from(overlay).forEach(el => el.style.display = "block");
});

backBtn.addEventListener("click",    () => { if (currentStep > 0) { currentStep--; updateWalkthroughDisplay(); } });
forwardBtn.addEventListener("click", () => { if (currentStep < walkthroughSteps.length - 1) { currentStep++; updateWalkthroughDisplay(); } });

close.addEventListener("click", () => {
    inWalkthrough = false;
    stepCompleted = false;
    Array.from(overlay).forEach(el => { el.style.display = "none"; el.classList.remove("active-overlay"); });
});

// ==========================================================================
// Orbit Presets
const orbitSimpleBtn = document.getElementById("orbitSimple");
const orbitBinaryBtn = document.getElementById("orbitBinary");
const orbitTripleBtn = document.getElementById("orbitTriple");

function loadPreset(name) {
    if (inWalkthrough) return; // Prevent preset loading during walkthrough
    bodies = [];
    running = false;
    updateNumBodies();

    if (name === "simple") {
        // Sun at center, planet orbiting
        bodies.push(new Body(600, 400, 0, 0, 100)); // Sun (massive, stationary)
        bodies.push(new Body(700, 400, 0, -8, 5)); // Planet orbiting
    } else if (name === "binary") {
        // Two equal-mass stars orbiting each other
        bodies.push(new Body(550, 400, 0, 5, 40)); // Star 1
        bodies.push(new Body(650, 400, 0, -5, 40)); // Star 2
    } else if (name === "triple") {
        // Three bodies: large central body with two smaller ones
        bodies.push(new Body(600, 400, 0, 0, 80)); // Central massive body
        bodies.push(new Body(720, 400, 0, -7, 10)); // Outer planet 1
        bodies.push(new Body(540, 360, 6, 0, 8)); // Outer planet 2
    }

    updateNumBodies();
}

orbitSimpleBtn.addEventListener("click", () => loadPreset("simple"));
orbitBinaryBtn.addEventListener("click", () => loadPreset("binary"));
orbitTripleBtn.addEventListener("click", () => loadPreset("triple"));