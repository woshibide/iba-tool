console.log(`
# # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # #

           made by 
      _ __               
     ' )  )        _/_   
      /--'__  , _  /  __ 
     /     (_/_(_)(__/ (_
            /            
         (_'

    instagram.com/itspyotr


# # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # #
`)

/*
[Log] === 84 === (script.js, line 83)
[Log] 2025-10-30T13:55:56.421Z (script.js, line 84)
[Log] numRows: 21 (script.js, line 88)
[Log] numCols: 28 (script.js, line 88)
[Log] rowWidth: 53 (script.js, line 88)
[Log] colWidth: 54 (script.js, line 88)
[Log] randomOffset: 1 (script.js, line 88)
[Log] interpolationSteps: 4 (script.js, line 88)
[Log] animationSpeed: 100 (script.js, line 88)
[Log] maxShapes: 12 (script.js, line 88)

[Log] === 2 === (script.js, line 99)
[Log] 2025-10-30T15:00:18.435Z (script.js, line 100)
[Log] numRows: 16 (script.js, line 104)
[Log] numCols: 29 (script.js, line 104)
[Log] rowWidth: 28 (script.js, line 104)
[Log] colWidth: 85 (script.js, line 104)
[Log] randomOffset: 72 (script.js, line 104)
[Log] interpolationSteps: 19 (script.js, line 104)
[Log] animationSpeed: 100 (script.js, line 104)
[Log] maxShapes: 13 (script.js, line 104)
*/




let allColumnsPoints = [];

// Menu-related variables
let sliderValues = {
  numRows:            { min: 2, value: 2, max: 30 },
  numCols:            { min: 3, value: 3, max: 30 }, // this parameter no longer will be tweaked
  rowWidth:           { min: 2, value: 30, max: 100 },
  colWidth:           { min: 2, value: 30, max: 100 },
  randomOffset:       { min: 0, value: 25, max: 100 },
  interpolationSteps: { min: 1, value: 10, max: 20 },
  animationSpeed:     { min: 30, value: 150, max: 500 },
  maxShapes:          { min: 1, value: 5, max: 30 },
  strokeWeight:       { min: 0, value: 0, max: 100 },
  obstaclePushStrength: { min: 0, value: 50, max: 200 },
  bgColor:            { value: '#ffffff' },
  strokeColor:        { value: '#000000' },
  fillColor:          { value: '#ff0f0f' }
};
let flags = {
  shadows: false,
  mode: false,
    randomMode: false,
    showPoints: false,
    showObstacle: false
};
let isAnimating = false;
let sketchNum = 0;

const presetManager = new PresetManager();

// Animation variables
let currentShape = 0;
let transitionProgress = 0;
let currentPoints = [];
let nextPoints = [];
// obstacle manager instance (scaffold)
// let obstacleManager;

function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

// generate random values for all sliders within their ranges
function generateRandomValues() {

    let randomValues = {};
    for (let prop in sliderValues) {
        if (sliderValues[prop].min !== undefined && sliderValues[prop].max !== undefined) {
            // for numeric sliders, generate random value within range
            let range = sliderValues[prop].max - sliderValues[prop].min;
            randomValues[prop] = Math.floor(Math.random() * range) + sliderValues[prop].min;
        }
    }

    randomValues.strokeWeight = 0;
    randomValues.animationSpeed = 100;
    randomValues.numCols = 3; // hardcoded, no longer tweaked

    return randomValues;
}

// log current parameters to console
function logCurrentParameters() {

    
    for (let prop in sliderValues) {
        if (sliderValues[prop].min !== undefined) {
            console.log(`${prop}: ${sliderValues[prop].value}`);
        } else {
            console.log(`${prop}: ${sliderValues[prop].value}`);
        }
    }
}

