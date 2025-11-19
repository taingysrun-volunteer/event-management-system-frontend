import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface DashboardSummary {
  totalEvents: number;
  totalUsers: number;
  totalCategories: number;
}

@Injectable({
  providedIn: 'root'
})
export class SummaryService {
  constructor(private apiService: ApiService) {}

  getDashboardSummary(): Observable<DashboardSummary> {
    return this.apiService.get<DashboardSummary>('/summary');
  }
}
