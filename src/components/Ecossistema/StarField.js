import * as THREE from "three";
import { gsap } from "../../lib/gsap";

const PRIMARY_COLOR = 0xd7ff3f;
const BLUE_COLOR = 0x60a5fa;
const STAR_COUNT = 420;
const SHOOTING_STAR_POOL = 8;
const TRAIL_LENGTH = 10;

/**
 * Cena Three.js própria desta seção (não compartilha nada com o DustField do Loader, de propósito
 * — se algo quebrar aqui, fica isolado). Céu de estrelas piscando + estrelas cadentes que "caem" em
 * direção a um ponto de tela (a Terra), usadas pra ir revelando a imagem conforme chegam.
 */
export class StarField {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    this.camera.position.z = 20;

    this._tweens = new Set();

    this._resizeCanvas();
    this._buildStars();
    this._buildShootingStars();

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

  _buildStars() {
    const { width, height } = this._visibleSizeAtZ(0);
    this.starCount = STAR_COUNT;
    this.starPositions = new Float32Array(STAR_COUNT * 3);
    this.starColors = new Float32Array(STAR_COUNT * 3);
    this.starBaseColors = new Float32Array(STAR_COUNT * 3);
    this.starPhases = new Float32Array(STAR_COUNT);
    this.starSpeeds = new Float32Array(STAR_COUNT);

    const white = new THREE.Color(0xffffff);
    const primary = new THREE.Color(PRIMARY_COLOR);
    const blue = new THREE.Color(BLUE_COLOR);

    for (let i = 0; i < STAR_COUNT; i += 1) {
      const ix = i * 3;
      this.starPositions[ix] = THREE.MathUtils.randFloatSpread(width * 1.1);
      this.starPositions[ix + 1] = THREE.MathUtils.randFloatSpread(height * 1.1);
      this.starPositions[ix + 2] = THREE.MathUtils.randFloatSpread(6) - 1;

      const roll = Math.random();
      const color = roll > 0.85 ? primary : roll > 0.7 ? blue : white;
      this.starBaseColors[ix] = color.r;
      this.starBaseColors[ix + 1] = color.g;
      this.starBaseColors[ix + 2] = color.b;
      this.starColors[ix] = color.r;
      this.starColors[ix + 1] = color.g;
      this.starColors[ix + 2] = color.b;

      this.starPhases[i] = Math.random() * Math.PI * 2;
      this.starSpeeds[i] = THREE.MathUtils.randFloat(0.8, 2.2);
    }

    this.starGeometry = new THREE.BufferGeometry();
    this.starGeometry.setAttribute("position", new THREE.BufferAttribute(this.starPositions, 3));
    this.starGeometry.setAttribute("color", new THREE.BufferAttribute(this.starColors, 3));
    this.starMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.starPoints = new THREE.Points(this.starGeometry, this.starMaterial);
    this.scene.add(this.starPoints);
    this.baseStarOpacity = 0.85;
  }

  // Chamado uma vez, quando a seção entra em cena — o céu vai surgindo aos poucos.
  revealStars(duration = 2.5) {
    this._track(gsap.to(this.starMaterial, { opacity: this.baseStarOpacity, duration, ease: "power1.out" }));
  }

  _buildShootingStars() {
    this.shootingStars = [];
    for (let i = 0; i < SHOOTING_STAR_POOL; i += 1) {
      const positions = new Float32Array(TRAIL_LENGTH * 3);
      const colors = new Float32Array(TRAIL_LENGTH * 3);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const material = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      });
      const line = new THREE.Line(geometry, material);
      line.visible = false;
      this.scene.add(line);
      this.shootingStars.push({ line, geometry, material, active: false });
    }
  }

  // Dispara uma estrela cadente de um ponto aleatório (região superior direita) até targetNdc
  // (coordenadas de tela normalizadas -1..1), chamando onArrive quando ela chega lá.
  fireShootingStar({ targetNdc, duration = 0.55, onArrive } = {}) {
    const star = this.shootingStars.find((s) => !s.active);
    if (!star) {
      onArrive?.();
      return;
    }
    star.active = true;
    star.line.visible = true;

    const { width, height } = this._visibleSizeAtZ(0);
    const start = new THREE.Vector3(
      THREE.MathUtils.randFloat(width * 0.05, width * 0.48),
      THREE.MathUtils.randFloat(height * 0.22, height * 0.46),
      THREE.MathUtils.randFloatSpread(2)
    );

    const vector = new THREE.Vector3(targetNdc[0], targetNdc[1], 0.5).unproject(this.camera);
    const dir = vector.sub(this.camera.position).normalize();
    const dist = -this.camera.position.z / dir.z;
    const target = this.camera.position.clone().add(dir.multiplyScalar(dist));

    const white = new THREE.Color(0xffffff);
    const proxy = { t: 0 };

    this._track(gsap.to(star.material, { opacity: 0.95, duration: 0.12 }));
    this._track(gsap.to(proxy, {
      t: 1,
      duration,
      ease: "power1.in",
      onUpdate: () => {
        const pos = star.geometry.attributes.position.array;
        const col = star.geometry.attributes.color.array;
        for (let i = 0; i < TRAIL_LENGTH; i += 1) {
          const trailT = Math.max(0, proxy.t - i * 0.028);
          pos[i * 3] = THREE.MathUtils.lerp(start.x, target.x, trailT);
          pos[i * 3 + 1] = THREE.MathUtils.lerp(start.y, target.y, trailT);
          pos[i * 3 + 2] = THREE.MathUtils.lerp(start.z, target.z, trailT);
          const fade = 1 - i / TRAIL_LENGTH;
          col[i * 3] = white.r * fade;
          col[i * 3 + 1] = white.g * fade;
          col[i * 3 + 2] = white.b * fade;
        }
        star.geometry.attributes.position.needsUpdate = true;
        star.geometry.attributes.color.needsUpdate = true;
      },
      onComplete: () => {
        onArrive?.();
        this._track(gsap.to(star.material, {
          opacity: 0,
          duration: 0.25,
          onComplete: () => {
            star.active = false;
            star.line.visible = false;
          },
        }));
      },
    }));
  }

  _tick() {
    this._raf = requestAnimationFrame(this._tick);

    const t = performance.now() * 0.001;
    const col = this.starGeometry.attributes.color.array;
    const base = this.starBaseColors;
    for (let i = 0; i < this.starCount; i += 1) {
      const ix = i * 3;
      const twinkle = 0.55 + 0.45 * Math.sin(t * this.starSpeeds[i] + this.starPhases[i]);
      col[ix] = base[ix] * twinkle;
      col[ix + 1] = base[ix + 1] * twinkle;
      col[ix + 2] = base[ix + 2] * twinkle;
    }
    this.starGeometry.attributes.color.needsUpdate = true;
    this.starPoints.rotation.y += 0.00008;

    this.renderer.render(this.scene, this.camera);
  }

  _resize() {
    this._resizeCanvas();
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    window.removeEventListener("resize", this._resize);
    this._tweens.forEach((tween) => tween.kill());
    this._tweens.clear();
    this.renderer.dispose();
    this.starGeometry.dispose();
    this.starMaterial.dispose();
    this.shootingStars.forEach((star) => {
      star.geometry.dispose();
      star.material.dispose();
    });
  }
}
