import { api } from "@/lib/api";
import { Employee, EmployeeCreatePayload, EmployeeList, EmployeeUpdatePayload, UserLookup } from "./employees.types";

const PAGE_SIZE = 10;

export function fetchEmployees(page: number, search: string) {
  const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
  if (search) params.set("search", search);
  return api.get<EmployeeList>(`/employees?${params.toString()}`);
}

export function fetchEmployeesLookup() {
  return api.get<UserLookup[]>("/employees/lookup");
}

export function createEmployee(data: EmployeeCreatePayload) {
  return api.post<Employee>("/employees", data);
}

export function updateEmployee(id: number, data: EmployeeUpdatePayload) {
  return api.patch<Employee>(`/employees/${id}`, data);
}

export function deleteEmployee(id: number) {
  return api.delete(`/employees/${id}`);
}
