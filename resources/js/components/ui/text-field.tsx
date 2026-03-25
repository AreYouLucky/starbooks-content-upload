import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
    ClassicEditor,
    Alignment,
    Autoformat,
    Bold,
    Code,
    Italic,
    Strikethrough,
    Subscript,
    Superscript,
    Underline,
    BlockQuote,
    CloudServices,
    CodeBlock,
    Essentials,
    FindAndReplace,
    Font,
    Heading,
    Highlight,
    HorizontalLine,
    GeneralHtmlSupport,
    AutoImage,
    Image,
    ImageCaption,
    ImageInsert,
    ImageResize,
    ImageStyle,
    ImageToolbar,
    ImageUpload,
    Base64UploadAdapter,
    PictureEditing,
    Indent,
    IndentBlock,
    AutoLink,
    Link,
    LinkImage,
    List,
    ListProperties,
    TodoList,
    MediaEmbed,
    Mention,
    PageBreak,
    Paragraph,
    PasteFromOffice,
    RemoveFormat,
    SpecialCharacters,
    SpecialCharactersEssentials,
    Table,
    TableCaption,
    TableCellProperties,
    TableColumnResize,
    TableProperties,
    TableToolbar,
    TextTransformation,
    WordCount,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";

interface TextFieldProps {
    id?: string;
    name?: string;
    label?: string;
    error?: string;
    className?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const TextField = ({ value, onChange, className, name }: TextFieldProps) => {
    return (
        <div className={className}>
            <CKEditor
                editor={ClassicEditor}
                data={value}
                onChange={(_, editor) => {
                    const fakeEvent = {
                        target: { name, value: editor.getData() }
                    } as unknown as React.ChangeEvent<HTMLInputElement>

                    onChange(fakeEvent)
                }}
                config={{
                    licenseKey: 'GPL',
                    toolbar: {
                        shouldNotGroupWhenFull: true, items: [
                            "undo", "redo", "|", "findAndReplace", "selectAll", "|",
                            "heading", "|",
                            "bold", "italic", "underline", "strikethrough",
                            "fontSize", "fontFamily", "fontColor", "fontBackgroundColor", "highlight", "superscript", "subscript", "code", "|",
                            "removeFormat", "|",
                            "alignment", "|",
                            "bulletedList", "numberedList", "todoList", "|", "outdent", "indent",
                            "link", "uploadImage", "insertTable", "blockQuote", "mediaEmbed", "codeBlock", "pageBreak", "horizontalLine", "specialCharacters",
                        ]
                    },
                    heading: {
                        options: [
                            { model: "paragraph", title: "Paragraph", class: "ck-heading_paragraph" },
                            { model: "heading1", view: "h1", title: "Heading 1", class: "ck-heading_heading1" },
                            { model: "heading2", view: "h2", title: "Heading 2", class: "ck-heading_heading2" },
                            { model: "heading3", view: "h3", title: "Heading 3", class: "ck-heading_heading3" },
                            { model: "heading4", view: "h4", title: "Heading 4", class: "ck-heading_heading4" },
                        ]
                    },
                    image: {
                        resizeOptions: [
                            { name: "resizeImage:original", label: "Default image width", value: null },
                            { name: "resizeImage:50", label: "50% page width", value: "50" },
                            { name: "resizeImage:75", label: "75% page width", value: "75" },
                        ],
                        toolbar: ["imageTextAlternative", "toggleImageCaption", "|", "imageStyle:inline", "imageStyle:wrapText", "imageStyle:breakText", "|", "resizeImage"]
                    },
                    link: { addTargetToExternalLinks: true, defaultProtocol: "https://" },
                    table: { contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"] },
                    plugins: [
                        Alignment, Autoformat, AutoImage, AutoLink, BlockQuote, Bold, CloudServices, Code, CodeBlock, Essentials, FindAndReplace, Font, GeneralHtmlSupport, Heading, Highlight, HorizontalLine, Image, ImageCaption, ImageInsert, ImageResize, ImageStyle, ImageToolbar, ImageUpload, Base64UploadAdapter, Indent, IndentBlock, Italic, Link, LinkImage, List, ListProperties, MediaEmbed, Mention, PageBreak, Paragraph, PasteFromOffice, PictureEditing, RemoveFormat, SpecialCharacters, SpecialCharactersEssentials, Strikethrough, Subscript, Superscript, Table, TableCaption, TableCellProperties, TableColumnResize, TableProperties, TableToolbar, TextTransformation, TodoList, Underline, WordCount
                    ],
                    initialData: value,
                }}
            />
        </div>
    );
};

export default TextField;
