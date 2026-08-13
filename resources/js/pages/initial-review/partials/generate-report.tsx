import type { JSX } from 'react';
import ExcelJS, { type Cell, type Worksheet } from 'exceljs';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import InputError from '@/components/input-error';
import { useHandleChange } from '@/hooks/use-handle-change';
import { quarters } from '@/lib/default';
import { generateYears } from '@/pages/batches/partials/defaults';
import axios from 'axios';
import {
    LogModel,
    RequestModel,
    BatchModel,
    LogDetailModel,
    UserModel,
} from '@/types/model';
import { toast } from 'sonner';

type Props = {
    show: boolean;
    onClose: () => void;
};
type InitialReviewReportReviewer = Pick<UserModel, 'id' | 'full_name'>;
type InitialReviewReportLogDetail = LogDetailModel;
type InitialReviewReportApprovalLog = Omit<LogModel, 'is_approved'> & {
    is_approved: boolean | number | null;
    log_details?: InitialReviewReportLogDetail[];
    reviewer?: InitialReviewReportReviewer | null;
};
type InitialReviewReportApprovalRequest = RequestModel & {
    approval_logs?: InitialReviewReportApprovalLog[];
};
type InitialReviewReportBatch = BatchModel & {
    approval_requests?: InitialReviewReportApprovalRequest[];
};
type Result = {
    batches: InitialReviewReportBatch[];
    records: InitialReviewReportApprovalRequest[];
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

const getQuarterLabel = (quarter: string): string => {
    return quarters.find((item) => item.value === quarter)?.desc ?? quarter;
};

const getText = (
    value: string | number | boolean | null | undefined,
): string => {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value);
};

const isFilled = (value: string | null | undefined): value is string => {
    return typeof value === 'string' && value.trim() !== '';
};
const formatManilaDate = (value: string | null | undefined): string => {
    if (!value) {
        return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
        timeZone: 'Asia/Manila',
    }).format(date);
};

const getDecision = (approvalLog: InitialReviewReportApprovalLog): string => {
    if (
        approvalLog.is_approved === true ||
        approvalLog.is_approved === 1
    ) {
        return 'Approved';
    }

    if (
        approvalLog.is_approved === false ||
        approvalLog.is_approved === 0
    ) {
        return 'Disapproved';
    }

    return '';
};

