import React, {
  memo,
  useCallback,
  useMemo,
  useState,
  type ReactElement,
} from "react";
import { Input } from "@/components/ui/input";
import { Button } from "../ui/button";
import { RefreshCcw, Search, ArrowBigLeft, ArrowBigRight } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

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
  hasSearch?: boolean;
}

/* -------------------- Type Guards -------------------- */
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const hasStringTitle = (v: unknown): v is { title: string } =>
  isRecord(v) && typeof v.title === "string";

/* -------------------- Table Shell -------------------- */
const DataTable = memo(function DataTable({
  headers,
  children,
}: {
  headers: Header[];
  children: React.ReactNode;
}) {
  return (
    <div className="relative my-2 rounded-lg ">
      <div className="flex items-center justify-between flex-column md:flex-row flex-wrap space-y-4 md:space-y-0 rounded-lg">
        <table className="w-full text-sm text-left rtl:text-right text-gray-600 rounded-lg">
          <thead className="text-xs text-gray-50 uppercase bg-teal-600/90">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  scope="col"
                  className={`poppins-bold text-sm px-6 py-4 ${index === 0 ? "rounded-tl-md" : ""
                    } ${index === headers.length - 1 ? "rounded-tr-md" : ""}`}
                >
                  <span
                    className={`flex items-center ${header.position === "center"
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
          <tbody>{children}</tbody>
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
  searchPlaceholder = "Search...",
  itemsPerPage = 10,
  searchBy,
  onRefresh,
  isLoading = false,
  hasSearch = true,
  emptyText = "No Available Data",
}: PaginatedSearchTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const getSearchText = useCallback(
    (item: T) => {
      if (searchBy) return searchBy(item);
      if (typeof item === "string") return item;
      if (hasStringTitle(item)) return item.title;

      try {
        return isRecord(item) ? JSON.stringify(item) : String(item);
      } catch {
        return String(item);
      }
    },
    [searchBy]
  );

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => getSearchText(it).toLowerCase().includes(q));
  }, [items, searchTerm, getSearchText]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / itemsPerPage)),
    [filtered.length, itemsPerPage]
  );

  const page = useMemo(
    () => Math.min(Math.max(1, currentPage), totalPages),
    [currentPage, totalPages]
  );

  const indexOfLast = page * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;

  const displayData = useMemo(
    () => filtered.slice(indexOfFirst, indexOfLast),
    [filtered, indexOfFirst, indexOfLast]
  );

  const count = useMemo(
    () => ({
      from: filtered.length === 0 ? 0 : indexOfFirst + 1,
      to: Math.min(indexOfLast, filtered.length),
      total: filtered.length,
    }),
    [filtered.length, indexOfFirst, indexOfLast]
  );

  const isPrevDisabled = page === 1;
  const isNextDisabled = page >= totalPages;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const nextPage = () => {
    if (!isNextDisabled) setCurrentPage(page + 1);
  };
  const prevPage = () => {
    if (!isPrevDisabled) setCurrentPage(page - 1);
  };

  return (
    <div className="w-full rounded-lg text-gray-900 px-6 pb-6">
      {hasSearch && (
        <div className="w-full flex items-center mb-4 gap-1 z-50 pt-6">
          <div className="flex relative items-center">
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={handleSearch}
              className="min-w-[250px] h-10 border-gray-500 shadow-none ps-8"
            />

            <Search className="absolute left-2.5 text-gray-500" size={16} />

          </div>

          {onRefresh && (
            <div>
              <Button
                onClick={onRefresh}
                className="px-4 bg-teal-600 h-full text-gray-50 poppins-semibold"
                type="button"
                disabled={isLoading}
              >
                {isLoading ? <Spinner className="mr-2" /> : <RefreshCcw />}
                Refresh
              </Button>
            </div>
          )}
        </div>
      )}


      {/* Table */}
      <DataTable headers={headers}>
        {isLoading ? (
          <tr>
            <td colSpan={headers.length} className="text-center py-6">
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-500 border-t-transparent"></div>
                <span className="ml-3 text-gray-600">Loading...</span>
              </div>
            </td>
          </tr>
        ) : displayData.length > 0 ? (
          displayData.map((item, index) => (
            <React.Fragment key={index}>
              {renderRow(item, index)}
            </React.Fragment>
          ))
        ) : (
          <tr>
            <td colSpan={headers.length} className="text-center px-6 py-6 text-gray-800 border-b">
              {emptyText}
            </td>
          </tr>
        )}
      </DataTable>

      {/* Pagination */}
      <div className="w-full flex justify-between pt-5 px-2 poppins-semibold">
        <div>
          <span className="text-sm text-teal-600">
            Showing <span className="text-teal-700">{count.from}</span> to{" "}
            <span className="text-teal-700">{count.to}</span> of{" "}
            <span className="text-teal-700">{count.total}</span> Entries
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Optional: show current page / total */}
          <span className="text-sm text-teal-600">
            Page {page} / {totalPages}
          </span>

          <Button
            onClick={prevPage}
            disabled={isPrevDisabled}
            className={`flex items-center justify-center px-3 h-8 text-sm font-medium border rounded-lg hover:bg-teal-800 ${isPrevDisabled
              ? "text-gray-600 bg-gray-200 cursor-not-allowed border-gray-50"
              : "text-gray-50 bg-teal-600 hover:bg-gray-100 hover:text-gray-700 border-gray-50"
              }`}
            type="button"
          >
            <ArrowBigLeft />
            Prev
          </Button>
          <Button
            onClick={nextPage}
            disabled={isNextDisabled}
            className={`flex items-center justify-center px-3 h-8 text-sm font-medium border rounded-lg hover:bg-teal-800 ${isNextDisabled
              ? "text-gray-600 bg-gray-200 cursor-not-allowed border-gray-50"
              : "text-gray-50 bg-teal-600 hover:bg-gray-100 hover:text-gray-700 border-gray-50"
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

const PaginatedSearchTableMemo = memo(PaginatedSearchTable) as <
  T = unknown
>(
  props: PaginatedSearchTableProps<T>
) => ReactElement;

export default PaginatedSearchTableMemo;
export type { Header };
