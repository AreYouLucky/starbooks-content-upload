import type { JSX } from 'react';
import ExcelJS, { type Cell, type Worksheet } from 'exceljs';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { useHandleChange } from '@/hooks/use-handle-change';
import { quarters } from '@/lib/default';
import { generateYears } from '@/pages/batches/partials/defaults';
import type {
    ApprovalRequestModel,
    BatchModel,
    LogDetailModel,
    UserModel,
} from '@/types/model';

type Props = {
    show: boolean;
    onClose: () => void;
};

type QualityReportLog = {
    id: number;
    progress_status: 4 | 5;
    remarks: string | null;
    created_at?: string;
    reviewer?: Pick<UserModel, 'id' | 'full_name'> | null;
    log_details?: LogDetailModel[];
};

type QualityReportRequest = ApprovalRequestModel & {
    approval_logs?: QualityReportLog[];
};

type QualityReportBatch = BatchModel & {
    approval_requests?: QualityReportRequest[];
};

type QualityReportResponse = {
    batches: QualityReportBatch[];
    records: QualityReportRequest[];
};

const REPORT_HEADERS = [
    '#',
    'Holdings ID',
    'Material Type',
    'Title',
    'Subtitle',
    'Abstract',
    'Agency Code',
    'Journal Title',
    'Volume No.',
    'Issue No.',
    'Issue Date',
    'Author',
    'Subject',
    'Broad Class',
    'Reviewed By',
    'Decision',
    'Reason for Not Approving',
    'Comments',
    'Date Reviewed',
] as const;

const COLUMN_WIDTHS = [
    6, 18, 18, 42, 28, 45, 18, 30, 14, 12, 14, 24, 28, 18, 24, 16, 32, 32, 22,
] as const;

const getText = (
    value: string | number | boolean | null | undefined,
): string => {
    return value === null || value === undefined ? '' : String(value);
};

const getQuarterLabel = (quarter: string): string => {
    return quarters.find((item) => item.value === quarter)?.desc ?? quarter;
};

const formatManilaDate = (value?: string): string => {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
        timeZone: 'Asia/Manila',
    }).format(date);
};

const getDecision = (log: QualityReportLog): string => {
    return log.progress_status === 4 ? 'Approved' : 'Disapproved';
};

const getDisapprovalReasons = (log: QualityReportLog): string => {
    return (log.log_details ?? [])
        .map((detail) => detail.remarks?.trim())
        .filter((remark): remark is string => Boolean(remark))
        .join(', ');
};

const applyBorder = (cell: Cell): void => {
    cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
    };
};

const styleMergedTitle = (
    worksheet: Worksheet,
    range: string,
    value: string,
    isBold = true,
): void => {
    worksheet.mergeCells(range);
    const cell = worksheet.getCell(range.split(':')[0]);
    cell.value = value;
    cell.font = { bold: isBold, size: 14 };
    cell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true,
    };
};

const downloadQualityAssuranceReport = async ({
    batches,
    quarter,
    year,
}: {
    batches: QualityReportBatch[];
    quarter: string;
    year: string;
}): Promise<void> => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Quality Assurance');
    worksheet.columns = COLUMN_WIDTHS.map((width) => ({ width }));

    styleMergedTitle(
        worksheet,
        'A1:S1',
        'STARBOOKS CONTENT QUALITY ASSURANCE REPORT',
    );
    styleMergedTitle(
        worksheet,
        'A2:S2',
        `${getQuarterLabel(quarter)} ${year}`,
        false,
    );
    worksheet.getRow(1).height = 24;
    worksheet.getRow(2).height = 22;

    let currentRow = 4;
    let recordNumber = 1;

    batches.forEach((batch) => {
        worksheet.mergeCells(`A${currentRow}:O${currentRow}`);
        worksheet.mergeCells(`P${currentRow}:S${currentRow}`);

        const batchCell = worksheet.getCell(`A${currentRow}`);
        batchCell.value = batch.batch_name;
        batchCell.font = { bold: true };
        batchCell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
            wrapText: true,
        };

        const deadlineCell = worksheet.getCell(`P${currentRow}`);
        deadlineCell.value = `DEADLINE: ${getText(batch.target_quality_approval_date)}`;
        deadlineCell.font = { bold: true };
        deadlineCell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
            wrapText: true,
        };

        worksheet.getRow(currentRow).eachCell(applyBorder);
        currentRow += 1;

        const headerRow = worksheet.getRow(currentRow);
        headerRow.values = [...REPORT_HEADERS];
        headerRow.eachCell((cell) => {
            cell.font = { bold: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF3F4F6' },
            };
            cell.alignment = {
                horizontal: 'center',
                vertical: 'middle',
                wrapText: true,
            };
            applyBorder(cell);
        });
        currentRow += 1;

        (batch.approval_requests ?? []).forEach((approvalRequest) => {
            (approvalRequest.approval_logs ?? []).forEach((approvalLog) => {
                const row = worksheet.getRow(currentRow);
                row.values = [
                    recordNumber,
                    getText(approvalRequest.HoldingsID),
                    getText(approvalRequest.MaterialType),
                    getText(approvalRequest.Title),
                    getText(approvalRequest.SubTitle),
                    getText(approvalRequest.Abstracts),
                    getText(approvalRequest.AgencyCode),
                    getText(approvalRequest.JournalTitle),
                    getText(approvalRequest.VolumeNo),
                    getText(approvalRequest.IssueNo),
                    getText(approvalRequest.IssueDate),
                    getText(approvalRequest.Author),
                    getText(approvalRequest.Subject),
                    getText(approvalRequest.BroadClass),
                    approvalLog.reviewer?.full_name ?? '',
                    getDecision(approvalLog),
                    getDisapprovalReasons(approvalLog),
                    approvalLog.remarks ?? '',
                    formatManilaDate(approvalLog.created_at),
                ];
                row.eachCell((cell) => {
                    cell.alignment = {
                        horizontal: 'center',
                        vertical: 'middle',
                        wrapText: true,
                    };
                    applyBorder(cell);
                });

                recordNumber += 1;
                currentRow += 1;
            });
        });

        currentRow += 2;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const objectUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `STARBOOKS-Quality-Assurance-${quarter}-${year}.xlsx`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(objectUrl);
};