// apply random values to sliders
function applyRandomValues() {
    let randomValues = generateRandomValues();
    sketchNum ++;
    
    console.log('=== ' + sketchNum + ' ===');
   console.log(new Date().toISOString()); 

    for (let prop in randomValues) {
        sliderValues[prop].value = randomValues[prop];
        console.log(`${prop}: ${randomValues[prop]}`);
        
        // update dom elements
        let slider = document.getElementById(prop + 'Slider');
        let valueSpan = document.getElementById(prop + 'Value');
        if (slider) slider.value = randomValues[prop];
        if (valueSpan) valueSpan.textContent = randomValues[prop];
    }

    console.log('=========================');
    
    // update obstacle manager push strength if it exists
    // if (obstacleManager && randomValues.obstaclePushStrength !== undefined) {
    //     obstacleManager.pushStrength = randomValues.obstaclePushStrength;
    // }
    
    // regenerate grid points with new values
    currentPoints = generateGridPoints(sliderValues.numRows.value, 3, sliderValues.rowWidth.value, sliderValues.colWidth.value, sliderValues.randomOffset.value * (currentShape + 1), currentShape);
    nextPoints = generateGridPoints(sliderValues.numRows.value, 3, sliderValues.rowWidth.value, sliderValues.colWidth.value, sliderValues.randomOffset.value * (currentShape + 2), currentShape + 1);
}


function generateGridPoints(numRows, numCols, rowWidth, colWidth, randomOffset, seed) {
    randomSeed(seed);
    let columnsPoints = [];
    for (let row = 0; row < numRows; row++) {
        let columnPoints = [];
        for (let col = 0; col < numCols; col++) {
            let x = row * rowWidth + random(randomOffset);
            let y = col * colWidth + random(randomOffset);
            let point = createVector(x, y);
            
            // apply obstacle avoidance if obstacle manager exists
            // if (obstacleManager) {
            //     point = obstacleManager.avoidPoint(point);
            // }
            
            columnPoints.push(point);
        }
        columnsPoints.push(columnPoints);
    }
    return columnsPoints;
}

function drawGrid(points, interpolationSteps) {
    // noFill();
    // Interpolating between columns and drawing polygons
    for (let index = 0; index < points.length - 1; index++) {
        let currentColumnPoints = points[index];
        let nextColumnPoints = points[index + 1];
        for (let step = 0; step < interpolationSteps; step++) {
            beginShape();
            for (let i = 0; i < currentColumnPoints.length; i++) {
                let interpolatedX = lerp(currentColumnPoints[i].x, nextColumnPoints[i].x, step / interpolationSteps);
                let interpolatedY = lerp(currentColumnPoints[i].y, nextColumnPoints[i].y, step / interpolationSteps);
                vertex(interpolatedX, interpolatedY);
            }
            endShape();
        }
    }
}

// draw all interpolated points to a given graphics/context
// g may be the main window (p5) or a p5.Graphics instance
function drawPointsToGraphics(g, initialPoints, interpolatedPoints) {
    if (!flags.showPoints) return;
    const size = 6; // point visual size
    g.push();
    // draw a small blue circle for each initial vertex (before displacement)
    g.noStroke();
    g.fill(0, 0, 255, 200);
    for (let col of initialPoints) {
        for (let pt of col) {
            g.ellipse(pt.x, pt.y, size, size);
        }
    }
    // draw a small red circle for each interpolated vertex (after displacement)
    g.fill(255, 0, 0, 200);
    for (let col of interpolatedPoints) {
        for (let pt of col) {
            g.ellipse(pt.x, pt.y, size, size);
        }
    }
    g.pop();
}

function drawGridToGraphics(g, points, interpolationSteps) {
    for (let index = 0; index < points.length - 1; index++) {
        let currentColumnPoints = points[index];
        let nextColumnPoints = points[index + 1];
        for (let step = 0; step < interpolationSteps; step++) {
            g.beginShape();
            for (let i = 0; i < currentColumnPoints.length; i++) {
                let interpolatedX = lerp(currentColumnPoints[i].x, nextColumnPoints[i].x, step / interpolationSteps);
                let interpolatedY = lerp(currentColumnPoints[i].y, nextColumnPoints[i].y, step / interpolationSteps);
                g.vertex(interpolatedX, interpolatedY);
            }
            g.endShape();
        }
    }
}

