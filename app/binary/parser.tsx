import type {
  BloatyModule,
  BloatyModuleArgs,
  BloatyModuleFactory,
} from '@/types/emscripten-bloaty'
import Papa from 'papaparse'
import type { WasmBinaryResult } from 'rust-wasm'
import _ from 'lodash'

/**
 * Echarts node values are `number | number[]`, where the first entry is the size
 * and the rest are rendering hints. An empty array carries no size at all, so
 * this is honestly partial — callers decide what "no value" means for them.
 */
export function firstValue<T>(arr: T[] | T): T | undefined {
  if (Array.isArray(arr)) {
    return arr[0]
  } else {
    return arr
  }
}

export function firstValueOr<T>(arr: T[] | T | null | undefined, def: T): T {
  if (Array.isArray(arr)) {
    return arr[0] ?? def
  } else if (arr === undefined || arr === null) {
    return def
  } else {
    return arr
  }
}

/**
 * `firstValue` for sizes we are about to do arithmetic on: a missing or NaN
 * value becomes 0 so it contributes nothing to a running total instead of
 * poisoning it. Note the NaN check now covers the array case too — it only
 * guarded the bare-number branch before, so `[NaN]` used to sum to NaN.
 */
export function firstValueNaNHandled(arr: number[] | number): number {
  const value = firstValue(arr)
  return value === undefined || _.isNaN(value) ? 0 : value
}

interface ParseWasmBinary {
  dominators: {
    items: DominatorItem[]
    summary?: Summary[]
  }
  garbage?: GarbageItem[]
}

function parseResultFromRust(result: WasmBinaryResult): ParseWasmBinary {
  const dominators = JSON.parse(result.dominators) as ParseWasmBinary['dominators']
  const garbage = JSON.parse(result.garbage) as GarbageItem[]

  // strip out from garbage the last entry with a sigma at the start of the name
  const sigmaIndex = garbage.findLastIndex((item) => item.name.startsWith('Σ'))
  if (sigmaIndex !== -1) {
    garbage.splice(sigmaIndex, 1)
  }

  // if the last entry talks about false positives, remove it.
  // The emptiness check has to come first: twiggy can report no garbage at all,
  // and the sigma strip above can empty the array on its own.
  const last = garbage[garbage.length - 1]
  if (last && last.name.includes('potential false-positive')) {
    garbage.pop()
  }

  // free the memory
  result.free()
  return garbage.length > 0 ? { dominators, garbage } : { dominators }
}

interface GarbageItem {
  name: string
  bytes: number
  size_percent: number
}

interface DominatorItem {
  name: string
  shallow_size: number
  shallow_size_percent: number
  retained_size: number
  retained_size_percent: number
  children?: DominatorItem[]
}

interface Summary {
  name: string
  retained_size: number
  retained_size_percent: number
}

export type ChartDataEntry = EchartDataShape

type EchartDataShape = {
  name?: string
  // Multiple numbers are allowed for the same node.
  // If there are multiple numbers, the first one is used as the node value,
  // and the rest are used as different rendering hints (such as secondary heatmaps, etc)
  // Note that this has to be the total for the parent node, and not the individual value
  // for the current node. For example, if a parent node has two children, one with value 10,
  // and the other with value 20, then the parent node should have value 30.
  value: number | number[]
  children?: EchartDataShape[]
  path?: string
}

type OverallSize = number

export type SectionData = DominatorItem | OverallSize
export type FileChartDataShape = EchartDataShape & {
  sectionData?: SectionData
}

// convert to chart data
function convertToChartData(item: DominatorItem, path: string): FileChartDataShape {
  // TODO: Escape the slashes in item name
  const children = item.children?.map((child) => convertToChartData(child, `${path}/${item.name}`))
  const childrenSize =
    children?.reduce((acc, child) => acc + firstValueNaNHandled(child.value), 0) ?? 0
  const entry: FileChartDataShape = {
    name: item.name,
    value: item.shallow_size + childrenSize,
    children,
    path: `${path}/${item.name}`,
    sectionData: item,
  }
  return entry
}

