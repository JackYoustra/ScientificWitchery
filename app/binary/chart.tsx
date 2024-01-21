import _ from "lodash"
import dynamic from "next/dynamic"
import prettyBytes from 'pretty-bytes'
import type { TooltipFormatterCallback, TopLevelFormatterParams } from 'echarts/types/dist/shared'
import { FileChartDataShape, SectionData, firstValue } from './parser'
import { useTheme } from 'next-themes'
import { format } from "./page"

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
      ${info.name
        ? `<div class="${common} text-left font-bold" style="text-wrap: wrap;">${format.encodeHTML(
          info.name
        )}</div>`
        : ''
      }
      ${cols > 1
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
    }
  })
}

export type LoadedTableDataProps = {
  processedFiles: FileChartDataShape[]
  maxDepth: number
}

export default function Chart(props: {
  data: LoadedTableDataProps,
  fullscreen: boolean,
}) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { data, fullscreen } = props
  return (<EChart
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
          height: 30,
          textShadowColor: 'goldenrod',
        },
        levels: getLevelOption(data.maxDepth),
        data: data.processedFiles,
      },
    ]}
  />)
}