const getRejectionReasons = (
    approvalLog: InitialReviewReportApprovalLog,
): string => {
    return (approvalLog.log_details ?? [])
        .map((detail) => detail.remarks)
        .filter(isFilled)
        .map((remark) => remark.trim())
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

const downloadInitialReviewReport = async ({
    batches,
    quarter,
    year,
}: {
    batches: InitialReviewReportBatch[];
    quarter: string;
    year: string;
}): Promise<void> => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Initial Review');

    worksheet.columns = COLUMN_WIDTHS.map((width) => ({ width }));

    styleMergedTitle(
        worksheet,
        'A1:S1',
        'STARBOOKS CONTENT COMMITTEE REVIEW REPORT - INITIAL REVIEW',
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
    let count = 1;

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
        deadlineCell.value = `DEADLINE: ${getText(batch.target_initial_review_date)}`;
        deadlineCell.font = { bold: true };
        deadlineCell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
            wrapText: true,
        };

        worksheet.getRow(currentRow).eachCell((cell) => {
            applyBorder(cell);
        });

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
            const approvalLogs = approvalRequest.approval_logs?.length
                ? approvalRequest.approval_logs
                : [null];

            approvalLogs.forEach((approvalLog) => {
                const row = worksheet.getRow(currentRow);

                row.values = [
                    count,
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
                    approvalLog?.reviewer?.full_name ?? '',
                    approvalLog ? getDecision(approvalLog) : '',
                    approvalLog ? getRejectionReasons(approvalLog) : '',
                    approvalLog?.remarks ?? '',
                    approvalLog ? formatManilaDate(approvalLog.created_at) : '',
                ];

                row.eachCell((cell) => {
                    cell.alignment = {
                        horizontal: 'center',
                        vertical: 'middle',
                        wrapText: true,
                    };
                    applyBorder(cell);
                });

                count += 1;
                currentRow += 1;
            });
        });

        currentRow += 2;
    });

    const signatureStartRow = currentRow + 1;
    worksheet.getCell(`A${signatureStartRow}`).value = 'Reviewed By';
    worksheet.getCell(`A${signatureStartRow + 5}`).value = 'Noted By:';
    worksheet.getCell(`A${signatureStartRow + 8}`).value =
        'MARIEVIC V. NARQUITA';
    worksheet.getCell(`A${signatureStartRow + 9}`).value = 'Vice Chairperson';
    worksheet.getCell(`A${signatureStartRow + 12}`).value = 'Approved By:';
    worksheet.getCell(`A${signatureStartRow + 15}`).value = 'ALAN C. TÁULE';
    worksheet.getCell(`A${signatureStartRow + 16}`).value = 'Chairperson';

    [
        signatureStartRow,
        signatureStartRow + 5,
        signatureStartRow + 8,
        signatureStartRow + 9,
        signatureStartRow + 12,
        signatureStartRow + 15,
        signatureStartRow + 16,
    ].forEach((rowNumber) => {
        const cell = worksheet.getCell(`A${rowNumber}`);
        cell.font = {
            bold:
                rowNumber !== signatureStartRow + 9 &&
                rowNumber !== signatureStartRow + 16,
        };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const objectUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `STARBOOKS-Initial-Review-${quarter}-${year}.xlsx`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(objectUrl);
};

export default function GenerateReport(props: Props): JSX.Element {
    const { item, errors, setItem, setErrors } = useHandleChange({
        quarter: '',
        year: '',
    });
    const years = generateYears();
    const disableBtn = item.quarter === '' || item.year === '';
    const generateReportFn = (): void => {
        const { quarter, year } = item;
        axios
            .get<Result>('/generate-initial-review-report', {
                params: { quarter: quarter, year: year },
            })
            .then(async (res) => {
                await downloadInitialReviewReport({
                    batches: res.data.batches,
                    quarter: quarter,
                    year: year,
                });
                toast.success(
                    'Report generated successfully! Check your downloads.',
                );
                props.onClose();
            })
            .catch(() => {
                toast.error('Failed to generate report. Please try again.');
            });
    };
    return (
        <Dialog open={props.show} onOpenChange={props.onClose}>
            <DialogContent className="w-full max-w-6xl bg-white p-10 text-gray-600">
                <DialogHeader>
                    <DialogTitle className="poppins-bold text-center text-sky-600">
                        Generate Report{' '}
                    </DialogTitle>
                    <DialogDescription className="text-center text-xs">
                        Fill all the fields to proceed
                    </DialogDescription>
                </DialogHeader>
                <div className="flex w-full flex-col gap-4 pt-2 pb-2">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="grid gap-1">
                            <Label
                                htmlFor="batch_id"
                                className="poppins-semibold text-[13px] text-gray-600"
                            >
                                Quarter{' '}
                            </Label>
                            <Select
                                value={String(item.quarter)}
                                onValueChange={(value) => {
                                    setErrors((prev) => ({
                                        ...prev,
                                        quarter: '',
                                    }));
                                    setItem((prev) => ({
                                        ...prev,
                                        quarter: value,
                                    }));
                                }}
                            >
                                <SelectTrigger className="border-sky-300">
                                    <SelectValue
                                        placeholder=""
                                        className="text-[12px]"
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {quarters.map((type, index) => (
                                        <SelectItem
                                            key={index}
                                            value={type.value}
                                        >
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <InputError message={errors.quarter} />
                        </div>
                        <div className="grid gap-1">
                            <Label
                                htmlFor="batch_id"
                                className="poppins-semibold text-[13px] text-gray-600"
                            >
                                Year{' '}
                            </Label>
                            <Select
                                value={String(item.year)}
                                onValueChange={(value) => {
                                    setErrors((prev) => ({
                                        ...prev,
                                        year: '',
                                    }));
                                    setItem((prev) => ({
                                        ...prev,
                                        year: value,
                                    }));
                                }}
                            >
                                <SelectTrigger className="border-sky-300">
                                    <SelectValue
                                        placeholder=""
                                        className="text-[12px]"
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map((type, index) => (
                                        <SelectItem
                                            key={index}
                                            value={String(type)}
                                        >
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <InputError message={errors.year} />
                        </div>
                    </div>
                    <div className="flex justify-start gap-2">
                        <Button
                            className="bg-sky-600 text-sm text-gray-50"
                            onClick={generateReportFn}
                            disabled={disableBtn}
                        >
                            Generate Report
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
