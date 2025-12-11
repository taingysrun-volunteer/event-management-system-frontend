import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { EventDetailComponent } from './event-detail.component';
import { EventService } from '../../../../core/services/event.service';
import { RegistrationService } from '../../../../core/services/registration.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Event } from '../../../../core/models/event.model';
import { Registration, RegistrationStatus } from '../../../../core/models/registration.model';

describe('EventDetailComponent (Admin)', () => {
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

  const mockRegistration: Registration = {
    id: 'reg1',
    event: mockEvent,
    eventId: '1',
    user: {
      id: 'user1',
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'USER'
    },
    userId: 'user1',
    registrationDate: '2025-12-01',
    status: RegistrationStatus.CONFIRMED,
    notes: 'Test notes',
    createdAt: '2025-12-01'
  };

  const mockRegistrationsResponse = {
    registrations: [mockRegistration],
    totalElements: 1,
    totalPages: 1,
    size: 10,
    number: 0
  };

  beforeEach(async () => {
    const eventServiceSpy = jasmine.createSpyObj('EventService', ['getEventById']);
    const registrationServiceSpy = jasmine.createSpyObj('RegistrationService', [
      'getEventRegistrations',
      'updateRegistration',
      'exportEventRegistrations'
    ]);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    activatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('1')
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [EventDetailComponent, FormsModule],
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
      expect(component.registrations()).toEqual([]);
      expect(component.isLoading()).toBe(true);
      expect(component.isLoadingRegistrations()).toBe(false);
      expect(component.errorMessage()).toBeNull();
      expect(component.showRegistrations()).toBe(false);
      expect(component.currentPage()).toBe(0);
      expect(component.totalPages()).toBe(0);
      expect(component.totalRegistrations()).toBe(0);
      expect(component.showUpdateDialog()).toBe(false);
      expect(component.isUpdating()).toBe(false);
      expect(component.selectedRegistration()).toBeNull();
      expect(component.showSuccessDialog()).toBe(false);
      expect(component.showErrorDialog()).toBe(false);
    });

    it('should load event on init', () => {
      eventService.getEventById.and.returnValue(of(mockEvent));

      fixture.detectChanges();

      expect(component.eventId).toBe('1');
      expect(eventService.getEventById).toHaveBeenCalledWith('1');
    });

    it('should expose RegistrationStatus enum to template', () => {
      expect(component.RegistrationStatus).toBe(RegistrationStatus);
    });
  });

  describe('Load Event', () => {
    it('should load event successfully', () => {
      component.eventId = '1';
      eventService.getEventById.and.returnValue(of(mockEvent));

      component.loadEvent();

      expect(component.event()).toEqual(mockEvent);
      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBeNull();
    });

    it('should handle event load error', () => {
      component.eventId = '1';
      const error = new Error('Failed to load event');
      eventService.getEventById.and.returnValue(throwError(() => error));

      spyOn(console, 'error');
      component.loadEvent();

      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBe('Failed to load event details');
      expect(console.error).toHaveBeenCalledWith('Error loading event:', error);
    });

    it('should handle invalid event ID', () => {
      component.eventId = '';

      component.loadEvent();

      expect(component.errorMessage()).toBe('Invalid event ID');
      expect(component.isLoading()).toBe(false);
      expect(eventService.getEventById).not.toHaveBeenCalled();
    });
  });

  describe('Date and Time Formatting', () => {
    it('should format date correctly', () => {
      const result = component.formatDate('2025-12-31');
      expect(result).toContain('2025');
      expect(result).toContain('December');
      expect(result).toMatch(/30|31/); // Account for timezone differences
    });

    it('should format time correctly', () => {
      const result = component.formatTime('2025-12-31T10:00:00Z');
      expect(result).toContain(':');
    });

    it('should format registration date correctly', () => {
      const result = component.formatRegistrationDate('2025-12-01T10:00:00Z');
      expect(result).toContain('2025');
      expect(result).toContain('Dec');
    });
  });

  describe('Status Classes', () => {
    it('should return correct class for active status', () => {
      expect(component.getStatusClass('active')).toBe('status-active');
    });

    it('should return correct class for completed status', () => {
      expect(component.getStatusClass('completed')).toBe('status-completed');
    });

    it('should return correct class for cancelled status', () => {
      expect(component.getStatusClass('cancelled')).toBe('status-cancelled');
    });

    it('should return correct class for postponed status', () => {
      expect(component.getStatusClass('postponed')).toBe('status-postponed');
    });

    it('should return default class for unknown status', () => {
      expect(component.getStatusClass('unknown')).toBe('status-default');
    });

    it('should handle undefined status', () => {
      expect(component.getStatusClass(undefined)).toBe('status-default');
    });

    it('should handle case insensitivity', () => {
      expect(component.getStatusClass('ACTIVE')).toBe('status-active');
      expect(component.getStatusClass('Completed')).toBe('status-completed');
    });
  });

  describe('Registration Status Classes', () => {
    it('should return correct class for confirmed status', () => {
      expect(component.getRegistrationStatusClass(RegistrationStatus.CONFIRMED)).toBe('status-confirmed');
    });

    it('should return correct class for cancelled status', () => {
      expect(component.getRegistrationStatusClass(RegistrationStatus.CANCELLED)).toBe('status-cancelled');
    });

    it('should return correct class for pending status', () => {
      expect(component.getRegistrationStatusClass(RegistrationStatus.PENDING)).toBe('status-pending');
    });

    it('should handle lowercase status', () => {
      expect(component.getRegistrationStatusClass('confirmed')).toBe('status-confirmed');
    });

    it('should return empty string for unknown status', () => {
      expect(component.getRegistrationStatusClass('unknown')).toBe('');
    });
  });

  describe('Navigation', () => {
    it('should navigate back to admin events', () => {
      component.goBack();
      expect(router.navigate).toHaveBeenCalledWith(['/admin/events']);
    });

    it('should navigate to edit event', () => {
      component.eventId = '1';
      component.goToEdit();
      expect(router.navigate).toHaveBeenCalledWith(['/admin/events/edit', '1']);
    });

    it('should logout', () => {
      component.logout();
      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe('Toggle Registrations', () => {
    it('should toggle registrations visibility', () => {
      component.showRegistrations.set(false);

      component.toggleRegistrations();

      expect(component.showRegistrations()).toBe(true);
    });

    it('should load registrations when toggled on for first time', () => {
      registrationService.getEventRegistrations.and.returnValue(of(mockRegistrationsResponse));
      component.showRegistrations.set(false);
      component.registrations.set([]);

      component.toggleRegistrations();

      expect(registrationService.getEventRegistrations).toHaveBeenCalled();
    });

    it('should not load registrations if already loaded', () => {
      component.showRegistrations.set(false);
      component.registrations.set([mockRegistration]);

      component.toggleRegistrations();

      expect(registrationService.getEventRegistrations).not.toHaveBeenCalled();
    });

    it('should toggle off without reloading', () => {
      component.showRegistrations.set(true);

      component.toggleRegistrations();

      expect(component.showRegistrations()).toBe(false);
      expect(registrationService.getEventRegistrations).not.toHaveBeenCalled();
    });
  });

  describe('Load Registrations', () => {
    beforeEach(() => {
      component.eventId = '1';
    });

    it('should load registrations successfully', () => {
      registrationService.getEventRegistrations.and.returnValue(of(mockRegistrationsResponse));

      component.loadRegistrations();

      expect(component.registrations()).toEqual([mockRegistration]);
      expect(component.totalPages()).toBe(1);
      expect(component.totalRegistrations()).toBe(1);
      expect(component.isLoadingRegistrations()).toBe(false);
    });

    it('should handle registrations load error', () => {
      const error = new Error('Failed to load');
      registrationService.getEventRegistrations.and.returnValue(throwError(() => error));

      spyOn(console, 'error');
      component.loadRegistrations();

      expect(component.isLoadingRegistrations()).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error loading registrations:', error);
    });

    it('should not load if event ID is missing', () => {
      component.eventId = '';

      component.loadRegistrations();

      expect(registrationService.getEventRegistrations).not.toHaveBeenCalled();
    });

    it('should pass correct pagination parameters', () => {
      registrationService.getEventRegistrations.and.returnValue(of(mockRegistrationsResponse));
      component.currentPage.set(2);
      component.pageSize = 20;

      component.loadRegistrations();

      expect(registrationService.getEventRegistrations).toHaveBeenCalledWith('1', 2, 20);
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      component.eventId = '1';
      component.totalPages.set(5);
      registrationService.getEventRegistrations.and.returnValue(of(mockRegistrationsResponse));
    });

    it('should go to specific page', () => {
      component.goToPage(2);

      expect(component.currentPage()).toBe(2);
      expect(registrationService.getEventRegistrations).toHaveBeenCalledWith('1', 2, 10);
    });

    it('should not go to page less than 0', () => {
      component.currentPage.set(1);

      component.goToPage(-1);

      expect(component.currentPage()).toBe(1);
      expect(registrationService.getEventRegistrations).not.toHaveBeenCalled();
    });

    it('should not go to page greater than total pages', () => {
      component.currentPage.set(1);

      component.goToPage(10);

      expect(component.currentPage()).toBe(1);
      expect(registrationService.getEventRegistrations).not.toHaveBeenCalled();
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

  describe('Export Registrations', () => {
    beforeEach(() => {
      component.eventId = '1';
    });

    it('should export registrations successfully', () => {
      const mockBlob = new Blob(['test'], { type: 'text/csv' });
      registrationService.exportEventRegistrations.and.returnValue(of(mockBlob));

      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:test');
      spyOn(window.URL, 'revokeObjectURL');
      const linkSpy = jasmine.createSpyObj('a', ['click']);
      spyOn(document, 'createElement').and.returnValue(linkSpy);

      component.exportRegistrations();

      expect(registrationService.exportEventRegistrations).toHaveBeenCalledWith('1');
      expect(linkSpy.download).toBe('event-1-registrations.csv');
      expect(linkSpy.click).toHaveBeenCalled();
      expect(window.URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should handle export error', () => {
      const error = new Error('Export failed');
      registrationService.exportEventRegistrations.and.returnValue(throwError(() => error));

      spyOn(console, 'error');
      spyOn(window, 'alert');

      component.exportRegistrations();

      expect(console.error).toHaveBeenCalledWith('Error exporting registrations:', error);
      expect(window.alert).toHaveBeenCalledWith('Failed to export registrations. Please try again.');
    });

    it('should not export if event ID is missing', () => {
      component.eventId = '';

      component.exportRegistrations();

      expect(registrationService.exportEventRegistrations).not.toHaveBeenCalled();
    });
  });

  describe('Update Registration Dialog', () => {
    it('should open update dialog with registration data', () => {
      component.openUpdateDialog(mockRegistration);

      expect(component.selectedRegistration()).toEqual(mockRegistration);
      expect(component.showUpdateDialog()).toBe(true);
      expect(component.updateData.status).toBe(RegistrationStatus.CONFIRMED);
      expect(component.updateData.notes).toBe('Test notes');
    });

    it('should handle registration without notes', () => {
      const regWithoutNotes = { ...mockRegistration, notes: undefined };

      component.openUpdateDialog(regWithoutNotes);

      expect(component.updateData.notes).toBe('');
    });

    it('should close update dialog when not updating', () => {
      component.isUpdating.set(false);
      component.showUpdateDialog.set(true);
      component.selectedRegistration.set(mockRegistration);

      component.closeUpdateDialog();

      expect(component.showUpdateDialog()).toBe(false);
      expect(component.selectedRegistration()).toBeNull();
      expect(component.updateData.status).toBeUndefined();
      expect(component.updateData.notes).toBeUndefined();
    });

    it('should not close update dialog when updating', () => {
      component.isUpdating.set(true);
      component.showUpdateDialog.set(true);

      component.closeUpdateDialog();

      expect(component.showUpdateDialog()).toBe(true);
    });
  });

  describe('Confirm Update', () => {
    const updatedRegistration: Registration = {
      ...mockRegistration,
      status: RegistrationStatus.CANCELLED,
      notes: 'Updated notes'
    };

    beforeEach(() => {
      component.selectedRegistration.set(mockRegistration);
      component.registrations.set([mockRegistration]);
      component.updateData = {
        status: RegistrationStatus.CANCELLED,
        notes: 'Updated notes'
      };
    });

    it('should update registration successfully', () => {
      const expectedUpdateData = {
        status: RegistrationStatus.CANCELLED,
        notes: 'Updated notes'
      };
      registrationService.updateRegistration.and.returnValue(of(updatedRegistration));

      component.confirmUpdate();

      expect(registrationService.updateRegistration).toHaveBeenCalledWith('reg1', expectedUpdateData);
      expect(component.isUpdating()).toBe(false);
      expect(component.showUpdateDialog()).toBe(false);
      expect(component.showSuccessDialog()).toBe(true);
      expect(component.dialogTitle).toBe('Registration Updated!');
    });

    it('should update registration in list', () => {
      registrationService.updateRegistration.and.returnValue(of(updatedRegistration));

      component.confirmUpdate();

      const registrations = component.registrations();
      expect(registrations[0].status).toBe(RegistrationStatus.CANCELLED);
      expect(registrations[0].notes).toBe('Updated notes');
    });

    it('should reset form data after update', () => {
      registrationService.updateRegistration.and.returnValue(of(updatedRegistration));

      component.confirmUpdate();

      expect(component.selectedRegistration()).toBeNull();
      expect(component.updateData.status).toBeUndefined();
      expect(component.updateData.notes).toBeUndefined();
    });

    it('should handle update error', () => {
      const error = { error: { message: 'Update failed' } };
      registrationService.updateRegistration.and.returnValue(throwError(() => error));

      spyOn(console, 'error');
      component.confirmUpdate();

      expect(component.isUpdating()).toBe(false);
      expect(component.showErrorDialog()).toBe(true);
      expect(component.dialogTitle).toBe('Update Failed');
      expect(component.dialogMessage).toBe('Update failed');
      expect(console.error).toHaveBeenCalled();
    });

    it('should use default error message if none provided', () => {
      const error = { status: 500 };
      registrationService.updateRegistration.and.returnValue(throwError(() => error));

      component.confirmUpdate();

      expect(component.dialogMessage).toBe('Failed to update registration. Please try again.');
    });

    it('should not update if no registration selected', () => {
      component.selectedRegistration.set(null);

      component.confirmUpdate();

      expect(registrationService.updateRegistration).not.toHaveBeenCalled();
    });
  });

  describe('Dialog Management', () => {
    it('should close success dialog', () => {
      component.showSuccessDialog.set(true);

      component.closeSuccessDialog();

      expect(component.showSuccessDialog()).toBe(false);
    });

    it('should close error dialog', () => {
      component.showErrorDialog.set(true);

      component.closeErrorDialog();

      expect(component.showErrorDialog()).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('should complete full event loading flow', () => {
      eventService.getEventById.and.returnValue(of(mockEvent));
      registrationService.getEventRegistrations.and.returnValue(of(mockRegistrationsResponse));

      component.eventId = '1';
      component.loadEvent();

      expect(component.event()).toEqual(mockEvent);
      expect(component.isLoading()).toBe(false);

      component.toggleRegistrations();

      expect(component.showRegistrations()).toBe(true);
      expect(component.registrations()).toEqual([mockRegistration]);
    });

    it('should complete full registration update flow', () => {
      const updatedReg: Registration = {
        ...mockRegistration,
        status: RegistrationStatus.PENDING
      };
      component.registrations.set([mockRegistration]);
      registrationService.updateRegistration.and.returnValue(of(updatedReg));

      component.openUpdateDialog(mockRegistration);
      expect(component.showUpdateDialog()).toBe(true);

      component.updateData.status = RegistrationStatus.PENDING;
      component.confirmUpdate();

      expect(component.showSuccessDialog()).toBe(true);
      expect(component.showUpdateDialog()).toBe(false);

      component.closeSuccessDialog();
      expect(component.showSuccessDialog()).toBe(false);
    });

    it('should handle pagination flow', () => {
      const mockResponse = {
        ...mockRegistrationsResponse,
        totalPages: 3
      };
      registrationService.getEventRegistrations.and.returnValue(of(mockResponse));
      component.eventId = '1';

      component.loadRegistrations();
      expect(component.currentPage()).toBe(0);

      component.nextPage();
      expect(component.currentPage()).toBe(1);

      component.nextPage();
      expect(component.currentPage()).toBe(2);

      component.previousPage();
      expect(component.currentPage()).toBe(1);

      component.goToPage(0);
      expect(component.currentPage()).toBe(0);
    });
  });
});
