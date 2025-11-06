import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Category, CategoryListResponse, CreateCategoryRequest } from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  constructor(private apiService: ApiService) {}

  getAllCategories(): Observable<CategoryListResponse> {
    return this.apiService.get<CategoryListResponse>('/categories');
  }

  getCategoryById(id: string): Observable<Category> {
    return this.apiService.get<Category>(`/categories/${id}`);
  }

  createCategory(category: CreateCategoryRequest): Observable<Category> {
    return this.apiService.post<Category>('/categories', category);
  }

  updateCategory(id: string, category: CreateCategoryRequest): Observable<Category> {
    return this.apiService.put<Category>(`/categories/${id}`, category);
  }

  deleteCategory(id: string): Observable<void> {
    return this.apiService.delete<void>(`/categories/${id}`);
  }
}
