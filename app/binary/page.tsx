'use client'

import { DragEvent, FC, useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
// async import
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import Fullscreen from '@mui/icons-material/Fullscreen'
import FullscreenExit from '@mui/icons-material/FullscreenExit'
import _ from 'lodash'
import Chart, { LoadedTableDataProps } from './chart'
import { AnalysisEngine, ChartDataEntry, parseBuffer } from './parser'

type RunInformation = {
  availableAnalysisEngines: AnalysisEngine[]
  files: File[]
  usedAnalysisEngines: AnalysisEngine[]
}

type TableData =
  | {
      files: File[]
    }
  | {
      data: LoadedTableDataProps
      runInfo: RunInformation
    }
  | {
      error: string
    }

type TableDataProps = {
  state?: TableData
  fullscreen: boolean
}

function unboxUntilFirstProlific(data: ChartDataEntry[]): ChartDataEntry[] {
  let current = data
  while (current.length === 1 && current[0].children && current[0].children !== current) {
    current = current[0].children
  }
  return current
}

function getDepth(item: ChartDataEntry): number {
  if (item.children && item.children.length > 0) {
    return 1 + Math.max(...item.children.map(getDepth))
  } else {
    return 0
  }
}

function engineButtonClassName(tableData: TableData | undefined, target: AnalysisEngine): string {
  return (
    'm-2 rounded-full border border-gray-400 px-1 font-medium' +
    (tableData &&
    'runInfo' in tableData &&
    _.some(tableData.runInfo.usedAnalysisEngines, (e) => e === target)
      ? ' bg-gray-200 dark:bg-gray-700'
      : '') +
    // disable if not available
    (tableData &&
    'runInfo' in tableData &&
    _.some(tableData.runInfo.availableAnalysisEngines, (e) => e === target)
      ? ''
      : ' cursor-not-allowed opacity-50')
  )
}

function TableData(props: TableDataProps): JSX.Element {
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
    return <Chart data={state.data} fullscreen={fullscreen} />
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
            and{' '}
            <Link
              className="m-1 font-medium text-blue-600 hover:underline dark:text-blue-500"
              href="https://github.com/google/bloaty"
            >
              Bloaty🐋
            </Link>
          </span>
          <p className="text-pretty">
            Drag and drop (or just click!) some
            <span className="mx-1 border border-slate-500 font-mono"> wasm </span>
            or
            <span className="mx-1 border border-slate-500 font-mono"> wat </span>
            files here to analyze them with Twiggy🌱
            <br />
            Drag
            <span className="font-bold"> anything else </span>
            to analyze with Bloaty🐋
            <br />
            More useful information will be provided with debug symbols!
          </p>
          <p>Hit escape (or the button in the corner) to toggle fullscreen.</p>
        </div>
      </>
    )
  }
}

export default function Binary(): JSX.Element {
  const [isOver, setIsOver] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [tableData, setTableData] = useState<TableData | undefined>(undefined)
  const fileInput = useRef<HTMLInputElement>(null)

  const runWithAnalysisEngine = useCallback(
    (
      droppedFiles: File[],
      engine?: AnalysisEngine,
      availableAnalysisEngines?: AnalysisEngine[]
    ) => {
      // Use FileReader to read file content
      const promises = droppedFiles.map((file) => {
        return parseBuffer(file, engine)
      })

      // await all promises
      Promise.all(promises)
        .then((entries) => {
          setTableData({
            data: {
              processedFiles: unboxUntilFirstProlific(entries.map((e) => e.data)),
              maxDepth: Math.max(...entries.map((e) => getDepth(e.data))),
            },
            runInfo: {
              // bloaty unconditionally, twiggy only if twiggy was used
              availableAnalysisEngines: _.uniq(
                (availableAnalysisEngines ?? []).concat(
                  entries.map((e) => e.engine).concat([AnalysisEngine.Bloaty])
                )
              ),
              files: droppedFiles,
              usedAnalysisEngines: _.uniq(entries.map((e) => e.engine)),
            },
          })
        })
        .catch((err) => {
          console.log(err)
          setTableData({
            error: err.toString(),
          })
        })
    },
    [setTableData]
  )

  const changeAnalysisEngine = useCallback(
    (engine: AnalysisEngine) => {
      if (
        tableData &&
        'runInfo' in tableData &&
        _.some(tableData.runInfo.usedAnalysisEngines, (e) => e !== engine)
      ) {
        // rerun with new engine
        runWithAnalysisEngine(
          tableData.runInfo.files,
          engine,
          tableData.runInfo.availableAnalysisEngines
        )
      }
    },
    [tableData, runWithAnalysisEngine]
  )

  const handleUpload = (droppedFiles: File[]) => {
    setIsOver(false)

    if (droppedFiles.length === 0) {
      return
    }

    // Fetch the files
    setTableData({
      files: droppedFiles,
    })

    runWithAnalysisEngine(droppedFiles)
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
        <div className="absolute left-0 right-0 top-0 flex w-full grow items-start justify-between">
          <div>
            <button
              className={engineButtonClassName(tableData, AnalysisEngine.Twiggy)}
              onClick={() => {
                changeAnalysisEngine(AnalysisEngine.Twiggy)
              }}
            >
              Twiggy🌱
            </button>
            <button
              className={engineButtonClassName(tableData, AnalysisEngine.Bloaty)}
              onClick={() => {
                changeAnalysisEngine(AnalysisEngine.Bloaty)
              }}
            >
              Bloaty🐋
            </button>
          </div>
          <button className="m-2" onClick={makeFullscreen}>
            <kbd className="inline-block whitespace-nowrap rounded border border-gray-400 p-1 align-middle font-medium leading-4 tracking-wide text-gray-400">
              ESC
            </kbd>
            {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
          </button>
        </div>
      </div>
    </>
  )
}
