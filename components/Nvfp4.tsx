'use client'
import React, { useState, useMemo } from 'react'

/**
 * mulberry32: a 32-bit PRNG in four lines, seeded explicitly.
 *
 * The sample below used to come from `Math.random()` inside a `useState`
 * initializer, which is evaluated once on the server while prerendering and
 * again in the browser while hydrating. The two never agreed, so every load of
 * /blog/road-to-petaflop logged React error #418 and threw away the server's
 * markup for this subtree. It also meant the numbers the post talks about were
 * different noise on every visit, which is not what a worked example is for.
 */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Four micro-blocks of sixteen values, each block deliberately given a
 * different range and offset — that spread is the whole reason per-block scales
 * exist, and it is what the demo is showing. Fixed seed, so this is one sample
 * rather than a new one per mount.
 */
const MICRO_BLOCKS: number[][] = (() => {
  const random = mulberry32(0x4e56_4650)
  return Array.from({ length: 4 }, (_unused, b) => {
    const baseRange = 2 + b * 1.5
    const offset = (b - 1.5) * 2
    return Array.from(
      { length: 16 },
      (_value, i) => (random() - 0.5) * baseRange + offset + Math.sin(i * 0.3 + b) * 1.5
    )
  })
})()

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
  // `substring` rather than `binary[0]` / `binary[3]`: it is total, so a short
  // string yields '' instead of `undefined` leaking into `parseInt`.
  const signBit = binary.substring(0, 1)
  const sign = signBit === '0' ? 1 : -1
  const exp = binary.substring(1, 3)
  const mantissa = binary.substring(3, 4)

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
          className={`rounded-sm px-2 py-1 font-mono text-xs text-white ${
            signBit === '0' ? 'bg-green-500' : 'bg-red-500'
          }`}
          title="Sign bit"
        >
          {signBit}
        </div>
        <div
          className="rounded-sm bg-blue-500 px-2 py-1 font-mono text-xs text-white"
          title="Exponent"
        >
          {exp}
        </div>
        <div
          className="rounded-sm bg-purple-500 px-2 py-1 font-mono text-xs text-white"
          title="Mantissa"
        >
          {mantissa}
        </div>
        <div className="text-ink-muted ml-2 text-xs">= {value}</div>
      </div>
      <div className="text-ink-faint font-mono text-[11px]">{calculation}</div>
    </div>
  )
}

/** Total absolute reconstruction error for one micro-block at a given pair of scales. */
const blockError = (values: number[], blockScale: number, tensorScale: number): number =>
  values.reduce((total, val) => {
    const reconstructed = quantizeToFP4(val / blockScale / tensorScale) * blockScale * tensorScale
    return total + Math.abs(val - reconstructed)
  }, 0)

/** Coarse sweep over block scales, for a tensor scale that's held fixed. */
const bestBlockScale = (values: number[], tensorScale: number): number => {
  let best = 1.0
  let minError = Infinity
  for (let bs = 0.5; bs <= 5.0; bs += 0.2) {
    const error = blockError(values, bs, tensorScale)
    if (error < minError) {
      minError = error
      best = bs
    }
  }
  return best
}