function topGarbage2Chart(garbage: GarbageItem[], overallSize: OverallSize): FileChartDataShape {
  const entry: FileChartDataShape = {
    name: 'Unreachable Code / Symbols',
    value: garbage.reduce((acc, item) => acc + item.bytes, 0),
    children: garbage.map((item) => garbage2Chart(item, overallSize)),
    sectionData: overallSize,
  }
  return entry
}

function garbage2Chart(garbage: GarbageItem, overallSize: OverallSize): FileChartDataShape {
  const entry: FileChartDataShape = {
    name: garbage.name,
    value: garbage.bytes,
    sectionData: overallSize,
  }
  return entry
}

/**
 * A single cell of bloaty's `--csv` output as papaparse hands it back with
 * `dynamicTyping: true`: numeric columns come through as numbers, the rest as
 * strings, and a missing trailing field as null.
 */
type CsvCell = string | number | boolean | null | undefined

/** One `--csv` row, keyed by the header names in `parsed.meta.fields`. */
type CsvRow = Record<string, CsvCell>

/** Label cells are free-form strings; blank ones become unnamed nodes. */
function cellAsName(cell: CsvCell): string | undefined {
  if (cell === null || cell === undefined || cell === '') {
    return undefined
  }
  return String(cell)
}

/** Size cells should already be numbers; coerce defensively rather than NaN out. */
function cellAsSize(cell: CsvCell): number {
  const size = typeof cell === 'number' ? cell : Number(cell)
  return Number.isFinite(size) ? size : 0
}

function makeTreeFromCSV(csv: CsvRow[], fields: string[], path: string): ChartDataEntry[] {
  // algorithm:
  // fields are grouped by left to right, except for the last two arguments (vmsize and filesize)
  // group by all rows and create a tree, with one node per group
  // create a level of the tree for every level of grouping
  // the leaf holds the filesize

  // first, loop through the fields (except for the last two)
  // and create a tree
  // if there's only one field left, create the leaves

  // Sometimes, there's no label for the current field
  // In that case, skip it (return the children) or, if there are no children, return empty
  const [field, ...rest] = fields
  if (field === undefined) {
    // No grouping levels left to spend, so there is nothing to build.
    return []
  }
  if (rest.length === 0) {
    // implicitly grouped by the last field
    return csv.map((row) => {
      const name = cellAsName(row[field])
      const entry: ChartDataEntry = {
        name,
        value: cellAsSize(row['filesize']),
        path: path + '/' + name,
      }
      return entry
    })
  } else {
    // group by the first field
    const grouped = _.groupBy(csv, field)
    // recurse
    return Object.entries(grouped).flatMap(([key, value]) => {
      const children = makeTreeFromCSV(value, rest, path + '/' + key)
      if (key === null || key === undefined) {
        return children
      }
      const entry: ChartDataEntry = {
        name: key,
        value: children.reduce((acc, item) => acc + firstValueNaNHandled(item.value), 0),
        children: children.filter((child) => child.name !== undefined && child.name !== null),
        path: path + '/' + key,
      }
      return [entry]
    })
  }
}
/**
 * Where the emscripten build is served from, as a URL for the browser rather
 * than a specifier for the bundler.
 *
 * The distinction is the whole design. bloaty.js resolves its own `.wasm` and
 * spawns its pthread workers relative to `import.meta.url`, so it has to be
 * loaded from the directory that actually holds those files. Bundling it into a
 * `.next` chunk — which is what a static import of `@/public/...` does — moves
 * `import.meta.url` into `/_next/static/chunks/` and every sibling lookup
 * misses. Hence the runtime import below, with the bundler told to keep its
 * hands off.
 */
const BLOATY_MODULE_URL = '/static/emscripten/bloaty.js'

/** Path the uploaded bytes get in emscripten's in-memory filesystem. */
const BLOATY_INPUT_PATH = 'input.bin'

/**
 * The loaded ES module, shared across parses. Only the *module* is cached — a
 * fresh instance per parse is deliberate, since bloaty's `main` is a one-shot
 * program with global state.
 */
let bloatyFactory: Promise<BloatyModuleFactory> | undefined

