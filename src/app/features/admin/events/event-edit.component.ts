import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { AuthService } from '../../../core/services/auth.service';
import { CategoryService } from '../../../core/services/category.service';
import {CreateEventRequest, Event, UpdateEventRequest} from '../../../core/models/event.model';
import { Category } from '../../../core/models/category.model';
import {ToolbarComponent} from '../../../shared/components/toolbar/toolbar.component';

@Component({
  selector: 'app-event-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ToolbarComponent],
  templateUrl: './event-edit.component.html',
  styleUrls: ['./event-edit.component.scss']
})
export class EventEditComponent implements OnInit {
  eventForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  eventId: string = '';

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
    private router: Router,
    private route: ActivatedRoute
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
    this.eventId = this.route.snapshot.paramMap.get('id') || '';
    this.loadCategories();
    this.loadEvent();
  }

  loadEvent(): void {
    if (!this.eventId) {
      this.errorMessage.set('Invalid event ID');
      return;
    }

    this.isLoading.set(true);
    this.eventService.getEventById(this.eventId).subscribe({
      next: (event: Event) => {
        this.populateForm(event);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading event:', error);
        this.errorMessage.set('Failed to load event');
        this.isLoading.set(false);
      }
    });
  }

  populateForm(event: Event): void {
    // Extract date and time from the event data
    const eventDate = this.extractDate(event.eventDate);
    const startTime = this.extractTime(event.startTime);
    const endTime = this.extractTime(event.endTime);

    this.eventForm.patchValue({
      title: event.title,
      description: event.description,
      location: event.location,
      eventDate: eventDate,
      startTime: startTime,
      endTime: endTime,
      capacity: event.capacity || '',
      category: event.category || '',
      status: event.status || 'ACTIVE'
    });

    // Set the category ID and search text
    if (event.categoryId) {
      this.selectedCategoryId.set(event.categoryId);
    }
    if (event.category) {
      this.categorySearchText.set(event.category?.name);
    }
  }

  extractDate(dateTime: Date | string): string {
    const date = new Date(dateTime);
    return date.toISOString().split('T')[0];
  }

  extractTime(dateTime: Date | string): string {
    const date = new Date(dateTime);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
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

  onCategorySearch(event: any): void {
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

      const eventData: UpdateEventRequest = {
        title: formValue.title,
        description: formValue.description,
        location: formValue.location,
        eventDate: eventDate,
        startTime: startDateTime,
        endTime: endDateTime,
        capacity: formValue.capacity || null,
        categoryId: this.selectedCategoryId() || undefined,
        status: formValue.status,
        id: this.eventId
      };

      this.eventService.updateEvent(eventData).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.successMessage.set('Event updated successfully!');
          setTimeout(() => {
            this.router.navigate(['/admin/events']);
          }, 1500);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set('Failed to update event. Please try again.');
          console.error('Error updating event:', error);
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
