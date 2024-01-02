import { DragEvent, useState } from 'react'
import { parse_wasm_binary } from 'rust-wasm'
import { TreeMap, ChartNestedDataShape } from 'reaviz'

export interface ParseWasmBinary {
  items: Item[]
  summary: Summary[]
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

type ChartDataEntry = ChartNestedDataShape & {
  data: ChartNestedDataShape[]
}

type TableDataProps = {
  state?:
    | {
        files: File[]
      }
    | {
        data: ChartDataEntry[]
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
    console.log(state.data)
    return (
      <>
        <TreeMap height={450} width={450} data={state} />
      </>
    )
  } else {
    return <>Drag and drop some files here to analyze them.</>
  }
}

export default function Binary(): JSX.Element {
  const [isOver, setIsOver] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [chartData, setChartData] = useState<ChartDataEntry[]>([])

  // Define the event handlers
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsOver(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsOver(false)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsOver(false)

    // Fetch the files
    const droppedFiles = Array.from(event.dataTransfer.files)
    setFiles(droppedFiles)

    // Use FileReader to read file content
    const promises = droppedFiles.map((file) => {
      return file.arrayBuffer().then((buffer) => {
        const result: string = parse_wasm_binary(buffer)
        // parse
        const parsed: ParseWasmBinary = JSON.parse(result)
        // convert to chart data
        const chartData: ChartNestedDataShape[] = parsed.items.map((item) => {
          return {
            key: item.name,
            data: item.children?.map((child) => {
              return {
                key: child.name,
                data: child.shallow_size,
              }
            }),
          }
        })
        const entry: ChartDataEntry = {
          key: file.name,
          data: chartData,
        }
        return entry
      })
    })

    // await all promises
    Promise.all(promises).then((entries) => {
      console.log(entries)
      setChartData(entries)
    })
  }

  let childData: TableDataProps | undefined = undefined
  if (chartData.length > 0) {
    childData = { data: chartData }
  } else {
    childData = { files }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        border: '1px dotted',
        backgroundColor: isOver ? 'lightgray' : 'black',
      }}
    >
      <TableData state={childData} />
    </div>
  )
}
