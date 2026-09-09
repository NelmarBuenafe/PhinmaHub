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
  announcements: "id,author_id,course_id,audience,title,body,published_at",
  study_tools: "id,creator_id,title,tool_type,url,is_active",
  contact_messages: "id,sender_name,sender_email,subject,message,status",
  audit_logs: "id,actor_id,action,entity_type,entity_id,metadata,created_at",
  course_categories:
    "id,name,description,color,icon,is_active,created_at,updated_at",
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

process.exitCode = failed ? 1 : 0;
