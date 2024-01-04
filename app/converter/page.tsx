'use client'

// Convert jomini save from a call to the rust crate to JSON
// The title is at the top, so as to maximize the space for the input and output boxes
// the UI has two text boxes, one for input and one for output
// they are side by side
// the input box has a button to submit the input
// the output box has a button to copy the output

import { ChangeEventHandler, LegacyRef, MouseEventHandler, MutableRefObject, useCallback, useEffect, useRef, useState } from 'react'
import dynamic from "next/dynamic";


const abeLincoln = `dna_abraham_lincoln = {
  portrait_info = {
  genes={         
      hair_color={ 3 248 3 248 }
      skin_color={ 90 30 90 30 }
      eye_color={ 141 16 141 16 }
      gene_cheek_fat={ "cheek_fat" 155 "cheek_fat" 139 }
      gene_cheek_forward={ "cheek_forward" 196 "cheek_forward" 129 }
      gene_cheek_height={ "cheek_height" 133 "cheek_height" 133 }
      gene_cheek_prom={ "cheek_prom" 82 "cheek_prom" 121 }
      gene_cheek_width={ "cheek_width" 129 "cheek_width" 129 }
      gene_chin_forward={ "chin_forward" 84 "chin_forward" 146 }
      gene_chin_height={ "chin_height" 159 "chin_height" 159 }
      gene_chin_width={ "chin_width" 163 "chin_width" 163 }
      gene_ear_angle={ "ear_angle" 178 "ear_angle" 115 }
      gene_ear_inner_shape={ "ear_inner_shape" 234 "ear_inner_shape" 122 }
      gene_ear_lower_bend={ "ear_lower_bend" 189 "ear_lower_bend" 98 }
      gene_ear_out={ "ear_out" 209 "ear_out" 131 }
      gene_ear_size={ "ear_size" 255 "ear_size" 130 }
      gene_ear_upper_bend={ "ear_upper_bend" 155 "ear_upper_bend" 137 }
      gene_eye_angle={ "eye_angle" 124 "eye_angle" 124 }
      gene_eye_depth={ "eye_depth" 76 "eye_depth" 76 }
      gene_eye_distance={ "eye_distance" 106 "eye_distance" 106 }
      gene_eye_height={ "eye_height" 131 "eye_height" 131 }
      gene_eye_shut={ "eye_shut" 140 "eye_shut" 140 }
      gene_eye_corner_def={ "eye_corner_def" 122 "eye_corner_def" 122 }
      gene_eye_corner_depth_min={ "eye_corner_depth_min" 135 "eye_corner_depth_min" 135 }
      gene_eye_fold_droop={ "eye_fold_droop" 122 "eye_fold_droop" 122 }
      gene_eye_fold_shape={ "eye_fold_shape" 118 "eye_fold_shape" 118 }
      gene_eye_size={ "eye_size" 146 "eye_size" 146 }
      gene_eye_upper_lid_size={ "eye_upper_lid_size" 151 "eye_upper_lid_size" 151 }
      gene_forehead_angle={ "forehead_angle" 132 "forehead_angle" 132 }
      gene_forehead_brow_curve={ "forehead_brow_curve" 133 "forehead_brow_curve" 133 }
      gene_forehead_brow_forward={ "forehead_brow_forward" 209 "forehead_brow_forward" 121 }
      gene_forehead_brow_height={ "forehead_brow_height" 96 "forehead_brow_height" 96 }
      gene_forehead_brow_inner_height={ "forehead_brow_inner_height" 128 "forehead_brow_inner_height" 128 }
      gene_forehead_brow_outer_height={ "forehead_brow_outer_height" 139 "forehead_brow_outer_height" 139 }
      gene_forehead_brow_width={ "forehead_brow_width" 127 "forehead_brow_width" 127 }
      gene_forehead_height={ "forehead_height" 109 "forehead_height" 109 }
      gene_forehead_roundness={ "forehead_roundness" 140 "forehead_roundness" 140 }
      gene_forehead_width={ "forehead_width" 211 "forehead_width" 136 }
      gene_head_height={ "head_height" 207 "head_height" 140 }
      gene_head_profile={ "head_profile" 121 "head_profile" 121 }
      gene_head_top_height={ "head_top_height" 127 "head_top_height" 127 }
      gene_head_top_width={ "head_top_width" 191 "head_top_width" 136 }
      gene_head_width={ "head_width" 162 "head_width" 162 }
      gene_jaw_angle={ "jaw_angle" 65 "jaw_angle" 65 }
      gene_jaw_def={ "jaw_def" 134 "jaw_def" 134 }
      gene_jaw_forward={ "jaw_forward" 129 "jaw_forward" 129 }
      gene_jaw_height={ "jaw_height" 113 "jaw_height" 116 }
      gene_jaw_width={ "jaw_width" 68 "jaw_width" 139 }
      gene_mouth_corner_height={ "mouth_corner_height" 124 "mouth_corner_height" 124 }
      gene_mouth_forward={ "mouth_forward" 117 "mouth_forward" 117 }
      gene_mouth_height={ "mouth_height" 129 "mouth_height" 129 }
      gene_mouth_lower_lip_def={ "mouth_lower_lip_def" 127 "mouth_lower_lip_def" 127 }
      gene_mouth_lower_lip_full={ "mouth_lower_lip_full" 121 "mouth_lower_lip_full" 31 }
      gene_mouth_lower_lip_pads={ "mouth_lower_lip_pads" 68 "mouth_lower_lip_pads" 177 }
      gene_mouth_lower_lip_size={ "mouth_lower_lip_size" 132 "mouth_lower_lip_size" 132 }
      gene_mouth_lower_lip_width={ "mouth_lower_lip_width" 198 "mouth_lower_lip_width" 118 }
      gene_mouth_open={ "mouth_open" 2 "mouth_open" 194 }
      gene_mouth_philtrum_curve={ "mouth_philtrum_curve" 70 "mouth_philtrum_curve" 70 }
      gene_mouth_philtrum_def={ "mouth_philtrum_def" 67 "mouth_philtrum_def" 67 }
      gene_mouth_philtrum_width={ "mouth_philtrum_width" 124 "mouth_philtrum_width" 124 }
      gene_mouth_upper_lip_curve={ "mouth_upper_lip_curve" 53 "mouth_upper_lip_curve" 130 }
      gene_mouth_upper_lip_def={ "mouth_upper_lip_def" 255 "mouth_upper_lip_def" 83 }
      gene_mouth_upper_lip_full={ "mouth_upper_lip_full" 95 "mouth_upper_lip_full" 180 }
      gene_mouth_upper_lip_width={ "mouth_upper_lip_width" 61 "mouth_upper_lip_width" 130 }
      gene_mouth_upper_lip_size={ "mouth_upper_lip_size" 177 "mouth_upper_lip_size" 177 }
      gene_mouth_width={ "mouth_width" 201 "mouth_width" 113 }
      gene_nose_curve={ "nose_curve" 197 "nose_curve" 121 }
      gene_nose_forward={ "nose_forward" 186 "nose_forward" 120 }
      gene_nose_hawk={ "nose_hawk" 150 "nose_hawk" 122 }
      gene_nose_height={ "nose_height" 85 "nose_height" 135 }
      gene_nose_length={ "nose_length" 131 "nose_length" 131 }
      gene_nose_nostril_angle={ "nose_nostril_angle" 122 "nose_nostril_angle" 122 }
      gene_nose_nostril_height={ "nose_nostril_height" 125 "nose_nostril_height" 125 }
      gene_nose_nostril_width={ "nose_nostril_width" 189 "nose_nostril_width" 165 }
      gene_nose_ridge_angle={ "nose_ridge_angle" 75 "nose_ridge_angle" 136 }
      gene_nose_ridge_def={ "nose_ridge_def" 113 "nose_ridge_def" 63 }
      gene_nose_ridge_def_min={ "nose_ridge_def_min" 126 "nose_ridge_def_min" 126 }
      gene_nose_ridge_width={ "nose_ridge_width" 193 "nose_ridge_width" 193 }
      gene_nose_size={ "nose_size" 58 "nose_size" 124 }
      gene_nose_tip_angle={ "nose_tip_angle" 116 "nose_tip_angle" 121 }
      gene_nose_tip_forward={ "nose_tip_forward" 247 "nose_tip_forward" 173 }
      gene_nose_tip_width={ "nose_tip_width" 216 "nose_tip_width" 117 }
      gene_neck_length={ "neck_length" 136 "neck_length" 136 }
      gene_neck_width={ "neck_width" 139 "neck_width" 139 }
      gene_bs_body_type={ "body_fat_head_fat_low" 63 "body_fat_head_fat_low" 63 }
      gene_height={ "normal_height" 228 "normal_height" 114 }
      gene_age={ "old_1" 127 "old_1" 127 }
      gene_old_ears={ "old_ears_01" 127 "old_ears_01" 127 }
      gene_old_eyes={ "old_eyes_02" 255 "old_eyes_02" 255 }
      gene_old_forehead={ "old_forehead_02" 255 "old_forehead_02" 255 }
      gene_old_mouth={ "old_mouth_02" 255 "old_mouth_02" 255 }
      gene_old_nose={ "old_nose_01" 127 "old_nose_01" 127 }
      gene_complexion={ "complexion_01" 0 "complexion_01" 0 }
      gene_stubble={ "stubble_low" 127 "stubble_low" 127 }
      gene_crowfeet={ "crowfeet_03" 25 "crowfeet_03" 25 }
      gene_face_dacals={ "face_dacal_01" 255 "face_dacal_01" 255 }
      gene_frown={ "frown_02" 1 "frown_02" 1 }
      gene_surprise={ "surprise_02" 3 "surprise_02" 3 }
      gene_eyebrows_shape={ "far_spacing_lower_thickness" 255 "far_spacing_lower_thickness" 255 }
      gene_eyebrows_fullness={ "layer_2_low_thickness" 154 "layer_2_low_thickness" 154 }
      hairstyles={ "historical_hairstyles" 0 "european_hairstyles" 214 }
      beards={ "european_beards" 99 "european_beards" 25 }
      mustaches={ "no_mustache" 214 "no_mustache" 214 }
      props={ "no_prop" 0 "no_prop" 0 }
      eye_accessory={ "normal_eyes" 0 "normal_eyes" 0 }
      eye_lashes_accessory={ "normal_eyelashes" 0 "normal_eyelashes" 0 }
      teeth_accessory={ "normal_teeth" 0 "normal_teeth" 0 }
      outfits={ "no_outfit" 0 "all_outfits" 0 }
      coats={ "american_coats" 255 "all_coats" 0 }
      civilian_coats={ "no_civilian_coat" 221 "all_civilian_coats" 0 }
      belts={ "no_belt" 0 "all_belts" 0 }
      waistcoats={ "no_waistcoat" 0 "all_waistcoats" 0 }
      legwear={ "european_legwear" 0 "all_legwear" 0 }
    }
  }
  enabled=yes
}
`

