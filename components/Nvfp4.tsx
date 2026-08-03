'use client'
import React, { useState, useMemo } from 'react'

// Color interpolation for smooth gradients
const getErrorColor = (error: number, maxError: number): string => {
  const normalized = Math.min(error / maxError, 1)

  // Interpolate from green (0) to yellow (0.5) to red (1)
  let r, g, b
  if (normalized < 0.5) {
    // Green to yellow
    const t = normalized * 2
    r = Math.round(50 + t * 205)
    g = Math.round(200 - t * 50)
    b = 30
  } else {
    // Yellow to red
    const t = (normalized - 0.5) * 2
    r = 255
    g = Math.round(150 - t * 150)
    b = Math.round(30 - t * 30)
  }

  return `rgb(${r}, ${g}, ${b})`
}

// FP4 value lookup table (NVFP4 E2M1 format)
// From the blog post: values include 0, ±0.5, ±1, ±1.5, ±2, ±3, ±4, ±6
const FP4_VALUES = {
  '0000': 0, // Zero (special encoding)
  '0001': 0.5, // Special encoding for 0.5
  '0010': 1.0, // 2^(-1) × 2 = 1.0
  '0011': 1.5, // 2^(-1) × 3 = 1.5
  '0100': 2.0, // 2^0 × 2 = 2.0
  '0101': 3.0, // 2^0 × 3 = 3.0
  '0110': 4.0, // 2^1 × 2 = 4.0
  '0111': 6.0, // 2^1 × 3 = 6.0
  '1000': -0, // Negative zero
  '1001': -0.5, // Special encoding for -0.5
  '1010': -1.0, // -2^(-1) × 2 = -1.0
  '1011': -1.5, // -2^(-1) × 3 = -1.5
  '1100': -2.0, // -2^0 × 2 = -2.0
  '1101': -3.0, // -2^0 × 3 = -3.0
  '1110': -4.0, // -2^1 × 2 = -4.0
  '1111': -6.0, // -2^1 × 3 = -6.0
}

// Get binary representation
const toBinary = (fp4Value: number): string => {
  for (const [binary, value] of Object.entries(FP4_VALUES)) {
    if (Math.abs(value - fp4Value) < 0.001) return binary
  }
  return '0000'
}

// Quantize to nearest FP4 value
const quantizeToFP4 = (value: number): number => {
  // NVFP4 representable values: 0, ±0.5, ±1, ±1.5, ±2, ±3, ±4, ±6
  const fp4Values = [0, 0.5, 1.0, 1.5, 2.0, 3.0, 4.0, 6.0]
  const sign = value < 0 ? -1 : 1
  const absValue = Math.abs(value)

  let closest = 0
  let minDiff = Math.abs(absValue)

  for (const fp4Val of fp4Values) {
    const diff = Math.abs(absValue - fp4Val)
    if (diff < minDiff) {
      minDiff = diff
      closest = fp4Val
    }
  }

  return sign * closest
}

// Component 2: Bit representation with value and calculation
const BitRepresentation = ({ value }: { value: number }) => {
  const binary = toBinary(value)
  const sign = binary[0] === '0' ? 1 : -1
  const exp = binary.substring(1, 3)
  const mantissa = binary[3]

  // NVFP4 special encoding explanation
  let calculation
  if (binary === '0000' || binary === '1000') {
    calculation = 'Zero (special)'
  } else if (binary === '0001' || binary === '1001') {
    calculation = `${sign < 0 ? '-' : ''}0.5 (special)`
  } else {
    // Normal E2M1 calculation
    const expInt = parseInt(exp, 2)
    const mantInt = parseInt(mantissa, 2)
    const expBias = expInt - 2 // Adjusted for NVFP4 encoding
    const mantValue = 2 + mantInt // 2 or 3
    calculation = `${sign < 0 ? '-' : ''}2^(${expBias}) × ${mantValue}`
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <div
          className={`rounded-sm px-2 py-1 font-mono text-xs ${
            binary[0] === '0' ? 'bg-green-500' : 'bg-red-500'
          }`}
          title="Sign bit"
        >
          {binary[0]}
        </div>
        <div className="rounded-sm bg-blue-500 px-2 py-1 font-mono text-xs" title="Exponent">
          {exp}
        </div>
        <div className="rounded-sm bg-purple-500 px-2 py-1 font-mono text-xs" title="Mantissa">
          {mantissa}
        </div>
        <div className="ml-2 text-xs text-gray-400">= {value}</div>
      </div>
      <div className="font-mono text-[11px] text-gray-500">{calculation}</div>
    </div>
  )
}

