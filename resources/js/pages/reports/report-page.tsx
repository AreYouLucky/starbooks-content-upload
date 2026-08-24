import ExcelJS from 'exceljs';
import {
    CalendarRange,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Eye,
    FileChartColumnIncreasing,
    FileDown,
    FileSpreadsheet,
    LoaderCircle,
    Rows3,
} from 'lucide-react';
import type { JSX, ReactNode } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { quarters } from '@/lib/default';
import { generateYears } from '@/pages/batches/partials/defaults';
import type { BreadcrumbItem } from '@/types';

type Reviewer = {
    id: number;
    full_name: string;
};

type ReportColumn = {
    key: string;
    label: string;
};

type ReportRow = Record<string, string | number | boolean | null>;

type ReportData = {
    title: string;
    columns: ReportColumn[];
    rows: ReportRow[];
    summary?: {
        label: string;
        timeliness: string;
        total_score: number;
        scored_records: number;
        average_score: number | null;
    };
    filters: {
        quarter: string;
        year: string;
        reviewer_id: number | null;
    };
};

type Props = {
    report_section: string;
    section_label: string;
    can_select_reviewer: boolean;
    reviewers: Reviewer[];
};

const REPORT_PAGE_SIZE = 10;

export default function ReportPage({
    report_section: reportSection,
    section_label: sectionLabel,
    can_select_reviewer: canSelectReviewer,
    reviewers,
}: Props): JSX.Element {
    const [quarter, setQuarter] = useState('');
    const [year, setYear] = useState('');
    const [reviewerId, setReviewerId] = useState('all');
    const [report, setReport] = useState<ReportData | null>(null);
    const [reportPage, setReportPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const years = generateYears();
    const canGenerate = quarter !== '' && year !== '';
    const reportTotalPages = Math.max(
        1,
        Math.ceil((report?.rows.length ?? 0) / REPORT_PAGE_SIZE),
    );
    const reportPageStart = (reportPage - 1) * REPORT_PAGE_SIZE;
    const visibleReportRows =
        report?.rows.slice(
            reportPageStart,
            reportPageStart + REPORT_PAGE_SIZE,
        ) ?? [];

    const viewReport = async (): Promise<void> => {
        if (!canGenerate) {
            toast.error('Select a quarter and year first.');
            return;
        }

        setIsLoading(true);
        const params = new URLSearchParams({ quarter, year });
        if (canSelectReviewer && reviewerId !== 'all') {
            params.set('reviewer_id', reviewerId);
        }

        try {
            const response = await fetch(
                `/reports/${reportSection}/data?${params.toString()}`,
                { credentials: 'include' },
            );

            if (!response.ok) {
                throw new Error('Unable to generate the report.');
            }

            setReport((await response.json()) as ReportData);
            setReportPage(1);
            toast.success('Report data loaded.');
        } catch {
            toast.error('Unable to generate the report. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const exportExcel = async (): Promise<void> => {
        if (!report) return;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(
            sanitizeExcelWorksheetName(sectionLabel),
        );
        const lastColumn = excelColumnName(report.columns.length);

        worksheet.mergeCells(`A1:${lastColumn}1`);
        worksheet.getCell('A1').value = report.title;
        worksheet.getCell('A1').font = { bold: true, size: 14 };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };
        worksheet.mergeCells(`A2:${lastColumn}2`);
        worksheet.getCell('A2').value =
            `${quarterLabel(report.filters.quarter)} ${report.filters.year}`;
        worksheet.getCell('A2').alignment = { horizontal: 'center' };

        const headerRow = worksheet.getRow(4);
        headerRow.values = report.columns.map((column) => column.label);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0F2FE' },
            };
            cell.alignment = {
                horizontal: 'center',
                vertical: 'middle',
                wrapText: true,
            };
            applyExcelBorder(cell);
        });

        report.rows.forEach((row, index) => {
            const worksheetRow = worksheet.getRow(index + 5);
            worksheetRow.values = report.columns.map((column) =>
                displayValue(column.key, row[column.key]),
            );
            worksheetRow.eachCell((cell) => {
                cell.alignment = { vertical: 'top', wrapText: true };
                applyExcelBorder(cell);
            });
        });

        const summary = report.summary;
        if (summary) {
            const summaryRow = worksheet.getRow(report.rows.length + 5);
            summaryRow.values = report.columns.map((column, index) => {
                if (index === 0) return summary.label;
                if (column.key === 'timeliness') {
                    return summary.timeliness;
                }
                if (column.key === 'score') {
                    return formatAverageScore(summary);
                }

                return '';
            });
            summaryRow.eachCell((cell) => {
                cell.font = { bold: true };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF0F9FF' },
                };
                cell.alignment = { vertical: 'middle', wrapText: true };
                applyExcelBorder(cell);
            });
        }

        worksheet.columns = report.columns.map((column) => ({
            width: Math.min(Math.max(column.label.length + 6, 18), 45),
        }));

        const buffer = await workbook.xlsx.writeBuffer();
        downloadBlob(
            new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            }),
            reportFilename(reportSection, report.filters, 'xlsx'),
        );
        toast.success('Excel report exported.');
    };

    const exportPdf = (): void => {
        if (!report) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('Allow pop-ups to export the PDF report.');
            return;
        }

        printWindow.opener = null;

        const headers = report.columns
            .map((column) => `<th>${escapeHtml(column.label)}</th>`)
            .join('');
        const rows = report.rows
            .map(
                (row) =>
                    `<tr>${report.columns
                        .map(
                            (column) =>
                                `<td>${escapeHtml(displayValue(column.key, row[column.key]))}</td>`,
                        )
                        .join('')}</tr>`,
            )
            .join('');
        const summary = report.summary;
        const summaryRow = summary
            ? `<tfoot><tr>${report.columns
                  .map((column, index) => {
                      const value =
                          index === 0
                              ? summary.label
                              : column.key === 'timeliness'
                                ? summary.timeliness
                                : column.key === 'score'
                                  ? formatAverageScore(summary)
                                  : '';

                      return `<td>${escapeHtml(value ?? '')}</td>`;
                  })
                  .join('')}</tr></tfoot>`
            : '';

        printWindow.document.open();
        printWindow.document.write(`<!doctype html>
            <html><head><title>${escapeHtml(report.title)}</title>
            <style>
                @page { size: landscape; margin: 10mm; }
                body { color: #0f172a; font-family: Arial, sans-serif; }
                h1, p { margin: 0; text-align: center; }
                p { margin-top: 6px; margin-bottom: 18px; }
                table { width: 100%; border-collapse: collapse; font-size: 9px; }
                th, td { border: 1px solid #94a3b8; padding: 6px; vertical-align: top; }
                th { background: #e0f2fe; }
                tfoot { background: #f0f9ff; font-weight: bold; }
            </style></head><body>
            <h1>${escapeHtml(report.title)}</h1>
            <p>${escapeHtml(`${quarterLabel(report.filters.quarter)} ${report.filters.year}`)}</p>
            <table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody>${summaryRow}</table>
            </body></html>`);
        printWindow.document.close();
        printWindow.onafterprint = () => printWindow.close();

        window.setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 250);

        toast.info('Select "Save as PDF" in the print dialog.');
    };

    return (
        <div className="space-y-5 p-1">
            <section className="rounded-2xl border border-sky-200 bg-linear-to-br from-sky-600 via-sky-500 to-cyan-500 p-5 text-white shadow-sm md:p-7">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <div className="max-w-2xl">
                        <p className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-sky-100 uppercase">
                            <FileChartColumnIncreasing className="size-4" />
                            Generate Report
                        </p>
                        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                            {sectionLabel} Report
                        </h1>
                        <p className="mt-2 text-sm leading-6 text-sky-50 sm:text-base">
                            Filter, preview, and export content-level records as
                            PDF or Excel.
                        </p>
                    </div>
                    <div className="min-w-44 rounded-2xl border border-white/20 bg-white/12 px-4 py-4 backdrop-blur-sm">
                        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-sky-100 uppercase">
                            <Rows3 className="size-3.5" /> Preview records
                        </p>
                        <div className="mt-2 flex items-end gap-2">
                            <span className="text-3xl font-bold">
                                {report?.rows.length ?? 0}
                            </span>
                            <span className="pb-1 text-xs text-sky-100">
                                contents
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-4 sm:px-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-[180px_160px_minmax(240px,1fr)]">
                            <ReportSelect
                                label="Quarter"
                                value={quarter}
                                placeholder="Select quarter"
                                options={quarters.map((item) => ({
                                    value: item.value,
                                    label: item.label,
                                }))}
                                onValueChange={(value) => {
                                    setQuarter(value);
                                    setReport(null);
                                }}
                            />
                            <ReportSelect
                                label="Year"
                                value={year}
                                placeholder="Select year"
                                options={years.map((item) => ({
                                    value: String(item),
                                    label: String(item),
                                }))}
                                onValueChange={(value) => {
                                    setYear(value);
                                    setReport(null);
                                }}
                            />
                            {canSelectReviewer ? (
                                <ReportSelect
                                    label="Reviewer"
                                    value={reviewerId}
                                    placeholder="All reviewers"
                                    options={[
                                        {
                                            value: 'all',
                                            label: 'All reviewers',
                                        },
                                        ...reviewers.map((reviewer) => ({
                                            value: String(reviewer.id),
                                            label: reviewer.full_name,
                                        })),
                                    ]}
                                    onValueChange={(value) => {
                                        setReviewerId(value);
                                        setReport(null);
                                    }}
                                />
                            ) : (
                                <div className="hidden lg:block" />
                            )}
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    disabled={!canGenerate || isLoading}
                                    className="h-10 w-full bg-sky-600 px-4 text-white hover:bg-sky-700 xl:w-auto"
                                >
                                    {isLoading ? (
                                        <LoaderCircle className="size-4 animate-spin" />
                                    ) : (
                                        <FileDown className="size-4" />
                                    )}
                                    Generate Report
                                    <ChevronDown className="ml-auto size-4 xl:ml-1" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuItem
                                    onSelect={() => void viewReport()}
                                >
                                    <Eye /> View Report
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    disabled={!report}
                                    onSelect={exportPdf}
                                >
                                    <FileDown /> Export as PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    disabled={!report}
                                    onSelect={() => void exportExcel()}
                                >
                                    <FileSpreadsheet /> Export as Excel
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-semibold text-slate-900">
                            Report Preview
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {report
                                ? `${report.rows.length} content record${report.rows.length === 1 ? '' : 's'}`
                                : 'Choose filters and select View Report.'}
                        </p>
                    </div>
                    {report ? (
                        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700">
                            <CalendarRange className="size-3.5" />
                            {quarterLabel(report.filters.quarter)}{' '}
                            {report.filters.year}
                        </span>
                    ) : null}
                </div>

                <div className="overflow-x-auto">
                    {report ? (
                        <table className="w-full min-w-[900px] text-sm">
                            <thead className="bg-sky-50/80">
                                <tr>
                                    {report.columns.map((column) => (
                                        <th
                                            key={column.key}
                                            className="px-6 py-3 text-left text-xs font-semibold tracking-wide whitespace-nowrap text-sky-800 uppercase"
                                        >
                                            {column.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {visibleReportRows.map((row, index) => (
                                    <tr
                                        key={`${String(row.holdings_id ?? 'report')}-${reportPageStart + index}`}
                                        className="border-b border-slate-100 bg-white transition-colors hover:bg-sky-50/30"
                                    >
                                        {report.columns.map((column) => (
                                            <ReportCell
                                                key={column.key}
                                                column={column}
                                                value={row[column.key]}
                                            />
                                        ))}
                                    </tr>
                                ))}
                                {report.rows.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={report.columns.length}
                                            className="px-6 py-16 text-center text-sm text-slate-400"
                                        >
                                            <FileChartColumnIncreasing className="mx-auto mb-3 size-8 text-slate-300" />
                                            No report records found for the
                                            selected filters.
                                        </td>
                                    </tr>
                                ) : null}
                            </tbody>
                            {report.summary ? (
                                <ReportSummaryRow
                                    columns={report.columns}
                                    summary={report.summary}
                                />
                            ) : null}
                        </table>
                    ) : (
                        <div className="px-6 py-16 text-center">
                            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-500">
                                <FileChartColumnIncreasing className="size-6" />
                            </span>
                            <p className="mt-4 text-sm font-medium text-slate-600">
                                Your report preview will appear here
                            </p>
                            <p className="mt-1 text-sm text-slate-400">
                                Select a quarter and year, then choose View
                                Report.
                            </p>
                        </div>
                    )}
                </div>
                {report && report.rows.length > 0 ? (
                    <ReportPagination
                        page={reportPage}
                        totalPages={reportTotalPages}
                        totalRows={report.rows.length}
                        pageSize={REPORT_PAGE_SIZE}
                        onPageChange={setReportPage}
                    />
                ) : null}
            </section>
        </div>
    );
}

function ReportSummaryRow({
    columns,
    summary,
}: {
    columns: ReportColumn[];
    summary: NonNullable<ReportData['summary']>;
}): JSX.Element {
    return (
        <tfoot className="border-t-2 border-sky-200 bg-sky-50/80">
            <tr>
                {columns.map((column, index) => (
                    <td
                        key={column.key}
                        className="px-6 py-4 text-sm font-bold text-slate-700"
                    >
                        {index === 0 ? summary.label : null}
                        {column.key === 'timeliness' ? (
                            <span className="inline-flex rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-bold text-sky-700">
                                {summary.timeliness || '—'}
                            </span>
                        ) : null}
                        {column.key === 'score'
                            ? formatAverageScore(summary) || '—'
                            : null}
                    </td>
                ))}
            </tr>
        </tfoot>
    );
}

function formatAverageScore(
    summary: NonNullable<ReportData['summary']>,
): string {
    if (summary.average_score === null || summary.scored_records === 0) {
        return '';
    }

    return `${summary.total_score} / ${summary.scored_records} = ${summary.average_score.toFixed(2)}`;
}

function ReportPagination({
    page,
    totalPages,
    totalRows,
    pageSize,
    onPageChange,
}: {
    page: number;
    totalPages: number;
    totalRows: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}): JSX.Element {
    const firstRow = (page - 1) * pageSize + 1;
    const lastRow = Math.min(page * pageSize, totalRows);

    return (
        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
                Showing{' '}
                <span className="font-semibold text-slate-700">{firstRow}</span>{' '}
                to{' '}
                <span className="font-semibold text-slate-700">{lastRow}</span>{' '}
                of{' '}
                <span className="font-semibold text-slate-700">
                    {totalRows}
                </span>{' '}
                records
            </p>
            <div className="flex items-center gap-2">
                <span className="mr-1 text-sm font-medium text-slate-500">
                    Page {page} of {totalPages}
                </span>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    aria-label="Previous report page"
                    className="border-sky-200 text-sky-700 hover:bg-sky-50"
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                >
                    <ChevronLeft className="size-4" />
                    Previous
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    aria-label="Next report page"
                    className="border-sky-200 text-sky-700 hover:bg-sky-50"
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                >
                    Next
                    <ChevronRight className="size-4" />
                </Button>
            </div>
        </div>
    );
}

function ReportCell({
    column,
    value,
}: {
    column: ReportColumn;
    value: ReportRow[string];
}): JSX.Element {
    const text = displayValue(column.key, value) || '—';
    const isTitle = column.key === 'title';
    const isHoldingsId = column.key === 'holdings_id';
    const isStatus =
        column.key.includes('status') || column.key === 'timeliness';

    return (
        <td className="max-w-md px-6 py-4 align-top whitespace-pre-wrap text-slate-600">
            {isStatus ? (
                <span className="inline-flex rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700">
                    {text}
                </span>
            ) : (
                <span
                    className={
                        isTitle
                            ? 'font-semibold text-slate-900'
                            : isHoldingsId
                              ? 'font-semibold text-sky-700'
                              : undefined
                    }
                >
                    {text}
                </span>
            )}
        </td>
    );
}

function ReportSelect({
    label,
    value,
    placeholder,
    options,
    onValueChange,
}: {
    label: string;
    value: string;
    placeholder: string;
    options: Array<{ value: string; label: string }>;
    onValueChange: (value: string) => void;
}): JSX.Element {
    return (
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            {label}
            <Select value={value} onValueChange={onValueChange}>
                <SelectTrigger className="h-10 w-full border-sky-200 bg-white text-slate-600">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </label>
    );
}

function displayValue(
    key: string,
    value: string | number | boolean | null | undefined,
): string {
    if (value === null || value === undefined) return '';

    const text = String(value);
    if (key === 'abstract') {
        return (
            new DOMParser().parseFromString(text, 'text/html').body
                .textContent ?? ''
        );
    }

    if (
        key.endsWith('_at') ||
        key.includes('date_') ||
        key === 'target_deadline'
    ) {
        const date = new Date(text);
        if (!Number.isNaN(date.getTime())) {
            return new Intl.DateTimeFormat('en-PH', {
                dateStyle: 'medium',
                timeStyle: key === 'target_deadline' ? undefined : 'short',
                timeZone: 'Asia/Manila',
            }).format(date);
        }
    }

    return text;
}

function quarterLabel(value: string): string {
    return quarters.find((quarter) => quarter.value === value)?.desc ?? value;
}

function excelColumnName(count: number): string {
    let value = count;
    let result = '';
    while (value > 0) {
        value -= 1;
        result = String.fromCharCode(65 + (value % 26)) + result;
        value = Math.floor(value / 26);
    }

    return result;
}

function sanitizeExcelWorksheetName(value: string): string {
    const sanitized = value
        .replace(/[\\/:*?[\]]/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/^'+|'+$/g, '')
        .trim()
        .slice(0, 31)
        .trim();

    return sanitized || 'Report';
}

function applyExcelBorder(cell: ExcelJS.Cell): void {
    cell.border = {
        top: { style: 'thin' },
        right: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
    };
}

function downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
}

function reportFilename(
    section: string,
    filters: ReportData['filters'],
    extension: string,
): string {
    return `STARBOOKS-${section}-${filters.quarter}-${filters.year}.${extension}`;
}

function escapeHtml(value: string): string {
    return value.replace(/[&<>'"]/g, (character) => {
        const entities: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#039;',
            '"': '&quot;',
        };

        return entities[character];
    });
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Generate Reports', href: '/reports/shortlisted' },
];

ReportPage.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
