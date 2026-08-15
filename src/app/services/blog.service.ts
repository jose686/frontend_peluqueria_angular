import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BlogPost, BlogPostRequest } from '../models/blog.model';

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/blog';

  getAllBlogPosts(all = false): Observable<BlogPost[]> {
    const params = new HttpParams().set('all', all.toString());
    return this.http.get<BlogPost[]>(this.apiUrl, { params });
  }

  getBlogPostById(id: number): Observable<BlogPost> {
    return this.http.get<BlogPost>(`${this.apiUrl}/${id}`);
  }

  getBlogPostBySlug(slug: string): Observable<BlogPost> {
    return this.http.get<BlogPost>(`${this.apiUrl}/slug/${slug}`);
  }

  createBlogPost(post: BlogPostRequest): Observable<BlogPost> {
    return this.http.post<BlogPost>(this.apiUrl, post);
  }

  updateBlogPost(id: number, post: BlogPostRequest): Observable<BlogPost> {
    return this.http.put<BlogPost>(`${this.apiUrl}/${id}`, post);
  }

  deleteBlogPost(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
