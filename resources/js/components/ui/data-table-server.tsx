import React, {
  memo,
  useMemo,
  useState,
  type ReactElement,
} from "react";

import { Button } from "../ui/button";
import { ArrowBigLeft, ArrowBigRight } from "lucide-react";


/* -------------------- Types -------------------- */
type Header = {
  name: string;
  position?: "left" | "center" | "right";
};

export interface PaginatedSearchTableProps<T = unknown> {
  items: T[];
  headers: Header[];
  renderRow: (item: T, index: number) => React.ReactNode;
  searchPlaceholder?: string;
  itemsPerPage?: number;
  searchBy?: (item: T) => string;
  onRefresh?: () => void;
  isLoading?: boolean;
  emptyText?: string;

  /** ==== NEW: Server-side pagination props (Laravel paginate) ==== */
  currentPage?: number; // e.g. $paginator->currentPage()
  nextPageUrl?: string | null; // e.g. $paginator->nextPageUrl()
  prevPageUrl?: string | null; // e.g. $paginator->previousPageUrl()
  total?: number; // e.g. $paginator->total()
  onPageChange?: (url: string | null) => void; // where you call router.visit(url)
}

const DataTable = memo(function DataTable({
  headers,
  children,
}: {
  headers: Header[];
  children: React.ReactNode;
}) {
  return (
    <div className="relative rounded-lg ">
      <div className="flex items-center justify-between flex-column md:flex-row flex-wrap space-y-4 md:space-y-0 rounded-lg">
        <table className="w-full text-sm text-left rtl:text-right text-gray-600 rounded-lg">
          <thead className="text-xs text-gray-600 uppercase border-b border-gray-100">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  scope="col"
                  className={`poppins-bold text-sm px-6 py-4 ${
                    index === 0 ? "rounded-tl-md" : ""
                  } ${index === headers.length - 1 ? "rounded-tr-md" : ""}`}
                >
                  <span
                    className={`flex items-center ${
                      header.position === "center"
                        ? "justify-center"
                        : header.position === "right"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {header.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="**:whitespace-normal **:break-word">{children}</tbody>
        </table>
      </div>
    </div>
  );
});

/* -------------------- Main Component -------------------- */
function PaginatedSearchTableInner<T = unknown>({
  items,
  headers,
  renderRow,
  itemsPerPage = 10,
  isLoading = false,
  emptyText = "No Available Data",
  currentPage,
  nextPageUrl,
  prevPageUrl,
  total=0,
  onPageChange,
}: PaginatedSearchTableProps<T>) {
  const [localPage, setLocalPage] = useState<number>(1);

  const isServerPaginated =
    typeof currentPage === "number" && typeof total === "number";
  const page = isServerPaginated ? currentPage! : localPage;
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / itemsPerPage)),
    [total, itemsPerPage]
  );
  const count = useMemo(() => {
    if (total === 0) {
      return { from: 0, to: 0, total: 0 };
    }

    const from = (page - 1) * itemsPerPage + 1;
    const to = Math.min(page * itemsPerPage, total);

    return { from, to, total: total };
  }, [page, itemsPerPage, total]);

  const isPrevDisabled = isServerPaginated
    ? !prevPageUrl
    : page <= 1;

  const isNextDisabled = isServerPaginated
    ? !nextPageUrl
    : page >= totalPages;

  const nextPage = () => {
    if (isNextDisabled) return;

    if (isServerPaginated) {
      if (onPageChange && nextPageUrl) {
        onPageChange(nextPageUrl);
      }
    } else {
      setLocalPage((p) => Math.min(p + 1, totalPages));
    }
  };

  const prevPage = () => {
    if (isPrevDisabled) return;

    if (isServerPaginated) {
      if (onPageChange && prevPageUrl) {
        onPageChange(prevPageUrl);
      }
    } else {
      setLocalPage((p) => Math.max(p - 1, 1));
    }
  };

  return (
    <div className="w-full rounded-lg text-gray-900">
      <DataTable headers={headers}>
        {isLoading ? (
          <tr>
            <td colSpan={headers.length} className="text-center py-6">
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-500 border-t-transparent"></div>
                <span className="ml-3 text-gray-600">Loading...</span>
              </div>
            </td>
          </tr>
        ) : items.length > 0 ? (
          items.map((item, index) => (
            <React.Fragment key={index}>
              {renderRow(item, index)}
            </React.Fragment>
          ))
        ) : (
          <tr>
            <td
              colSpan={headers.length}
              className="text-center px-6 py-6 text-gray-800 border-b"
            >
              {emptyText}
            </td>
          </tr>
        )}
      </DataTable>

      {/* Pagination */}
      <div className="w-full flex justify-between pt-5 px-2 poppins-semibold">
        <div>
          <span className="text-sm text-[#00aeef]">
            Showing <span className="text-teal-700">{count.from}</span> to{" "}
            <span className="text-teal-700">{count.to}</span> of{" "}
            <span className="text-teal-700">{count.total}</span> Entries
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#00aeef]">
            Page {page} / {totalPages}
          </span>

          <Button
            onClick={prevPage}
            disabled={isPrevDisabled}
            className={`flex items-center justify-center px-3 h-8 text-sm font-medium border rounded-lg hover:bg-teal-800 ${
              isPrevDisabled
                ? "text-[#00aeef] bg-gray-200 cursor-not-allowed border-gray-50"
                : "text-gray-50 bg-[#00aeef] hover:bg-gray-100 hover:text-gray-700 border-gray-50"
            }`}
            type="button"
          >
            <ArrowBigLeft />
            Prev
          </Button>
          <Button
            onClick={nextPage}
            disabled={isNextDisabled}
            className={`flex items-center justify-center px-3 h-8 text-sm font-medium border rounded-lg hover:bg-teal-800 ${
              isNextDisabled
                ? "text-[#00aeef] bg-gray-200 cursor-not-allowed border-gray-50"
                : "text-gray-50 bg-[#00aeef] hover:bg-gray-100 hover:text-gray-700 border-gray-50"
            }`}
            type="button"
          >
            Next
            <ArrowBigRight />
          </Button>
        </div>
      </div>
    </div>
  );
}

function PaginatedSearchTable<T = unknown>(
  props: PaginatedSearchTableProps<T>
): ReactElement {
  return <PaginatedSearchTableInner {...props} />;
}

const PaginatedSearchTableMemo = memo(PaginatedSearchTable) as <T = unknown>(
  props: PaginatedSearchTableProps<T>
) => ReactElement;

export default PaginatedSearchTableMemo;
export type { Header };
