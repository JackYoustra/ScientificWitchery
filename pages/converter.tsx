// Convert jomini save from a call to the rust crate to JSON
// The title is at the top, so as to maximize the space for the input and output boxes
// the UI has two text boxes, one for input and one for output
// they are side by side
// the input box has a button to submit the input
// the output box has a button to copy the output

import { useRef, useState } from 'react'
import { parse_jomini } from 'rust-wasm'

export default function Converter() {
  const [output, setOutput] = useState('')
  const inputRef = useRef(null)

  const handleButtonClick = () => {
    const input = inputRef.current.value
    console.log(parse_jomini)
    const result = parse_jomini(input)
    console.log(result)
    setOutput(result)
  }

  return (
    <>
      <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
        Pdx Converter
      </h1>
      <h2>
        Thanks
        <a className="m-1 font-medium text-blue-600 dark:text-blue-500 hover:underline" href="https://docs.rs/jomini/latest/jomini/">Jomini Rust</a>
        by
        <a className="m-1 font-medium text-blue-600 dark:text-blue-500 hover:underline" href="https://nickb.dev/">Nick Babcock</a>
      </h2>
      <div className="h-full w-full">
        <div className="grid h-full grid-cols-2 gap-4">
          <textarea
            className="focus:shadow-outline-blue h-full w-full flex-grow grow appearance-none rounded-md border border-gray-300 bg-white px-4 py-3 pr-12 text-base leading-6 text-gray-900 placeholder-gray-500 transition duration-150 ease-in-out focus:border-blue-300 focus:outline-none sm:text-sm sm:leading-5"
            placeholder="Input"
            ref={inputRef}
          />
          <textarea
            readOnly
            className="focus:shadow-outline-blue h-full w-full flex-grow grow appearance-none rounded-md border border-gray-300 bg-white px-4 py-3 pr-12 text-base leading-6 text-gray-900 placeholder-gray-500 transition duration-150 ease-in-out focus:border-blue-300 focus:outline-none sm:text-sm sm:leading-5"
            placeholder="Output"
            value={output}
          />
          <button
            type="button"
            className="focus:shadow-outline-blue items-center rounded-md border border-transparent bg-blue-600 px-4 text-sm font-medium leading-5 text-white transition duration-150 ease-in-out hover:bg-blue-500 focus:border-blue-700 focus:outline-none"
            onClick={handleButtonClick}
          >
            Submit
          </button>
          <button
            type="button"
            className="focus:shadow-outline-blue items-center rounded-md border border-transparent bg-blue-600 px-4 text-sm font-medium leading-5 text-white transition duration-150 ease-in-out hover:bg-blue-500 focus:border-blue-700 focus:outline-none"
          >
            Copy
          </button>
        </div>
      </div>
    </>
  )
}
