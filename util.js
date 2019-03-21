let programs = {};
let frameBuffers = {};
let textures = {};
let glBoilerplate = initBoilerPlate();

function createProgram(programName, vertexShader, fragmentShader) {
    let program = glBoilerplate.programFromSources(gl, vertexShader, fragmentShader);
    gl.useProgram(program);
    glBoilerplate.bindScreenVerts(gl, program);
    programs[programName] = {
        program: program,
        uniforms: {}
    };
}

function resetTexture(name, width, height) {
    textures[name] = glBoilerplate.createTexture(gl, width, height, ext.HALF_FLOAT_OES, null);
}

function setTexture(name, texture) {
    textures[name] = textures[texture];
}

function resetTextureImage(name, url) {
    textures[name] = loadTexture(gl, "assets/" + url)
}

function resetFrameBufferForTexture(textureName) {
    let texture = textures[textureName];
    let framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    frameBuffers[textureName] = framebuffer;
}

function setUniformForProgram(programName, name, val, type) {
    let uniforms = programs[programName].uniforms;
    let location = uniforms[name];
    if (!location) {
        location = gl.getUniformLocation(programs[programName].program, name);
        uniforms[name] = location;
    }

    switch(type) {
        case "1i":
            gl.uniform1i(location, val);
            break;
        case "1f":
            gl.uniform1f(location, val);
            break;
        case "2f":
            gl.uniform2f(location, val[0], val[1]);
            break;
        case "3f":
            gl.uniform3f(location, val[0], val[1], val[2]);
            break;
        case "4f":
            gl.uniform4f(location, val[0], val[1], val[2], val[3]);
            break;
    }
}

function updateUniformForProgram(programName, name, val, type) {
    setProgram(programName);
    setUniformForProgram(programName, name, val, type)
}

function setSize(width, height) {
    gl.viewport(0, 0, width, height);
}

function setProgram(programName) {
    gl.useProgram(programs[programName].program);
}

function executeShader(programName, inputTextures, outputTexture) {
    gl.useProgram(programs[programName].program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffers[outputTexture]);
    for (let i = 0; i < inputTextures.length; i++) {
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, textures[inputTextures[i]]);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function swapTextures(texture1Name, texture2Name) {
    let temp = textures[texture1Name];
    textures[texture1Name] = textures[texture2Name];
    textures[texture2Name] = temp;
    temp = frameBuffers[texture1Name];
    frameBuffers[texture1Name] = frameBuffers[texture2Name];
    frameBuffers[texture2Name] = temp;
}

//
// Initialize a texture and load an image.
// When the image finishes loading, copy it into the texture.
//
// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
//
function loadTexture(gl, url) {
    function isPowerOf2(value) {
        return (value & (value - 1)) === 0;
    }

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Because images have to be download over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);

    const image = new Image();
    image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);

        // WebGL1 has different requirements for power of 2 images
        // vs non power of 2 images so check if the image is a
        // power of 2 in both dimensions.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // No, it's not a power of 2. Turn off mips and set
            // wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    };
    image.src = url;

    return texture;
}