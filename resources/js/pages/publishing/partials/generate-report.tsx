import { useEffect, useState, type JSX } from 'react';
import ExcelJS, { type Cell, type Worksheet } from 'exceljs';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { quarters } from '@/lib/default';
import { generateYears } from '@/pages/batches/partials/defaults';

type Props = {
    show: boolean;
    onClose: () => void;
};

type ReportTab = 'summary' | 'reviewer';

type ReviewerOption = {
    id: number;
    full_name: string;
};

type PublishingSummaryBatch = {
    batch_name: string;
    shortlisted_content_count: number;
    initial_review_approved_count: number;
    initial_review_disapproved_count: number;
    quality_approved_count: number;
    quality_disapproved_count: number;
    published_content_count: number;
};

type PublishingSummaryResponse = {
    batches: PublishingSummaryBatch[];
};

type PublishingReviewerResponse = {
    records: PublishingReviewerRecord[];
};

type PublishingReviewerRecord = {
    title: string | null;
    holdings_id: string | null;
    status: string;
    review_date: string | null;
    reason_of_disapproval: string | null;
    remarks: string | null;
};

type ReviewersResponse = {
    reviewers: ReviewerOption[];
};

const SUMMARY_HEADERS = [
    'Batch Name',
    'No. of Shortlisted Content',
    'Initial Review - Approved',
    'Initial Review - Disapproved',
    'QA Content - Approved',
    'QA Content - Disapproved',
    'No. of Published Content',
] as const;

const REVIEWER_HEADERS = [
    'Title',
    'Holding ID',
    'Status',
    'Review Date',
    'Reason of Disapproval',
    'Remarks',
] as const;

const getQuarterLabel = (quarter: string): string => {
    return quarters.find((item) => item.value === quarter)?.desc ?? quarter;
};

const getText = (
    value: string | number | boolean | null | undefined,
): string => {
    return value === null || value === undefined ? '' : String(value);
};

const formatManilaDate = (value: string | null): string => {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
        timeZone: 'Asia/Manila',
    }).format(date);
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

const styleHeaderRow = (worksheet: Worksheet, rowNumber: number): void => {
    const row = worksheet.getRow(rowNumber);

    row.eachCell((cell) => {
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
};

const downloadWorkbook = async (
    workbook: ExcelJS.Workbook,
    filename: string,
): Promise<void> => {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const objectUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(objectUrl);
};

const downloadSummaryReport = async ({
    batches,
    quarter,
    year,
}: {
    batches: PublishingSummaryBatch[];
    quarter: string;
    year: string;
}): Promise<void> => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Publishing Summary');

    worksheet.columns = [34, 24, 24, 26, 22, 24, 24].map((width) => ({
        width,
    }));

    styleMergedTitle(
        worksheet,
        'A1:G1',
        'STARBOOKS CONTENT PUBLISHING SUMMARY REPORT',
    );
    styleMergedTitle(
        worksheet,
        'A2:G2',
        `${getQuarterLabel(quarter)} ${year}`,
        false,
    );

    const headerRow = worksheet.getRow(4);
    headerRow.values = [...SUMMARY_HEADERS];
    styleHeaderRow(worksheet, 4);

    batches.forEach((batch, index) => {
        const row = worksheet.getRow(index + 5);
        row.values = [
            batch.batch_name,
            batch.shortlisted_content_count,
            batch.initial_review_approved_count,
            batch.initial_review_disapproved_count,
            batch.quality_approved_count,
            batch.quality_disapproved_count,
            batch.published_content_count,
        ];
        row.eachCell((cell) => {
            cell.alignment = {
                horizontal: 'center',
                vertical: 'middle',
                wrapText: true,
            };
            applyBorder(cell);
        });
    });

    await downloadWorkbook(
        workbook,
        `STARBOOKS-Publishing-Summary-${quarter}-${year}.xlsx`,
    );
};

const downloadReviewerReport = async ({
    records,
    reviewerName,
    quarter,
    year,
}: {
    records: PublishingReviewerRecord[];
    reviewerName: string;
    quarter: string;
    year: string;
}): Promise<void> => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reviewer Details');

    worksheet.columns = [42, 20, 26, 18, 34, 40].map((width) => ({ width }));

    styleMergedTitle(
        worksheet,
        'A1:F1',
        'STARBOOKS CONTENT PUBLISHING REVIEWER REPORT',
    );
    styleMergedTitle(
        worksheet,
        'A2:F2',
        `${reviewerName} - ${getQuarterLabel(quarter)} ${year}`,
        false,
    );

    const headerRow = worksheet.getRow(4);
    headerRow.values = [...REVIEWER_HEADERS];
    styleHeaderRow(worksheet, 4);

    records.forEach((record, index) => {
        const row = worksheet.getRow(index + 5);
        row.values = [
            getText(record.title),
            getText(record.holdings_id),
            record.status,
            formatManilaDate(record.review_date),
            getText(record.reason_of_disapproval),
            getText(record.remarks),
        ];
        row.eachCell((cell) => {
            cell.alignment = {
                horizontal: 'center',
                vertical: 'middle',
                wrapText: true,
            };
            applyBorder(cell);
        });
    });

    await downloadWorkbook(
        workbook,
        `STARBOOKS-Publishing-Reviewer-${reviewerName}-${quarter}-${year}.xlsx`,
    );
};

