'use client'

import { DragEvent, FC, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useTheme } from 'next-themes'
// async import
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let format: any = ''
import prettyBytes from 'pretty-bytes'
import type { TooltipFormatterCallback, TopLevelFormatterParams } from 'echarts/types/dist/shared'
import Fullscreen from '@mui/icons-material/Fullscreen'
import FullscreenExit from '@mui/icons-material/FullscreenExit'
import type { WasmBinaryResult } from 'rust-wasm'
import _ from 'lodash'
import createBloatyModule from 'public/static/emscripten/bloaty'
import Papa from 'papaparse'

const EChart = dynamic(() => import('@kbox-labs/react-echarts').then((mod) => mod.EChart), {
  ssr: false,
})
// // import { TreemapChart } from 'echarts/charts'
// const TreemapChart = dynamic(() => import('echarts/charts').then((mod) => mod.TreemapChart), {
//   ssr: false,
// })
// // import { SVGRenderer } from 'echarts/renderers'
// const SVGRenderer = dynamic(() => import('echarts/renderers').then((mod) => mod.SVGRenderer), {
//   ssr: false,
// })

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

type ChartDataEntry = EchartDataShape
type ChartNestedDataShape = EchartDataShape

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

type SectionData = DominatorItem | OverallSize
type FileChartDataShape = EchartDataShape & {
  sectionData?: SectionData
}

type LoadedTableDataProps = {
  processedFiles: FileChartDataShape[]
  maxDepth: number
}

type TableData =
  | {
      files: File[]
    }
  | {
      data: LoadedTableDataProps
    }
  | {
      error: string
    }

type TableDataProps = {
  state?: TableData
  fullscreen: boolean
}

function getTooltipFormatter(): TooltipFormatterCallback<TopLevelFormatterParams> {
  return (info) => {
    const stuff: string[] = []
    let cols: number
    // add our specifics
    // idk which are needed
    // so I added all of them lol
    const common = ' overflow-hidden text-wrap break-all max-w-md '
    if (info.data?.sectionData) {
      const data: SectionData = info.data.sectionData
      if (_.isNumber(data)) {
        const overallSize = data
        stuff.push(
          `<div class="${common} tooltip-subtitle text-left">${prettyBytes(
            firstValue(info.value)
          )}</div>`
        )
        const percent = (firstValue(info.value) / overallSize) * 100
        stuff.push(
          `<div class="${common} tooltip-subtitle text-left">(${percent.toFixed(2)}%)</div>`
        )
        cols = 2
      } else {
        stuff.push(`<div class="${common} tooltip-subtitle">Retained Size:</div>`)
        stuff.push(
          `<div class="${common} tooltip-subtitle">${prettyBytes(data.retained_size)}</div>`
        )
        stuff.push(
          `<div class="${common} tooltip-subtitle grow">(${data.retained_size_percent.toFixed(
            2
          )}%)</div>`
        )
        stuff.push(`<div class="${common} tooltip-subtitle">Shallow Size:</div>`)
        stuff.push(
          `<div class="${common} tooltip-subtitle">${prettyBytes(data.shallow_size)}</div>`
        )
        stuff.push(
          `<div class="${common} tooltip-subtitle grow">(${data.shallow_size_percent.toFixed(
            2
          )}%)</div>`
        )
        cols = 3
      }
    } else {
      stuff.push(
        `<div class="${common} tooltip-subtitle text-left">${prettyBytes(
          firstValue(info.value)
        )}</div>`
      )
      cols = 1
    }
    return `
    <div class="${common} text-left">
    ${
      info.name
        ? `<div class="${common} text-left font-bold" style="text-wrap: wrap;">${format.encodeHTML(
            info.name
          )}</div>`
        : ''
    }
    ${
      cols > 1
        ? `<div class="${common} grid gap-1" style="grid-template-columns: auto auto 1fr">`
        : ''
    }
    ${stuff.join('')}
    ${cols > 1 ? `</div>` : ''}
    </div>
    `
  }
}

function getDepth(item: ChartDataEntry): number {
  if (item.children && item.children.length > 0) {
    return 1 + Math.max(...item.children.map(getDepth))
  } else {
    return 0
  }
}

