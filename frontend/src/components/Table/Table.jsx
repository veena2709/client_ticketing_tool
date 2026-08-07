import { Link } from "react-router-dom";

const Table = ({ columns, data }) => {
  return (
    <table className="min-w-full divide-y divide-slate-800 text-sm">
      <thead className="bg-slate-800/70 text-left text-slate-300">
        <tr>
          {columns.map((column) => (
            <th key={column.key} className="px-4 py-3">
              {column.label}
            </th>
          ))}
        </tr>
      </thead>

      <tbody className="divide-y divide-slate-800">
        {data.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length}
              className="text-center py-5 text-slate-400"
            >
              No Data Found
            </td>
          </tr>
        ) : (
          data.map((row) => (
            <tr key={row.id} className="hover:bg-slate-800/60">
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3">
                  {column.render ? (
                    column.render(row)
                  ) : (
                    row[column.key]
                  )}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};

export default Table;