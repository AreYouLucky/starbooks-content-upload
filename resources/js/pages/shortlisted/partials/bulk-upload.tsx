import { ReactNode, useState } from 'react'
import type { BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DownloadCloud } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { LkContentModel, BatchModel } from '@/types/model';
import { content_type } from '@/lib/default';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, } from "@/components/ui/select"
import { FaUpload } from "react-icons/fa";
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { useHandleChange } from '@/hooks/use-handle-change';
import FileUpload from '@/components/ui/file-upload';
import { useUploadBulkRequest } from './upload-hooks';
import { Spinner } from '@/components/ui/spinner';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import { toast } from "sonner";

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

export default function BulkUpload() {
    const { props } = usePage<{ content_group?: LkContentModel[], batches?: BatchModel[] }>();
    const { content_group, batches } = props
    const { item, handleChange, setItem, errors, setErrors } = useHandleChange({
        Type: '',
        batch_id: "",
        Contents: "",
        record_file: "" as File | string,
        multimedia_file: "" as File | string
    });
    const [open, setOpen] = useState(false);

    const createFormData = () => {
        const formData = new FormData();
        formData.append("Type", item.Type);
        formData.append("batch_id", item.batch_id);
        formData.append("Contents", item.Contents);
        if (item.record_file instanceof File) {
            formData.append("record_file", item.record_file);
        }
        if (item.multimedia_file instanceof File) {
            formData.append("multimedia_file", item.multimedia_file);
        }
        return formData;
    }
    const uploadBulkRequest = useUploadBulkRequest();
    const uploadBulkRequestFn = () => {
        const payload = createFormData();
        uploadBulkRequest.mutate(payload, {
            onSuccess: () => {
                setItem({
                    Type: '',
                    batch_id: "",
                    Contents: "",
                    record_file: "" as File | string,
                    multimedia_file: "" as File | string
                });
                setOpen(true)
            },
            onError: (error) => {
                if (error.response?.data?.errors) {
                    setErrors(error.response.data.errors);
                }
                if (error.response?.data?.error) {
                    toast.error(error.response.data.error);
                }
                console.log(error.response);
                if (error.response?.data?.message) {
                    toast.error(error.response.data.message);
                }
            }
        });
    }

    const downloadFiles = () => {
        const files = [
            "/storage/templates/records_template.csv",
            "/storage/templates/multimedia_template.csv"
        ];

        files.forEach((file) => {
            const link = document.createElement("a");
            link.href = file;
            link.download = "";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    };
    return (
        <div className="space-y-3">
            <section className="relative overflow-hidden rounded-xl p-4 border border-sky-100 md:p-8 bg-sky-500 text-white flex flex-row gap-8 items-center">
                <div>
                    <h1 className="text-lg font-extrabold tracking-tight md:text-xl uppercase">Bulk upload new content </h1>
                    <p className='text-sm'>Click the Download Template button and use the provided template for uploading data. While you can rename the file, ensure that you do not modify any data fields within the template. Additionally, check for special characters before uploading to avoid potential issues. After completing the data entry, make sure to select the appropriate content group and specify the type of content.</p>
                </div>
                <div className=''>
                    <Button className="bg-white text-black hover:text-white hover:scale-105" onClick={downloadFiles}> <DownloadCloud />Download Template</Button>
                </div>
            </section>
            <Card>
                <CardContent>
                    <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4">
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
                                    {batches?.map((type) => (
                                        <SelectItem key={type.id} value={String(type.id)}>
                                            {type.batch_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <InputError message={errors.batch_id} />
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
                                    {content_group?.map((type) => (
                                        <SelectItem key={type.id} value={String(type.code)}>
                                            {type.desc}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <InputError message={errors.Contents} />
                        </div>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                        <div className="grid gap-1">
                            <Label htmlFor="record_file" className="text-gray-600 poppins-semibold text-[13px]">Record File</Label>
                            <FileUpload id="record_file" name="record_file" onChange={handleChange} />
                            <InputError message={errors.record_file} />
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="multimedia_file" className="text-gray-600 poppins-semibold text-[13px]">Media File</Label>
                            <FileUpload id="multimedia_file" name="multimedia_file" onChange={handleChange} />
                            <InputError message={errors.multimedia_file} />
                        </div>
                        <div>
                            <Button className='bg-sky-500 text-white hover:scale-105 hover:text-white' onClick={uploadBulkRequestFn} disabled={uploadBulkRequest.isPending}>
                                {uploadBulkRequest.isPending ? <Spinner /> : <FaUpload />}Upload
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <ConfirmationDialog type={1} show={open} onClose={() => setOpen(false)} message='Requests Successfully Uploaded!' />
        </div>
    )
}

BulkUpload.layout = (page: ReactNode) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;

