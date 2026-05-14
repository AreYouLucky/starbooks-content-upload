import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, } from '@/components/ui/dialog';
import ContentViewer from '@/components/custom/content/content-viewer';
import { Button } from '../ui/button';
import type { ApprovalRequestModel } from '@/types/model';
import type { JSX } from 'react';

type BatchFormProps = {
    show: boolean;
    onClose: () => void;
    data: ApprovalRequestModel | null;
};

export default function ViewContent(props: BatchFormProps): JSX.Element {
    return (
        <Dialog
            open={props.show}
            onOpenChange={()=>{}}
        >
            <DialogContent
                className="max-h-[94vh] scroll-slim w-[96vw] max-w-[96vw] overflow-y-auto  text-gray-600 shadow-2xl xl:max-w-420 px-4 bg-white py-6"
            >
                <DialogHeader className="space-y-2 border-b border-slate-100 pb-5 sr-only">
                    <DialogTitle className="poppins-bold text-center text-2xl text-sky-600 sm:text-left">
                        Content Preview
                    </DialogTitle>
                    <DialogDescription className="text-center text-sm text-slate-500 sm:text-left">
                        Review the metadata and preview the uploaded media in one workspace.
                    </DialogDescription>
                </DialogHeader>
                <div className="">
                    {props.data ? (
                        <ContentViewer fields={props.data} />
                    ) : (
                        <div className="flex min-h-80 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-500">
                            Select a record to preview its content.
                        </div>
                    )}
                </div>
                <Button className='rounded-full px-2.5 w-fit h-fit py-1 absolute top-3 right-3 font-bold ' onClick={props.onClose}>x</Button>
            </DialogContent>
        </Dialog>
    );
}
