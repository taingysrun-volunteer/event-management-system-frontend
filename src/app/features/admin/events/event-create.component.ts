import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { AuthService } from '../../../core/services/auth.service';
import { CategoryService } from '../../../core/services/category.service';
import { CreateEventRequest } from '../../../core/models/event.model';
import { Category } from '../../../core/models/category.model';

@Component({
  selector: 'app-event-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './event-create.component.html',
  styleUrls: ['./event-create.component.scss']
})
export class EventCreateComponent implements OnInit {
  eventForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  statusOptions = ['ACTIVE', 'COMPLETED', 'CANCELLED', 'POSTPONED'];
  categories = signal<Category[]>([]);
  filteredCategories = signal<Category[]>([]);
  categorySearchText = signal('');
  showCategoryDropdown = signal(false);
  showAddCategoryModal = signal(false);
  newCategoryName = signal('');
  selectedCategoryId = signal<number | null>(null);

  constructor(
    private fb: FormBuilder,
    private eventService: EventService,
    private categoryService: CategoryService,
    private authService: AuthService,
    private router: Router
  ) {
    this.eventForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      location: ['', [Validators.required]],
      eventDate: ['', [Validators.required]],
      startTime: ['', [Validators.required]],
      endTime: ['', [Validators.required]],
      capacity: ['', [Validators.min(1)]],
      category: [''],
      status: ['ACTIVE', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (response: any) => {
        const categoryList = response.categories || response;
        this.categories.set(categoryList);
        this.filteredCategories.set(categoryList);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  onCategorySearch(event: Event): void {
    const searchText = (event.target as HTMLInputElement).value.toLowerCase();
    this.categorySearchText.set(searchText);

    const filtered = this.categories().filter(cat =>
      cat.name.toLowerCase().includes(searchText)
    );
    this.filteredCategories.set(filtered);
  }

  selectCategory(category: Category): void {
    this.eventForm.patchValue({ category: category.name });
    this.categorySearchText.set(category.name);
    this.selectedCategoryId.set(Number(category.id));
    this.showCategoryDropdown.set(false);
  }

  toggleCategoryDropdown(): void {
    this.showCategoryDropdown.update(value => !value);
  }

  openAddCategoryModal(): void {
    this.showAddCategoryModal.set(true);
    this.showCategoryDropdown.set(false);
  }

  closeAddCategoryModal(): void {
    this.showAddCategoryModal.set(false);
    this.newCategoryName.set('');
  }

  saveNewCategory(): void {
    const categoryName = this.newCategoryName().trim();
    if (!categoryName) return;

    this.categoryService.createCategory({ name: categoryName }).subscribe({
      next: (newCategory) => {
        this.categories.update(cats => [...cats, newCategory]);
        this.filteredCategories.update(cats => [...cats, newCategory]);
        this.selectCategory(newCategory);
        this.closeAddCategoryModal();
      },
      error: (error) => {
        console.error('Error creating category:', error);
        this.errorMessage.set('Failed to create category');
      }
    });
  }

  onSubmit(): void {
    if (this.eventForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      this.successMessage.set(null);

      const formValue = this.eventForm.value;

      // Combine date and time for startTime and endTime
      const eventDate = formValue.eventDate;
      const startDateTime = this.combineDateAndTime(eventDate, formValue.startTime);
      const endDateTime = this.combineDateAndTime(eventDate, formValue.endTime);

      const eventData: CreateEventRequest = {
        title: formValue.title,
        description: formValue.description,
        location: formValue.location,
        eventDate: eventDate,
        startTime: startDateTime,
        endTime: endDateTime,
        capacity: formValue.capacity || null,
        categoryId: this.selectedCategoryId() || undefined,
        status: formValue.status
      };

      this.eventService.createEvent(eventData).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.successMessage.set('Event created successfully!');
          setTimeout(() => {
            this.router.navigate(['/admin/events']);
          }, 1500);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set('Failed to create event. Please try again.');
          console.error('Error creating event:', error);
        }
      });
    } else {
      this.eventForm.markAllAsTouched();
    }
  }

  combineDateAndTime(date: string, time: string): string {
    return `${date}T${time}:00`;
  }

  logout(): void {
    this.authService.logout();
  }

  goBack(): void {
    this.router.navigate(['/admin/events']);
  }

  get title() {
    return this.eventForm.get('title');
  }

  get description() {
    return this.eventForm.get('description');
  }

  get location() {
    return this.eventForm.get('location');
  }

  get eventDate() {
    return this.eventForm.get('eventDate');
  }

  get startTime() {
    return this.eventForm.get('startTime');
  }

  get endTime() {
    return this.eventForm.get('endTime');
  }

  get capacity() {
    return this.eventForm.get('capacity');
  }

  get category() {
    return this.eventForm.get('category');
  }

  get status() {
    return this.eventForm.get('status');
  }
}
