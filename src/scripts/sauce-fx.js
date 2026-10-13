// Gerçek zamanlı sos katmanı (WebGL): üst kenardan sarkan parlak damlalar + arkada akan sos dalgaları.
// Renk tek bir "albedo" olarak verilir (aromanın etiketinden okunan sos rengi); ışık yalnızca
// kenarları koyulaştırır ve parlama ekler, düz yüzeyler verilen rengin aynısıdır.

const MAX = 28;

const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform vec2 u_res;       // tuval boyutu (piksel)
uniform float u_time;
uniform vec3 u_color;     // sos rengi (sRGB 0..1)
uniform float u_show;     // tüm katmanın görünürlüğü
uniform float u_drip;     // damla uzunluğu 0..1
uniform float u_wave;     // dalga görünürlüğü 0..1
uniform float u_band;     // üst şeridin alt kenarı (yükseklik birimi)
uniform float u_maxLen;   // en uzun damla (yükseklik birimi)
uniform float u_maskLeft; // 1: soldaki metin alanında dalga yok
uniform float u_drips;    // 1: üstten damlalar çizilir
uniform vec2 u_waveLine;  // sos akışının ekseni: (ekran ortasına göre enine kayma, açı radyan)
uniform vec3 u_d[${MAX}]; // damlalar: x, yarıçap, uzunluk

float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0); return mix(b, a, h) - k*h*(1.0-h); }

// Şerit + damlaların işaretli uzaklığı (içerisi negatif)
float sdSauce(vec2 p){
  float d = p.y - u_band;
  if (p.y > u_band + u_maxLen * u_drip + 0.12) return d;
  for (int i = 0; i < ${MAX}; i++){
    vec3 q = u_d[i];
    if (q.y <= 0.0) continue;
    float fi = float(i);
    float L = q.z * u_drip * (1.0 + 0.05*sin(u_time*0.7 + fi*1.7));
    vec2 a = vec2(q.x + 0.002*sin(u_time*0.5 + fi), u_band - q.y);
    float hgt = L + q.y;
    vec2 pa = p - a;
    float hh = clamp(pa.y / max(hgt, 0.0001), 0.0, 1.0);
    float neck = length(pa - vec2(0.0, hgt*hh)) - q.y*0.74;
    float bulb = length(p - vec2(a.x, a.y + hgt)) - q.y*mix(0.74, 1.14, smoothstep(0.0, 0.12, L));
    d = smin(d, smin(neck, bulb, 0.014), 0.024);
  }
  return d;
}
float bevel(float d){ float t = clamp(-d/0.030, 0.0, 1.0); return sqrt(1.0 - (1.0-t)*(1.0-t)); }

const vec3 LIGHT = vec3(-0.42, -0.56, 0.715);
vec3 shade(vec3 n, float gloss){
  vec3 H = normalize(LIGHT + vec3(0.0, 0.0, 1.0));
  float diff = max(dot(n, LIGHT), 0.0);
  float body = mix(0.50, 1.0, smoothstep(0.0, LIGHT.z, diff)) + 0.10*smoothstep(LIGHT.z, 1.0, diff);
  float rim = pow(1.0 - clamp(n.z, 0.0, 1.0), 3.0) * 0.30;
  float nh = max(dot(n, H), 0.0);
  float spec = pow(nh, 90.0)*0.95 + pow(nh, 40.0)*0.12; // düz yüzeyde ~0: renk kaymaz
  return u_color * body * (1.0 - rim) + vec3(1.0) * spec * gloss;
}

