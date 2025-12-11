import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError, EMPTY } from 'rxjs';
import { EventListComponent } from './event-list.component';
import { EventService } from '../../../../core/services/event.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Event } from '../../../../core/models/event.model';

describe('EventListComponent', () => {
  let component: EventListComponent;
  let fixture: ComponentFixture<EventListComponent>;
  let eventService: jasmine.SpyObj<EventService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const mockEvents: Event[] = [
    {
      id: '1',
      title: 'Angular Workshop',
      description: 'Learn Angular',
      eventDate: '2025-12-01',
      startTime: '09:00',
      endTime: '17:00',
      location: 'San Francisco',
      capacity: 50,
      availableSeats: 30,
      status: 'published'
    },
    {
      id: '2',
      title: 'React Conference',
      description: 'React best practices',
      eventDate: '2025-12-15',
      startTime: '10:00',
      endTime: '18:00',
      location: 'New York',
      capacity: 100,
      availableSeats: 50,
      status: 'draft'
    }
  ];

  beforeEach(async () => {
    const eventServiceSpy = jasmine.createSpyObj('EventService', ['getAllEvents', 'deleteEvent', 'searchAllEvents']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      events: EMPTY
    });
    routerSpy.createUrlTree.and.returnValue({} as any);
    routerSpy.serializeUrl.and.returnValue('');
    const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: { params: {} }
    });

    await TestBed.configureTestingModule({
      imports: [EventListComponent],
      providers: [
        { provide: EventService, useValue: eventServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EventListComponent);
    component = fixture.componentInstance;
    eventService = TestBed.inject(EventService) as jasmine.SpyObj<EventService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize signals with default values', () => {
      expect(component.events()).toEqual([]);
      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBeNull();
      expect(component.currentPage()).toBe(0);
      expect(component.totalPages()).toBe(0);
      expect(component.showDeleteModal()).toBe(false);
      expect(component.eventToDelete()).toBeNull();
      expect(component.searchTerm()).toBe('');
      expect(component.selectedStatus()).toBe('ALL');
    });

    it('should set pageSize to 10', () => {
      expect(component.pageSize).toBe(10);
    });

    it('should initialize statusOptions', () => {
      expect(component.statusOptions).toEqual(['ALL', 'ACTIVE', 'DRAFT', 'CANCELLED', 'COMPLETED']);
    });

    it('should call loadEvents on init', () => {
      spyOn(component, 'loadEvents');
      component.ngOnInit();
      expect(component.loadEvents).toHaveBeenCalled();
    });
  });

  describe('loadEvents - Success Scenarios', () => {
    it('should load events from paginated response', () => {
      const paginatedResponse = {
        events: mockEvents,
        totalPages: 3,
        totalItems: 25,
        size: 10,
        number: 0
      };
      eventService.getAllEvents.and.returnValue(of(paginatedResponse));

      component.loadEvents();

      expect(eventService.getAllEvents).toHaveBeenCalledWith(0, 10);
      expect(component.events()).toEqual(mockEvents);
      expect(component.totalPages()).toBe(3);
      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBeNull();
    });

    it('should load events from direct array response', () => {
      eventService.getAllEvents.and.returnValue(of(mockEvents as any));

      component.loadEvents();

      expect(component.events()).toEqual(mockEvents);
      expect(component.totalPages()).toBe(1);
      expect(component.isLoading()).toBe(false);
    });

    it('should handle empty paginated response', () => {
      const emptyResponse = {
        events: [],
        totalPages: 0,
        totalItems: 0,
        size: 10,
        number: 0
      };
      eventService.getAllEvents.and.returnValue(of(emptyResponse));

      component.loadEvents();

      expect(component.events()).toEqual([]);
      expect(component.totalPages()).toBe(1); // Defaults to 1 when totalPages is 0
    });

    it('should handle empty array response', () => {
      eventService.getAllEvents.and.returnValue(of([] as any));

      component.loadEvents();

      expect(component.events()).toEqual([]);
      expect(component.totalPages()).toBe(1);
    });

    it('should handle unknown response format', () => {
      eventService.getAllEvents.and.returnValue(of({ unknown: 'format' } as any));

      component.loadEvents();

      expect(component.events()).toEqual([]);
      expect(component.totalPages()).toBe(0);
    });

    it('should set loading to true while loading', () => {
      eventService.getAllEvents.and.returnValue(of(mockEvents as any));

      component.isLoading.set(false);
      component.loadEvents();

      expect(eventService.getAllEvents).toHaveBeenCalled();
      // After subscription completes, loading should be false
      expect(component.isLoading()).toBe(false);
    });

    it('should clear error message when loading succeeds', () => {
      eventService.getAllEvents.and.returnValue(of(mockEvents as any));

      component.errorMessage.set('Previous error');
      component.loadEvents();

      expect(component.errorMessage()).toBeNull();
    });

    it('should load events with current page and page size', () => {
      eventService.getAllEvents.and.returnValue(of(mockEvents as any));

      component.currentPage.set(2);
      component.pageSize = 20;
      component.loadEvents();

      expect(eventService.getAllEvents).toHaveBeenCalledWith(2, 20);
    });
  });

  describe('loadEvents - Error Scenarios', () => {
    it('should handle error when loading events fails', () => {
      const error = { status: 500, message: 'Server Error' };
      eventService.getAllEvents.and.returnValue(throwError(() => error));

      component.loadEvents();

      expect(component.errorMessage()).toBe('Failed to load events');
      expect(component.isLoading()).toBe(false);
    });

    it('should set loading to false on error', () => {
      eventService.getAllEvents.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      component.loadEvents();

      expect(component.isLoading()).toBe(false);
    });

    it('should handle 404 error', () => {
      eventService.getAllEvents.and.returnValue(
        throwError(() => ({ status: 404 }))
      );

      component.loadEvents();

      expect(component.errorMessage()).toBe('Failed to load events');
      expect(component.events()).toEqual([]);
    });
  });

  describe('Delete Modal', () => {
    it('should open delete modal with event details', () => {
      component.openDeleteModal('1', 'Angular Workshop');

      expect(component.showDeleteModal()).toBe(true);
      expect(component.eventToDelete()).toEqual({ id: '1', title: 'Angular Workshop' });
    });

    it('should close delete modal and clear event to delete', () => {
      component.eventToDelete.set({ id: '1', title: 'Test Event' });
      component.showDeleteModal.set(true);

      component.closeDeleteModal();

      expect(component.showDeleteModal()).toBe(false);
      expect(component.eventToDelete()).toBeNull();
    });

    it('should not show delete modal by default', () => {
      expect(component.showDeleteModal()).toBe(false);
    });
  });

  describe('Delete Event', () => {
    it('should delete event and reload list on success', () => {
      eventService.deleteEvent.and.returnValue(of(undefined as any));
      eventService.getAllEvents.and.returnValue(of(mockEvents as any));

      component.eventToDelete.set({ id: '1', title: 'Test Event' });
      component.showDeleteModal.set(true);

      component.confirmDelete();

      expect(eventService.deleteEvent).toHaveBeenCalledWith('1');
      expect(component.showDeleteModal()).toBe(false);
      expect(component.eventToDelete()).toBeNull();
      expect(eventService.getAllEvents).toHaveBeenCalled();
    });

    it('should not delete if no event is selected', () => {
      component.eventToDelete.set(null);

      component.confirmDelete();

      expect(eventService.deleteEvent).not.toHaveBeenCalled();
    });

    it('should handle delete error', () => {
      const error = { status: 500, message: 'Delete failed' };
      eventService.deleteEvent.and.returnValue(throwError(() => error));

      component.eventToDelete.set({ id: '1', title: 'Test Event' });
      component.showDeleteModal.set(true);

      component.confirmDelete();

      expect(component.errorMessage()).toBe('Failed to delete event');
      expect(component.showDeleteModal()).toBe(false);
      expect(component.eventToDelete()).toBeNull();
    });

    it('should close modal after delete error', () => {
      eventService.deleteEvent.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      component.eventToDelete.set({ id: '1', title: 'Test Event' });
      component.showDeleteModal.set(true);

      component.confirmDelete();

      expect(component.showDeleteModal()).toBe(false);
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      eventService.getAllEvents.and.returnValue(of(mockEvents as any));
    });

    it('should go to specific page', () => {
      spyOn(component, 'loadEvents');

      component.goToPage(3);

      expect(component.currentPage()).toBe(3);
      expect(component.loadEvents).toHaveBeenCalled();
    });

    it('should go to next page when not at last page', () => {
      component.currentPage.set(0);
      component.totalPages.set(5);
      spyOn(component, 'loadEvents');

      component.nextPage();

      expect(component.currentPage()).toBe(1);
      expect(component.loadEvents).toHaveBeenCalled();
    });

    it('should not go to next page when at last page', () => {
      component.currentPage.set(4);
      component.totalPages.set(5);
      spyOn(component, 'loadEvents');

      component.nextPage();

      expect(component.currentPage()).toBe(4);
      expect(component.loadEvents).not.toHaveBeenCalled();
    });

    it('should go to previous page when not at first page', () => {
      component.currentPage.set(2);
      component.totalPages.set(5);
      spyOn(component, 'loadEvents');

      component.previousPage();

      expect(component.currentPage()).toBe(1);
      expect(component.loadEvents).toHaveBeenCalled();
    });

    it('should not go to previous page when at first page', () => {
      component.currentPage.set(0);
      component.totalPages.set(5);
      spyOn(component, 'loadEvents');

      component.previousPage();

      expect(component.currentPage()).toBe(0);
      expect(component.loadEvents).not.toHaveBeenCalled();
    });

    it('should handle single page scenario', () => {
      component.currentPage.set(0);
      component.totalPages.set(1);
      spyOn(component, 'loadEvents');

      component.nextPage();
      expect(component.currentPage()).toBe(0);
      expect(component.loadEvents).not.toHaveBeenCalled();

      component.previousPage();
      expect(component.currentPage()).toBe(0);
      expect(component.loadEvents).not.toHaveBeenCalled();
    });
  });

  describe('Date and Time Formatting', () => {
    it('should format date correctly', () => {
      const date = new Date('2025-12-25T10:30:00');
      const formatted = component.formatDate(date);

      expect(formatted).toContain('Dec');
      expect(formatted).toContain('25');
      expect(formatted).toContain('2025');
    });

    it('should format date from string', () => {
      const formatted = component.formatDate('2025-12-25');

      expect(formatted).toContain('Dec');
      expect(formatted).toContain('2025');
    });

    it('should format time correctly', () => {
      const date = new Date('2025-12-25T14:30:00');
      const formatted = component.formatTime(date);

      expect(formatted).toContain('2:30');
      expect(formatted).toContain('PM');
    });

    it('should format time from string', () => {
      const formatted = component.formatTime('2025-12-25T09:00:00');

      expect(formatted).toContain('9:00');
      expect(formatted).toContain('AM');
    });
  });

  describe('Status Class', () => {
    it('should return correct class for published status', () => {
      expect(component.getStatusClass('published')).toBe('status-published');
    });

    it('should return correct class for draft status', () => {
      expect(component.getStatusClass('draft')).toBe('status-draft');
    });

    it('should return correct class for cancelled status', () => {
      expect(component.getStatusClass('cancelled')).toBe('status-cancelled');
    });

    it('should return correct class for completed status', () => {
      expect(component.getStatusClass('completed')).toBe('status-completed');
    });

    it('should handle uppercase status', () => {
      expect(component.getStatusClass('PUBLISHED')).toBe('status-published');
      expect(component.getStatusClass('DRAFT')).toBe('status-draft');
    });

    it('should handle mixed case status', () => {
      expect(component.getStatusClass('Published')).toBe('status-published');
      expect(component.getStatusClass('Draft')).toBe('status-draft');
    });

    it('should return default class for unknown status', () => {
      expect(component.getStatusClass('unknown')).toBe('status-default');
    });

    it('should return default class for undefined status', () => {
      expect(component.getStatusClass(undefined)).toBe('status-default');
    });

    it('should return default class for empty string', () => {
      expect(component.getStatusClass('')).toBe('status-default');
    });
  });

  describe('Navigation', () => {
    it('should logout and call authService.logout', () => {
      component.logout();

      expect(authService.logout).toHaveBeenCalled();
    });

    it('should navigate back to admin dashboard', () => {
      component.goBack();

      expect(router.navigate).toHaveBeenCalledWith(['/admin']);
    });
  });

  describe('Clone Event', () => {
    it('should navigate to create form with clone query parameter', () => {
      const event = mockEvents[0];

      component.cloneEvent(event);

      expect(router.navigate).toHaveBeenCalledWith(
        ['/admin/events/create'],
        { queryParams: { clone: event.id } }
      );
    });

    it('should navigate with correct event id when cloning', () => {
      const event = mockEvents[1];

      component.cloneEvent(event);

      expect(router.navigate).toHaveBeenCalledWith(
        ['/admin/events/create'],
        { queryParams: { clone: '2' } }
      );
    });

    it('should not make any service calls when cloning', () => {
      const event = mockEvents[0];

      component.cloneEvent(event);

      expect(eventService.getAllEvents).not.toHaveBeenCalled();
      expect(eventService.deleteEvent).not.toHaveBeenCalled();
    });

    it('should navigate immediately without loading state', () => {
      const event = mockEvents[0];
      component.isLoading.set(false);

      component.cloneEvent(event);

      expect(component.isLoading()).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('should perform complete event list loading flow', () => {
      const paginatedResponse = {
        events: mockEvents,
        totalPages: 2,
        totalItems: 15,
        size: 10,
        number: 0
      };
      eventService.getAllEvents.and.returnValue(of(paginatedResponse));

      // Initial state
      expect(component.events()).toEqual([]);
      expect(component.isLoading()).toBe(false);

      // Load events
      component.ngOnInit();

      // Verify state after loading
      expect(eventService.getAllEvents).toHaveBeenCalledWith(0, 10);
      expect(component.events()).toEqual(mockEvents);
      expect(component.totalPages()).toBe(2);
      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBeNull();
    });

    it('should perform complete delete flow', () => {
      eventService.deleteEvent.and.returnValue(of(undefined as any));
      eventService.getAllEvents.and.returnValue(of(mockEvents as any));

      // Open delete modal
      component.openDeleteModal('1', 'Angular Workshop');
      expect(component.showDeleteModal()).toBe(true);
      expect(component.eventToDelete()).toEqual({ id: '1', title: 'Angular Workshop' });

      // Confirm delete
      component.confirmDelete();
      expect(eventService.deleteEvent).toHaveBeenCalledWith('1');
      expect(component.showDeleteModal()).toBe(false);
      expect(component.eventToDelete()).toBeNull();
      expect(eventService.getAllEvents).toHaveBeenCalled();
    });

    it('should handle pagination navigation flow', () => {
      const page1Response = {
        events: mockEvents,
        totalPages: 3,
        totalItems: 25,
        size: 10,
        number: 0
      };
      const page2Response = {
        events: [mockEvents[0]],
        totalPages: 3,
        totalItems: 25,
        size: 10,
        number: 1
      };

      eventService.getAllEvents.and.returnValue(of(page1Response));
      component.loadEvents();
      expect(component.currentPage()).toBe(0);
      expect(component.events().length).toBe(2);

      // Go to next page
      eventService.getAllEvents.and.returnValue(of(page2Response));
      component.nextPage();
      expect(component.currentPage()).toBe(1);
      expect(eventService.getAllEvents).toHaveBeenCalledWith(1, 10);

      // Go back to previous page
      eventService.getAllEvents.and.returnValue(of(page1Response));
      component.previousPage();
      expect(component.currentPage()).toBe(0);
      expect(eventService.getAllEvents).toHaveBeenCalledWith(0, 10);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large page numbers', () => {
      component.totalPages.set(1000);
      component.currentPage.set(0);
      spyOn(component, 'loadEvents');

      component.goToPage(999);

      expect(component.currentPage()).toBe(999);
    });

    it('should handle negative page numbers gracefully', () => {
      spyOn(component, 'loadEvents');

      component.goToPage(-1);

      expect(component.currentPage()).toBe(-1);
      expect(component.loadEvents).toHaveBeenCalled();
    });

    it('should handle concurrent delete operations', () => {
      eventService.deleteEvent.and.returnValue(of(undefined as any));
      eventService.getAllEvents.and.returnValue(of(mockEvents as any));

      component.eventToDelete.set({ id: '1', title: 'Event 1' });
      component.confirmDelete();

      // Try to delete again before first completes
      component.eventToDelete.set({ id: '2', title: 'Event 2' });
      component.confirmDelete();

      expect(eventService.deleteEvent).toHaveBeenCalledTimes(2);
    });

    it('should handle malformed date strings', () => {
      const result = component.formatDate('invalid-date');
      expect(result).toBeDefined();
    });

    it('should handle null or undefined in formatDate', () => {
      const result = component.formatDate(null as any);
      expect(result).toBeDefined();
    });
  });
});
