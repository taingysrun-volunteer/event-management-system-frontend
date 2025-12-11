import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { EventBrowseComponent } from './event-browse.component';
import { EventService } from '../../../../core/services/event.service';
import { CategoryService } from '../../../../core/services/category.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Event } from '../../../../core/models/event.model';
import { Category } from '../../../../core/models/category.model';

describe('EventBrowseComponent', () => {
  let component: EventBrowseComponent;
  let fixture: ComponentFixture<EventBrowseComponent>;
  let eventService: jasmine.SpyObj<EventService>;
  let categoryService: jasmine.SpyObj<CategoryService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const mockEvents: Event[] = [
    {
      id: '1',
      title: 'Event 1',
      description: 'Description 1',
      eventDate: '2025-12-31',
      startTime: '2025-12-31T10:00:00Z',
      endTime: '2025-12-31T12:00:00Z',
      location: 'Location 1',
      capacity: 100,
      availableSeats: 50,
      status: 'published'
    },
    {
      id: '2',
      title: 'Event 2',
      description: 'Description 2',
      eventDate: '2026-01-15',
      startTime: '2026-01-15T14:00:00Z',
      endTime: '2026-01-15T16:00:00Z',
      location: 'Location 2',
      capacity: 50,
      availableSeats: 0,
      status: 'published'
    }
  ];

  const mockCategories: Category[] = [
    { id: '1', name: 'Technology' },
    { id: '2', name: 'Sports' }
  ];

  const mockEventsResponse = {
    events: mockEvents,
    totalPages: 1,
    totalItems: 2,
    size: 9,
    number: 0
  };

  const mockCategoriesResponse = {
    categories: mockCategories
  };

  const mockUser = {
    id: 'user123',
    username: 'testuser',
    email: 'test@example.com'
  };

  beforeEach(async () => {
    const eventServiceSpy = jasmine.createSpyObj('EventService', [
      'getPublishedEvents',
      'searchEvents'
    ]);
    const categoryServiceSpy = jasmine.createSpyObj('CategoryService', ['getAllCategories']);
    const currentUserSignal = jasmine.createSpy('currentUser').and.returnValue(mockUser);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
    authServiceSpy.currentUser = currentUserSignal;
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [EventBrowseComponent],
      providers: [
        { provide: EventService, useValue: eventServiceSpy },
        { provide: CategoryService, useValue: categoryServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EventBrowseComponent);
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

    it('should initialize signals with default values', () => {
      expect(component.events()).toEqual([]);
      expect(component.categories()).toEqual([]);
      expect(component.loading()).toBe(false);
      expect(component.currentPage()).toBe(0);
      expect(component.totalPages()).toBe(0);
      expect(component.totalElements()).toBe(0);
    });

    it('should load categories and events on init', () => {
      categoryService.getAllCategories.and.returnValue(of(mockCategoriesResponse));
      eventService.getPublishedEvents.and.returnValue(of(mockEventsResponse));

      fixture.detectChanges();

      expect(component.currentUser).toEqual(mockUser);
      expect(categoryService.getAllCategories).toHaveBeenCalled();
      expect(eventService.getPublishedEvents).toHaveBeenCalled();
    });
  });

  describe('Load Categories', () => {
    it('should load categories successfully', () => {
      categoryService.getAllCategories.and.returnValue(of(mockCategoriesResponse));

      component.loadCategories();

      expect(component.categories()).toEqual(mockCategories);
    });

    it('should handle categories load error', () => {
      const error = new Error('Failed to load');
      categoryService.getAllCategories.and.returnValue(throwError(() => error));

      spyOn(console, 'error');
      component.loadCategories();

      expect(console.error).toHaveBeenCalledWith('Error loading categories:', error);
    });
  });

  describe('Load Events', () => {
    it('should load published events when no filters applied', () => {
      eventService.getPublishedEvents.and.returnValue(of(mockEventsResponse));

      component.loadEvents();

      expect(component.loading()).toBe(false);
      expect(component.events()).toEqual(mockEvents);
      expect(component.totalPages()).toBe(1);
      expect(component.totalElements()).toBe(2);
      expect(eventService.getPublishedEvents).toHaveBeenCalledWith(0, 9);
    });

    it('should search events when search term is provided', () => {
      component.searchTerm = 'test';
      eventService.searchEvents.and.returnValue(of(mockEventsResponse));

      component.loadEvents();

      expect(eventService.searchEvents).toHaveBeenCalledWith('test', '', 0, 9);
      expect(component.events()).toEqual(mockEvents);
    });

    it('should search events when category is selected', () => {
      component.selectedCategoryId = '1';
      eventService.searchEvents.and.returnValue(of(mockEventsResponse));

      component.loadEvents();

      expect(eventService.searchEvents).toHaveBeenCalledWith('', '1', 0, 9);
    });

    it('should handle events load error', () => {
      const error = new Error('Failed to load');
      eventService.getPublishedEvents.and.returnValue(throwError(() => error));

      spyOn(console, 'error');
      component.loadEvents();

      expect(component.loading()).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error loading events:', error);
    });
  });

  describe('Search and Filters', () => {
    beforeEach(() => {
      eventService.searchEvents.and.returnValue(of(mockEventsResponse));
      eventService.getPublishedEvents.and.returnValue(of(mockEventsResponse));
    });

    it('should reset page and load events on search', () => {
      component.currentPage.set(2);
      component.searchTerm = 'technology';

      component.onSearch();

      expect(component.currentPage()).toBe(0);
      expect(eventService.searchEvents).toHaveBeenCalled();
    });

    it('should reset page and load events on category change', () => {
      component.currentPage.set(2);
      component.selectedCategoryId = '1';

      component.onCategoryChange();

      expect(component.currentPage()).toBe(0);
      expect(eventService.searchEvents).toHaveBeenCalled();
    });

    it('should clear all filters and reload events', () => {
      component.searchTerm = 'test';
      component.selectedCategoryId = '1';
      component.currentPage.set(2);

      component.clearFilters();

      expect(component.searchTerm).toBe('');
      expect(component.selectedCategoryId).toBe('');
      expect(component.currentPage()).toBe(0);
      expect(eventService.getPublishedEvents).toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      component.totalPages.set(5);
      eventService.getPublishedEvents.and.returnValue(of(mockEventsResponse));
    });

    it('should go to specific page', () => {
      component.goToPage(2);

      expect(component.currentPage()).toBe(2);
      expect(eventService.getPublishedEvents).toHaveBeenCalled();
    });

    it('should not go to page less than 0', () => {
      component.currentPage.set(1);

      component.goToPage(-1);

      expect(component.currentPage()).toBe(1);
    });

    it('should not go to page greater than total pages', () => {
      component.currentPage.set(1);

      component.goToPage(10);

      expect(component.currentPage()).toBe(1);
    });

    it('should go to next page', () => {
      component.currentPage.set(1);

      component.nextPage();

      expect(component.currentPage()).toBe(2);
    });

    it('should not go to next page if on last page', () => {
      component.currentPage.set(4);

      component.nextPage();

      expect(component.currentPage()).toBe(4);
    });

    it('should go to previous page', () => {
      component.currentPage.set(2);

      component.previousPage();

      expect(component.currentPage()).toBe(1);
    });

    it('should not go to previous page if on first page', () => {
      component.currentPage.set(0);

      component.previousPage();

      expect(component.currentPage()).toBe(0);
    });
  });

  describe('Event Information', () => {
    it('should format event date correctly', () => {
      const result = component.getEventDate(mockEvents[0]);
      expect(result).toContain('2025');
      expect(result).toContain('Dec');
    });

    it('should format event time correctly', () => {
      const result = component.getEventTime(mockEvents[0]);
      expect(result).toContain(':');
      expect(result).toContain('-');
    });

    it('should identify full event', () => {
      expect(component.isEventFull(mockEvents[1])).toBe(true);
      expect(component.isEventFull(mockEvents[0])).toBe(false);
    });

    it('should identify upcoming event', () => {
      const futureEvent = {
        ...mockEvents[0],
        eventDate: new Date(Date.now() + 86400000).toISOString()
      };
      expect(component.isEventUpcoming(futureEvent)).toBe(true);

      const pastEvent = {
        ...mockEvents[0],
        eventDate: new Date(Date.now() - 86400000).toISOString()
      };
      expect(component.isEventUpcoming(pastEvent)).toBe(false);
    });
  });

  describe('Navigation', () => {
    it('should navigate to event detail', () => {
      component.viewEventDetail('123');
      expect(router.navigate).toHaveBeenCalledWith(['/events', '123']);
    });

    it('should navigate to my registrations', () => {
      component.goToMyRegistrations();
      expect(router.navigate).toHaveBeenCalledWith(['/my-registrations']);
    });

    it('should logout', () => {
      component.logout();
      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should complete full event browsing flow', () => {
      categoryService.getAllCategories.and.returnValue(of(mockCategoriesResponse));
      eventService.getPublishedEvents.and.returnValue(of(mockEventsResponse));

      fixture.detectChanges();

      expect(component.categories()).toEqual(mockCategories);
      expect(component.events()).toEqual(mockEvents);
      expect(component.loading()).toBe(false);
    });

    it('should handle search and pagination flow', () => {
      const searchResponse = {
        ...mockEventsResponse,
        totalPages: 3
      };
      eventService.searchEvents.and.returnValue(of(searchResponse));

      component.searchTerm = 'technology';
      component.onSearch();

      expect(component.currentPage()).toBe(0);
      expect(component.totalPages()).toBe(3);

      component.nextPage();
      expect(component.currentPage()).toBe(1);

      component.previousPage();
      expect(component.currentPage()).toBe(0);
    });
  });
});
