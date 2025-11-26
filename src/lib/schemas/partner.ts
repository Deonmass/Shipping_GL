import { z } from 'zod';

// Base schema for user registration
export const userSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .refine(val => !val.includes(' '), 'Password must not contain spaces'),
  confirmPassword: z.string(),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  city: z.string().min(1, 'City is required')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

// Physical partner schema
export const physicalPartnerSchema = z.object({
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Phone number is required'),
  country: z.string().min(1, 'Country is required'),
  city: z.string().min(1, 'City is required'),
  street_address: z.string().min(1, 'Street address is required'),
  address_references: z.string().optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .refine(val => !val.includes(' '), 'Password must not contain spaces'),
  confirmPassword: z.string(),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  gender: z.enum(['male', 'female']),
  profession: z.string().min(1, 'Profession is required'),
  profile_photo: z.string().optional(),
  nif: z.string().optional(),
  import_export_number: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

// Legal partner schema
export const legalPartnerSchema = z.object({
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Phone number is required'),
  country: z.string().min(1, 'Country is required'),
  city: z.string().min(1, 'City is required'),
  street_address: z.string().min(1, 'Street address is required'),
  address_references: z.string().optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .refine(val => !val.includes(' '), 'Password must not contain spaces'),
  confirmPassword: z.string(),
  company_name: z.string().min(1, 'Company name is required'),
  rccm: z.string().min(1, 'RCCM is required'),
  business_sector: z.string().min(1, 'Business sector is required'),
  is_freight_forwarder: z.boolean().default(false),
  nif: z.string().min(1, 'NIF is required'),
  import_export_number: z.string().min(1, 'Import/Export number is required'),
  is_existing_company: z.boolean().default(false)
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

export type UserForm = z.infer<typeof userSchema>;
export type PhysicalPartnerForm = z.infer<typeof physicalPartnerSchema>;
export type LegalPartnerForm = z.infer<typeof legalPartnerSchema>;