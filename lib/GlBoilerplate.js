function initBoilerPlate() {
    // Creates and compiles a shader
    function compileShader(gl, shaderSource, shaderType) {
        // Create the shader object
        let shader = gl.createShader(shaderType);

        // Set the shader source code
        gl.shaderSource(shader, shaderSource);

        // Compile the shader
        gl.compileShader(shader);

        return shader;
    }

    // Creates a program from 2 shaders (vertex and fragment)
    function createProgram(gl, vertexShader, fragmentShader) {
        // create a program
        let program = gl.createProgram();

        // attach the shaders
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);

        // link the program
        gl.linkProgram(program);

        return program;
    }

    // Creates a program from 2 script tag ids
    function programFromSources(gl, vertexShaderId, fragmentShaderId) {
        let vertexShader = shaderFromSource(gl, vertexShaderId);
        let fragmentShader = shaderFromSource(gl, fragmentShaderId);
        return createProgram(gl, vertexShader, fragmentShader);
    }

    // Creates a shader from a script tag id
    function shaderFromSource(gl, scriptId, opt_shaderType) {
        // look up the script tag by id
        let shaderScript = document.getElementById(scriptId);

        // extract the contents of the script tag
        let shaderSource = shaderScript.text;

        // If we didn't pass in a type, use the 'type' from the script tag
        if (!opt_shaderType) {
            if (shaderScript.type === "x-shader/x-vertex") {
                opt_shaderType = gl.VERTEX_SHADER;
            } else if (shaderScript.type === "x-shader/x-fragment") {
                opt_shaderType = gl.FRAGMENT_SHADER;
            }
        }

        return compileShader(gl, shaderSource, opt_shaderType);
    }

    // Binds the coordinates of the WebGL screen corners to attribute "a_position",
    // so that we can create a square geometry over our entire canvas and draw our
    // generated textures over this geometry (pretty much creates a mesh over our
    // scene to display our fluid simulation texture on)
    function bindScreenVerts(gl, program) {
        let screen_corners = [
            -1, -1,  // bottom-left screen corner
            1, -1,  // bottom-right screen corner
            -1, 1,  // top-left screen corner
            1, 1   // top-right screen corner
        ];

        // buffer screen corner data
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(screen_corners), gl.STATIC_DRAW);

        // tell WebGL how to interpret our screen corner buffer
        let positionLocation = gl.getAttribLocation(program, "a_position");
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    }

    // Creates and bind texture from input data
    function createTexture(gl, width, height, type, data) {
        let texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Set the parameters so we can render any size image
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, type, data);

        return texture;
    }

    // return object that exposes the following functions
    return {
        programFromSources: programFromSources,
        bindScreenVerts: bindScreenVerts,
        createTexture: createTexture
    }
}