function drawScene(g = window) {
    g.stroke(sliderValues.strokeColor.value);
    g.fill(sliderValues.fillColor.value);
    g.strokeWeight(sliderValues.strokeWeight.value);
    
    // Interpolate between current and next points
    let easedProgress = easeInOutQuad(transitionProgress);
    let interpolatedPoints = [];
    
    // first pass: calculate bounds to determine translation
    let tempPoints = [];
    for (let i = 0; i < currentPoints.length; i++) {
        let tempColumn = [];
        for (let j = 0; j < currentPoints[i].length; j++) {
            let x = lerp(currentPoints[i][j].x, nextPoints[i][j].x, easedProgress);
            let y = lerp(currentPoints[i][j].y, nextPoints[i][j].y, easedProgress);
            tempColumn.push(createVector(x, y));
        }
        tempPoints.push(tempColumn);
    }
    
    // calculate bounds and translation
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let col of tempPoints) {
        for (let point of col) {
            if (point.x < minX) minX = point.x;
            if (point.x > maxX) maxX = point.x;
            if (point.y < minY) minY = point.y;
            if (point.y > maxY) maxY = point.y;
        }
    }
    let centerX = (minX + maxX) / 2;
    let centerY = (minY + maxY) / 2;
    let tx = width / 2 - centerX;
    let ty = height / 2 - centerY;
    
    // second pass: apply obstacle avoidance in screen space
    // process by column to maintain column coherence
    for (let i = 0; i < tempPoints.length; i++) {
        let interpolatedColumn = [];
        let columnOffset = createVector(0, 0);
        
        // calculate column center to determine offset
        // if (obstacleManager && obstacleManager.mode !== 'none') {
        //     let colCenterX = 0, colCenterY = 0;
        //     for (let j = 0; j < tempPoints[i].length; j++) {
        //         colCenterX += tempPoints[i][j].x;
        //         colCenterY += tempPoints[i][j].y;
        //     }
        //     colCenterX /= tempPoints[i].length;
        //     colCenterY /= tempPoints[i].length;
        //     
        //     // transform column center to screen space
        //     let screenCenter = createVector(colCenterX + tx, colCenterY + ty);
        //     // apply avoidance to the center point
        //     let avoidedCenter = obstacleManager.avoidPoint(screenCenter);
        //     // calculate offset for the entire column
        //     columnOffset.x = avoidedCenter.x - screenCenter.x;
        //     columnOffset.y = avoidedCenter.y - screenCenter.y;
        // }
        
        // apply the same offset to all points in the column
        for (let j = 0; j < tempPoints[i].length; j++) {
            let point = tempPoints[i][j].copy();
            point.x += columnOffset.x;
            point.y += columnOffset.y;
            interpolatedColumn.push(point);
        }
        
        interpolatedPoints.push(interpolatedColumn);
    }
    
    // Draw the grid in the center (using already calculated tx, ty)
    g.push();
    g.translate(tx, ty);
    drawGridToGraphics(g, interpolatedPoints, sliderValues.interpolationSteps.value);
    // draw points on top if requested
    drawPointsToGraphics(g, tempPoints, interpolatedPoints);
    g.pop();
    
    // draw obstacles in screen space (not translated) if enabled
    // if (obstacleManager && flags.showObstacle) obstacleManager.draw(g);
}

//////////////////////////////////

function preload() {
    // img = loadImage('chair.jpg');
}

function setup() {

    strokeCap(SQUARE);
	createCanvas(windowWidth, windowHeight);
    // generate initial points
    currentPoints = generateGridPoints(sliderValues.numRows.value, 3, sliderValues.rowWidth.value, sliderValues.colWidth.value, sliderValues.randomOffset.value * (currentShape + 1), currentShape);
    nextPoints    = generateGridPoints(sliderValues.numRows.value, 3, sliderValues.rowWidth.value, sliderValues.colWidth.value, sliderValues.randomOffset.value * (currentShape + 2), currentShape + 1);
    
    // Initialize slider DOM elements to match sliderValues
    initializeSliders();
    
    // Expand controls by default
    toggleControls();
    // create obstacle manager
    // obstacleManager = new ObstacleManager();
    // obstacleManager.pushStrength = sliderValues.obstaclePushStrength.value;
    
    loop(); // Enable animation
}

