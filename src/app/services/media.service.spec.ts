import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MediaService } from './media.service';

describe('MediaService', () => {
  let service: MediaService; let http: HttpTestingController;
  beforeEach(() => { TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }); service = TestBed.inject(MediaService); http = TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());
  it('maps relative media URLs to absolute backend URLs', () => {
    let files: any[] = []; service.getAllMedia().subscribe(value => files = value);
    http.expectOne('http://localhost:8080/api/media').flush([{ id: 1, filename: 'a.jpg', url: '/uploads/a.jpg' }]);
    expect(files[0].url).toBe('http://localhost:8080/uploads/a.jpg');
  });
  it('uploads a multipart file and can delete media', () => {
    service.uploadFile(new File(['a'], 'a.jpg'), 'cover').subscribe(); service.deleteMedia(1).subscribe();
    const upload = http.expectOne('http://localhost:8080/api/media/upload'); expect(upload.request.method).toBe('POST'); expect(upload.request.body.get('identificador')).toBe('cover'); upload.flush({ id: 1, filename: 'a.jpg', url: 'a.jpg' });
    const remove = http.expectOne('http://localhost:8080/api/media/1'); expect(remove.request.method).toBe('DELETE'); remove.flush({});
  });
  it('unpacks wrapped POST response data defensibly via normalizeMediaFile', () => {
    let result: any;
    service.uploadFile(new File(['a'], 'test.png')).subscribe(val => result = val);
    const req = http.expectOne('http://localhost:8080/api/media/upload');
    req.flush({ data: { id: 42, filename: 'test.png', url: '/uploads/test.png' } });
    expect(result.id).toBe(42);
    expect(result.filename).toBe('test.png');
    expect(result.url).toBe('http://localhost:8080/uploads/test.png');
  });
});
