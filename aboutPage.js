const beforeBtn = document.getElementById("back");
const forwardBtn = document.getElementById("forward");

// stuff to go in features 
const creationMode = document.getElementById("creationMode");
const massControl = document.getElementById("massControl");
const simControl = document.getElementById("simControl");
const nBodySim = document.getElementById("nBodySim");
const objCreation = document.getElementById("objCreation");
const collHandling = document.getElementById("collHandling");
const vecVis = document.getElementById("vecVis");
const orbitalTrails = document.getElementById("orbitalTrails");
const adjustableParams = document.getElementById("adjustableParams");
const features = [creationMode, massControl, simControl, nBodySim, objCreation, vecVis, collHandling, orbitalTrails, adjustableParams];
let indexFeatures = 0;


forwardBtn.addEventListener("click", function() {
    features[indexFeatures].style.display = "none";
    indexFeatures +=1 ;
    if (indexFeatures > features.length - 1) {
        indexFeatures = 0;
    }
    // console.log("after ", indexFeatures);
    features[indexFeatures].style.display = "block";
});

beforeBtn.addEventListener("click", function(){
    features[indexFeatures].style.display = "none";
    indexFeatures -= 1;
    if(indexFeatures < 0) {
        indexFeatures = features.length - 1
    }
    // console.log("Before ", indexFeatures);
    features[indexFeatures].style.display = "block";
});
