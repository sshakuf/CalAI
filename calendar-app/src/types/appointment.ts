export interface Appointment {
  id: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_phone: string;
  staff_first_name: string;
  staff_last_name: string;
  staff_display_name: string;
  scheduled_start: string;
  scheduled_end: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  services: string;
  total_amount: number;
  customer_notes?: string;
  staff_notes?: string;
}

export interface NewAppointment {
  customer_id: string;
  staff_id: string;
  scheduled_start: string;
  scheduled_end: string;
  services: string[];
  customer_notes?: string;
  staff_notes?: string;
}

export interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  specialties: string[];
}

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
}

export interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  base_price: number;
  category: string;
}