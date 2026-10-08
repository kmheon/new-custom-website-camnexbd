import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit3, Trash2, Check, X, Image as ImageIcon, Calendar, Tag, RefreshCw } from 'lucide-react';
import { Button, Modal, Badge, Alert } from '../common/UI';
import { MediaPickerModal } from './MediaLibraryModal';
import { cmsService } from '../../services';
import { BlogPost } from '../../types';

export const BlogCmsModule: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const data = await cmsService.getBlogPosts();
      setPosts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load blog posts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreateNew = () => {
    setEditingPost({
      id: `post-${Date.now()}`,
      title: '',
      slug: '',
      author: 'CamneX Security Team',
      publishedAt: new Date().toISOString(),
      excerpt: '',
      content: '',
      featuredImage: '/images/hero/hikvision-bullet.png',
      tags: ['CCTV', 'Security Guide'],
      readTime: '4 min read'
    });
    setModalOpen(true);
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost({ ...post });
    setModalOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete blog article "${title}"?`)) {
      return;
    }
    try {
      await cmsService.deleteBlogPost(id);
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete post');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost || !editingPost.title?.trim()) {
      setError('Article title is required.');
      return;
    }
    const slug = editingPost.slug?.trim() || editingPost.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    setIsSaving(true);
    setError(null);
    try {
      const saved = await cmsService.saveBlogPost({
        ...editingPost,
        slug,
        title: editingPost.title.trim(),
        author: editingPost.author?.trim() || 'CamneX Security Team',
        publishedAt: editingPost.publishedAt || new Date().toISOString(),
        excerpt: editingPost.excerpt || '',
        content: editingPost.content || '',
        featuredImage: editingPost.featuredImage || '/images/hero/hikvision-bullet.png',
        tags: editingPost.tags || [],
        readTime: editingPost.readTime || '4 min read'
      } as BlogPost);

      setPosts(prev => {
        const idx = prev.findIndex(p => p.id === saved.id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [saved, ...prev];
      });

      setModalOpen(false);
      setEditingPost(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save blog post');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#F15A24]" />
            <span>Articles & Technical Blog</span>
          </h2>
          <p className="text-xs text-slate-400">
            Publish technical surveillance guides, networking setup tutorials, and product spotlights.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" onClick={handleCreateNew} className="bg-[#F15A24] text-white hover:bg-[#D94D1C]">
            <Plus className="w-4 h-4 mr-1.5" />
            <span>+ New Article</span>
          </Button>

          <Button variant="outline" size="sm" onClick={fetchPosts} disabled={isLoading}>
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Blog Articles Table */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-900/60 text-slate-400 font-bold uppercase">
            <tr>
              <th className="p-3.5">Article</th>
              <th className="p-3.5">Slug / URL</th>
              <th className="p-3.5">Author</th>
              <th className="p-3.5">Published Date</th>
              <th className="p-3.5">Tags</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {posts.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  {isLoading ? 'Loading articles...' : 'No blog articles published yet. Click "+ New Article" to write one.'}
                </td>
              </tr>
            ) : (
              posts.map(post => (
                <tr key={post.id} className="hover:bg-slate-900/40 transition">
                  <td className="p-3.5">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={post.featuredImage}
                        alt=""
                        className="w-8 h-8 rounded object-cover bg-slate-800 flex-shrink-0"
                      />
                      <div>
                        <div className="font-bold text-white line-clamp-1">{post.title}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{post.excerpt}</div>
                      </div>
                    </div>
                  </td>

                  <td className="p-3.5 font-mono text-slate-400 text-[11px]">
                    /blog/{post.slug}
                  </td>

                  <td className="p-3.5 text-slate-300">{post.author}</td>

                  <td className="p-3.5 text-slate-400 text-[11px]">
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </td>

                  <td className="p-3.5">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {(post.tags || []).slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="p-3.5 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(post)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(post.id, post.title)}
                      className="text-xs text-rose-400 hover:text-rose-300 ml-2"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ARTICLE EDITOR MODAL */}
      {modalOpen && editingPost && (
        <Modal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingPost(null);
          }}
          title={editingPost.id ? 'Edit Blog Article' : 'Write New Article'}
          maxWidth="max-w-3xl"
        >
          <form onSubmit={handleSave} className="space-y-4 text-slate-900 max-h-[82vh] overflow-y-auto pr-1">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center justify-between">
                <span>{error}</span>
                <button type="button" onClick={() => setError(null)}><X className="w-4 h-4" /></button>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Article Title *</label>
              <input
                type="text"
                value={editingPost.title || ''}
                onChange={e => setEditingPost({
                  ...editingPost,
                  title: e.target.value,
                  slug: editingPost.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                })}
                placeholder="e.g. How to Choose the Right IP CCTV System for Dhaka Commercial Buildings"
                className="w-full bg-white border border-slate-300 text-xs p-2.5 rounded-lg font-bold"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">URL Slug *</label>
                <input
                  type="text"
                  value={editingPost.slug || ''}
                  onChange={e => setEditingPost({ ...editingPost, slug: e.target.value })}
                  placeholder="e.g. choose-ip-cctv-dhaka"
                  className="w-full bg-white border border-slate-300 text-xs p-2 rounded font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Author</label>
                <input
                  type="text"
                  value={editingPost.author || ''}
                  onChange={e => setEditingPost({ ...editingPost, author: e.target.value })}
                  placeholder="CamneX Security Team"
                  className="w-full bg-white border border-slate-300 text-xs p-2 rounded"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Read Time</label>
                <input
                  type="text"
                  value={editingPost.readTime || '4 min read'}
                  onChange={e => setEditingPost({ ...editingPost, readTime: e.target.value })}
                  placeholder="e.g. 5 min read"
                  className="w-full bg-white border border-slate-300 text-xs p-2 rounded"
                />
              </div>
            </div>

            {/* Featured Image with Media Picker */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Featured Cover Image</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editingPost.featuredImage || ''}
                  onChange={e => setEditingPost({ ...editingPost, featuredImage: e.target.value })}
                  placeholder="/images/hero/... or /uploads/..."
                  className="flex-1 bg-white border border-slate-300 text-xs p-2 rounded font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMediaPickerOpen(true)}
                >
                  <ImageIcon className="w-3.5 h-3.5 mr-1" />
                  <span>Media Library</span>
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Excerpt / Summary</label>
              <textarea
                rows={2}
                value={editingPost.excerpt || ''}
                onChange={e => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                placeholder="Brief summary appearing on article cards and search snippets..."
                className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Article Content (Markdown / HTML)</label>
              <textarea
                rows={8}
                value={editingPost.content || ''}
                onChange={e => setEditingPost({ ...editingPost, content: e.target.value })}
                placeholder="Full article content in markdown or clean HTML format..."
                className="w-full bg-white border border-slate-300 text-xs p-2.5 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={(editingPost.tags || []).join(', ')}
                onChange={e => setEditingPost({
                  ...editingPost,
                  tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                placeholder="CCTV, Dhaka Security, Hikvision, IP Cameras"
                className="w-full bg-white border border-slate-300 text-xs p-2 rounded"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setModalOpen(false);
                  setEditingPost(null);
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-[#F15A24] text-white hover:bg-[#D94D1C]">
                <Check className="w-4 h-4 mr-1.5" />
                <span>{isSaving ? 'Saving Article...' : 'Publish / Save Article'}</span>
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Media Picker Sub-modal */}
      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={url => setEditingPost(prev => prev ? ({ ...prev, featuredImage: url }) : null)}
      />
    </div>
  );
};

