import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { EventCreateComponent } from './event-create.component';
import { EventService } from '../../../core/services/event.service';
import { CategoryService } from '../../../core/services/category.service';
import { AuthService } from '../../../core/services/auth.service';
import { Category } from '../../../core/models/category.model';
import { Event as EventModel } from '../../../core/models/event.model';

describe('EventCreateComponent', () => {
  let component: EventCreateComponent;
  let fixture: ComponentFixture<EventCreateComponent>;
  let eventService: jasmine.SpyObj<EventService>;
  let categoryService: jasmine.SpyObj<CategoryService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let queryParamsSubject: BehaviorSubject<any>;

  const mockCategories: Category[] = [
    { id: '1', name: 'Technology' },
    { id: '2', name: 'Sports' }
  ];

  const mockCategoriesResponse = {
    categories: mockCategories
  };

  const mockEventResponse = {
    id: '1',
    title: 'New Event',
    description: 'Event Description',
    eventDate: '2025-12-31',
    startTime: '2025-12-31T10:00:00',
    endTime: '2025-12-31T12:00:00',
    location: 'Test Location',
    capacity: 100,
    status: 'published' as const,
    categoryId: 1
  };

  beforeEach(async () => {
    const eventServiceSpy = jasmine.createSpyObj('EventService', ['createEvent', 'getEventById']);
    const categoryServiceSpy = jasmine.createSpyObj('CategoryService', ['getAllCategories', 'createCategory']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    queryParamsSubject = new BehaviorSubject<any>({});

    await TestBed.configureTestingModule({
      imports: [EventCreateComponent],
      providers: [
        { provide: EventService, useValue: eventServiceSpy },
        { provide: CategoryService, useValue: categoryServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { queryParams: queryParamsSubject.asObservable() } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EventCreateComponent);
    component = fixture.componentInstance;
    eventService = TestBed.inject(EventService) as jasmine.SpyObj<EventService>;
    categoryService = TestBed.inject(CategoryService) as jasmine.SpyObj<CategoryService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form with default values', () => {
      expect(component.eventForm).toBeDefined();
      expect(component.eventForm.get('status')?.value).toBe('ACTIVE');
    });

    it('should load categories on init', () => {
      categoryService.getAllCategories.and.returnValue(of(mockCategoriesResponse));

      fixture.detectChanges();

      expect(categoryService.getAllCategories).toHaveBeenCalled();
      expect(component.categories()).toEqual(mockCategories);
    });

    it('should initialize signals', () => {
      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBeNull();
      expect(component.successMessage()).toBeNull();
      expect(component.categories()).toEqual([]);
      expect(component.showCategoryDropdown()).toBe(false);
      expect(component.showAddCategoryModal()).toBe(false);
    });
  });

  describe('Form Validation', () => {
    it('should have required validators', () => {
      expect(component.eventForm.get('title')?.hasError('required')).toBe(true);
      expect(component.eventForm.get('description')?.hasError('required')).toBe(true);
      expect(component.eventForm.get('location')?.hasError('required')).toBe(true);
      expect(component.eventForm.get('eventDate')?.hasError('required')).toBe(true);
      expect(component.eventForm.get('startTime')?.hasError('required')).toBe(true);
      expect(component.eventForm.get('endTime')?.hasError('required')).toBe(true);
    });

    it('should validate minimum length for title', () => {
      component.eventForm.patchValue({ title: 'ab' });
      expect(component.eventForm.get('title')?.hasError('minlength')).toBe(true);

      component.eventForm.patchValue({ title: 'abc' });
      expect(component.eventForm.get('title')?.hasError('minlength')).toBe(false);
    });

    it('should validate minimum length for description', () => {
      component.eventForm.patchValue({ description: 'short' });
      expect(component.eventForm.get('description')?.hasError('minlength')).toBe(true);

      component.eventForm.patchValue({ description: 'long enough description' });
      expect(component.eventForm.get('description')?.hasError('minlength')).toBe(false);
    });

    it('should validate minimum capacity', () => {
      component.eventForm.patchValue({ capacity: 0 });
      expect(component.eventForm.get('capacity')?.hasError('min')).toBe(true);

      component.eventForm.patchValue({ capacity: 1 });
      expect(component.eventForm.get('capacity')?.hasError('min')).toBe(false);
    });
  });

  describe('Form Getters', () => {
    it('should return form controls', () => {
      expect(component.title).toBe(component.eventForm.get('title'));
      expect(component.description).toBe(component.eventForm.get('description'));
      expect(component.location).toBe(component.eventForm.get('location'));
      expect(component.eventDate).toBe(component.eventForm.get('eventDate'));
      expect(component.startTime).toBe(component.eventForm.get('startTime'));
      expect(component.endTime).toBe(component.eventForm.get('endTime'));
      expect(component.capacity).toBe(component.eventForm.get('capacity'));
      expect(component.category).toBe(component.eventForm.get('category'));
      expect(component.status).toBe(component.eventForm.get('status'));
    });
  });

  describe('Load Categories', () => {
    it('should load categories successfully', () => {
      categoryService.getAllCategories.and.returnValue(of(mockCategoriesResponse));

      component.loadCategories();

      expect(component.categories()).toEqual(mockCategories);
      expect(component.filteredCategories()).toEqual(mockCategories);
    });

    it('should handle array response directly', () => {
      categoryService.getAllCategories.and.returnValue(of(mockCategories as any));

      component.loadCategories();

      expect(component.categories()).toEqual(mockCategories);
    });

    it('should handle error loading categories', () => {
      const error = new Error('Failed to load');
      categoryService.getAllCategories.and.returnValue(throwError(() => error));

      spyOn(console, 'error');
      component.loadCategories();

      expect(console.error).toHaveBeenCalledWith('Error loading categories:', error);
    });
  });

  describe('Category Search and Selection', () => {
    beforeEach(() => {
      component.categories.set(mockCategories);
      component.filteredCategories.set(mockCategories);
    });

    it('should filter categories based on search', () => {
      const event = {
        target: { value: 'tech' }
      } as unknown as Event;

      component.onCategorySearch(event);

      expect(component.categorySearchText()).toBe('tech');
      expect(component.filteredCategories().length).toBe(1);
      expect(component.filteredCategories()[0].name).toBe('Technology');
    });

    it('should show all categories when search is empty', () => {
      const event = {
        target: { value: '' }
      } as unknown as Event;

      component.onCategorySearch(event);

      expect(component.filteredCategories()).toEqual(mockCategories);
    });

    it('should select category', () => {
      component.selectCategory(mockCategories[0]);

      expect(component.eventForm.get('category')?.value).toBe('Technology');
      expect(component.categorySearchText()).toBe('Technology');
      expect(component.selectedCategoryId()).toBe(1);
      expect(component.showCategoryDropdown()).toBe(false);
    });

    it('should toggle category dropdown', () => {
      component.showCategoryDropdown.set(false);

      component.toggleCategoryDropdown();
      expect(component.showCategoryDropdown()).toBe(true);

      component.toggleCategoryDropdown();
      expect(component.showCategoryDropdown()).toBe(false);
    });
  });

  describe('Add Category Modal', () => {
    it('should open add category modal', () => {
      component.showCategoryDropdown.set(true);

      component.openAddCategoryModal();

      expect(component.showAddCategoryModal()).toBe(true);
      expect(component.showCategoryDropdown()).toBe(false);
    });

    it('should close add category modal', () => {
      component.showAddCategoryModal.set(true);
      component.newCategoryName.set('Test');

      component.closeAddCategoryModal();

      expect(component.showAddCategoryModal()).toBe(false);
      expect(component.newCategoryName()).toBe('');
    });

    it('should save new category successfully', () => {
      const newCategory = { id: '3', name: 'New Category' };
      component.newCategoryName.set('New Category');
      categoryService.createCategory.and.returnValue(of(newCategory));

      component.saveNewCategory();

      expect(categoryService.createCategory).toHaveBeenCalledWith({ name: 'New Category' });
      expect(component.categories()).toContain(newCategory);
      expect(component.selectedCategoryId()).toBe(3);
      expect(component.showAddCategoryModal()).toBe(false);
    });

    it('should not save empty category name', () => {
      component.newCategoryName.set('   ');

      component.saveNewCategory();

      expect(categoryService.createCategory).not.toHaveBeenCalled();
    });

    it('should handle error creating category', () => {
      const error = new Error('Create failed');
      component.newCategoryName.set('New Category');
      categoryService.createCategory.and.returnValue(throwError(() => error));

      spyOn(console, 'error');
      component.saveNewCategory();

      expect(console.error).toHaveBeenCalledWith('Error creating category:', error);
      expect(component.errorMessage()).toBe('Failed to create category');
    });
  });

  describe('Combine Date and Time', () => {
    it('should combine date and time correctly', () => {
      const result = component.combineDateAndTime('2025-12-31', '10:00');
      expect(result).toBe('2025-12-31T10:00:00');
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      component.eventForm.patchValue({
        title: 'Test Event',
        description: 'Test Description for the event',
        location: 'Test Location',
        eventDate: '2025-12-31',
        startTime: '10:00',
        endTime: '12:00',
        capacity: 100,
        status: 'ACTIVE'
      });
      component.selectedCategoryId.set(1);
    });

    it('should submit valid form successfully', fakeAsync(() => {
      eventService.createEvent.and.returnValue(of(mockEventResponse));

      component.onSubmit();

      expect(component.isLoading()).toBe(false);
      expect(component.successMessage()).toBe('Event created successfully!');

      tick(1500);
      expect(router.navigate).toHaveBeenCalledWith(['/admin/events']);
    }));

    it('should send correct event data', () => {
      eventService.createEvent.and.returnValue(of(mockEventResponse));

      component.onSubmit();

      const expectedData = {
        title: 'Test Event',
        description: 'Test Description for the event',
        location: 'Test Location',
        eventDate: '2025-12-31',
        startTime: '2025-12-31T10:00:00',
        endTime: '2025-12-31T12:00:00',
        capacity: 100,
        categoryId: 1,
        status: 'ACTIVE'
      };

      expect(eventService.createEvent).toHaveBeenCalledWith(expectedData);
    });

    it('should handle null capacity', () => {
      component.eventForm.patchValue({ capacity: null });
      eventService.createEvent.and.returnValue(of(mockEventResponse));

      component.onSubmit();

      const callArgs = eventService.createEvent.calls.mostRecent().args[0];
      expect(callArgs.capacity).toBeNull();
    });

    it('should handle error on submission', () => {
      const error = new Error('Create failed');
      eventService.createEvent.and.returnValue(throwError(() => error));

      spyOn(console, 'error');
      component.onSubmit();

      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBe('Failed to create event. Please try again.');
      expect(console.error).toHaveBeenCalledWith('Error creating event:', error);
    });

    it('should not submit invalid form', () => {
      component.eventForm.patchValue({
        title: '',
        description: '',
        location: ''
      });

      component.onSubmit();

      expect(eventService.createEvent).not.toHaveBeenCalled();
      expect(component.eventForm.get('title')?.touched).toBe(true);
    });

    it('should clear messages before submission', () => {
      component.errorMessage.set('Previous error');
      component.successMessage.set('Previous success');
      eventService.createEvent.and.returnValue(of(mockEventResponse));

      component.onSubmit();

      expect(eventService.createEvent).toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('should navigate back to events list', () => {
      component.goBack();
      expect(router.navigate).toHaveBeenCalledWith(['/admin/events']);
    });

    it('should logout', () => {
      component.logout();
      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should complete full event creation flow', fakeAsync(() => {
      categoryService.getAllCategories.and.returnValue(of(mockCategoriesResponse));
      categoryService.createCategory.and.returnValue(of({ id: '3', name: 'New Cat' }));
      eventService.createEvent.and.returnValue(of(mockEventResponse));

      fixture.detectChanges();

      expect(component.categories()).toEqual(mockCategories);

      // Add new category
      component.newCategoryName.set('New Cat');
      component.saveNewCategory();

      expect(component.categories().length).toBe(3);
      expect(component.selectedCategoryId()).toBe(3);

      // Fill form
      component.eventForm.patchValue({
        title: 'Test Event',
        description: 'Test Description for the event',
        location: 'Test Location',
        eventDate: '2025-12-31',
        startTime: '10:00',
        endTime: '12:00',
        capacity: 100,
        status: 'ACTIVE'
      });

      // Submit
      component.onSubmit();

      expect(component.successMessage()).toBe('Event created successfully!');

      tick(1500);
      expect(router.navigate).toHaveBeenCalledWith(['/admin/events']);
    }));

    it('should handle category search and selection flow', () => {
      component.categories.set(mockCategories);
      component.filteredCategories.set(mockCategories);

      const searchEvent = {
        target: { value: 'tech' }
      } as unknown as Event;

      component.onCategorySearch(searchEvent);
      expect(component.filteredCategories().length).toBe(1);

      component.selectCategory(component.filteredCategories()[0]);
      expect(component.eventForm.get('category')?.value).toBe('Technology');
      expect(component.selectedCategoryId()).toBe(1);
    });
  });

  describe('Clone Event Functionality', () => {
    const mockEventToClone: EventModel = {
      id: '1',
      title: 'Angular Workshop',
      description: 'Learn Angular best practices',
      eventDate: '2025-12-15',
      startTime: '2025-12-15T09:00:00Z',
      endTime: '2025-12-15T17:00:00Z',
      location: 'San Francisco, CA',
      capacity: 50,
      categoryId: 1,
      status: 'published'
    };

    it('should detect clone query parameter on init', () => {
      categoryService.getAllCategories.and.returnValue(of(mockCategoriesResponse));
      eventService.getEventById.and.returnValue(of(mockEventToClone));

      queryParamsSubject.next({ clone: '1' });

      fixture.detectChanges();

      expect(component.isCloning()).toBe(true);
    });

    it('should load event data when clone parameter is present', fakeAsync(() => {
      categoryService.getAllCategories.and.returnValue(of(mockCategoriesResponse));
      eventService.getEventById.and.returnValue(of(mockEventToClone));

      queryParamsSubject.next({ clone: '1' });

      fixture.detectChanges();
      tick();

      expect(eventService.getEventById).toHaveBeenCalledWith('1');
      expect(component.isCloning()).toBe(true);
    }));

    it('should pre-fill form with cloned event data', fakeAsync(() => {
      categoryService.getAllCategories.and.returnValue(of(mockCategoriesResponse));
      eventService.getEventById.and.returnValue(of(mockEventToClone));

      queryParamsSubject.next({ clone: '1' });

      fixture.detectChanges();
      tick();

      expect(component.eventForm.get('title')?.value).toBe('Angular Workshop (Copy)');
      expect(component.eventForm.get('description')?.value).toBe('Learn Angular best practices');
      expect(component.eventForm.get('location')?.value).toBe('San Francisco, CA');
      expect(component.eventForm.get('capacity')?.value).toBe(50);
      expect(component.eventForm.get('status')?.value).toBe('ACTIVE');
    }));

    it('should append (Copy) to title when cloning', fakeAsync(() => {
      categoryService.getAllCategories.and.returnValue(of(mockCategoriesResponse));
      eventService.getEventById.and.returnValue(of(mockEventToClone));

      queryParamsSubject.next({ clone: '1' });

      fixture.detectChanges();
      tick();

      const title = component.eventForm.get('title')?.value;
      expect(title).toContain('(Copy)');
      expect(title).toBe('Angular Workshop (Copy)');
    }));

    it('should set status to ACTIVE when cloning', fakeAsync(() => {
      categoryService.getAllCategories.and.returnValue(of(mockCategoriesResponse));
      eventService.getEventById.and.returnValue(of(mockEventToClone));

      queryParamsSubject.next({ clone: '1' });

      fixture.detectChanges();
      tick();

      expect(component.eventForm.get('status')?.value).toBe('ACTIVE');
    }));

    it('should extract date correctly from datetime', () => {
      const date = component.extractDate('2025-12-15T09:00:00Z');
      expect(date).toBe('2025-12-15');
    });

    it('should extract time correctly from datetime', () => {
      const time = component.extractTime('2025-12-15T09:30:00Z');
      // Time extraction returns HH:MM format (may vary by timezone)
      expect(time).toMatch(/^\d{2}:\d{2}$/);
      expect(time.length).toBe(5);
    });

    it('should set category when cloning event with category', fakeAsync(() => {
      categoryService.getAllCategories.and.returnValue(of(mockCategoriesResponse));
      eventService.getEventById.and.returnValue(of(mockEventToClone));

      queryParamsSubject.next({ clone: '1' });

      fixture.detectChanges();
      tick();

      expect(component.selectedCategoryId()).toBe(1);
      expect(component.eventForm.get('category')?.value).toBe('Technology');
    }));

    it('should handle clone of event without category', fakeAsync(() => {
      const eventWithoutCategory = { ...mockEventToClone, categoryId: undefined };
      categoryService.getAllCategories.and.returnValue(of(mockCategoriesResponse));
      eventService.getEventById.and.returnValue(of(eventWithoutCategory));

      queryParamsSubject.next({ clone: '1' });

      fixture.detectChanges();
      tick();

      expect(component.selectedCategoryId()).toBeNull();
    }));

    it('should handle error when loading event for cloning', fakeAsync(() => {
      categoryService.getAllCategories.and.returnValue(of(mockCategoriesResponse));
      eventService.getEventById.and.returnValue(throwError(() => new Error('Not found')));

      queryParamsSubject.next({ clone: '1' });

      fixture.detectChanges();
      tick();

      expect(component.errorMessage()).toBe('Failed to load event for cloning');
      expect(component.isLoading()).toBe(false);
    }));

    it('should not load event when no clone parameter', () => {
      categoryService.getAllCategories.and.returnValue(of(mockCategoriesResponse));

      fixture.detectChanges();

      expect(component.isCloning()).toBe(false);
      expect(eventService.getEventById).not.toHaveBeenCalled();
    });

    it('should create new event with cloned data on submit', fakeAsync(() => {
      categoryService.getAllCategories.and.returnValue(of(mockCategoriesResponse));
      eventService.getEventById.and.returnValue(of(mockEventToClone));
      eventService.createEvent.and.returnValue(of(mockEventResponse));

      queryParamsSubject.next({ clone: '1' });

      fixture.detectChanges();
      tick();

      component.onSubmit();

      expect(eventService.createEvent).toHaveBeenCalled();
      expect(component.successMessage()).toBe('Event created successfully!');

      tick(1500);
      expect(router.navigate).toHaveBeenCalledWith(['/admin/events']);
    }));
  });
});
