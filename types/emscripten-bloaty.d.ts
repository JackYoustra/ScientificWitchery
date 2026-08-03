/**
 * Minimal hand-written types for `public/static/emscripten/bloaty.js`.
 *
 * That file is a generated emscripten blob (~124 KB of minified glue) with no
 * upstream types. Rather than sprinkle `any` at every call site, this declares
 * the small surface we actually touch: the module factory, `FS.writeFile`,
 * `cwrap`, and the two allocator helpers used to marshal argv.
 *
 * Regenerating bloaty.js does not regenerate this — if a call site starts
 * failing to typecheck, widen this file rather than casting at the call site.
 */
declare module '@/public/static/emscripten/bloaty' {
  /** The subset of emscripten's `FS` we use. */
  export interface BloatyFS {
    writeFile(path: string, data: Uint8Array | string): void
    readFile(path: string, opts: { encoding: 'utf8' }): string
    readFile(path: string, opts?: { encoding?: 'binary' }): Uint8Array
  }

  /** emscripten's `cwrap` type tags. */
  export type CwrapType = 'number' | 'string' | 'array' | 'boolean' | null

  /** Values `cwrap`ped functions accept, per the tags above. */
  export type CwrapArg = number | string | boolean | Uint8Array | null

  export interface BloatyModule {
    FS: BloatyFS
    /** Wrap an exported C function. Every export we call returns an int. */
    cwrap(
      ident: string,
      returnType: CwrapType,
      argTypes: CwrapType[]
    ): (...args: CwrapArg[]) => number
    /** Copy a JS string into the heap as NUL-terminated UTF-8; returns a pointer. */
    stringToNewUTF8(str: string): number
    /** `free(3)` on the emscripten heap. */
    _free(ptr: number): void
  }

  /** The `Module` overrides emscripten reads at instantiation time. */
  export interface BloatyModuleArgs {
    /** Map an asset name (bloaty.wasm, bloaty.worker.mjs) to a URL. */
    locateFile?(path: string, scriptDirectory: string): string
    /** stdout sink; called once per line, without the trailing newline. */
    print?(text: string): void
    /** stderr sink; same contract as `print`. */
    printErr?(text: string): void
    noInitialRun?: boolean
    arguments?: string[]
  }

  /**
   * Instantiate the module. Resolves once the wasm is compiled and the runtime
   * is initialised.
   */
  export default function createBloatyModule(
    moduleArg?: BloatyModuleArgs
  ): Promise<BloatyModule>
}
