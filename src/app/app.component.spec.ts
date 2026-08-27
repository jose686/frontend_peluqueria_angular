import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { AppComponent } from './app.component';
import { AuthService } from './services/auth.service';

describe('AppComponent', () => {
  const authService = {
    logout: jasmine.createSpy('logout'),
    isLoggedIn: signal(false),
    isAdmin: signal(false),
    currentUserSignal: signal(null)
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService }
      ]
    }).compileComponents();
  });

  it('creates the application and renders its navigation', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('AURA');
  });

  it('delegates logout to AuthService', () => {
    const fixture = TestBed.createComponent(AppComponent);

    fixture.componentInstance.logout();

    expect(authService.logout).toHaveBeenCalled();
  });
});