function loadBloatyFactory(): Promise<BloatyModuleFactory> {
  if (!bloatyFactory) {
    const pending = (
      import(/* webpackIgnore: true */ /* turbopackIgnore: true */ BLOATY_MODULE_URL) as Promise<{
        default: BloatyModuleFactory
      }>
    ).then((module) => module.default)
    // Don't let one failed fetch poison every later attempt.
    pending.catch(() => {
      if (bloatyFactory === pending) {
        bloatyFactory = undefined
      }
    })
    bloatyFactory = pending
  }
  return bloatyFactory
}

/**
 * Reject with `message` if `promise` has not settled within `ms`.
 *
 * Losing the race does not cancel anything — the caller is responsible for any
 * teardown — but it does turn a hang into an error, which is the whole point.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const expiry = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms)
  })
  return Promise.race([promise, expiry]).finally(() => clearTimeout(timer))
}

/**
 * How long to wait for emscripten to finish booting before calling it dead.
 *
 * Startup is a wasm compile plus a `navigator.hardwareConcurrency`-sized
 * pthread pool handshake; it takes well under a second when it works at all,
 * and takes forever when it doesn't. The failure mode this guards is a worker
 * that never answers, which emscripten reports only as a `still waiting on run
 * dependencies: loading-workers` line every ten seconds, forever.
 */
const BLOATY_STARTUP_TIMEOUT_MS = 30_000

/** Keep the last few stderr lines for error messages; bloaty can be chatty. */
function tail(lines: string[], count = 5): string {
  return lines.slice(-count).join(' / ')
}

async function parseWithBloaty(
  file: File,
  buffer: ArrayBuffer,
  analysisTypes: string,
  strict: boolean
): Promise<ChartDataEntry> {
  // string builder for stdout
  let stdout = ''
  // ...and a ring of stderr lines. Capturing these rather than letting them
  // fall through to console.error is what lets a failure say *why* it failed.
  const stderr: string[] = []
  const moduleArgs: BloatyModuleArgs = {
    print: (text) => {
      stdout += text + '\n'
    },
    printErr: (text) => {
      stderr.push(text)
    },
  }

  const createBloatyModule = await loadBloatyFactory()
  let bloaty: BloatyModule
  try {
    bloaty = await withTimeout(
      createBloatyModule(moduleArgs),
      BLOATY_STARTUP_TIMEOUT_MS,
      `Bloaty's emscripten runtime did not start within ${BLOATY_STARTUP_TIMEOUT_MS / 1000}s` +
        (globalThis.crossOriginIsolated
          ? '.'
          : ' — this document is not cross-origin isolated, so SharedArrayBuffer and the pthread pool are unavailable.') +
        (stderr.length > 0 ? ` Last output: ${tail(stderr)}` : '')
    )
  } catch (error) {
    // The factory keeps running after the race is lost, and its worker pool
    // with it. Emscripten writes PThread onto the object we passed in, so the
    // pool can still be shut down even though the module never arrived.
    moduleArgs.PThread?.terminateAllThreads()
    throw error
  }

  try {
    bloaty.FS.writeFile(BLOATY_INPUT_PATH, new Uint8Array(buffer))
    // callMain supplies argv[0] and owns the argv block, so there is no
    // pointer arithmetic here and nothing to free on the way out.
    const status = bloaty.callMain(['--csv', BLOATY_INPUT_PATH, '-d', analysisTypes, '-n', '100'])
    if (strict && status !== 0) {
      throw new Error(
        `bloaty -d ${analysisTypes} exited ${status}` +
          (stderr.length > 0 ? `: ${tail(stderr)}` : '')
      )
    }

    // papaparse output
    const parsed = Papa.parse<CsvRow>(stdout, {
      header: true,
      dynamicTyping: true,
    })
    // The last two columns are vmsize and filesize; everything before them is a
    // grouping level. papaparse only populates `meta.fields` when it saw a header
    // row, so bail loudly rather than tripping over `undefined` further down.
    const fields = parsed.meta.fields
    if (!fields || fields.length < 3) {
      throw new Error(
        `Bloaty produced no usable CSV columns for ${file.name}` +
          (stderr.length > 0 ? `: ${tail(stderr)}` : '')
      )
    }
    const children = makeTreeFromCSV(parsed.data, fields.slice(0, -2), file.name)
    // sum up all the sizes and take the difference from the file size to find the unaccounted for size
    const unaccountedSize =
      file.size - children.reduce((acc, item) => acc + firstValueNaNHandled(item.value), 0)
    if (unaccountedSize > 0) {
      children.push({
        name: 'Unaccounted for',
        value: unaccountedSize,
        path: file.name + '/Unaccounted for',
      })
    }

    const entry: ChartDataEntry = {
      name: file.name,
      value: file.size,
      children,
      path: file.name,
    }
    return entry
  } finally {
    // One module instance per parse, and each one owns a pool of
    // `navigator.hardwareConcurrency` workers that nothing else will ever
    // collect. Dropping the reference is not enough — a live Worker keeps
    // itself and its shared memory alive.
    bloaty.PThread.terminateAllThreads()
  }
}