// Wasm hard! https://github.com/vercel/next.js/issues/53163
export default dynamic(
  async function Converter() {
    const { parse_jomini } = await import('rust-wasm')
    return function ConverterLoaded() {
      const [output, setOutput] = useState('')
      const [checked, setChecked] = useState(true)
      const inputRef = useRef<HTMLTextAreaElement | null>(null)

      const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback(() => {
        setChecked(!checked)
      }, [checked])

      const handleButtonClick: ChangeEventHandler<HTMLTextAreaElement> & MouseEventHandler<HTMLButtonElement> & (() => void) = useCallback(() => {
        if (!inputRef.current?.value) {
          return
        }
        const input = inputRef.current.value
        try {
          const result = parse_jomini(input)
          setOutput(result)
        } catch (e) {
          setOutput(e)
        }
      }, [])

      // load abe first time, only once
      useEffect(() => {
        handleButtonClick()
      }, [])

      return (
        <>
          <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
            Pdx Converter
          </h1>
          <h2>
            To translate all of your Clausewitz engine game files to a more convenient format. Let me
            know if you'd like other options (such as duplicate value handling).
          </h2>
          <h2>
            Thanks
            <a
              className="m-1 font-medium text-blue-600 hover:underline dark:text-blue-500"
              href="https://docs.rs/jomini/latest/jomini/"
            >
              Jomini Rust
            </a>
            by
            <a
              className="m-1 font-medium text-blue-600 hover:underline dark:text-blue-500"
              href="https://nickb.dev/"
            >
              Nick Babcock
            </a>
            . ⚡️ Fast Refresh ⚡️
            <input type="checkbox" checked={checked} onChange={handleChange} />
          </h2>
          <div className="grid h-full grow grid-cols-2 grid-rows-[minmax(0px,_1fr)_3rem] gap-4">
            <textarea
              defaultValue={abeLincoln}
              className="focus:shadow-outline-blue h-full w-full flex-grow grow resize-none appearance-none rounded-md border border-gray-300 bg-white px-4 py-3 pr-12 text-base leading-6 text-gray-900 placeholder-gray-500 transition duration-150 ease-in-out focus:border-blue-300 focus:outline-none sm:text-sm sm:leading-5"
              placeholder="Input"
              ref={inputRef}
              onChange={checked ? handleButtonClick : () => {}}
            />
            <textarea
              readOnly
              className="focus:shadow-outline-blue h-full w-full flex-grow grow resize-none appearance-none rounded-md border border-gray-300 bg-white px-4 py-3 pr-12 text-base leading-6 text-gray-900 placeholder-gray-500 transition duration-150 ease-in-out focus:border-blue-300 focus:outline-none sm:text-sm sm:leading-5"
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
        </>
      )
    }
  },
  { 
    ssr: false,
    loading: () => <p>Loading WASM...</p>,
  },
);
