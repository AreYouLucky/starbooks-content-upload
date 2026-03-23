import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { memo, useCallback } from "react"
import { Input } from "@/components/ui/input";
import InputError from "@/components/input-error";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/text-area";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"
import { useCreateBatch } from "./batches-hooks";
import { useHandleChange } from "@/hooks/use-handle-change";
import { useEffect } from "react";
import { BatchModel } from "@/types/model";



type BatchFormProps = {
    show: boolean;
    onClose: () => void;
    data?: BatchModel;
}

function BatchForm(props: BatchFormProps) {
    const { item, errors, setItem, handleChange, setErrors } = useHandleChange({ id: 0, batch_name: '', batch_description: '', target_published_date: " ", content_source: "" });

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
                props.onClose();
                toast.success("Batch Successfully Created");
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
        setItem({ id: 0, batch_name: '', batch_description: '', target_published_date: " ", content_source: "" });
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
            <DialogContent className="text-gray-600 p-10 bg-white ">
                <DialogHeader>
                    <DialogTitle className="text-sky-600 poppins-bold text-center">{props.data?.id === 0 ? 'Add' : 'Edit'} Batch Form </DialogTitle>
                    <DialogDescription className="text-xs text-center">
                        Fill all the fields to proceed
                    </DialogDescription>
                </DialogHeader>
                <div className="w-full flex flex-col pb-4 pt-2 gap-4 ">
                    <div className="grid gap-2">
                        <Label htmlFor="batch_name" className="text-gray-600 poppins-semibold">Title</Label>
                        <Input
                            id="batch_name"
                            type="text"
                            name="batch_name"
                            required
                            onChange={handleChange}
                            value={String(item.batch_name)}
                            className="text-gray-600 border-gray-300"
                        />
                        <InputError message={errors.batch_name as string} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                            <Label htmlFor="batch_name" className="text-gray-600 poppins-semibold">Title</Label>
                            <Input
                                id="batch_name"
                                type="text"
                                name="batch_name"
                                required
                                onChange={handleChange}
                                value={String(item.batch_name)}
                                className="text-gray-600 border-gray-300"
                            />
                            <InputError message={errors.batch_name as string} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="batch_name" className="text-gray-600 poppins-semibold">Title</Label>
                            <Input
                                id="batch_name"
                                type="text"
                                name="batch_name"
                                required
                                onChange={handleChange}
                                value={String(item.batch_name)}
                                className="text-gray-600 border-gray-300"
                            />
                            <InputError message={errors.batch_name as string} />
                        </div>

                    </div>
                    <div className="grid gap-2 ">
                        <Label htmlFor="batch_description" className="text-gray-600 poppins-semibold">Description</Label>
                        <Textarea
                            id="batch_description"
                            name="batch_description"
                            required
                            onChange={handleChange}
                            value={String(item.batch_description)}
                            className="text-gray-600 border-gray-300"
                        />
                        <InputError message={errors.batch_description as string} />
                    </div>
                </div>
                <div className="w-full flex justify-start gap-2">
                    <Button className="bg-teal-600" disabled={createBatch.isPending}  >
                        {(createBatch.isPending) ? "Saving..." : props.data?.id === 0 ? "Add" : "Update"}
                    </Button>
                    <Button className="text-gray-50 bg-gray-700 text-sm" onClick={props.onClose}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
export default memo(BatchForm)
