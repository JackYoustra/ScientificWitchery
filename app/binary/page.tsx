'use client'

import { DragEvent, useRef, useState } from 'react'
import { parse_wasm_binary } from 'rust-wasm'
import dynamic from 'next/dynamic'
import Link from 'next/link'
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

export interface ParseWasmBinary {
  items: Item[]
  summary?: Summary[]
}

export interface Item {
  name: string
  shallow_size: number
  shallow_size_percent: ShallowSizePercent
  retained_size: number
  retained_size_percent: number
  children?: Item[]
}

export type ShallowSizePercent = number | number

export interface Summary {
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
}

type TableDataProps = {
  state?:
    | {
        files: File[]
      }
    | {
        data: ChartDataEntry[]
      }
    | {
        error: string
      }
}

function TableData(props: TableDataProps): JSX.Element {
  const { state } = props
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
  } else if (state && 'data' in state && state.data.length > 0) {
    return (
      <>
        <EChart
          className="h-full w-full"
          // do tree shaking later
          // use={[SVGRenderer, TreemapChart]}
          series={[
            {
              type: 'treemap',
              data: state.data,
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
          <span>Drag and drop (or just click!) some files here to analyze them.</span>
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

export default function Binary(): JSX.Element {
  const [isOver, setIsOver] = useState(false)
  const [tableData, setTableData] = useState<TableDataProps>({})
  const fileInput = useRef<HTMLInputElement>(null)

  const handleUpload = (droppedFiles: File[]) => {
    setIsOver(false)

    if (droppedFiles.length === 0) {
      return
    }

    // Fetch the files
    setTableData({
      state: {
        files: droppedFiles,
      },
    })

    // Use FileReader to read file content
    const promises = droppedFiles.map((file) => {
      return file.arrayBuffer().then((buffer) => {
        const result: string = parse_wasm_binary(buffer)
        // parse
        const parsed: ParseWasmBinary = JSON.parse(result)
        // convert to chart data
        function convertToChartData(item: Item): ChartNestedDataShape {
          const children = item.children?.map((child) => convertToChartData(child))
          const childrenSize =
            children?.reduce((acc, child) => acc + firstValue(child.value), 0) ?? 0
          const entry: ChartNestedDataShape = {
            name: item.name,
            value: item.shallow_size + childrenSize,
            children,
          }
          return entry
        }
        const chartData = parsed.items.map((item) => convertToChartData(item))
        const sizeOfTopLevel = parsed.items.reduce((acc, item) => acc + item.retained_size, 0)
        const entry: ChartDataEntry = {
          name: file.name,
          value: sizeOfTopLevel,
          children: chartData,
        }
        return entry
      })
    })

    // await all promises
    Promise.all(promises)
      .then((entries) => {
        setTableData({
          state: {
            data: entries,
          },
        })
      })
      .catch((err) => {
        setTableData({
          state: {
            error: err.toString(),
          },
        })
      })
  }

  const handleUploadButton = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault()
    handleUpload(Array.from(event.target.files))
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

  return (
    <>
      <input
        type="file"
        ref={fileInput}
        className="hidden"
        accept=".wasm, .wat"
        onChange={handleUploadButton}
      />
      <button
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInput.current.click()}
        disabled={tableData.state && 'data' in tableData.state}
        className={
          'flex w-full grow items-center justify-center border-2 border-dashed' +
          (isOver ? ' bg-gray-200 dark:bg-gray-700' : ' bg-white dark:bg-gray-800')
        }
      >
        <TableData state={tableData.state} />
      </button>
    </>
  )
}