export default function GenerateReport({ show, onClose }: Props): JSX.Element {
    const { item, errors, setItem, setErrors } = useHandleChange({
        quarter: '',
        year: '',
    });
    const years = generateYears();
    const isGenerateDisabled = item.quarter === '' || item.year === '';

    const generateReport = async (): Promise<void> => {
        const params = new URLSearchParams({
            quarter: item.quarter,
            year: item.year,
        });

        try {
            const response = await fetch(
                `/generate-quality-assurance-report?${params.toString()}`,
                { credentials: 'include' },
            );
            if (!response.ok) throw new Error('Failed to generate report.');

            const result = (await response.json()) as QualityReportResponse;
            await downloadQualityAssuranceReport({
                batches: result.batches,
                quarter: item.quarter,
                year: item.year,
            });
            toast.success('Quality assurance report generated successfully.');
            onClose();
        } catch {
            toast.error('Failed to generate report. Please try again.');
        }
    };

    return (
        <Dialog open={show} onOpenChange={onClose}>
            <DialogContent className="w-full max-w-xl bg-white p-8 text-slate-600">
                <DialogHeader>
                    <DialogTitle className="text-center text-sky-700">
                        Generate Quality Assurance Report
                    </DialogTitle>
                    <DialogDescription className="text-center text-xs">
                        Select the reporting quarter and year.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 pt-2 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                        <Label htmlFor="quality-report-quarter">Quarter</Label>
                        <Select
                            value={item.quarter}
                            onValueChange={(value) => {
                                setErrors((current) => ({
                                    ...current,
                                    quarter: '',
                                }));
                                setItem((current) => ({
                                    ...current,
                                    quarter: value,
                                }));
                            }}
                        >
                            <SelectTrigger
                                id="quality-report-quarter"
                                className="border-sky-300"
                            >
                                <SelectValue placeholder="Select quarter" />
                            </SelectTrigger>
                            <SelectContent>
                                {quarters.map((quarter) => (
                                    <SelectItem
                                        key={quarter.value}
                                        value={quarter.value}
                                    >
                                        {quarter.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.quarter} />
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="quality-report-year">Year</Label>
                        <Select
                            value={item.year}
                            onValueChange={(value) => {
                                setErrors((current) => ({
                                    ...current,
                                    year: '',
                                }));
                                setItem((current) => ({
                                    ...current,
                                    year: value,
                                }));
                            }}
                        >
                            <SelectTrigger
                                id="quality-report-year"
                                className="border-sky-300"
                            >
                                <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map((year) => (
                                    <SelectItem key={year} value={String(year)}>
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.year} />
                    </div>
                </div>

                <Button
                    type="button"
                    disabled={isGenerateDisabled}
                    onClick={generateReport}
                    className="mt-2 w-fit bg-sky-600 text-white hover:bg-sky-700"
                >
                    Generate Report
                </Button>
            </DialogContent>
        </Dialog>
    );
}