// Main scaling demonstration with multiple micro-blocks
const NVFP4ScalingDemo = () => {
  // Generate 4 micro-blocks of 16 values each
  const [microBlocks] = useState<number[][]>(() => {
    const blocks: number[][] = []
    for (let b = 0; b < 4; b++) {
      const values: number[] = []
      // Create different value ranges for each block to show why we need per-block scales
      const baseRange = 2 + b * 1.5
      const offset = (b - 1.5) * 2
      for (let i = 0; i < 16; i++) {
        const v = (Math.random() - 0.5) * baseRange + offset + Math.sin(i * 0.3 + b) * 1.5
        values.push(v)
      }
      blocks.push(values)
    }
    return blocks
  })

  const [selectedBlock, setSelectedBlock] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [blockScales, setBlockScales] = useState([1.5, 2.0, 2.5, 3.0])
  const [tensorScale, setTensorScale] = useState(0.8)
  const [hoveredSlider, setHoveredSlider] = useState<string | null>(null)

  const selectedValue = microBlocks[selectedBlock][selectedIndex]
  const scaledValue = selectedValue / blockScales[selectedBlock] / tensorScale
  const quantizedValue = quantizeToFP4(scaledValue)
  const reconstructedValue = quantizedValue * blockScales[selectedBlock] * tensorScale
  const error = Math.abs(selectedValue - reconstructedValue)

  // Calculate globally optimal scales (joint optimization)
  const globalOptimalScales = useMemo(() => {
    let bestBlockScales = [1.0, 1.0, 1.0, 1.0]
    let bestTensorScale = 1.0
    let minTotalError = Infinity

    // Coarse grid search for initial values
    for (let ts = 0.2; ts <= 2.0; ts += 0.2) {
      // For each tensor scale, find optimal block scales
      const tempBlockScales = microBlocks.map((block) => {
        let bestBS = 1.0
        let minBlockError = Infinity

        for (let bs = 0.5; bs <= 5.0; bs += 0.2) {
          let blockError = 0
          for (const val of block) {
            const scaled = val / bs / ts
            const quantized = quantizeToFP4(scaled)
            const reconstructed = quantized * bs * ts
            blockError += Math.abs(val - reconstructed)
          }

          if (blockError < minBlockError) {
            minBlockError = blockError
            bestBS = bs
          }
        }
        return bestBS
      })

      // Calculate total error with these scales
      let totalError = 0
      for (let b = 0; b < 4; b++) {
        for (const val of microBlocks[b]) {
          const scaled = val / tempBlockScales[b] / ts
          const quantized = quantizeToFP4(scaled)
          const reconstructed = quantized * tempBlockScales[b] * ts
          totalError += Math.abs(val - reconstructed)
        }
      }

      if (totalError < minTotalError) {
        minTotalError = totalError
        bestBlockScales = tempBlockScales
        bestTensorScale = ts
      }
    }

    // Fine-tune the result
    return {
      blockScales: bestBlockScales.map((s) => Math.round(s * 10) / 10),
      tensorScale: Math.round(bestTensorScale * 10) / 10,
    }
  }, [microBlocks])

  // Calculate all errors for heatmap
  const allErrors = microBlocks.map((block, blockIdx) =>
    block.map((val) => {
      const scaled = val / blockScales[blockIdx] / tensorScale
      const quantized = quantizeToFP4(scaled)
      return Math.abs(val - quantized * blockScales[blockIdx] * tensorScale)
    })
  )
  const maxError = Math.max(...allErrors.flat(), 2.0)

  return (
    <div className="mb-6 rounded-lg bg-gray-900 p-4">
      <h3 className="mb-3 text-lg font-semibold text-white">Dual-Scaling Mechanism</h3>

      <div className="mb-4 grid grid-cols-2 gap-2">
        {microBlocks.map((block, blockIdx) => (
          <div
            key={blockIdx}
            className={`rounded-sm bg-gray-800 p-2 transition-all ${
              hoveredSlider === 'tensor'
                ? 'ring-2 ring-green-500 ring-opacity-50'
                : hoveredSlider === 'block' && blockIdx === selectedBlock
                  ? 'ring-2 ring-blue-500 ring-opacity-50'
                  : ''
            }`}
          >
            <div className="mb-1 flex items-center justify-between">
              <div className="text-xs text-gray-400">Block {blockIdx + 1}</div>
              <div className="text-xs text-blue-400">Scale: {blockScales[blockIdx].toFixed(2)}</div>
            </div>
            <div className="grid grid-cols-4 gap-0.5">
              {block.map((val, idx) => {
                const isSelected = blockIdx === selectedBlock && idx === selectedIndex
                const error = allErrors[blockIdx][idx]
                const color = getErrorColor(error, maxError)

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedBlock(blockIdx)
                      setSelectedIndex(idx)
                    }}
                    className={`rounded-sm p-1 font-mono text-[10px] transition-all hover:scale-105 ${
                      isSelected ? 'ring-2 ring-white' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    <div className="font-semibold text-white">{val.toFixed(1)}</div>
                    <div className="text-[8px] text-gray-200">
                      {quantizeToFP4(val / blockScales[blockIdx] / tensorScale).toFixed(1)}
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="mt-1 text-[10px] text-gray-500">
              Avg Error: {(allErrors[blockIdx].reduce((a, b) => a + b) / 16).toFixed(3)}
              {globalOptimalScales.blockScales[blockIdx] !== blockScales[blockIdx] && (
                <span className="ml-1 text-blue-400">
                  (Optimal: {globalOptimalScales.blockScales[blockIdx]})
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-3 flex items-center gap-2 text-center text-xs text-green-400">
        <div className="h-px flex-1 bg-green-600"></div>
        <div className="rounded-sm bg-green-900 px-3 py-1">
          Tensor Scale: {tensorScale.toFixed(2)} (applies to all blocks)
        </div>
        <div className="h-px flex-1 bg-green-600"></div>
      </div>

      <div className="space-y-3 rounded-sm bg-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Selected: Block {selectedBlock + 1}, Value #{selectedIndex + 1}
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: getErrorColor(0, maxError) }}
              ></div>
              <span className="text-gray-500">0</span>
            </div>
            <div className="text-gray-600">→</div>
            <div className="flex items-center gap-1">
              <div
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: getErrorColor(maxError / 2, maxError) }}
              ></div>
              <span className="text-gray-500">{(maxError / 2).toFixed(1)}</span>
            </div>
            <div className="text-gray-600">→</div>
            <div className="flex items-center gap-1">
              <div
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: getErrorColor(maxError, maxError) }}
              ></div>
              <span className="text-gray-500">{maxError.toFixed(1)}</span>
            </div>
            <span className="ml-1 text-gray-600">error</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="mb-1 text-xs text-gray-500">Original → Scaled</div>
            <div className="font-mono text-white">
              {selectedValue.toFixed(3)} → {scaledValue.toFixed(3)}
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs text-gray-500">Quantized (FP4)</div>
            <div className="font-mono text-yellow-400">{quantizedValue.toFixed(1)}</div>
            <BitRepresentation value={quantizedValue} />
          </div>
        </div>

        <div className="border-t border-gray-700 pt-3">
          <div className="mb-1 text-xs text-gray-500">Reconstruction</div>
          <div className="font-mono text-sm text-white">
            {quantizedValue.toFixed(1)} × {blockScales[selectedBlock].toFixed(2)} ×{' '}
            {tensorScale.toFixed(2)} = {reconstructedValue.toFixed(3)}
          </div>
          <div className={`mt-1 text-sm ${error < 0.5 ? 'text-green-400' : 'text-red-400'}`}>
            Error: {error.toFixed(3)} ({((error / Math.abs(selectedValue)) * 100).toFixed(1)}%)
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label className="flex items-center justify-between text-sm text-gray-400">
            <span>
              Block {selectedBlock + 1} Scale (FP8): {blockScales[selectedBlock].toFixed(2)}
            </span>
            <button
              onClick={() => {
                setBlockScales(globalOptimalScales.blockScales)
                setTensorScale(globalOptimalScales.tensorScale)
              }}
              className="rounded-sm bg-gray-700 px-2 py-0.5 text-xs text-white transition-colors hover:bg-gray-600"
            >
              Reset to Optimal
            </button>
          </label>
          <div className="text-xs text-blue-400">
            Optimal: {globalOptimalScales.blockScales[selectedBlock]}
          </div>
          <div className="relative">
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.1"
              value={blockScales[selectedBlock]}
              onChange={(e) => {
                const newScales = [...blockScales]
                newScales[selectedBlock] = parseFloat(e.target.value)
                setBlockScales(newScales)
              }}
              onMouseEnter={() => setHoveredSlider('block')}
              onMouseLeave={() => setHoveredSlider(null)}
              className="w-full"
            />
            <div
              className="pointer-events-none absolute bottom-0 top-0 w-1 bg-blue-400"
              style={{
                left: `${((globalOptimalScales.blockScales[selectedBlock] - 0.5) / (5 - 0.5)) * 100}%`,
                transform: 'translateX(-50%)',
              }}
              title={`Optimal: ${globalOptimalScales.blockScales[selectedBlock]}`}
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="text-sm text-gray-400">
            Tensor Scale (FP32): {tensorScale.toFixed(2)} - affects all blocks
          </label>
          <div className="text-xs text-green-400">Optimal: {globalOptimalScales.tensorScale}</div>
          <div className="relative">
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.05"
              value={tensorScale}
              onChange={(e) => setTensorScale(parseFloat(e.target.value))}
              onMouseEnter={() => setHoveredSlider('tensor')}
              onMouseLeave={() => setHoveredSlider(null)}
              className="w-full"
            />
            <div
              className="pointer-events-none absolute bottom-0 top-0 w-1 bg-green-400"
              style={{
                left: `${((globalOptimalScales.tensorScale - 0.1) / (2 - 0.1)) * 100}%`,
                transform: 'translateX(-50%)',
              }}
              title={`Optimal: ${globalOptimalScales.tensorScale}`}
            />
          </div>
        </div>

        <div className="mt-3 rounded-sm bg-gray-700 p-2 text-xs text-gray-500">
          💡 Block scales handle local variations, tensor scale normalizes globally
        </div>

        <div className="mt-3 rounded-sm bg-gray-700 p-3">
          <div className="text-xs text-gray-400">
            <span className="font-mono text-white">
              Total Error:{' '}
              {allErrors
                .flat()
                .reduce((a, b) => a + b)
                .toFixed(2)}
            </span>
            <span className="mx-2 text-gray-500">|</span>
            <span className="font-mono text-white">
              Avg: {(allErrors.flat().reduce((a, b) => a + b) / 64).toFixed(3)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Where it's used diagram
const UsageContext = () => {
  return (
    <div className="mb-6 rounded-lg bg-gray-900 p-4">
      <h3 className="mb-3 text-lg font-semibold text-white">NVFP4 in Matrix Multiplication</h3>
      <div className="rounded-sm bg-gray-800 p-4">
        <div className="space-y-3 text-sm text-gray-300">
          <div className="rounded-sm bg-gray-700 p-3 font-mono text-xs">
            {/* eslint-disable-next-line */}
            <div className="text-green-400">// Weight matrix (e.g., 4096×4096)</div>
            <div>W_fp16: 32 MB → W_fp4: 8 MB + 1 MB scales</div>
            {/* eslint-disable-next-line */}
            <div className="text-blue-400">// 3.6× compression</div>
          </div>

          <p>The GPU&apos;s Blackwell Tensor Cores handle dequantization in hardware:</p>
          <div className="rounded-sm bg-gray-700 p-2 font-mono text-sm">
            fp4_weight × block_scale × tensor_scale → fp16_value
          </div>
        </div>
      </div>
    </div>
  )
}

// Model performance calculator (simplified)
const ModelSpeedupCalculator = () => {
  const gpuSpecs = {
    fp16Tflops: 838,
    fp4Tflops: 3352,
    memoryGB: 32,
  }

  const fp16MemoryGB = 16 // 8B params × 2 bytes
  const fp4MemoryGB = 5 // 8B params × 0.5 bytes + scales

  return (
    <div className="rounded-lg bg-gray-900 p-4">
      <h3 className="mb-3 text-lg font-semibold text-white">RTX 5090 Performance Impact</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-sm bg-gray-800 p-3">
          <h4 className="mb-2 text-sm font-semibold text-gray-400">Compute</h4>
          <div className="font-mono text-2xl text-yellow-400">
            {(gpuSpecs.fp4Tflops / gpuSpecs.fp16Tflops).toFixed(1)}×
          </div>
          <div className="text-xs text-gray-500">FP4 vs FP16 TOPS</div>
        </div>

        <div className="rounded-sm bg-gray-800 p-3">
          <h4 className="mb-2 text-sm font-semibold text-gray-400">Memory</h4>
          <div className="font-mono text-2xl text-green-400">
            {(fp16MemoryGB / fp4MemoryGB).toFixed(1)}×
          </div>
          <div className="text-xs text-gray-500">model size reduction</div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-400">
        Qwen3-8B: {fp16MemoryGB}GB → {fp4MemoryGB}GB = 3-4× more concurrent users
      </div>
    </div>
  )
}

// Main component
const NVFP4Visualizations = () => {
  return (
    <div className="space-y-6">
      <NVFP4ScalingDemo />
      <UsageContext />
      <ModelSpeedupCalculator />
    </div>
  )
}

export default NVFP4Visualizations
