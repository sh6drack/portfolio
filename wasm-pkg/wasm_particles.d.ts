/* tslint:disable */
/* eslint-disable */

export class ParticleSystem {
    free(): void;
    [Symbol.dispose](): void;
    get_count(): number;
    /**
     * Returns interleaved [x, y, z, size, alpha] * count
     */
    get_render_data(): Float32Array;
    constructor(count: number);
    positions_ptr(): number;
    set_mouse(x: number, y: number, active: boolean): void;
    set_scroll(y: number): void;
    set_size(w: number, h: number): void;
    tick(dt: number): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_particlesystem_free: (a: number, b: number) => void;
    readonly particlesystem_get_count: (a: number) => number;
    readonly particlesystem_get_render_data: (a: number) => [number, number];
    readonly particlesystem_new: (a: number) => number;
    readonly particlesystem_positions_ptr: (a: number) => number;
    readonly particlesystem_set_mouse: (a: number, b: number, c: number, d: number) => void;
    readonly particlesystem_set_scroll: (a: number, b: number) => void;
    readonly particlesystem_set_size: (a: number, b: number, c: number) => void;
    readonly particlesystem_tick: (a: number, b: number) => void;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
