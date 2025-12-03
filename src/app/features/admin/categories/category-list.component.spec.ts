import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CategoryListComponent } from './category-list.component';
import { CategoryService } from '../../../core/services/category.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  MOCK_CATEGORIES,
  MOCK_CATEGORY_LIST_RESPONSE,
  createMockCategory
} from '@testing/fixtures';

describe('CategoryListComponent', () => {
  let component: CategoryListComponent;
  let fixture: ComponentFixture<CategoryListComponent>;
  let categoryService: jasmine.SpyObj<CategoryService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const categoryServiceSpy = jasmine.createSpyObj('CategoryService', [
      'getAllCategories',
      'createCategory',
      'updateCategory',
      'deleteCategory'
    ]);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [CategoryListComponent],
      providers: [
        { provide: CategoryService, useValue: categoryServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryListComponent);
    component = fixture.componentInstance;
    categoryService = TestBed.inject(CategoryService) as jasmine.SpyObj<CategoryService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize signals with default values', () => {
      expect(component.categories()).toEqual([]);
      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBeNull();
      expect(component.successMessage()).toBeNull();
      expect(component.showCategoryModal()).toBe(false);
      expect(component.isEditMode()).toBe(false);
      expect(component.showDeleteModal()).toBe(false);
    });

    it('should load categories on init', () => {
      categoryService.getAllCategories.and.returnValue(of(MOCK_CATEGORY_LIST_RESPONSE));

      fixture.detectChanges();

      expect(categoryService.getAllCategories).toHaveBeenCalled();
      expect(component.categories()).toEqual(MOCK_CATEGORIES);
    });
  });

  describe('Load Categories', () => {
    it('should load categories successfully from response object', () => {
      categoryService.getAllCategories.and.returnValue(of(MOCK_CATEGORY_LIST_RESPONSE));

      component.loadCategories();

      expect(component.categories()).toEqual(MOCK_CATEGORIES);
      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBeNull();
    });

    it('should load categories successfully from array response', () => {
      categoryService.getAllCategories.and.returnValue(of(MOCK_CATEGORIES as any));

      component.loadCategories();

      expect(component.categories()).toEqual(MOCK_CATEGORIES);
      expect(component.isLoading()).toBe(false);
    });

    it('should handle error loading categories', () => {
      const error = new Error('Failed to load');
      categoryService.getAllCategories.and.returnValue(throwError(() => error));

      spyOn(console, 'error');
      component.loadCategories();

      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBe('Failed to load categories');
      expect(console.error).toHaveBeenCalledWith('Error loading categories:', error);
    });

    it('should set loading state while loading', () => {
      categoryService.getAllCategories.and.returnValue(of(MOCK_CATEGORY_LIST_RESPONSE));

      expect(component.isLoading()).toBe(false);
      component.loadCategories();
      // Loading should be set to false after subscription completes
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('Add Category Modal', () => {
    it('should open add modal with empty form', () => {
      component.openAddModal();

      expect(component.showCategoryModal()).toBe(true);
      expect(component.isEditMode()).toBe(false);
      expect(component.categoryToEdit()).toBeNull();
      expect(component.categoryName()).toBe('');
      expect(component.categoryDescription()).toBe('');
    });

    it('should close category modal and reset form', () => {
      component.showCategoryModal.set(true);
      component.categoryName.set('Test');
      component.categoryDescription.set('Description');
      component.categoryToEdit.set(MOCK_CATEGORIES[0]);

      component.closeCategoryModal();

      expect(component.showCategoryModal()).toBe(false);
      expect(component.categoryToEdit()).toBeNull();
      expect(component.categoryName()).toBe('');
      expect(component.categoryDescription()).toBe('');
    });
  });

  describe('Edit Category Modal', () => {
    it('should open edit modal with category data', () => {
      component.openEditModal(MOCK_CATEGORIES[0]);

      expect(component.showCategoryModal()).toBe(true);
      expect(component.isEditMode()).toBe(true);
      expect(component.categoryToEdit()).toEqual(MOCK_CATEGORIES[0]);
      expect(component.categoryName()).toBe('Technology');
      expect(component.categoryDescription()).toBe('Technology and software development events');
    });

    it('should handle category without description', () => {
      const categoryWithoutDescription = createMockCategory({ id: '99', name: 'Music', description: undefined });
      component.openEditModal(categoryWithoutDescription);

      expect(component.categoryName()).toBe('Music');
      expect(component.categoryDescription()).toBe('');
    });
  });

  describe('Save Category - Create', () => {
    beforeEach(() => {
      component.isEditMode.set(false);
      categoryService.getAllCategories.and.returnValue(of(MOCK_CATEGORY_LIST_RESPONSE));
    });

    it('should create new category successfully', fakeAsync(() => {
      component.categoryName.set('New Category');
      component.categoryDescription.set('New Description');
      categoryService.createCategory.and.returnValue(of({ id: '4', name: 'New Category' }));

      component.saveCategory();

      expect(categoryService.createCategory).toHaveBeenCalledWith({
        name: 'New Category',
        description: 'New Description'
      });
      expect(component.successMessage()).toBe('Category created successfully');
      expect(component.showCategoryModal()).toBe(false);
      expect(categoryService.getAllCategories).toHaveBeenCalled();

      tick(3000);
      expect(component.successMessage()).toBeNull();
    }));

    it('should create category without description', () => {
      component.categoryName.set('New Category');
      component.categoryDescription.set('   ');
      categoryService.createCategory.and.returnValue(of({ id: '4', name: 'New Category' }));

      component.saveCategory();

      expect(categoryService.createCategory).toHaveBeenCalledWith({
        name: 'New Category',
        description: undefined
      });
    });

    it('should not create category with empty name', () => {
      component.categoryName.set('   ');

      component.saveCategory();

      expect(component.errorMessage()).toBe('Category name is required');
      expect(categoryService.createCategory).not.toHaveBeenCalled();
    });

    it('should handle create error', fakeAsync(() => {
      component.categoryName.set('New Category');
      const error = new Error('Create failed');
      categoryService.createCategory.and.returnValue(throwError(() => error));

      spyOn(console, 'error');
      component.saveCategory();

      expect(component.errorMessage()).toBe('Failed to create category');
      expect(console.error).toHaveBeenCalledWith('Error creating category:', error);

      tick(3000);
      expect(component.errorMessage()).toBeNull();
    }));
  });

  describe('Save Category - Update', () => {
    beforeEach(() => {
      component.isEditMode.set(true);
      component.categoryToEdit.set(MOCK_CATEGORIES[0]);
      categoryService.getAllCategories.and.returnValue(of(MOCK_CATEGORY_LIST_RESPONSE));
    });

    it('should update existing category successfully', fakeAsync(() => {
      component.categoryName.set('Updated Technology');
      component.categoryDescription.set('Updated Description');
      categoryService.updateCategory.and.returnValue(of(MOCK_CATEGORIES[0]));

      component.saveCategory();

      expect(categoryService.updateCategory).toHaveBeenCalledWith('1', {
        name: 'Updated Technology',
        description: 'Updated Description'
      });
      expect(component.successMessage()).toBe('Category updated successfully');
      expect(component.showCategoryModal()).toBe(false);

      tick(3000);
      expect(component.successMessage()).toBeNull();
    }));

    it('should not update if category to edit is null', () => {
      component.categoryToEdit.set(null);
      component.categoryName.set('Updated');

      component.saveCategory();

      expect(categoryService.updateCategory).not.toHaveBeenCalled();
    });

    it('should handle update error', fakeAsync(() => {
      component.categoryName.set('Updated');
      const error = new Error('Update failed');
      categoryService.updateCategory.and.returnValue(throwError(() => error));

      spyOn(console, 'error');
      component.saveCategory();

      expect(component.errorMessage()).toBe('Failed to update category');
      expect(console.error).toHaveBeenCalledWith('Error updating category:', error);

      tick(3000);
      expect(component.errorMessage()).toBeNull();
    }));
  });

  describe('Delete Category', () => {
    beforeEach(() => {
      categoryService.getAllCategories.and.returnValue(of(MOCK_CATEGORY_LIST_RESPONSE));
    });

    it('should open delete modal', () => {
      component.openDeleteModal(MOCK_CATEGORIES[0]);

      expect(component.showDeleteModal()).toBe(true);
      expect(component.categoryToDelete()).toEqual(MOCK_CATEGORIES[0]);
    });

    it('should close delete modal', () => {
      component.showDeleteModal.set(true);
      component.categoryToDelete.set(MOCK_CATEGORIES[0]);

      component.closeDeleteModal();

      expect(component.showDeleteModal()).toBe(false);
      expect(component.categoryToDelete()).toBeNull();
    });

    it('should delete category successfully', fakeAsync(() => {
      component.categoryToDelete.set(MOCK_CATEGORIES[0]);
      categoryService.deleteCategory.and.returnValue(of(void 0));

      component.confirmDelete();

      expect(categoryService.deleteCategory).toHaveBeenCalledWith('1');
      expect(component.successMessage()).toBe('Category deleted successfully');
      expect(component.showDeleteModal()).toBe(false);
      expect(categoryService.getAllCategories).toHaveBeenCalled();

      tick(3000);
      expect(component.successMessage()).toBeNull();
    }));

    it('should not delete if category is null', () => {
      component.categoryToDelete.set(null);

      component.confirmDelete();

      expect(categoryService.deleteCategory).not.toHaveBeenCalled();
    });

    it('should handle delete error', fakeAsync(() => {
      component.categoryToDelete.set(MOCK_CATEGORIES[0]);
      const error = new Error('Delete failed');
      categoryService.deleteCategory.and.returnValue(throwError(() => error));

      spyOn(console, 'error');
      component.confirmDelete();

      expect(component.errorMessage()).toBe('Failed to delete category. It may be in use.');
      expect(component.showDeleteModal()).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error deleting category:', error);

      tick(3000);
      expect(component.errorMessage()).toBeNull();
    }));
  });

  describe('Navigation', () => {
    it('should navigate back to admin dashboard', () => {
      component.goBack();
      expect(router.navigate).toHaveBeenCalledWith(['/admin']);
    });

    it('should logout', () => {
      component.logout();
      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should complete full create flow', fakeAsync(() => {
      categoryService.getAllCategories.and.returnValue(of(MOCK_CATEGORY_LIST_RESPONSE));
      const newCategory = createMockCategory({ id: '99', name: 'New Cat' });
      categoryService.createCategory.and.returnValue(of(newCategory));

      fixture.detectChanges();

      expect(component.categories()).toEqual(MOCK_CATEGORIES);

      component.openAddModal();
      expect(component.showCategoryModal()).toBe(true);
      expect(component.isEditMode()).toBe(false);

      component.categoryName.set('New Cat');
      component.categoryDescription.set('Description');
      component.saveCategory();

      expect(component.successMessage()).toBe('Category created successfully');
      expect(component.showCategoryModal()).toBe(false);

      tick(3000);
      expect(component.successMessage()).toBeNull();
    }));

    it('should complete full edit flow', fakeAsync(() => {
      categoryService.getAllCategories.and.returnValue(of(MOCK_CATEGORY_LIST_RESPONSE));
      categoryService.updateCategory.and.returnValue(of(MOCK_CATEGORIES[0]));

      fixture.detectChanges();

      component.openEditModal(MOCK_CATEGORIES[0]);
      expect(component.showCategoryModal()).toBe(true);
      expect(component.isEditMode()).toBe(true);
      expect(component.categoryName()).toBe('Technology');

      component.categoryName.set('Updated Tech');
      component.saveCategory();

      expect(component.successMessage()).toBe('Category updated successfully');
      expect(component.showCategoryModal()).toBe(false);

      tick(3000);
      expect(component.successMessage()).toBeNull();
    }));

    it('should complete full delete flow', fakeAsync(() => {
      categoryService.getAllCategories.and.returnValue(of(MOCK_CATEGORY_LIST_RESPONSE));
      categoryService.deleteCategory.and.returnValue(of(void 0));

      fixture.detectChanges();

      component.openDeleteModal(MOCK_CATEGORIES[0]);
      expect(component.showDeleteModal()).toBe(true);

      component.confirmDelete();

      expect(component.successMessage()).toBe('Category deleted successfully');
      expect(component.showDeleteModal()).toBe(false);

      tick(3000);
      expect(component.successMessage()).toBeNull();
    }));
  });
});