// Sos akışının yükseklik alanı. j = 0 öndeki ana akış, j = 1 arkadaki ince akış.
// v: akışın enine konumu (-1..1), prof: yuvarlak kesit (kenarda 0, ortada 1)
float stream(vec2 p, float j, out float v, out float prof){
  float aspect = u_res.x / u_res.y;
  vec2 q = p - vec2(aspect*0.5, 0.5);
  float ang = u_waveLine.y + j*0.22;
  float ca = cos(ang), sa = sin(ang);
  vec2 s = vec2(ca*q.x + sa*q.y, -sa*q.x + ca*q.y);   // s.x akış yönünde, s.y enine
  float t = u_time*(1.0 + j*0.15);
  float u = s.x + j*1.7;
  // akışın ekseni geniş bir S çizer ve yavaşça salınır
  float center = u_waveLine.x - j*0.21 + 0.19*sin(u*2.4 + t*0.24) + 0.07*sin(u*4.7 + t*0.36 + 1.3);
  float halfW = (0.19 - j*0.075) + 0.07*sin(u*1.6 + t*0.19 + 2.0);
  v = (s.y - center) / halfW;
  prof = sqrt(max(1.0 - v*v, 0.0));
  // az sayıda geniş kat: akış boyunca kıvrılır, birbirine karışır ve zamanla ilerler (düz paralel çizgi yok)
  float f1 = sin(v*3.2 + 2.3*sin(u*2.3 + t*0.45) + 1.1*sin(u*4.3 + v*1.6 + t*0.60));
  float f2 = sin(v*6.4 - 2.2*sin(u*1.7 + v*0.9 + t*0.33) + 1.7 + u*1.1);
  return 0.55*pow(prof, 0.6) + (0.21*f1 + 0.08*f2) * smoothstep(0.0, 0.5, prof);
}

vec4 drawStream(vec2 p, float j, float px){
  float v, prof;
  float H = stream(p, j, v, prof);
  float a = smoothstep(1.0, 0.985, abs(v));
  if (a <= 0.0) return vec4(0.0);
  float e = 2.5*px;
  float v2, p2;
  float Hx = stream(p + vec2(e, 0.0), j, v2, p2);
  float Hy = stream(p + vec2(0.0, e), j, v2, p2);
  vec3 n = normalize(vec3(-(Hx - H)/e*0.11, -(Hy - H)/e*0.11, 1.0));
  float d2 = dot(n, LIGHT)*0.5 + 0.5;
  // düz yüzey tam sos rengi; katların gölge yanı koyulaşır, ışık alan yanı açılır
  float body = mix(0.48, 1.0, smoothstep(0.30, 0.857, d2)) + 0.12*smoothstep(0.857, 1.0, d2);
  body *= mix(0.66, 1.0, smoothstep(0.0, 0.40, prof));   // kenarda sıvının kalınlığı
  vec3 Hh = normalize(LIGHT + vec3(0.0, 0.0, 1.0));
  float nh = max(dot(n, Hh), 0.0);
  // Gerçek sos gibi: parlama az, yumuşak ve sosun rengine çalan tonda (beyaz, metalik çizgi yok)
  float spec = pow(nh, 45.0)*0.20 + max(pow(nh, 14.0) - 0.34, 0.0)*0.26;
  vec3 base = mix(u_color, mix(u_color, vec3(1.0), 0.16), j);
  vec3 shine = mix(vec3(1.0), base, 0.40);
  return vec4((base*body + shine*spec) * a, a) * (1.0 - j*0.2);
}

