/** Small, dependency-free WebGL sculpture. Elliptical torus geometry with satin lighting. */
export function mountMonogram({ reducedMotion, finePointer }) {
  const canvas = document.getElementById("monogram");
  const stage = document.getElementById("monogram-stage");
  const art = document.querySelector(".hero-art");
  let gl,
    program,
    shaders = [],
    buffers = [],
    frame = 0,
    observer,
    resizeObserver;
  let disposed = false,
    lost = false,
    inView = false,
    previous = 0,
    time = 0;
  let targetX = 0,
    targetY = 0,
    pointerX = 0,
    pointerY = 0;
  const pause = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
  };
  const showFallback = () => stage.classList.remove("is-rendered");
  const active = () =>
    !disposed && !lost && inView && !document.hidden && !reducedMotion.matches;
  const vertex = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute vec2 aUV;
    uniform mat4 uModel;
    uniform mat4 uProjection;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUV;
    void main() {
      vec4 world = uModel * vec4(aPosition, 1.0);
      vPosition = world.xyz;
      vNormal = mat3(uModel) * aNormal;
      vUV = aUV;
      world.z -= 5.7;
      gl_Position = uProjection * world;
    }`;
  const fragment = `
    precision mediump float;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUV;
    void main() {
      vec3 n = normalize(vNormal);
      vec3 view = normalize(vec3(0.0, 0.0, 5.7) - vPosition);
      vec3 reflection = reflect(-view, n);
      float key = pow(max(dot(reflection, normalize(vec3(-0.6, 1.0, 1.6))), 0.0), 16.0);
      float strip = pow(max(dot(reflection, normalize(vec3(1.8, 0.4, 1.0))), 0.0), 26.0);
      float rim = pow(1.0 - abs(dot(n, view)), 2.8);
      float diffuse = max(dot(n, normalize(vec3(-0.7, 1.4, 2.0))), 0.0);
      float grain = sin(vUV.x * 1600.0) * 0.006;
      vec3 color = vec3(0.065, 0.078, 0.054) + diffuse * vec3(0.18, 0.21, 0.15);
      color += key * vec3(0.8, 0.86, 0.7) + strip * vec3(0.32, 0.4, 0.23);
      color += rim * vec3(0.22, 0.29, 0.13) + grain;
      // A narrow lime inlay on the outer shoulder of the same sculptural O.
      float seam = (1.0 - smoothstep(0.007, 0.014, abs(vUV.y - 0.075)));
      color = mix(color, vec3(0.66, 0.9, 0.30) * (0.65 + diffuse * 0.35), seam);
      gl_FragColor = vec4(pow(color, vec3(0.8)), 1.0);
    }`;
  function compile(type, source) {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("Shader allocation failed");
    shaders.push(shader);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      throw new Error("Shader compilation failed");
    return shader;
  }
  function buffer(data, type = gl.ARRAY_BUFFER) {
    const item = gl.createBuffer();
    if (!item) throw new Error("Buffer allocation failed");
    buffers.push(item);
    gl.bindBuffer(type, item);
    gl.bufferData(type, data, gl.STATIC_DRAW);
    return item;
  }
  // Column-major matrices. Geometry stays in local space; only the model changes.
  function multiply(a, b) {
    const result = new Float32Array(16);
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        for (let k = 0; k < 4; k++)
          result[col * 4 + row] += a[k * 4 + row] * b[col * 4 + k];
      }
    }
    return result;
  }
  function model(x, y, z) {
    const cx = Math.cos(x),
      sx = Math.sin(x),
      cy = Math.cos(y),
      sy = Math.sin(y),
      cz = Math.cos(z),
      sz = Math.sin(z);
    const rx = new Float32Array([
      1,
      0,
      0,
      0,
      0,
      cx,
      sx,
      0,
      0,
      -sx,
      cx,
      0,
      0,
      0,
      0,
      1,
    ]);
    const ry = new Float32Array([
      cy,
      0,
      -sy,
      0,
      0,
      1,
      0,
      0,
      sy,
      0,
      cy,
      0,
      0,
      0,
      0,
      1,
    ]);
    const rz = new Float32Array([
      cz,
      sz,
      0,
      0,
      -sz,
      cz,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
    ]);
    return multiply(rz, multiply(ry, rx));
  }
  let uModel, count;
  function resize() {
    if (!gl || lost || disposed) return;
    const dpr = Math.min(
      window.devicePixelRatio || 1,
      mobileSize() ? 1.25 : 1.75,
    );
    const width = Math.max(1, Math.round(stage.clientWidth * dpr));
    const height = Math.max(1, Math.round(stage.clientHeight * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
    const f = 1 / Math.tan((36 * Math.PI) / 360),
      near = 0.1,
      far = 20;
    gl.uniformMatrix4fv(
      gl.getUniformLocation(program, "uProjection"),
      false,
      new Float32Array([
        f / (width / height),
        0,
        0,
        0,
        0,
        f,
        0,
        0,
        0,
        0,
        (far + near) / (near - far),
        -1,
        0,
        0,
        (2 * far * near) / (near - far),
        0,
      ]),
    );
  }
  function mobileSize() {
    return window.innerWidth < 768;
  }
  function draw(now) {
    frame = 0;
    if (!active()) return;
    const delta = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
    previous = now;
    time += delta;
    const easing = 1 - Math.exp(-delta * 5);
    pointerX += (targetX - pointerX) * easing;
    pointerY += (targetY - pointerY) * easing;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const transform = model(
      0.21 + Math.sin(time * 0.32) * 0.08 + pointerY,
      -0.42 + Math.sin(time * 0.24) * 0.14 + pointerX,
      -0.32 + Math.sin(time * 0.2) * 0.045,
    );
    transform[13] = Math.sin(time * 0.65) * 0.045;
    gl.uniformMatrix4fv(uModel, false, transform);
    gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
    stage.classList.add("is-rendered");
    frame = requestAnimationFrame(draw);
  }
  function sync() {
    pause();
    if (reducedMotion.matches || lost) showFallback();
    if (active()) {
      resize();
      frame = requestAnimationFrame(draw);
    }
  }
  function pointer(event) {
    if (!finePointer.matches || reducedMotion.matches) return;
    const rect = art.getBoundingClientRect();
    targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 0.24;
    targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 0.18;
  }
  function resetPointer() {
    targetX = 0;
    targetY = 0;
  }
  function contextLost(event) {
    event.preventDefault();
    lost = true;
    sync();
  }
  function contextRestored() {
    dispose();
    mountMonogram({ reducedMotion, finePointer });
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    pause();
    showFallback();
    observer?.disconnect();
    resizeObserver?.disconnect();
    document.removeEventListener("visibilitychange", sync);
    reducedMotion.removeEventListener("change", sync);
    finePointer.removeEventListener("change", resetPointer);
    art.removeEventListener("pointermove", pointer);
    art.removeEventListener("pointerleave", resetPointer);
    canvas.removeEventListener("webglcontextlost", contextLost);
    canvas.removeEventListener("webglcontextrestored", contextRestored);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("pageshow", onPageShow);
    if (gl && !gl.isContextLost()) {
      buffers.forEach((item) => gl.deleteBuffer(item));
      shaders.forEach((item) => gl.deleteShader(item));
      if (program) gl.deleteProgram(program);
    }
  }
  function onPageHide(event) {
    if (event.persisted) pause();
    else dispose();
  }
  function onPageShow(event) {
    if (event.persisted) sync();
  }
  try {
    gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: !mobileSize(),
      powerPreference: "low-power",
    });
    if (!gl) return;
    program = gl.createProgram();
    if (!program) throw new Error("Program allocation failed");
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error("Shader linking failed");
    gl.useProgram(program);
    const positions = [],
      normals = [],
      uvs = [],
      indices = [];
    const segments = mobileSize() ? 80 : 128,
      sides = 32;
    for (let i = 0; i <= segments; i++) {
      const u = (i / segments) * Math.PI * 2;
      for (let j = 0; j <= sides; j++) {
        const v = (j / sides) * Math.PI * 2;
        // Elliptical centerline with a circular section: a tall, sculptural letter O.
        const nx = Math.cos(u),
          ny = Math.sin(u);
        positions.push(
          (1.02 + 0.285 * Math.cos(v)) * nx,
          (1.26 + 0.285 * Math.cos(v)) * ny,
          0.285 * Math.sin(v),
        );
        // Account for the elliptical centerline tangent when deriving normals.
        const length = Math.hypot(1.26 * nx, 1.02 * ny);
        normals.push(
          ((1.26 * nx) / length) * Math.cos(v),
          ((1.02 * ny) / length) * Math.cos(v),
          Math.sin(v),
        );
        uvs.push(i / segments, j / sides);
        if (i < segments && j < sides) {
          const a = i * (sides + 1) + j,
            b = a + sides + 1;
          indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
    }
    [
      ["aPosition", positions, 3],
      ["aNormal", normals, 3],
      ["aUV", uvs, 2],
    ].forEach(([name, data, size]) => {
      buffer(new Float32Array(data));
      const location = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
    });
    buffer(new Uint16Array(indices), gl.ELEMENT_ARRAY_BUFFER);
    count = indices.length;
    uModel = gl.getUniformLocation(program, "uModel");
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver((entries) => {
        inView = entries[0].isIntersecting;
        sync();
      });
      observer.observe(art);
    } else {
      inView = true;
    }
    document.addEventListener("visibilitychange", sync);
    reducedMotion.addEventListener("change", sync);
    finePointer.addEventListener("change", resetPointer);
    art.addEventListener("pointermove", pointer);
    art.addEventListener("pointerleave", resetPointer);
    canvas.addEventListener("webglcontextlost", contextLost);
    canvas.addEventListener("webglcontextrestored", contextRestored);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    sync();
  } catch {
    dispose();
  }
}
