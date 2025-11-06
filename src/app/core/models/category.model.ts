export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CategoryListResponse {
  categories: Category[];
  totalElements?: number;
  totalPages?: number;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
}