async function parseWithTwiggy(file: File, buffer: ArrayBuffer): Promise<ChartDataEntry> {
  const { parse_wasm_binary } = await import('rust-wasm')

  const result = await parse_wasm_binary(buffer)
  // parse
  const parsed: ParseWasmBinary = parseResultFromRust(result)
  const chartData = parsed.dominators.items.map((item) => convertToChartData(item, file.name))
  if (parsed.garbage) {
    chartData.push(topGarbage2Chart(parsed.garbage, file.size))
  }
  let sizeOfTopLevel = parsed.dominators.items.reduce((acc, item) => acc + item.retained_size, 0)
  if (parsed.garbage) {
    sizeOfTopLevel += parsed.garbage.reduce((acc, item) => acc + item.bytes, 0)
  }
  const entry: ChartDataEntry = {
    name: file.name,
    value: sizeOfTopLevel,
    children: chartData,
    path: file.name,
  }
  return entry
}

export enum AnalysisEngine {
  Twiggy,
  Bloaty,
}

export interface ParseResult {
  data: ChartDataEntry
  engine: AnalysisEngine
}

const ENGINE_NAMES: Record<AnalysisEngine, string> = {
  [AnalysisEngine.Twiggy]: 'Twiggy',
  [AnalysisEngine.Bloaty]: 'Bloaty',
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

async function runEngine(
  engine: AnalysisEngine,
  file: File,
  buffer: ArrayBuffer
): Promise<ChartDataEntry> {
  switch (engine) {
    case AnalysisEngine.Twiggy:
      return parseWithTwiggy(file, buffer)
    case AnalysisEngine.Bloaty:
      try {
        // compileunits needs debug info; plenty of binaries have none.
        return await parseWithBloaty(file, buffer, 'compileunits,symbols,sections', true)
      } catch (error) {
        console.warn(
          `[binary] bloaty -d compileunits,symbols,sections failed on ${file.name}, retrying without compileunits: ${describeError(error)}`
        )
        return parseWithBloaty(file, buffer, 'symbols,sections', false)
      }
  }
}

export function parseBuffer(file: File, engine?: AnalysisEngine): Promise<ParseResult> {
  return file.arrayBuffer().then(async (buffer) => {
    // Give twiggy first crack: it has dominator support, which is rly cool to
    // look at. Bloaty is the general-purpose fallback.
    //
    // `engine !== undefined`, not `engine`: Twiggy is enum member 0, so the
    // truthiness test this used to do sent an explicit "use Twiggy" request
    // down the *both engines* path, and a twiggy failure silently produced a
    // bloaty chart with the twiggy button lit.
    const engines = engine !== undefined ? [engine] : [AnalysisEngine.Twiggy, AnalysisEngine.Bloaty]

    // Try each engine in turn. Every failure is reported — the old version
    // dropped non-final errors on the floor, which is how an engine that had
    // never once initialised in any browser went unnoticed for two years.
    const failures: string[] = []
    for (const candidate of engines) {
      try {
        return { data: await runEngine(candidate, file, buffer), engine: candidate }
      } catch (error) {
        const reason = describeError(error)
        console.warn(`[binary] ${ENGINE_NAMES[candidate]} failed on ${file.name}: ${reason}`, error)
        failures.push(`${ENGINE_NAMES[candidate]}: ${reason}`)
      }
    }
    throw new Error(`Could not analyse ${file.name}. ${failures.join(' — ')}`)
  })
}
