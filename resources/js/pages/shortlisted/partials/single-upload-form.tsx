import { isValidElement, ReactNode, useState } from 'react';
import type { BreadcrumbItem } from '@/types';
import { useHandleChange } from '@/hooks/use-handle-change';
import { usePage } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { FaUpload } from 'react-icons/fa';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import {
    LkContentModel,
    RequestModel,
    BatchModel,
    RecordModel,
} from '@/types/model';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import { content_type, material_type } from '@/lib/default';
import { Button } from '@/components/ui/button';
import TextField from '@/components/ui/text-field';
import { useUploadSingleRequest, useUpdateSingleRequest } from './upload-hooks';
import { useUpdateExistingRecord } from '@/pages/existing-records/partials/existing-record-hooks';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'For Shortlisting',
        href: '/view-shortlisted',
    },
    {
        title: 'Single Upload Form',
        href: '/single-upload-form',
    },
];
export default function SingleUpload() {
    const { props } = usePage<{
        content_group?: LkContentModel[];
        approval_request?: RequestModel;
        existing_record?: RecordModel;
        record_status?: string;
        batches?: BatchModel[];
        update_url?: string;
        form_title?: string;
        form_breadcrumbs?: BreadcrumbItem[];
    }>();
    const content_group = props.content_group ?? [];
    const batches = props.batches ?? [];
    const approval_request = props.approval_request;
    const existing_record = props.existing_record;
    const record_status = props.record_status ?? 'published';
    const update_url = props.update_url;
    const form_title = props.form_title;
    const editableRecord = approval_request ?? existing_record;
    const isExistingRecord = Boolean(existing_record);
    const [open, setOpen] = useState(false);
    const { item, handleChange, setItem, errors, setErrors } = useHandleChange({
        id: editableRecord?.id ?? 0,
        Title: editableRecord?.Title ?? '',
        Author: editableRecord?.Author ?? '',
        HoldingsID: editableRecord?.HoldingsID ?? '',
        Contents: editableRecord?.Contents ?? '',
        MaterialType: editableRecord?.MaterialType ?? '',
        JournalTitle: editableRecord?.JournalTitle ?? '',
        Subject: editableRecord?.Subject ?? '',
        SubTitle: editableRecord?.SubTitle ?? '',
        VolumeNo: editableRecord?.VolumeNo ?? '',
        IssueNo: editableRecord?.IssueNo ?? '',
        IssueDate: editableRecord?.IssueDate ?? '',
        BroadClass: editableRecord?.BroadClass ?? '',
        AgencyCode: editableRecord?.AgencyCode ?? '',
        Type: editableRecord?.Type ?? '',
        batch_id: approval_request?.batch_id ?? '',
        Abstracts: editableRecord?.Abstracts ?? '',
    });

    const createFormData = () => {
        const formData = new FormData();
        formData.append('Title', item.Title);
        formData.append('Author', item.Author);
        formData.append('HoldingsID', item.HoldingsID);
        formData.append('Contents', item.Contents);
        formData.append('MaterialType', item.MaterialType);
        formData.append('JournalTitle', item.JournalTitle);
        formData.append('Subject', item.Subject);
        formData.append('SubTitle', item.SubTitle);
        formData.append('VolumeNo', item.VolumeNo);
        formData.append('IssueNo', item.IssueNo);
        formData.append('IssueDate', item.IssueDate);
        formData.append('BroadClass', item.BroadClass);
        formData.append('AgencyCode', item.AgencyCode);
        formData.append('Type', item.Type);
        formData.append('batch_id', String(item.batch_id));
        formData.append('Abstracts', item.Abstracts);
        return formData;
    };
    const uploadSingleRequest = useUploadSingleRequest();
    const uploadSingleRequestFn = () => {
        const formData = createFormData();
        uploadSingleRequest.mutate(formData, {
            onSuccess: (data) => {
                toast.success('Request Successfully Created');
                const newUrl = `/single-upload/${data?.approval_request?.id}/edit`;
                window.history.pushState({}, '', newUrl);
                setOpen(false);
                setItem((prev) => ({
                    ...prev,
                    id: data?.approval_request?.id as number,
                }));
            },
            onError: (err) => {
                if (err.response?.data?.errors) {
                    setErrors(err.response.data.errors);
                    toast.error('Check input fields for errors');
                    setOpen(false);
                }
            },
        });
    };

    const updateSingleRequest = useUpdateSingleRequest();
    const updateExistingRecord = useUpdateExistingRecord();
    const updateExistingRecordFn = () => {
        const formData = createFormData();
        updateExistingRecord.mutate(
            { id: item.id as number, status: record_status, payload: formData },
            {
                onSuccess: () => {
                    toast.success('Record Successfully Updated');
                    setOpen(false);
                },
                onError: (err) => {
                    if (err.response?.data?.errors) {
                        setErrors(err.response.data.errors);
                        setOpen(false);
                        toast.error('Check input fields for errors');
                    }
                },
            },
        );
    };
    const updateSingleRequestFn = () => {
        const formData = createFormData();
        updateSingleRequest.mutate(
            { id: item.id as number, payload: formData, url: update_url },
            {
                onSuccess: () => {
                    toast.success('Request Successfully Updated');
                    setOpen(false);
                },
                onError: (err) => {
                    if (err.response?.data?.errors) {
                        setErrors(err.response.data.errors);
                        setOpen(false);
                        toast.error('Check input fields for errors');
                    }
                },
            },
        );
    };

    return (
        <div className="space-y-3">
            <section className="relative overflow-hidden rounded-xl border border-sky-100 bg-sky-500 p-4 text-xl font-bold text-white uppercase md:p-8">
                {form_title ??
                    (isExistingRecord
                        ? 'Edit existing record'
                        : 'Upload new content for Shortlisting')}
            </section>
            <Card className="grid grid-cols-1 gap-3 rounded-xl border-sky-100 p-8 md:grid-cols-2 lg:grid-cols-4">
                <div className="grid gap-1 md:col-span-2">
                    <Label
                        htmlFor="Title"
                        className="poppins-semibold text-[13px] text-gray-600"
                    >
                        Title
                    </Label>
                    <Input
                        id="Title"
                        type="text"
                        name="Title"
                        required
                        onChange={handleChange}
                        value={String(item.Title)}
                        className="border-gray-300 text-gray-700"
                    />
                    <InputError message={errors.Title} />
                </div>
                <div className="grid gap-1">
                    <Label
                        htmlFor="Author"
                        className="poppins-semibold text-[13px] text-gray-600"
                    >
                        Author
                    </Label>
                    <Input
                        id="Author"
                        type="text"
                        name="Author"
                        required
                        onChange={handleChange}
                        value={String(item.Author)}
                        className="border-gray-300 text-gray-700"
                    />
                    <InputError message={errors.Author} />
                </div>
                <div className="grid gap-1">
                    <Label
                        htmlFor="type"
                        className="poppins-semibold text-[13px] text-gray-600"
                    >
                        Type
                    </Label>
                    <Select
                        value={String(item.Type)}
                        onValueChange={(value) => {
                            setErrors((prev) => ({ ...prev, Type: '' }));
                            setItem((prev) => ({ ...prev, Type: value }));
                        }}
                    >
                        <SelectTrigger className="border-gray-300">
                            <SelectValue
                                placeholder=""
                                className="text-[12px]"
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {content_type.map((type) => (
                                <SelectItem
                                    key={type.id}
                                    value={String(type.id)}
                                >
                                    {type.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <InputError message={errors.Type} />
                </div>
                <div className="grid gap-1">
                    <Label
                        htmlFor="HoldingsID"
                        className="poppins-semibold text-[13px] text-gray-600"
                    >
                        Holdings ID
                    </Label>
                    <Input
                        id="HoldingsID"
                        type="text"
                        name="HoldingsID"
                        required
                        onChange={handleChange}
                        value={String(item.HoldingsID)}
                        className="border-gray-300 text-gray-700"
                    />
                    <InputError message={errors.HoldingsID} />
                </div>
                {!isExistingRecord && (
                    <div className="grid gap-1">
                        <Label
                            htmlFor="batch_id"
                            className="poppins-semibold text-[13px] text-gray-600"
                        >
                            Batch{' '}
                        </Label>
                        <Select
                            value={String(item.batch_id)}
                            onValueChange={(value) => {
                                setErrors((prev) => ({
                                    ...prev,
                                    batch_id: '',
                                }));
                                setItem((prev) => ({
                                    ...prev,
                                    batch_id: value,
                                }));
                            }}
                        >
                            <SelectTrigger className="border-gray-300">
                                <SelectValue
                                    placeholder=""
                                    className="text-[12px]"
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {batches.map((type) => (
                                    <SelectItem
                                        key={type.id}
                                        value={String(type.id)}
                                    >
                                        {type.batch_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <InputError message={errors.batch_id} />
                    </div>
                )}
                <div className="grid gap-1">
                    <Label
                        htmlFor="Contents"
                        className="poppins-semibold text-[13px] text-gray-600"
                    >
                        Content Group{' '}
                    </Label>
                    <Select
                        value={String(item.Contents)}
                        onValueChange={(value) => {
                            setErrors((prev) => ({ ...prev, Contents: '' }));
                            setItem((prev) => ({ ...prev, Contents: value }));
                        }}
                    >
                        <SelectTrigger className="border-gray-300">
                            <SelectValue
                                placeholder=""
                                className="text-[12px]"
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {content_group.map((type) => (
                                <SelectItem
                                    key={type.id}
                                    value={String(type.code)}
                                >
                                    {type.desc}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <InputError message={errors.Contents} />
                </div>
                <div className="grid gap-1">
                    <Label
                        htmlFor="MaterialType"
                        className="poppins-semibold text-[13px] text-gray-600"
                    >
                        Material Type{' '}
                    </Label>
                    <Select
                        value={String(item.MaterialType)}
                        onValueChange={(value) => {
                            setErrors((prev) => ({
                                ...prev,
                                MaterialType: '',
                            }));
                            setItem((prev) => ({
                                ...prev,
                                MaterialType: value,
                            }));
                        }}
                    >
                        <SelectTrigger className="border-gray-300">
                            <SelectValue
                                placeholder=""
                                className="text-[12px]"
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {material_type.map((type) => (
                                <SelectItem
                                    key={type.id}
                                    value={String(type.name)}
                                >
                                    {type.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <InputError message={errors.MaterialType} />
                </div>
                <div className="grid gap-1">
                    <Label
                        htmlFor="Subject"
                        className="poppins-semibold text-[13px] text-gray-600"
                    >
                        Subject
                    </Label>
                    <Input
                        id="Subject"
                        type="text"
                        name="Subject"
                        required
                        onChange={handleChange}
                        value={String(item.Subject)}
                        className="border-gray-300 text-gray-700"
                    />
                    <InputError message={errors.Subject} />
                </div>
                <div className="grid gap-1">
                    <Label
                        htmlFor="JournalTitle"
                        className="poppins-semibold text-[13px] text-gray-600"
                    >
                        Journal Title
                    </Label>
                    <Input
                        id="JournalTitle"
                        type="text"
                        name="JournalTitle"
                        required
                        onChange={handleChange}
                        value={String(item.JournalTitle)}
                        className="border-gray-300 text-gray-700"
                    />
                    <InputError message={errors.JournalTitle} />
                </div>
                <div className="grid gap-1">
                    <Label
                        htmlFor="SubTitle"
                        className="poppins-semibold text-[13px] text-gray-600"
                    >
                        Subtitle
                    </Label>
                    <Input
                        id="SubTitle"
                        type="text"
                        name="SubTitle"
                        required
                        onChange={handleChange}
                        value={String(item.SubTitle)}
                        className="border-gray-300 text-gray-700"
                    />
                    <InputError message={errors.SubTitle} />
                </div>
                <div className="grid gap-1">
                    <Label
                        htmlFor="BroadClass"
                        className="poppins-semibold text-[13px] text-gray-600"
                    >
                        BroadClass
                    </Label>
                    <Input
                        id="BroadClass"
                        type="text"
                        name="BroadClass"
                        required
                        onChange={handleChange}
                        value={String(item.BroadClass)}
                        className="border-gray-300 text-gray-700"
                    />
                    <InputError message={errors.BroadClass} />
                </div>
                <div className="grid gap-1">
                    <Label
                        htmlFor="VolumeNo"
                        className="poppins-semibold text-[13px] text-gray-600"
                    >
                        Volume No
                    </Label>
                    <Input
                        id="VolumeNo"
                        type="text"
                        name="VolumeNo"
                        required
                        onChange={handleChange}
                        value={String(item.VolumeNo)}
                        className="border-gray-300 text-gray-700"
                    />
                    <InputError message={errors.VolumeNo} />
                </div>
                <div className="grid gap-1">
                    <Label
                        htmlFor="IssueNo"
                        className="poppins-semibold text-[13px] text-gray-600"
                    >
                        Issue No
                    </Label>
                    <Input
                        id="IssueNo"
                        type="text"
                        name="IssueNo"
                        required
                        onChange={handleChange}
                        value={String(item.IssueNo)}
                        className="border-gray-300 text-gray-700"
                    />
                    <InputError message={errors.IssueNo} />
                </div>
                <div className="grid gap-1">
                    <Label
                        htmlFor="IssueDate"
                        className="poppins-semibold text-[13px] text-gray-600"
                    >
                        Issue Date
                    </Label>
                    <Input
                        id="IssueDate"
                        type="text"
                        name="IssueDate"
                        required
                        onChange={handleChange}
                        value={String(item.IssueDate)}
                        className="border-gray-300 text-gray-700"
                    />
                    <InputError message={errors.IssueDate} />
                </div>
                <div className="grid gap-1">
                    <Label
                        htmlFor="AgencyCode"
                        className="poppins-semibold text-[13px] text-gray-600"
                    >
                        Agency Code
                    </Label>
                    <Input
                        id="AgencyCode"
                        type="text"
                        name="AgencyCode"
                        required
                        onChange={handleChange}
                        value={String(item.AgencyCode)}
                        className="border-gray-300 text-gray-700"
                    />
                    <InputError message={errors.AgencyCode} />
                </div>
                <div className="mt-4 grid gap-1 md:col-span-2 lg:col-span-4">
                    <Label
                        htmlFor="Abstracts"
                        className="poppins-semibold mb-2 text-gray-600"
                    >
                        Abstracts
                    </Label>
                    <div className="max-h-screen rounded-lg">
                        <TextField
                            id="Abstracts"
                            name="Abstracts"
                            label="Abstracts"
                            value={String(item.Abstracts)}
                            onChange={handleChange}
                            className="text-gray-700"
                        />
                        <InputError message={errors.Abstracts} />
                    </div>
                    <div className="pt-4">
                        <Button
                            className="poppins-bold flex w-fit flex-row items-center justify-center bg-sky-500 text-white"
                            onClick={() => setOpen(true)}
                        >
                            {' '}
                            {uploadSingleRequest.isPending ||
                            updateSingleRequest.isPending ||
                            updateExistingRecord.isPending ? (
                                <Spinner className="mr-1" />
                            ) : (
                                <FaUpload className="mr-1" />
                            )}
                            {item.id == 0 ? 'Add' : 'Update'}{' '}
                            {isExistingRecord ? 'Record' : 'Post'}
                        </Button>
                    </div>
                </div>
            </Card>
            <ConfirmationDialog
                show={open}
                onClose={() => setOpen(false)}
                message={
                    item.id === 0
                        ? 'Are you sure you want to add this request?'
                        : isExistingRecord
                          ? 'Are you sure you want to update this record?'
                          : 'Are you sure you want to update this request?'
                }
                type={2}
                onConfirm={() => {
                    item.id === 0
                        ? uploadSingleRequestFn()
                        : isExistingRecord
                          ? updateExistingRecordFn()
                          : updateSingleRequestFn();
                }}
            />
        </div>
    );
}
SingleUpload.layout = (page: ReactNode) => {
    const pageBreadcrumbs = isValidElement<{
        form_breadcrumbs?: BreadcrumbItem[];
    }>(page)
        ? (page.props.form_breadcrumbs ?? breadcrumbs)
        : breadcrumbs;

    return <AppLayout breadcrumbs={pageBreadcrumbs}>{page}</AppLayout>;
};