export default function GenerateReport({ show, onClose }: Props): JSX.Element {
    const [activeTab, setActiveTab] = useState<ReportTab>('summary');
    const [reviewers, setReviewers] = useState<ReviewerOption[]>([]);
    const [summaryQuarter, setSummaryQuarter] = useState('');
    const [summaryYear, setSummaryYear] = useState('');
    const [reviewerId, setReviewerId] = useState('');
    const [reviewerQuarter, setReviewerQuarter] = useState('');
    const [reviewerYear, setReviewerYear] = useState('');
    const [summaryError, setSummaryError] = useState('');
    const [reviewerError, setReviewerError] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const years = generateYears();

    useEffect(() => {
        if (!show) return;

        fetch('/publishing-report-reviewers', { credentials: 'include' })
            .then((response) => {
                if (!response.ok) throw new Error('Failed to load reviewers.');
                return response.json() as Promise<ReviewersResponse>;
            })
            .then((response) => setReviewers(response.reviewers))
            .catch(() => {
                toast.error('Failed to load reviewer list.');
            });
    }, [show]);

    const generateSummaryReport = async (): Promise<void> => {
        if (!summaryQuarter || !summaryYear) {
            setSummaryError('Select a quarter and year.');
            return;
        }

        setSummaryError('');
        setIsGenerating(true);

        const params = new URLSearchParams({
            quarter: summaryQuarter,
            year: summaryYear,
        });

        try {
            const response = await fetch(
                `/generate-publishing-summary-report?${params.toString()}`,
                { credentials: 'include' },
            );
            if (!response.ok) throw new Error('Failed to generate report.');

            const result = (await response.json()) as PublishingSummaryResponse;
            await downloadSummaryReport({
                batches: result.batches,
                quarter: summaryQuarter,
                year: summaryYear,
            });
            toast.success('Publishing summary report generated successfully.');
            onClose();
        } catch {
            toast.error('Failed to generate report. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const generateReviewerReport = async (): Promise<void> => {
        if (!reviewerId || !reviewerQuarter || !reviewerYear) {
            setReviewerError('Select a reviewer, quarter, and year.');
            return;
        }

        setReviewerError('');
        setIsGenerating(true);

        const selectedReviewer = reviewers.find(
            (reviewer) => String(reviewer.id) === reviewerId,
        );
        const params = new URLSearchParams({
            reviewer_id: reviewerId,
            quarter: reviewerQuarter,
            year: reviewerYear,
        });

        try {
            const response = await fetch(
                `/generate-publishing-reviewer-report?${params.toString()}`,
                { credentials: 'include' },
            );
            if (!response.ok) throw new Error('Failed to generate report.');

            const result =
                (await response.json()) as PublishingReviewerResponse;
            await downloadReviewerReport({
                records: result.records,
                reviewerName: selectedReviewer?.full_name ?? 'Reviewer',
                quarter: reviewerQuarter,
                year: reviewerYear,
            });
            toast.success('Publishing reviewer report generated successfully.');
            onClose();
        } catch {
            toast.error('Failed to generate report. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={show} onOpenChange={onClose}>
            <DialogContent className="w-full max-w-3xl bg-white p-8 text-slate-600">
                <DialogHeader>
                    <DialogTitle className="text-center text-sky-700">
                        Generate Publishing Report
                    </DialogTitle>
                    <DialogDescription className="text-center text-xs">
                        Select the report type and filters.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
                    <button
                        type="button"
                        onClick={() => setActiveTab('summary')}
                        className={`h-10 rounded-md text-sm font-semibold transition ${
                            activeTab === 'summary'
                                ? 'bg-white text-sky-700 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Batch Summary
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('reviewer')}
                        className={`h-10 rounded-md text-sm font-semibold transition ${
                            activeTab === 'reviewer'
                                ? 'bg-white text-sky-700 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Reviewer Details
                    </button>
                </div>

                {activeTab === 'summary' ? (
                    <div className="grid gap-4 pt-2 sm:grid-cols-2">
                        <ReportSelect
                            id="publishing-summary-quarter"
                            label="Quarter"
                            value={summaryQuarter}
                            placeholder="Select quarter"
                            onValueChange={(value) => {
                                setSummaryQuarter(value);
                                setSummaryError('');
                            }}
                            options={quarters.map((quarter) => ({
                                value: quarter.value,
                                label: quarter.label,
                            }))}
                        />
                        <ReportSelect
                            id="publishing-summary-year"
                            label="Year"
                            value={summaryYear}
                            placeholder="Select year"
                            onValueChange={(value) => {
                                setSummaryYear(value);
                                setSummaryError('');
                            }}
                            options={years.map((year) => ({
                                value: String(year),
                                label: String(year),
                            }))}
                        />
                        <div className="sm:col-span-2">
                            <InputError message={summaryError} />
                        </div>
                        <Button
                            type="button"
                            disabled={isGenerating}
                            onClick={generateSummaryReport}
                            className="w-fit bg-sky-600 text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        >
                            {isGenerating ? 'Generating...' : 'Generate Report'}
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4 pt-2 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <ReportSelect
                                id="publishing-reviewer-name"
                                label="Name"
                                value={reviewerId}
                                placeholder="Select reviewer"
                                onValueChange={(value) => {
                                    setReviewerId(value);
                                    setReviewerError('');
                                }}
                                options={reviewers.map((reviewer) => ({
                                    value: String(reviewer.id),
                                    label: reviewer.full_name,
                                }))}
                            />
                        </div>
                        <ReportSelect
                            id="publishing-reviewer-quarter"
                            label="Quarter"
                            value={reviewerQuarter}
                            placeholder="Select quarter"
                            onValueChange={(value) => {
                                setReviewerQuarter(value);
                                setReviewerError('');
                            }}
                            options={quarters.map((quarter) => ({
                                value: quarter.value,
                                label: quarter.label,
                            }))}
                        />
                        <ReportSelect
                            id="publishing-reviewer-year"
                            label="Year"
                            value={reviewerYear}
                            placeholder="Select year"
                            onValueChange={(value) => {
                                setReviewerYear(value);
                                setReviewerError('');
                            }}
                            options={years.map((year) => ({
                                value: String(year),
                                label: String(year),
                            }))}
                        />
                        <div className="sm:col-span-2">
                            <InputError message={reviewerError} />
                        </div>
                        <Button
                            type="button"
                            disabled={isGenerating}
                            onClick={generateReviewerReport}
                            className="w-fit bg-sky-600 text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        >
                            {isGenerating ? 'Generating...' : 'Generate Report'}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function ReportSelect({
    id,
    label,
    value,
    placeholder,
    onValueChange,
    options,
}: {
    id: string;
    label: string;
    value: string;
    placeholder: string;
    onValueChange: (value: string) => void;
    options: { value: string; label: string }[];
}): JSX.Element {
    return (
        <div className="grid gap-1.5">
            <Label htmlFor={id}>{label}</Label>
            <Select value={value} onValueChange={onValueChange}>
                <SelectTrigger id={id} className="border-sky-300 bg-white">
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
        </div>
    );
}
