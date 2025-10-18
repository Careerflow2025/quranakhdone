import { z } from 'zod';

export const TeacherCsvRow = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().optional().or(z.literal('')),
  external_id: z.string().optional().or(z.literal(''))
});
export type TeacherCsvRow = z.infer<typeof TeacherCsvRow>;

export const StudentCsvRow = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  parent_name: z.string().min(1),
  parent_email: z.string().email(),
  date_of_birth: z.string().optional().or(z.literal('')),
  gender: z.enum(['male', 'female']).optional().or(z.literal('')),
  grade: z.string().optional().or(z.literal('')),
  external_id: z.string().optional().or(z.literal('')),
  class_code: z.string().min(1)
});
export type StudentCsvRow = z.infer<typeof StudentCsvRow>;

export const ClassFormSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  level: z.string().optional(),
  schedule: z.object({ 
    days: z.array(z.enum(['Mon','Tue','Wed','Thu','Fri','Sat','Sun'])).min(1), 
    start: z.string(), 
    end: z.string() 
  })
});
export type ClassForm = z.infer<typeof ClassFormSchema>;