function getLevelOption(maxDepth: number) {
  // map 0-10
  return _.range(Math.min(maxDepth + 5, 500)).map((i) => {
    // alternate
    // cycle every 20 layers
    const cycleSpot = i % 16
    const color = cycleSpot % 2 === 0 ? cycleSpot / 20.0 : (20 - cycleSpot) / 20.0
    return {
      itemStyle: {
        borderColorSaturation: color, //0.6
        borderWidth: 5,
        gapWidth: 1,
      },
    }
  })
}

function TableData(props: TableDataProps): JSX.Element {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { state, fullscreen } = props
  if (state && 'files' in state && state.files.length > 0) {
    const { files } = state
    return (
      <>
        <h1>Loading Files...</h1>
        <ul>
          {files.map((file) => (
            <li key={file.name}>
              {file.name} - {file.size} bytes
            </li>
          ))}
        </ul>
      </>
    )
  } else if (state && 'data' in state && state.data.processedFiles.length > 0) {
    return (
      <>
        <EChart
          className={`h-full w-full grow ${fullscreen ? ' overflow-hidden ' : ''}`}
          // do tree shaking later
          // use={[SVGRenderer, TreemapChart]}
          aria={{
            // enabled: true,
            decal: { show: true },
          }}
          tooltip={{
            show: true,
            trigger: 'item',
            formatter: getTooltipFormatter(),
          }}
          theme={resolvedTheme === 'dark' ? 'dark' : 'shine'}
          series={[
            {
              name: state.data.processedFiles[0].name ?? 'Binary size breakdown',
              type: 'treemap',
              visibleMin: 300,
              label: {
                show: true,
                formatter: '{b}',
              },
              upperLabel: {
                show: true,
                height: 30,
              },
              levels: getLevelOption(state.data.maxDepth),
              data: state.data.processedFiles,
            },
          ]}
        />
      </>
    )
  } else if (state && 'error' in state) {
    return (
      <>
        <div className="text-red-400">{state.error}</div>
      </>
    )
  } else {
    return (
      <>
        <div className="flex flex-col space-y-4">
          <span>
            Welcome to my wasm converter, powered by{' '}
            <Link
              className="m-1 font-medium text-blue-600 hover:underline dark:text-blue-500"
              href="https://github.com/rustwasm/twiggy"
            >
              Twiggy🌱
            </Link>
          </span>
          <p>
            Drag and drop (or just click!) some 
            <span className="font-mono border border-slate-500 mx-1"> wasm </span>
            or
            <span className="font-mono border border-slate-500 mx-1"> wat </span>
            files here to analyze them.
            <br />
            More useful information will be provided with debug symbols!
          </p>
        </div>
      </>
    )
  }
}

function firstValue<T>(arr: T[] | T): T {
  if (Array.isArray(arr)) {
    return arr[0]
  } else {
    return arr
  }
}

function unboxUntilFirstProlific(data: ChartDataEntry[]): ChartDataEntry[] {
  let current = data
  while (current.length === 1 && current[0].children && current[0].children !== current) {
    current = current[0].children
  }
  return current
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
    return Object.entries(grouped).map(([key, value]) => {
      const children = makeTreeFromCSV(value, fields.slice(1), path + '/' + key)
      const entry: ChartDataEntry = {
        name: key,
        value: children.reduce((acc, item) => acc + firstValue(item.value), 0),
        children,
        path: path + '/' + key,
      }
      return entry
    })
  }
}
function convertProgramArgumentsToC(args: string[], module: any): { argc: number, argv: Uint8Array } {
  const encodedArgsPointers = args.map(arg => module.stringToNewUTF8(arg))
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

function freeCArguments(argv: Uint8Array, module: any) {
  // free the memory
  const pointersBuffer = new Uint32Array(argv.buffer)
  pointersBuffer.forEach(pointer => {
    module._free(pointer)
  })
}

async function parseWithBloaty(file: File, buffer: ArrayBuffer): Promise<ChartDataEntry> {
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
    }
  })

  console.log(bloatyModule)
  bloatyModule.FS.writeFile("dummy", new Uint8Array(buffer))

  const bloatyMain = bloatyModule.cwrap('main', 'number', ['number', 'array'])
  // create a uint8array buffer holding --help as argv
  const pack = convertProgramArgumentsToC(['bloaty', '--csv', 'dummy', '-d', 'symbols,sections', '-n', '100'], bloatyModule)
  // call the function
  // check argv
  console.log(pack.argc)
  console.log(pack.argv)
  const result = bloatyMain(pack.argc, pack.argv)
  console.log(result)
  console.log("output:")
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
  const unaccountedSize = file.size - children.reduce((acc, item) => acc + firstValue(item.value), 0)
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
  const chartData = parsed.dominators.items.map((item) =>
    convertToChartData(item, file.name)
  )
  if (parsed.garbage) {
    chartData.push(topGarbage2Chart(parsed.garbage, file.size))
  }
  let sizeOfTopLevel = parsed.dominators.items.reduce(
    (acc, item) => acc + item.retained_size,
    0
  )
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

