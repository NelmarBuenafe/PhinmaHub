import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const requiredTables = {
  profiles:
    "id,email,first_name,middle_name,last_name,avatar_url,school_id,requested_role,approved_role,account_status,created_at,updated_at",
  student_profiles:
    "user_id,student_id,campus,program,year_level,section,created_at,updated_at",
  teacher_profiles:
    "user_id,employee_id,campus,department,position,created_at,updated_at",
  courses:
    "id,teacher_id,course_code,title,description,category,difficulty,thumbnail_url,visibility,status,created_at,updated_at",
  enrollments:
    "id,course_id,student_id,status,enrolled_at,created_at,updated_at",
  course_modules: "id,course_id,title,description,display_position",
  lessons: "id,module_id,title,is_published",
  lesson_progress: "id,student_id,lesson_id,is_completed",
  assignments: "id,course_id,title,is_published",
  submissions: "id,assignment_id,student_id,status",
  submission_attachments:
    "id,submission_id,student_id,assignment_id,type,file_name,storage_path,mime_type,file_size,external_url,created_at",
  announcements: "id,author_id,course_id,audience,title,body,published_at",
  notifications: "id,recipient_id,type,title,message,source_type,source_id,course_id,is_read,read_at,created_at",
  study_tools: "id,creator_id,title,tool_type,url,is_active",
  contact_messages: "id,sender_name,sender_email,subject,message,status",
  audit_logs: "id,actor_id,action,entity_type,entity_id,metadata,created_at",
  course_categories:
    "id,name,description,color,icon,is_active,created_at,updated_at",
  lesson_materials:
    "id,lesson_id,material_type,title,description,storage_path,external_url,file_name,mime_type,file_size,sort_order,created_at,updated_at",
};

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

let failed = false;

for (const [table, columns] of Object.entries(requiredTables)) {
  const { count, error } = await supabase
    .from(table)
    .select(columns, { count: "exact", head: true });

  const result = {
    table,
    available: !error,
    rowCount: count ?? null,
  };

  if (error) {
    failed = true;
    result.error = {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      status: error.status,
      text: String(error),
    };

    result.columns = {};
    for (const column of columns.split(",")) {
      const columnResult = await supabase
        .from(table)
        .select(column, { head: true });
      result.columns[column] = columnResult.error
        ? columnResult.error.message || String(columnResult.error)
        : "available";
    }
  }

  console.log(JSON.stringify(result));
}

const { data: materialsBucket, error: bucketError } =
  await supabase.storage.getBucket("lesson-materials");
const bucketReady =
  !bucketError &&
  materialsBucket?.public === false &&
  materialsBucket?.file_size_limit === 10 * 1024 * 1024;

console.log(
  JSON.stringify({
    storageBucket: "lesson-materials",
    available: !bucketError,
    private: materialsBucket?.public === false,
    fileSizeLimit: materialsBucket?.file_size_limit ?? null,
  }),
);

if (!bucketReady) failed = true;

const { data: submissionBucket, error: submissionBucketError } =
  await supabase.storage.getBucket("assignment-submissions");
const submissionBucketReady =
  !submissionBucketError &&
  submissionBucket?.public === false &&
  submissionBucket?.file_size_limit === 50 * 1024 * 1024;

console.log(
  JSON.stringify({
    storageBucket: "assignment-submissions",
    available: !submissionBucketError,
    private: submissionBucket?.public === false,
    fileSizeLimit: submissionBucket?.file_size_limit ?? null,
  }),
);

if (!submissionBucketReady) failed = true;

const { data: profileAvatarBucket, error: profileAvatarBucketError } =
  await supabase.storage.getBucket("profile-avatars");
const profileAvatarBucketReady =
  !profileAvatarBucketError &&
  profileAvatarBucket?.public === false &&
  profileAvatarBucket?.file_size_limit === 2 * 1024 * 1024;
console.log(JSON.stringify({
  storageBucket: "profile-avatars",
  available: !profileAvatarBucketError,
  private: profileAvatarBucket?.public === false,
  fileSizeLimit: profileAvatarBucket?.file_size_limit ?? null,
}));
if (!profileAvatarBucketReady) failed = true;

process.exitCode = failed ? 1 : 0;