function draw() {
    background(sliderValues.bgColor.value);

    // background(img, width, height);

    drawScene();
    
    // Update transition
    transitionProgress += 2 / sliderValues.animationSpeed.value;
    if (transitionProgress >= 1) {
        transitionProgress = 0;
        currentShape++;
        if (currentShape >= sliderValues.maxShapes.value) {
            currentShape = 0;
            
            if (flags.randomMode) {
                applyRandomValues();
            }
        }
        currentPoints = nextPoints.map(col => col.map(v => v.copy()));
        nextPoints = generateGridPoints(sliderValues.numRows.value, sliderValues.numCols.value, sliderValues.rowWidth.value, sliderValues.colWidth.value, sliderValues.randomOffset.value * (currentShape + 2), currentShape + 1);
    }
}


// Update checkbox states to match flags
if(document.getElementById('randomModeCheckbox')) document.getElementById('randomModeCheckbox').checked = flags.randomMode;
if(document.getElementById('showPointsCheckbox')) document.getElementById('showPointsCheckbox').checked = flags.showPoints;
if(document.getElementById('showObstacleCheckbox')) document.getElementById('showObstacleCheckbox').checked = flags.showObstacle;

//////////////////////////////////


function keyPressed(){
    if(key == "s"){
        exportGraphics();
    }
    // toggle showing interpolated points with 'p'
    if (key == 'p') {
        flags.showPoints = !flags.showPoints;
        redraw();
    }
}

// forward mouse events to obstacle manager in screen space
// obstacle is now drawn in screen space, so mouse coords don't need translation
function mousePressed() {
    // if (!obstacleManager || !flags.showObstacle) return;
    // if (obstacleManager.mousePressed(mouseX, mouseY)) {
    //     // if we grabbed a handle, prevent other interactions
    //     return false;
    // }
}

function mouseDragged() {
    // if (!obstacleManager || !flags.showObstacle) return;
    // if (obstacleManager.mouseDragged(mouseX, mouseY)) {
    //     redraw();
    //     return false;
    // }
}

function mouseReleased() {
    // if (obstacleManager) obstacleManager.mouseReleased();
}


// Initialize slider DOM elements to match sliderValues
function initializeSliders() {
    for (let prop in sliderValues) {
        let element = document.getElementById(prop + 'Slider') || document.getElementById(prop + 'Picker');
        if (element) {
            if (sliderValues[prop].min !== undefined) {
                element.min = sliderValues[prop].min;
                element.max = sliderValues[prop].max;
            }
            element.value = sliderValues[prop].value;
            let valueElement = document.getElementById(prop + 'Value');
            if (valueElement) {
                valueElement.textContent = sliderValues[prop].value;
            }
        }
    }
}

// Function to dynamically set multiple slider values
function setSliderValues(newValues) {
    for (let prop in newValues) {
        if (newValues.hasOwnProperty(prop) && sliderValues.hasOwnProperty(prop)) {
            let val = newValues[prop];
            if (typeof val === 'number') {
                updateSliderValue(prop, val);
            } else if (typeof val === 'string') {
                updateColorValue(prop, val);
            } else if (typeof val === 'object') {
                if (val.min !== undefined) sliderValues[prop].min = val.min;
                if (val.value !== undefined) {
                    if (typeof val.value === 'number') {
                        updateSliderValue(prop, val.value);
                    } else {
                        updateColorValue(prop, val.value);
                    }
                }
                if (val.max !== undefined) sliderValues[prop].max = val.max;
                // Update slider min/max
                let slider = document.getElementById(prop + 'Slider');
                if (slider) {
                    slider.min = sliderValues[prop].min;
                    slider.max = sliderValues[prop].max;
                }
            }
        }
    }
}

// menu toggle function
function toggleMenu() {
    const menuContent = document.getElementById('menuContent');
    const arrow = document.querySelector('.dropdown-arrow');

    if (menuContent.classList.contains('expanded')) {
        menuContent.classList.remove('expanded');
        arrow.classList.remove('expanded');
    } else {
        menuContent.classList.add('expanded');
        arrow.classList.add('expanded');
    }
}

// controls toggle function
function toggleControls() {
    const controlsContent = document.getElementById('controlsContent');
    const arrow = document.querySelector('.controls-header .dropdown-arrow');

    if (controlsContent.classList.contains('expanded')) {
        controlsContent.classList.remove('expanded');
        arrow.classList.remove('expanded');
    } else {
        controlsContent.classList.add('expanded');
        arrow.classList.add('expanded');
    }
}

