import TableBody from "./TableBody"
import TableHead from "./TableHead"

const StatusTable = () => (
  <div className="absolute top-[0px] left-[0px] z-[50]">
    <div className="p-[20px_10px] md:p-[20px] md:text-lg text-[12px]">
      <table className="status">
        <TableHead />
        <TableBody />
      </table>
    </div>
  </div>
)

export default StatusTable
