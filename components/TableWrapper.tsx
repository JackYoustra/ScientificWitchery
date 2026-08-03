import { ReactNode } from 'react'

const TableWrapper = ({ children }: { children?: ReactNode }) => {
  // `table-wrapper` is not a utility class — it is the hook globals.css uses to
  // let a table run past the reading measure into the column's slack.
  return (
    <div className="table-wrapper w-full overflow-x-auto">
      <table>{children}</table>
    </div>
  )
}

export default TableWrapper
