import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
describe('authGuard', () => { let router: Router; const auth = { isLoggedIn: signal(false), isAuthenticated: () => auth.isLoggedIn() }; beforeEach(() => { TestBed.configureTestingModule({providers:[provideRouter([]),{provide:AuthService,useValue:auth}]}); router=TestBed.inject(Router); spyOn(router,'navigate'); }); it('allows authenticated users',()=>{ auth.isLoggedIn.set(true); expect(TestBed.runInInjectionContext(()=>authGuard({} as any,{url:'/admin'} as any))).toBeTrue(); }); it('redirects anonymous users with their return URL',()=>{ auth.isLoggedIn.set(false); expect(TestBed.runInInjectionContext(()=>authGuard({} as any,{url:'/admin'} as any))).toBeFalse(); expect(router.navigate).toHaveBeenCalledWith(['/login'],{queryParams:{returnUrl:'/admin'}}); }); });
