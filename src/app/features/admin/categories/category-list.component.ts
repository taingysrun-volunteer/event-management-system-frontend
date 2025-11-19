import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../core/services/category.service';
import { AuthService } from '../../../core/services/auth.service';
import { Category } from '../../../core/models/category.model';
import { ToolbarComponent } from '../../../shared/components/toolbar/toolbar.component';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ToolbarComponent],
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss']
})
export class CategoryListComponent implements OnInit {
  categories = signal<Category[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Add/Edit Category Modal
  showCategoryModal = signal(false);
  isEditMode = signal(false);
  categoryToEdit = signal<Category | null>(null);
  categoryName = signal('');
  categoryDescription = signal('');

  // Delete Category Modal
  showDeleteModal = signal(false);
  categoryToDelete = signal<Category | null>(null);

  constructor(
    private categoryService: CategoryService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.categoryService.getAllCategories().subscribe({
      next: (response: any) => {
        const categoryList = response.categories || response;
        this.categories.set(categoryList);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.errorMessage.set('Failed to load categories');
        this.isLoading.set(false);
      }
    });
  }

  openAddModal(): void {
    this.isEditMode.set(false);
    this.categoryToEdit.set(null);
    this.categoryName.set('');
    this.categoryDescription.set('');
    this.showCategoryModal.set(true);
  }

  openEditModal(category: Category): void {
    this.isEditMode.set(true);
    this.categoryToEdit.set(category);
    this.categoryName.set(category.name);
    this.categoryDescription.set(category.description || '');
    this.showCategoryModal.set(true);
  }

  closeCategoryModal(): void {
    this.showCategoryModal.set(false);
    this.categoryToEdit.set(null);
    this.categoryName.set('');
    this.categoryDescription.set('');
  }

  saveCategory(): void {
    const categoryName = this.categoryName().trim();
    if (!categoryName) {
      this.errorMessage.set('Category name is required');
      return;
    }

    const categoryData = {
      name: categoryName,
      description: this.categoryDescription().trim() || undefined
    };

    if (this.isEditMode()) {
      // Update existing category
      const categoryId = this.categoryToEdit()?.id;
      if (!categoryId) return;

      this.categoryService.updateCategory(categoryId, categoryData).subscribe({
        next: () => {
          this.successMessage.set('Category updated successfully');
          this.closeCategoryModal();
          this.loadCategories();
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (error) => {
          console.error('Error updating category:', error);
          this.errorMessage.set('Failed to update category');
          setTimeout(() => this.errorMessage.set(null), 3000);
        }
      });
    } else {
      // Create new category
      this.categoryService.createCategory(categoryData).subscribe({
        next: () => {
          this.successMessage.set('Category created successfully');
          this.closeCategoryModal();
          this.loadCategories();
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (error) => {
          console.error('Error creating category:', error);
          this.errorMessage.set('Failed to create category');
          setTimeout(() => this.errorMessage.set(null), 3000);
        }
      });
    }
  }

  openDeleteModal(category: Category): void {
    this.categoryToDelete.set(category);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.categoryToDelete.set(null);
  }

  confirmDelete(): void {
    const category = this.categoryToDelete();
    if (!category) return;

    this.categoryService.deleteCategory(category.id).subscribe({
      next: () => {
        this.successMessage.set('Category deleted successfully');
        this.closeDeleteModal();
        this.loadCategories();
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (error) => {
        console.error('Error deleting category:', error);
        this.errorMessage.set('Failed to delete category. It may be in use.');
        this.closeDeleteModal();
        setTimeout(() => this.errorMessage.set(null), 3000);
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }

  goBack(): void {
    this.router.navigate(['/admin']);
  }
}
