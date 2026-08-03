/**
 * Hand-written types for the emscripten build of bloaty served from
 * `public/static/emscripten/bloaty.js`.
 *
 * That file is generated glue with no upstream types, and it is loaded by URL
 * at runtime rather than imported through the bundler (see `BLOATY_MODULE_URL`
 * in `app/binary/parser.tsx` for why), so nothing can infer its shape. This
 * declares only the surface `/binary` actually touches.
 *
 * Rebuilding bloaty does not regenerate this. If a call site stops
 * typechecking, widen this file rather than casting at the call site — and
 * check `CMakeLists.txt`'s `EXPORTED_RUNTIME_METHODS`, because a member missing
 * at runtime is far more likely than a member missing here.
 */

/** The subset of emscripten's `FS` we use. */
export interface BloatyFS {
  writeFile(path: string, data: Uint8Array | string): void
  readFile(path: string, opts: { encoding: 'utf8' }): string
  readFile(path: string, opts?: { encoding?: 'binary' }): Uint8Array
}

/**
 * emscripten's pthread pool manager, exposed because the pool does not clean
 * itself up: a module instance holds `navigator.hardwareConcurrency` live
 * workers until something terminates them.
 */
export interface BloatyPThread {
  /** Terminate every pooled and running worker. Main thread only. */
  terminateAllThreads(): void
}

export interface BloatyModule {
  FS: BloatyFS
  /**
   * Run bloaty's `main` and return its exit status.
   *
   * emscripten prepends `argv[0]`, allocates the argv block on the stack and
   * unwinds it afterwards, so unlike hand-rolled marshalling there is nothing
   * here to leak. Built with `INVOKE_RUN=0`, so this is the only way main runs.
   */
  callMain(args: string[]): number
  PThread: BloatyPThread
}

/**
 * What the factory accepts.
 *
 * Under `MODULARIZE` the factory does not copy this object — it *is* the
 * module, and emscripten writes its own exports onto it as it boots. Hence the
 * `Partial<BloatyModule>`: those members are absent when you pass the object in
 * and present afterwards. `PThread` lands early enough to be usable even when
 * startup is abandoned, which is the only way to clean up after a module that
 * never finished initialising.
 */
export interface BloatyModuleArgs extends Partial<BloatyModule> {
  /** stdout sink; called once per line, without the trailing newline. */
  print?(text: string): void
  /** stderr sink; same contract as `print`. */
  printErr?(text: string): void
}

/** The module's default export: `-sMODULARIZE=1 -sEXPORT_NAME=createBloatyModule`. */
export type BloatyModuleFactory = (moduleArg?: BloatyModuleArgs) => Promise<BloatyModule>
