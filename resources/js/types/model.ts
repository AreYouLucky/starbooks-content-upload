export type TimestampFields = {
    created_at?: string;
    updated_at?: string;
};

export type NullableTimestampFields = {
    created_at: string | null;
    updated_at: string | null;
};

export type UserModel = TimestampFields & {
    id: number;
    username: string;
    full_name: string;
    delivery_unit: string;
    role: string;
    designation: string;
    task_description: string;
    password?: string;
    remember_token: string | null;
    two_factor_secret: string | null;
    two_factor_recovery_codes: string | null;
    two_factor_confirmed_at: string | null;
};

export type BatchModel = TimestampFields & {
    id: number;
    batch_name: string;
    content_source: string;
    batch_description: string;
    target_shortlist_date?: string;
    shortlisted_date?: string;
    target_initial_review_date?: string;
    initial_reviewed_date?: string;
    target_quality_approval_date?: string;
    quality_approval_date?: string;
    target_published_date: string;
    published_date?: string;
    status?: string;
    year?: string;
    quarter?: string;
    start_date?: string;
    is_dost?: boolean;
    pending?: number;
    reviewed?: number;
    disapproved?: number;
    rejected?: number;
    approved?: number;
};

export type RequestModel = TimestampFields & {
    id?: number;
    approval_status?: number;
    HoldingsID?: string | null;
    MaterialType?: string | null;
    Title?: string | null;
    FileName?: string | null;
    SubTitle?: string | null;
    SeriesTitle?: string | null;
    BibliographicNote?: string | null;
    Contents?: string | null;
    Abstracts?: string | null;
    JournalTitle?: string | null;
    AgencyCode?: string | null;
    BroadClass?: string | null;
    VolumeNo?: string | null;
    IssueNo?: string | null;
    IssueDate?: string | null;
    Author?: string | null;
    Type?: string | null;
    Subject?: string | null;
    EditDate?: string | null;
    uploaded_by?: number | null;
    batch_id?: number | null;
    is_active?: boolean;
    batch?: BatchModel;
    initial_reviewer_id?: number | null;
    quality_assurance_reviewer_id?: number | null;
    initial_reviewed_assigned_date?: string | null;
    quality_assurance_assigned_date?: string | null;
    initial_reviewer?: Pick<UserModel, 'id' | 'full_name' | 'role'> | null;
    quality_assurance_reviewer?: Pick<UserModel, 'id' | 'full_name' | 'role'> | null;
};

export type ApprovalMultimediaModel = TimestampFields & {
    id: number;
    HoldingsID: string;
    FileName: string;
    FileType: string;
    Extension: string;
    DateModified: string;
    NumPages: string;
};

export type LogModel = TimestampFields & {
    id: number;
    request_id: number;
    user_id: number;
    batch_id: number;
    is_approved: boolean | null;
    remarks: string | null;
    approval_status: number;
};

export type LogDetailModel = TimestampFields & {
    id: number;
    approval_status: number;
    request_id: number;
    log_id: number;
    user_id: number;
    is_passed: boolean | null;
    description: string | null;
    remarks: string | null;
};

export type LkContentModel = {
    id: number;
    code: string;
    desc: string;
    vol: string;
    issue: string;
};

export type RecordModel = {
    id: number;
    HoldingsID: string | null;
    MaterialType: string | null;
    Title: string | null;
    SubTitle: string | null;
    SeriesTitle: string | null;
    BibliographicNote: string | null;
    Contents: string | null;
    Abstracts: string | null;
    JournalTitle: string | null;
    AgencyCode: string | null;
    BroadClass?: string | null;
    PhysicalExtension: string | null;
    VolumeNo: string | null;
    IssueNo: string | null;
    IssueDate: string | null;
    Author: string | null;
    AuthorStmt: string | null;
    Type: string | null;
    Subject: string | null;
    Publication: string | null;
    EditDate: string | null;
    date_uploaded: string | null;
    attribution: string | null;
    uploaded_by: number | null;
    url: string | null;
};