// obstacle toggle function
function toggleObstacle() {
    const obstacleContent = document.getElementById('obstacleContent');
    const arrow = document.querySelector('.obstacle-header .dropdown-arrow');

    if (obstacleContent.classList.contains('expanded')) {
        obstacleContent.classList.remove('expanded');
        arrow.classList.remove('expanded');
    } else {
        obstacleContent.classList.add('expanded');
        arrow.classList.add('expanded');
    }
}

// presets toggle function
function togglePresets() {
    const presetsContent = document.getElementById('presetsContent');
    const arrow = document.querySelector('.presets-header .dropdown-arrow');

    if (presetsContent.classList.contains('expanded')) {
        presetsContent.classList.remove('expanded');
        arrow.classList.remove('expanded');
    } else {
        presetsContent.classList.add('expanded');
        arrow.classList.add('expanded');
        updatePresetDropdown();
    }
}

// slider update function
function updateSliderValue(property, value) {
    sliderValues[property].value = parseFloat(value);
    document.getElementById(property + 'Value').textContent = value;
    if (property === 'numRows') {
        currentPoints = generateGridPoints(sliderValues.numRows.value, 3, sliderValues.rowWidth.value, sliderValues.colWidth.value, sliderValues.randomOffset.value * (currentShape + 1), currentShape);
        nextPoints = generateGridPoints(sliderValues.numRows.value, 3, sliderValues.rowWidth.value, sliderValues.colWidth.value, sliderValues.randomOffset.value * (currentShape + 2), currentShape + 1);
    }
    // if (property === 'obstaclePushStrength' && obstacleManager) {
    //     obstacleManager.pushStrength = parseFloat(value);
    // }
    redraw();
}

// color update function
function updateColorValue(property, value) {
    sliderValues[property].value = value;
    
    // Update DOM input and custom swatch
    const inputId = property + 'Picker';
    const input = document.getElementById(inputId);
    if (input) {
        input.value = value;
        // Update custom swatch if it exists
        if (input.nextSibling && input.nextSibling.classList && input.nextSibling.classList.contains('color-swatch-trigger')) {
            input.nextSibling.style.backgroundColor = value;
        }
    }

    redraw();
}

// update text function
function updateText(value) {
    displayText = value;
    makeStrips();
}

// refresh sketch function
function refreshSketch() {
    redraw();
}

// toggle flag function
function toggleFlag(flag) {
    flags[flag] = !flags[flag];
    if (flag === 'mode') {
        redraw();
    }
}

// update obstacle mode function
function updateObstacleMode(mode) {
    // if (obstacleManager) {
    //     obstacleManager.setMode(mode);
    //     console.log('obstacle mode:', mode);
    //     redraw();
    // }
}

// animation control functions
function toggleAnimation() {
    isAnimating = !isAnimating;
    const button = document.getElementById('stopButton');
    button.textContent = isAnimating ? 'Stop Animation' : 'Start Animation';
    if (isAnimating) {
        loop();
    } else {
        noLoop();
    }
}

function exportFrame() {
    saveCanvas('animation_frame', 'png');
}

function exportGraphics() {
    let g = createGraphics(width, height);
    g.clear(); // Set to transparent
    drawScene(g);
    g.save('graphics_no_bg.svg');
}

// Preset functions
function updatePresetDropdown() {
    const select = document.getElementById('presetSelect');
    const names = presetManager.getPresetNames();
    
    // Clear existing options except the first
    select.innerHTML = '<option value="">Select a preset...</option>';
    
    // Add preset options
    names.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    });
}

