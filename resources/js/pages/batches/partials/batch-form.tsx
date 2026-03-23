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
            batch_description: props.data?.batch_description || '',
            target_published_date: props.data?.target_published_date || new Date().toISOString().split('T')[0], content_source: ""
        }
    );

    const createFormData = () => {
        const formData = new FormData();
        formData.append("batch_name", item.batch_name);
        formData.append("content_source", item.content_source);
        formData.append("batch_description", item.batch_description);
        formData.append("target_published_date", item.target_published_date);
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
        setItem({ id: 0, batch_name: '', batch_description: '', target_published_date: new Date().toISOString().split('T')[0], content_source: "" });
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
                target_published_date: props.data.target_published_date,
                content_source: props.data.content_source
            });
        }
    }, [props.data, setItem, clearFields]);

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
                    <div className="grid gap-2">
                        <Label htmlFor="batch_name" className="text-gray-600">Title</Label>
                        <Input
                            id="batch_name"
                            type="text"
                            name="batch_name"
                            required
                            onChange={handleChange}
                            value={String(item.batch_name)}
                            className="text-gray-600 "
                        />
                        <InputError message={errors.batch_name as string} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
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
                            <Label htmlFor="target_published_date" className="text-gray-600">Target Published Date</Label>
                            <Input
                                id="target_published_date"
                                type="date"
                                name="target_published_date"
                                required
                                onChange={handleChange}
                                value={item.target_published_date}
                                className="text-gray-600 "
                            />
                            <InputError message={errors.target_published_date as string} />
                        </div>

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
