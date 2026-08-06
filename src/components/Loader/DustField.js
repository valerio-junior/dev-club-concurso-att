import * as THREE from "three";
import { gsap } from "../../lib/gsap";

const PRIMARY_COLOR = 0xd7ff3f;
const BLUE_COLOR = 0x60a5fa; // mesma cor da fumaça do "DevClub" — agora também a cor principal da teia
const BLUE_DARK_COLOR = 0x2563eb;
const PARTICLE_COUNT = 1400;
const CLUSTER_COUNT = 22;
const CLUSTER_NODES_MIN = 4;
const CLUSTER_NODES_MAX = 8;
const ENERGY_PULSE_COUNT = 60;

export function domToNdc(clientX, clientY) {
  return [(clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1];
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Cena Three.js única, compartilhada pela intro inteira (montada uma vez, no topo do Loader):
 *
 * - Teia tecnológica: uma malha de nós conectados por linhas cobrindo a tela toda de ponta a ponta
 *   (grid com jitter, não pontos soltos aleatórios — garante que não sobra espaço vazio), com
 *   pulsos de energia viajando pelas cordas entre os nós. Ativa do início ao fim da intro.
 * - Pontos: o mesmo buffer de partículas serve pra fumaça azul que forma "DevClub" e, na sequência,
 *   pro derretimento final da tela inteira — por isso ficam invisíveis (opacity 0) até a fase da
 *   fumaça, sem nenhum "pontinho" ambiente solto antes disso.
 */
export class DustField {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    this.camera.position.z = 20;

    this.particleCount = PARTICLE_COUNT;
    this.positions = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);

    this.baseRayOpacity = 0.3;
    this.rayBaseOpacity = 0;
    this._rayPulseBoost = 0;
    this._idleRotationEnabled = true;
    this._tweens = new Set();

    this._resizeCanvas();
    this._layoutGrid();

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute("color", new THREE.BufferAttribute(this.colors, 3));

    this.material = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);

    const network = this._buildNetwork();
    this.nodes = network.nodes;
    this.edges = network.edges;
    this.pulseData = network.pulseData;
    this.networkLines = network.lines;
    this.nodeGlowPoints = network.nodeGlowPoints;
    this.energyPoints = network.energyPoints;
    this.scene.add(this.networkLines, this.nodeGlowPoints, this.energyPoints);

    this._resize = this._resize.bind(this);
    this._tick = this._tick.bind(this);
    window.addEventListener("resize", this._resize);

    this._raf = requestAnimationFrame(this._tick);
  }

  _track(tween) {
    this._tweens.add(tween);
    const existingOnComplete = tween.vars.onComplete;
    tween.eventCallback("onComplete", (...args) => {
      this._tweens.delete(tween);
      existingOnComplete?.(...args);
    });
    return tween;
  }

  _resizeCanvas() {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / Math.max(height, 1);
    this.camera.updateProjectionMatrix();
  }

  _visibleSizeAtZ(z = 0) {
    const distance = this.camera.position.z - z;
    const vFov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(vFov / 2) * distance;
    const width = height * this.camera.aspect;
    return { width, height };
  }

  _layoutGrid() {
    const { width, height } = this._visibleSizeAtZ(0);
    const primary = new THREE.Color(PRIMARY_COLOR);
    const blue = new THREE.Color(BLUE_COLOR);

    for (let i = 0; i < this.particleCount; i += 1) {
      const ix = i * 3;
      const x = THREE.MathUtils.randFloatSpread(width * 1.15);
      const y = THREE.MathUtils.randFloatSpread(height * 1.15);
      const z = THREE.MathUtils.randFloatSpread(6);

      this.positions[ix] = x;
      this.positions[ix + 1] = y;
      this.positions[ix + 2] = z;

      const color = Math.random() > 0.5 ? primary : blue;
      this.colors[ix] = color.r;
      this.colors[ix + 1] = color.g;
      this.colors[ix + 2] = color.b;
    }
  }

  // Teia tecnológica: nós num grid (com jitter, não posição totalmente aleatória) cobrindo a tela
  // de ponta a ponta, conectados aos vizinhos — garante malha contínua sem buracos, ao contrário de
  // linhas soltas espalhadas ao acaso. Cada nó tem sua própria profundidade (z), calculada a partir
  // da área visível NAQUELA profundidade, então a cobertura de tela continua completa mesmo com a
  // variação 3D. Pulsos de energia (pontos brilhantes) viajam pelas cordas entre os nós.
  // Constelações: grupos pequenos e isolados de nós conectados entre si (não uma malha única
  // cobrindo a tela toda), com bastante espaço preto entre eles — igual à referência do usuário.
  // Cada nó guarda uma posição-base + fase/frequência própria pra "respirar" sozinho no _tick,
  // sem precisar de nenhuma interação.
  _buildNetwork() {
    const primary = new THREE.Color(BLUE_COLOR);
    const secondary = new THREE.Color(BLUE_DARK_COLOR);

    const nodes = [];
    const edges = [];

    for (let cluster = 0; cluster < CLUSTER_COUNT; cluster += 1) {
      const z = THREE.MathUtils.randFloat(-6, 0);
      const { width, height } = this._visibleSizeAtZ(z);
      const centerX = THREE.MathUtils.randFloatSpread(width * 0.92);
      const centerY = THREE.MathUtils.randFloatSpread(height * 0.88);
      const spread = THREE.MathUtils.randFloat(1.1, 2.8);
      const nodeCount = THREE.MathUtils.randInt(CLUSTER_NODES_MIN, CLUSTER_NODES_MAX);
      const startIndex = nodes.length;

      for (let n = 0; n < nodeCount; n += 1) {
        const baseX = centerX + THREE.MathUtils.randFloatSpread(spread);
        const baseY = centerY + THREE.MathUtils.randFloatSpread(spread);
        const baseZ = z + THREE.MathUtils.randFloatSpread(1.2);
        nodes.push({
          baseX,
          baseY,
          baseZ,
          x: baseX,
          y: baseY,
          z: baseZ,
          phase: Math.random() * Math.PI * 2,
          freq: THREE.MathUtils.randFloat(0.2, 0.5),
          amp: THREE.MathUtils.randFloat(0.3, 0.65),
        });
      }

      // Conecta os nós do próprio cluster entre si (nunca com outro cluster) — dá o efeito de
      // pequenas "junções" triangulares isoladas, como na referência.
      for (let a = 0; a < nodeCount; a += 1) {
        for (let b = a + 1; b < nodeCount; b += 1) {
          if (Math.random() > 0.35) {
            edges.push([startIndex + a, startIndex + b]);
          }
        }
      }
    }

    const linePositions = new Float32Array(edges.length * 6);
    const lineColors = new Float32Array(edges.length * 6);
    edges.forEach(([a, b], i) => {
      const na = nodes[a];
      const nb = nodes[b];
      const ix = i * 6;
      linePositions[ix] = na.x;
      linePositions[ix + 1] = na.y;
      linePositions[ix + 2] = na.z;
      linePositions[ix + 3] = nb.x;
      linePositions[ix + 4] = nb.y;
      linePositions[ix + 5] = nb.z;
      const color = Math.random() > 0.5 ? primary : secondary;
      for (let k = 0; k < 2; k += 1) {
        lineColors[ix + k * 3] = color.r;
        lineColors[ix + k * 3 + 1] = color.g;
        lineColors[ix + k * 3 + 2] = color.b;
      }
    });

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute("color", new THREE.BufferAttribute(lineColors, 3));
    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);

    // Nós da teia brilhando fraco, marcando os pontos de conexão.
    const nodePositions = new Float32Array(nodes.length * 3);
    const nodeColors = new Float32Array(nodes.length * 3);
    nodes.forEach((n, i) => {
      const ix = i * 3;
      nodePositions[ix] = n.x;
      nodePositions[ix + 1] = n.y;
      nodePositions[ix + 2] = n.z;
      const color = Math.random() > 0.5 ? primary : secondary;
      nodeColors[ix] = color.r;
      nodeColors[ix + 1] = color.g;
      nodeColors[ix + 2] = color.b;
    });
    const nodeGeometry = new THREE.BufferGeometry();
    nodeGeometry.setAttribute("position", new THREE.BufferAttribute(nodePositions, 3));
    nodeGeometry.setAttribute("color", new THREE.BufferAttribute(nodeColors, 3));
    const nodeGlowPoints = new THREE.Points(
      nodeGeometry,
      new THREE.PointsMaterial({
        size: 0.09,
        vertexColors: true,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );

    // Pulsos de energia: cada um percorre uma corda do início ao fim e pula pra outra ao chegar.
    const white = new THREE.Color(0xffffff);
    const pulseData = Array.from({ length: ENERGY_PULSE_COUNT }, () => ({
      edge: edges[Math.floor(Math.random() * edges.length)],
      t: Math.random(),
      speed: THREE.MathUtils.randFloat(0.15, 0.35),
    }));
    const pulsePositions = new Float32Array(ENERGY_PULSE_COUNT * 3);
    const pulseColors = new Float32Array(ENERGY_PULSE_COUNT * 3);
    for (let i = 0; i < ENERGY_PULSE_COUNT; i += 1) {
      const color = (Math.random() > 0.5 ? primary : secondary).clone().lerp(white, 0.5);
      pulseColors[i * 3] = color.r;
      pulseColors[i * 3 + 1] = color.g;
      pulseColors[i * 3 + 2] = color.b;
    }
    const pulseGeometry = new THREE.BufferGeometry();
    pulseGeometry.setAttribute("position", new THREE.BufferAttribute(pulsePositions, 3));
    pulseGeometry.setAttribute("color", new THREE.BufferAttribute(pulseColors, 3));
    const energyPoints = new THREE.Points(
      pulseGeometry,
      new THREE.PointsMaterial({
        size: 0.16,
        vertexColors: true,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );

    return { nodes, edges, lines, nodeGlowPoints, energyPoints, pulseData };
  }

  // Chamado uma única vez, ao montar o Loader — os raios ficam ativos do início ao fim da intro.
  revealRays(duration = 1.0) {
    this._track(gsap.to(this, { rayBaseOpacity: this.baseRayOpacity, duration, ease: "power1.out" }));
  }

  pulseRays(strength = 0.35, duration = 0.35) {
    const proxy = { boost: strength };
    this._track(gsap.to(proxy, {
      boost: 0,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        this._rayPulseBoost = proxy.boost;
      },
    }));
  }

  // Converge o grid de partículas (invisível até aqui) numa fumaça azul que entra pela esquerda e
  // vai formando o texto informado, sampleando os pixels de um canvas 2D offscreen.
  formText(text, { duration = 1.8, fontPx = 130 } = {}) {
    this._idleRotationEnabled = false;
    this.points.rotation.set(0, 0, 0);

    const targets = this._sampleTextTargets(text, fontPx);
    const blue = new THREE.Color(BLUE_COLOR);
    const { width } = this._visibleSizeAtZ(0);
    const entry = new Float32Array(this.particleCount * 3);

    for (let i = 0; i < this.particleCount; i += 1) {
      const ix = i * 3;
      const target = targets[i];
      entry[ix] = -width * 0.9 + THREE.MathUtils.randFloatSpread(4);
      entry[ix + 1] = target.y + THREE.MathUtils.randFloatSpread(2);
      entry[ix + 2] = THREE.MathUtils.randFloatSpread(3);

      this.positions[ix] = entry[ix];
      this.positions[ix + 1] = entry[ix + 1];
      this.positions[ix + 2] = entry[ix + 2];

      this.colors[ix] = blue.r;
      this.colors[ix + 1] = blue.g;
      this.colors[ix + 2] = blue.b;
    }
    this.geometry.attributes.color.needsUpdate = true;
    this._textTargets = targets;

    this.material.size = 0.32;
    this._track(gsap.to(this.material, { opacity: 0.85, duration: duration * 0.5, ease: "power1.out" }));

    const proxy = { t: 0 };
    this._track(gsap.to(proxy, {
      t: 1,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        for (let i = 0; i < this.particleCount; i += 1) {
          const ix = i * 3;
          const target = this._textTargets[i];
          const localT = Math.max(0, Math.min(1, (proxy.t - target.delay) / (1 - target.delay)));
          this.positions[ix] = lerp(entry[ix], target.x, localT);
          this.positions[ix + 1] = lerp(entry[ix + 1], target.y, localT);
          this.positions[ix + 2] = lerp(entry[ix + 2], target.z, localT);
        }
        this.geometry.attributes.position.needsUpdate = true;
      },
    }));
  }

  _sampleTextTargets(text, fontPx) {
    const off = document.createElement("canvas");
    off.width = 900;
    off.height = 260;
    const ctx = off.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 ${fontPx}px Sora, sans-serif`;
    ctx.fillText(text, off.width / 2, off.height / 2);
    const data = ctx.getImageData(0, 0, off.width, off.height).data;

    const samples = [];
    const step = 4;
    for (let y = 0; y < off.height; y += step) {
      for (let x = 0; x < off.width; x += step) {
        const alpha = data[(y * off.width + x) * 4 + 3];
        if (alpha > 128) samples.push({ x, y });
      }
    }

    const { width } = this._visibleSizeAtZ(0);
    const scale = (width * 0.4) / off.width;

    const targets = [];
    for (let i = 0; i < this.particleCount; i += 1) {
      // Espalha os índices por toda a lista de amostras (que está em ordem de varredura, de cima
      // pra baixo) em vez de pegar só os primeiros N — senão, quando há mais pixels de tinta do que
      // partículas, as linhas de baixo das letras nunca chegam a ser usadas e a palavra sai cortada.
      const sampleIndex = samples.length
        ? Math.min(samples.length - 1, Math.floor((i / this.particleCount) * samples.length))
        : 0;
      const s = samples.length ? samples[sampleIndex] : { x: off.width / 2, y: off.height / 2 };
      const wx = (s.x - off.width / 2) * scale + THREE.MathUtils.randFloatSpread(0.05);
      const wy = -(s.y - off.height / 2) * scale + THREE.MathUtils.randFloatSpread(0.05);
      const delay = Math.max(0, Math.min(0.6, ((wx + width * 0.2) / (width * 0.4)) * 0.6));
      targets.push({ x: wx, y: wy, z: THREE.MathUtils.randFloatSpread(1), delay });
    }
    return targets;
  }

  // A mesma fumaça que formou o texto volta a se desfazer e sai pela direita.
  dissolveTextToRight(duration = 1.0) {
    const start = this.positions.slice();
    const { width } = this._visibleSizeAtZ(0);
    const proxy = { t: 0 };
    this._track(gsap.to(proxy, {
      t: 1,
      duration,
      ease: "power1.in",
      onUpdate: () => {
        for (let i = 0; i < this.particleCount; i += 1) {
          const ix = i * 3;
          this.positions[ix] = start[ix] + proxy.t * width * 0.9;
          this.positions[ix + 1] = start[ix + 1] + proxy.t * proxy.t * 1.5;
        }
        this.geometry.attributes.position.needsUpdate = true;
        this.material.opacity = 0.85 * (1 - proxy.t * 0.5);
      },
    }));
  }

  // Some com qualquer resquício da fumaça do "DevClub" antes da explosão final — só um fade limpo,
  // sem espalhar partículas pela tela (isso agora é papel do burstExplosion, não daqui).
  fadeSmoke(duration = 0.5) {
    this._track(gsap.to(this.material, { opacity: 0, duration, ease: "power1.out" }));
  }

  // Explosão final: o mesmo campo de partículas nasce todo junto perto do centro (onde está o
  // cérebro) e se espalha rápido em todas as direções, sincronizado com o cérebro explodindo e a
  // página revelando o Hero por trás.
  burstExplosion(duration = 0.9, onComplete) {
    const primary = new THREE.Color(BLUE_COLOR);
    const white = new THREE.Color(0xffffff);
    const start = new Float32Array(this.particleCount * 3);
    const dirs = new Float32Array(this.particleCount * 3);

    for (let i = 0; i < this.particleCount; i += 1) {
      const ix = i * 3;
      start[ix] = THREE.MathUtils.randFloatSpread(0.4);
      start[ix + 1] = THREE.MathUtils.randFloatSpread(0.4);
      start[ix + 2] = THREE.MathUtils.randFloatSpread(0.4);
      this.positions[ix] = start[ix];
      this.positions[ix + 1] = start[ix + 1];
      this.positions[ix + 2] = start[ix + 2];

      const dir = new THREE.Vector3(
        THREE.MathUtils.randFloatSpread(2),
        THREE.MathUtils.randFloatSpread(2),
        THREE.MathUtils.randFloatSpread(2)
      ).normalize();
      dirs[ix] = dir.x;
      dirs[ix + 1] = dir.y;
      dirs[ix + 2] = dir.z;

      const color = Math.random() > 0.4 ? primary : white;
      this.colors[ix] = color.r;
      this.colors[ix + 1] = color.g;
      this.colors[ix + 2] = color.b;
    }
    this.geometry.attributes.color.needsUpdate = true;
    this.material.size = 0.35;
    this.material.opacity = 1;

    const proxy = { t: 0 };
    this._track(gsap.to(proxy, {
      t: 1,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        const distance = proxy.t * 14;
        for (let i = 0; i < this.particleCount; i += 1) {
          const ix = i * 3;
          this.positions[ix] = start[ix] + dirs[ix] * distance;
          this.positions[ix + 1] = start[ix + 1] + dirs[ix + 1] * distance;
          this.positions[ix + 2] = start[ix + 2] + dirs[ix + 2] * distance;
        }
        this.geometry.attributes.position.needsUpdate = true;
        this.material.opacity = 1 - proxy.t;
      },
      onComplete,
    }));
  }

  _tick() {
    this._raf = requestAnimationFrame(this._tick);

    const time = performance.now() * 0.001;

    if (this._idleRotationEnabled) {
      this.points.rotation.y += 0.0004;
      this.networkLines.rotation.y += 0.0007;
      this.nodeGlowPoints.rotation.y += 0.0007;
      this.energyPoints.rotation.y += 0.0007;
    }

    // Respiração ambiente: cada nó oscila sozinho (fase/frequência próprias), sem precisar de
    // nenhuma interação — é o que faz a teia parecer viva mesmo parada na tela.
    const linePos = this.networkLines.geometry.attributes.position.array;
    const nodePos = this.nodeGlowPoints.geometry.attributes.position.array;
    this.nodes.forEach((node, i) => {
      node.x = node.baseX + Math.sin(time * node.freq + node.phase) * node.amp;
      node.y = node.baseY + Math.cos(time * node.freq * 0.85 + node.phase) * node.amp;
      const ix = i * 3;
      nodePos[ix] = node.x;
      nodePos[ix + 1] = node.y;
      nodePos[ix + 2] = node.z;
    });
    this.nodeGlowPoints.geometry.attributes.position.needsUpdate = true;

    this.edges.forEach(([a, b], i) => {
      const na = this.nodes[a];
      const nb = this.nodes[b];
      const ix = i * 6;
      linePos[ix] = na.x;
      linePos[ix + 1] = na.y;
      linePos[ix + 2] = na.z;
      linePos[ix + 3] = nb.x;
      linePos[ix + 4] = nb.y;
      linePos[ix + 5] = nb.z;
    });
    this.networkLines.geometry.attributes.position.needsUpdate = true;

    // Avança os pulsos de energia ao longo das cordas da teia; ao chegar no fim de uma corda, pula
    // pra outra corda aleatória.
    const pulsePos = this.energyPoints.geometry.attributes.position.array;
    this.pulseData.forEach((pulse, i) => {
      pulse.t += pulse.speed * 0.016;
      if (pulse.t >= 1) {
        pulse.t = 0;
        pulse.edge = this.edges[Math.floor(Math.random() * this.edges.length)];
      }
      const na = this.nodes[pulse.edge[0]];
      const nb = this.nodes[pulse.edge[1]];
      const ix = i * 3;
      pulsePos[ix] = lerp(na.x, nb.x, pulse.t);
      pulsePos[ix + 1] = lerp(na.y, nb.y, pulse.t);
      pulsePos[ix + 2] = lerp(na.z, nb.z, pulse.t);
    });
    this.energyPoints.geometry.attributes.position.needsUpdate = true;

    const boost = this._rayPulseBoost || 0;
    const level = this.rayBaseOpacity + boost;
    this.networkLines.material.opacity = level * (0.7 + 0.3 * Math.sin(time * 0.4));
    this.nodeGlowPoints.material.opacity = level * 0.7;
    this.energyPoints.material.opacity = Math.min(1, level * 1.3);

    this.renderer.render(this.scene, this.camera);
  }

  _resize() {
    this._resizeCanvas();
  }

  // Mata todas as tweens ativas do campo de partículas (formText/dissolveTextToRight/burstExplosion
  // em andamento) sem desmontar a cena. Cada estágio que dispara essas animações precisa chamar isso
  // no próprio cleanup — o StrictMode do React roda mount->cleanup->mount uma vez em dev, e como
  // essas tweens vivem fora de qualquer `gsap.context()` (não manipulam refs de DOM), só matar a
  // timeline vazia do estágio não é suficiente pra desfazer o que elas já dispararam.
  cancelActive() {
    this._tweens.forEach((tween) => tween.kill());
    this._tweens.clear();
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    window.removeEventListener("resize", this._resize);
    this.cancelActive();
    this.renderer.dispose();
    this.geometry.dispose();
    this.material.dispose();
    this.networkLines.geometry.dispose();
    this.networkLines.material.dispose();
    this.nodeGlowPoints.geometry.dispose();
    this.nodeGlowPoints.material.dispose();
    this.energyPoints.geometry.dispose();
    this.energyPoints.material.dispose();
  }
}
