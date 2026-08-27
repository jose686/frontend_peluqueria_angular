import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BlogService } from './blog.service';

describe('BlogService', () => {
  let service: BlogService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(BlogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('includes the all flag when retrieving posts', () => {
    service.getAllBlogPosts(true).subscribe(posts => expect(posts).toEqual([]));

    const request = httpMock.expectOne('http://localhost:8080/api/v1/blog?all=true');
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('propagates forbidden API errors to the caller', () => {
    let receivedStatus: number | undefined;
    service.deleteBlogPost(7).subscribe({ error: error => receivedStatus = error.status });

    const request = httpMock.expectOne('http://localhost:8080/api/v1/blog/7');
    request.flush({ error: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

    expect(receivedStatus).toBe(403);
  });
});
