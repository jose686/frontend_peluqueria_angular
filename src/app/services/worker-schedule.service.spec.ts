import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { WorkerScheduleService } from './worker-schedule.service';
import { environment } from '../../environments/environment';

describe('WorkerScheduleService', () => {
  let service: WorkerScheduleService; let http: HttpTestingController;
  beforeEach(() => { TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }); service = TestBed.inject(WorkerScheduleService); http = TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());
  it('gets and saves shifts for a worker', () => {
    service.getShiftsByWorker('w1').subscribe(); service.saveShift('w1', { fecha: '2026-08-24' } as any).subscribe();
    const get = http.expectOne(req => req.url === `${environment.apiUrl}/admin/shifts/worker/w1` && req.method === 'GET'); expect(get.request.method).toBe('GET'); get.flush([]);
    const save = http.expectOne(req => req.url === `${environment.apiUrl}/admin/shifts/worker/w1` && req.method === 'POST'); save.flush({});
  });
  it('builds copy and week URLs with their query values', () => {
    service.getShiftsByWeek('2026-08-24').subscribe(); service.copyWeek('2026-08-24', '2026-08-31').subscribe(); service.copyWorkerShifts('a', 'b', '2026-08-24', '2026-08-30').subscribe();
    http.expectOne(`${environment.apiUrl}/admin/shifts/week?startDate=2026-08-24`).flush([]);
    const week = http.expectOne(`${environment.apiUrl}/admin/shifts/copy-week?fromStart=2026-08-24&toStart=2026-08-31`); expect(week.request.method).toBe('POST'); week.flush({});
    const workers = http.expectOne(`${environment.apiUrl}/admin/shifts/copy-worker-shifts?fromWorkerId=a&toWorkerId=b&startDate=2026-08-24&endDate=2026-08-30`); expect(workers.request.method).toBe('POST'); workers.flush({});
  });
});
