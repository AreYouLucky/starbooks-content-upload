import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { memo, useCallback } from "react"
import { Input } from "@/components/ui/input";
import InputError from "@/components/input-error";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/text-area";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"
import { useCreateBatch, useUpdateBatch } from "./batches-hooks";
import { useHandleChange } from "@/hooks/use-handle-change";
import { useEffect } from "react";
import { BatchModel } from "@/types/model";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, } from "@/components/ui/select"
import { generateYears } from "./defaults";
import { quarters } from "@/lib/default";
import { Checkbox } from "@/components/ui/checkbox";


type BatchFormProps = {
    show: boolean;
    onClose: () => void;
    data: BatchModel;
}

function BatchForm(props: BatchFormProps) {
    const { item, errors, setItem, handleChange, setErrors } = useHandleChange(
        {
            id: props.data?.id || 0,
            batch_name: props.data?.batch_name || '',
            year: props.data?.year || '',
            quarter: props.data?.quarter || '',
            batch_description: props.data?.batch_description || '',
            content_source: props.data?.content_source || '',
            start_date: props.data?.start_date
                ? props.data.start_date.split(' ')[0]
                : '',
            is_dost: props.data?.is_dost || false,
        }
    );

    const createFormData = () => {
        const formData = new FormData();
        formData.append("batch_name", item.batch_name);
        formData.append("content_source", item.content_source);
        formData.append("batch_description", item.batch_description);
        formData.append("start_date", item.start_date);
        formData.append("year", item.year);
        formData.append("quarter", item.quarter);
        formData.append("is_dost", item.is_dost ? "1" : "0");
        return formData;
    }

    const createBatch = useCreateBatch();
    const createBatchFn = () => {
        const formData = createFormData();
        createBatch.mutate(formData, {
            onSuccess: () => {
                clearFields();
                toast.success("Batch Successfully Created");
                props.onClose();
            },
            onError: (err) => {
                if (err.response?.data?.errors) {
                    setErrors(err.response.data.errors);
                    toast.error("Check input fields for errors");
                }
            },
        });
    }

    const updateBatch = useUpdateBatch();
    const updateBatchFn = () => {
        console.log(item);
        const formData = createFormData();
        updateBatch.mutate({ id: item.id, payload: formData }, {
            onSuccess: () => {
                clearFields();
                toast.success("Batch Successfully Updated");
                props.onClose();
            },
            onError: (err) => {
                if (err.response?.data?.errors) {
                    setErrors(err.response.data.errors);
                    toast.error("Check input fields for errors");
                }
            },
        });
    }



    const clearFields = useCallback(() => {
        setItem({ id: 0, batch_name: '', batch_description: '', content_source: "", year: "", quarter: "", start_date: "", is_dost: false });
        setErrors({});
    }, [setItem, setErrors]);

    useEffect(() => {
        if (props.data?.id === 0) {
            clearFields();
        } else if (props.data) {
            setItem({
                id: props.data.id as number,
                batch_name: props.data.batch_name,
                batch_description: props.data.batch_description,
                content_source: props.data.content_source,
                year: props.data.year as string,
                quarter: props.data.quarter as string,
                start_date: props.data.start_date as string,
                is_dost: props.data.is_dost as boolean
            });
        }
    }, [props.data, setItem, clearFields]);

    const years = generateYears();
    console.log(props.data)
    console.log(item)

    return (
        <Dialog open={props.show} onOpenChange={props.onClose}>
            <DialogContent className="text-gray-600 p-10 bg-white max-w-6xl w-full ">
                <DialogHeader>
                    <DialogTitle className="text-sky-600 poppins-bold text-center">{props.data?.id === 0 ? 'Add' : 'Edit'} Batch Form </DialogTitle>
                    <DialogDescription className="text-xs text-center">
                        Fill all the fields to proceed
                    </DialogDescription>
                </DialogHeader>
                <div className="w-full flex flex-col pb-4 pt-2 gap-4 ">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="grid gap-1">
                            <Label htmlFor="batch_id" className="text-gray-600 poppins-semibold text-[13px]">Quarter </Label>
                            <Select
                                value={String(item.quarter)}
                                onValueChange={(value) => {
                                    setErrors((prev) => ({ ...prev, quarter: '' }))
                                    setItem((prev) => ({ ...prev, quarter: value }))
                                }
                                }
                            >
                                <SelectTrigger className="border-sky-300">
                                    <SelectValue placeholder="" className="text-[12px]" />
                                </SelectTrigger>
                                <SelectContent>
                                    {quarters.map((type, index) => (
                                        <SelectItem key={index} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <InputError message={errors.quarter} />
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="batch_id" className="text-gray-600 poppins-semibold text-[13px]">Year </Label>
                            <Select
                                value={String(item.year)}
                                onValueChange={(value) => {
                                    setErrors((prev) => ({ ...prev, year: '' }))
                                    setItem((prev) => ({ ...prev, year: value }))
                                }
                                }
                            >
                                <SelectTrigger className="border-sky-300">
                                    <SelectValue placeholder="" className="text-[12px]" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map((type, index) => (
                                        <SelectItem key={index} value={String(type)}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <InputError message={errors.year} />
                        </div>

                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="content_source" className="text-gray-600">Content Source</Label>
                        <Input
                            id="content_source"
                            type="text"
                            name="content_source"
                            required
                            onChange={handleChange}
                            value={String(item.content_source)}
                            className="text-gray-600 "
                        />
                        <InputError message={errors.content_source as string} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="start_date" className="text-gray-600">Start Date</Label>
                        <Input
                            id="start_date"
                            type="date"
                            name="start_date"
                            required
                            onChange={handleChange}
                            value={props.data?.start_date?.split(' ')[0] || ''}
                            className="text-gray-600 "
                        />
                        <InputError message={errors.start_date as string} />
                    </div>
                    <div className="grid gap-2 ">
                        <Label htmlFor="batch_description" className="text-gray-600">Description</Label>
                        <Textarea
                            id="batch_description"
                            name="batch_description"
                            required
                            onChange={handleChange}
                            value={String(item.batch_description)}
                            className="text-gray-600 "
                        />
                        <InputError message={errors.batch_description as string} />
                    </div>
                    <div>
                        <label
                            htmlFor="showPassword"
                            className="flex cursor-pointer items-center gap-3"
                        >
                            <Checkbox
                                id="showPassword"
                                checked={Boolean(item.is_dost)}
                                onCheckedChange={(checked: boolean) =>
                                    setItem((prev) => ({ ...prev, is_dost: checked }))
                                }
                                className="size-5 rounded-md border-slate-300 data-[state=checked]:border-sky-600 data-[state=checked]:bg-sky-500"
                            />
                            <span className="text-xs font-medium text-slate-600">
                                DOST Agency?
                            </span>
                        </label>
                    </div>
                </div>
                <div className="w-full flex justify-start gap-2">
                    <Button className="bg-sky-600" onClick={() => props.data?.id === 0 ? createBatchFn() : updateBatchFn()}
                        disabled={createBatch.isPending || updateBatch.isPending} >
                        {(createBatch.isPending || updateBatch.isPending) ? "Saving..." : props.data?.id === 0 ? "Add" : "Update"}
                    </Button>
                    <Button className="text-gray-800 border bg-gray-50 text-sm" onClick={props.onClose}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
export default memo(BatchForm)
