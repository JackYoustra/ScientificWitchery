import _ from 'lodash'
import dynamic from 'next/dynamic'
import prettyBytes from 'pretty-bytes'
import type { TooltipFormatterCallback, TopLevelFormatterParams } from 'echarts/types/dist/shared'
import {
  FileChartDataShape,
  SectionData,
  firstValue,
  firstValueNaNHandled,
  firstValueOr,
} from './parser'
import { useTheme } from 'next-themes'
import { useEffect } from 'react'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let format: any = ''

async function load() {
  const coreStuff = await import('echarts/core')
  if (!format) {
    format = coreStuff.format
  }
}

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

function getTooltipFormatter(
  data: LoadedTableDataProps
): TooltipFormatterCallback<TopLevelFormatterParams> {
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
      const totalSize = data.processedFiles.reduce(
        (acc, cur) => acc + firstValueNaNHandled(cur.value),
        0
      )
      if (totalSize === 0) {
        cols = 1
      } else {
        const size = firstValueNaNHandled(info.value)
        const sizePct = (size / totalSize) * 100
        stuff.push(`<div class="${common} tooltip-subtitle grow">(${sizePct.toFixed(2)}%)</div>`)
        cols = 2
      }
    }
    return `
      <div class="${common} text-left">
      ${
        info.name && format
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
      // // Invert the color for the first level
      upperLabel: {
        backgroundColor: `rgba(0,0,0,${color / 3})`,
      },
    }
  })
}

export type LoadedTableDataProps = {
  processedFiles: FileChartDataShape[]
  maxDepth: number
}

export default function Chart(props: { data: LoadedTableDataProps; fullscreen: boolean }) {
  useEffect(() => {
    load()
  }, [])
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { data, fullscreen } = props
  return (
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
        formatter: getTooltipFormatter(data),
      }}
      theme={resolvedTheme === 'dark' ? 'dark' : 'shine'}
      textStyle={{
        fontFamily: 'monospace',
      }}
      series={[
        {
          name: data.processedFiles[0].name ?? 'Binary size breakdown',
          type: 'treemap',
          visibleMin: 300,
          label: {
            show: true,
            formatter: '{b}',
          },
          upperLabel: {
            show: true,
            height: 20,
            color: 'white',
            // backgroundColor: 'transparent',
            // backgroundColor: 'rgba(0,0,0,0.0)',
            // color: "rgba(0,0,0,1.0)",
          },
          levels: getLevelOption(data.maxDepth),
          data: data.processedFiles,
        },
      ]}
    />
  )
}
