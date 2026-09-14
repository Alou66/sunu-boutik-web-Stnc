export interface Employee {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
}

export interface UserLookup {
  id: number;
  full_name: string;
}

export interface EmployeeList {
  items: Employee[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface EmployeeCreatePayload {
  full_name: string;
  phone: string;
  email: string;
  password: string;
}

// Le propriétaire ne gère plus que le compte de l'employé (mot de passe,
// activation) : nom, téléphone et email appartiennent à l'employé et se
// modifient uniquement depuis son propre espace "Mon profil" (voir
// features/profil). Le propriétaire les voit toujours en lecture seule ici.
export interface EmployeeUpdatePayload {
  password?: string;
  is_active?: boolean;
}
