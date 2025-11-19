import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, MatIcon],
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent {
  @Input() title: string = '';
  @Input() showBackButton: boolean = false;
  @Input() backButtonText: string = 'Back';
  @Input() showLogout: boolean = true;
  @Input() currentUser: any;

  @Output() back = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  onBack(): void {
    this.back.emit();
  }

  onLogout(): void {
    this.logout.emit();
  }
}