function parseBuffer(file: File): Promise<ChartDataEntry> {
  return file.arrayBuffer().then(async (buffer) => {
    // give twiggy first crack, it has dominator support
    // which is rly cool to look at
    try {
      return await parseWithTwiggy(file, buffer)
    } catch(error) {
      console.warn('Twiggy failed, trying bloaty')
      // console.warn('Error: ', error)
      // if it fails, try bloaty
      return await parseWithBloaty(file, buffer)
    }
  })
}

export default dynamic(
  async function Binary(): Promise<FC<Record<string, never>>> {
    const coreStuff = await import('echarts/core')
    format = coreStuff.format
    return function BinaryLoaded(): JSX.Element {
      const [isOver, setIsOver] = useState(false)
      const [isFullscreen, setIsFullscreen] = useState(false)
      const [tableData, setTableData] = useState<TableData | undefined>(undefined)
      const fileInput = useRef<HTMLInputElement>(null)

      const handleUpload = (droppedFiles: File[]) => {
        setIsOver(false)

        if (droppedFiles.length === 0) {
          return
        }

        // Fetch the files
        setTableData({
          files: droppedFiles,
        })

        // Use FileReader to read file content
        const promises = droppedFiles.map(parseBuffer)

        // await all promises
        Promise.all(promises)
          .then((entries) => {
            setTableData({
              data: {
                processedFiles: unboxUntilFirstProlific(entries),
                maxDepth: Math.max(...entries.map(getDepth)),
              },
            })
          })
          .catch((err) => {
            console.log(err)
            setTableData({
              error: err.toString(),
            })
          })
      }

      const handleUploadButton = (event: React.ChangeEvent<HTMLInputElement>) => {
        event.preventDefault()
        if (event.target.files) {
          handleUpload(Array.from(event.target.files))
        }
      }

      // Define the event handlers
      const handleDragOver = (event: DragEvent<HTMLButtonElement>) => {
        event.preventDefault()
        setIsOver(true)
      }

      const handleDragLeave = (event: DragEvent<HTMLButtonElement>) => {
        event.preventDefault()
        setIsOver(false)
      }

      const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
        event.preventDefault()
        handleUpload(Array.from(event.dataTransfer.files))
      }

      const makeFullscreen = () => {
        setIsFullscreen(!isFullscreen)
      }

      // handle escape to toggle fullscreen
      useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            setIsFullscreen(!isFullscreen)
          }
        }
        window.addEventListener('keydown', handleEsc)
        return () => {
          window.removeEventListener('keydown', handleEsc)
        }
      }, [isFullscreen])

      return (
        <>
          <div className={`flex w-full grow ${isFullscreen ? '' : 'sticky'}`}>
            <input
              type="file"
              ref={fileInput}
              className="hidden"
              // accept=".wasm, .wat"
              onChange={handleUploadButton}
            />
            <button
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInput.current?.click()}
              disabled={tableData && 'data' in tableData}
              className={
                // make floating
                (isFullscreen ? 'absolute left-0 top-0 h-screen w-screen ' : '') +
                'flex w-full grow flex-col items-center justify-center border-2 border-dashed' +
                (isOver ? ' bg-gray-200 dark:bg-gray-700' : ' bg-white dark:bg-gray-800')
              }
            >
              <TableData state={tableData} fullscreen={isFullscreen} />
            </button>
            <button className="absolute right-0 top-0" onClick={makeFullscreen}>
              <kbd className="inline-block whitespace-nowrap rounded border border-gray-400 px-1.5 align-middle text-xs font-medium leading-4 tracking-wide text-gray-400">
                ESC
              </kbd>
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </button>
          </div>
        </>
      )
    }
  },
  {
    ssr: false,
    loading: () => <div>Loading...</div>,
  }
)
