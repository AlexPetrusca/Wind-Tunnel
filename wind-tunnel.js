let actualWidth = 1500;
let actualHeight = 750;
let gridWidth = actualWidth / 5;
let gridHeight = actualHeight / 5;

let gl, ext;
let view = "tx_material";

// initialization functions
function init() {
    let canvas = document.getElementById("myCanvas");
    gl = canvas.getContext("webgl");
    ext = gl.getExtension("OES_texture_half_float");

    // listen for selections of new visualisation types
    let objectSelect = document.getElementById("object-select");
    objectSelect.addEventListener('change', function(event) {
        setTexture("tx_obstacle", objectSelect.value);
        resetWindow();
    });

    for (const option of objectSelect.options) {
        resetTextureImage(option.value, option.value);
    }

    setTexture("tx_obstacle", "circle.jpg");

    gl.disable(gl.DEPTH_TEST);

    // setup GLSL programs
    createProgram("reset_velocity", "vertex", "reset_velocity_fragment");
    createProgram("render_obstacle", "vertex", "obstacle_render_fragment");

    createProgram("obstacle_velocity", "vertex", "obstacle_velocity_fragment");
    setUniformForProgram("obstacle_velocity", "u_textureSize", [gridWidth, gridHeight], "2f");
    setUniformForProgram("obstacle_velocity", "u_velocity", 0, "1i");
    setUniformForProgram("obstacle_velocity", "u_obstacle", 1, "1i");

    createProgram("obstacle_pressure", "vertex", "obstacle_pressure_fragment");
    setUniformForProgram("obstacle_pressure", "u_textureSize", [gridWidth, gridHeight], "2f");
    setUniformForProgram("obstacle_pressure", "u_pressure", 0, "1i");
    setUniformForProgram("obstacle_pressure", "u_obstacle", 1, "1i");

    createProgram("render", "vertex", "render_fragment");
    setUniformForProgram("render", "u_textureSize", [actualWidth, actualHeight], "2f");
    setUniformForProgram("render", "u_screenSize", [actualWidth, actualHeight], "2f");
    setUniformForProgram("render", "u_material", 0, "1i");
    setUniformForProgram("render", "u_obstacle", 1, "1i");

    createProgram("gradient_subtraction", "vertex", "gradient_subtraction_fragment");
    setUniformForProgram("gradient_subtraction", "u_textureSize", [gridWidth, gridHeight], "2f");
    setUniformForProgram("gradient_subtraction", "u_velocity", 0, "1i");
    setUniformForProgram("gradient_subtraction", "u_pressure", 1, "1i");

    createProgram("diverge", "vertex", "divergence_fragment");
    setUniformForProgram("diverge", "u_textureSize", [gridWidth, gridHeight], "2f");
    setUniformForProgram("diverge", "u_velocity", 0, "1i");

    createProgram("jacobi", "vertex", "jacobi_diffusion_fragment");
    setUniformForProgram("jacobi", "u_textureSize", [gridWidth, gridHeight], "2f");
    setUniformForProgram("jacobi", "u_divergence", 0, "1i");
    setUniformForProgram("jacobi", "u_pressure", 1, "1i");

    createProgram("advect_material", "vertex", "advect_material_fragment");
    setUniformForProgram("advect_material", "u_textureSize", [gridWidth, gridHeight], "2f");
    setUniformForProgram("advect_material", "u_screenSize", [actualWidth, actualHeight], "2f");
    setUniformForProgram("advect_material", "u_material", 0, "1i");
    setUniformForProgram("advect_material", "u_velocity", 1, "1i");

    createProgram("advect_velocity", "vertex", "advect_velocity_fragment");
    setUniformForProgram("advect_velocity", "u_textureSize", [gridWidth, gridHeight], "2f");
    setUniformForProgram("advect_velocity", "u_velocity", 0, "1i");

    resetWindow();
    render();
}

// render functions
function render() {
    setSize(gridWidth, gridHeight);
    advectVelocity();
    applyDiffusion(20);
    applyProjection();

    setSize(actualWidth, actualHeight);
    advectMaterial();

    window.requestAnimationFrame(render);
}

function advectVelocity() {
    executeShader("advect_velocity", ["tx_velocity"], "tx_next_velocity");
    executeShader("obstacle_velocity", ["tx_next_velocity", "tx_obstacle"], "tx_velocity");
}

function applyDiffusion(n) {
    executeShader("diverge", ["tx_velocity"], "tx_divergence"); // calc velocity divergence
    for (let i = 0; i < n; i++) {
        executeShader("jacobi", ["tx_divergence", "tx_pressure"], "tx_next_pressure"); // diffuse velocity
        executeShader("jacobi", ["tx_divergence", "tx_next_pressure"], "tx_pressure"); // diffuse velocity
    }
}

function applyProjection() {
    // compute pressure
    executeShader("obstacle_pressure", ["tx_pressure", "tx_obstacle"], "tx_next_pressure");
    swapTextures("tx_next_pressure", "tx_pressure");

    // subtract pressure gradient
    executeShader("gradient_subtraction", ["tx_velocity", "tx_pressure"], "tx_next_velocity");
    executeShader("obstacle_velocity", ["tx_next_velocity", "tx_obstacle"], "tx_velocity");
}

function advectMaterial() {
    executeShader("advect_material", ["tx_material", "tx_velocity"], "tx_next_material");
    executeShader("render", [view, "tx_obstacle"]);
    swapTextures("tx_next_material", "tx_material");
}

// reset functions
function resetWindow() {
    resetTextures();
}

function resetTextures() {
    resetTexture("tx_velocity", gridWidth, gridHeight); // velocity
    resetFrameBufferForTexture("tx_velocity");
    executeShader("reset_velocity", [], "tx_velocity");

    resetTexture("tx_next_velocity", gridWidth, gridHeight); // velocity
    resetFrameBufferForTexture("tx_next_velocity");
    executeShader("reset_velocity", [], "tx_next_velocity");

    resetTexture("tx_divergence", gridWidth, gridHeight);
    resetFrameBufferForTexture("tx_divergence");

    resetTexture("tx_pressure", gridWidth, gridHeight);
    resetFrameBufferForTexture("tx_pressure");

    resetTexture("tx_next_pressure", gridWidth, gridHeight);
    resetFrameBufferForTexture("tx_next_pressure");

    resetTexture("tx_material", actualWidth, actualHeight); // material
    resetFrameBufferForTexture("tx_material");

    resetTexture("tx_next_material", actualWidth, actualHeight); // material
    resetFrameBufferForTexture("tx_next_material");
}

// HTML listener functions
function materialView() {
    view = "tx_material";
    updateUniformForProgram("render", "u_textureSize", [actualWidth, actualHeight], "2f");
}

function velocityView() {
    view = "tx_velocity";
    updateUniformForProgram("render", "u_textureSize", [gridWidth, gridHeight], "2f");
}

function pressureView() {
    view = "tx_pressure";
    updateUniformForProgram("render", "u_textureSize", [gridWidth, gridHeight], "2f");
}

// program entry-point
window.onload = init;
