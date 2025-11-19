export interface Category {
  id: string;
  name: string;
  description?: string;
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
