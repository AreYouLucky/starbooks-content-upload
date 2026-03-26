import { ReactNode, useState } from 'react'
import type { BreadcrumbItem } from '@/types';
import { useHandleChange } from '@/hooks/use-handle-change';
import { usePage } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { FaUpload } from "react-icons/fa";
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { LkContentModel, ApprovalRequestModel, BatchModel } from '@/types/model';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, } from "@/components/ui/select"
import { content_type, material_type } from '@/lib/default';
import { Button } from '@/components/ui/button';
import TextField from '@/components/ui/text-field';
import { useUploadSingleRequest, useUpdateSingleRequest } from './upload-hooks';
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
    const { props } = usePage<{ content_group?: LkContentModel[], approval_request?: ApprovalRequestModel, batches?: BatchModel[] }>();
    const content_group = props.content_group ?? []
    const batches = props.batches ?? []
    const approval_request = props.approval_request
    const [open, setOpen] = useState(false);
    const { item, handleChange, setItem, errors, setErrors } = useHandleChange({
        id: approval_request?.id ?? 0,
        Title: approval_request?.Title ?? '',
        Author: approval_request?.Author ?? '',
        HoldingsID: approval_request?.HoldingsID ?? '',
        Contents: approval_request?.Contents ?? '',
        MaterialType: approval_request?.MaterialType ?? '',
        JournalTitle: approval_request?.JournalTitle ?? '',
        Subject: approval_request?.Subject ?? '',
        SubTitle: approval_request?.SubTitle ?? '',
        VolumeNo: approval_request?.VolumeNo ?? '',
        IssueNo: approval_request?.IssueNo ?? '',
        IssueDate: approval_request?.IssueDate ?? '',
        BroadClass: approval_request?.BroadClass ?? '',
        AgencyCode: approval_request?.AgencyCode ?? '',
        Type: approval_request?.Type ?? '',
        batch_id: approval_request?.batch_id ?? '',
        Abstracts: approval_request?.Abstracts ?? '',
    })

    const createFormData = () => {
        const formData = new FormData();
        formData.append("Title", item.Title);
        formData.append("Author", item.Author);
        formData.append("HoldingsID", item.HoldingsID);
        formData.append("Contents", item.Contents);
        formData.append("MaterialType", item.MaterialType);
        formData.append("JournalTitle", item.JournalTitle);
        formData.append("Subject", item.Subject);
        formData.append("SubTitle", item.SubTitle);
        formData.append("VolumeNo", item.VolumeNo);
        formData.append("IssueNo", item.IssueNo);
        formData.append("IssueDate", item.IssueDate);
        formData.append("BroadClass", item.BroadClass);
        formData.append("AgencyCode", item.AgencyCode);
        formData.append("Type", item.Type);
        formData.append("batch_id", String(item.batch_id));
        formData.append("Abstracts", item.Abstracts);
        return formData;
    }
    const uploadSingleRequest = useUploadSingleRequest()
    const uploadSingleRequestFn = () => {
        const formData = createFormData();
        uploadSingleRequest.mutate(formData, {
            onSuccess: (data) => {
                toast.success("Request Successfully Created");
                const newUrl = `/single-upload/${data?.approval_request?.id}/edit`;
                window.history.pushState({}, "", newUrl);
                setOpen(false);
                setItem((prev) => ({
                    ...prev,
                    id: data?.approval_request?.id as number
                }))
            },
            onError: (err) => {
                if (err.response?.data?.errors) {
                    setErrors(err.response.data.errors);
                    toast.error("Check input fields for errors");
                    setOpen(false);
                }
            },
        });
    }

    const updateSingleRequest = useUpdateSingleRequest()
    const updateSingleRequestFn = () => {
        const formData = createFormData();
        updateSingleRequest.mutate({ id: item.id as number, payload: formData }, {
            onSuccess: () => {
                toast.success("Request Successfully Updated");
                setOpen(false);
            },
            onError: (err) => {
                if (err.response?.data?.errors) {
                    setErrors(err.response.data.errors);
                    setOpen(false);
                    toast.error("Check input fields for errors");
                }
            },
        });
    }

    return (
        <div className="space-y-3">
            <section className="relative overflow-hidden rounded-xl p-4 border border-sky-100 md:p-8 bg-sky-500 text-white text-xl font-bold uppercase">
                Upload new content for Shortlisting
            </section>
            <Card className="gap-3 rounded-xl border-sky-100 grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 p-8">
                <div className="grid gap-1 md:col-span-2">
                    <Label htmlFor="Title" className="text-gray-600 poppins-semibold text-[13px]">Title</Label>
                    <Input
                        id="Title"
                        type="text"
                        name="Title"
                        required
                        onChange={handleChange}
                        value={String(item.Title)}
                        className="text-gray-700 border-gray-300"
                    />
                    <InputError message={errors.Title} />
                </div>
                <div className="grid gap-1">
                    <Label htmlFor="Author" className="text-gray-600 poppins-semibold text-[13px]">Author</Label>
                    <Input
                        id="Author"
                        type="text"
                        name="Author"
                        required
                        onChange={handleChange}
                        value={String(item.Author)}
                        className="text-gray-700 border-gray-300"
                    />
                    <InputError message={errors.Author} />
                </div>
                <div className="grid gap-1">
                    <Label htmlFor="type" className="text-gray-600 poppins-semibold text-[13px]">Type</Label>
                    <Select
                        value={String(item.Type)}
                        onValueChange={(value) => {
                            setErrors((prev) => ({ ...prev, Type: '' }))
                            setItem((prev) => ({ ...prev, Type: value }))
                        }
                        }
                    >
                        <SelectTrigger className="border-gray-300">
                            <SelectValue placeholder="" className="text-[12px]" />
                        </SelectTrigger>
                        <SelectContent>
                            {content_type.map((type) => (
                                <SelectItem key={type.id} value={String(type.id)}>
                                    {type.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <InputError message={errors.Type} />
                </div>
                <div className="grid gap-1 ">
                    <Label htmlFor="HoldingsID" className="text-gray-600 poppins-semibold text-[13px]">Holdings ID</Label>
                    <Input
                        id="HoldingsID"
                        type="text"
                        name="HoldingsID"
                        required
                        onChange={handleChange}
                        value={String(item.HoldingsID)}
                        className="text-gray-700 border-gray-300"
                    />
                    <InputError message={errors.HoldingsID} />
                </div>
                <div className="grid gap-1">
                    <Label htmlFor="batch_id" className="text-gray-600 poppins-semibold text-[13px]">Batch </Label>
                    <Select
                        value={String(item.batch_id)}
                        onValueChange={(value) => {
                            setErrors((prev) => ({ ...prev, batch_id: '' }))
                            setItem((prev) => ({ ...prev, batch_id: value }))
                        }
                        }
                    >
                        <SelectTrigger className="border-gray-300">
                            <SelectValue placeholder="" className="text-[12px]" />
                        </SelectTrigger>
                        <SelectContent>
                            {batches.map((type) => (
                                <SelectItem key={type.id} value={String(type.id)}>
                                    {type.batch_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <InputError message={errors.batch_id} />
                </div>
                <div className="grid gap-1">
                    <Label htmlFor="Contents" className="text-gray-600 poppins-semibold text-[13px]">Content Group </Label>
                    <Select
                        value={String(item.Contents)}
                        onValueChange={(value) => {
                            setErrors((prev) => ({ ...prev, Contents: '' }))
                            setItem((prev) => ({ ...prev, Contents: value }))
                        }
                        }
                    >
                        <SelectTrigger className="border-gray-300">
                            <SelectValue placeholder="" className="text-[12px]" />
                        </SelectTrigger>
                        <SelectContent>
                            {content_group.map((type) => (
                                <SelectItem key={type.id} value={String(type.code)}>
                                    {type.desc}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <InputError message={errors.Contents} />
                </div>
                <div className="grid gap-1">
                    <Label htmlFor="MaterialType" className="text-gray-600 poppins-semibold text-[13px]">Material Type </Label>
                    <Select
                        value={String(item.MaterialType)}
                        onValueChange={(value) => {
                            setErrors((prev) => ({ ...prev, MaterialType: '' }))
                            setItem((prev) => ({ ...prev, MaterialType: value }))
                        }
                        }
                    >
                        <SelectTrigger className="border-gray-300">
                            <SelectValue placeholder="" className="text-[12px]" />
                        </SelectTrigger>
                        <SelectContent>
                            {material_type.map((type) => (
                                <SelectItem key={type.id} value={String(type.name)}>
                                    {type.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <InputError message={errors.MaterialType} />
                </div>
                <div className="grid gap-1">
                    <Label htmlFor="Subject" className="text-gray-600 poppins-semibold text-[13px]">Subject</Label>
                    <Input
                        id="Subject"
                        type="text"
                        name="Subject"
                        required
                        onChange={handleChange}
                        value={String(item.Subject)}
                        className="text-gray-700 border-gray-300"
                    />
                    <InputError message={errors.Subject} />
                </div>
                <div className="grid gap-1">
                    <Label htmlFor="JournalTitle" className="text-gray-600 poppins-semibold text-[13px]">Journal Title</Label>
                    <Input
                        id="JournalTitle"
                        type="text"
                        name="JournalTitle"
                        required
                        onChange={handleChange}
                        value={String(item.JournalTitle)}
                        className="text-gray-700 border-gray-300"
                    />
                    <InputError message={errors.JournalTitle} />
                </div>
                <div className="grid gap-1">
                    <Label htmlFor="SubTitle" className="text-gray-600 poppins-semibold text-[13px]">Subtitle</Label>
                    <Input
                        id="SubTitle"
                        type="text"
                        name="SubTitle"
                        required
                        onChange={handleChange}
                        value={String(item.SubTitle)}
                        className="text-gray-700 border-gray-300"
                    />
                    <InputError message={errors.SubTitle} />
                </div>
                <div className="grid gap-1">
                    <Label htmlFor="BroadClass" className="text-gray-600 poppins-semibold text-[13px]">BroadClass</Label>
                    <Input
                        id="BroadClass"
                        type="text"
                        name="BroadClass"
                        required
                        onChange={handleChange}
                        value={String(item.BroadClass)}
                        className="text-gray-700 border-gray-300"
                    />
                    <InputError message={errors.BroadClass} />
                </div>
                <div className="grid gap-1">
                    <Label htmlFor="VolumeNo" className="text-gray-600 poppins-semibold text-[13px]">Volume No</Label>
                    <Input
                        id="VolumeNo"
                        type="text"
                        name="VolumeNo"
                        required
                        onChange={handleChange}
                        value={String(item.VolumeNo)}
                        className="text-gray-700 border-gray-300"
                    />
                    <InputError message={errors.VolumeNo} />
                </div>
                <div className="grid gap-1">
                    <Label htmlFor="IssueNo" className="text-gray-600 poppins-semibold text-[13px]">Issue No</Label>
                    <Input
                        id="IssueNo"
                        type="text"
                        name="IssueNo"
                        required
                        onChange={handleChange}
                        value={String(item.IssueNo)}
                        className="text-gray-700 border-gray-300"
                    />
                    <InputError message={errors.IssueNo} />
                </div>
                <div className="grid gap-1">
                    <Label htmlFor="IssueDate" className="text-gray-600 poppins-semibold text-[13px]">Issue Date</Label>
                    <Input
                        id="IssueDate"
                        type="date"
                        name="IssueDate"
                        required
                        onChange={handleChange}
                        value={String(item.IssueDate)}
                        className="text-gray-700 border-gray-300"
                    />
                    <InputError message={errors.IssueDate} />
                </div>
                <div className="grid gap-1">
                    <Label htmlFor="AgencyCode" className="text-gray-600 poppins-semibold text-[13px]">Agency Code</Label>
                    <Input
                        id="AgencyCode"
                        type="text"
                        name="AgencyCode"
                        required
                        onChange={handleChange}
                        value={String(item.AgencyCode)}
                        className="text-gray-700 border-gray-300"
                    />
                    <InputError message={errors.AgencyCode} />
                </div>
                <div className='lg:col-span-4 md:col-span-2 grid gap-1 mt-4'>
                    <Label htmlFor="Abstracts" className="text-gray-600 poppins-semibold mb-2">Abstracts</Label>
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
                    <div className=" pt-4">
                        <Button className="bg-sky-500 text-white w-fit poppins-bold flex flex-row items-center justify-center"
                            onClick={() => setOpen(true)}
                        > {uploadSingleRequest.isPending || updateSingleRequest.isPending ? <Spinner className="mr-1" /> : <FaUpload className="mr-1" />}
                            {item.id == 0 ? 'Add' : 'Update'} Post
                        </Button>
                    </div>
                </div>
            </Card>
            <ConfirmationDialog show={open} onClose={()=>setOpen(false)} message={item.id === 0 ? "Are you sure you want to add this request?" : "Are you sure you want to update this request?"} type={2} onConfirm={()=>{item.id === 0 ? uploadSingleRequestFn() : updateSingleRequestFn()}}/>
        </div>
    )
}
SingleUpload.layout = (page: ReactNode) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