function savePreset() {
    const nameInput = document.getElementById('presetNameInput');
    const name = nameInput.value.trim();
    const statusDiv = document.getElementById('presetStatus');
    
    if (!name) {
        statusDiv.textContent = 'Please enter a preset name';
        statusDiv.style.color = '#ff6b6b';
        return;
    }
    
    try {
        // Capture current state
        const state = {
            sliderValues: { ...sliderValues },
            flags: { ...flags }
        };
        
        // Check if preset exists
        if (presetManager.presetExists(name)) {
            if (!confirm(`Preset "${name}" already exists. Overwrite?`)) {
                statusDiv.textContent = 'Save cancelled';
                statusDiv.style.color = '#ffa500';
                return;
            }
        }
        
        const result = presetManager.savePreset(name, state, true);
        statusDiv.textContent = result.message;
        statusDiv.style.color = '#4ecdc4';
        nameInput.value = '';
        updatePresetDropdown();
    } catch (error) {
        statusDiv.textContent = error.message;
        statusDiv.style.color = '#ff6b6b';
    }
}

function loadPreset() {
    const select = document.getElementById('presetSelect');
    const selectedName = select.value;
    const statusDiv = document.getElementById('presetStatus');
    
    if (!selectedName) {
        statusDiv.textContent = 'Please select a preset';
        statusDiv.style.color = '#ff6b6b';
        return;
    }
    
    try {
        const result = presetManager.loadPreset(selectedName);
        const state = result.state;
        
        // Apply slider values
        if (state.sliderValues) {
            Object.keys(state.sliderValues).forEach(key => {
                if (sliderValues[key]) {
                    sliderValues[key].value = state.sliderValues[key].value;
                    // Update DOM
                    const slider = document.getElementById(key + 'Slider');
                    const valueSpan = document.getElementById(key + 'Value');
                    if (slider) slider.value = state.sliderValues[key].value;
                    if (valueSpan) valueSpan.textContent = state.sliderValues[key].value;
                }
            });
        }
        
        // Apply flags
        if (state.flags) {
            Object.assign(flags, state.flags);
        }
        
        // update obstacle manager push strength if it exists
        // if (obstacleManager && state.sliderValues && state.sliderValues.obstaclePushStrength) {
        //     obstacleManager.pushStrength = state.sliderValues.obstaclePushStrength.value;
        // }
        
        // regenerate points if grid dimensions changed
        currentPoints = generateGridPoints(sliderValues.numRows.value, 3, sliderValues.rowWidth.value, sliderValues.colWidth.value, sliderValues.randomOffset.value * (currentShape + 1), currentShape);
        nextPoints = generateGridPoints(sliderValues.numRows.value, 3, sliderValues.rowWidth.value, sliderValues.colWidth.value, sliderValues.randomOffset.value * (currentShape + 2), currentShape + 1);
        
        statusDiv.textContent = result.message;
        statusDiv.style.color = '#4ecdc4';
        redraw();
    } catch (error) {
        statusDiv.textContent = error.message;
        statusDiv.style.color = '#ff6b6b';
    }
}

function deletePreset() {
    const select = document.getElementById('presetSelect');
    const selectedName = select.value;
    const statusDiv = document.getElementById('presetStatus');
    
    if (!selectedName) {
        statusDiv.textContent = 'Please select a preset to delete';
        statusDiv.style.color = '#ff6b6b';
        return;
    }
    
    if (!confirm(`Delete preset "${selectedName}"?`)) {
        statusDiv.textContent = 'Delete cancelled';
        statusDiv.style.color = '#ffa500';
        return;
    }
    
    try {
        const result = presetManager.deletePreset(selectedName);
        statusDiv.textContent = result.message;
        statusDiv.style.color = '#4ecdc4';
        updatePresetDropdown();
    } catch (error) {
        statusDiv.textContent = error.message;
        statusDiv.style.color = '#ff6b6b';
    }
}

function exportPresets() {
    const data = presetManager.exportPresets();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grids-presets.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    const statusDiv = document.getElementById('presetStatus');
    statusDiv.textContent = 'Presets exported successfully';
    statusDiv.style.color = '#4ecdc4';
}

// Handle import file selection
document.getElementById('importFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const statusDiv = document.getElementById('presetStatus');
    
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            const result = presetManager.importPresets(data);
            statusDiv.textContent = result.message;
            statusDiv.style.color = '#4ecdc4';
            updatePresetDropdown();
        } catch (error) {
            statusDiv.textContent = 'Import failed: ' + error.message;
            statusDiv.style.color = '#ff6b6b';
        }
    };
    reader.readAsText(file);
});

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