void main(){
  float aspect = u_res.x / u_res.y;
  vec2 p = vec2(gl_FragCoord.x / u_res.y, 1.0 - gl_FragCoord.y / u_res.y);
  float px = 1.0 / u_res.y;
  vec4 col = vec4(0.0);

  // ---- arkadaki sos dalgaları: kıvrılıp incelen, üst üste binen üç şerit ----
  // ---- arkadaki sos akışı: kıvrılarak akan geniş, ipeksi iki akış (arkadaki daha açık tonda) ----
  if (u_wave > 0.001){
    float X = p.x / aspect;
    float mask = mix(1.0, smoothstep(0.22, 0.46, X), u_maskLeft) * u_wave;
    vec4 back = drawStream(p, 1.0, px);
    col = back * mask;
    // öndeki akışın arkaya düşürdüğü gölge
    float vs, ps;
    stream(p - vec2(0.014, 0.026), 0.0, vs, ps);
    float sh = smoothstep(1.14, 0.90, abs(vs)) * 0.36 * mask;
    col = col*(1.0 - sh) + vec4(0.0, 0.0, 0.0, sh);
    vec4 front = drawStream(p, 0.0, px) * mask;
    col = col*(1.0 - front.a) + front;
  }

  // ---- damlalar (yalnızca telefonda açık) ----
  if (u_drips > 0.5){
    float d = sdSauce(p);
    float sh = smoothstep(0.022, -0.006, sdSauce(p - vec2(0.008, 0.016))) * 0.30;
    col = col*(1.0 - sh) + vec4(0.0, 0.0, 0.0, sh);
    float a = smoothstep(0.0, -1.5*px, d);
    if (a > 0.0){
      float e = 2.0*px;
      float hx = bevel(sdSauce(p + vec2(e, 0.0))) - bevel(sdSauce(p - vec2(e, 0.0)));
      float hy = bevel(sdSauce(p + vec2(0.0, e))) - bevel(sdSauce(p - vec2(0.0, e)));
      vec3 n = normalize(vec3(-hx, -hy, 4.0*e/0.030));
      vec3 c3 = shade(n, 1.0);
      col = col*(1.0 - a) + vec4(c3*a, a);
    }
  }
  gl_FragColor = clamp(col, 0.0, 1.0) * u_show;
}`;

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

export function createSauceFx(canvas, { color }) {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false, alpha: true });
  if (!gl) return null;
  const compile = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n) => gl.getUniformLocation(prog, n);
  const u = { res: U('u_res'), time: U('u_time'), color: U('u_color'), show: U('u_show'), drip: U('u_drip'), wave: U('u_wave'), band: U('u_band'), maxLen: U('u_maxLen'), maskLeft: U('u_maskLeft'), drips: U('u_drips'), waveLine: U('u_waveLine'), d: U('u_d[0]') };

  // Dışarıdan (GSAP ile) değiştirilen durum. mask: 1 olduğunda dalgalar soldaki metin alanına girmez.
  const state = { show: 1, drip: 0.55, wave: 0.7, mask: 0, rgb: hexToRgb(color) };
  let layout = { band: 0.1, maxLen: 0.4, drips: 1, waveLine: [0.9, -0.25] };

  // Damla dizilimi: sabit tohumlu, her açılışta aynı. Ölçüler CSS pikseli; tuval yüksekliğine bölünür.
  function setLayout({ bandPx = 0, scale = 1, drips = true, waveLine }) {
    const textZone = false;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    let seed = 11;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const data = new Float32Array(MAX * 3);
    let maxLen = 0, i = 0;
    for (let x = -12 * scale; x < w && i < MAX; i++) {
      const dw = (26 + rnd() * 42) * scale;
      const cap = (textZone && x < w * 0.42 ? 120 : 360) * scale; // soldaki metin alanına uzun damla gelmesin
      const len = (0.16 + Math.pow(rnd(), 1.7) * 0.84) * cap;
      data.set([(x + dw / 2) / h, dw / 2 / h, len / h], i * 3);
      maxLen = Math.max(maxLen, len / h);
      x += dw + (10 + rnd() * 64) * scale;
    }
    gl.uniform3fv(u.d, data);
    layout = { band: bandPx / h, maxLen, drips: drips ? 1 : 0, waveLine };
  }

  // Telefonda ve tablette düşük çözünürlükte çizilip büyütülür: akan sos yumuşak geçişli olduğu için fark edilmez, cihazı yormaz
  const kucuk = window.matchMedia('(max-width: 900px), (pointer: coarse)').matches;
  function resize() {
    const dpr = kucuk ? 0.6 : Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
  }

  const t0 = performance.now();
  function render(frozen = false) {
    if (!canvas.width || !canvas.height) return;
    gl.uniform2f(u.res, canvas.width, canvas.height);
    gl.uniform1f(u.time, frozen ? 0 : (performance.now() - t0) / 1000);
    gl.uniform3f(u.color, state.rgb[0], state.rgb[1], state.rgb[2]);
    gl.uniform1f(u.show, state.show);
    gl.uniform1f(u.drip, state.drip);
    gl.uniform1f(u.wave, state.wave);
    gl.uniform1f(u.band, layout.band);
    gl.uniform1f(u.maxLen, layout.maxLen);
    gl.uniform1f(u.maskLeft, state.mask);
    gl.uniform1f(u.drips, layout.drips);
    gl.uniform2f(u.waveLine, layout.waveLine[0], layout.waveLine[1]);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  return { state, setLayout, resize, render, hexToRgb };
}
