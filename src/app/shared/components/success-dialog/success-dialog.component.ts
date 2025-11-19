import { Component, EventEmitter, Input, Output, signal, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export type DialogType = 'success' | 'error' | 'warning' | 'info';

@Component({
  selector: 'app-success-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './success-dialog.component.html',
  styleUrls: ['./success-dialog.component.scss']
})
export class SuccessDialogComponent implements OnInit, OnChanges {
  @Input() show = signal<boolean>(false);
  @Input() title: string = 'Success!';
  @Input() message: string = 'Operation completed successfully.';
  @Input() buttonText: string = 'OK';
  @Input() autoClose: boolean = false;
  @Input() autoCloseDelay: number = 3000; // 3 seconds
  @Input() type: DialogType = 'success'; // Type of dialog

  @Output() closed = new EventEmitter<void>();

  private autoCloseTimeout?: number;

  ngOnInit(): void {
    this.handleAutoClose();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['show'] && this.show()) {
      this.handleAutoClose();
    }
  }

  private handleAutoClose(): void {
    if (this.autoCloseTimeout) {
      clearTimeout(this.autoCloseTimeout);
    }

    if (this.autoClose && this.show()) {
      this.autoCloseTimeout = window.setTimeout(() => {
        this.onClose();
      }, this.autoCloseDelay);
    }
  }

  onClose(): void {
    if (this.autoCloseTimeout) {
      clearTimeout(this.autoCloseTimeout);
    }
    this.closed.emit();
  }

  closeDialog(): void {
    this.onClose();
  }

  getIconSvg(): string {
    switch (this.type) {
      case 'success':
        return `<circle cx="32" cy="32" r="30" stroke="currentColor" stroke-width="4"/>
                <path d="M20 32L28 40L44 24" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
      case 'error':
        return `<circle cx="32" cy="32" r="30" stroke="currentColor" stroke-width="4"/>
                <path d="M24 24L40 40M40 24L24 40" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>`;
      case 'warning':
        return `<path d="M32 8L58 54H6L32 8Z" stroke="currentColor" stroke-width="4" stroke-linejoin="round" fill="none"/>
                <path d="M32 24V36M32 42V44" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>`;
      case 'info':
        return `<circle cx="32" cy="32" r="30" stroke="currentColor" stroke-width="4"/>
                <path d="M32 28V44M32 20V22" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>`;
      default:
        return '';
    }
  }

  ngOnDestroy(): void {
    if (this.autoCloseTimeout) {
      clearTimeout(this.autoCloseTimeout);
    }
  }
}
