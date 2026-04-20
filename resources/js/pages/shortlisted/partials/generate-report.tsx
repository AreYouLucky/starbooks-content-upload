import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import InputError from '@/components/input-error'
import { useHandleChange } from '@/hooks/use-handle-change'
import { quarters } from '@/lib/default'
import { generateYears } from '@/pages/batches/partials/defaults'
type Props = {
    show: boolean;
    onClose: () => void;

}
export default function GenerateReport(props: Props) {
    const { item, errors, setItem,  setErrors } = useHandleChange({
        quarter: '',
        year: '',
    })
    const years = generateYears();

    return (
        <Dialog open={props.show} onOpenChange={props.onClose}>
            <DialogContent className="text-gray-600 p-10 bg-white max-w-6xl w-full ">
                <DialogHeader>
                    <DialogTitle className="text-sky-600 poppins-bold text-center">Generate Report </DialogTitle>
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
                </div>
            </DialogContent>
        </Dialog>
    )
}
