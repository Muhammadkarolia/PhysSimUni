import { Body } from "./scriptBody.js";
import { computeForces } from "./scriptPhysics.js";

const canvas = document.getElementById("canvas");
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
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
    updatePreviewBody();
});

// Update slider when input changes
massInput.addEventListener("input", () => {
    let val = parseFloat(massInput.value);

    // Clamp value to slider min/max
    if (val < parseFloat(massSlider.min)) val = massSlider.min;
    if (val > parseFloat(massSlider.max)) val = massSlider.max;

    massSlider.value = val;
    massInput.value = val;
    updatePreviewBody();
});
// Mass Stuff End
// ==========================================================================


// Func to change numBodies shown, called when item bodies is updated somehow
function updateNumBodies() {
    numBodiesDisplay.textContent = bodies.length;
}

// Start Pause Reset
document.getElementById("start").onclick = () => running = true;
document.getElementById("pause").onclick = () => running = false;
document.getElementById("reset").onclick = () => {
    bodies = [];
    updateNumBodies();
};


// ==========================================================================
// Pos using Precice values
let previewBody = null;
const posXInput = document.getElementById("posX");
const posYInput = document.getElementById("posY");
const velXInput = document.getElementById("velX");
const velYInput = document.getElementById("velY");
const inputForAddBody = document.getElementsByClassName("inputForAddBody");
const addBodyBtn = document.getElementById("addBody");
for(var i = 0; i < inputForAddBody.length; i++) { // Hide by default since drag mode is checked
    inputForAddBody[i].style.display = "none";
}

addBodyBtn.addEventListener("click", () => {
    if(creationMode == "precise") {
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
        updateNumBodies();


        // previewBody = null;
    }
});

[posXInput, posYInput, velXInput, velYInput, massInput]
.forEach(input => {
    input.addEventListener("input", updatePreviewBody);
});

modeRadios.forEach(radio => {
    radio.addEventListener("change", () => {
        console.log(radio.value)
        creationMode = radio.value;
        if (creationMode === "drag") {
            for(var i = 0; i < inputForAddBody.length; i++) {
                inputForAddBody[i].style.display = "none";
            }
        } else {
            for(var i = 0; i < inputForAddBody.length; i++) {
                inputForAddBody[i].style.display = "block";
            }
        }
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
                updateNumBodies();
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
// Adding objects LINKS TO creation mode, tf does this even mean
const numBodiesDisplay = document.getElementById("numBodiesValue");

canvas.addEventListener("mousedown", (e) => {
    if (creationMode !== "drag") return;

    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    dragStartX = (e.clientX - rect.left) * scaleX;
    dragStartY = (e.clientY - rect.top) * scaleY;

    isDragging = true;
});

canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    mouseX = (e.clientX - rect.left) * scaleX;
    mouseY = (e.clientY - rect.top) * scaleY;
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
    updateNumBodies();
});

// --------------------------------------------------------------------------------------
// Walkthrough stuff
const walkThBtn = document.getElementById("walkThBtn");
const overlay = document.getElementsByClassName("overlay");
const close = document.getElementById("close");
const mainText = document.getElementById("mainText");
const backBtn = document.getElementById("back");
const forwardBtn = document.getElementById("forward");

let currentStep = 0;

const walkthroughSteps = [
    {
        title: "Welcome to the 2D N-Body Gravity Simulator",
        text: "This simulator lets you create and observe gravitational systems in action. Bodies attract each other based on Newton's law of universal gravitation. Click the right arrow to learn how to use it!"
    },
    {
        title: "Creating Bodies - Drag Mode",
        text: "<strong>Drag Mode</strong> (currently selected) is the easiest way to create bodies:<br><br>1. Click and drag on the canvas to set position and initial velocity<br>2. The length of your drag determines the velocity magnitude<br>3. The mass is controlled by the slider on the left<br>4. Release to create the body"
    },
    {
        title: "Creating Bodies - Precise Mode",
        text: "<strong>Precise Mode</strong> allows exact control:<br><br>1. Select the 'Precise Mode' radio button<br>2. Enter exact X and Y coordinates<br>3. Set velocity components (Vx and Vy)<br>4. Adjust mass with the slider<br>5. Click 'Add Body' to create the body"
    },
    {
        title: "Mass Control",
        text: "The <strong>Mass</strong> slider controls the size and gravitational pull of new bodies:<br><br>• Higher mass = larger body size<br>• Higher mass = stronger gravitational attraction<br>• Adjust the slider or type a value directly in the input field<br>• Mass affects both visual size and physics calculations"
    },
    {
        title: "Simulation Controls",
        text: "<strong>Start / Pause / Reset</strong>:<br><br>• <strong>Start</strong> - Begin the simulation (bodies start moving)<br>• <strong>Pause</strong> - Pause the simulation<br>• <strong>Reset</strong> - Clear all bodies and start over<br><br>You can add bodies while paused or running!"
    },
    {
        title: "Visualization Options",
        text: "<strong>Show Velocity</strong> / <strong>Show Force</strong>:<br><br>• <strong>Velocity arrows</strong> - Shows the direction and magnitude of each body's motion<br>• <strong>Force arrows</strong> - Shows gravitational forces acting on each body<br><br>These help visualize the physics happening in real-time!"
    },
    {
        title: "Understanding the Physics",
        text: "Key concepts:<br><br>• <strong>Gravity</strong> - Bodies attract each other proportionally to their masses<br>• <strong>Orbits</strong> - Bodies can orbit each other if they have the right velocity<br>• <strong>Collisions</strong> - When bodies touch, they merge and conserve momentum<br>• <strong>Trails</strong> - Each body leaves a trail showing its path"
    },
    {
        title: "Try It Out!",
        text: "Now that you understand the basics:<br><br>1. Create a few bodies with different masses<br>2. Try clicking 'Start' to see gravity in action<br>3. Use both drag mode and precise mode<br>4. Toggle velocity and force visualization<br>5. Experiment with creating orbiting systems!<br><br>Have fun exploring gravitational systems!"
    }
];

function updateWalkthroughDisplay() {
    mainText.innerHTML = `<strong>${walkthroughSteps[currentStep].title}</strong><br>${walkthroughSteps[currentStep].text}`;
}

walkThBtn.addEventListener("click", () => {
    currentStep = 0;
    updateWalkthroughDisplay();
    for(var i = 0; i < overlay.length; i++) {
        overlay[i].style.display = "block";
    }
});

backBtn.addEventListener("click", () => {
    if (currentStep > 0) {
        currentStep--;
        updateWalkthroughDisplay();
    }
});

forwardBtn.addEventListener("click", () => {
    if (currentStep < walkthroughSteps.length - 1) {
        currentStep++;
        updateWalkthroughDisplay();
    }
});

close.addEventListener("click", () => {
    for(var i = 0; i < overlay.length; i++) {
        overlay[i].style.display = "none";
    }
});