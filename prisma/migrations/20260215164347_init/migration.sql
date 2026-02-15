-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "reg_number" TEXT,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "registration_number" TEXT NOT NULL,
    "roll_number" TEXT,
    "group_shift" TEXT,
    "name" TEXT NOT NULL,
    "father_name" TEXT NOT NULL,
    "year_semester" TEXT NOT NULL DEFAULT 'FIRST_YEAR',
    "institute_name" TEXT,
    "branch_name" TEXT,
    "email" TEXT,
    "nationality" TEXT DEFAULT 'INDIAN',
    "date_of_birth" TEXT,
    "gender" TEXT,
    "category" TEXT,
    "sub_category" TEXT,
    "mobile_number" TEXT,
    "landline_number" TEXT,
    "fee_submitted" TEXT,
    "aadhar_number" TEXT,
    "high_school_pass" BOOLEAN,
    "intermediate_pass" BOOLEAN,
    "high_school_area_type" TEXT,
    "iti_pass" BOOLEAN,
    "minority" BOOLEAN,
    "inter_qualified_pcb_pcm" BOOLEAN,
    "admission_type" TEXT,
    "jeep_roll_number" TEXT,
    "jeep_rank" TEXT,
    "student_type" TEXT DEFAULT 'REGULAR',
    "transfer_from_college" TEXT,
    "transfer_to_college" TEXT,
    "study_perm_from_college" TEXT,
    "study_perm_to_college" TEXT,
    "is_submitted" BOOLEAN NOT NULL DEFAULT false,
    "submitted_at" DATETIME,
    "declaration_accepted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "student_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "address" TEXT,
    "state" TEXT,
    "district" TEXT,
    "pin_code" TEXT,
    "tehsil" TEXT,
    "block" TEXT,
    CONSTRAINT "addresses_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "qualifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "student_id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "course_name" TEXT,
    "board_university" TEXT,
    "passing_year" INTEGER,
    "marks_obtained" REAL,
    "max_marks" REAL,
    "percentage_grade" TEXT,
    CONSTRAINT "qualifications_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paper_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT,
    "year" TEXT NOT NULL,
    "has_theory" BOOLEAN NOT NULL DEFAULT true,
    "has_practical" BOOLEAN NOT NULL DEFAULT true,
    "is_fixed_marks" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "sessional_marks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "student_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sessional_1" REAL,
    "sessional_2" REAL,
    "sessional_3" REAL,
    "assignment_marks" REAL,
    "field_visit_marks" REAL,
    CONSTRAINT "sessional_marks_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sessional_marks_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "board_marks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "student_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "theory_marks" REAL,
    "practical_marks" REAL,
    CONSTRAINT "board_marks_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "board_marks_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fixed_marks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "student_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "marks" REAL,
    CONSTRAINT "fixed_marks_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "fixed_marks_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_reg_number_key" ON "users"("reg_number");

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_registration_number_key" ON "students"("registration_number");

-- CreateIndex
CREATE UNIQUE INDEX "addresses_student_id_type_key" ON "addresses"("student_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "qualifications_student_id_level_key" ON "qualifications"("student_id", "level");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_paper_code_year_key" ON "subjects"("paper_code", "year");

-- CreateIndex
CREATE UNIQUE INDEX "sessional_marks_student_id_subject_id_type_key" ON "sessional_marks"("student_id", "subject_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "board_marks_student_id_subject_id_key" ON "board_marks"("student_id", "subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "fixed_marks_student_id_subject_id_key" ON "fixed_marks"("student_id", "subject_id");
