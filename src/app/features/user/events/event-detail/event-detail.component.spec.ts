import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { EventDetailComponent } from './event-detail.component';
import { EventService } from '../../../../core/services/event.service';
import { RegistrationService } from '../../../../core/services/registration.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Event } from '../../../../core/models/event.model';

describe('EventDetailComponent (User)', () => {
  let component: EventDetailComponent;
  let fixture: ComponentFixture<EventDetailComponent>;
  let eventService: jasmine.SpyObj<EventService>;
  let registrationService: jasmine.SpyObj<RegistrationService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: any;

  const mockEvent: Event = {
    id: '1',
    title: 'Test Event',
    description: 'Test Description',
    eventDate: '2025-12-31',
    startTime: '2025-12-31T10:00:00Z',
    endTime: '2025-12-31T12:00:00Z',
    location: 'Test Location',
    capacity: 100,
    availableSeats: 50,
    status: 'published',
    categoryId: 1
  };

  const mockUser = {
    id: 'user123',
    username: 'testuser',
    email: 'test@example.com'
  };

  beforeEach(async () => {
    const eventServiceSpy = jasmine.createSpyObj('EventService', ['getEventById']);
    const registrationServiceSpy = jasmine.createSpyObj('RegistrationService', [
      'isRegisteredForEvent',
      'registerForEvent',
      'cancelRegistration'
    ]);
    const currentUserSignal = jasmine.createSpy('currentUser').and.returnValue(mockUser);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
    authServiceSpy.currentUser = currentUserSignal;
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    activatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('1')
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [EventDetailComponent],
      providers: [
        { provide: EventService, useValue: eventServiceSpy },
        { provide: RegistrationService, useValue: registrationServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EventDetailComponent);
    component = fixture.componentInstance;
    eventService = TestBed.inject(EventService) as jasmine.SpyObj<EventService>;
    registrationService = TestBed.inject(RegistrationService) as jasmine.SpyObj<RegistrationService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize signals with default values', () => {
      expect(component.event()).toBeNull();
      expect(component.loading()).toBe(true);
      expect(component.showRegisterModal()).toBe(false);
      expect(component.registering()).toBe(false);
      expect(component.registrationSuccess()).toBe(false);
      expect(component.registrationError()).toBeNull();
      expect(component.isAlreadyRegistered()).toBe(false);
      expect(component.existingRegistrationId()).toBeNull();
      expect(component.showCancelDialog()).toBe(false);
      expect(component.cancelling()).toBe(false);
      expect(component.showCancelSuccessDialog()).toBe(false);
    });

    it('should load event and check registration status on init', () => {
      eventService.getEventById.and.returnValue(of(mockEvent));
      registrationService.isRegisteredForEvent.and.returnValue(of({ registered: false }));

      fixture.detectChanges();

      expect(activatedRoute.snapshot.paramMap.get).toHaveBeenCalledWith('id');
      expect(eventService.getEventById).toHaveBeenCalledWith('1');
      expect(registrationService.isRegisteredForEvent).toHaveBeenCalledWith('1');
    });

    it('should set current user on init', () => {
      eventService.getEventById.and.returnValue(of(mockEvent));
      registrationService.isRegisteredForEvent.and.returnValue(of({ registered: false }));

      fixture.detectChanges();

      expect(component.currentUser).toEqual(mockUser);
    });

    it('should reset registration status on init', () => {
      component.isAlreadyRegistered.set(true);
      component.existingRegistrationId.set('existing-id');
      eventService.getEventById.and.returnValue(of(mockEvent));
      registrationService.isRegisteredForEvent.and.returnValue(of({ registered: false }));

      component.ngOnInit();

      expect(component.isAlreadyRegistered()).toBe(false);
      expect(component.existingRegistrationId()).toBeNull();
    });
  });

  describe('Load Event', () => {
    it('should load event successfully', () => {
      eventService.getEventById.and.returnValue(of(mockEvent));
      registrationService.isRegisteredForEvent.and.returnValue(of({ registered: false }));

      component.loadEvent('1');

      expect(component.event()).toEqual(mockEvent);
      expect(component.loading()).toBe(false);
    });

    it('should handle event load error and navigate to events list', () => {
      const error = new Error('Failed to load event');
      eventService.getEventById.and.returnValue(throwError(() => error));
      registrationService.isRegisteredForEvent.and.returnValue(of({ registered: false }));

      component.loadEvent('1');

      expect(component.loading()).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/events']);
    });

    it('should set loading to true when loading event', () => {
      eventService.getEventById.and.returnValue(of(mockEvent));
      registrationService.isRegisteredForEvent.and.returnValue(of({ registered: false }));

      component.loading.set(false);
      component.loadEvent('1');

      expect(eventService.getEventById).toHaveBeenCalledWith('1');
    });
  });

  describe('Check Registration Status', () => {
    it('should check registration status successfully', () => {
      registrationService.isRegisteredForEvent.and.returnValue(
        of({ registered: true, registrationId: 'reg123' })
      );

      component.checkRegistrationStatus('1');

      expect(component.isAlreadyRegistered()).toBe(true);
      expect(component.existingRegistrationId()).toBe('reg123');
    });

    it('should handle not registered status', () => {
      registrationService.isRegisteredForEvent.and.returnValue(
        of({ registered: false })
      );

      component.checkRegistrationStatus('1');

      expect(component.isAlreadyRegistered()).toBe(false);
    });

    it('should handle registration check error', () => {
      const error = new Error('Check failed');
      registrationService.isRegisteredForEvent.and.returnValue(throwError(() => error));

      spyOn(console, 'error');
      component.checkRegistrationStatus('1');

      expect(console.error).toHaveBeenCalledWith('Error checking registration status:', error);
    });
  });

  describe('Event Date and Time Formatting', () => {
    it('should format event date correctly', () => {
      const result = component.getEventDate(mockEvent);
      expect(result).toContain('2025');
      expect(result).toContain('December');
      expect(result).toMatch(/30|31/); // Account for timezone differences
    });

    it('should format event time correctly', () => {
      const result = component.getEventTime(mockEvent);
      expect(result).toContain(':');
      expect(result).toContain('-');
    });
  });

  describe('Event Status Checks', () => {
    it('should return true if event is full', () => {
      const fullEvent = { ...mockEvent, availableSeats: 0 };
      expect(component.isEventFull(fullEvent)).toBe(true);
    });

    it('should return false if event has available seats', () => {
      expect(component.isEventFull(mockEvent)).toBe(false);
    });

    it('should return true if event is upcoming', () => {
      const futureEvent = {
        ...mockEvent,
        eventDate: new Date(Date.now() + 86400000).toISOString()
      };
      expect(component.isEventUpcoming(futureEvent)).toBe(true);
    });

    it('should return false if event is past', () => {
      const pastEvent = {
        ...mockEvent,
        eventDate: new Date(Date.now() - 86400000).toISOString()
      };
      expect(component.isEventUpcoming(pastEvent)).toBe(false);
    });
  });

  describe('Can Register', () => {
    it('should allow registration for upcoming, published event with seats', () => {
      const futureEvent = {
        ...mockEvent,
        eventDate: new Date(Date.now() + 86400000).toISOString(),
        status: 'published' as const,
        availableSeats: 10
      };
      component.isAlreadyRegistered.set(false);

      expect(component.canRegister(futureEvent)).toBe(true);
    });

    it('should not allow registration if event is full', () => {
      const futureEvent = {
        ...mockEvent,
        eventDate: new Date(Date.now() + 86400000).toISOString(),
        status: 'published' as const,
        availableSeats: 0
      };
      component.isAlreadyRegistered.set(false);

      expect(component.canRegister(futureEvent)).toBe(false);
    });

    it('should not allow registration if already registered', () => {
      const futureEvent = {
        ...mockEvent,
        eventDate: new Date(Date.now() + 86400000).toISOString(),
        status: 'published' as const,
        availableSeats: 10
      };
      component.isAlreadyRegistered.set(true);

      expect(component.canRegister(futureEvent)).toBe(false);
    });

    it('should not allow registration if event is not published', () => {
      const futureEvent = {
        ...mockEvent,
        eventDate: new Date(Date.now() + 86400000).toISOString(),
        status: 'draft' as const,
        availableSeats: 10
      };
      component.isAlreadyRegistered.set(false);

      expect(component.canRegister(futureEvent)).toBe(false);
    });

    it('should not allow registration if event is past', () => {
      const pastEvent = {
        ...mockEvent,
        eventDate: new Date(Date.now() - 86400000).toISOString(),
        status: 'published' as const,
        availableSeats: 10
      };
      component.isAlreadyRegistered.set(false);

      expect(component.canRegister(pastEvent)).toBe(false);
    });
  });

  describe('Register Modal', () => {
    it('should open register modal', () => {
      component.registrationError.set('Previous error');
      component.openRegisterModal();

      expect(component.showRegisterModal()).toBe(true);
      expect(component.registrationError()).toBeNull();
    });

    it('should close register modal and reset states', () => {
      component.showRegisterModal.set(true);
      component.registrationSuccess.set(true);
      component.registrationError.set('Error');

      component.closeRegisterModal();

      expect(component.showRegisterModal()).toBe(false);
      expect(component.registrationSuccess()).toBe(false);
      expect(component.registrationError()).toBeNull();
    });
  });

  describe('Confirm Registration', () => {
    beforeEach(() => {
      component.currentUser = mockUser; // Set current user
      component.event.set(mockEvent);
      eventService.getEventById.and.returnValue(of(mockEvent));
      registrationService.isRegisteredForEvent.and.returnValue(of({ registered: false }));
    });

    it('should register for event successfully', fakeAsync(() => {
      component.showRegisterModal.set(true); // Open modal first
      const mockResponse = { id: 'reg123', eventId: '1', userId: 'user123', status: 'CONFIRMED', registrationDate: new Date().toISOString() };
      registrationService.registerForEvent.and.returnValue(of(mockResponse));

      component.confirmRegistration();
      tick(); // Let the observable complete

      expect(component.registering()).toBe(false);
      expect(component.registrationSuccess()).toBe(true);
      expect(component.isAlreadyRegistered()).toBe(true);
      expect(component.existingRegistrationId()).toBe('reg123');
      expect(component.showRegisterModal()).toBe(true); // Still open before timeout

      tick(2000);

      expect(component.showRegisterModal()).toBe(false); // Closed after timeout
    }));

    it('should call registration service with correct parameters', () => {
      const mockResponse = { id: 'reg123', eventId: '1', userId: 'user123', status: 'CONFIRMED', registrationDate: new Date().toISOString() };
      registrationService.registerForEvent.and.returnValue(of(mockResponse));

      component.confirmRegistration();

      expect(registrationService.registerForEvent).toHaveBeenCalledWith({
        eventId: '1',
        userId: 'user123'
      });
    });

    it('should reload event after successful registration', () => {
      const mockResponse = { id: 'reg123', eventId: '1', userId: 'user123', status: 'CONFIRMED', registrationDate: new Date().toISOString() };
      registrationService.registerForEvent.and.returnValue(of(mockResponse));

      component.confirmRegistration();

      expect(eventService.getEventById).toHaveBeenCalledWith('1');
    });

    it('should handle registration error', () => {
      const error = { error: { message: 'Registration failed' } };
      registrationService.registerForEvent.and.returnValue(throwError(() => error));

      spyOn(console, 'error');
      component.confirmRegistration();

      expect(component.registering()).toBe(false);
      expect(component.registrationError()).toBe('Registration failed');
      expect(component.registrationSuccess()).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });

    it('should use default error message if no message from server', () => {
      const error = { status: 500 };
      registrationService.registerForEvent.and.returnValue(throwError(() => error));

      component.confirmRegistration();

      expect(component.registrationError()).toBe('Failed to register for event. Please try again.');
    });

    it('should not register if event is null', () => {
      component.event.set(null);

      component.confirmRegistration();

      expect(registrationService.registerForEvent).not.toHaveBeenCalled();
    });
  });

  describe('Cancel Registration', () => {
    beforeEach(() => {
      component.event.set(mockEvent);
      component.existingRegistrationId.set('reg123');
      eventService.getEventById.and.returnValue(of(mockEvent));
      registrationService.isRegisteredForEvent.and.returnValue(of({ registered: false }));
    });

    it('should open cancel dialog', () => {
      component.openCancelDialog();
      expect(component.showCancelDialog()).toBe(true);
    });

    it('should close cancel dialog when not cancelling', () => {
      component.cancelling.set(false);
      component.showCancelDialog.set(true);

      component.closeCancelDialog();

      expect(component.showCancelDialog()).toBe(false);
    });

    it('should not close cancel dialog when cancelling', () => {
      component.cancelling.set(true);
      component.showCancelDialog.set(true);

      component.closeCancelDialog();

      expect(component.showCancelDialog()).toBe(true);
    });

    it('should cancel registration successfully', () => {
      registrationService.cancelRegistration.and.returnValue(of({} as any));

      component.confirmCancelRegistration();

      expect(component.cancelling()).toBe(false);
      expect(component.isAlreadyRegistered()).toBe(false);
      expect(component.existingRegistrationId()).toBeNull();
      expect(component.showCancelDialog()).toBe(false);
      expect(component.showCancelSuccessDialog()).toBe(true);
    });

    it('should reload event after successful cancellation', () => {
      registrationService.cancelRegistration.and.returnValue(of({} as any));

      component.confirmCancelRegistration();

      expect(eventService.getEventById).toHaveBeenCalledWith('1');
    });

    it('should handle cancellation error', () => {
      const error = new Error('Cancellation failed');
      registrationService.cancelRegistration.and.returnValue(throwError(() => error));

      spyOn(console, 'error');
      spyOn(window, 'alert');

      component.confirmCancelRegistration();

      expect(component.cancelling()).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error cancelling registration:', error);
      expect(window.alert).toHaveBeenCalledWith('Failed to cancel registration. Please try again.');
    });

    it('should not cancel if no registration id', () => {
      component.existingRegistrationId.set(null);

      component.confirmCancelRegistration();

      expect(registrationService.cancelRegistration).not.toHaveBeenCalled();
    });

    it('should close cancel success dialog', () => {
      component.showCancelSuccessDialog.set(true);
      component.closeCancelSuccessDialog();
      expect(component.showCancelSuccessDialog()).toBe(false);
    });
  });

  describe('Navigation', () => {
    it('should navigate back to events list', () => {
      component.goBack();
      expect(router.navigate).toHaveBeenCalledWith(['/events']);
    });

    it('should logout', () => {
      component.logout();
      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe('Status Class', () => {
    it('should return correct class for active status', () => {
      expect(component.getStatusClass('active')).toBe('status-active');
    });

    it('should return correct class for published status', () => {
      expect(component.getStatusClass('published')).toBe('status-published');
    });

    it('should return correct class for cancelled status', () => {
      expect(component.getStatusClass('cancelled')).toBe('status-cancelled');
    });

    it('should return correct class for completed status', () => {
      expect(component.getStatusClass('completed')).toBe('status-completed');
    });

    it('should return correct class for draft status', () => {
      expect(component.getStatusClass('draft')).toBe('status-draft');
    });

    it('should return empty string for unknown status', () => {
      expect(component.getStatusClass('unknown')).toBe('');
    });

    it('should handle undefined status', () => {
      expect(component.getStatusClass(undefined)).toBe('');
    });

    it('should handle case insensitivity', () => {
      expect(component.getStatusClass('ACTIVE')).toBe('status-active');
      expect(component.getStatusClass('Published')).toBe('status-published');
    });
  });

  describe('Integration Tests', () => {
    it('should complete full registration flow', fakeAsync(() => {
      component.currentUser = mockUser; // Set current user
      component.event.set(mockEvent); // Set event
      eventService.getEventById.and.returnValue(of(mockEvent));
      registrationService.isRegisteredForEvent.and.returnValue(of({ registered: false }));
      const mockResponse = { id: 'reg123', eventId: '1', userId: 'user123', status: 'CONFIRMED', registrationDate: new Date().toISOString() };
      registrationService.registerForEvent.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      expect(component.isAlreadyRegistered()).toBe(false);

      component.openRegisterModal();
      expect(component.showRegisterModal()).toBe(true);

      component.confirmRegistration();
      tick(); // Let the observable complete

      expect(component.registrationSuccess()).toBe(true);
      expect(component.isAlreadyRegistered()).toBe(true);
      expect(component.showRegisterModal()).toBe(true); // Still open before timeout

      tick(2000);
      expect(component.showRegisterModal()).toBe(false);
    }));

    it('should complete full cancellation flow', () => {
      component.event.set(mockEvent);
      component.existingRegistrationId.set('reg123');
      component.isAlreadyRegistered.set(true);
      eventService.getEventById.and.returnValue(of(mockEvent));
      registrationService.isRegisteredForEvent.and.returnValue(of({ registered: false }));
      registrationService.cancelRegistration.and.returnValue(of({} as any));

      component.openCancelDialog();
      expect(component.showCancelDialog()).toBe(true);

      component.confirmCancelRegistration();
      expect(component.isAlreadyRegistered()).toBe(false);
      expect(component.showCancelDialog()).toBe(false);
      expect(component.showCancelSuccessDialog()).toBe(true);

      component.closeCancelSuccessDialog();
      expect(component.showCancelSuccessDialog()).toBe(false);
    });
  });
});
