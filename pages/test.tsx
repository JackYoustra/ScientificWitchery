import dynamic from 'next/dynamic'

// Import the EChart component without SSR (fails due to no window object)
const EChart = dynamic(() => import('@kbox-labs/react-echarts').then((mod) => mod.EChart), {
  ssr: false,
})

export default function Test() {
  return (
    <EChart
      renderer={'svg'}
      onClick={() => console.log('clicked!')}
      xAxis={{
        type: 'category',
      }}
      yAxis={{
        type: 'value',
        boundaryGap: [0, '30%'],
      }}
      series={[
        {
          type: 'line',
          data: [
            ['2022-10-17', 300],
            ['2022-10-18', 100],
          ],
        },
      ]}
    />
  )
}