// Main scaling demonstration with multiple micro-blocks
const NVFP4ScalingDemo = () => {
  const microBlocks = MICRO_BLOCKS

  const [selectedBlock, setSelectedBlock] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [blockScales, setBlockScales] = useState([1.5, 2.0, 2.5, 3.0])
  const [tensorScale, setTensorScale] = useState(0.8)
  const [hoveredSlider, setHoveredSlider] = useState<string | null>(null)

  // Calculate globally optimal scales (joint optimization)
  const globalOptimalScales = useMemo(() => {
    let bestBlockScales = microBlocks.map(() => 1.0)
    let bestTensorScale = 1.0
    let minTotalError = Infinity

    // Coarse grid search for initial values
    for (let ts = 0.2; ts <= 2.0; ts += 0.2) {
      // For each tensor scale, find optimal block scales. Keeping each block
      // next to its own candidate scale means the total below never has to
      // index two arrays by the same loop variable and hope they line up.
      const candidates = microBlocks.map((values) => ({
        values,
        scale: bestBlockScale(values, ts),
      }))

      // Calculate total error with these scales
      const totalError = candidates.reduce(
        (total, candidate) => total + blockError(candidate.values, candidate.scale, ts),
        0
      )

      if (totalError < minTotalError) {
        minTotalError = totalError
        bestBlockScales = candidates.map((candidate) => candidate.scale)
        bestTensorScale = ts
      }
    }

    // Fine-tune the result
    return {
      blockScales: bestBlockScales.map((s) => Math.round(s * 10) / 10),
      tensorScale: Math.round(bestTensorScale * 10) / 10,
    }
  }, [microBlocks])

  /**
   * Each micro-block joined to the two scales that apply to it and to the
   * quantization those scales produce. Zipping the parallel arrays once, here,
   * is what lets the render tree below walk the data instead of indexing three
   * arrays by the same loop variable.
   */
  const blocks = microBlocks.map((values, blockIdx) => {
    // Both scale arrays are built with exactly one entry per micro-block and are
    // only ever replaced wholesale, so these fallbacks are unreachable; 1 is the
    // identity scale, so a future edit that broke the invariant would show the
    // raw values rather than a wall of NaN.
    const scale = blockScales[blockIdx] ?? 1
    const optimalScale = globalOptimalScales.blockScales[blockIdx] ?? scale
    // Calculate all errors for heatmap
    const cells = values.map((value) => {
      const scaled = value / scale / tensorScale
      const quantized = quantizeToFP4(scaled)
      const reconstructed = quantized * scale * tensorScale
      return { value, scaled, quantized, reconstructed, error: Math.abs(value - reconstructed) }
    })
    return { scale, optimalScale, cells }
  })

  const allErrors = blocks.flatMap((block) => block.cells.map((cell) => cell.error))
  const maxError = Math.max(...allErrors, 2.0)

  const selectedBlockData = blocks[selectedBlock]
  const selectedCell = selectedBlockData?.cells[selectedIndex]

  return (
    <div className="border-rule bg-sunken mb-6 rounded-lg border p-4">
      <h3 className="text-ink-strong mb-3 text-lg font-bold">Dual-Scaling Mechanism</h3>

      <div className="mb-4 grid grid-cols-2 gap-2">
        {blocks.map((block, blockIdx) => (
          <div
            key={blockIdx}
            className={`bg-raised rounded-sm p-2 transition-all ${
              hoveredSlider === 'tensor'
                ? 'ring-2 ring-green-500 ring-opacity-50'
                : hoveredSlider === 'block' && blockIdx === selectedBlock
                  ? 'ring-2 ring-blue-500 ring-opacity-50'
                  : ''
            }`}
          >
            <div className="mb-1 flex items-center justify-between">
              <div className="text-ink-muted text-xs">Block {blockIdx + 1}</div>
              <div className="text-xs text-blue-700 dark:text-blue-400">
                Scale: {block.scale.toFixed(2)}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-0.5">
              {block.cells.map((cell, idx) => {
                const isSelected = blockIdx === selectedBlock && idx === selectedIndex
                const color = getErrorColor(cell.error, maxError)

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedBlock(blockIdx)
                      setSelectedIndex(idx)
                    }}
                    className={`rounded-sm p-1 font-mono text-[10px] transition-all hover:scale-105 ${
                      isSelected ? 'ring-ink-strong ring-2' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    <div className="font-semibold text-white">{cell.value.toFixed(1)}</div>
                    <div className="text-[8px] text-white/80">{cell.quantized.toFixed(1)}</div>
                  </button>
                )
              })}
            </div>
            <div className="text-ink-faint mt-1 text-[10px]">
              Avg Error:{' '}
              {(
                block.cells.reduce((total, cell) => total + cell.error, 0) / block.cells.length
              ).toFixed(3)}
              {block.optimalScale !== block.scale && (
                <span className="ml-1 text-blue-700 dark:text-blue-400">
                  (Optimal: {block.optimalScale})
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-3 flex items-center gap-2 text-center text-xs text-green-700 dark:text-green-400">
        <div className="h-px flex-1 bg-green-600/40"></div>
        <div className="rounded-sm bg-green-100 px-3 py-1 text-green-900 dark:bg-green-950 dark:text-green-200">
          Tensor Scale: {tensorScale.toFixed(2)} (applies to all blocks)
        </div>
        <div className="h-px flex-1 bg-green-600/40"></div>
      </div>

      {/*
        The selection always points at a real cell — both indices only ever come
        from the grid above — so this renders unconditionally in practice. It is
        a guard rather than an assertion because "no cell selected" has an
        obvious right answer: don't draw a panel about it.
      */}
      {selectedBlockData && selectedCell && (
        <div className="bg-raised space-y-3 rounded-sm p-4">
          <div className="flex items-center justify-between">
            <div className="text-ink-muted text-sm">
              Selected: Block {selectedBlock + 1}, Value #{selectedIndex + 1}
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: getErrorColor(0, maxError) }}
                ></div>
                <span className="text-ink-faint">0</span>
              </div>
              <div className="text-ink-faint">→</div>
              <div className="flex items-center gap-1">
                <div
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: getErrorColor(maxError / 2, maxError) }}
                ></div>
                <span className="text-ink-faint">{(maxError / 2).toFixed(1)}</span>
              </div>
              <div className="text-ink-faint">→</div>
              <div className="flex items-center gap-1">
                <div
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: getErrorColor(maxError, maxError) }}
                ></div>
                <span className="text-ink-faint">{maxError.toFixed(1)}</span>
              </div>
              <span className="text-ink-faint ml-1">error</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-ink-faint mb-1 text-xs">Original → Scaled</div>
              <div className="text-ink-strong font-mono">
                {selectedCell.value.toFixed(3)} → {selectedCell.scaled.toFixed(3)}
              </div>
            </div>

            <div>
              <div className="text-ink-faint mb-1 text-xs">Quantized (FP4)</div>
              <div className="font-mono text-yellow-700 dark:text-yellow-400">
                {selectedCell.quantized.toFixed(1)}
              </div>
              <BitRepresentation value={selectedCell.quantized} />
            </div>
          </div>

          <div className="border-rule border-t pt-3">
            <div className="text-ink-faint mb-1 text-xs">Reconstruction</div>
            <div className="text-ink-strong font-mono text-sm">
              {selectedCell.quantized.toFixed(1)} × {selectedBlockData.scale.toFixed(2)} ×{' '}
              {tensorScale.toFixed(2)} = {selectedCell.reconstructed.toFixed(3)}
            </div>
            <div
              className={`mt-1 text-sm ${selectedCell.error < 0.5 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}
            >
              Error: {selectedCell.error.toFixed(3)} (
              {((selectedCell.error / Math.abs(selectedCell.value)) * 100).toFixed(1)}%)
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-3">
        {selectedBlockData && (
          <div>
            <label className="text-ink-muted flex items-center justify-between text-sm">
              <span>
                Block {selectedBlock + 1} Scale (FP8): {selectedBlockData.scale.toFixed(2)}
              </span>
              <button
                onClick={() => {
                  setBlockScales(globalOptimalScales.blockScales)
                  setTensorScale(globalOptimalScales.tensorScale)
                }}
                className="border-rule bg-surface text-ink-strong hover:border-rule-strong rounded-sm border px-2 py-0.5 text-xs transition-colors"
              >
                Reset to Optimal
              </button>
            </label>
            <div className="text-xs text-blue-700 dark:text-blue-400">
              Optimal: {selectedBlockData.optimalScale}
            </div>
            <div className="relative">
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.1"
                value={selectedBlockData.scale}
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
                className="pointer-events-none absolute bottom-0 top-0 w-1 bg-blue-600 dark:bg-blue-400"
                style={{
                  left: `${((selectedBlockData.optimalScale - 0.5) / (5 - 0.5)) * 100}%`,
                  transform: 'translateX(-50%)',
                }}
                title={`Optimal: ${selectedBlockData.optimalScale}`}
              />
            </div>
          </div>
        )}

        <div className="mt-6">
          <label className="text-ink-muted text-sm">
            Tensor Scale (FP32): {tensorScale.toFixed(2)} - affects all blocks
          </label>
          <div className="text-xs text-green-700 dark:text-green-400">
            Optimal: {globalOptimalScales.tensorScale}
          </div>
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
              className="pointer-events-none absolute bottom-0 top-0 w-1 bg-green-600 dark:bg-green-400"
              style={{
                left: `${((globalOptimalScales.tensorScale - 0.1) / (2 - 0.1)) * 100}%`,
                transform: 'translateX(-50%)',
              }}
              title={`Optimal: ${globalOptimalScales.tensorScale}`}
            />
          </div>
        </div>

        <div className="bg-surface text-ink-faint mt-3 rounded-sm p-2 text-xs">
          💡 Block scales handle local variations, tensor scale normalizes globally
        </div>

        <div className="bg-surface mt-3 rounded-sm p-3">
          <div className="text-ink-muted text-xs">
            <span className="text-ink-strong font-mono">
              Total Error: {allErrors.reduce((a, b) => a + b, 0).toFixed(2)}
            </span>
            <span className="text-ink-faint mx-2">|</span>
            <span className="text-ink-strong font-mono">
              Avg: {(allErrors.reduce((a, b) => a + b, 0) / allErrors.length).toFixed(3)}
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
    <div className="border-rule bg-sunken mb-6 rounded-lg border p-4">
      <h3 className="text-ink-strong mb-3 text-lg font-bold">NVFP4 in Matrix Multiplication</h3>
      <div className="bg-raised rounded-sm p-4">
        <div className="text-ink-muted space-y-3 text-sm">
          <div className="bg-surface rounded-sm p-3 font-mono text-xs">
            {/* eslint-disable-next-line */}
            <div className="text-green-700 dark:text-green-400">
              // Weight matrix (e.g., 4096×4096)
            </div>
            <div>W_fp16: 32 MB → W_fp4: 8 MB + 1 MB scales</div>
            {/* eslint-disable-next-line */}
            <div className="text-blue-700 dark:text-blue-400">// 3.6× compression</div>
          </div>

          <p>The GPU&apos;s Blackwell Tensor Cores handle dequantization in hardware:</p>
          <div className="bg-surface rounded-sm p-2 font-mono text-sm">
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
    <div className="border-rule bg-sunken rounded-lg border p-4">
      <h3 className="text-ink-strong mb-3 text-lg font-bold">RTX 5090 Performance Impact</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-raised rounded-sm p-3">
          <h4 className="text-ink-muted mb-2 text-sm font-bold">Compute</h4>
          <div className="font-mono text-2xl text-yellow-700 dark:text-yellow-400">
            {(gpuSpecs.fp4Tflops / gpuSpecs.fp16Tflops).toFixed(1)}×
          </div>
          <div className="text-ink-faint text-xs">FP4 vs FP16 TOPS</div>
        </div>

        <div className="bg-raised rounded-sm p-3">
          <h4 className="text-ink-muted mb-2 text-sm font-bold">Memory</h4>
          <div className="font-mono text-2xl text-green-700 dark:text-green-400">
            {(fp16MemoryGB / fp4MemoryGB).toFixed(1)}×
          </div>
          <div className="text-ink-faint text-xs">model size reduction</div>
        </div>
      </div>

      <div className="text-ink-muted mt-4 text-sm">
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
