import createBloatyModule from 'public/static/emscripten/bloaty'
import Papa from 'papaparse'
import type { WasmBinaryResult } from 'rust-wasm'
import _ from 'lodash'

export function firstValue<T>(arr: T[] | T): T {
  if (Array.isArray(arr)) {
    return arr[0]
  } else {
    return arr
  }
}

interface ParseWasmBinary {
  dominators: {
    items: DominatorItem[]
    summary?: Summary[]
  }
  garbage?: GarbageItem[]
}

function parseResultFromRust(result: WasmBinaryResult): ParseWasmBinary {
  const retval = {
    dominators: JSON.parse(result.dominators),
    garbage: JSON.parse(result.garbage),
  }
  // strip out from garbage the last entry with a sigma at the start of the name
  for (let i = retval.garbage.length - 1; i >= 0; i--) {
    if (retval.garbage[i].name.startsWith('Σ')) {
      retval.garbage.splice(i, 1)
      break
    }
  }

  // if the last entry talks about false positives, remove
  if (retval.garbage[retval.garbage.length - 1].name.includes('potential false-positive')) {
    retval.garbage.splice(retval.garbage.length - 1, 1)
  }

  if (retval.garbage.length === 0) {
    delete retval.garbage
  }

  // free the memory
  result.free()
  return retval
}

interface GarbageItem {
  name: string
  bytes: number
  size_percent: number
}

interface DominatorItem {
  name: string
  shallow_size: number
  shallow_size_percent: ShallowSizePercent
  retained_size: number
  retained_size_percent: number
  children?: DominatorItem[]
}

type ShallowSizePercent = number | number

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
  const childrenSize = children?.reduce((acc, child) => acc + firstValue(child.value), 0) ?? 0
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

function makeTreeFromCSV(csv: object[], fields: string[], path: string): ChartDataEntry[] {
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
  if (fields.length === 1) {
    // implicitly grouped by the last field
    return csv.map((row) => {
      const entry: ChartDataEntry = {
        name: row[fields[0]],
        value: row['filesize'],
        path: path + '/' + row[fields[0]],
      }
      return entry
    })
  } else {
    // group by the first field
    const grouped = _.groupBy(csv, fields[0])
    // recurse
    return Object.entries(grouped).flatMap(([key, value]) => {
      const children = makeTreeFromCSV(value, fields.slice(1), path + '/' + key)
      if (key === null || key === undefined) {
        return children
      }
      const entry: ChartDataEntry = {
        name: key,
        value: children.reduce((acc, item) => acc + firstValue(item.value), 0),
        children: children.filter((child) => child.name !== undefined && child.name !== null),
        path: path + '/' + key,
      }
      return [entry]
    })
  }
}
function convertProgramArgumentsToC(
  args: string[],
  // emscripten doesn't have types that I know of
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  module: any
): { argc: number; argv: Uint8Array } {
  const encodedArgsPointers = args.map((arg) => module.stringToNewUTF8(arg))
  // take the pointers and put them into a buffer
  const pointersBuffer = new Uint32Array(encodedArgsPointers.length)
  encodedArgsPointers.forEach((pointer, i) => {
    pointersBuffer[i] = pointer
  })
  // create a uint8array buffer holding the pointers
  const argv = new Uint8Array(pointersBuffer.buffer)
  return {
    argc: args.length,
    argv,
  }
}

// emscripten doesn't have types that I know of
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function freeCArguments(argv: Uint8Array, module: any) {
  // free the memory
  const pointersBuffer = new Uint32Array(argv.buffer)
  pointersBuffer.forEach((pointer) => {
    module._free(pointer)
  })
}

async function parseWithBloaty(
  file: File,
  buffer: ArrayBuffer,
  analysisTypes: string,
  strict: boolean
): Promise<ChartDataEntry> {
  // string builder for stdout
  let stdout = ''
  const bloatyModule = await createBloatyModule({
    locateFile: (file) => {
      if (file === 'bloaty.worker.mjs') {
        return '/static/emscripten/bloaty.worker.mjs'
      } else if (file === 'bloaty.wasm') {
        return '/static/emscripten/bloaty.wasm'
      }
      return file
    },
    print: (text) => {
      stdout += text + '\n'
    },
  })

  console.log(bloatyModule)
  bloatyModule.FS.writeFile('dummy', new Uint8Array(buffer))

  const bloatyMain = bloatyModule.cwrap('main', 'number', ['number', 'array'])
  // create a uint8array buffer holding --help as argv
  const pack = convertProgramArgumentsToC(
    ['bloaty', '--csv', 'dummy', '-d', analysisTypes, '-n', '100'],
    bloatyModule
  )
  // call the function
  // check argv
  console.log(pack.argc)
  console.log(pack.argv)
  const result = bloatyMain(pack.argc, pack.argv)
  console.log(result)
  if (strict && result !== 0) {
    throw new Error(`Bloaty failed with error code ${result}`)
  }
  console.log('output:')
  console.log(stdout)
  freeCArguments(pack.argv, bloatyModule)

  // papaparse output
  const parsed = Papa.parse(stdout, {
    header: true,
    dynamicTyping: true,
  })
  const fields = parsed.meta.fields
  const children = makeTreeFromCSV(parsed.data, fields.slice(0, -2), file.name) ?? []
  // sum up all the sizes and take the difference from the file size to find the unaccounted for size
  const unaccountedSize =
    file.size - children.reduce((acc, item) => acc + firstValue(item.value), 0)
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

export function parseBuffer(file: File, engine?: AnalysisEngine): Promise<ParseResult> {
  return file.arrayBuffer().then(async (buffer) => {
    // give twiggy first crack, it has dominator support
    // which is rly cool to look at
    const engines = engine ? [engine] : [AnalysisEngine.Twiggy, AnalysisEngine.Bloaty]
    // try every engine
    // if it fails, try the next one
    // if it's the last one, don't handle the error
    for (let i = 0; i < engines.length; i++) {
      const engine = engines[i]
      try {
        switch (engine) {
          case AnalysisEngine.Twiggy:
            return {
              data: await parseWithTwiggy(file, buffer),
              engine: AnalysisEngine.Twiggy,
            }
          case AnalysisEngine.Bloaty:
            try {
              return {
                data: await parseWithBloaty(file, buffer, 'compileunits,symbols,sections', true),
                engine: AnalysisEngine.Bloaty,
              }
            } catch (error) {
              console.warn('Bloaty failed, trying bloaty without compileunits')
              return {
                data: await parseWithBloaty(file, buffer, 'symbols,sections', false),
                engine: AnalysisEngine.Bloaty,
              }
            }
        }
      } catch (error) {
        if (i === engines.length - 1) {
          throw error
        }
      }
    }
    // unreachable
    throw new Error('Unreachable')
  })
}
