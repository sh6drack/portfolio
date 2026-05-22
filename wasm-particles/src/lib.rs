use wasm_bindgen::prelude::*;

const MAX_PARTICLES: usize = 3000;

#[wasm_bindgen]
pub struct ParticleSystem {
    count: usize,
    // Position
    x: Vec<f32>,
    y: Vec<f32>,
    z: Vec<f32>,
    // Velocity
    vx: Vec<f32>,
    vy: Vec<f32>,
    vz: Vec<f32>,
    // Properties
    size: Vec<f32>,
    alpha: Vec<f32>,
    life: Vec<f32>,
    max_life: Vec<f32>,
    // Mouse
    mouse_x: f32,
    mouse_y: f32,
    mouse_active: bool,
    // Scroll
    scroll_y: f32,
    // Time
    time: f32,
    // Canvas dimensions (normalized -1..1)
    width: f32,
    height: f32,
}

#[wasm_bindgen]
impl ParticleSystem {
    #[wasm_bindgen(constructor)]
    pub fn new(count: usize) -> ParticleSystem {
        let count = count.min(MAX_PARTICLES);
        let mut sys = ParticleSystem {
            count,
            x: vec![0.0; count],
            y: vec![0.0; count],
            z: vec![0.0; count],
            vx: vec![0.0; count],
            vy: vec![0.0; count],
            vz: vec![0.0; count],
            size: vec![0.0; count],
            alpha: vec![0.0; count],
            life: vec![0.0; count],
            max_life: vec![0.0; count],
            mouse_x: 0.0,
            mouse_y: 0.0,
            mouse_active: false,
            scroll_y: 0.0,
            time: 0.0,
            width: 2.0,
            height: 2.0,
        };
        sys.init();
        sys
    }

    fn init(&mut self) {
        for i in 0..self.count {
            self.respawn(i, true);
        }
    }

    fn pseudo_random(&self, seed: usize) -> f32 {
        let s = (seed as f32 + self.time * 1000.0) * 12.9898;
        let val = (s.sin() * 43758.5453).fract();
        val.abs()
    }

    fn respawn(&mut self, i: usize, initial: bool) {
        let r1 = self.pseudo_random(i * 7 + 1);
        let r2 = self.pseudo_random(i * 13 + 3);
        let r3 = self.pseudo_random(i * 19 + 7);
        let r4 = self.pseudo_random(i * 31 + 11);
        let r5 = self.pseudo_random(i * 43 + 17);
        let r6 = self.pseudo_random(i * 61 + 23);

        // Spread across full viewport
        self.x[i] = (r1 - 0.5) * 4.0;
        self.y[i] = (r2 - 0.5) * 4.0;
        self.z[i] = r3 * -20.0;

        // Very slow drift
        self.vx[i] = (r4 - 0.5) * 0.002;
        self.vy[i] = (r5 - 0.5) * 0.002;
        self.vz[i] = (r6 - 0.5) * 0.001;

        self.size[i] = 0.5 + r1 * 2.5;
        self.max_life[i] = 200.0 + r2 * 400.0;
        self.life[i] = if initial { r3 * self.max_life[i] } else { 0.0 };
        self.alpha[i] = 0.0;
    }

    #[wasm_bindgen]
    pub fn set_mouse(&mut self, x: f32, y: f32, active: bool) {
        self.mouse_x = x;
        self.mouse_y = y;
        self.mouse_active = active;
    }

    #[wasm_bindgen]
    pub fn set_scroll(&mut self, y: f32) {
        self.scroll_y = y;
    }

    #[wasm_bindgen]
    pub fn set_size(&mut self, w: f32, h: f32) {
        self.width = w;
        self.height = h;
    }

    #[wasm_bindgen]
    pub fn tick(&mut self, dt: f32) {
        self.time += dt;
        let mouse_strength = if self.mouse_active { 1.0 } else { 0.0 };

        for i in 0..self.count {
            self.life[i] += dt;

            // Fade in/out
            let life_ratio = self.life[i] / self.max_life[i];
            if life_ratio >= 1.0 {
                self.respawn(i, false);
                continue;
            }
            // Smooth fade: quick in, slow out
            self.alpha[i] = if life_ratio < 0.1 {
                life_ratio / 0.1
            } else if life_ratio > 0.8 {
                1.0 - (life_ratio - 0.8) / 0.2
            } else {
                1.0
            };

            // Organic drift (Perlin-like sinusoidal)
            let phase = self.time * 0.3 + (i as f32) * 0.1;
            let drift_x = (phase + self.y[i] * 0.5).sin() * 0.0008;
            let drift_y = (phase * 0.7 + self.x[i] * 0.5).cos() * 0.0008;

            self.vx[i] += drift_x;
            self.vy[i] += drift_y;

            // Mouse repulsion/attraction field
            if mouse_strength > 0.0 {
                let dx = self.x[i] - self.mouse_x;
                let dy = self.y[i] - self.mouse_y;
                let dist_sq = dx * dx + dy * dy + 0.01;
                let dist = dist_sq.sqrt();

                if dist < 1.5 {
                    // Close particles get pushed away
                    let force = mouse_strength * 0.0015 / (dist_sq + 0.1);
                    self.vx[i] += dx * force;
                    self.vy[i] += dy * force;

                    // Brighten near mouse
                    self.alpha[i] = (self.alpha[i] + 0.3 * (1.0 - dist / 1.5)).min(1.0);
                } else if dist < 3.0 {
                    // Far particles get gently pulled toward mouse
                    let attract = mouse_strength * 0.00005;
                    self.vx[i] -= dx * attract;
                    self.vy[i] -= dy * attract;
                }
            }

            // Scroll-based vertical shift
            self.vy[i] += self.scroll_y * 0.00001;

            // Damping
            self.vx[i] *= 0.995;
            self.vy[i] *= 0.995;
            self.vz[i] *= 0.998;

            // Speed limit
            let speed_sq = self.vx[i] * self.vx[i] + self.vy[i] * self.vy[i];
            if speed_sq > 0.01 {
                let scale = 0.1 / speed_sq.sqrt();
                self.vx[i] *= scale;
                self.vy[i] *= scale;
            }

            // Integrate
            self.x[i] += self.vx[i] * dt * 60.0;
            self.y[i] += self.vy[i] * dt * 60.0;
            self.z[i] += self.vz[i] * dt * 60.0;

            // Wrap boundaries
            if self.x[i] > 2.5 { self.x[i] = -2.5; }
            if self.x[i] < -2.5 { self.x[i] = 2.5; }
            if self.y[i] > 2.5 { self.y[i] = -2.5; }
            if self.y[i] < -2.5 { self.y[i] = 2.5; }
            if self.z[i] > 0.0 { self.z[i] = -20.0; }
            if self.z[i] < -20.0 { self.z[i] = 0.0; }

            // Depth-based alpha
            let depth_fade = 1.0 - (self.z[i].abs() / 20.0);
            self.alpha[i] *= depth_fade * depth_fade;
        }
    }

    #[wasm_bindgen]
    pub fn positions_ptr(&self) -> *const f32 {
        self.x.as_ptr()
    }

    #[wasm_bindgen]
    pub fn get_count(&self) -> usize {
        self.count
    }

    /// Returns interleaved [x, y, z, size, alpha] * count
    #[wasm_bindgen]
    pub fn get_render_data(&self) -> Vec<f32> {
        let mut data = Vec::with_capacity(self.count * 5);
        for i in 0..self.count {
            data.push(self.x[i]);
            data.push(self.y[i]);
            data.push(self.z[i]);
            data.push(self.size[i]);
            data.push(self.alpha[i]);
        }
        data
    }
}
