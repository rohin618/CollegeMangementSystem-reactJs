import { useMemo, useState } from "react";

interface Column {
  label: string;
  key: string;
  sortable?: boolean;
    className?:string;
  render?: (row: any) => React.ReactNode;
}

interface Props {
  columns: Column[];

  data: any[];
  fixed?: boolean;
  pagination?: boolean;
  pageSize?: number;
  search?: boolean; // ✅ NEW (optional search)
  isLoading?: boolean; // ✅ NEW (optional search)
  noDataFound?: React.ReactNode; // ✅ custom empty UI
  loaderText?: React.ReactNode; // ✅ optional custom loader
}

export const DataTable = ({
  columns,
  data,
  fixed = false,
  pagination = true,
  pageSize,
  isLoading = false,
  search = true, // ✅ default ON
  noDataFound = "No records found",
  loaderText = "Loading...",
}: Props) => {
  const [searchText, setSearchText] = useState("");
  const [sortKey, setSortKey] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  /* 🔍 SEARCH (OPTIONAL) */
  const filteredData = useMemo(() => {
    if (!search || !searchText) return data;

    return data.filter(row =>
      Object.values(row)
        .join(" ")
        .toLowerCase()
        .includes(searchText.toLowerCase())
    );
  }, [search, searchText, data]);

  /* 🔃 SORT */
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      if (a[sortKey] > b[sortKey]) return sortDir === "asc" ? 1 : -1;
      if (a[sortKey] < b[sortKey]) return sortDir === "asc" ? -1 : 1;
      return 0;
    });
  }, [filteredData, sortKey, sortDir]);

  /* 📄 PAGINATION (OPTIONAL) */
  const effectivePageSize = pagination ? pageSize ?? 10 : sortedData?.length;

  const totalPages = pagination
    ? Math.ceil(sortedData.length / effectivePageSize) || 1
    : 1;

  const tableData = pagination
    ? sortedData.slice(
      (page - 1) * effectivePageSize,
      page * effectivePageSize
    )
    : sortedData;

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="h-100">
      <div className=" d-flex flex-column">
        {/* 🔍 Search (ONLY IF ENABLED) */}
        {search && (
          <input
            className="form-control mb-3"
            placeholder="Search..."
            value={searchText}
            onChange={e => {
              setSearchText(e.target.value);
              setPage(1);
            }}
          />
        )}

        {/* 📊 Table */}
        <div
          className={fixed ? "table-responsive flex-grow-1" : ""}
          style={
            fixed
              ? {
                overflowY: "auto",
                maxHeight: "calc(100vh - 260px)",
              }
              : undefined
          }
        >
          <table className="table table-modern table-hover table-sm">
            <thead className="table-light">
              <tr>
                {columns.map(col => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    style={{
                      cursor: col.sortable ? "pointer" : "default",
                      position: fixed ? "sticky" : "static",
                      top: fixed ? 0 : undefined,
                      zIndex: fixed ? 2 : undefined,
                      background: fixed ? "#fff" : undefined,
                    }}
                    className={col?.className}
                  >
                    {col.label}
                    {sortKey === col.key && (
                      <span className="ms-1">
                        {sortDir === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>

              {isLoading && (
                <tr>
                  <td colSpan={columns.length} className="text-center py-4">
                    <span className="text-muted">{loaderText}</span>
                  </td>
                </tr>
              )}
              {/* {tableData.length ? (
                tableData.map((row, i) => (
                  <tr key={i}>
                    {columns.map(col => (
                      <td key={col.key}>
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : !isLoading && (
                <tr>
                  <td colSpan={columns.length} className="text-center">
                    No records found
                  </td>
                </tr>
              )} */}
              {/* 📄 Data */}
              {!isLoading && tableData?.length > 0 &&
                tableData.map((row, i) => (
                  <tr key={i}>
                    {columns.map(col => (
                      <td key={col.key} style={{ whiteSpace: "nowrap" }}>
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}

              {/* 🚫 No Data */}
              {!isLoading && tableData?.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="text-center py-4">
                    {noDataFound}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 📄 Pagination Footer (ONLY IF ENABLED) */}
        {pagination && (
          <div className="d-flex justify-content-between align-items-center mt-2">
            <span>
              Page {page} of {totalPages}
            </span>
            <div>
              <button
                className="btn btn-sm btn-secondary me-2"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Prev
              </button>
              <button
                className="btn btn-sm btn-secondary"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
