import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MyRegistrationsComponent } from './my-registrations.component';
import { RegistrationService } from '../../../core/services/registration.service';
import { AuthService } from '../../../core/services/auth.service';
import { Registration, RegistrationStatus } from '../../../core/models/registration.model';
import { Event } from '../../../core/models/event.model';

describe('MyRegistrationsComponent', () => {
  let component: MyRegistrationsComponent;
  let fixture: ComponentFixture<MyRegistrationsComponent>;
  let registrationService: jasmine.SpyObj<RegistrationService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

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
    status: 'published'
  };

  const mockRegistrations: Registration[] = [
    {
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
      createdAt: '2025-12-01T10:00:00Z',
      ticketId: 'ticket123'
    }
  ];

  const mockRegistrationsResponse = {
    registrations: mockRegistrations,
    totalPages: 1,
    totalElements: 1,
    size: 10,
    number: 0
  };

  const mockUser = {
    id: 'user123',
    username: 'testuser',
    email: 'test@example.com'
  };

  const mockTicketResponse = {
    id: 'ticket123',
    code: 'TICKET-123',
    qrCode: 'mock-qr-code-data',
    registrationId: 'reg1'
  };

  beforeEach(async () => {
    const registrationServiceSpy = jasmine.createSpyObj('RegistrationService', [
      'getMyRegistrations',
      'cancelRegistration',
      'getTicket',
      'generateTicket'
    ]);
    const currentUserSignal = jasmine.createSpy('currentUser').and.returnValue(mockUser);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
    authServiceSpy.currentUser = currentUserSignal;
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [MyRegistrationsComponent],
      providers: [
        { provide: RegistrationService, useValue: registrationServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MyRegistrationsComponent);
    component = fixture.componentInstance;
    registrationService = TestBed.inject(RegistrationService) as jasmine.SpyObj<RegistrationService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize signals with default values', () => {
      expect(component.registrations()).toEqual([]);
      expect(component.loading()).toBe(false);
      expect(component.currentPage()).toBe(0);
      expect(component.totalPages()).toBe(0);
      expect(component.showCancelDialog()).toBe(false);
      expect(component.cancelling()).toBe(false);
      expect(component.showCancelSuccessDialog()).toBe(false);
      expect(component.showQRCodeModal()).toBe(false);
      expect(component.qrCodeData()).toBe('');
    });

    it('should load registrations on init', () => {
      registrationService.getMyRegistrations.and.returnValue(of(mockRegistrationsResponse));

      fixture.detectChanges();

      expect(component.currentUser).toEqual(mockUser);
      expect(registrationService.getMyRegistrations).toHaveBeenCalledWith('user123', 0, 10);
    });
  });

  describe('Load Registrations', () => {
    it('should load registrations successfully', () => {
      registrationService.getMyRegistrations.and.returnValue(of(mockRegistrationsResponse));

      component.loadRegistrations();

      expect(component.registrations()).toEqual(mockRegistrations);
      expect(component.totalPages()).toBe(1);
      expect(component.totalElements()).toBe(1);
      expect(component.loading()).toBe(false);
    });

    it('should handle registrations load error', () => {
      const error = new Error('Failed to load');
      registrationService.getMyRegistrations.and.returnValue(throwError(() => error));

      spyOn(console, 'error');
      component.loadRegistrations();

      expect(component.loading()).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error loading registrations:', error);
    });
  });

  describe('Date Formatting', () => {
    it('should format event date correctly', () => {
      const result = component.getEventDate(mockRegistrations[0]);
      expect(result).toContain('2025');
      expect(result).toContain('Dec');
    });

    it('should return N/A if event date is missing', () => {
      const regWithoutDate = {
        ...mockRegistrations[0],
        event: { ...mockEvent, eventDate: undefined as any }
      };
      expect(component.getEventDate(regWithoutDate)).toBe('N/A');
    });

    it('should return Invalid Date for invalid date', () => {
      const regWithInvalidDate = {
        ...mockRegistrations[0],
        event: { ...mockEvent, eventDate: 'invalid-date' }
      };
      expect(component.getEventDate(regWithInvalidDate)).toBe('Invalid Date');
    });

    it('should format event time correctly', () => {
      const result = component.getEventTime(mockRegistrations[0]);
      expect(result).toContain(':');
      expect(result).toContain('-');
    });

    it('should return N/A if event time is missing', () => {
      const regWithoutTime = {
        ...mockRegistrations[0],
        event: { ...mockEvent, startTime: undefined as any }
      };
      expect(component.getEventTime(regWithoutTime)).toBe('N/A');
    });

    it('should format registration date correctly', () => {
      const result = component.getRegistrationDate(mockRegistrations[0]);
      expect(result).toContain('2025');
      expect(result).toContain('Dec');
    });

    it('should return N/A if registration date is missing', () => {
      const regWithoutCreatedAt = {
        ...mockRegistrations[0],
        createdAt: undefined as any
      };
      expect(component.getRegistrationDate(regWithoutCreatedAt)).toBe('N/A');
    });
  });

  describe('Event Status Checks', () => {
    it('should identify upcoming event', () => {
      const futureReg = {
        ...mockRegistrations[0],
        event: {
          ...mockEvent,
          eventDate: new Date(Date.now() + 86400000).toISOString()
        }
      };
      expect(component.isEventUpcoming(futureReg)).toBe(true);

      const pastReg = {
        ...mockRegistrations[0],
        event: {
          ...mockEvent,
          eventDate: new Date(Date.now() - 86400000).toISOString()
        }
      };
      expect(component.isEventUpcoming(pastReg)).toBe(false);
    });

    it('should identify event today', () => {
      const todayReg = {
        ...mockRegistrations[0],
        event: {
          ...mockEvent,
          eventDate: new Date().toISOString()
        }
      };
      expect(component.isEventToday(todayReg)).toBe(true);
    });
  });

  describe('Status Classes', () => {
    it('should return correct class for confirmed status', () => {
      expect(component.getStatusClass(RegistrationStatus.CONFIRMED)).toBe('status-confirmed');
    });

    it('should return correct class for cancelled status', () => {
      expect(component.getStatusClass(RegistrationStatus.CANCELLED)).toBe('status-cancelled');
    });

    it('should return correct class for pending status', () => {
      expect(component.getStatusClass(RegistrationStatus.PENDING)).toBe('status-pending');
    });

    it('should handle case insensitivity', () => {
      expect(component.getStatusClass('confirmed')).toBe('status-confirmed');
    });
  });

  describe('Cancel Registration', () => {
    beforeEach(() => {
      registrationService.getMyRegistrations.and.returnValue(of(mockRegistrationsResponse));
    });

    it('should open cancel dialog', () => {
      component.openCancelDialog(mockRegistrations[0]);

      expect(component.selectedRegistration).toEqual(mockRegistrations[0]);
      expect(component.showCancelDialog()).toBe(true);
    });

    it('should close cancel dialog when not cancelling', () => {
      component.cancelling.set(false);
      component.showCancelDialog.set(true);
      component.selectedRegistration = mockRegistrations[0];

      component.closeCancelDialog();

      expect(component.showCancelDialog()).toBe(false);
      expect(component.selectedRegistration).toBeNull();
    });

    it('should not close cancel dialog when cancelling', () => {
      component.cancelling.set(true);
      component.showCancelDialog.set(true);

      component.closeCancelDialog();

      expect(component.showCancelDialog()).toBe(true);
    });

    it('should cancel registration successfully', () => {
      component.selectedRegistration = mockRegistrations[0];
      registrationService.cancelRegistration.and.returnValue(of({} as any));

      component.confirmCancelRegistration();

      expect(component.cancelling()).toBe(false);
      expect(component.showCancelDialog()).toBe(false);
      expect(component.showCancelSuccessDialog()).toBe(true);
      expect(component.selectedRegistration).toBeNull();
      expect(registrationService.getMyRegistrations).toHaveBeenCalled();
    });

    it('should handle cancel registration error', () => {
      component.selectedRegistration = mockRegistrations[0];
      const error = new Error('Cancel failed');
      registrationService.cancelRegistration.and.returnValue(throwError(() => error));

      spyOn(console, 'error');
      spyOn(window, 'alert');

      component.confirmCancelRegistration();

      expect(component.cancelling()).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error cancelling registration:', error);
      expect(window.alert).toHaveBeenCalledWith('Failed to cancel registration. Please try again.');
    });

    it('should not cancel if no registration selected', () => {
      component.selectedRegistration = null;

      component.confirmCancelRegistration();

      expect(registrationService.cancelRegistration).not.toHaveBeenCalled();
    });

    it('should close cancel success dialog', () => {
      component.showCancelSuccessDialog.set(true);
      component.closeCancelSuccessDialog();
      expect(component.showCancelSuccessDialog()).toBe(false);
    });
  });

  describe('QR Code Modal', () => {
    beforeEach(() => {
      registrationService.getTicket.and.returnValue(of(mockTicketResponse));
      registrationService.generateTicket.and.returnValue(of(mockTicketResponse));
    });

    it('should open QR code modal with existing ticket', () => {
      component.openQRCodeModal(mockRegistrations[0]);

      expect(registrationService.getTicket).toHaveBeenCalledWith('ticket123');
      expect(component.selectedRegistration).toEqual(mockRegistrations[0]);
    });

    it('should generate new ticket if no ticket exists', () => {
      const regWithoutTicket = { ...mockRegistrations[0], ticketId: undefined };

      component.openQRCodeModal(regWithoutTicket);

      expect(registrationService.generateTicket).toHaveBeenCalledWith('reg1');
    });

    it('should handle get ticket error', () => {
      const error = new Error('Ticket fetch failed');
      registrationService.getTicket.and.returnValue(throwError(() => error));

      spyOn(console, 'error');
      spyOn(window, 'alert');

      component.openQRCodeModal(mockRegistrations[0]);

      expect(console.error).toHaveBeenCalledWith('Error fetching ticket:', error);
      expect(window.alert).toHaveBeenCalledWith('Failed to load ticket. Please try again.');
    });

    it('should handle generate ticket error', () => {
      const regWithoutTicket = { ...mockRegistrations[0], ticketId: undefined };
      const error = new Error('Generate failed');
      registrationService.generateTicket.and.returnValue(throwError(() => error));

      spyOn(console, 'error');
      spyOn(window, 'alert');

      component.openQRCodeModal(regWithoutTicket);

      expect(console.error).toHaveBeenCalledWith('Error generating ticket:', error);
      expect(window.alert).toHaveBeenCalledWith('Failed to generate ticket. Please try again.');
    });

    it('should close QR code modal', () => {
      component.showQRCodeModal.set(true);
      component.qrCodeData.set('test-data');
      component.selectedRegistration = mockRegistrations[0];

      component.closeQRCodeModal();

      expect(component.showQRCodeModal()).toBe(false);
      expect(component.qrCodeData()).toBe('');
      expect(component.selectedRegistration).toBeNull();
    });

    it('should download QR code', () => {
      component.selectedRegistration = mockRegistrations[0];

      const mockCanvas = document.createElement('canvas');
      spyOn(mockCanvas, 'toDataURL').and.returnValue('data:image/png;base64,test');
      spyOn(document, 'querySelector').and.returnValue(mockCanvas);

      const mockLink = jasmine.createSpyObj('a', ['click']);
      spyOn(document, 'createElement').and.returnValue(mockLink);

      component.downloadQRCode();

      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should not download QR code if no registration selected', () => {
      component.selectedRegistration = null;
      spyOn(document, 'querySelector');

      component.downloadQRCode();

      expect(document.querySelector).not.toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      component.totalPages.set(5);
      registrationService.getMyRegistrations.and.returnValue(of(mockRegistrationsResponse));
    });

    it('should go to specific page', () => {
      component.goToPage(2);

      expect(component.currentPage()).toBe(2);
      expect(registrationService.getMyRegistrations).toHaveBeenCalled();
    });

    it('should not go to invalid page', () => {
      component.currentPage.set(1);

      component.goToPage(-1);
      expect(component.currentPage()).toBe(1);

      component.goToPage(10);
      expect(component.currentPage()).toBe(1);
    });

    it('should go to next page', () => {
      component.currentPage.set(1);

      component.nextPage();

      expect(component.currentPage()).toBe(2);
    });

    it('should go to previous page', () => {
      component.currentPage.set(2);

      component.previousPage();

      expect(component.currentPage()).toBe(1);
    });
  });

  describe('Navigation', () => {
    it('should navigate to event detail', () => {
      component.viewEvent('123');
      expect(router.navigate).toHaveBeenCalledWith(['/events', '123']);
    });

    it('should navigate to home', () => {
      component.goToHome();
      expect(router.navigate).toHaveBeenCalledWith(['/events']);
    });

    it('should browse events', () => {
      component.browseEvents();
      expect(router.navigate).toHaveBeenCalledWith(['/events']);
    });

    it('should logout', () => {
      component.logout();
      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should complete full cancellation flow', () => {
      registrationService.getMyRegistrations.and.returnValue(of(mockRegistrationsResponse));
      registrationService.cancelRegistration.and.returnValue(of({} as any));

      fixture.detectChanges();

      expect(component.registrations()).toEqual(mockRegistrations);

      component.openCancelDialog(mockRegistrations[0]);
      expect(component.showCancelDialog()).toBe(true);

      component.confirmCancelRegistration();
      expect(component.showCancelSuccessDialog()).toBe(true);
      expect(component.showCancelDialog()).toBe(false);

      component.closeCancelSuccessDialog();
      expect(component.showCancelSuccessDialog()).toBe(false);
    });

    it('should complete full QR code flow', () => {
      registrationService.getMyRegistrations.and.returnValue(of(mockRegistrationsResponse));
      registrationService.getTicket.and.returnValue(of(mockTicketResponse));

      fixture.detectChanges();

      component.openQRCodeModal(mockRegistrations[0]);
      expect(component.qrCodeData()).toBe('mock-qr-code-data');
      expect(component.showQRCodeModal()).toBe(true);

      component.closeQRCodeModal();
      expect(component.showQRCodeModal()).toBe(false);
    });
  });
});
